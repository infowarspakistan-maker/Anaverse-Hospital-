import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Thermometer,
  HeartPulse,
  Wind,
  Plus,
  FlaskConical,
  Pill,
  Save,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  Appointment,
  DiagnosticService,
  Doctor,
  Encounter,
  LabOrder,
  Patient,
  PharmacyItem,
  Prescription,
} from '../../types/erp.ts';

interface ICD10Suggestion {
  code: string;
  description: string;
  clinicalCategory: string;
  confidenceNote: string;
}

interface DrugSafetyAlert {
  safe: boolean;
  severity: 'NONE' | 'MODERATE' | 'CONTRAINDICATED';
  alertTitle: string;
  clinicalExplanation: string;
  alternativeRecommendation: string;
}

interface DoctorEmrPortalProps {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  encounters: Encounter[];
  diagnosticServices: DiagnosticService[];
  labOrders: LabOrder[];
  prescriptions: Prescription[];
  pharmacyInventory: PharmacyItem[];
  onRefresh: () => Promise<void>;
}

export const DoctorEmrPortal: React.FC<DoctorEmrPortalProps> = ({
  doctors,
  patients,
  appointments,
  encounters,
  diagnosticServices,
  labOrders,
  prescriptions,
  pharmacyInventory,
  onRefresh,
}) => {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(
    appointments[0]?.id || ''
  );
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'IN_CONSULTATION' | 'CONFIRMED' | 'COMPLETED'>('ALL');

  const activeAppointment =
    appointments.find((a) => a.id === selectedAppointmentId) || appointments[0];
  const activePatient =
    patients.find((p) => p.id === activeAppointment?.patientId) || patients[0];
  const activeDoctor =
    doctors.find((d) => d.id === activeAppointment?.doctorId) || doctors[0];

  const existingEncounter = encounters.find(
    (e) => e.patientId === activePatient?.id
  );

  // Vital Signs State
  const [systolicBp, setSystolicBp] = useState<number>(existingEncounter?.systolicBp || 132);
  const [diastolicBp, setDiastolicBp] = useState<number>(existingEncounter?.diastolicBp || 85);
  const [temperatureCelsius, setTemperatureCelsius] = useState<string>(
    existingEncounter?.temperatureCelsius || '36.6'
  );
  const [pulseBpm, setPulseBpm] = useState<number>(existingEncounter?.pulseBpm || 78);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(
    existingEncounter?.respiratoryRate || 16
  );
  const [spO2, setSpO2] = useState<number>(existingEncounter?.spO2 || 98);
  const [weightKg, setWeightKg] = useState<string>(existingEncounter?.weightKg || '71.8');
  const [bloodGlucoseMgDl, setBloodGlucoseMgDl] = useState<number>(
    existingEncounter?.bloodGlucoseMgDl || 96
  );

  // SOAP Consultation State
  const [chiefComplaint, setChiefComplaint] = useState<string>(
    existingEncounter?.chiefComplaint ||
      activeAppointment?.reasonForVisit ||
      'Episodic chest tightness and lightheadedness after mild cardio exertion'
  );
  const [soapObjective, setSoapObjective] = useState<string>(
    existingEncounter?.soapObjective ||
      'BP 132/85 mmHg, HR 78 bpm regular, Temp 36.6°C, SpO2 98% room air. S1/S2 normal.'
  );
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    existingEncounter?.clinicalNotes ||
      'Exertional precordial tightness resolving with rest. Fasting lipid panel shows hypercholesterolemia (Total 242 mg/dL, LDL 164 mg/dL).'
  );
  const [soapPlan, setSoapPlan] = useState<string>(
    existingEncounter?.soapPlan ||
      '1. Initiate Atorvastatin 20mg ON.\n2. Continue Amlodipine 5mg OD.\n3. Order Complete Blood Count (LAB-CBC).'
  );
  const [diagnosisIcd10, setDiagnosisIcd10] = useState<string>(
    existingEncounter?.diagnosisIcd10 || 'I10'
  );
  const [diagnosisDescription, setDiagnosisDescription] = useState<string>(
    existingEncounter?.diagnosisDescription ||
      'Essential (primary) hypertension with Hyperlipidemia (E78.5)'
  );

  // AI ICD-10 Predictive Search State
  const [icdQuery, setIcdQuery] = useState<string>(
    'Episodic chest tightness and elevated blood pressure'
  );
  const [icdResults, setIcdResults] = useState<ICD10Suggestion[]>([]);
  const [searchingIcd, setSearchingIcd] = useState<boolean>(false);

  // eRx & Drug Interaction Checker State
  const [rxMedication, setRxMedication] = useState<string>(
    pharmacyInventory[1]?.drugName || 'Atorvastatin Calcium 20 mg Film-Coated'
  );
  const [rxDosage, setRxDosage] = useState<string>('20 mg');
  const [rxFrequency, setRxFrequency] = useState<string>('Once daily after dinner (0-0-1)');
  const [rxQuantity, setRxQuantity] = useState<number>(30);
  const [rxInstructions, setRxInstructions] = useState<string>(
    'Take consistently with water. Monitor lipid panel in 8 weeks.'
  );
  const [drugSafetyResult, setDrugSafetyResult] = useState<DrugSafetyAlert | null>(null);
  const [checkingDrug, setCheckingDrug] = useState<boolean>(false);

  // Lab Requisition State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    diagnosticServices[0]?.id || 's1111111-1111-1111-1111-111111111111'
  );
  const [labNotes, setLabNotes] = useState<string>(
    'Evaluate baseline hemoglobin and leukocyte count alongside statin therapy.'
  );

  const [savingEncounter, setSavingEncounter] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!activePatient) return;
    const ptEnc = encounters.find((e) => e.patientId === activePatient.id);
    if (ptEnc) {
      setSystolicBp(ptEnc.systolicBp || 130);
      setDiastolicBp(ptEnc.diastolicBp || 84);
      setTemperatureCelsius(ptEnc.temperatureCelsius || '36.6');
      setPulseBpm(ptEnc.pulseBpm || 78);
      setRespiratoryRate(ptEnc.respiratoryRate || 16);
      setSpO2(ptEnc.spO2 || 98);
      setWeightKg(ptEnc.weightKg || '71.8');
      setBloodGlucoseMgDl(ptEnc.bloodGlucoseMgDl || 96);
      setChiefComplaint(ptEnc.chiefComplaint || activeAppointment?.reasonForVisit || '');
      setSoapObjective(ptEnc.soapObjective || '');
      setClinicalNotes(ptEnc.clinicalNotes || '');
      setSoapPlan(ptEnc.soapPlan || '');
      setDiagnosisIcd10(ptEnc.diagnosisIcd10 || 'I10');
      setDiagnosisDescription(ptEnc.diagnosisDescription || 'Essential (primary) hypertension');
    } else {
      setChiefComplaint(activeAppointment?.reasonForVisit || '');
    }
  }, [activePatient?.id, activeAppointment?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSearchIcd10 = async () => {
    setSearchingIcd(true);
    try {
      const res = await fetch('/api/icd10/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom: icdQuery || chiefComplaint }),
      });
      const data = await res.json();
      if (data.results) {
        setIcdResults(data.results);
      }
    } catch (error) {
      console.error('ICD-10 search failed:', error);
    } finally {
      setSearchingIcd(false);
    }
  };

  useEffect(() => {
    handleSearchIcd10();
  }, []);

  const handleSaveEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !activeDoctor) return;
    setSavingEncounter(true);
    try {
      const res = await fetch('/api/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingEncounter?.id,
          patientId: activePatient.id,
          doctorId: activeDoctor.id,
          encounterType: 'OPD',
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save encounter');
      await onRefresh();
      showToast(`Clinical Encounter ${data.encounter_number} saved to Cloud SQL PostgreSQL.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save encounter.');
    } finally {
      setSavingEncounter(false);
    }
  };

  const handleQueueStatusChange = async (appointmentId: string, nextStatus: string) => {
    try {
      await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      await onRefresh();
      showToast(`Queue status updated to ${nextStatus}.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckDrugSafety = async (medToTest?: string) => {
    const targetMed = medToTest || rxMedication;
    setCheckingDrug(true);
    try {
      const activeMeds = prescriptions
        .filter((r) => r.patientId === activePatient?.id)
        .map((r) => r.medicationName);

      const res = await fetch('/api/clinical/drug-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationName: targetMed,
          allergies: activePatient?.allergies || [],
          activeMedications: activeMeds,
          chronicConditions: activePatient?.chronicConditions || [],
        }),
      });
      const data = await res.json();
      setDrugSafetyResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingDrug(false);
    }
  };

  const handleIssuePrescription = async () => {
    if (!activePatient || !activeDoctor) return;
    const encId = existingEncounter?.id || encounters[0]?.id;
    if (!encId) return;

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId: encId,
          patientId: activePatient.id,
          doctorId: activeDoctor.id,
          medicationName: rxMedication,
          dosage: rxDosage,
          frequency: rxFrequency,
          instructions: rxInstructions,
          quantity: rxQuantity,
        }),
      });
      if (!res.ok) throw new Error('Failed to issue prescription');
      await onRefresh();
      showToast(`Electronic Prescription (eRx) for ${rxMedication} transmitted to Hospital Pharmacy.`);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleOrderLab = async () => {
    if (!activePatient) return;
    const encId = existingEncounter?.id || encounters[0]?.id;
    if (!encId) return;

    try {
      const res = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounterId: encId,
          patientId: activePatient.id,
          serviceId: selectedServiceId,
          clinicalNotes: labNotes,
        }),
      });
      if (!res.ok) throw new Error('Failed to order lab');
      await onRefresh();
      showToast('Diagnostic Laboratory / Radiology requisition transmitted to LIS & Billing.');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const filteredAppointments =
    queueFilter === 'ALL'
      ? appointments
      : appointments.filter((a) => a.status === queueFilter);

  const patientLabs = labOrders.filter((l) => l.patientId === activePatient?.id);
  const patientRxs = prescriptions.filter((r) => r.patientId === activePatient?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Clinical Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <div className="text-xs font-semibold text-blue-600">
            Outpatient & Inpatient Clinical EMR · Attending Physician Workspace
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {activeDoctor?.fullName || 'Dr. Andika Pratama'} — {activeDoctor?.specializationTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            License No: {activeDoctor?.medicalLicenseNumber} · Integrated Specialist Polyclinic
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
            <span className="text-[11px] text-slate-500 block">Today&apos;s Queue</span>
            <span className="text-lg font-extrabold font-mono tabular-nums text-slate-900">
              {appointments.length} Patients
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveEncounter}
            disabled={savingEncounter}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{savingEncounter ? 'Saving SOAP...' : 'Save Clinical Record (SOAP)'}</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (4 cols): Patient Queue Component */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">
              Outpatient Clinic Queue (OPD)
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              May 20, 2026
            </span>
          </div>

          {/* Interactive Queue Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-semibold">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'IN_CONSULTATION', label: 'In Room' },
              { id: 'CONFIRMED', label: 'Waiting' },
              { id: 'COMPLETED', label: 'Done' },
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setQueueFilter(tab.id as any)}
                className={`py-1.5 px-2 rounded-md transition-colors whitespace-nowrap truncate ${
                  queueFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredAppointments.map((apt) => {
              const pt = patients.find((p) => p.id === apt.patientId);
              const isSelected = apt.id === activeAppointment?.id;
              return (
                <div
                  key={apt.id}
                  onClick={() => setSelectedAppointmentId(apt.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold font-mono tabular-nums text-blue-600">
                      Token #{apt.tokenNumber}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {apt.startTime}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {pt?.fullName || 'Anaverse Patient'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                    {pt?.uhid} · {pt?.gender} · Blood {pt?.bloodGroup}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                    {apt.reasonForVisit}
                  </p>

                  {/* Queue Status Action Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Status: {apt.status}
                    </span>
                    <div className="flex items-center gap-1">
                      {apt.status !== 'IN_CONSULTATION' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQueueStatusChange(apt.id, 'IN_CONSULTATION');
                          }}
                          className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700"
                        >
                          Call Patient
                        </button>
                      )}
                      {apt.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQueueStatusChange(apt.id, 'COMPLETED');
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (8 cols): Vital Signs Input Form + SOAP + AI ICD-10 + eRx */}
        <div className="lg:col-span-8 space-y-6">
          {/* Patient Master Identity & Clinical Allergy Banner */}
          {activePatient && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    <span className="font-bold text-blue-600">{activePatient.uhid}</span>
                    <span>·</span>
                    <span>Encounter: {existingEncounter?.encounterNumber || 'NEW-ENC'}</span>
                    <span>·</span>
                    <span>DOB: {activePatient.dateOfBirth}</span>
                    <span>·</span>
                    <span>Blood Group: {activePatient.bloodGroup}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {activePatient.fullName}
                  </h2>
                </div>

                {activePatient.allergies && activePatient.allergies.length > 0 && (
                  <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-bold text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>DRUG ALLERGY: {activePatient.allergies.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-600 flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                <span>
                  <strong className="text-slate-800">Chronic Conditions:</strong>{' '}
                  {activePatient.chronicConditions?.join(', ') || 'None reported'}
                </span>
                <span>·</span>
                <span>
                  <strong className="text-slate-800">Emergency Contact:</strong>{' '}
                  {activePatient.emergencyContactName} ({activePatient.emergencyContactPhone})
                </span>
              </div>
            </div>
          )}

          {/* 1. Vital Signs Input Form (Blueprint Step 4 Requirement) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Vital Signs Assessment Form</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record objective physiological parameters prior to ICD-10 diagnostic coding.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-semibold text-slate-600">
                MAP: {Math.round((systolicBp + 2 * diastolicBp) / 3)} mmHg
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>Systolic BP</span>
                  <span className="text-slate-400">mmHg</span>
                </label>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(Number(e.target.value))}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {systolicBp >= 130 ? '↑ Pre-Hypertension / Stage 1' : '✓ Normal (<120)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>Diastolic BP</span>
                  <span className="text-slate-400">mmHg</span>
                </label>
                <input
                  type="number"
                  value={diastolicBp}
                  onChange={(e) => setDiastolicBp(Number(e.target.value))}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {diastolicBp >= 85 ? '↑ Elevated Diastolic' : '✓ Normal (<80)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3 text-blue-600" /> Temperature
                  </span>
                  <span className="text-slate-400">°C</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperatureCelsius}
                  onChange={(e) => setTemperatureCelsius(e.target.value)}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Afebrile (36.5–37.2°C)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-blue-600" /> Heart Rate
                  </span>
                  <span className="text-slate-400">BPM</span>
                </label>
                <input
                  type="number"
                  value={pulseBpm}
                  onChange={(e) => setPulseBpm(Number(e.target.value))}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Regular Sinus (60–100)</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-blue-600" /> Resp. Rate
                  </span>
                  <span className="text-slate-400">/min</span>
                </label>
                <input
                  type="number"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>SpO2 Saturation</span>
                  <span className="text-slate-400">%</span>
                </label>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(Number(e.target.value))}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>Body Weight</span>
                  <span className="text-slate-400">kg</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                  <span>Blood Glucose</span>
                  <span className="text-slate-400">mg/dL</span>
                </label>
                <input
                  type="number"
                  value={bloodGlucoseMgDl}
                  onChange={(e) => setBloodGlucoseMgDl(Number(e.target.value))}
                  className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-base font-extrabold font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 2. SOAP Consultation Pad & AI-Powered ICD-10 Predictive Search (Blueprint Step 3) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>SOAP Clinical Documentation & AI-Powered ICD-10 Predictive Search</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured Subjective, Objective, Assessment (WHO ICD-10 Coding), and Care Plan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  S — Subjective (Chief Complaint & History of Present Illness)
                </label>
                <textarea
                  rows={3}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  O — Objective (Physical Examination & Diagnostic Findings)
                </label>
                <textarea
                  rows={3}
                  value={soapObjective}
                  onChange={(e) => setSoapObjective(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* AI ICD-10 Predictive Search Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    A — Assessment: Predictive ICD-10 Diagnostic Search
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Enter patient symptoms to retrieve the top 5 most likely WHO ICD-10 codes.
                  </span>
                </div>
                <div className="text-xs font-mono tabular-nums font-bold text-blue-600">
                  Selected: {diagnosisIcd10} — {diagnosisDescription}
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={icdQuery}
                    onChange={(e) => setIcdQuery(e.target.value)}
                    placeholder="e.g., Episodic chest tightness, hypertension, hyperlipidemia..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchIcd10}
                  disabled={searchingIcd}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  {searchingIcd ? 'Analyzing ICD-10...' : 'Search ICD-10 Codes'}
                </button>
              </div>

              {/* Top 5 ICD-10 Results */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {icdResults.map((item) => {
                  const selected = diagnosisIcd10 === item.code;
                  return (
                    <button
                      type="button"
                      key={item.code}
                      onClick={() => {
                        setDiagnosisIcd10(item.code);
                        setDiagnosisDescription(item.description);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums font-extrabold text-xs">
                            {item.code}
                          </span>
                          <span>·</span>
                          <span className="text-xs font-bold">{item.description}</span>
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            selected ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {item.clinicalCategory} · {item.confidenceNote}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                          selected ? 'text-white' : 'text-blue-600'
                        }`}
                      >
                        {selected ? '✓ Selected' : 'Select Code'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Clinical Notes & Lab Interpretation
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  P — Plan (Therapeutic Regimen & Follow-Up Plan)
                </label>
                <textarea
                  rows={3}
                  value={soapPlan}
                  onChange={(e) => setSoapPlan(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 3. Electronic Prescription (eRx) & Real-Time Drug Interaction Checker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <span>Electronic Prescription (eRx) & Safety Check</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setRxMedication('Amoxicillin Trihydrate 500 mg Capsule');
                    handleCheckDrugSafety('Amoxicillin Trihydrate 500 mg Capsule');
                  }}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Test Penicillin Allergy Alert
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Hospital Formulary Medication
                  </label>
                  <select
                    value={rxMedication}
                    onChange={(e) => {
                      setRxMedication(e.target.value);
                      handleCheckDrugSafety(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                  >
                    {pharmacyInventory.map((item) => (
                      <option key={item.id} value={item.drugName}>
                        {item.drugName} ({item.genericName}) — Stock: {item.stockQuantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={rxFrequency}
                      onChange={(e) => setRxFrequency(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Quantity (Tabs)
                    </label>
                    <input
                      type="number"
                      value={rxQuantity}
                      onChange={(e) => setRxQuantity(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Drug Interaction / Allergy Verification Result */}
                {drugSafetyResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      drugSafetyResult.safe
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      {drugSafetyResult.safe ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{drugSafetyResult.alertTitle}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {drugSafetyResult.clinicalExplanation}
                    </p>
                    <p className="text-[11px] font-semibold">
                      Recommendation: {drugSafetyResult.alternativeRecommendation}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCheckDrugSafety()}
                    disabled={checkingDrug}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {checkingDrug ? 'Checking...' : 'Check Drug Interaction'}
                  </button>
                  <button
                    type="button"
                    onClick={handleIssuePrescription}
                    disabled={drugSafetyResult?.severity === 'CONTRAINDICATED'}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sign & Send eRx</span>
                  </button>
                </div>
              </div>

              {/* Active Prescriptions for Patient */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Active Patient Prescriptions ({patientRxs.length})
                </div>
                {patientRxs.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{rx.medicationName}</div>
                      <div className="text-[11px] text-slate-500">
                        {rx.dosage} · {rx.frequency}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-blue-600">
                      {rx.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Diagnostic & Lab Investigation Requisition */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                <span>Laboratory & Radiology Requisition (LIS)</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Diagnostic Service (Pathology / Radiology)
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                  >
                    {diagnosticServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        [{svc.code}] {svc.name} — IDR {Number(svc.basePrice).toLocaleString('en-US')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Indication / Instructions for Lab Analyst
                  </label>
                  <textarea
                    rows={2}
                    value={labNotes}
                    onChange={(e) => setLabNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOrderLab}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Transmit Order to LIS & Billing</span>
                </button>
              </div>

              {/* Existing Lab Orders & Verified Results */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Patient Lab & Radiology Results ({patientLabs.length})
                </div>
                {patientLabs.map((lo) => {
                  const svc = diagnosticServices.find((s) => s.id === lo.serviceId);
                  return (
                    <div
                      key={lo.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {svc?.code} — {svc?.name}
                        </span>
                        <span
                          className={`font-mono tabular-nums font-bold text-[11px] ${
                            lo.orderStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        >
                          {lo.orderStatus}
                        </span>
                      </div>
                      {lo.resultData && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {Object.entries(lo.resultData).map(([analyte, val]) => (
                            <div
                              key={analyte}
                              className="px-2 py-1 rounded bg-white border border-slate-200 flex items-center justify-between"
                            >
                              <span className="text-[11px] text-slate-600 truncate">{analyte}</span>
                              <span
                                className={`text-[11px] font-mono tabular-nums font-bold ${
                                  val.flag === 'HIGH'
                                    ? 'text-rose-600'
                                    : val.flag === 'BORDERLINE'
                                    ? 'text-amber-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {val.value} {val.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
