// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENT STORE — in-memory store shared across all screens.
// New appointments added here will reflect in AdminAppointments &
// DoctorAppointments screens immediately.
//
// TODO: Replace with real API calls + React Query cache invalidation
// when backend is ready.
// ─────────────────────────────────────────────────────────────────────────────

import {AppointmentRecord, MOCK_APPOINTMENTS} from './mockHospitalData';

// Mutable in-memory list — starts with mock data
let appointments: AppointmentRecord[] = [...MOCK_APPOINTMENTS];

// Subscribers — screens register here to get notified on changes
type Listener = (appointments: AppointmentRecord[]) => void;
const listeners: Listener[] = [];

export function getAppointments(): AppointmentRecord[] {
  return appointments;
}

export function addAppointment(appt: AppointmentRecord): void {
  appointments = [appt, ...appointments];
  notifyAll();
}

export function updateAppointmentStatus(id: string, status: AppointmentRecord['status']): void {
  appointments = appointments.map(a => a.id === id ? {...a, status} : a);
  notifyAll();
}

export function deleteAppointment(id: string): void {
  appointments = appointments.filter(a => a.id !== id);
  notifyAll();
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

function notifyAll() {
  listeners.forEach(l => l(appointments));
}