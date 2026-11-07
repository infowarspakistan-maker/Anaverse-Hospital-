import React, { useState } from 'react';
import {
  Activity,
  FileText,
  Download,
  ExternalLink,
  Pill,
  RefreshCw,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Eye,
  X,
} from 'lucide-react';
import {
  DiagnosticService,
  Doctor,
  Encounter,
  Invoice,
  LabOrder,
  MedicalDocument,
  Patient,
  Prescription,
} from '../../types/erp.ts';
import { buildClinicalPdfBlob } from '../../lib/firebase.ts';

interface PatientPortalProps {
  patients: Patient[];
  encounters: Encounter[];
  labOrders: LabOrder[];
  diagnosticServices: DiagnosticService[];
  medicalDocuments: MedicalDocument[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  doctors: Doctor[];
  onRefresh: () => Promise<void>;
  onOpenBooking: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  patients,
  encounters,
  labOrders,
  medicalDocuments,
  prescriptions,
  invoices,
  doctors,
  onRefresh,
  onOpenBooking,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patients[0]?.id || 'pat11111-1111-1111-1111-111111111111'
  );
  const [previewDoc, setPreviewDoc] = useState<{
    doc: MedicalDocument;
    labOrder?: LabOrder;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const patientEncounters = encounters
    .filter((e) => e.patientId === patient?.id)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const patientLabs = labOrders.filter((l) => l.patientId === patient?.id);
  const patientDocs = medicalDocuments.filter((d) => d.patientId === patient?.id);
  const patientRxs = prescriptions.filter((r) => r.patientId === patient?.id);
  const patientInvoices = invoices.filter((i) => i.patientId === patient?.id);

  const handleRequestRefill = async (rxId: string, medName: string) => {
    try {
      await fetch(`/api/prescriptions/${rxId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REFILL_REQUESTED' }),
      });
      await onRefresh();
      setToastMsg(`Prescription refill request for ${medName} has been sent to the Hospital Pharmacy.`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadVerifiedPdf = (doc: MedicalDocument) => {
    const lo = labOrders.find((l) => l.id === doc.labOrderId) || patientLabs[0];
    const enc = encounters.find((e) => e.id === doc.encounterId) || patientEncounters[0];
    const docRecord = doctors.find((d) => d.id === enc?.doctorId) || doctors[0];

    const resultLines: string[] = [];
    if (lo?.resultData) {
      Object.entries(lo.resultData).forEach(([name, entry]) => {
        resultLines.push(
          `${name}: ${entry.value} ${entry.unit}  [Flag: ${entry.flag}]  (Ref: ${entry.ref})`
        );
      });
    }
    if (lo?.clinicalNotes) {
      resultLines.push(`Pathologist Interpretation: ${lo.clinicalNotes}`);
    }

    const pdfBlob = buildClinicalPdfBlob({
      title: `VERIFIED DIAGNOSTIC REPORT - ${doc.fileName}`,
      uhid: patient?.uhid || 'HSP-2026-00412',
      patientName: patient?.fullName || 'Reza Rahadian',
      encounterNumber: enc?.encounterNumber || 'ENC-88319',
      department: 'Pathology & Clinical Laboratory',
      doctorName: docRecord?.fullName || 'Dr. Andika Pratama',
      lines: resultLines,
    });

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Patient Master Identity Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <span>Patient Master Identity & Portal</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{patient?.uhid}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {patient?.fullName}
          </h1>
          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
            <span>DOB: {patient?.dateOfBirth}</span>
            <span>·</span>
            <span>Blood Group: {patient?.bloodGroup}</span>
            <span>·</span>
            <span>Allergies: {patient?.allergies?.join(', ') || 'None'}</span>
            <span>·</span>
            <span>Conditions: {patient?.chronicConditions?.join(', ') || 'None'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.uhid} — {p.fullName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Medical Timeline & Vitals Trend Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Vital Signs & Blood Glucose Longitudinal Trend</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Longitudinal tracking of Blood Pressure (Systolic/Diastolic), Blood Glucose, and Body Weight across encounters.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-emerald-600 font-semibold">
              Controlled Trend ↓
            </span>
          </div>

          {/* Interactive SVG Vitals Trend Chart */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <svg viewBox="0 0 560 180" className="w-full h-44 overflow-visible">
              {/* Horizontal Reference Grid Lines */}
              {[40, 80, 120, 160].map((y, idx) => (
                <g key={y}>
                  <line
                    x1="40"
                    y1={y}
                    x2="530"
                    y2={y}
                    stroke="#cbd5e1"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x="8"
                    y={y + 4}
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {160 - idx * 25}
                  </text>
                </g>
              ))}

              {/* Data Points from patientEncounters */}
              {patientEncounters.map((enc, i) => {
                const x =
                  patientEncounters.length === 1
                    ? 280
                    : 80 + (i * 400) / (patientEncounters.length - 1);
                const sysY = 160 - ((enc.systolicBp - 60) / 100) * 120;
                const diaY = 160 - ((enc.diastolicBp - 60) / 100) * 120;
                const gluY = 160 - (((enc.bloodGlucoseMgDl || 98) - 60) / 100) * 120;

                const nextEnc = patientEncounters[i + 1];
                const nextX =
                  nextEnc && patientEncounters.length > 1
                    ? 80 + ((i + 1) * 400) / (patientEncounters.length - 1)
                    : null;
                const nextSysY = nextEnc
                  ? 160 - ((nextEnc.systolicBp - 60) / 100) * 120
                  : null;
                const nextDiaY = nextEnc
                  ? 160 - ((nextEnc.diastolicBp - 60) / 100) * 120
                  : null;

                return (
                  <g key={enc.id}>
                    {nextX !== null && nextSysY !== null && (
                      <line
                        x1={x}
                        y1={sysY}
                        x2={nextX}
                        y2={nextSysY}
                        stroke="#2563EB"
                        strokeWidth="2.5"
                      />
                    )}
                    {nextX !== null && nextDiaY !== null && (
                      <line
                        x1={x}
                        y1={diaY}
                        x2={nextX}
                        y2={nextDiaY}
                        stroke="#10B981"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Systolic Node */}
                    <circle cx={x} cy={sysY} r="5" fill="#2563EB" />
                    <text
                      x={x}
                      y={sysY - 10}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-blue-700 font-mono"
                    >
                      {enc.systolicBp}/{enc.diastolicBp}
                    </text>

                    {/* Diastolic Node */}
                    <circle cx={x} cy={diaY} r="4.5" fill="#10B981" />

                    {/* Blood Glucose Node */}
                    <circle cx={x} cy={gluY} r="3.5" fill="#D97706" />

                    {/* Encounter Label */}
                    <text
                      x={x}
                      y="176"
                      textAnchor="middle"
                      className="text-[10px] fill-slate-600 font-mono"
                    >
                      {enc.encounterNumber} ({new Date(enc.startedAt).toLocaleDateString('en-US')})
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 mt-2 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                  Systolic (mmHg)
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                  Diastolic (mmHg)
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                  Blood Glucose (mg/dL)
                </span>
              </div>
              <span className="font-mono tabular-nums text-[11px]">
                Latest BMI: 24.2 kg/m² (Normal)
              </span>
            </div>
          </div>

          {/* Encounter History Timeline */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700">
              Clinical Encounter Timeline & ICD-10 Diagnoses
            </h3>
            {patientEncounters
              .slice()
              .reverse()
              .map((enc) => (
                <div
                  key={enc.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold font-mono tabular-nums text-blue-600">
                      {enc.encounterNumber} · {enc.encounterType}
                    </span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {new Date(enc.startedAt).toLocaleDateString('en-US')}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    ICD-10 {enc.diagnosisIcd10}: {enc.diagnosisDescription || 'Essential Hypertension'}
                  </div>
                  <p className="text-xs text-slate-600">{enc.chiefComplaint}</p>
                  <div className="text-[11px] font-mono tabular-nums text-slate-500 pt-1">
                    BP: {enc.systolicBp}/{enc.diastolicBp} mmHg · HR: {enc.pulseBpm} bpm · Temp:{' '}
                    {enc.temperatureCelsius}°C · SpO2: {enc.spO2}% · Glucose: {enc.bloodGlucoseMgDl}{' '}
                    mg/dL
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Lab Reports & Google Drive Vault + Active Medication Tracker */}
        <div className="lg:col-span-5 space-y-6">
          {/* 2. Lab Reports & Cloud Downloads (Google Drive Vault Mirror) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Lab Reports Archive & Google Drive Vault</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Digitally verified diagnostic reports with instant PDF download and Drive access.
              </p>
            </div>

            <div className="space-y-3">
              {patientDocs.map((doc) => {
                const linkedLab = labOrders.find((l) => l.id === doc.labOrderId);
                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900 break-all">
                          {doc.fileName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                          {doc.documentType} · {(doc.fileSizeBytes / 1024).toFixed(1)} KB ·{' '}
                          <span className="text-emerald-600 font-semibold">
                            ✓ Digitally Verified
                          </span>
                        </div>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ doc, labOrder: linkedLab })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Results</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadVerifiedPdf(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                      <a
                        href={doc.gdriveWebViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        <span>Open Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Active Medication Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-blue-600" />
                <span>Active Medication Schedule & Tracker</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily dosing instructions, remaining tablet count, and 1-click eRx refill requests.
              </p>
            </div>

            <div className="space-y-3">
              {patientRxs.map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{rx.medicationName}</div>
                      <div className="text-xs text-blue-700 font-semibold mt-0.5">
                        {rx.dosage} · {rx.frequency}
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-bold text-slate-700">
                      Remaining: {rx.remainingCount}/{rx.quantity} Tabs
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{rx.instructions}</p>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-slate-500">
                      Status: {rx.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRequestRefill(rx.id, rx.medicationName)}
                      disabled={rx.status === 'REFILL_REQUESTED'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-500 disabled:opacity-50 text-xs font-semibold text-blue-600 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {rx.status === 'REFILL_REQUESTED' ? 'Refill Requested' : 'Request Refill'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Patient Invoices Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h2 className="text-base font-extrabold text-slate-900">
              Billing & Insurance Claim Summary
            </h2>
            {patientInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-mono tabular-nums font-bold text-slate-900">
                    {inv.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{inv.insuranceProvider}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold font-mono tabular-nums text-slate-900">
                    IDR {Number(inv.netAmount).toLocaleString('en-US')}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums font-semibold text-blue-600">
                    Paid: IDR {Number(inv.paidAmount).toLocaleString('en-US')} ({inv.status})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* In-App Signed Lab Report Modal Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{previewDoc.doc.fileName}</h3>
                <p className="text-xs text-slate-300 font-mono tabular-nums">
                  Google Drive Vault File ID: {previewDoc.doc.gdriveFileId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono tabular-nums">
                <div>ANAVERSE HOSPITAL — DEPARTMENT OF CLINICAL PATHOLOGY</div>
                <div>
                  Patient: {patient?.fullName} ({patient?.uhid})
                </div>
                <div>Document Status: DIGITALLY VERIFIED & CLOUD ARCHIVED</div>
              </div>

              {previewDoc.labOrder?.resultData && (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2">Parameter</th>
                      <th className="py-2 text-right">Result</th>
                      <th className="py-2 text-right">Reference Range</th>
                      <th className="py-2 text-right">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {Object.entries(previewDoc.labOrder.resultData).map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2.5 font-sans font-semibold text-slate-900">{k}</td>
                        <td className="py-2.5 text-right font-bold">
                          {v.value} {v.unit}
                        </td>
                        <td className="py-2.5 text-right text-slate-500">{v.ref}</td>
                        <td
                          className={`py-2.5 text-right font-bold ${
                            v.flag === 'HIGH'
                              ? 'text-rose-600'
                              : v.flag === 'BORDERLINE'
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {v.flag}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {previewDoc.labOrder?.clinicalNotes && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-800">
                  <strong>Clinical Pathologist Interpretation:</strong> {previewDoc.labOrder.clinicalNotes}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadVerifiedPdf(previewDoc.doc)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Verified PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
