export type UserRole =
  | 'PUBLIC'
  | 'PATIENT'
  | 'DOCTOR'
  | 'NURSE'
  | 'LAB_TECH'
  | 'PHARMACIST'
  | 'CASHIER'
  | 'SUPERADMIN';

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  departmentId: string;
  fullName: string;
  email: string;
  departmentName: string;
  specializationTitle: string;
  medicalLicenseNumber: string;
  biography: string;
  consultationFee: string;
  rating: string;
  reviewCount: number;
  avatarUrl: string;
  availableDays: number[];
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface Patient {
  id: string;
  userId: string | null;
  uhid: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string[];
  chronicConditions: string[];
  createdAt: string;
}

export interface Encounter {
  id: string;
  encounterNumber: string;
  patientId: string;
  doctorId: string;
  encounterType: string;
  chiefComplaint: string;
  clinicalNotes: string;
  soapObjective: string;
  soapPlan: string;
  diagnosisIcd10: string;
  diagnosisDescription: string;
  systolicBp: number;
  diastolicBp: number;
  temperatureCelsius: string;
  pulseBpm: number;
  respiratoryRate: number;
  spO2: number;
  weightKg: string;
  bloodGlucoseMgDl: number;
  startedAt: string;
  endedAt: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  appointmentType: string;
  tokenNumber: number;
  status: string;
  reasonForVisit: string;
  createdAt: string;
}

export interface DiagnosticService {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  category: string;
  basePrice: string;
  turnaroundHours: number;
  preparationInstructions: string;
}

export interface AnalyteResult {
  value: number | string;
  unit: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'BORDERLINE' | 'CRITICAL';
  ref: string;
}

export interface LabOrder {
  id: string;
  encounterId: string;
  patientId: string;
  serviceId: string;
  barcode: string;
  orderStatus: 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'RESULT_ENTERED' | 'VERIFIED';
  resultData: Record<string, AnalyteResult>;
  clinicalNotes: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface MedicalDocument {
  id: string;
  patientId: string;
  encounterId: string | null;
  labOrderId: string | null;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  gdriveFileId: string;
  gdriveWebViewLink: string;
  documentType: string;
  uploadedBy: string | null;
  uploadedAt: string;
}

export interface Prescription {
  id: string;
  encounterId: string;
  patientId: string;
  doctorId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string;
  quantity: number;
  remainingCount: number;
  status: 'ACTIVE' | 'DISPENSED' | 'REFILL_REQUESTED';
  createdAt: string;
}

export interface PharmacyItem {
  id: string;
  sku: string;
  drugName: string;
  genericName: string;
  category: string;
  batchNumber: string;
  expiryDate: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: string;
}

export interface Bed {
  id: string;
  bedNumber: string;
  wardName: string;
  wardType: 'ICU' | 'VIP' | 'SEMI_PRIVATE' | 'GENERAL';
  floorNumber: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';
  patientId: string | null;
  dailyRate: string;
  nursingNotes: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  encounterId: string | null;
  totalAmount: string;
  taxAmount: string;
  discountAmount: string;
  netAmount: string;
  paidAmount: string;
  paymentMethod: string;
  insuranceProvider: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  issuedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemType: 'CONSULTATION' | 'LAB_TEST' | 'MEDICATION' | 'BED_CHARGE';
  description: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export interface AuditLog {
  id: string;
  actorRole: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string;
  createdAt: string;
}

export interface ErpBootstrapData {
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  encounters: Encounter[];
  appointments: Appointment[];
  diagnosticServices: DiagnosticService[];
  labOrders: LabOrder[];
  medicalDocuments: MedicalDocument[];
  prescriptions: Prescription[];
  pharmacyInventory: PharmacyItem[];
  beds: Bed[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  auditLogs: AuditLog[];
}
