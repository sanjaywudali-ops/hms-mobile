import {format, formatDistanceToNow, isToday, isYesterday} from 'date-fns';

// ─── Date Formatting ─────────────────────────────────────────────────────────
export function formatDate(dateString?: string | null, pattern = 'dd MMM yyyy'): string {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), pattern);
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
  } catch {
    return '—';
  }
}

export function formatRelative(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isToday(date)) return `Today at ${format(date, 'hh:mm a')}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, 'hh:mm a')}`;
    return format(date, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function timeAgo(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    return formatDistanceToNow(new Date(dateString), {addSuffix: true});
  } catch {
    return '—';
  }
}

// ─── Currency ────────────────────────────────────────────────────────────────
export function formatCurrency(amount?: number | null, symbol = '₹'): string {
  if (amount == null) return '—';
  return `${symbol}${amount.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 2})}`;
}

// ─── Name ────────────────────────────────────────────────────────────────────
export function fullName(user?: {fName?: string; lName?: string} | null): string {
  if (!user) return '—';
  return [user.fName, user.lName].filter(Boolean).join(' ') || '—';
}

export function doctorName(doctor?: {user?: {fName?: string; lName?: string}} | null): string {
  if (!doctor?.user) return '—';
  return `Dr. ${fullName(doctor.user)}`;
}

// ─── Status ──────────────────────────────────────────────────────────────────
export function admissionStatusVariant(status?: string): any {
  const map: Record<string, any> = {
    ADMITTED: 'admitted',
    PLANNED: 'planned',
    DISCHARGE_STARTED: 'inProgress',
    DISCHARGED: 'discharged',
    CANCELLED: 'cancelled',
  };
  return map[status || ''] || 'default';
}

export function appointmentStatusVariant(status?: string): any {
  const map: Record<string, any> = {
    CONFIRMED: 'planned',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status || ''] || 'default';
}

export function labStatusVariant(status?: string): any {
  const map: Record<string, any> = {
    PENDING: 'planned',
    IN_PROGRESS: 'inProgress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status || ''] || 'default';
}

export function roomStatusVariant(status?: string): any {
  const map: Record<string, any> = {
    AVAILABLE: 'planned',
    OCCUPIED: 'admitted',
    MAINTENANCE: 'cancelled',
    RESERVED: 'inProgress',
  };
  return map[status || ''] || 'default';
}

// ─── Strings ─────────────────────────────────────────────────────────────────
export function capitalize(str?: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str?: string, maxLen = 40): string {
  if (!str) return '—';
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

// ─── Validation ──────────────────────────────────────────────────────────────
export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Greeting ────────────────────────────────────────────────────────────────
export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
