import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {instance} from '../services/axios';
import {api} from '../constants/api';

// ─── Stats ────────────────────────────────────────────────────────────────────
export function useAllCounts() {
  return useQuery({
    queryKey: ['all-counts'],
    queryFn: async () => (await instance.get(api.getAllCounts)).data.data,
    staleTime: 60_000,
  });
}

export function useDoctorStats() {
  return useQuery({
    queryKey: ['doctor-stats'],
    queryFn: async () => (await instance.get(api.getDoctorStats)).data.data,
    staleTime: 60_000,
  });
}

// ─── Common ───────────────────────────────────────────────────────────────────
export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => (await instance.get(api.getDoctors)).data.data,
    staleTime: 300_000,
  });
}

export function useCommonPatients() {
  return useQuery({
    queryKey: ['common-patients'],
    queryFn: async () => (await instance.get(api.getAllCommonPatients)).data.data,
    staleTime: 60_000,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await instance.get(api.getDepartments)).data.data,
    staleTime: 300_000,
  });
}

export function useRooms(params?: {status?: string}) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => (await instance.get(api.getRooms, {params})).data.data,
    staleTime: 30_000,
  });
}

// ─── Inpatient ────────────────────────────────────────────────────────────────
export function useAdmissions(params?: {search?: string; status?: string; page?: number}) {
  return useQuery({
    queryKey: ['inpatients', params],
    queryFn: async () => (await instance.get(api.getAllAdmissions, {params})).data,
  });
}

export function useAdmission(id: string) {
  return useQuery({
    queryKey: ['admission', id],
    queryFn: async () => (await instance.get(api.getAdmissionById(id))).data.data,
    enabled: !!id,
  });
}

export function useAdmitPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => instance.post(api.admitPatient, data),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['inpatients']});
      Toast.show({type: 'success', text1: 'Patient Admitted'});
    },
    onError: (e: any) => Toast.show({type: 'error', text1: 'Error', text2: e?.response?.data?.message}),
  });
}

export function useDischargePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => instance.patch(api.dischargePatient(id)),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['inpatients']});
      qc.invalidateQueries({queryKey: ['admission', id]});
      Toast.show({type: 'success', text1: 'Discharge Initiated'});
    },
    onError: (e: any) => Toast.show({type: 'error', text1: 'Error', text2: e?.response?.data?.message}),
  });
}

// ─── Vitals ───────────────────────────────────────────────────────────────────
export function useVitals(patientId: string) {
  return useQuery({
    queryKey: ['vitals', patientId],
    queryFn: async () => (await instance.get(api.getVitals(patientId))).data.data,
    enabled: !!patientId,
  });
}

export function useAddVitals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => instance.post(api.addVitals, data),
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({queryKey: ['vitals', vars.patientId]});
      Toast.show({type: 'success', text1: 'Vitals Recorded'});
    },
    onError: (e: any) => Toast.show({type: 'error', text1: 'Error', text2: e?.response?.data?.message}),
  });
}

// ─── Outpatient ───────────────────────────────────────────────────────────────
export function useAppointments(params?: {search?: string; status?: string; page?: number}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => (await instance.get(api.getAllAppointments, {params})).data,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => (await instance.get(`/api/v1/patient/getAppointment/${id}`)).data.data,
    enabled: !!id,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => instance.post(api.createAppointment, data),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['appointments']});
      Toast.show({type: 'success', text1: 'Appointment Booked'});
    },
    onError: (e: any) => Toast.show({type: 'error', text1: 'Error', text2: e?.response?.data?.message}),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({id, status}: {id: string; status: string}) =>
      instance.patch(api.updateAppointmentStatus, {appointmentId: id, status}),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['appointments']});
      Toast.show({type: 'success', text1: 'Status Updated'});
    },
    onError: (e: any) => Toast.show({type: 'error', text1: 'Error', text2: e?.response?.data?.message}),
  });
}

// ─── Doctor Slots ─────────────────────────────────────────────────────────────
export function useDoctorDates(doctorId: string) {
  return useQuery({
    queryKey: ['doctor-dates', doctorId],
    queryFn: async () => (await instance.get(api.getDoctorDates(doctorId))).data.data,
    enabled: !!doctorId,
  });
}

export function useTimeSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['time-slots', doctorId, date],
    queryFn: async () => (await instance.get(api.getTimeSlots(doctorId, date))).data.data,
    enabled: !!doctorId && !!date,
  });
}

// ─── Patients ─────────────────────────────────────────────────────────────────
export function usePatients(params?: {search?: string}) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: async () => (await instance.get(api.getPatients, {params})).data,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => (await instance.get(api.getPatientsById(id))).data.data,
    enabled: !!id,
  });
}

export function usePatientHistory(id: string) {
  return useQuery({
    queryKey: ['patient-history', id],
    queryFn: async () => (await instance.get(api.getPatientHistory(id))).data.data,
    enabled: !!id,
  });
}

export function usePrescriptions(patientId: string) {
  return useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: async () => (await instance.get(api.getPrescriptions(patientId))).data.data,
    enabled: !!patientId,
  });
}

// ─── Lab ──────────────────────────────────────────────────────────────────────
export function useLabOrders(params?: {search?: string; status?: string}) {
  return useQuery({
    queryKey: ['lab-orders', params],
    queryFn: async () => (await instance.get(api.getLabOrders, {params})).data,
  });
}

export function useLabOrder(id: string) {
  return useQuery({
    queryKey: ['lab-order', id],
    queryFn: async () => (await instance.get(api.getLabOrderById(id))).data.data,
    enabled: !!id,
  });
}

export function useUpdateLabOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => instance.patch(api.updateLabOrder(id), data),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['lab-order', id]});
      qc.invalidateQueries({queryKey: ['lab-orders']});
      Toast.show({type: 'success', text1: 'Lab Order Updated'});
    },
    onError: (e: any) => Toast.show({type: 'error', text1: 'Error', text2: e?.response?.data?.message}),
  });
}

// ─── Pharmacy ─────────────────────────────────────────────────────────────────
export function usePharmacyBills(params?: {search?: string}) {
  return useQuery({
    queryKey: ['pharmacy-bills', params],
    queryFn: async () => (await instance.get(api.getPharmacyBills, {params})).data,
  });
}

export function usePharmacyBill(id: string) {
  return useQuery({
    queryKey: ['pharmacy-bill', id],
    queryFn: async () => (await instance.get(api.getPharmacyBillById(id))).data.data,
    enabled: !!id,
  });
}

export function useCreatePharmacyBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => instance.post(api.createPharmacyBill, data),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ['pharmacy-bills']});
      Toast.show({type: 'success', text1: 'Bill Generated'});
    },
    onError: (e: any) => Toast.show({type: 'error', text1: 'Error', text2: e?.response?.data?.message}),
  });
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export function useStaff(params?: {search?: string}) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: async () => (await instance.get(api.getAllStaff, {params})).data,
  });
}
