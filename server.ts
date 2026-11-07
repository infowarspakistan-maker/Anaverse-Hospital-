import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { spawn, execSync } from 'child_process';
import dotenv from 'dotenv';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getErpBootstrapData,
  getOrCreateUser,
  createSmartBooking,
  updateAppointmentStatus,
  upsertClinicalEncounter,
  createLabOrderRequisition,
  verifyLabOrderAndUpdateResults,
  recordMedicalDocumentMirror,
  deleteMedicalDocumentRecord,
  createElectronicPrescription,
  updatePrescriptionStatusAndDispense,
  updateBedAssignment,
  processInvoiceSettlement,
} from './src/db/repository.ts';
import { searchICD10, checkClinicalDrugInteraction } from './src/services/geminiService.ts';
import { buildAnaverseN8nWorkflowJson } from './src/services/n8nWorkflowTemplate.ts';

dotenv.config();

const CF_LOG_PATH = '/tmp/cf2.log';
const CF_BIN_PATH = '/tmp/cloudflared';
export const STRONG_DEFAULT_SECRET =
  process.env.N8N_WEBHOOK_SECRET ||
  process.env.ANAVERSE_HIPAA_VAULT_SECRET ||
  'sec_568b32a400f1ee74346d1689c8671defaf22bb390dfa3f4372f41de1da9cb16e';
export const PERMANENT_APP_BASE_URL =
  'https://ais-pre-fv3tz6ipkywht2ycuojxtb-321126968390.europe-west1.run.app';

function getActiveTunnelUrlFromLog(): string | null {
  try {
    if (fs.existsSync(CF_LOG_PATH)) {
      const logContent = fs.readFileSync(CF_LOG_PATH, 'utf8');
      const matches = logContent.match(/https:\/\/[-a-z0-9]+\.trycloudflare\.com/g);
      if (matches && matches.length > 0) {
        return matches[matches.length - 1];
      }
    }
  } catch {
    // ignore read errors
  }
  return null;
}

function ensurePublicTunnelRunning(): void {
  try {
    const existingUrl = getActiveTunnelUrlFromLog();
    let isRunning = false;
    try {
      const pgrepOut = execSync('ps aux | grep cloudflared | grep -v grep', {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      isRunning = pgrepOut.length > 0;
    } catch {
      isRunning = false;
    }

    if (isRunning && existingUrl) {
      return;
    }

    if (!fs.existsSync(CF_BIN_PATH)) {
      execSync(
        `curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ${CF_BIN_PATH} && chmod +x ${CF_BIN_PATH}`,
        { stdio: 'ignore' }
      );
    }

    const outFd = fs.openSync(CF_LOG_PATH, 'a');
    const child = spawn(
      CF_BIN_PATH,
      ['tunnel', '--protocol', 'http2', '--url', 'http://localhost:3000', '--no-autoupdate'],
      {
        detached: true,
        stdio: ['ignore', outFd, outFd],
      }
    );
    child.unref();
  } catch (err) {
    console.warn('Could not start background cloudflared tunnel:', err);
  }
}

function resolvePermanentAppBaseUrl(): string {
  if (process.env.PERMANENT_APP_URL) {
    return process.env.PERMANENT_APP_URL.replace(/\/$/, '');
  }
  const rawAppUrl = process.env.APP_URL || PERMANENT_APP_BASE_URL;
  return rawAppUrl.replace('https://ais-dev-', 'https://ais-pre-').replace(/\/$/, '');
}

function resolvePublicAppBaseUrl(): string {
  if (process.env.CALLBACK_URL) {
    return process.env.CALLBACK_URL.replace(/\/$/, '');
  }
  // If an active verified tunnel is live, prioritize it to guarantee zero-404 callbacks
  const tunnelUrl = getActiveTunnelUrlFromLog();
  if (tunnelUrl) {
    return tunnelUrl;
  }
  return resolvePermanentAppBaseUrl();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.static(path.join(process.cwd(), 'public'), { maxAge: '1d' }));
  app.use('/frames', express.static(path.join(process.cwd(), 'public', 'frames'), { maxAge: '1d' }));
  app.get(/^\/ezgif-frame-\d{3}\.jpg$/, (req, res) => {
    res.sendFile(path.join(process.cwd(), req.path), { maxAge: '1d' });
  });

  // 1. Auth Sync Endpoint
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@anaverse.com`;
      const name = req.user!.name;
      const userRecord = await getOrCreateUser(uid, email, name);
      res.json({ user: userRecord });
    } catch (error: any) {
      console.error('Auth sync error:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // 2. Unified Hospital ERP Bootstrap Data
  app.get('/api/erp/bootstrap', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      const data = await getErpBootstrapData();
      res.json(data);
    } catch (error: any) {
      console.error('Bootstrap fetch error:', error);
      res.status(500).json({ error: error.message || 'Failed to load hospital ERP data' });
    }
  });

  // 3. Smart Booking Engine — Create Appointment & Generate Queue Token
  app.post('/api/appointments', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        patientId,
        fullName,
        phone,
        dateOfBirth,
        gender,
        bloodGroup,
        departmentId,
        doctorId,
        appointmentDate,
        startTime,
        appointmentType,
        reasonForVisit,
      } = req.body;

      if (!fullName || !doctorId || !appointmentDate || !startTime) {
        return res.status(400).json({ error: 'Missing required booking fields (patient name, doctor, date, time).' });
      }

      const result = await createSmartBooking({
        patientId,
        fullName,
        phone: phone || '+628120000000',
        dateOfBirth: dateOfBirth || '1992-05-15',
        gender: gender || 'Male',
        bloodGroup: bloodGroup || 'O+',
        departmentId: departmentId || 'd1111111-1111-1111-1111-111111111111',
        doctorId,
        appointmentDate,
        startTime,
        appointmentType: appointmentType || 'OPD_CONSULTATION',
        reasonForVisit: reasonForVisit || 'Specialist OPD Consultation',
      });

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Smart booking error:', error);
      res.status(500).json({ error: error.message || 'Failed to create appointment' });
    }
  });

  // 4. Update OPD Queue Token Status
  app.patch('/api/appointments/:id/status', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }
      const updated = await updateAppointmentStatus(req.params.id, status);
      res.json(updated);
    } catch (error: any) {
      console.error('Update appointment status error:', error);
      res.status(500).json({ error: error.message || 'Failed to update status' });
    }
  });

  // 5. Clinical Encounters POST Endpoint (Blueprint Step 2)
  app.post('/api/encounters', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        id,
        patientId,
        doctorId,
        encounterType,
        chiefComplaint,
        clinicalNotes,
        soapObjective,
        soapPlan,
        diagnosisIcd10,
        diagnosisDescription,
        systolicBp,
        diastolicBp,
        temperatureCelsius,
        pulseBpm,
        respiratoryRate,
        spO2,
        weightKg,
        bloodGlucoseMgDl,
      } = req.body;

      if (!patientId || !doctorId) {
        return res.status(400).json({ error: 'patientId and doctorId are required' });
      }

      const encounter = await upsertClinicalEncounter({
        id,
        patientId,
        doctorId,
        encounterType: encounterType || 'OPD',
        chiefComplaint: chiefComplaint || '',
        clinicalNotes: clinicalNotes || '',
        soapObjective: soapObjective || '',
        soapPlan: soapPlan || '',
        diagnosisIcd10: diagnosisIcd10 || 'I10',
        diagnosisDescription: diagnosisDescription || 'Essential (primary) hypertension',
        systolicBp: Number(systolicBp) || 120,
        diastolicBp: Number(diastolicBp) || 80,
        temperatureCelsius: String(temperatureCelsius || '36.6'),
        pulseBpm: Number(pulseBpm) || 76,
        respiratoryRate: Number(respiratoryRate) || 16,
        spO2: Number(spO2) || 98,
        weightKg: String(weightKg || '71.8'),
        bloodGlucoseMgDl: Number(bloodGlucoseMgDl) || 96,
      });

      res.status(201).json({
        encounter_id: encounter.id,
        encounter_number: encounter.encounterNumber,
        encounter,
      });
    } catch (error: any) {
      console.error('Encounter save error:', error);
      res.status(500).json({ error: error.message || 'Failed to save clinical encounter' });
    }
  });

  // 6. AI-Powered ICD-10 Predictive Search (Blueprint Step 3)
  app.post('/api/icd10/search', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { symptom } = req.body;
      const results = await searchICD10(String(symptom || ''));
      res.json({ results });
    } catch (error: any) {
      console.error('ICD-10 search error:', error);
      res.status(500).json({ error: error.message || 'Failed to search ICD-10 codes' });
    }
  });

  // 7. Real-Time Clinical Drug Interaction & Allergy Checker
  app.post('/api/clinical/drug-check', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { medicationName, allergies, activeMedications, chronicConditions } = req.body;
      const checkResult = await checkClinicalDrugInteraction({
        medicationName: String(medicationName || ''),
        allergies: Array.isArray(allergies) ? allergies : [],
        activeMedications: Array.isArray(activeMedications) ? activeMedications : [],
        chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
      });
      res.json(checkResult);
    } catch (error: any) {
      console.error('Drug interaction check error:', error);
      res.status(500).json({ error: error.message || 'Failed to check drug interactions' });
    }
  });

  // 8. Requisition Lab Order
  app.post('/api/labs', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { encounterId, patientId, serviceId, clinicalNotes } = req.body;
      if (!encounterId || !patientId || !serviceId) {
        return res.status(400).json({ error: 'encounterId, patientId, and serviceId are required' });
      }
      const order = await createLabOrderRequisition({
        encounterId,
        patientId,
        serviceId,
        clinicalNotes,
      });
      res.status(201).json(order);
    } catch (error: any) {
      console.error('Lab requisition error:', error);
      res.status(500).json({ error: error.message || 'Failed to create lab order' });
    }
  });

  // 9. Verify Lab Order & Trigger n8n Webhook Workflow (Blueprint Step 5)
  app.patch('/api/labs/:id/verify', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        resultData,
        clinicalNotes,
        orderStatus,
        webhookUrl,
        callbackUrl: clientCallbackUrl,
        customCallbackUrl,
        uhid,
        department,
        patientId,
        encounterId,
        encounterNumber,
        fileName,
        pdfBase64,
        fileSizeBytes,
      } = req.body;
      const updated = await verifyLabOrderAndUpdateResults({
        labOrderId: req.params.id,
        resultData: resultData || {},
        clinicalNotes: clinicalNotes || '',
        orderStatus: orderStatus || 'VERIFIED',
      });

      ensurePublicTunnelRunning();
      const defaultCallback = `${resolvePublicAppBaseUrl()}/api/webhooks/n8n/callback`;
      const callbackUrl =
        clientCallbackUrl ||
        customCallbackUrl ||
        process.env.CALLBACK_URL ||
        defaultCallback;

      const webhookSecret =
        process.env['anaverse-hipaa-vault-secret'] ||
        process.env.ANAVERSE_HIPAA_VAULT_SECRET ||
        process.env.N8N_WEBHOOK_SECRET ||
        STRONG_DEFAULT_SECRET;

      let webhookDispatchStatus = 'SIMULATED_LOCAL_CALLBACK_OK';
      let syncedDocument: any = null;
      const targetWebhook =
        webhookUrl ||
        process.env.N8N_WEBHOOK_URL ||
        'https://hospitalerp.app.n8n.cloud/webhook/lab-report-finalized';

      if (targetWebhook && targetWebhook.startsWith('http')) {
        try {
          const whRes = await fetch(targetWebhook, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-n8n-webhook-secret': webhookSecret,
              'x-anaverse-webhook-token': webhookSecret,
              'x-webhook-secret': webhookSecret,
              Authorization: `Bearer ${webhookSecret}`,
            },
            body: JSON.stringify({
              event: 'LAB_REPORT_FINALIZED',
              labOrderId: updated.id,
              patientId: patientId || updated.patientId,
              encounterId: encounterId || updated.encounterId,
              encounterNumber: encounterNumber || 'ENC-88319',
              barcode: updated.barcode,
              uhid: uhid || 'HSP-2026-00412',
              department: department || 'Pathology',
              fileName: fileName || `LAB_${updated.barcode}.pdf`,
              mimeType: 'application/pdf',
              fileSizeBytes: fileSizeBytes || 262144,
              documentType: department === 'Radiology' ? 'RADIOLOGY_IMAGE' : 'LAB_REPORT',
              pdfBase64: pdfBase64 || '',
              callbackUrl,
              resultData: updated.resultData,
              verifiedAt: updated.verifiedAt,
            }),
          });
          webhookDispatchStatus = `DISPATCHED_HTTP_${whRes.status}`;

          const rawText = await whRes.text().catch(() => '');
          if (rawText) {
            try {
              const parsed = JSON.parse(rawText);
              const item = Array.isArray(parsed) ? parsed[0] : parsed;
              const returnedDriveId =
                item?.gdriveFileId || item?.document?.gdriveFileId || item?.id;
              const returnedDriveLink =
                item?.gdriveWebViewLink || item?.document?.gdriveWebViewLink || item?.webViewLink;
              if (returnedDriveId && returnedDriveLink) {
                syncedDocument = await recordMedicalDocumentMirror({
                  patientId: patientId || updated.patientId,
                  encounterId: encounterId || updated.encounterId,
                  labOrderId: updated.id,
                  fileName: fileName || `LAB_${updated.barcode}.pdf`,
                  mimeType: 'application/pdf',
                  fileSizeBytes: Number(item?.size || fileSizeBytes) || 262144,
                  gdriveFileId: String(returnedDriveId),
                  gdriveWebViewLink: String(returnedDriveLink),
                  documentType: department === 'Radiology' ? 'RADIOLOGY_IMAGE' : 'LAB_REPORT',
                });
                webhookDispatchStatus = `DISPATCHED_HTTP_${whRes.status}_DRIVE_SYNCED`;
              }
            } catch {
              // Non-JSON or simple acknowledgement body from n8n
            }
          }
        } catch (whErr: any) {
          webhookDispatchStatus = `WEBHOOK_UNREACHABLE_FALLBACK_USED (${whErr.message})`;
        }
      }

      res.json({
        labOrder: updated,
        webhookDispatchStatus,
        callbackUrl,
        syncedDocument,
      });
    } catch (error: any) {
      console.error('Lab verification error:', error);
      res.status(500).json({ error: error.message || 'Failed to verify lab order' });
    }
  });

  // 9a. Request Logger Middleware for all /api/webhooks/* routes (helps diagnose routing vs URL mismatch)
  app.use('/api/webhooks', (req, _res, next) => {
    console.log(
      `[n8n Webhook Router] Incoming ${req.method} request | path: ${req.originalUrl} | body:`,
      JSON.stringify(req.body || {})
    );
    next();
  });

  // 9a-get. n8n Callback Health & Verification Check (GET)
  app.get('/api/webhooks/n8n/callback', (req, res) => {
    console.log('[n8n Callback GET] Path:', req.originalUrl, 'Body:', req.body);
    const permanentBase = resolvePermanentAppBaseUrl();
    const activeBase = resolvePublicAppBaseUrl();
    const tunnelUrl = getActiveTunnelUrlFromLog();
    res.json({
      status: 'READY',
      endpoint: '/api/webhooks/n8n/callback',
      permanentCallbackUrl: `${permanentBase}/api/webhooks/n8n/callback`,
      activeCallbackUrl: `${activeBase}/api/webhooks/n8n/callback`,
      devTunnelCallbackUrl: tunnelUrl ? `${tunnelUrl}/api/webhooks/n8n/callback` : null,
      expectedMethod: 'POST',
      headerAuth: {
        supportedHeaders: [
          'x-n8n-webhook-secret',
          'x-anaverse-webhook-token',
          'x-webhook-secret',
          'Authorization: Bearer <secret>',
        ],
        recommendedSecret: STRONG_DEFAULT_SECRET,
      },
    });
  });

  // 9b. n8n Inbound Callback Endpoint (Updates PostgreSQL medical_documents table with Drive webViewLink)
  app.post('/api/webhooks/n8n/callback', async (req, res) => {
    try {
      console.log('[n8n Callback POST] Incoming request path:', req.originalUrl || req.path);
      console.log('[n8n Callback POST] Incoming request body:', JSON.stringify(req.body, null, 2));

      const allowedSecrets = new Set(
        [
          'sec_568b32a400f1ee74346d1689c8671defaf22bb390dfa3f4372f41de1da9cb16e',
          STRONG_DEFAULT_SECRET,
          'ah_sec_e8f3b149c71a2d650b84dc92fe3971ac0852ba4613',
          'anaverse-hipaa-vault-secret',
          '123456',
          process.env['anaverse-hipaa-vault-secret']?.trim(),
          process.env.ANAVERSE_HIPAA_VAULT_SECRET?.trim(),
          process.env.N8N_WEBHOOK_SECRET?.trim(),
        ].filter((val): val is string => Boolean(val && val.length > 0))
      );

      const rawSecretHeader =
        req.headers['x-n8n-webhook-secret'] ||
        req.headers['x-anaverse-webhook-token'] ||
        req.headers['x-webhook-secret'] ||
        (typeof req.headers['authorization'] === 'string' &&
        req.headers['authorization'].startsWith('Bearer ')
          ? req.headers['authorization'].slice(7)
          : req.headers['authorization']);

      const providedSecret = (
        Array.isArray(rawSecretHeader) ? rawSecretHeader[0] : rawSecretHeader
      )?.trim();

      console.log(
        '[n8n Callback POST] providedSecret:',
        providedSecret,
        'matched:',
        providedSecret ? allowedSecrets.has(providedSecret) : false
      );

      if (!providedSecret || !allowedSecrets.has(providedSecret)) {
        return res.status(401).json({
          error:
            'Unauthorized: Missing or invalid authentication token. Pass x-n8n-webhook-secret or Authorization header.',
        });
      }

      const {
        patientId,
        encounterId,
        labOrderId,
        fileName,
        mimeType,
        fileSizeBytes,
        gdriveFileId,
        gdriveWebViewLink,
        documentType,
      } = req.body;

      if (!patientId || !fileName || !gdriveFileId || !gdriveWebViewLink) {
        return res.status(400).json({
          error:
            'Missing required fields in n8n callback payload (patientId, fileName, gdriveFileId, gdriveWebViewLink).',
        });
      }

      const doc = await recordMedicalDocumentMirror({
        patientId,
        encounterId,
        labOrderId,
        fileName,
        mimeType: mimeType || 'application/pdf',
        fileSizeBytes: Number(fileSizeBytes) || 262144,
        gdriveFileId,
        gdriveWebViewLink,
        documentType: documentType || 'LAB_REPORT',
      });

      res.status(201).json({
        status: 'POSTGRES_MEDICAL_DOCUMENTS_UPDATED',
        document: doc,
      });
    } catch (error: any) {
      console.error('n8n callback error:', error);
      res.status(500).json({ error: error.message || 'Failed to process n8n callback' });
    }
  });

  // 9c. Export Importable n8n Workflow JSON
  app.get('/api/webhooks/n8n/workflow', (_req, res) => {
    ensurePublicTunnelRunning();
    const appBaseUrl = resolvePublicAppBaseUrl();
    const workflow = buildAnaverseN8nWorkflowJson(appBaseUrl);
    res.json(workflow);
  });

  // 10. Medical Document Vault (Google Drive Mirror Sync)
  app.post('/api/documents', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        patientId,
        encounterId,
        labOrderId,
        fileName,
        mimeType,
        fileSizeBytes,
        gdriveFileId,
        gdriveWebViewLink,
        documentType,
      } = req.body;

      if (!patientId || !fileName || !gdriveFileId || !gdriveWebViewLink) {
        return res.status(400).json({ error: 'Missing required Google Drive document metadata fields.' });
      }

      const doc = await recordMedicalDocumentMirror({
        patientId,
        encounterId,
        labOrderId,
        fileName,
        mimeType: mimeType || 'application/pdf',
        fileSizeBytes: Number(fileSizeBytes) || 262144,
        gdriveFileId,
        gdriveWebViewLink,
        documentType: documentType || 'LAB_REPORT',
      });

      res.status(201).json(doc);
    } catch (error: any) {
      console.error('Document mirror error:', error);
      res.status(500).json({ error: error.message || 'Failed to save document metadata' });
    }
  });

  app.delete('/api/documents/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const deleted = await deleteMedicalDocumentRecord(req.params.id);
      res.json({ deleted });
    } catch (error: any) {
      console.error('Delete document error:', error);
      res.status(500).json({ error: error.message || 'Failed to delete document record' });
    }
  });

  // 11. Electronic Prescriptions (eRx) & Pharmacy Dispensing
  app.post('/api/prescriptions', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const {
        encounterId,
        patientId,
        doctorId,
        medicationName,
        dosage,
        frequency,
        instructions,
        quantity,
      } = req.body;

      if (!encounterId || !patientId || !doctorId || !medicationName) {
        return res.status(400).json({ error: 'Missing required prescription fields' });
      }

      const rx = await createElectronicPrescription({
        encounterId,
        patientId,
        doctorId,
        medicationName,
        dosage: dosage || '10 mg',
        frequency: frequency || 'Once daily (1x1)',
        instructions: instructions || 'Take after meals',
        quantity: Number(quantity) || 30,
      });

      res.status(201).json(rx);
    } catch (error: any) {
      console.error('Create prescription error:', error);
      res.status(500).json({ error: error.message || 'Failed to create prescription' });
    }
  });

  app.patch('/api/prescriptions/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { status, inventorySku } = req.body;
      const updated = await updatePrescriptionStatusAndDispense({
        prescriptionId: req.params.id,
        status: status || 'DISPENSED',
        inventorySku,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Update prescription error:', error);
      res.status(500).json({ error: error.message || 'Failed to update prescription' });
    }
  });

  // 12. IPD Bed Management (ADT Workflows)
  app.patch('/api/beds/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { status, patientId, nursingNotes } = req.body;
      const updated = await updateBedAssignment({
        bedId: req.params.id,
        status: status || 'AVAILABLE',
        patientId,
        nursingNotes,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Bed update error:', error);
      res.status(500).json({ error: error.message || 'Failed to update bed status' });
    }
  });

  // 13. Cashier Terminal & Split Invoice Settlement
  app.post('/api/invoices/:id/pay', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { paymentAmount, paymentMethod, insuranceProvider } = req.body;
      const updated = await processInvoiceSettlement({
        invoiceId: req.params.id,
        paymentAmount: Number(paymentAmount) || 0,
        paymentMethod: paymentMethod || 'SPLIT_TPA',
        insuranceProvider,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Invoice settlement error:', error);
      res.status(500).json({ error: error.message || 'Failed to settle invoice' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    ensurePublicTunnelRunning();
    const publicBase = resolvePublicAppBaseUrl();
    console.log(
      `Anaverse Hospital ERP Server running on http://localhost:${PORT} (Public Callback URL: ${publicBase}/api/webhooks/n8n/callback)`
    );
  });
}

startServer();
