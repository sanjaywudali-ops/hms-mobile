// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  token: string;
  role: string;
  name: string;
  adminCode?: string;
  doctorCode?: string;
  employeeId?: string;
  superAdminCode?: string;
}

// ─── Common ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  fName: string;
  lName: string;
  email?: string;
  phone?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

// ─── Patient ──────────────────────────────────────────────────────────────────
export interface PatientInfo {
  age?: number;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  user: User;
  patientInfo?: PatientInfo;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────
export interface Doctor {
  id: string;
  doctorCode: string;
  specialization?: string;
  user: User;
  department?: Department;
}

// ─── Inpatient ────────────────────────────────────────────────────────────────
export type AdmissionStatus =
  | 'PLANNED'
  | 'ADMITTED'
  | 'DISCHARGE_STARTED'
  | 'DISCHARGED'
  | 'CANCELLED';

export type AdmissionType =
  | 'EMERGENCY'
  | 'ELECTIVE'
  | 'TRANSFER'
  | 'MATERNITY'
  | 'SURGICAL'
  | 'MEDICAL'
  | 'OBSERVATION';

export type Priority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';

export interface RoomBooking {
  id: string;
  room?: Room;
}

export interface Admission {
  id: string;
  status: AdmissionStatus;
  admissionType: AdmissionType;
  priority: Priority;
  reasonForAdmission: string;
  admissionDateTime: string;
  expectedDischargeDate?: string;
  actualDischargeDate?: string;
  notes?: string;
  patient: Patient;
  admittingDoctor: Doctor;
  roomBooking?: RoomBooking;
}

// ─── Vitals ───────────────────────────────────────────────────────────────────
export interface Vitals {
  id: string;
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
  recordedAt: string;
  patientId: string;
}

// ─── Outpatient ───────────────────────────────────────────────────────────────
export type AppointmentStatus =
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED';

export type AppointmentType =
  | 'GENERAL'
  | 'FOLLOW_UP'
  | 'SPECIALIST'
  | 'EMERGENCY'
  | 'CHECKUP';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime?: string;
  isBooked?: boolean;
  isBlocked?: boolean;
}

export interface Appointment {
  id: string;
  tokenNumber?: number;
  appointmentStatus: AppointmentStatus;
  appointmentType: AppointmentType;
  date: string;
  reasonForAppointment: string;
  notes?: string;
  patient: Patient;
  doctor: Doctor;
  timeSlot?: TimeSlot;
}

// ─── Lab ──────────────────────────────────────────────────────────────────────
export type LabOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface LabOrder {
  id: string;
  testName: string;
  status: LabOrderStatus;
  priority?: Priority;
  result?: string;
  referenceRange?: string;
  remarks?: string;
  notes?: string;
  patient: Patient;
  orderedBy: Doctor;
  createdAt: string;
}

// ─── Pharmacy ─────────────────────────────────────────────────────────────────
export interface PharmacyItem {
  id?: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
}

export interface PharmacyBill {
  id: string;
  billNumber?: string;
  paymentStatus?: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  totalAmount: number;
  patient: Patient;
  items: PharmacyItem[];
  createdAt: string;
}

// ─── Room ─────────────────────────────────────────────────────────────────────
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';

export interface RoomType {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  status: RoomStatus;
  floor?: number;
  ward?: string;
  capacity?: number;
  dailyRate?: number;
  roomType?: RoomType;
  amenities?: {name: string}[];
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  employeeCode?: string;
  user: User;
  role?: Role;
  department?: Department;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
