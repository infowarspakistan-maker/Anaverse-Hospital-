import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  integer,
  jsonb,
  bigint,
} from 'drizzle-orm/pg-core';
import crypto from 'crypto';

// 1. Users & RBAC
export const users = pgTable('users', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  uid: text('uid').notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull().default('$2b$12$firebaseOAuthManaged'),
  role: varchar('role', { length: 30 }).notNull().default('PATIENT'), // SUPERADMIN, DOCTOR, NURSE, LAB_TECH, PHARMACIST, CASHIER, PATIENT
  firstName: varchar('first_name', { length: 100 }).notNull().default('Pasien'),
  lastName: varchar('last_name', { length: 100 }).notNull().default('Anaverse'),
  phone: varchar('phone', { length: 40 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2. Patient Master Identity
export const patients = pgTable('patients', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
  uhid: varchar('uhid', { length: 30 }).notNull().unique(), // e.g., HSP-2026-00412
  fullName: varchar('full_name', { length: 200 }).notNull().default('Reza Rahadian'),
  dateOfBirth: varchar('date_of_birth', { length: 20 }).notNull(),
  gender: varchar('gender', { length: 20 }).notNull(),
  bloodGroup: varchar('blood_group', { length: 10 }),
  phone: varchar('phone', { length: 40 }),
  address: text('address'),
  emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 40 }),
  allergies: text('allergies').array(),
  chronicConditions: text('chronic_conditions').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 3. Doctor Catalog & Profiles
export const departments = pgTable('departments', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  iconName: varchar('icon_name', { length: 50 }),
  isActive: boolean('is_active').default(true),
});

export const doctors = pgTable('doctors', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar('user_id', { length: 64 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  departmentId: varchar('department_id', { length: 64 })
    .notNull()
    .references(() => departments.id),
  specializationTitle: varchar('specialization_title', { length: 150 }).notNull(),
  medicalLicenseNumber: varchar('medical_license_number', { length: 100 }).notNull().unique(),
  biography: text('biography'),
  consultationFee: numeric('consultation_fee', { precision: 12, scale: 2 }).notNull().default('0.00'),
  rating: numeric('rating', { precision: 3, scale: 1 }).default('5.0'),
  reviewCount: integer('review_count').default(0),
  avatarUrl: text('avatar_url'),
  availableDays: integer('available_days').array().default([1, 2, 3, 4, 5]),
  slotDurationMinutes: integer('slot_duration_minutes').default(20),
  isActive: boolean('is_active').default(true),
});

// 4. Clinical Encounters
export const encounters = pgTable('encounters', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  encounterNumber: varchar('encounter_number', { length: 50 }).notNull().unique(),
  patientId: varchar('patient_id', { length: 64 })
    .notNull()
    .references(() => patients.id),
  doctorId: varchar('doctor_id', { length: 64 })
    .notNull()
    .references(() => doctors.id),
  encounterType: varchar('encounter_type', { length: 30 }).notNull().default('OPD'), // OPD, IPD, EMERGENCY
  chiefComplaint: text('chief_complaint'),
  clinicalNotes: text('clinical_notes'),
  soapObjective: text('soap_objective'),
  soapPlan: text('soap_plan'),
  diagnosisIcd10: varchar('diagnosis_icd10', { length: 30 }),
  diagnosisDescription: text('diagnosis_description'),
  systolicBp: integer('systolic_bp'),
  diastolicBp: integer('diastolic_bp'),
  temperatureCelsius: numeric('temperature_celsius', { precision: 4, scale: 1 }),
  pulseBpm: integer('pulse_bpm'),
  respiratoryRate: integer('respiratory_rate').default(16),
  spO2: integer('sp_o2'),
  weightKg: numeric('weight_kg', { precision: 5, scale: 1 }).default('70.0'),
  bloodGlucoseMgDl: integer('blood_glucose_mg_dl').default(98),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

// 5. Appointments & OPD Queue
export const appointments = pgTable('appointments', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  patientId: varchar('patient_id', { length: 64 })
    .notNull()
    .references(() => patients.id),
  doctorId: varchar('doctor_id', { length: 64 })
    .notNull()
    .references(() => doctors.id),
  departmentId: varchar('department_id', { length: 64 }).references(() => departments.id),
  appointmentDate: varchar('appointment_date', { length: 20 }).notNull(),
  startTime: varchar('start_time', { length: 20 }).notNull(),
  endTime: varchar('end_time', { length: 20 }).notNull(),
  appointmentType: varchar('appointment_type', { length: 50 }).default('OPD_CONSULTATION'), // OPD_CONSULTATION, DIAGNOSTIC_TEST, HEALTH_PACKAGE
  tokenNumber: integer('token_number').notNull(),
  status: varchar('status', { length: 30 }).default('CONFIRMED'), // PENDING, CONFIRMED, IN_CONSULTATION, COMPLETED, CANCELLED, NO_SHOW
  reasonForVisit: text('reason_for_visit'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 6. Diagnostics & Lab Services
export const diagnosticServices = pgTable('diagnostic_services', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  departmentId: varchar('department_id', { length: 64 }).references(() => departments.id),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull(),
  turnaroundHours: integer('turnaround_hours').default(24),
  preparationInstructions: text('preparation_instructions'),
});

export const labOrders = pgTable('lab_orders', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  encounterId: varchar('encounter_id', { length: 64 })
    .notNull()
    .references(() => encounters.id),
  patientId: varchar('patient_id', { length: 64 })
    .notNull()
    .references(() => patients.id),
  serviceId: varchar('service_id', { length: 64 })
    .notNull()
    .references(() => diagnosticServices.id),
  barcode: varchar('barcode', { length: 60 }).default('BC-2026-88319'),
  orderStatus: varchar('order_status', { length: 30 }).default('ORDERED'), // ORDERED, SAMPLE_COLLECTED, PROCESSING, RESULT_ENTERED, VERIFIED
  resultData: jsonb('result_data'),
  clinicalNotes: text('clinical_notes'),
  verifiedBy: varchar('verified_by', { length: 64 }).references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 7. Medical Document Vault (Google Drive Mirror)
export const medicalDocuments = pgTable('medical_documents', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  patientId: varchar('patient_id', { length: 64 })
    .notNull()
    .references(() => patients.id),
  encounterId: varchar('encounter_id', { length: 64 }).references(() => encounters.id),
  labOrderId: varchar('lab_order_id', { length: 64 }).references(() => labOrders.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  gdriveFileId: varchar('gdrive_file_id', { length: 255 }).notNull(),
  gdriveWebViewLink: text('gdrive_web_view_link').notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // LAB_REPORT, RADIOLOGY_IMAGE, DISCHARGE_SUMMARY
  uploadedBy: varchar('uploaded_by', { length: 64 }).references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});

// 8. Invoices & Billing
export const invoices = pgTable('invoices', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  patientId: varchar('patient_id', { length: 64 })
    .notNull()
    .references(() => patients.id),
  encounterId: varchar('encounter_id', { length: 64 }).references(() => encounters.id),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  paymentMethod: varchar('payment_method', { length: 50 }).default('SPLIT_TPA'),
  insuranceProvider: varchar('insurance_provider', { length: 100 }).default('BPJS Kesehatan / Allianz TPA'),
  status: varchar('status', { length: 30 }).default('UNPAID'), // UNPAID, PARTIAL, PAID, REFUNDED
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceId: varchar('invoice_id', { length: 64 })
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  itemType: varchar('item_type', { length: 50 }).notNull(), // CONSULTATION, LAB_TEST, MEDICATION, BED_CHARGE
  description: varchar('description', { length: 255 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
});

// 9. Prescriptions (eRx) & Pharmacy Inventory
export const prescriptions = pgTable('prescriptions', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  encounterId: varchar('encounter_id', { length: 64 })
    .notNull()
    .references(() => encounters.id),
  patientId: varchar('patient_id', { length: 64 })
    .notNull()
    .references(() => patients.id),
  doctorId: varchar('doctor_id', { length: 64 })
    .notNull()
    .references(() => doctors.id),
  medicationName: varchar('medication_name', { length: 200 }).notNull(),
  dosage: varchar('dosage', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 100 }).notNull(),
  instructions: text('instructions'),
  quantity: integer('quantity').notNull().default(30),
  remainingCount: integer('remaining_count').notNull().default(24),
  status: varchar('status', { length: 30 }).notNull().default('ACTIVE'), // ACTIVE, DISPENSED, REFILL_REQUESTED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const pharmacyInventory = pgTable('pharmacy_inventory', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  drugName: varchar('drug_name', { length: 200 }).notNull(),
  genericName: varchar('generic_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  batchNumber: varchar('batch_number', { length: 60 }).notNull(),
  expiryDate: varchar('expiry_date', { length: 20 }).notNull(),
  stockQuantity: integer('stock_quantity').notNull().default(100),
  reorderLevel: integer('reorder_level').notNull().default(25),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
});

// 10. IPD Bed Management
export const beds = pgTable('beds', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bedNumber: varchar('bed_number', { length: 30 }).notNull().unique(),
  wardName: varchar('ward_name', { length: 100 }).notNull(),
  wardType: varchar('ward_type', { length: 40 }).notNull(), // ICU, VIP, SEMI_PRIVATE, GENERAL
  floorNumber: integer('floor_number').notNull().default(2),
  status: varchar('status', { length: 30 }).notNull().default('AVAILABLE'), // AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE
  patientId: varchar('patient_id', { length: 64 }).references(() => patients.id, { onDelete: 'set null' }),
  dailyRate: numeric('daily_rate', { precision: 12, scale: 2 }).notNull().default('750000.00'),
  nursingNotes: text('nursing_notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 11. Audit Logs & Webhook Events
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  actorRole: varchar('actor_role', { length: 40 }).notNull(),
  actorEmail: varchar('actor_email', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 60 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
