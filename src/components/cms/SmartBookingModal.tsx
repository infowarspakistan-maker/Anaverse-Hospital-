import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Printer,
  Sparkles,
  MapPin,
  Activity,
  BedDouble,
  Ambulance,
  Scan,
  Microscope,
  Pill,
} from 'lucide-react';
import { Department, Doctor, Patient } from '../../types/erp.ts';

const getDepartmentVisualData = (deptName: string) => {
  const lower = deptName.toLowerCase();
  if (lower.includes('poli') || lower.includes('specialist')) {
    return {
      image: '/services/specialist-clinics.jpg',
      badge: 'Specialist OPD',
      badgeColor: 'bg-blue-600 text-white',
      wait: '~10m wait',
      icon: Stethoscope,
      highlight: 'Cardiology, Pediatrics, Surgery & Internal Medicine',
    };
  }
  if (lower.includes('inap') || lower.includes('inpatient')) {
    return {
      image: '/services/inpatient-care.jpg',
      badge: 'Executive Inpatient',
      badgeColor: 'bg-indigo-600 text-white',
      wait: 'Beds Ready',
      icon: BedDouble,
      highlight: 'Luxury VIP Suites & 24/7 Nurse Care Station',
    };
  }
  if (lower.includes('igd') || lower.includes('emergency')) {
    return {
      image: '/services/emergency-er.jpg',
      badge: '24/7 Emergency',
      badgeColor: 'bg-rose-600 text-white',
      wait: 'Immediate Triage',
      icon: Ambulance,
      highlight: 'Life-Support Trauma & Acute Cardiac Response',
    };
  }
  if (lower.includes('radiologi') || lower.includes('imaging')) {
    return {
      image: '/services/radiology-imaging.jpg',
      badge: 'Digital Imaging',
      badgeColor: 'bg-emerald-600 text-white',
      wait: '~15m scan',
      icon: Scan,
      highlight: '1.5T MRI, 128-Slice CT & Digital X-Ray',
    };
  }
  if (lower.includes('lab')) {
    return {
      image: '/services/clinical-laboratory.jpg',
      badge: 'Clinical Pathology',
      badgeColor: 'bg-amber-600 text-white',
      wait: 'Same-Day PDF',
      icon: Microscope,
      highlight: 'Automated Blood Chemistry & Cloud EMR Vault Sync',
    };
  }
  return {
    image: '/services/hospital-pharmacy.jpg',
    badge: 'Clinical Pharmacy',
    badgeColor: 'bg-cyan-600 text-white',
    wait: '~5m dispense',
    icon: Pill,
    highlight: 'Certified Formulary & Direct e-Prescription Dispense',
  };
};

interface SmartBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  initialDepartmentId?: string;
  initialDoctorId?: string;
  onBookingSuccess: () => Promise<void>;
  onNavigateToDoctorQueue: () => void;
}

const TIME_SLOTS = [
  '08:40',
  '09:00',
  '09:20',
  '09:40',
  '10:00',
  '10:20',
  '11:00',
  '13:30',
  '14:00',
  '15:00',
];

export const SmartBookingModal: React.FC<SmartBookingModalProps> = ({
  isOpen,
  onClose,
  departments,
  doctors,
  patients,
  initialDepartmentId,
  initialDoctorId,
  onBookingSuccess,
  onNavigateToDoctorQueue,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    initialDepartmentId || departments[0]?.id || 'd1111111-1111-1111-1111-111111111111'
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    initialDoctorId || doctors[0]?.id || 'doc11111-1111-1111-1111-111111111111'
  );
  const [appointmentType, setAppointmentType] = useState<string>('OPD_CONSULTATION');
  const [appointmentDate, setAppointmentDate] = useState<string>('2026-05-20');
  const [selectedSlot, setSelectedSlot] = useState<string>('09:40');
  const [patientMode, setPatientMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patients[0]?.id || 'pat11111-1111-1111-1111-111111111111'
  );
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+62812');
  const [dateOfBirth, setDateOfBirth] = useState<string>('1992-08-17');
  const [gender, setGender] = useState<string>('Male');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [reasonForVisit, setReasonForVisit] = useState<string>(
    'Specialist consultation and routine diagnostic follow-up'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [issuedResult, setIssuedResult] = useState<{
    tokenNumber: number;
    uhid: string;
    patientName: string;
    doctorName: string;
    date: string;
    slot: string;
  } | null>(null);

  if (!isOpen) return null;

  const selectedDoc =
    doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const selectedDept =
    departments.find((d) => d.id === selectedDeptId) || departments[0];
  const selectedExistingPatient = patients.find((p) => p.id === selectedPatientId);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetName =
      patientMode === 'EXISTING'
        ? selectedExistingPatient?.fullName || 'Reza Rahadian'
        : fullName.trim();

    if (!targetName) {
      setErrorMsg('Please enter the patient full name.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientMode === 'EXISTING' ? selectedPatientId : undefined,
          fullName: targetName,
          phone:
            patientMode === 'EXISTING'
              ? selectedExistingPatient?.phone || '+6281299887766'
              : phone,
          dateOfBirth:
            patientMode === 'EXISTING'
              ? selectedExistingPatient?.dateOfBirth || '1988-06-14'
              : dateOfBirth,
          gender:
            patientMode === 'EXISTING'
              ? selectedExistingPatient?.gender || 'Male'
              : gender,
          bloodGroup:
            patientMode === 'EXISTING'
              ? selectedExistingPatient?.bloodGroup || 'O+'
              : bloodGroup,
          departmentId: selectedDeptId,
          doctorId: selectedDoctorId,
          appointmentDate,
          startTime: selectedSlot,
          appointmentType,
          reasonForVisit,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule appointment.');
      }

      await onBookingSuccess();
      setIssuedResult({
        tokenNumber: data.tokenNumber,
        uhid: data.uhid,
        patientName: targetName,
        doctorName: selectedDoc?.fullName || 'Dr. Andika Pratama',
        date: appointmentDate,
        slot: selectedSlot,
      });
      setStep(5);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving your appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Smart Booking Engine — Anaverse Hospital
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Integrated Outpatient Registration & Instant Queue Token Issuance (UHID)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className={step >= 1 ? 'text-blue-600' : ''}>01. Department</span>
          <span>·</span>
          <span className={step >= 2 ? 'text-blue-600' : ''}>02. Specialist</span>
          <span>·</span>
          <span className={step >= 3 ? 'text-blue-600' : ''}>03. Time Slot</span>
          <span>·</span>
          <span className={step >= 4 ? 'text-blue-600' : ''}>04. Verify UHID</span>
          <span>·</span>
          <span className={step === 5 ? 'text-emerald-600 font-bold' : ''}>05. Queue Token</span>
        </div>

        <form onSubmit={handleConfirmBooking} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Select Department (Visual Reference Cards) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Select Clinical Department & Service
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tap a clinical department photo to view specialists and book an instant queue token.
                  </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Visual Reference</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => {
                  const active = dept.id === selectedDeptId;
                  const visual = getDepartmentVisualData(dept.name);
                  const Icon = visual.icon;
                  return (
                    <button
                      type="button"
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`text-left rounded-xl border overflow-hidden transition-all group flex flex-col justify-between ${
                        active
                          ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-md bg-blue-50/30'
                          : 'border-slate-200 hover:border-blue-400 bg-white hover:shadow-sm'
                      }`}
                    >
                      <div>
                        {/* Department Photographic Visual Reference */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                          <img
                            src={visual.image}
                            alt={dept.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                          {/* Floating Visual Status Badge */}
                          <span
                            className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm ${visual.badgeColor}`}
                          >
                            {visual.badge}
                          </span>

                          {/* Live Wait Indicator */}
                          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-sky-200 border border-white/20">
                            {visual.wait}
                          </span>

                          {/* Selection Checkmark Indicator */}
                          {active && (
                            <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border border-white">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}

                          {/* Department Name and Icon over Visual Preview */}
                          <div className="absolute bottom-2 left-2 right-9 text-white flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                              <Icon className="w-3 h-3 text-sky-300" />
                            </div>
                            <div className="text-xs font-extrabold tracking-tight truncate drop-shadow-sm">
                              {dept.name}
                            </div>
                          </div>
                        </div>

                        {/* Clean Visual Highlight (No dense reading) */}
                        <div className="p-3">
                          <p className="text-[11px] text-slate-600 font-medium line-clamp-1">
                            {visual.highlight}
                          </p>
                        </div>
                      </div>

                      <div className="px-3 pb-3 pt-0 flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${active ? 'text-blue-700' : 'text-slate-500'}`}
                        >
                          {active ? 'Selected ✓' : 'Tap to Select'}
                        </span>
                        <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          Next →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Visual Selected Department Confirmation Bar */}
              {selectedDept && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-300 bg-slate-900">
                      <img
                        src={getDepartmentVisualData(selectedDept.name).image}
                        alt={selectedDept.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {selectedDept.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {getDepartmentVisualData(selectedDept.name).highlight}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95"
                  >
                    <span>Choose Specialist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Specialist */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Select Attending Specialist Physician
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  All attending physicians are board-certified with active clinical schedules.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc, index) => {
                  const active = doc.id === selectedDoctorId;
                  const getDoctorGif = (d: Doctor, idx: number): string => {
                    const lower = (d.fullName || '').toLowerCase();
                    if (lower.includes('andika')) return "/Doctor_adjusts_posture_in_hallway_2cab1d82.gif";
                    if (lower.includes('salsabila')) return "/Female_doctor_in_hospital_hallway_1e6c454b.gif";
                    if (lower.includes('budi')) return "/Healthcare_worker_adjusts_stance_7374fd6f.gif";
                    if (lower.includes('meilani')) return "/Healthcare_worker_smiles_in_hallway_6854f5a2.gif";
                    if (lower.includes('dewi') || lower.includes('sarah') || idx === 4) return "/Nurse_adjusting_stance_in_hallway_68f22ae3.gif";
                    if (lower.includes('rudi') || lower.includes('hartono') || idx === 5) return "/Nurse_smiles_in_hospital_hallway_203d1401.gif";
                    const all = [
                      "/Doctor_adjusts_posture_in_hallway_2cab1d82.gif",
                      "/Female_doctor_in_hospital_hallway_1e6c454b.gif",
                      "/Healthcare_worker_adjusts_stance_7374fd6f.gif",
                      "/Healthcare_worker_smiles_in_hallway_6854f5a2.gif",
                      "/Nurse_adjusting_stance_in_hallway_68f22ae3.gif",
                      "/Nurse_smiles_in_hospital_hallway_203d1401.gif",
                    ];
                    return all[idx % all.length];
                  };

                  return (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                        active
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-900 shadow-inner">
                        <img
                          src={getDoctorGif(doc, index)}
                          alt={doc.fullName}
                          className="w-full h-full object-cover block"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{doc.fullName}</div>
                        <div className="text-xs text-slate-600 mt-0.5 truncate">
                          {doc.specializationTitle} · ★ {doc.rating}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-blue-700 font-semibold mt-1">
                          IDR {Number(doc.consultationFee).toLocaleString('en-US')} / session
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  <span>Select Time Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Appointment Type & Dynamic Slot Picker */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Select Visit Type & Dynamic Time Slot
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard consultation duration is 20 minutes per patient.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
                {[
                  { id: 'OPD_CONSULTATION', label: 'OPD Consultation' },
                  { id: 'DIAGNOSTIC_TEST', label: 'Diagnostic Test' },
                  { id: 'HEALTH_PACKAGE', label: 'Medical Check-Up' },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setAppointmentType(t.id)}
                    className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap truncate ${
                      appointmentType === t.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appointment Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-mono tabular-nums focus:outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selected Physician
                  </label>
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800">
                    {selectedDoc?.fullName}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Available Time Slots (24h)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono tabular-nums font-semibold transition-colors ${
                        selectedSlot === slot
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  <span>Verify Patient Identity</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Patient UHID Verification */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Patient Master Identity Verification (UHID)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select an existing Universal Health ID (UHID) record or register a new patient.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPatientMode('EXISTING')}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                    patientMode === 'EXISTING'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Registered Patient (Active UHID)
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode('NEW')}
                  className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors ${
                    patientMode === 'NEW'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Patient (Generate UHID)
                </button>
              </div>

              {patientMode === 'EXISTING' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Patient Medical Record (UHID)
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:border-blue-600"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.uhid} — {p.fullName} ({p.gender}, Blood Group {p.bloodGroup})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Patient Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Dian Sastrowardoyo"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone / Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-mono tabular-nums"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Blood Group
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                      >
                        <option value="O+">O+</option>
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="AB+">AB+</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chief Complaint / Reason for Visit
                </label>
                <textarea
                  rows={2}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm"
                  placeholder="Describe primary symptoms or reason for consultation..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {submitting ? 'Issuing Queue Token...' : 'Confirm & Issue Queue Token'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Instant Queue Token Pass */}
          {step === 5 && issuedResult && (
            <div className="space-y-5 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">
                  Outpatient Queue Token Successfully Issued
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your appointment has been recorded in Cloud SQL PostgreSQL and added to the Doctor EMR queue.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Queue Token Number</span>
                  <span className="text-3xl font-extrabold font-mono tabular-nums text-blue-600">
                    #{issuedResult.tokenNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Universal Health ID (UHID)</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1 block">
                    {issuedResult.uhid}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Patient Name</span>
                  <span className="text-sm font-bold text-slate-900">{issuedResult.patientName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Attending Specialist</span>
                  <span className="text-sm font-bold text-slate-900">{issuedResult.doctorName}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {issuedResult.date}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {issuedResult.slot}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Queue Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDoctorQueue();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  <span>Open in Doctor EMR Queue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
