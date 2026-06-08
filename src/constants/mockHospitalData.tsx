

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type AppointmentType = 'OPD' | 'IPD';

export interface AppointmentRecord {
  id: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  doctorName: string;
  specialization: string;
  type: AppointmentType; // OPD = Out-Patient appointment, IPD = In-Patient admission
}

// ─── Master mock list (12 OPD + 8 IPD = matches dashboard counts) ────────────

export const MOCK_APPOINTMENTS: AppointmentRecord[] = [
  // ── OPD (Out-Patient) — 12 records ──
  {id: 'opd-1',  patientName: 'Arjun ',   patientPhone: '+91 98765 43210', patientAge: 34, date: '2025-06-13', time: '09:00 AM', reason: 'Routine checkup',           status: 'Confirmed', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-2',  patientName: 'Priya ',    patientPhone: '+91 91234 56789', patientAge: 27, date: '2025-06-13', time: '10:30 AM', reason: 'Chest pain follow-up',      status: 'Pending',   doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-3',  patientName: 'Suresh Babu',   patientPhone: '+91 99887 76655', patientAge: 52, date: '2025-06-13', time: '12:00 PM', reason: 'Blood pressure monitoring', status: 'Completed', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-4',  patientName: 'Meena Devi',    patientPhone: '+91 87654 32109', patientAge: 45, date: '2025-06-14', time: '11:00 AM', reason: 'Diabetes consultation',     status: 'Pending',   doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-5',  patientName: 'Ravi Shankar',  patientPhone: '+91 93456 78901', patientAge: 61, date: '2025-06-14', time: '02:00 PM', reason: 'Post-surgery review',       status: 'Cancelled', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-6',  patientName: 'Kavitha Reddy', patientPhone: '+91 96321 45678', patientAge: 38, date: '2025-06-15', time: '09:30 AM', reason: 'ECG test review',           status: 'Confirmed', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-7',  patientName: 'Vinod ',  patientPhone: '+91 90011 22334', patientAge: 41, date: '2025-06-15', time: '10:00 AM', reason: 'Skin allergy',              status: 'Pending',   doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'OPD'},
  {id: 'opd-8',  patientName: 'Anita ',  patientPhone: '+91 98123 45670', patientAge: 29, date: '2025-06-15', time: '11:30 AM', reason: 'Acne treatment follow-up',  status: 'Confirmed', doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'OPD'},
  {id: 'opd-9',  patientName: 'Karthik ',  patientPhone: '+91 97456 12389', patientAge: 33, date: '2025-06-16', time: '09:00 AM', reason: 'Migraine consultation',     status: 'Pending',   doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-10', patientName: 'Lakshmi ',patientPhone: '+91 99887 11223', patientAge: 56, date: '2025-06-16', time: '01:00 PM', reason: 'Thyroid checkup',           status: 'Completed', doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'OPD'},
  {id: 'opd-11', patientName: 'Manoj ',   patientPhone: '+91 90909 80808', patientAge: 48, date: '2025-06-17', time: '03:00 PM', reason: 'Knee pain evaluation',      status: 'Confirmed', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'OPD'},
  {id: 'opd-12', patientName: 'Divya ',patientPhone: '+91 91122 33445', patientAge: 31, date: '2025-06-17', time: '04:30 PM', reason: 'Routine antenatal visit',   status: 'Pending',   doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'OPD'},

  // ── IPD (In-Patient) — 8 records ──
  {id: 'ipd-1', patientName: 'Ramesh Pillai',  patientPhone: '+91 90123 45678', patientAge: 67, date: '2025-06-12', time: 'Admitted',  reason: 'Cardiac surgery recovery',  status: 'Confirmed', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'IPD'},
  {id: 'ipd-2', patientName: 'Sunita Rao',     patientPhone: '+91 91234 09876', patientAge: 54, date: '2025-06-13', time: 'Admitted',  reason: 'Pneumonia treatment',        status: 'Confirmed', doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'IPD'},
  {id: 'ipd-3', patientName: 'Ajay Kumar',     patientPhone: '+91 99001 12233', patientAge: 39, date: '2025-06-13', time: 'Admitted',  reason: 'Appendectomy recovery',      status: 'Pending',   doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'IPD'},
  {id: 'ipd-4', patientName: 'Geeta Menon',    patientPhone: '+91 98765 00112', patientAge: 71, date: '2025-06-14', time: 'Admitted',  reason: 'Hip replacement follow-up',  status: 'Confirmed', doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'IPD'},
  {id: 'ipd-5', patientName: 'Naveen Das',     patientPhone: '+91 97001 22556', patientAge: 45, date: '2025-06-14', time: 'Discharge Planned', reason: 'Post-op observation', status: 'Completed', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'IPD'},
  {id: 'ipd-6', patientName: 'Pooja Malhotra', patientPhone: '+91 96112 33778', patientAge: 28, date: '2025-06-15', time: 'Admitted',  reason: 'Delivery & maternity care',  status: 'Pending',   doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'IPD'},
  {id: 'ipd-7', patientName: 'Harish Chandra', patientPhone: '+91 95223 44889', patientAge: 60, date: '2025-06-16', time: 'Discharged', reason: 'Kidney stone removal',       status: 'Completed', doctorName: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', type: 'IPD'},
  {id: 'ipd-8', patientName: 'Shalini Gupta',  patientPhone: '+91 94334 55990', patientAge: 36, date: '2025-06-16', time: 'Admitted',  reason: 'Fracture management',        status: 'Confirmed', doctorName: 'Dr. Vinod Sharma', specialization: 'Dermatologist', type: 'IPD'},
];

// ─── Derived counts (used by Main Dashboard) ─────────────────────────────────
// TODO: Replace with `instance.get(api.getAllCounts)` response shape.

export function getAllCounts() {
  const opdList = MOCK_APPOINTMENTS.filter(a => a.type === 'OPD');
  const ipdList = MOCK_APPOINTMENTS.filter(a => a.type === 'IPD');

  return {
    appointments: {
      total: opdList.length,
      inProgress: opdList.filter(a => a.status === 'Pending').length,
      confirmed: opdList.filter(a => a.status === 'Confirmed').length,
      completed: opdList.filter(a => a.status === 'Completed').length,
      cancelled: opdList.filter(a => a.status === 'Cancelled').length,
    },
    admissions: {
      total: ipdList.length,
      admitted: ipdList.filter(a => a.time === 'Admitted').length,
      planned: ipdList.filter(a => a.status === 'Pending').length,
      dischargeStarted: ipdList.filter(a => a.time === 'Discharge Planned').length,
      discharged: ipdList.filter(a => a.time === 'Discharged').length,
    },
  };
}
