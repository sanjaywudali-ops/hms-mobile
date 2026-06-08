export const BASE_URL = 'https://hms-backend-production-a5df.up.railway.app'; // Replace with your actual backend URL

export const api = {
  // Auth
  adminLogin: '/api/admin/login',
  doctorLogin: '/api/doctors/login',
  employeeLogin: '/api/employee/login',
  superAdminLogin: '/api/superadmin/login',
  logout: '/api/v1/auth/logout',

  // Stats
  getOutPatientStats: '/api/v1/stats/getStats',
  getAllCounts: '/api/v1/stats/getAllCounts',
  getDoctorStats: '/api/v1/stats/getDoctorAppointmentCount',

  // Common
  getDoctors: '/api/v1/common/getAllDoctors',
  getAllCommonPatients: '/api/v1/common/getAllPatients',
  getDepartments: '/api/v1/common/getAllDepartments',
  getSpecialities: '/api/v1/common/getAllSpecialities',
  getRoles: '/api/v1/common/getAllRoles',
  getAllRooms: '/api/v1/common/getAllRooms',
  getAllRoomTypes: '/api/v1/common/getAllRoomTypes',
  getAllAmenities: '/api/v1/common/getAllAmenities',

  // Appointments / OPD
  getTimeSlots: (id: string, date: string) =>
    `/api/v1/patient/getDoctorSlots?doctorId=${id}&selectedDate=${date}`,
  getDoctorDates: (id: string) =>
    `/api/v1/patient/getDoctorAvailableDates?doctorId=${id}`,
  blockUnblockDoctorTimeSlot: '/api/v1/patient/blockUnblockDoctorTimeSlot',
  createAppointment: '/api/v1/patient/bookAppointment',
  getAllAppointments: '/api/v1/patient/getAllAppointments',
  updateAppointmentStatus: '/api/v1/patient/updateAppointmentStatus',
  getUpdateAppointmentStatus: (id: string) =>
    `/api/v1/patient/makeOutPatientToInPatient/${id}`,

  // Patients
  getPatients: '/api/v1/patient/getAllPatients',
  getPatientsById: (id: string) => `/api/v1/patient/getPatientById/${id}`,
  createPatient: '/api/v1/patient/createPatient',
  updatePatient: (id: string) => `/api/v1/patient/updatePatient/${id}`,

  // Inpatient
  admitPatient: '/api/v1/patient/admitPatient',
  getAllAdmissions: '/api/v1/patient/getAllAdmissions',
  getAdmissionById: (id: string) => `/api/v1/patient/getAdmission/${id}`,
  updateAdmission: (id: string) => `/api/v1/patient/updateAdmission/${id}`,
  dischargePatient: (id: string) => `/api/v1/patient/dischargePatient/${id}`,

  // Vitals
  addVitals: '/api/v1/patient/addVitals',
  getVitals: (patientId: string) =>
    `/api/v1/patient/getVitals/${patientId}`,

  // Lab
  getLabOrders: '/api/v1/lab/getAllLabOrders',
  createLabOrder: '/api/v1/lab/createLabOrder',
  updateLabOrder: (id: string) => `/api/v1/lab/updateLabOrder/${id}`,
  getLabOrderById: (id: string) => `/api/v1/lab/getLabOrder/${id}`,

  // Medications / Prescriptions
  getPrescriptions: (patientId: string) =>
    `/api/v1/patient/getPrescriptions/${patientId}`,
  createPrescription: '/api/v1/patient/createPrescription',

  // Pharmacy
  getPharmacyBills: '/api/v1/pharmacy/getAllBills',
  createPharmacyBill: '/api/v1/pharmacy/createBill',
  getPharmacyBillById: (id: string) => `/api/v1/pharmacy/getBill/${id}`,

  // Staff
  getAllStaff: '/api/v1/staff/getAllEmployees',
  getStaffById: (id: string) => `/api/v1/staff/getEmployee/${id}`,
  createStaff: '/api/v1/staff/createEmployee',
  updateStaff: (id: string) => `/api/v1/staff/updateEmployee/${id}`,

  // Rooms
  getRooms: '/api/v1/common/getAllRooms',
  updateRoom: (id: string) => `/api/v1/room/updateRoom/${id}`,

  // Organization
  getOrganizations: '/api/v1/organization/getAll',
  getOrganizationById: (id: string) => `/api/v1/organization/get/${id}`,

  // Permissions
  getPermissions: '/api/v1/permission/getAllRoles',
  createRole: '/api/v1/permission/createRole',
  deleteRole: (id: string) => `/api/v1/permission/deleteRole/${id}`,
  updateRole: (id: string) => `/api/v1/permission/updateRole/${id}`,

  // Logistics
  getStockBatches: '/api/v1/logistics/getStockBatches',
  getMedicalItems: '/api/v1/logistics/getMedicalItems',

  // Patient History
  getPatientHistory: (id: string) => `/api/v1/patient/getPatientHistory/${id}`,

  // User
  getMe: '/api/v1/auth/me',

  // Referrals
  getReferrals: '/api/v1/referral/getAll',
  getReferralById: (id: string) => `/api/v1/referral/get/${id}`,
};
