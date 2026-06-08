export const COLORS = {
  primary: '#2563eb',       // blue-600
  primaryLight: '#eff6ff',  // blue-50
  secondary: '#64748b',     // slate-500
  success: '#16a34a',       // green-600
  successLight: '#f0fdf4',
  warning: '#d97706',       // amber-600
  warningLight: '#fffbeb',
  error: '#dc2626',         // red-600
  errorLight: '#fef2f2',
  purple: '#7c3aed',
  orange: '#ea580c',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  background: '#f8fafc',    // slate-50
  card: '#ffffff',
  border: '#e2e8f0',        // slate-200
  borderLight: '#f1f5f9',   // slate-100

  // Text
  text: '#0f172a',          // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#94a3b8',     // slate-400
  textWhite: '#ffffff',

  // Status badge colors
  admitted: '#dbeafe',      // blue-100
  admittedText: '#1d4ed8',
  planned: '#dcfce7',       // green-100
  plannedText: '#15803d',
  discharged: '#f1f5f9',    // slate-100
  dischargedText: '#475569',
  cancelled: '#fee2e2',     // red-100
  cancelledText: '#dc2626',
  completed: '#d1fae5',
  completedText: '#065f46',
  inProgress: '#fef3c7',
  inProgressText: '#92400e',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
};
