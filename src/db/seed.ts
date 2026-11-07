import { db } from './index.ts';
import {
  users,
  departments,
  doctors,
  patients,
  diagnosticServices,
  encounters,
  appointments,
  labOrders,
  medicalDocuments,
  prescriptions,
  pharmacyInventory,
  beds,
  invoices,
  invoiceItems,
  auditLogs,
} from './schema.ts';
import { count, eq } from 'drizzle-orm';

let isSeeded = false;

export async function ensureSeedData() {
  if (isSeeded) return;

  try {
    const existingDepts = await db.select({ value: count() }).from(departments);
    if (existingDepts[0] && Number(existingDepts[0].value) > 0) {
      // Ensure existing database rows are normalized to English
      await Promise.all([
        db
          .update(departments)
          .set({
            name: 'Specialist Clinics',
            description: 'Outpatient Specialist Polyclinics (Cardiology, Pediatrics, Surgery, Internal Medicine)',
          })
          .where(eq(departments.id, 'd1111111-1111-1111-1111-111111111111')),
        db
          .update(departments)
          .set({ name: 'Inpatient Care' })
          .where(eq(departments.id, 'd2222222-2222-2222-2222-222222222222')),
        db
          .update(departments)
          .set({ name: '24/7 Emergency (ER)' })
          .where(eq(departments.id, 'd3333333-3333-3333-3333-333333333333')),
        db
          .update(departments)
          .set({ name: 'Radiology & Imaging' })
          .where(eq(departments.id, 'd4444444-4444-4444-4444-444444444444')),
        db
          .update(departments)
          .set({ name: 'Clinical Laboratory' })
          .where(eq(departments.id, 'd5555555-5555-5555-5555-555555555555')),
        db
          .update(departments)
          .set({ name: 'Hospital Pharmacy' })
          .where(eq(departments.id, 'd6666666-6666-6666-6666-666666666666')),
        db
          .update(doctors)
          .set({ specializationTitle: 'Cardiologist' })
          .where(eq(doctors.id, 'doc11111-1111-1111-1111-111111111111')),
        db
          .update(doctors)
          .set({ specializationTitle: 'Pediatrician' })
          .where(eq(doctors.id, 'doc22222-2222-2222-2222-222222222222')),
        db
          .update(doctors)
          .set({ specializationTitle: 'General Surgeon' })
          .where(eq(doctors.id, 'doc33333-3333-3333-3333-333333333333')),
        db
          .update(doctors)
          .set({ specializationTitle: 'Internal Medicine Specialist' })
          .where(eq(doctors.id, 'doc44444-4444-4444-4444-444444444444')),
        db
          .update(beds)
          .set({ wardName: 'Integrated Intensive Care Unit (ICU)' })
          .where(eq(beds.id, 'bed-icu-01')),
        db
          .update(beds)
          .set({ wardName: 'Integrated Intensive Care Unit (ICU)' })
          .where(eq(beds.id, 'bed-icu-02')),
        db
          .update(beds)
          .set({ wardName: 'Anaverse Executive VIP Pavilion' })
          .where(eq(beds.id, 'bed-vip-01')),
        db
          .update(beds)
          .set({ wardName: 'Anaverse Executive VIP Pavilion' })
          .where(eq(beds.id, 'bed-vip-02')),
        db
          .update(beds)
          .set({ wardName: 'Class I Inpatient Ward' })
          .where(eq(beds.id, 'bed-gen-01')),
        db
          .update(beds)
          .set({ wardName: 'Class I Inpatient Ward' })
          .where(eq(beds.id, 'bed-gen-02')),
        db
          .update(invoiceItems)
          .set({ description: 'Cardiology Specialist Consultation — Dr. Andika Pratama, MD, FACC' })
          .where(eq(invoiceItems.id, 'ii111111-1111-1111-1111-111111111111')),
      ]);

      isSeeded = true;
      return;
    }

    // 1. Insert Departments matching the reference blueprint
    await db
      .insert(departments)
      .values([
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
      ])
      .onConflictDoNothing();

    // 2. Insert Doctor & Patient User Accounts
    await db
      .insert(users)
      .values([
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
        },
      ])
      .onConflictDoNothing();

    // 3. Insert Doctor Profiles (Aligned with UI visual reference)
    await db
      .insert(doctors)
      .values([
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
      ])
      .onConflictDoNothing();

    // 4. Insert Diagnostic & Lab Services Catalog
    await db
      .insert(diagnosticServices)
      .values([
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
      ])
      .onConflictDoNothing();

    // 5. Insert Patients
    await db
      .insert(patients)
      .values([
        {
          id: 'pat11111-1111-1111-1111-111111111111',
          userId: 'u2000000-0000-0000-0000-000000000001',
          uhid: 'HSP-2026-00412',
          fullName: 'Reza Rahadian',
          dateOfBirth: '1988-06-14',
          gender: 'Male',
          bloodGroup: 'O+',
          phone: '+6281299887766',
          address: 'Jl. Sudirman Kav 24, Jakarta Selatan',
          emergencyContactName: 'Indah Permata (Wife)',
          emergencyContactPhone: '+6281299887760',
          allergies: ['Penicillin'],
          chronicConditions: ['Mild Hypertension'],
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
          address: 'Jl. Gatot Subroto No. 88, Jakarta Selatan',
          emergencyContactName: 'Ahmad Dhani (Husband)',
          emergencyContactPhone: '+6281299887761',
          allergies: ['Sulfa Drugs'],
          chronicConditions: ['Asthma Bronchiale'],
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
          address: 'Jl. Kemang Raya No. 15, Jakarta Selatan',
          emergencyContactName: 'Tribuana Tungga Dewi (Wife)',
          emergencyContactPhone: '+6281299887762',
          allergies: [],
          chronicConditions: ['Type 2 Diabetes Mellitus'],
        },
      ])
      .onConflictDoNothing();

    // 6. Insert Active Clinical Encounters (including historical encounters for vitals timeline)
    await db
      .insert(encounters)
      .values([
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
          id: 'enc11111-1111-1111-1111-111111111111',
          encounterNumber: 'ENC-88319',
          patientId: 'pat11111-1111-1111-1111-111111111111',
          doctorId: 'doc11111-1111-1111-1111-111111111111',
          encounterType: 'OPD',
          chiefComplaint: 'Episodic chest tightness and lightheadedness after mild cardio exertion',
          clinicalNotes: 'Patient presents with exertional precordial tightness resolving within 5 minutes of rest. Fasting lipid panel shows hypercholesterolemia (Total 242 mg/dL, LDL 164 mg/dL).',
          soapObjective: 'BP 132/85 mmHg, HR 78 bpm regular, Temp 36.6°C, SpO2 98% on room air. Resting 12-lead ECG sinus rhythm.',
          soapPlan: '1. Initiate Atorvastatin 20mg ON after dinner.\n2. Continue Amlodipine 5mg OD.\n3. Requisition Complete Blood Count (LAB-CBC) and Chest X-Ray PA.',
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
        },
      ])
      .onConflictDoNothing();

    // 7. Insert Appointments & OPD Queue
    await db
      .insert(appointments)
      .values([
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
        },
      ])
      .onConflictDoNothing();

    // 8. Insert Lab Orders (1 Verified from Blueprint + 1 Processing for Interactive LIS Demo)
    await db
      .insert(labOrders)
      .values([
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
          },
          clinicalNotes: 'Patient shows elevated total cholesterol and LDL. Statin therapy initiation recommended.',
          verifiedBy: 'u1000000-0000-0000-0000-000000000001',
          verifiedAt: new Date('2026-05-20T08:50:00Z'),
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
          },
          clinicalNotes: 'Automated Sysmex XN-1000 hematology analyzer run completed. Awaiting pathologist sign-off.',
        },
      ])
      .onConflictDoNothing();

    // 9. Insert Google Drive Upload Record Mirror from Blueprint
    await db
      .insert(medicalDocuments)
      .values([
        {
          id: 'docrec11-1111-1111-1111-111111111111',
          patientId: 'pat11111-1111-1111-1111-111111111111',
          encounterId: 'enc11111-1111-1111-1111-111111111111',
          labOrderId: 'lo111111-1111-1111-1111-111111111111',
          fileName: 'LAB_LIPID_ENC88319.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 384128,
          gdriveFileId: '1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT',
          gdriveWebViewLink: 'https://drive.google.com/file/d/1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT/view',
          documentType: 'LAB_REPORT',
          uploadedBy: 'u1000000-0000-0000-0000-000000000001',
        },
      ])
      .onConflictDoNothing();

    // 10. Insert Active Prescriptions (eRx)
    await db
      .insert(prescriptions)
      .values([
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
        },
      ])
      .onConflictDoNothing();

    // 11. Insert Pharmacy Formulary Inventory
    await db
      .insert(pharmacyInventory)
      .values([
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
      ])
      .onConflictDoNothing();

    // 12. Insert IPD & Ward Beds
    await db
      .insert(beds)
      .values([
        {
          id: 'bed-icu-01',
          bedNumber: 'ICU-01',
          wardName: 'Integrated Intensive Care Unit (ICU)',
          wardType: 'ICU',
          floorNumber: 2,
          status: 'OCCUPIED',
          patientId: 'pat33333-3333-3333-3333-333333333333',
          dailyRate: '2800000.00',
          nursingNotes: 'Continuous telemetry & insulin infusion titration. Hourly vitals stable.',
        },
        {
          id: 'bed-icu-02',
          bedNumber: 'ICU-02',
          wardName: 'Integrated Intensive Care Unit (ICU)',
          wardType: 'ICU',
          floorNumber: 2,
          status: 'AVAILABLE',
          dailyRate: '2800000.00',
          nursingNotes: 'Ventilator & multiparameter monitor sterilized and ready.',
        },
        {
          id: 'bed-vip-01',
          bedNumber: 'VIP-301',
          wardName: 'Anaverse Executive VIP Pavilion',
          wardType: 'VIP',
          floorNumber: 3,
          status: 'OCCUPIED',
          patientId: 'pat22222-2222-2222-2222-222222222222',
          dailyRate: '1650000.00',
          nursingNotes: 'Post-bronchodilator nebulization observation. SpO2 99%.',
        },
        {
          id: 'bed-vip-02',
          bedNumber: 'VIP-302',
          wardName: 'Anaverse Executive VIP Pavilion',
          wardType: 'VIP',
          floorNumber: 3,
          status: 'AVAILABLE',
          dailyRate: '1650000.00',
          nursingNotes: 'Executive suite ready for admission.',
        },
        {
          id: 'bed-gen-01',
          bedNumber: 'RIN-401A',
          wardName: 'Class I Inpatient Ward',
          wardType: 'SEMI_PRIVATE',
          floorNumber: 4,
          status: 'AVAILABLE',
          dailyRate: '750000.00',
          nursingNotes: 'Standard inpatient bed available.',
        },
        {
          id: 'bed-gen-02',
          bedNumber: 'RIN-401B',
          wardName: 'Class I Inpatient Ward',
          wardType: 'GENERAL',
          floorNumber: 4,
          status: 'CLEANING',
          dailyRate: '550000.00',
          nursingNotes: 'UV disinfection cycle in progress following morning discharge.',
        },
      ])
      .onConflictDoNothing();

    // 13. Insert Unified Billing Invoice & Items
    await db
      .insert(invoices)
      .values([
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
        },
      ])
      .onConflictDoNothing();

    await db
      .insert(invoiceItems)
      .values([
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
      ])
      .onConflictDoNothing();

    // 14. Insert Initial Audit Logs
    await db
      .insert(auditLogs)
      .values([
        {
          id: 'aud11111-1111-1111-1111-111111111111',
          actorRole: 'DOCTOR',
          actorEmail: 'andika.pratama@anaverse.com',
          action: 'ENCOUNTER_OPENED',
          entityType: 'ENCOUNTER',
          entityId: 'ENC-88319',
          details: 'Opened outpatient cardiology encounter for Reza Rahadian (HSP-2026-00412). Recorded BP 132/85 mmHg.',
        },
        {
          id: 'aud22222-2222-2222-2222-222222222222',
          actorRole: 'LAB_TECH',
          actorEmail: 'analis.lab@anaverse.com',
          action: 'LAB_RESULT_VERIFIED_GDRIVE_SYNC',
          entityType: 'MEDICAL_DOCUMENT',
          entityId: 'LAB_LIPID_ENC88319.pdf',
          details: 'Verified Comprehensive Lipid Profile (LDL 164 mg/dL HIGH) and synced PDF to HOSPITAL_ERP_VAULT/Pathology/HSP-2026-00412/ENC-88319.',
        },
      ])
      .onConflictDoNothing();

    isSeeded = true;
  } catch (error) {
    throw new Error('CLOUD_SQL_SOCKET_UNAVAILABLE', { cause: error });
  }
}
