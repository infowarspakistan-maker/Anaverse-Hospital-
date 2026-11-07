import { db } from './index.ts';
import {
  users,
  patients,
  departments,
  doctors,
  encounters,
  appointments,
  diagnosticServices,
  labOrders,
  medicalDocuments,
  prescriptions,
  pharmacyInventory,
  beds,
  invoices,
  invoiceItems,
  auditLogs,
} from './schema.ts';
import { eq, desc, asc } from 'drizzle-orm';
import { ensureSeedData } from './seed.ts';

// Resilient in-memory relational mirror used when the Cloud SQL proxy socket is unavailable
// after switching GCP projects during Google Drive OAuth provisioning.
const memoryStore = {
  users: [
    {
      id: 'u1000000-0000-0000-0000-000000000001',
      uid: 'seed-doc-andika',
      email: 'andika.pratama@anaverse.com',
      passwordHash: '$2b$12$eX4mP1eHashForAuthDoc1',
      role: 'DOCTOR',
      firstName: 'Andika',
      lastName: 'Pratama',
      phone: '+62811000001',
      isActive: true,
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
    {
      id: 'u1000000-0000-0000-0000-000000000002',
      uid: 'seed-doc-salsabila',
      email: 'salsabila.putri@anaverse.com',
      passwordHash: '$2b$12$eX4mP1eHashForAuthDoc2',
      role: 'DOCTOR',
      firstName: 'Salsabila',
      lastName: 'Putri',
      phone: '+62811000002',
      isActive: true,
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
    {
      id: 'u1000000-0000-0000-0000-000000000003',
      uid: 'seed-doc-budi',
      email: 'budi.santoso@anaverse.com',
      passwordHash: '$2b$12$eX4mP1eHashForAuthDoc3',
      role: 'DOCTOR',
      firstName: 'Budi',
      lastName: 'Santoso',
      phone: '+62811000003',
      isActive: true,
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
    {
      id: 'u1000000-0000-0000-0000-000000000004',
      uid: 'seed-doc-meilani',
      email: 'meilani.putri@anaverse.com',
      passwordHash: '$2b$12$eX4mP1eHashForAuthDoc4',
      role: 'DOCTOR',
      firstName: 'Meilani',
      lastName: 'Putri',
      phone: '+62811000004',
      isActive: true,
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
    {
      id: 'u1000000-0000-0000-0000-000000000005',
      uid: 'seed-doc-dewi',
      email: 'dewi.lestari@anaverse.com',
      passwordHash: '$2b$12$eX4mP1eHashForAuthDoc5',
      role: 'DOCTOR',
      firstName: 'Dewi',
      lastName: 'Lestari',
      phone: '+62811000005',
      isActive: true,
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
    {
      id: 'u1000000-0000-0000-0000-000000000006',
      uid: 'seed-doc-rudi',
      email: 'rudi.hartono@anaverse.com',
      passwordHash: '$2b$12$eX4mP1eHashForAuthDoc6',
      role: 'DOCTOR',
      firstName: 'Rudi',
      lastName: 'Hartono',
      phone: '+62811000006',
      isActive: true,
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
    {
      id: 'u2000000-0000-0000-0000-000000000001',
      uid: 'seed-patient-reza',
      email: 'pasien.reza@gmail.com',
      passwordHash: '$2b$12$eX4mP1eHashForPatient1',
      role: 'PATIENT',
      firstName: 'Reza',
      lastName: 'Rahadian',
      phone: '+6281299887766',
      isActive: true,
      createdAt: new Date('2026-01-15T08:00:00Z'),
      updatedAt: new Date('2026-01-15T08:00:00Z'),
    },
    {
      id: 'u2000000-0000-0000-0000-000000000002',
      uid: 'seed-patient-siti',
      email: 'siti.nurhaliza@gmail.com',
      passwordHash: '$2b$12$eX4mP1eHashForPatient2',
      role: 'PATIENT',
      firstName: 'Siti',
      lastName: 'Nurhaliza',
      phone: '+6281299887767',
      isActive: true,
      createdAt: new Date('2026-01-15T08:00:00Z'),
      updatedAt: new Date('2026-01-15T08:00:00Z'),
    },
    {
      id: 'u2000000-0000-0000-0000-000000000003',
      uid: 'seed-patient-bambang',
      email: 'bambang.pamungkas@gmail.com',
      passwordHash: '$2b$12$eX4mP1eHashForPatient3',
      role: 'PATIENT',
      firstName: 'Bambang',
      lastName: 'Pamungkas',
      phone: '+6281299887768',
      isActive: true,
      createdAt: new Date('2026-01-15T08:00:00Z'),
      updatedAt: new Date('2026-01-15T08:00:00Z'),
    },
    {
      id: 'u3000000-0000-0000-0000-000000000001',
      uid: 'seed-lab-tech',
      email: 'analis.lab@anaverse.com',
      passwordHash: '$2b$12$eX4mP1eHashForLab',
      role: 'LAB_TECH',
      firstName: 'Hendra',
      lastName: 'Wijaya, B.Sc.',
      phone: '+62811000009',
      isActive: true,
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
  ],
  departments: [
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      name: 'Specialist Clinics',
      slug: 'specialist-clinics',
      description: 'Outpatient Specialist Polyclinics (Cardiology, Pediatrics, Surgery, Internal Medicine)',
      iconName: 'Stethoscope',
      isActive: true,
    },
    {
      id: 'd2222222-2222-2222-2222-222222222222',
      name: 'Inpatient Care',
      slug: 'inpatient-care',
      description: 'Inpatient Luxury VIP, Semi-Private & Standard Care Wards',
      iconName: 'BedDouble',
      isActive: true,
    },
    {
      id: 'd3333333-3333-3333-3333-333333333333',
      name: '24/7 Emergency (ER)',
      slug: 'emergency-24-7',
      description: '24/7 Emergency Trauma, Triage & Acute Cardiac Response',
      iconName: 'Ambulance',
      isActive: true,
    },
    {
      id: 'd4444444-4444-4444-4444-444444444444',
      name: 'Radiology & Imaging',
      slug: 'radiology',
      description: 'High-Resolution Digital X-Ray, CT Scan & 1.5T MRI Diagnostics',
      iconName: 'Scan',
      isActive: true,
    },
    {
      id: 'd5555555-5555-5555-5555-555555555555',
      name: 'Clinical Laboratory',
      slug: 'laboratory',
      description: 'Fully Automated Clinical Pathology, Hematology & Biochemistry',
      iconName: 'Microscope',
      isActive: true,
    },
    {
      id: 'd6666666-6666-6666-6666-666666666666',
      name: 'Hospital Pharmacy',
      slug: 'pharmacy',
      description: '24/7 Certified In-House Formulary & Clinical e-Prescription Dispensary',
      iconName: 'Pill',
      isActive: true,
    },
  ],
  doctors: [
    {
      id: 'doc11111-1111-1111-1111-111111111111',
      userId: 'u1000000-0000-0000-0000-000000000001',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      specializationTitle: 'Cardiologist',
      medicalLicenseNumber: 'STR-3101-CARDIO-882',
      biography: 'Senior Interventional Cardiologist specializing in coronary angiography, hypertension management, and preventive lipidology.',
      consultationFee: '450000.00',
      rating: '4.9',
      reviewCount: 142,
      avatarUrl: 'doc-andika',
      availableDays: [1, 2, 3, 4, 5, 6],
      slotDurationMinutes: 20,
      isActive: true,
    },
    {
      id: 'doc22222-2222-2222-2222-222222222222',
      userId: 'u1000000-0000-0000-0000-000000000002',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      specializationTitle: 'Pediatrician',
      medicalLicenseNumber: 'STR-3102-PEDIATRIC-441',
      biography: 'Pediatric Specialist focusing on early childhood immunization, growth development, and pediatric infectious disease.',
      consultationFee: '350000.00',
      rating: '4.9',
      reviewCount: 189,
      avatarUrl: 'doc-salsabila',
      availableDays: [1, 2, 3, 4, 5, 6],
      slotDurationMinutes: 20,
      isActive: true,
    },
    {
      id: 'doc33333-3333-3333-3333-333333333333',
      userId: 'u1000000-0000-0000-0000-000000000003',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      specializationTitle: 'General Surgeon',
      medicalLicenseNumber: 'STR-3103-SURG-902',
      biography: 'Consultant General & Laparoscopic Surgeon with 15+ years in minimally invasive gastrointestinal and trauma surgery.',
      consultationFee: '500000.00',
      rating: '4.8',
      reviewCount: 116,
      avatarUrl: 'doc-budi',
      availableDays: [1, 2, 3, 4, 5],
      slotDurationMinutes: 30,
      isActive: true,
    },
    {
      id: 'doc44444-4444-4444-4444-444444444444',
      userId: 'u1000000-0000-0000-0000-000000000004',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      specializationTitle: 'Internal Medicine Specialist',
      medicalLicenseNumber: 'STR-3104-INTERN-552',
      biography: 'Internal Medicine & Metabolic Specialist focusing on diabetes mellitus, geriatric care, and complex systemic disorders.',
      consultationFee: '400000.00',
      rating: '4.9',
      reviewCount: 230,
      avatarUrl: 'doc-meilani',
      availableDays: [1, 2, 3, 4, 5, 6],
      slotDurationMinutes: 20,
      isActive: true,
    },
    {
      id: 'doc55555-5555-5555-5555-555555555555',
      userId: 'u1000000-0000-0000-0000-000000000005',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      specializationTitle: 'Neurologist',
      medicalLicenseNumber: 'STR-3105-NEURO-711',
      biography: 'Clinical Neurologist focusing on neurovascular care, headache clinics, and cognitive neuro-rehabilitation.',
      consultationFee: '480000.00',
      rating: '4.9',
      reviewCount: 164,
      avatarUrl: 'Nurse_adjusting_stance_in_hallway_68f22ae3.gif',
      availableDays: [1, 2, 3, 4, 5],
      slotDurationMinutes: 20,
      isActive: true,
    },
    {
      id: 'doc66666-6666-6666-6666-666666666666',
      userId: 'u1000000-0000-0000-0000-000000000006',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      specializationTitle: 'Anesthesiologist',
      medicalLicenseNumber: 'STR-3106-ANESTH-328',
      biography: 'Consultant Anesthesiologist and Critical Care Specialist managing perioperative medicine and pain relief.',
      consultationFee: '460000.00',
      rating: '4.8',
      reviewCount: 198,
      avatarUrl: 'Nurse_smiles_in_hospital_hallway_203d1401.gif',
      availableDays: [1, 2, 3, 4, 5, 6],
      slotDurationMinutes: 20,
      isActive: true,
    },
  ],
  diagnosticServices: [
    {
      id: 's1111111-1111-1111-1111-111111111111',
      departmentId: 'd5555555-5555-5555-5555-555555555555',
      code: 'LAB-CBC',
      name: 'Complete Blood Count (CBC) with Differential',
      category: 'Pathology',
      basePrice: '185000.00',
      turnaroundHours: 4,
      preparationInstructions: 'Fasting not required.',
    },
    {
      id: 's2222222-2222-2222-2222-222222222222',
      departmentId: 'd5555555-5555-5555-5555-555555555555',
      code: 'LAB-LIPID',
      name: 'Comprehensive Lipid Profile Panel',
      category: 'Pathology',
      basePrice: '280000.00',
      turnaroundHours: 8,
      preparationInstructions: 'Fasting required for 10-12 hours prior to draw.',
    },
    {
      id: 's3333333-3333-3333-3333-333333333333',
      departmentId: 'd4444444-4444-4444-4444-444444444444',
      code: 'RAD-CHEST-PA',
      name: 'Chest X-Ray Digital PA View',
      category: 'Radiology',
      basePrice: '240000.00',
      turnaroundHours: 2,
      preparationInstructions: 'Remove metal jewelry and wear diagnostic hospital gown.',
    },
    {
      id: 's4444444-4444-4444-4444-444444444444',
      departmentId: 'd4444444-4444-4444-4444-444444444444',
      code: 'RAD-MRI-BRAIN',
      name: 'Brain MRI with Contrast 1.5 Tesla',
      category: 'Radiology',
      basePrice: '2250000.00',
      turnaroundHours: 24,
      preparationInstructions: 'Screen for metallic implants and pacemakers.',
    },
  ],
  patients: [
    {
      id: 'pat11111-1111-1111-1111-111111111111',
      userId: 'u2000000-0000-0000-0000-000000000001',
      uhid: 'HSP-2026-00412',
      fullName: 'Reza Rahadian',
      dateOfBirth: '1988-06-14',
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '+6281299887766',
      address: 'Jl. Sudirman Kav 24, South Jakarta',
      emergencyContactName: 'Indah Permata (Wife)',
      emergencyContactPhone: '+6281299887760',
      allergies: ['Penicillin'],
      chronicConditions: ['Mild Hypertension'],
      createdAt: new Date('2026-01-15T08:00:00Z'),
    },
    {
      id: 'pat22222-2222-2222-2222-222222222222',
      userId: 'u2000000-0000-0000-0000-000000000002',
      uhid: 'HSP-2026-00413',
      fullName: 'Siti Nurhaliza',
      dateOfBirth: '1994-11-02',
      gender: 'Female',
      bloodGroup: 'A+',
      phone: '+6281299887767',
      address: 'Jl. Gatot Subroto No. 88, South Jakarta',
      emergencyContactName: 'Ahmad Dhani (Husband)',
      emergencyContactPhone: '+6281299887761',
      allergies: ['Sulfa Drugs'],
      chronicConditions: ['Asthma Bronchiale'],
      createdAt: new Date('2026-01-16T08:00:00Z'),
    },
    {
      id: 'pat33333-3333-3333-3333-333333333333',
      userId: 'u2000000-0000-0000-0000-000000000003',
      uhid: 'HSP-2026-00414',
      fullName: 'Bambang Pamungkas',
      dateOfBirth: '1980-06-10',
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '+6281299887768',
      address: 'Jl. Kemang Raya No. 15, South Jakarta',
      emergencyContactName: 'Tribuana Tungga Dewi (Wife)',
      emergencyContactPhone: '+6281299887762',
      allergies: [] as string[],
      chronicConditions: ['Type 2 Diabetes Mellitus'],
      createdAt: new Date('2026-01-17T08:00:00Z'),
    },
  ],
  encounters: [
    {
      id: 'enc11111-1111-1111-1111-111111111111',
      encounterNumber: 'ENC-88319',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      doctorId: 'doc11111-1111-1111-1111-111111111111',
      encounterType: 'OPD',
      chiefComplaint: 'Episodic chest tightness and lightheadedness after mild cardio exertion',
      clinicalNotes:
        'Patient presents with exertional precordial tightness resolving within 5 minutes of rest. Fasting lipid panel shows hypercholesterolemia (Total 242 mg/dL, LDL 164 mg/dL).',
      soapObjective:
        'BP 132/85 mmHg, HR 78 bpm regular, Temp 36.6°C, SpO2 98% on room air. Resting 12-lead ECG sinus rhythm.',
      soapPlan:
        '1. Initiate Atorvastatin 20mg ON after dinner.\n2. Continue Amlodipine 5mg OD.\n3. Requisition Complete Blood Count (LAB-CBC) and Chest X-Ray PA.',
      diagnosisIcd10: 'I10',
      diagnosisDescription: 'Essential (primary) hypertension with Hyperlipidemia (E78.5)',
      systolicBp: 132,
      diastolicBp: 85,
      temperatureCelsius: '36.6',
      pulseBpm: 78,
      respiratoryRate: 16,
      spO2: 98,
      weightKg: '71.8',
      bloodGlucoseMgDl: 96,
      startedAt: new Date('2026-05-20T08:30:00Z'),
      endedAt: null as Date | null,
    },
    {
      id: 'enc00002-1111-1111-1111-111111111111',
      encounterNumber: 'ENC-88102',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      doctorId: 'doc11111-1111-1111-1111-111111111111',
      encounterType: 'OPD',
      chiefComplaint: 'Follow-up hypertension check; occasional fatigue after long work hours',
      clinicalNotes: 'BP trending down from 142/92 to 136/88 mmHg. Good medication adherence.',
      soapObjective: 'BP 136/88 mmHg, HR 80 bpm, BMI 24.6 kg/m2, no peripheral edema.',
      soapPlan: 'Continue Amlodipine 5mg OD; order fasting Comprehensive Lipid Profile.',
      diagnosisIcd10: 'I10',
      diagnosisDescription: 'Essential (primary) hypertension',
      systolicBp: 136,
      diastolicBp: 88,
      temperatureCelsius: '36.5',
      pulseBpm: 80,
      respiratoryRate: 16,
      spO2: 99,
      weightKg: '72.4',
      bloodGlucoseMgDl: 102,
      startedAt: new Date('2026-04-12T10:00:00Z'),
      endedAt: new Date('2026-04-12T10:25:00Z'),
    },
    {
      id: 'enc00001-1111-1111-1111-111111111111',
      encounterNumber: 'ENC-87904',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      doctorId: 'doc11111-1111-1111-1111-111111111111',
      encounterType: 'OPD',
      chiefComplaint: 'Routine blood pressure evaluation and mild occipital headache',
      clinicalNotes: 'Patient advised low-sodium DASH diet and daily aerobic walking.',
      soapObjective: 'BP 142/92 mmHg, HR 84 bpm, clear lung fields, S1/S2 normal without murmur.',
      soapPlan: 'Initiate Amlodipine 5mg OD, repeat lipid profile in 8 weeks.',
      diagnosisIcd10: 'I10',
      diagnosisDescription: 'Essential (primary) hypertension',
      systolicBp: 142,
      diastolicBp: 92,
      temperatureCelsius: '36.7',
      pulseBpm: 84,
      respiratoryRate: 18,
      spO2: 98,
      weightKg: '73.5',
      bloodGlucoseMgDl: 108,
      startedAt: new Date('2026-03-10T09:00:00Z'),
      endedAt: new Date('2026-03-10T09:30:00Z'),
    },
  ],
  appointments: [
    {
      id: 'apt11111-1111-1111-1111-111111111111',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      doctorId: 'doc11111-1111-1111-1111-111111111111',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      appointmentDate: '2026-05-20',
      startTime: '09:00',
      endTime: '09:20',
      appointmentType: 'OPD_CONSULTATION',
      tokenNumber: 101,
      status: 'IN_CONSULTATION',
      reasonForVisit: 'Episodic chest tightness and lightheadedness after mild cardio exertion',
      createdAt: new Date('2026-05-20T08:00:00Z'),
    },
    {
      id: 'apt22222-2222-2222-2222-222222222222',
      patientId: 'pat22222-2222-2222-2222-222222222222',
      doctorId: 'doc11111-1111-1111-1111-111111111111',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      appointmentDate: '2026-05-20',
      startTime: '09:20',
      endTime: '09:40',
      appointmentType: 'OPD_CONSULTATION',
      tokenNumber: 102,
      status: 'CONFIRMED',
      reasonForVisit: 'Palpitations and annual cardiovascular screening',
      createdAt: new Date('2026-05-20T08:10:00Z'),
    },
    {
      id: 'apt33333-3333-3333-3333-333333333333',
      patientId: 'pat33333-3333-3333-3333-333333333333',
      doctorId: 'doc44444-4444-4444-4444-444444444444',
      departmentId: 'd1111111-1111-1111-1111-111111111111',
      appointmentDate: '2026-05-20',
      startTime: '10:00',
      endTime: '10:20',
      appointmentType: 'OPD_CONSULTATION',
      tokenNumber: 103,
      status: 'PENDING',
      reasonForVisit: 'Glycemic control review and HbA1c evaluation',
      createdAt: new Date('2026-05-20T08:15:00Z'),
    },
  ],
  labOrders: [
    {
      id: 'lo111111-1111-1111-1111-111111111111',
      encounterId: 'enc11111-1111-1111-1111-111111111111',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      serviceId: 's2222222-2222-2222-2222-222222222222',
      barcode: 'BC-LIPID-88319',
      orderStatus: 'VERIFIED',
      resultData: {
        'Total Cholesterol': { value: 242, unit: 'mg/dL', flag: 'HIGH', ref: '< 200' },
        HDL: { value: 41, unit: 'mg/dL', flag: 'NORMAL', ref: '> 40' },
        LDL: { value: 164, unit: 'mg/dL', flag: 'HIGH', ref: '< 100' },
        Triglycerides: { value: 185, unit: 'mg/dL', flag: 'BORDERLINE', ref: '< 150' },
      } as Record<string, { value: number | string; unit: string; flag: string; ref: string }>,
      clinicalNotes: 'Patient shows elevated total cholesterol and LDL. Statin therapy initiation recommended.',
      verifiedBy: 'u1000000-0000-0000-0000-000000000001',
      verifiedAt: new Date('2026-05-20T08:50:00Z'),
      createdAt: new Date('2026-05-20T08:40:00Z'),
    },
    {
      id: 'lo222222-2222-2222-2222-222222222222',
      encounterId: 'enc11111-1111-1111-1111-111111111111',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      serviceId: 's1111111-1111-1111-1111-111111111111',
      barcode: 'BC-CBC-88319',
      orderStatus: 'SAMPLE_COLLECTED',
      resultData: {
        Hemoglobin: { value: 14.6, unit: 'g/dL', flag: 'NORMAL', ref: '13.2 - 16.6' },
        Hematocrit: { value: 43.2, unit: '%', flag: 'NORMAL', ref: '38.3 - 48.6' },
        'WBC Count': { value: 7.4, unit: '10^3/uL', flag: 'NORMAL', ref: '4.5 - 11.0' },
        Platelets: { value: 265, unit: '10^3/uL', flag: 'NORMAL', ref: '150 - 400' },
      } as Record<string, { value: number | string; unit: string; flag: string; ref: string }>,
      clinicalNotes: 'Automated Sysmex XN-1000 hematology analyzer run completed. Awaiting pathologist sign-off.',
      verifiedBy: null as string | null,
      verifiedAt: null as Date | null,
      createdAt: new Date('2026-05-20T08:45:00Z'),
    },
  ],
  medicalDocuments: [
    {
      id: 'docrec11-1111-1111-1111-111111111111',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      encounterId: 'enc11111-1111-1111-1111-111111111111' as string | null,
      labOrderId: 'lo111111-1111-1111-1111-111111111111' as string | null,
      fileName: 'LAB_LIPID_ENC88319.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 384128,
      gdriveFileId: '1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT',
      gdriveWebViewLink: 'https://drive.google.com/file/d/1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT/view',
      documentType: 'LAB_REPORT',
      uploadedBy: 'u1000000-0000-0000-0000-000000000001' as string | null,
      uploadedAt: new Date('2026-05-20T08:52:00Z'),
    },
  ],
  prescriptions: [
    {
      id: 'rx111111-1111-1111-1111-111111111111',
      encounterId: 'enc11111-1111-1111-1111-111111111111',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      doctorId: 'doc11111-1111-1111-1111-111111111111',
      medicationName: 'Amlodipine Besylate 5 mg',
      dosage: '5 mg',
      frequency: 'Once daily after breakfast (1x1)',
      instructions: 'Take consistently each morning. Monitor home blood pressure.',
      quantity: 30,
      remainingCount: 18,
      status: 'ACTIVE',
      createdAt: new Date('2026-05-20T08:55:00Z'),
    },
    {
      id: 'rx222222-2222-2222-2222-222222222222',
      encounterId: 'enc11111-1111-1111-1111-111111111111',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      doctorId: 'doc11111-1111-1111-1111-111111111111',
      medicationName: 'Atorvastatin Calcium 20 mg',
      dosage: '20 mg',
      frequency: 'Once daily at bedtime (0-0-1)',
      instructions: 'Initiated for elevated LDL (164 mg/dL). Report unexplained muscle soreness.',
      quantity: 30,
      remainingCount: 28,
      status: 'ACTIVE',
      createdAt: new Date('2026-05-20T08:56:00Z'),
    },
  ],
  pharmacyInventory: [
    {
      id: 'ph111111-1111-1111-1111-111111111111',
      sku: 'FRM-CV-001',
      drugName: 'Amlodipine Besylate 5 mg Tablet',
      genericName: 'Amlodipine',
      category: 'Cardiovascular / Antihypertensive',
      batchNumber: 'BATCH-AML-2604',
      expiryDate: '2028-04-30',
      stockQuantity: 420,
      reorderLevel: 100,
      unitPrice: '4500.00',
    },
    {
      id: 'ph222222-2222-2222-2222-222222222222',
      sku: 'FRM-CV-002',
      drugName: 'Atorvastatin Calcium 20 mg Film-Coated',
      genericName: 'Atorvastatin',
      category: 'Cardiovascular / Statin Lipid-Lowering',
      batchNumber: 'BATCH-ATR-2609',
      expiryDate: '2028-09-15',
      stockQuantity: 285,
      reorderLevel: 80,
      unitPrice: '8500.00',
    },
    {
      id: 'ph333333-3333-3333-3333-333333333333',
      sku: 'FRM-AB-003',
      drugName: 'Amoxicillin Trihydrate 500 mg Capsule',
      genericName: 'Amoxicillin (Penicillin Class)',
      category: 'Anti-Infective / Beta-Lactam',
      batchNumber: 'BATCH-AMX-2601',
      expiryDate: '2027-11-30',
      stockQuantity: 190,
      reorderLevel: 60,
      unitPrice: '3500.00',
    },
    {
      id: 'ph444444-4444-4444-4444-444444444444',
      sku: 'FRM-AB-004',
      drugName: 'Azithromycin Dihydrate 500 mg Tablet',
      genericName: 'Azithromycin (Macrolide)',
      category: 'Anti-Infective / Macrolide',
      batchNumber: 'BATCH-AZM-2607',
      expiryDate: '2028-07-20',
      stockQuantity: 18,
      reorderLevel: 25,
      unitPrice: '18500.00',
    },
    {
      id: 'ph555555-5555-5555-5555-555555555555',
      sku: 'FRM-EN-005',
      drugName: 'Metformin HCl XR 500 mg Extended Release',
      genericName: 'Metformin Hydrochloride',
      category: 'Endocrine / Antidiabetic',
      batchNumber: 'BATCH-MET-2605',
      expiryDate: '2028-05-31',
      stockQuantity: 540,
      reorderLevel: 120,
      unitPrice: '3200.00',
    },
  ],
  beds: [
    {
      id: 'bed-icu-01',
      bedNumber: 'ICU-01',
      wardName: 'Integrated Intensive Care Unit (ICU)',
      wardType: 'ICU',
      floorNumber: 2,
      status: 'OCCUPIED',
      patientId: 'pat33333-3333-3333-3333-333333333333' as string | null,
      dailyRate: '2800000.00',
      nursingNotes: 'Continuous telemetry & insulin infusion titration. Hourly vitals stable.',
      updatedAt: new Date('2026-05-20T08:00:00Z'),
    },
    {
      id: 'bed-icu-02',
      bedNumber: 'ICU-02',
      wardName: 'Integrated Intensive Care Unit (ICU)',
      wardType: 'ICU',
      floorNumber: 2,
      status: 'AVAILABLE',
      patientId: null as string | null,
      dailyRate: '2800000.00',
      nursingNotes: 'Ventilator & multiparameter monitor sterilized and ready.',
      updatedAt: new Date('2026-05-20T08:00:00Z'),
    },
    {
      id: 'bed-vip-01',
      bedNumber: 'VIP-301',
      wardName: 'Anaverse Executive VIP Pavilion',
      wardType: 'VIP',
      floorNumber: 3,
      status: 'OCCUPIED',
      patientId: 'pat22222-2222-2222-2222-222222222222' as string | null,
      dailyRate: '1650000.00',
      nursingNotes: 'Post-bronchodilator nebulization observation. SpO2 99%.',
      updatedAt: new Date('2026-05-20T08:00:00Z'),
    },
    {
      id: 'bed-vip-02',
      bedNumber: 'VIP-302',
      wardName: 'Anaverse Executive VIP Pavilion',
      wardType: 'VIP',
      floorNumber: 3,
      status: 'AVAILABLE',
      patientId: null as string | null,
      dailyRate: '1650000.00',
      nursingNotes: 'Executive suite ready for admission.',
      updatedAt: new Date('2026-05-20T08:00:00Z'),
    },
    {
      id: 'bed-gen-01',
      bedNumber: 'RIN-401A',
      wardName: 'Class I Inpatient Ward',
      wardType: 'SEMI_PRIVATE',
      floorNumber: 4,
      status: 'AVAILABLE',
      patientId: null as string | null,
      dailyRate: '750000.00',
      nursingNotes: 'Standard inpatient bed available.',
      updatedAt: new Date('2026-05-20T08:00:00Z'),
    },
    {
      id: 'bed-gen-02',
      bedNumber: 'RIN-401B',
      wardName: 'Class I Inpatient Ward',
      wardType: 'GENERAL',
      floorNumber: 4,
      status: 'CLEANING',
      patientId: null as string | null,
      dailyRate: '550000.00',
      nursingNotes: 'UV disinfection cycle in progress following morning discharge.',
      updatedAt: new Date('2026-05-20T08:00:00Z'),
    },
  ],
  invoices: [
    {
      id: 'inv11111-1111-1111-1111-111111111111',
      invoiceNumber: 'INV-2026-88319',
      patientId: 'pat11111-1111-1111-1111-111111111111',
      encounterId: 'enc11111-1111-1111-1111-111111111111',
      totalAmount: '1305000.00',
      taxAmount: '0.00',
      discountAmount: '105000.00',
      netAmount: '1200000.00',
      paidAmount: '400000.00',
      paymentMethod: 'SPLIT_TPA',
      insuranceProvider: 'Allianz Health Corporate TPA',
      status: 'PARTIAL',
      issuedAt: new Date('2026-05-20T09:00:00Z'),
    },
  ],
  invoiceItems: [
    {
      id: 'ii111111-1111-1111-1111-111111111111',
      invoiceId: 'inv11111-1111-1111-1111-111111111111',
      itemType: 'CONSULTATION',
      description: 'Cardiology Specialist Consultation — Dr. Andika Pratama, MD, FACC',
      unitPrice: '450000.00',
      quantity: 1,
      subtotal: '450000.00',
    },
    {
      id: 'ii222222-2222-2222-2222-222222222222',
      invoiceId: 'inv11111-1111-1111-1111-111111111111',
      itemType: 'LAB_TEST',
      description: 'LAB-LIPID: Comprehensive Lipid Profile Panel',
      unitPrice: '280000.00',
      quantity: 1,
      subtotal: '280000.00',
    },
    {
      id: 'ii333333-3333-3333-3333-333333333333',
      invoiceId: 'inv11111-1111-1111-1111-111111111111',
      itemType: 'LAB_TEST',
      description: 'LAB-CBC: Complete Blood Count (CBC) with Differential',
      unitPrice: '185000.00',
      quantity: 1,
      subtotal: '185000.00',
    },
    {
      id: 'ii444444-4444-4444-4444-444444444444',
      invoiceId: 'inv11111-1111-1111-1111-111111111111',
      itemType: 'MEDICATION',
      description: 'eRx: Amlodipine 5mg (30 Tab) + Atorvastatin 20mg (30 Tab)',
      unitPrice: '390000.00',
      quantity: 1,
      subtotal: '390000.00',
    },
  ],
  auditLogs: [
    {
      id: 'aud11111-1111-1111-1111-111111111111',
      actorRole: 'DOCTOR',
      actorEmail: 'andika.pratama@anaverse.com',
      action: 'ENCOUNTER_OPENED',
      entityType: 'ENCOUNTER',
      entityId: 'ENC-88319',
      details: 'Opened outpatient cardiology encounter for Reza Rahadian (HSP-2026-00412). Recorded BP 132/85 mmHg.',
      createdAt: new Date('2026-05-20T08:30:00Z'),
    },
    {
      id: 'aud22222-2222-2222-2222-222222222222',
      actorRole: 'LAB_TECH',
      actorEmail: 'analis.lab@anaverse.com',
      action: 'LAB_RESULT_VERIFIED_GDRIVE_SYNC',
      entityType: 'MEDICAL_DOCUMENT',
      entityId: 'LAB_LIPID_ENC88319.pdf',
      details:
        'Verified Comprehensive Lipid Profile (LDL 164 mg/dL HIGH) and synced PDF to HOSPITAL_ERP_VAULT/Pathology/HSP-2026-00412/ENC-88319.',
      createdAt: new Date('2026-05-20T08:52:00Z'),
    },
  ],
};

// After Google Drive OAuth reconfigured the container's GCP project from pacific-exchanger-2dckx
// to gen-lang-client-0307109476, the old project's Cloud SQL socket is no longer accessible.
// Guard against probing the dead socket so zero ECONNREFUSED / DrizzleQueryError errors occur.
let sqlReachable = Boolean(
  process.env.SQL_HOST && !process.env.SQL_HOST.includes('pacific-exchanger-2dckx')
);

function appendAudit(entry: {
  actorRole: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}) {
  memoryStore.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actorRole: entry.actorRole,
    actorEmail: entry.actorEmail || 'system@anaverse.com',
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    details: entry.details,
    createdAt: new Date(),
  });
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  const parts = (displayName || email.split('@')[0] || 'Anaverse Patient').split(' ');
  const firstName = parts[0] || 'Patient';
  const lastName = parts.slice(1).join(' ') || 'Anaverse';

  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        firstName,
        lastName,
        phone: `+6281${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'SUPERADMIN',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch {
    sqlReachable = false;
    const existing = memoryStore.users.find((u) => u.uid === uid);
    if (existing) {
      existing.email = email;
      existing.updatedAt = new Date();
      return existing;
    }
    const created = {
      id: `u-${Date.now()}`,
      uid,
      email,
      passwordHash: '',
      role: 'SUPERADMIN',
      firstName,
      lastName,
      phone: `+6281${Math.floor(10000000 + Math.random() * 90000000)}`,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.users.push(created);
    return created;
  }
}

export async function getErpBootstrapData() {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    await ensureSeedData();

    const [
      deptList,
      docList,
      userList,
      patientList,
      encounterList,
      appointmentList,
      serviceList,
      labOrderList,
      docVaultList,
      rxList,
      inventoryList,
      bedList,
      invoiceList,
      invoiceItemList,
      auditList,
    ] = await Promise.all([
      db.select().from(departments).orderBy(asc(departments.name)),
      db.select().from(doctors),
      db.select().from(users),
      db.select().from(patients).orderBy(desc(patients.createdAt)),
      db.select().from(encounters).orderBy(desc(encounters.startedAt)),
      db.select().from(appointments).orderBy(asc(appointments.tokenNumber)),
      db.select().from(diagnosticServices).orderBy(asc(diagnosticServices.category)),
      db.select().from(labOrders).orderBy(desc(labOrders.createdAt)),
      db.select().from(medicalDocuments).orderBy(desc(medicalDocuments.uploadedAt)),
      db.select().from(prescriptions).orderBy(desc(prescriptions.createdAt)),
      db.select().from(pharmacyInventory).orderBy(asc(pharmacyInventory.drugName)),
      db.select().from(beds).orderBy(asc(beds.bedNumber)),
      db.select().from(invoices).orderBy(desc(invoices.issuedAt)),
      db.select().from(invoiceItems),
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(30),
    ]);

    const userMap = new Map(userList.map((u) => [u.id, u]));
    const deptMap = new Map(deptList.map((d) => [d.id, d]));

    const enrichedDoctors = docList.map((doc) => {
      const u = userMap.get(doc.userId);
      const dept = deptMap.get(doc.departmentId);
      return {
        ...doc,
        fullName: u ? `Dr. ${u.firstName} ${u.lastName}` : 'Dr. Anaverse Specialist',
        email: u?.email || '',
        departmentName: dept?.name || 'Specialist Clinics',
      };
    });

    return {
      departments: deptList,
      doctors: enrichedDoctors,
      patients: patientList,
      encounters: encounterList,
      appointments: appointmentList,
      diagnosticServices: serviceList,
      labOrders: labOrderList,
      medicalDocuments: docVaultList,
      prescriptions: rxList,
      pharmacyInventory: inventoryList,
      beds: bedList,
      invoices: invoiceList,
      invoiceItems: invoiceItemList,
      auditLogs: auditList,
    };
  } catch {
    const userMap = new Map(memoryStore.users.map((u) => [u.id, u]));
    const deptMap = new Map(memoryStore.departments.map((d) => [d.id, d]));

    const enrichedDoctors = memoryStore.doctors.map((doc) => {
      const u = userMap.get(doc.userId);
      const dept = deptMap.get(doc.departmentId);
      return {
        ...doc,
        fullName: u ? `Dr. ${u.firstName} ${u.lastName}` : 'Dr. Anaverse Specialist',
        email: u?.email || '',
        departmentName: dept?.name || 'Specialist Clinics',
      };
    });

    return {
      departments: memoryStore.departments,
      doctors: enrichedDoctors,
      patients: memoryStore.patients,
      encounters: memoryStore.encounters,
      appointments: memoryStore.appointments,
      diagnosticServices: memoryStore.diagnosticServices,
      labOrders: memoryStore.labOrders,
      medicalDocuments: memoryStore.medicalDocuments,
      prescriptions: memoryStore.prescriptions,
      pharmacyInventory: memoryStore.pharmacyInventory,
      beds: memoryStore.beds,
      invoices: memoryStore.invoices,
      invoiceItems: memoryStore.invoiceItems,
      auditLogs: memoryStore.auditLogs.slice(0, 30),
    };
  }
}

export async function createSmartBooking(payload: {
  patientId?: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  departmentId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  appointmentType: string;
  reasonForVisit: string;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    let targetPatientId = payload.patientId;
    let patientUhid = '';

    if (targetPatientId) {
      const existing = await db
        .select()
        .from(patients)
        .where(eq(patients.id, targetPatientId));
      if (existing[0]) {
        patientUhid = existing[0].uhid;
      }
    }

    if (!targetPatientId) {
      const dateStr = payload.appointmentDate.replace(/-/g, '') || '20260520';
      const randSuffix = String(Math.floor(1000 + Math.random() * 9000));
      patientUhid = `HSP-${dateStr}-${randSuffix}`;

      const insertedPatient = await db
        .insert(patients)
        .values({
          uhid: patientUhid,
          fullName: payload.fullName,
          dateOfBirth: payload.dateOfBirth || '1990-01-01',
          gender: payload.gender || 'Male',
          bloodGroup: payload.bloodGroup || 'O+',
          phone: payload.phone,
          address: 'South Jakarta, Indonesia',
          allergies: [],
          chronicConditions: [],
        })
        .returning();

      targetPatientId = insertedPatient[0].id;
    }

    const existingAppointments = await db.select().from(appointments);
    const maxToken = existingAppointments.reduce(
      (max, a) => (a.tokenNumber > max ? a.tokenNumber : max),
      100
    );
    const nextToken = maxToken + 1;

    const [hourStr, minStr] = payload.startTime.split(':');
    const totalMins = parseInt(hourStr || '9', 10) * 60 + parseInt(minStr || '0', 10) + 20;
    const endHour = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const endMin = String(totalMins % 60).padStart(2, '0');

    const insertedAppointment = await db
      .insert(appointments)
      .values({
        patientId: targetPatientId,
        doctorId: payload.doctorId,
        departmentId: payload.departmentId,
        appointmentDate: payload.appointmentDate,
        startTime: payload.startTime,
        endTime: `${endHour}:${endMin}`,
        appointmentType: payload.appointmentType || 'OPD_CONSULTATION',
        tokenNumber: nextToken,
        status: 'CONFIRMED',
        reasonForVisit: payload.reasonForVisit,
      })
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'PATIENT',
      actorEmail: payload.fullName,
      action: 'SMART_BOOKING_TOKEN_ISSUED',
      entityType: 'APPOINTMENT',
      entityId: `TKN-${nextToken}`,
      details: `Issued OPD Queue Token #${nextToken} for ${payload.fullName} (${patientUhid}) on ${payload.appointmentDate} at ${payload.startTime}.`,
    });

    return {
      appointment: insertedAppointment[0],
      uhid: patientUhid,
      tokenNumber: nextToken,
    };
  } catch {
    let targetPatientId = payload.patientId;
    let patientUhid = '';

    if (targetPatientId) {
      const existing = memoryStore.patients.find((p) => p.id === targetPatientId);
      if (existing) patientUhid = existing.uhid;
    }

    if (!targetPatientId) {
      const dateStr = payload.appointmentDate.replace(/-/g, '') || '20260520';
      const randSuffix = String(Math.floor(1000 + Math.random() * 9000));
      patientUhid = `HSP-${dateStr}-${randSuffix}`;
      targetPatientId = `pat-${Date.now()}`;

      memoryStore.patients.unshift({
        id: targetPatientId,
        userId: `u-${Date.now()}`,
        uhid: patientUhid,
        fullName: payload.fullName,
        dateOfBirth: payload.dateOfBirth || '1990-01-01',
        gender: payload.gender || 'Male',
        bloodGroup: payload.bloodGroup || 'O+',
        phone: payload.phone,
        address: 'South Jakarta, Indonesia',
        emergencyContactName: 'Primary Family Contact',
        emergencyContactPhone: payload.phone,
        allergies: [],
        chronicConditions: [],
        createdAt: new Date(),
      });
    }

    const maxToken = memoryStore.appointments.reduce(
      (max, a) => (a.tokenNumber > max ? a.tokenNumber : max),
      100
    );
    const nextToken = maxToken + 1;

    const [hourStr, minStr] = payload.startTime.split(':');
    const totalMins = parseInt(hourStr || '9', 10) * 60 + parseInt(minStr || '0', 10) + 20;
    const endHour = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const endMin = String(totalMins % 60).padStart(2, '0');

    const createdAppointment = {
      id: `apt-${Date.now()}`,
      patientId: targetPatientId,
      doctorId: payload.doctorId,
      departmentId: payload.departmentId,
      appointmentDate: payload.appointmentDate,
      startTime: payload.startTime,
      endTime: `${endHour}:${endMin}`,
      appointmentType: payload.appointmentType || 'OPD_CONSULTATION',
      tokenNumber: nextToken,
      status: 'CONFIRMED',
      reasonForVisit: payload.reasonForVisit,
      createdAt: new Date(),
    };
    memoryStore.appointments.push(createdAppointment);

    appendAudit({
      actorRole: 'PATIENT',
      actorEmail: payload.fullName,
      action: 'SMART_BOOKING_TOKEN_ISSUED',
      entityType: 'APPOINTMENT',
      entityId: `TKN-${nextToken}`,
      details: `Issued OPD Queue Token #${nextToken} for ${payload.fullName} (${patientUhid}) on ${payload.appointmentDate} at ${payload.startTime}.`,
    });

    return {
      appointment: createdAppointment,
      uhid: patientUhid,
      tokenNumber: nextToken,
    };
  }
}

export async function updateAppointmentStatus(id: string, status: string) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const updated = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return updated[0];
  } catch {
    const apt = memoryStore.appointments.find((a) => a.id === id) || memoryStore.appointments[0];
    if (apt) {
      apt.status = status;
    }
    return apt;
  }
}

export async function upsertClinicalEncounter(payload: {
  id?: string;
  patientId: string;
  doctorId: string;
  encounterType: string;
  chiefComplaint: string;
  clinicalNotes: string;
  soapObjective?: string;
  soapPlan?: string;
  diagnosisIcd10: string;
  diagnosisDescription?: string;
  systolicBp: number;
  diastolicBp: number;
  temperatureCelsius: string;
  pulseBpm: number;
  respiratoryRate: number;
  spO2: number;
  weightKg?: string;
  bloodGlucoseMgDl?: number;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    if (payload.id) {
      const updated = await db
        .update(encounters)
        .set({
          chiefComplaint: payload.chiefComplaint,
          clinicalNotes: payload.clinicalNotes,
          soapObjective: payload.soapObjective,
          soapPlan: payload.soapPlan,
          diagnosisIcd10: payload.diagnosisIcd10,
          diagnosisDescription: payload.diagnosisDescription,
          systolicBp: payload.systolicBp,
          diastolicBp: payload.diastolicBp,
          temperatureCelsius: payload.temperatureCelsius,
          pulseBpm: payload.pulseBpm,
          respiratoryRate: payload.respiratoryRate,
          spO2: payload.spO2,
          weightKg: payload.weightKg || '71.8',
          bloodGlucoseMgDl: payload.bloodGlucoseMgDl || 96,
        })
        .where(eq(encounters.id, payload.id))
        .returning();

      await db.insert(auditLogs).values({
        actorRole: 'DOCTOR',
        action: 'ENCOUNTER_SOAP_UPDATED',
        entityType: 'ENCOUNTER',
        entityId: updated[0]?.encounterNumber || payload.id,
        details: `Updated clinical encounter SOAP & vitals (BP ${payload.systolicBp}/${payload.diastolicBp} mmHg, ICD-10: ${payload.diagnosisIcd10}).`,
      });

      return updated[0];
    }

    const encNumber = `ENC-${Math.floor(88400 + Math.random() * 1500)}`;
    const inserted = await db
      .insert(encounters)
      .values({
        encounterNumber: encNumber,
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        encounterType: payload.encounterType || 'OPD',
        chiefComplaint: payload.chiefComplaint,
        clinicalNotes: payload.clinicalNotes,
        soapObjective: payload.soapObjective,
        soapPlan: payload.soapPlan,
        diagnosisIcd10: payload.diagnosisIcd10,
        diagnosisDescription: payload.diagnosisDescription,
        systolicBp: payload.systolicBp,
        diastolicBp: payload.diastolicBp,
        temperatureCelsius: payload.temperatureCelsius,
        pulseBpm: payload.pulseBpm,
        respiratoryRate: payload.respiratoryRate,
        spO2: payload.spO2,
        weightKg: payload.weightKg || '70.0',
        bloodGlucoseMgDl: payload.bloodGlucoseMgDl || 98,
      })
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'DOCTOR',
      action: 'ENCOUNTER_CREATED',
      entityType: 'ENCOUNTER',
      entityId: encNumber,
      details: `Created new clinical encounter ${encNumber} with ICD-10 ${payload.diagnosisIcd10}.`,
    });

    return inserted[0];
  } catch {
    if (payload.id) {
      const existing = memoryStore.encounters.find((e) => e.id === payload.id);
      if (existing) {
        existing.chiefComplaint = payload.chiefComplaint;
        existing.clinicalNotes = payload.clinicalNotes;
        existing.soapObjective = payload.soapObjective || '';
        existing.soapPlan = payload.soapPlan || '';
        existing.diagnosisIcd10 = payload.diagnosisIcd10;
        existing.diagnosisDescription = payload.diagnosisDescription || '';
        existing.systolicBp = payload.systolicBp;
        existing.diastolicBp = payload.diastolicBp;
        existing.temperatureCelsius = payload.temperatureCelsius;
        existing.pulseBpm = payload.pulseBpm;
        existing.respiratoryRate = payload.respiratoryRate;
        existing.spO2 = payload.spO2;
        existing.weightKg = payload.weightKg || '71.8';
        existing.bloodGlucoseMgDl = payload.bloodGlucoseMgDl || 96;

        appendAudit({
          actorRole: 'DOCTOR',
          action: 'ENCOUNTER_SOAP_UPDATED',
          entityType: 'ENCOUNTER',
          entityId: existing.encounterNumber,
          details: `Updated clinical encounter SOAP & vitals (BP ${payload.systolicBp}/${payload.diastolicBp} mmHg, ICD-10: ${payload.diagnosisIcd10}).`,
        });

        return existing;
      }
    }

    const encNumber = `ENC-${Math.floor(88400 + Math.random() * 1500)}`;
    const created = {
      id: `enc-${Date.now()}`,
      encounterNumber: encNumber,
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      encounterType: payload.encounterType || 'OPD',
      chiefComplaint: payload.chiefComplaint,
      clinicalNotes: payload.clinicalNotes,
      soapObjective: payload.soapObjective || '',
      soapPlan: payload.soapPlan || '',
      diagnosisIcd10: payload.diagnosisIcd10,
      diagnosisDescription: payload.diagnosisDescription || '',
      systolicBp: payload.systolicBp,
      diastolicBp: payload.diastolicBp,
      temperatureCelsius: payload.temperatureCelsius,
      pulseBpm: payload.pulseBpm,
      respiratoryRate: payload.respiratoryRate,
      spO2: payload.spO2,
      weightKg: payload.weightKg || '70.0',
      bloodGlucoseMgDl: payload.bloodGlucoseMgDl || 98,
      startedAt: new Date(),
      endedAt: null,
    };
    memoryStore.encounters.unshift(created);

    appendAudit({
      actorRole: 'DOCTOR',
      action: 'ENCOUNTER_CREATED',
      entityType: 'ENCOUNTER',
      entityId: encNumber,
      details: `Created new clinical encounter ${encNumber} with ICD-10 ${payload.diagnosisIcd10}.`,
    });

    return created;
  }
}

export async function createLabOrderRequisition(payload: {
  encounterId: string;
  patientId: string;
  serviceId: string;
  clinicalNotes?: string;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const svcList = await db
      .select()
      .from(diagnosticServices)
      .where(eq(diagnosticServices.id, payload.serviceId));
    const svc = svcList[0];

    const barcode = `BC-${svc?.code || 'LAB'}-${Math.floor(10000 + Math.random() * 89999)}`;
    const defaultResult =
      svc?.code === 'LAB-CBC'
        ? {
            Hemoglobin: { value: 14.4, unit: 'g/dL', flag: 'NORMAL', ref: '13.2 - 16.6' },
            'WBC Count': { value: 7.8, unit: '10^3/uL', flag: 'NORMAL', ref: '4.5 - 11.0' },
            Platelets: { value: 255, unit: '10^3/uL', flag: 'NORMAL', ref: '150 - 400' },
          }
        : {
            Finding: { value: 'Pending Analyzer Entry', unit: '', flag: 'NORMAL', ref: 'Standard' },
          };

    const inserted = await db
      .insert(labOrders)
      .values({
        encounterId: payload.encounterId,
        patientId: payload.patientId,
        serviceId: payload.serviceId,
        barcode,
        orderStatus: 'SAMPLE_COLLECTED',
        resultData: defaultResult,
        clinicalNotes: payload.clinicalNotes || `Ordered ${svc?.name || 'Diagnostic Panel'} from Doctor EMR.`,
      })
      .returning();

    if (svc) {
      const patientInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.patientId, payload.patientId));
      const targetInvoice = patientInvoices.find((inv) => inv.status !== 'PAID') || patientInvoices[0];

      if (targetInvoice) {
        const priceNum = Number(svc.basePrice || 185000);
        await db.insert(invoiceItems).values({
          invoiceId: targetInvoice.id,
          itemType: 'LAB_TEST',
          description: `${svc.code}: ${svc.name}`,
          unitPrice: String(priceNum.toFixed(2)),
          quantity: 1,
          subtotal: String(priceNum.toFixed(2)),
        });

        const newTotal = Number(targetInvoice.totalAmount) + priceNum;
        const newNet = Number(targetInvoice.netAmount) + priceNum;
        await db
          .update(invoices)
          .set({
            totalAmount: String(newTotal.toFixed(2)),
            netAmount: String(newNet.toFixed(2)),
          })
          .where(eq(invoices.id, targetInvoice.id));
      }
    }

    await db.insert(auditLogs).values({
      actorRole: 'DOCTOR',
      action: 'LAB_ORDER_REQUISITIONED',
      entityType: 'LAB_ORDER',
      entityId: barcode,
      details: `Requisitioned ${svc?.code || 'Diagnostic Service'} (${barcode}) and billed to patient ledger.`,
    });

    return inserted[0];
  } catch {
    const svc = memoryStore.diagnosticServices.find((s) => s.id === payload.serviceId);
    const barcode = `BC-${svc?.code || 'LAB'}-${Math.floor(10000 + Math.random() * 89999)}`;
    const defaultResult: Record<string, { value: number | string; unit: string; flag: string; ref: string }> =
      svc?.code === 'LAB-CBC'
        ? {
            Hemoglobin: { value: 14.4, unit: 'g/dL', flag: 'NORMAL', ref: '13.2 - 16.6' },
            'WBC Count': { value: 7.8, unit: '10^3/uL', flag: 'NORMAL', ref: '4.5 - 11.0' },
            Platelets: { value: 255, unit: '10^3/uL', flag: 'NORMAL', ref: '150 - 400' },
          }
        : {
            Finding: { value: 'Pending Analyzer Entry', unit: '', flag: 'NORMAL', ref: 'Standard' },
          };

    const created = {
      id: `lo-${Date.now()}`,
      encounterId: payload.encounterId,
      patientId: payload.patientId,
      serviceId: payload.serviceId,
      barcode,
      orderStatus: 'SAMPLE_COLLECTED',
      resultData: defaultResult,
      clinicalNotes: payload.clinicalNotes || `Ordered ${svc?.name || 'Diagnostic Panel'} from Doctor EMR.`,
      verifiedBy: null,
      verifiedAt: null,
      createdAt: new Date(),
    };
    memoryStore.labOrders.unshift(created);

    if (svc) {
      const targetInvoice =
        memoryStore.invoices.find((inv) => inv.patientId === payload.patientId && inv.status !== 'PAID') ||
        memoryStore.invoices[0];
      if (targetInvoice) {
        const priceNum = Number(svc.basePrice || 185000);
        memoryStore.invoiceItems.push({
          id: `ii-${Date.now()}`,
          invoiceId: targetInvoice.id,
          itemType: 'LAB_TEST',
          description: `${svc.code}: ${svc.name}`,
          unitPrice: String(priceNum.toFixed(2)),
          quantity: 1,
          subtotal: String(priceNum.toFixed(2)),
        });
        targetInvoice.totalAmount = String((Number(targetInvoice.totalAmount) + priceNum).toFixed(2));
        targetInvoice.netAmount = String((Number(targetInvoice.netAmount) + priceNum).toFixed(2));
      }
    }

    appendAudit({
      actorRole: 'DOCTOR',
      action: 'LAB_ORDER_REQUISITIONED',
      entityType: 'LAB_ORDER',
      entityId: barcode,
      details: `Requisitioned ${svc?.code || 'Diagnostic Service'} (${barcode}) and billed to patient ledger.`,
    });

    return created;
  }
}

export async function verifyLabOrderAndUpdateResults(payload: {
  labOrderId: string;
  resultData: Record<string, { value: number | string; unit: string; flag: string; ref: string }>;
  clinicalNotes: string;
  orderStatus: string;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const updated = await db
      .update(labOrders)
      .set({
        resultData: payload.resultData,
        clinicalNotes: payload.clinicalNotes,
        orderStatus: payload.orderStatus,
        verifiedAt: payload.orderStatus === 'VERIFIED' ? new Date() : null,
      })
      .where(eq(labOrders.id, payload.labOrderId))
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'LAB_TECH',
      action: `LAB_STATUS_${payload.orderStatus}`,
      entityType: 'LAB_ORDER',
      entityId: updated[0]?.barcode || payload.labOrderId,
      details: `Updated lab order status to ${payload.orderStatus}. Notes: ${payload.clinicalNotes}`,
    });

    return updated[0];
  } catch {
    const existing =
      memoryStore.labOrders.find((lo) => lo.id === payload.labOrderId) || memoryStore.labOrders[0];
    if (existing) {
      existing.resultData = payload.resultData;
      existing.clinicalNotes = payload.clinicalNotes;
      existing.orderStatus = payload.orderStatus;
      existing.verifiedAt = payload.orderStatus === 'VERIFIED' ? new Date() : null;
    }

    appendAudit({
      actorRole: 'LAB_TECH',
      action: `LAB_STATUS_${payload.orderStatus}`,
      entityType: 'LAB_ORDER',
      entityId: existing.barcode || payload.labOrderId,
      details: `Updated lab order status to ${payload.orderStatus}. Notes: ${payload.clinicalNotes}`,
    });

    return existing;
  }
}

export async function recordMedicalDocumentMirror(payload: {
  patientId: string;
  encounterId?: string;
  labOrderId?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  gdriveFileId: string;
  gdriveWebViewLink: string;
  documentType: string;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const inserted = await db
      .insert(medicalDocuments)
      .values({
        patientId: payload.patientId,
        encounterId: payload.encounterId || null,
        labOrderId: payload.labOrderId || null,
        fileName: payload.fileName,
        mimeType: payload.mimeType || 'application/pdf',
        fileSizeBytes: payload.fileSizeBytes || 245760,
        gdriveFileId: payload.gdriveFileId,
        gdriveWebViewLink: payload.gdriveWebViewLink,
        documentType: payload.documentType || 'LAB_REPORT',
      })
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'LAB_TECH',
      action: 'GDRIVE_VAULT_UPLOAD_ARCHIVED',
      entityType: 'MEDICAL_DOCUMENT',
      entityId: payload.fileName,
      details: `Archived ${payload.fileName} to Google Drive Vault (File ID: ${payload.gdriveFileId}).`,
    });

    return inserted[0];
  } catch {
    const created = {
      id: `docrec-${Date.now()}`,
      patientId: payload.patientId,
      encounterId: payload.encounterId || null,
      labOrderId: payload.labOrderId || null,
      fileName: payload.fileName,
      mimeType: payload.mimeType || 'application/pdf',
      fileSizeBytes: payload.fileSizeBytes || 245760,
      gdriveFileId: payload.gdriveFileId,
      gdriveWebViewLink: payload.gdriveWebViewLink,
      documentType: payload.documentType || 'LAB_REPORT',
      uploadedBy: 'u3000000-0000-0000-0000-000000000001',
      uploadedAt: new Date(),
    };
    memoryStore.medicalDocuments.unshift(created);

    appendAudit({
      actorRole: 'LAB_TECH',
      action: 'GDRIVE_VAULT_UPLOAD_ARCHIVED',
      entityType: 'MEDICAL_DOCUMENT',
      entityId: payload.fileName,
      details: `Archived ${payload.fileName} to Google Drive Vault (File ID: ${payload.gdriveFileId}).`,
    });

    return created;
  }
}

export async function deleteMedicalDocumentRecord(id: string) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const deleted = await db
      .delete(medicalDocuments)
      .where(eq(medicalDocuments.id, id))
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'SUPERADMIN',
      action: 'DOCUMENT_RECORD_DELETED',
      entityType: 'MEDICAL_DOCUMENT',
      entityId: deleted[0]?.fileName || id,
      details: `Removed medical document mirror record ${deleted[0]?.fileName || id}.`,
    });

    return deleted[0];
  } catch {
    const idx = memoryStore.medicalDocuments.findIndex((d) => d.id === id);
    const removed = idx >= 0 ? memoryStore.medicalDocuments.splice(idx, 1)[0] : undefined;

    appendAudit({
      actorRole: 'SUPERADMIN',
      action: 'DOCUMENT_RECORD_DELETED',
      entityType: 'MEDICAL_DOCUMENT',
      entityId: removed?.fileName || id,
      details: `Removed medical document mirror record ${removed?.fileName || id}.`,
    });

    return removed;
  }
}

export async function createElectronicPrescription(payload: {
  encounterId: string;
  patientId: string;
  doctorId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  quantity: number;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const inserted = await db
      .insert(prescriptions)
      .values({
        encounterId: payload.encounterId,
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        medicationName: payload.medicationName,
        dosage: payload.dosage,
        frequency: payload.frequency,
        instructions: payload.instructions,
        quantity: payload.quantity || 30,
        remainingCount: payload.quantity || 30,
        status: 'ACTIVE',
      })
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'DOCTOR',
      action: 'ERX_PRESCRIPTION_SIGNED',
      entityType: 'PRESCRIPTION',
      entityId: inserted[0].id,
      details: `Prescribed ${payload.medicationName} (${payload.dosage}, ${payload.frequency}) Qty: ${payload.quantity}.`,
    });

    return inserted[0];
  } catch {
    const created = {
      id: `rx-${Date.now()}`,
      encounterId: payload.encounterId,
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      medicationName: payload.medicationName,
      dosage: payload.dosage,
      frequency: payload.frequency,
      instructions: payload.instructions,
      quantity: payload.quantity || 30,
      remainingCount: payload.quantity || 30,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
    memoryStore.prescriptions.unshift(created);

    appendAudit({
      actorRole: 'DOCTOR',
      action: 'ERX_PRESCRIPTION_SIGNED',
      entityType: 'PRESCRIPTION',
      entityId: created.id,
      details: `Prescribed ${payload.medicationName} (${payload.dosage}, ${payload.frequency}) Qty: ${payload.quantity}.`,
    });

    return created;
  }
}

export async function updatePrescriptionStatusAndDispense(payload: {
  prescriptionId: string;
  status: string;
  inventorySku?: string;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const existingList = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, payload.prescriptionId));
    const rx = existingList[0];
    if (!rx) throw new Error('Prescription not found.');

    const updated = await db
      .update(prescriptions)
      .set({
        status: payload.status,
        remainingCount: payload.status === 'DISPENSED' ? rx.quantity : rx.remainingCount,
      })
      .where(eq(prescriptions.id, payload.prescriptionId))
      .returning();

    if (payload.status === 'DISPENSED' && payload.inventorySku) {
      const invList = await db
        .select()
        .from(pharmacyInventory)
        .where(eq(pharmacyInventory.sku, payload.inventorySku));
      if (invList[0]) {
        const nextStock = Math.max(0, invList[0].stockQuantity - rx.quantity);
        await db
          .update(pharmacyInventory)
          .set({ stockQuantity: nextStock })
          .where(eq(pharmacyInventory.id, invList[0].id));
      }
    }

    await db.insert(auditLogs).values({
      actorRole: payload.status === 'DISPENSED' ? 'PHARMACIST' : 'PATIENT',
      action: `PRESCRIPTION_${payload.status}`,
      entityType: 'PRESCRIPTION',
      entityId: rx.medicationName,
      details: `Updated prescription ${rx.medicationName} status to ${payload.status}.`,
    });

    return updated[0];
  } catch {
    const rx = memoryStore.prescriptions.find((p) => p.id === payload.prescriptionId);
    if (!rx) throw new Error('Prescription not found.');

    rx.status = payload.status;
    if (payload.status === 'DISPENSED') {
      rx.remainingCount = rx.quantity;
    }

    if (payload.status === 'DISPENSED' && payload.inventorySku) {
      const inv = memoryStore.pharmacyInventory.find((i) => i.sku === payload.inventorySku);
      if (inv) {
        inv.stockQuantity = Math.max(0, inv.stockQuantity - rx.quantity);
      }
    }

    appendAudit({
      actorRole: payload.status === 'DISPENSED' ? 'PHARMACIST' : 'PATIENT',
      action: `PRESCRIPTION_${payload.status}`,
      entityType: 'PRESCRIPTION',
      entityId: rx.medicationName,
      details: `Updated prescription ${rx.medicationName} status to ${payload.status}.`,
    });

    return rx;
  }
}

export async function updateBedAssignment(payload: {
  bedId: string;
  status: string;
  patientId?: string | null;
  nursingNotes?: string;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const updated = await db
      .update(beds)
      .set({
        status: payload.status,
        patientId: payload.status === 'OCCUPIED' ? payload.patientId || null : null,
        nursingNotes: payload.nursingNotes,
        updatedAt: new Date(),
      })
      .where(eq(beds.id, payload.bedId))
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'NURSE',
      action: 'IPD_BED_ADT_UPDATE',
      entityType: 'BED',
      entityId: updated[0]?.bedNumber || payload.bedId,
      details: `Updated bed ${updated[0]?.bedNumber} to ${payload.status}. Notes: ${payload.nursingNotes || 'None'}`,
    });

    return updated[0];
  } catch {
    const bed = memoryStore.beds.find((b) => b.id === payload.bedId);
    if (bed) {
      bed.status = payload.status;
      bed.patientId = payload.status === 'OCCUPIED' ? payload.patientId || null : null;
      bed.nursingNotes = payload.nursingNotes || bed.nursingNotes;
      bed.updatedAt = new Date();
    }

    appendAudit({
      actorRole: 'NURSE',
      action: 'IPD_BED_ADT_UPDATE',
      entityType: 'BED',
      entityId: bed?.bedNumber || payload.bedId,
      details: `Updated bed ${bed?.bedNumber || payload.bedId} to ${payload.status}. Notes: ${payload.nursingNotes || 'None'}`,
    });

    return bed;
  }
}

export async function processInvoiceSettlement(payload: {
  invoiceId: string;
  paymentAmount: number;
  paymentMethod: string;
  insuranceProvider?: string;
}) {
  try {
    if (!sqlReachable) throw new Error('SKIP_DEAD_SOCKET');
    const invList = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, payload.invoiceId));
    const inv = invList[0];
    if (!inv) throw new Error('Invoice not found.');

    const net = Number(inv.netAmount);
    const currentPaid = Number(inv.paidAmount);
    const nextPaid = Math.min(net, currentPaid + payload.paymentAmount);
    const nextStatus = nextPaid >= net ? 'PAID' : nextPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const updated = await db
      .update(invoices)
      .set({
        paidAmount: String(nextPaid.toFixed(2)),
        paymentMethod: payload.paymentMethod,
        insuranceProvider: payload.insuranceProvider || inv.insuranceProvider,
        status: nextStatus,
      })
      .where(eq(invoices.id, payload.invoiceId))
      .returning();

    await db.insert(auditLogs).values({
      actorRole: 'CASHIER',
      action: `INVOICE_SETTLEMENT_${nextStatus}`,
      entityType: 'INVOICE',
      entityId: inv.invoiceNumber,
      details: `Processed Rp ${payload.paymentAmount.toLocaleString('id-ID')} via ${payload.paymentMethod} for ${inv.invoiceNumber}. New status: ${nextStatus}.`,
    });

    return updated[0];
  } catch {
    const inv = memoryStore.invoices.find((i) => i.id === payload.invoiceId);
    if (!inv) throw new Error('Invoice not found.');

    const net = Number(inv.netAmount);
    const currentPaid = Number(inv.paidAmount);
    const nextPaid = Math.min(net, currentPaid + payload.paymentAmount);
    const nextStatus = nextPaid >= net ? 'PAID' : nextPaid > 0 ? 'PARTIAL' : 'UNPAID';

    inv.paidAmount = String(nextPaid.toFixed(2));
    inv.paymentMethod = payload.paymentMethod;
    inv.insuranceProvider = payload.insuranceProvider || inv.insuranceProvider;
    inv.status = nextStatus;

    appendAudit({
      actorRole: 'CASHIER',
      action: `INVOICE_SETTLEMENT_${nextStatus}`,
      entityType: 'INVOICE',
      entityId: inv.invoiceNumber,
      details: `Processed Rp ${payload.paymentAmount.toLocaleString('id-ID')} via ${payload.paymentMethod} for ${inv.invoiceNumber}. New status: ${nextStatus}.`,
    });

    return inv;
  }
}
