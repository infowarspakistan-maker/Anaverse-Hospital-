import React, { useState } from 'react';
import {
  FlaskConical,
  CloudUpload,
  CheckCircle2,
  Pill,
  BedDouble,
  Webhook,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Plus,
  Download,
  Copy,
  Play,
  ArrowRight,
  FileCode2,
  ShieldCheck,
  Lock,
  Key,
} from 'lucide-react';
import {
  AnalyteResult,
  Bed,
  DiagnosticService,
  Doctor,
  Encounter,
  LabOrder,
  MedicalDocument,
  Patient,
  PharmacyItem,
  Prescription,
} from '../../types/erp.ts';
import {
  buildClinicalPdfBlob,
  uploadMedicalDocumentToDriveVault,
} from '../../lib/firebase.ts';
import { buildAnaverseN8nWorkflowJson } from '../../services/n8nWorkflowTemplate.ts';

const STRONG_WEBHOOK_SECRET = 'sec_568b32a400f1ee74346d1689c8671defaf22bb390dfa3f4372f41de1da9cb16e';
const PERMANENT_CALLBACK_URL =
  'https://ais-pre-fv3tz6ipkywht2ycuojxtb-321126968390.europe-west1.run.app/api/webhooks/n8n/callback';
const TUNNEL_DEV_CALLBACK_URL =
  'https://adelaide-proc-source-talented.trycloudflare.com/api/webhooks/n8n/callback';

interface LabAndPharmacyPortalProps {
  labOrders: LabOrder[];
  diagnosticServices: DiagnosticService[];
  medicalDocuments: MedicalDocument[];
  prescriptions: Prescription[];
  pharmacyInventory: PharmacyItem[];
  beds: Bed[];
  patients: Patient[];
  encounters: Encounter[];
  doctors: Doctor[];
  accessToken: string | null;
  onGoogleLogin: () => Promise<string | null>;
  onRefresh: () => Promise<void>;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export const LabAndPharmacyPortal: React.FC<LabAndPharmacyPortalProps> = ({
  labOrders,
  diagnosticServices,
  medicalDocuments,
  prescriptions,
  pharmacyInventory,
  beds,
  patients,
  encounters,
  doctors,
  accessToken,
  onGoogleLogin,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'LIS_VAULT' | 'N8N_WORKFLOW' | 'PHARMACY' | 'IPD_BEDS'
  >('LIS_VAULT');
  const [selectedLabId, setSelectedLabId] = useState<string>(
    labOrders[1]?.id || labOrders[0]?.id || ''
  );

  const selectedLab =
    labOrders.find((l) => l.id === selectedLabId) || labOrders[0];
  const selectedPatient = patients.find((p) => p.id === selectedLab?.patientId) || patients[0];
  const selectedEncounter =
    encounters.find((e) => e.id === selectedLab?.encounterId) || encounters[0];
  const selectedService =
    diagnosticServices.find((s) => s.id === selectedLab?.serviceId) || diagnosticServices[0];

  const [editableResults, setEditableResults] = useState<Record<string, AnalyteResult>>(
    selectedLab?.resultData || {}
  );
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    selectedLab?.clinicalNotes || ''
  );
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState<string>(
    'https://hospitalerp.app.n8n.cloud/webhook/lab-report-finalized'
  );
  const [selectedCallbackUrl, setSelectedCallbackUrl] = useState<string>(
    TUNNEL_DEV_CALLBACK_URL
  );
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [newAnalyteName, setNewAnalyteName] = useState<string>('');
  const [newAnalyteValue, setNewAnalyteValue] = useState<string>('');
  const [newAnalyteUnit, setNewAnalyteUnit] = useState<string>('mg/dL');
  const [newAnalyteRef, setNewAnalyteRef] = useState<string>('< 200');
  const [newAnalyteFlag, setNewAnalyteFlag] = useState<AnalyteResult['flag']>('NORMAL');

  const [uploadingVault, setUploadingVault] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<MedicalDocument | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [simulatingCallback, setSimulatingCallback] = useState<boolean>(false);

  const workflowJsonObject = buildAnaverseN8nWorkflowJson(
    selectedCallbackUrl.replace(/\/api\/webhooks\/n8n\/callback$/, '') || PERMANENT_CALLBACK_URL.replace(/\/api\/webhooks\/n8n\/callback$/, '')
  );
  const workflowJsonString = JSON.stringify(workflowJsonObject, null, 2);

  const handleCopyWorkflowJson = async () => {
    await navigator.clipboard.writeText(workflowJsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(STRONG_WEBHOOK_SECRET);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  const handleDownloadWorkflowJson = () => {
    const blob = new Blob([workflowJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anaverse-hospital-erp-n8n-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSimulateN8nCallback = async () => {
    if (!selectedPatient) return;
    setSimulatingCallback(true);
    setStatusBanner(null);
    try {
      const simulatedDriveId = `1n8nVault_${Date.now().toString(36)}`;
      const fileName = `N8N_AUTO_${selectedService?.code || 'LAB'}_${
        selectedEncounter?.encounterNumber || 'ENC88319'
      }.pdf`.replace(/-/g, '_');

      const res = await fetch('/api/webhooks/n8n/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-n8n-webhook-secret': STRONG_WEBHOOK_SECRET,
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          encounterId: selectedEncounter?.id,
          labOrderId: selectedLab?.id,
          uhid: selectedPatient.uhid,
          fileName,
          mimeType: 'application/pdf',
          fileSizeBytes: 284120,
          gdriveFileId: simulatedDriveId,
          gdriveWebViewLink: `https://drive.google.com/file/d/${simulatedDriveId}/view?usp=drivesdk`,
          documentType:
            selectedService?.category === 'Radiology' ? 'RADIOLOGY_IMAGE' : 'LAB_REPORT',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'n8n callback failed');
      await onRefresh();
      setStatusBanner(
        `n8n Callback (/api/webhooks/n8n/callback) succeeded! Document ${fileName} (Drive ID: ${simulatedDriveId}) recorded in PostgreSQL medical_documents.`
      );
    } catch (err: any) {
      setStatusBanner(`Notice: ${err.message}`);
    } finally {
      setSimulatingCallback(false);
    }
  };

  const handleSelectLabOrder = (lo: LabOrder) => {
    setSelectedLabId(lo.id);
    setEditableResults(lo.resultData || {});
    setClinicalNotes(lo.clinicalNotes || '');
  };

  const handleAddAnalyte = () => {
    if (!newAnalyteName.trim() || !newAnalyteValue.trim()) return;
    setEditableResults((prev) => ({
      ...prev,
      [newAnalyteName.trim()]: {
        value: isNaN(Number(newAnalyteValue)) ? newAnalyteValue : Number(newAnalyteValue),
        unit: newAnalyteUnit,
        flag: newAnalyteFlag,
        ref: newAnalyteRef,
      },
    }));
    setNewAnalyteName('');
    setNewAnalyteValue('');
  };

  const handleFinalizeAndUploadToDrive = async (useRealGoogleDrive: boolean) => {
    if (!selectedLab || !selectedPatient) return;
    setUploadingVault(true);
    setStatusBanner(null);

    try {
      // 1. Build Clinical PDF Buffer first so we can send raw Base64 PDF buffer to n8n webhook
      const docRecord =
        doctors.find((d) => d.id === selectedEncounter?.doctorId) || doctors[0];
      const resultLines = Object.entries(editableResults).map(
        ([k, v]) => `${k}: ${v.value} ${v.unit} [${v.flag}] (Ref: ${v.ref})`
      );
      resultLines.push(`Clinical Interpretation: ${clinicalNotes}`);

      const pdfFileName = `${selectedService?.code || 'LAB_REPORT'}_${
        selectedEncounter?.encounterNumber || 'ENC88319'
      }.pdf`.replace(/-/g, '_');

      const pdfBlob = buildClinicalPdfBlob({
        title: `${selectedService?.name || 'Clinical Pathology Report'} (${selectedLab.barcode})`,
        uhid: selectedPatient.uhid,
        patientName: selectedPatient.fullName,
        encounterNumber: selectedEncounter?.encounterNumber || 'ENC-88319',
        department: selectedService?.category || 'Pathology',
        doctorName: docRecord?.fullName || 'Dr. Andika Pratama',
        lines: resultLines,
      });

      const pdfBase64 = await blobToBase64(pdfBlob);

      // 2. Verify Lab Order & Trigger n8n Webhook on Backend (with pdfBase64 + UHID + callbackUrl)
      const verifyRes = await fetch(`/api/labs/${selectedLab.id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultData: editableResults,
          clinicalNotes,
          orderStatus: 'VERIFIED',
          webhookUrl: n8nWebhookUrl,
          callbackUrl: selectedCallbackUrl,
          uhid: selectedPatient.uhid,
          patientId: selectedPatient.id,
          encounterId: selectedEncounter?.id,
          encounterNumber: selectedEncounter?.encounterNumber || 'ENC-88319',
          department: selectedService?.category || 'Pathology',
          fileName: pdfFileName,
          fileSizeBytes: pdfBlob.size,
          pdfBase64,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Failed to verify lab order');

      let gdriveFileId = verifyData.syncedDocument?.gdriveFileId || `gdrive_${Date.now()}`;
      let gdriveWebViewLink =
        verifyData.syncedDocument?.gdriveWebViewLink ||
        `https://drive.google.com/file/d/${gdriveFileId}/view`;
      let folderHierarchyNote = `HOSPITAL_ERP_VAULT / ${
        selectedService?.category || 'Pathology'
      } / ${selectedPatient.uhid} / ${selectedEncounter?.encounterNumber || 'ENC-88319'}`;

      // 3. If user requested real Google Drive OAuth upload, authenticate & upload via Drive API v3
      if (useRealGoogleDrive) {
        let token = accessToken;
        if (!token) {
          token = await onGoogleLogin();
        }
        if (token) {
          const uploaded = await uploadMedicalDocumentToDriveVault({
            blob: pdfBlob,
            fileName: pdfFileName,
            uhid: selectedPatient.uhid,
            encounterNumber: selectedEncounter?.encounterNumber || 'ENC-88319',
            department: selectedService?.category || 'Pathology',
            accessToken: token,
          });
          gdriveFileId = uploaded.fileId;
          gdriveWebViewLink = uploaded.webViewLink;
          folderHierarchyNote = uploaded.folderPath;
        }
      }

      // 4. Persist Google Drive Mirror Record in PostgreSQL medical_documents (if not already synced by n8n response)
      if (!verifyData.syncedDocument || useRealGoogleDrive) {
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: selectedPatient.id,
            encounterId: selectedEncounter?.id,
            labOrderId: selectedLab.id,
            fileName: pdfFileName,
            mimeType: 'application/pdf',
            fileSizeBytes: pdfBlob.size,
            gdriveFileId,
            gdriveWebViewLink,
            documentType:
              selectedService?.category === 'Radiology' ? 'RADIOLOGY_IMAGE' : 'LAB_REPORT',
          }),
        });
      }

      await onRefresh();
      setStatusBanner(
        `Report ${pdfFileName} verified, dispatched to n8n (${verifyData.webhookDispatchStatus}), and archived to [${folderHierarchyNote}].`
      );
    } catch (err: any) {
      setStatusBanner(`Notice: ${err.message}`);
    } finally {
      setUploadingVault(false);
    }
  };

  const handleConfirmDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      if (accessToken && !docToDelete.gdriveFileId.startsWith('1aB2cD')) {
        await fetch(
          `https://www.googleapis.com/drive/v3/files/${docToDelete.gdriveFileId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        ).catch(() => {});
      }

      await fetch(`/api/documents/${docToDelete.id}`, {
        method: 'DELETE',
      });
      setDocToDelete(null);
      await onRefresh();
      setStatusBanner(`Document ${docToDelete.fileName} permanently removed from the Vault.`);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDispensePrescription = async (rx: Prescription) => {
    const matchedInventory = pharmacyInventory.find((item) =>
      rx.medicationName.toLowerCase().includes(item.genericName.toLowerCase().split(' ')[0])
    );

    await fetch(`/api/prescriptions/${rx.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'DISPENSED',
        inventorySku: matchedInventory?.sku,
      }),
    });
    await onRefresh();
    setStatusBanner(
      `Medication ${rx.medicationName} (${rx.quantity} Tabs) dispensed to patient & batch stock deducted.`
    );
  };

  const handleUpdateBedStatus = async (
    bed: Bed,
    nextStatus: Bed['status'],
    patientId?: string | null
  ) => {
    await fetch(`/api/beds/${bed.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: nextStatus,
        patientId: nextStatus === 'OCCUPIED' ? patientId || patients[0]?.id : null,
        nursingNotes:
          nextStatus === 'OCCUPIED'
            ? 'Patient admitted to inpatient ward (ADT Admission). Vitals observation every 4 hours.'
            : nextStatus === 'CLEANING'
            ? 'Patient discharged. UV room sterilization cycle in progress.'
            : 'Room sterilized and ready for new inpatient admission.',
      }),
    });
    await onRefresh();
    setStatusBanner(`Bed ${bed.bedNumber} status updated to ${nextStatus}.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Sub-navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600">
            Diagnostic LIS, n8n Automation, Google Drive Vault, Pharmacy & IPD Bed Management
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Clinical Support Services & n8n Workflow Automation
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('LIS_VAULT')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              activeSubTab === 'LIS_VAULT'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laboratory (LIS) & Drive Vault
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('N8N_WORKFLOW')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'N8N_WORKFLOW'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>n8n Workflow Blueprint & JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('PHARMACY')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              activeSubTab === 'PHARMACY'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pharmacy & Inventory (eRx)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('IPD_BEDS')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              activeSubTab === 'IPD_BEDS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inpatient Wards (IPD Bed Map)
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            {statusBanner}
          </span>
          <button onClick={() => setStatusBanner(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: LABORATORY INFORMATION SYSTEM (LIS) & GOOGLE DRIVE VAULT */}
      {activeSubTab === 'LIS_VAULT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Lab Orders Queue */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              <span>Specimen Queue & Lab Orders</span>
            </h2>
            <div className="space-y-3">
              {labOrders.map((lo) => {
                const pt = patients.find((p) => p.id === lo.patientId);
                const svc = diagnosticServices.find((s) => s.id === lo.serviceId);
                const active = lo.id === selectedLab?.id;
                return (
                  <button
                    type="button"
                    key={lo.id}
                    onClick={() => handleSelectLabOrder(lo)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      active
                        ? 'border-blue-600 bg-blue-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="font-bold text-blue-600">{lo.barcode}</span>
                      <span
                        className={`font-bold ${
                          lo.orderStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {lo.orderStatus}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {svc?.code} — {svc?.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                      {pt?.fullName} · {pt?.uhid}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Analyzer Result Entry + n8n Webhook + Google Drive Vault Upload */}
          <div className="lg:col-span-8 space-y-6">
            {selectedLab && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
                  <div>
                    <div className="text-xs font-mono tabular-nums text-blue-600 font-bold">
                      Barcode: {selectedLab.barcode} · Patient: {selectedPatient?.fullName} (
                      {selectedPatient?.uhid})
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {selectedService?.name}
                    </h3>
                  </div>

                  {/* Google Drive OAuth Connection Status */}
                  {!accessToken ? (
                    <button
                      type="button"
                      onClick={onGoogleLogin}
                      className="gsi-material-button"
                    >
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            style={{ display: 'block' }}
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">
                          Sign in with Google Drive
                        </span>
                      </div>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      ✓ Google Drive Vault Connected
                    </span>
                  )}
                </div>

                {/* Analyzer Quantitative Result Editor */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Analyzer Quantitative Output Editor (JSONB Result Payload)
                  </div>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    {Object.entries(editableResults).map(([param, val]) => (
                      <div
                        key={param}
                        className="p-3 bg-white flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <span className="font-bold text-slate-900 min-w-[140px]">{param}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={val.value}
                            onChange={(e) =>
                              setEditableResults((prev) => ({
                                ...prev,
                                [param]: {
                                  ...prev[param],
                                  value: isNaN(Number(e.target.value))
                                    ? e.target.value
                                    : Number(e.target.value),
                                },
                              }))
                            }
                            className="w-24 px-2.5 py-1 rounded border border-slate-200 font-mono tabular-nums font-bold text-right"
                          />
                          <span className="text-slate-500 font-mono w-16">{val.unit}</span>
                          <select
                            value={val.flag}
                            onChange={(e) =>
                              setEditableResults((prev) => ({
                                ...prev,
                                [param]: {
                                  ...prev[param],
                                  flag: e.target.value as any,
                                },
                              }))
                            }
                            className="px-2 py-1 rounded border border-slate-200 font-mono font-bold text-[11px] bg-slate-50"
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="HIGH">HIGH</option>
                            <option value="BORDERLINE">BORDERLINE</option>
                            <option value="LOW">LOW</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Ref: {val.ref}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Analyte Parameter Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Parameter (e.g. HbA1c)"
                      value={newAnalyteName}
                      onChange={(e) => setNewAnalyteName(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 5.6)"
                      value={newAnalyteValue}
                      onChange={(e) => setNewAnalyteValue(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Unit (%)"
                      value={newAnalyteUnit}
                      onChange={(e) => setNewAnalyteUnit(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Ref Range (< 5.7)"
                      value={newAnalyteRef}
                      onChange={(e) => setNewAnalyteRef(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddAnalyte}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Clinical Pathologist Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                {/* Step 5: n8n Webhook & Google Drive Folder Hierarchy Automation */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Webhook className="w-4 h-4 text-blue-600" />
                      <span>n8n Webhook Automation & Drive Vault Sync</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      HOSPITAL_ERP_VAULT / {selectedService?.category} / {selectedPatient?.uhid} /{' '}
                      {selectedEncounter?.encounterNumber || 'ENC-88319'}
                    </span>
                  </div>

                  {/* n8n Webhook URL */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      1. n8n Production Webhook URL (Receives Base64 PDF Buffer & Patient UHID)
                    </label>
                    <input
                      type="url"
                      value={n8nWebhookUrl}
                      onChange={(e) => setN8nWebhookUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-900"
                    />
                  </div>

                  {/* ERP Callback URL & Presets */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="block text-[11px] font-semibold text-slate-700">
                        2. Permanent ERP Callback URL (Sent in payload to Node 5 in n8n)
                      </label>
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedCallbackUrl(PERMANENT_CALLBACK_URL)}
                          className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            selectedCallbackUrl === PERMANENT_CALLBACK_URL
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Permanent (Cloud Run)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCallbackUrl(TUNNEL_DEV_CALLBACK_URL)}
                          className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            selectedCallbackUrl === TUNNEL_DEV_CALLBACK_URL
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Dev Tunnel
                        </button>
                      </div>
                    </div>
                    <input
                      type="url"
                      value={selectedCallbackUrl}
                      onChange={(e) => setSelectedCallbackUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-900"
                    />
                  </div>

                  {/* Webhook Header Authentication Secret */}
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Shared Webhook Header Authentication Secret</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Header: x-n8n-webhook-secret
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-[11px] font-mono text-slate-800 truncate select-all">
                        {STRONG_WEBHOOK_SECRET}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedSecret ? 'Copied!' : 'Copy Secret'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-blue-800/80 leading-relaxed">
                      Use this high-entropy secret for <strong>Header Auth</strong> on the n8n Webhook trigger and inside the Custom Auth credential for the ERP callback node.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      disabled={uploadingVault}
                      onClick={() => handleFinalizeAndUploadToDrive(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CloudUpload className="w-4 h-4" />
                      <span>
                        {uploadingVault
                          ? 'Uploading PDF to Google Drive...'
                          : 'Verify & Upload PDF to My Google Drive'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={uploadingVault}
                      onClick={() => handleFinalizeAndUploadToDrive(false)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Quick Verify & Trigger n8n Webhook</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Google Drive Medical Document Mirror Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Medical Document Mirror Table (PostgreSQL medical_documents)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2.5">PDF File Name</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5 text-right">Size</th>
                      <th className="py-2.5">Google Drive File ID</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {medicalDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-3 font-sans font-bold text-slate-900">{doc.fileName}</td>
                        <td className="py-3 text-slate-600">{doc.documentType}</td>
                        <td className="py-3 text-right text-slate-600">
                          {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3 text-slate-500 truncate max-w-[160px]">
                          {doc.gdriveFileId}
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <a
                            href={doc.gdriveWebViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-sans font-semibold text-blue-600 hover:underline"
                          >
                            <span>webViewLink</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1B: N8N WORKFLOW BLUEPRINT, JSON EXPORT & CALLBACK TESTER */}
      {activeSubTab === 'N8N_WORKFLOW' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="text-xs font-mono font-bold text-blue-600">
                  STEP 5 ARCHITECTURE · N8N + GOOGLE DRIVE API V3 + POSTGRESQL CALLBACK
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  n8n Automation Workflow: Lab Report PDF Archiving & Cloud SQL Sync
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                  Download the workflow JSON file below and import it directly into your n8n
                  instance (<span className="font-mono font-semibold">Workflows → Import from File</span>).
                  All 5 nodes are pre-configured with this application&apos;s live callback endpoint.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadWorkflowJson}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Workflow (.json)</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyWorkflowJson}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedJson ? '✓ JSON Copied!' : 'Copy Workflow JSON'}</span>
                </button>
                <button
                  type="button"
                  disabled={simulatingCallback}
                  onClick={handleSimulateN8nCallback}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {simulatingCallback
                      ? 'Pinging Callback...'
                      : 'Test n8n Callback → PostgreSQL'}
                  </span>
                </button>
              </div>
            </div>

            {/* 5-Node Visual Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                {
                  step: 'Node 1',
                  title: 'Webhook Trigger',
                  type: 'n8n-nodes-base.webhook',
                  detail: 'POST /webhook/lab-report-finalized receives pdfBase64 + UHID from the app.',
                },
                {
                  step: 'Node 2',
                  title: 'Decode Base64 PDF',
                  type: 'n8n-nodes-base.code',
                  detail: 'Converts pdfBase64 string into a binary PDF buffer & prepares folder path.',
                },
                {
                  step: 'Node 3',
                  title: 'Drive Folder Hierarchy',
                  type: 'n8n-nodes-base.googleDrive',
                  detail: 'Creates [Department] / [UHID] / [Encounter] folder via Service Account.',
                },
                {
                  step: 'Node 4',
                  title: 'Google Drive Upload',
                  type: 'n8n-nodes-base.googleDrive',
                  detail: 'Uploads binary PDF & returns gdriveFileId and webViewLink.',
                },
                {
                  step: 'Node 5',
                  title: 'HTTP Callback ERP',
                  type: 'n8n-nodes-base.httpRequest',
                  detail: 'POSTs back to /api/webhooks/n8n/callback to persist the Drive link in PostgreSQL.',
                },
              ].map((node, index) => (
                <div
                  key={node.step}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-blue-600">
                      <span>{node.step}</span>
                      {index < 4 && <ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">{node.title}</div>
                    <div className="text-[11px] font-mono text-slate-500">{node.type}</div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{node.detail}</p>
                </div>
              ))}
            </div>

            {/* Step-by-step Implementation Guide & JSON Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Step-by-Step Implementation Guide
                </h3>
                <ol className="space-y-3 text-xs text-slate-700">
                  <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">
                      1. Import JSON File into n8n
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Click <strong>Download Workflow (.json)</strong> above. Open your n8n
                      dashboard, select <strong>Workflows → Import from File</strong>, and upload
                      the JSON file.
                    </p>
                  </li>
                  <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">
                      2. Connect Google Drive Service Account Credentials
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Open <strong>Node 3</strong> and <strong>Node 4</strong> in n8n. Select your{' '}
                      <em>Google Service Account API</em> credential (using{' '}
                      <span className="font-mono">client_email</span> and{' '}
                      <span className="font-mono">private_key</span> from Google Cloud IAM). Share
                      your master <span className="font-mono">HOSPITAL_ERP_VAULT</span> folder in
                      Google Drive with that Service Account email.
                    </p>
                  </li>
                  <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">
                      3. Enable Header Auth on Node 1 (Webhook Trigger)
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      In n8n Node 1, set <strong>Authentication</strong> to <em>Header Auth</em>.
                      Set Header Name to <span className="font-mono text-blue-700">x-n8n-webhook-secret</span> and value to{' '}
                      <span className="font-mono font-bold text-slate-800 break-all">{STRONG_WEBHOOK_SECRET}</span>.
                      The ERP sends this matching secret automatically on every lab dispatch.
                    </p>
                  </li>
                  <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">
                      4. Custom Auth Credential on Node 5 (ERP Callback)
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      In n8n Node 5, set the credential header to{' '}
                      <span className="font-mono text-blue-700">x-n8n-webhook-secret</span> with the same secret value.
                      Node 5 will securely POST the Google Drive ID and webViewLink back to the ERP.
                    </p>
                  </li>
                  <li className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-900">
                      5. Stable Permanent Callback URL
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      The ERP sends the permanent Cloud Run endpoint by default:
                      <br />
                      <span className="font-mono text-blue-700 break-all">{PERMANENT_CALLBACK_URL}</span>
                    </p>
                  </li>
                </ol>
              </div>

              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-blue-600" />
                    <span>anaverse-hospital-erp-n8n-workflow.json (Ready to Import)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    GET /api/webhooks/n8n/workflow
                  </span>
                </div>
                <pre className="flex-1 p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[460px] border border-slate-800">
                  {workflowJsonString}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHARMACY & FORMULARY INVENTORY */}
      {activeSubTab === 'PHARMACY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Electronic Prescription Queue (eRx Dispensing)</span>
            </h2>
            <div className="space-y-3">
              {prescriptions.map((rx) => {
                const pt = patients.find((p) => p.id === rx.patientId);
                return (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        {pt?.fullName} ({pt?.uhid})
                      </span>
                      <span className="font-mono tabular-nums font-bold text-blue-600">
                        {rx.status}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {rx.medicationName}
                    </div>
                    <div className="text-xs text-slate-600">
                      {rx.dosage} · {rx.frequency} · Qty: {rx.quantity} Tablets
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDispensePrescription(rx)}
                        disabled={rx.status === 'DISPENSED'}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                      >
                        {rx.status === 'DISPENSED'
                          ? '✓ Dispensed'
                          : 'Dispense & Deduct Batch Stock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Master Formulary Inventory & Batch Tracking
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2.5">SKU / Medication Name</th>
                    <th className="py-2.5">Batch No.</th>
                    <th className="py-2.5">Expiry Date</th>
                    <th className="py-2.5 text-right">Stock</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {pharmacyInventory.map((item) => {
                    const lowStock = item.stockQuantity <= item.reorderLevel;
                    return (
                      <tr key={item.id}>
                        <td className="py-3 font-sans">
                          <div className="font-bold text-slate-900">{item.drugName}</div>
                          <div className="text-[11px] text-slate-500">
                            {item.sku} · {item.category}
                          </div>
                        </td>
                        <td className="py-3 text-slate-700">{item.batchNumber}</td>
                        <td className="py-3 text-slate-700">{item.expiryDate}</td>
                        <td
                          className={`py-3 text-right font-bold ${
                            lowStock ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {item.stockQuantity} {lowStock ? '(REORDER!)' : ''}
                        </td>
                        <td className="py-3 text-right text-slate-900 font-semibold">
                          IDR {Number(item.unitPrice).toLocaleString('en-US')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IPD & BED MANAGEMENT VISUALIZER */}
      {activeSubTab === 'IPD_BEDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-blue-600" />
                <span>Inpatient Ward Visualizer (IPD & ADT Workflows)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time Admission, Discharge, and Transfer (ADT) management across ICU, VIP Suites, and Inpatient Wards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beds.map((bed) => {
              const occupant = patients.find((p) => p.id === bed.patientId);
              return (
                <div
                  key={bed.id}
                  className={`p-5 rounded-2xl border space-y-3 ${
                    bed.status === 'OCCUPIED'
                      ? 'bg-blue-50/40 border-blue-300'
                      : bed.status === 'AVAILABLE'
                      ? 'bg-white border-slate-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold font-mono tabular-nums text-slate-900">
                      {bed.bedNumber}
                    </span>
                    <span
                      className={`text-xs font-mono tabular-nums font-bold ${
                        bed.status === 'OCCUPIED'
                          ? 'text-blue-600'
                          : bed.status === 'AVAILABLE'
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">{bed.wardName}</div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums">
                      Floor {bed.floorNumber} · {bed.wardType} · IDR{' '}
                      {Number(bed.dailyRate).toLocaleString('en-US')}/day
                    </div>
                  </div>

                  {occupant ? (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{occupant.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {occupant.uhid} · Blood {occupant.bloodGroup}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      Unoccupied (Ready for Admission)
                    </div>
                  )}

                  <p className="text-xs text-slate-600">{bed.nursingNotes}</p>

                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    {bed.status !== 'OCCUPIED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateBedStatus(bed, 'OCCUPIED', patients[0]?.id)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        Admit Patient
                      </button>
                    )}
                    {bed.status === 'OCCUPIED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateBedStatus(bed, 'CLEANING', null)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                      >
                        Discharge Patient
                      </button>
                    )}
                    {bed.status === 'CLEANING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateBedStatus(bed, 'AVAILABLE', null)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        Complete Sterilization
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Dialog Before Deleting Document Record */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-extrabold text-slate-900">
                Confirm Medical Document Deletion
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">{docToDelete.fileName}</strong> (File ID:{' '}
              <span className="font-mono">{docToDelete.gdriveFileId}</span>) from the Medical
              Document Vault? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDocument}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Yes, Delete Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
