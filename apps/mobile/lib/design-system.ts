export const colors = {
  deepSpace: '#090d16',
  cardDark: '#131b2e',
  border: '#1c2842',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  white: '#f8fafc',
  secondary: '#94a3b8',
  muted: '#64748b',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  transparent: 'transparent',
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
} as const;

export const spacing = {
  screen: 16,
  card: 16,
  section: 24,
  control: 12,
  safe: 16,
} as const;

export const typography = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.5 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.2 },
  metric: { fontSize: 30, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -1.2 },
  monoMetric: { fontSize: 28, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -1 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  glow: {
    shadowColor: colors.violet,
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

export const glass = {
  dark: {
    backgroundColor: 'rgba(19,27,46,0.88)',
    borderColor: 'rgba(28,40,66,0.95)',
  },
  light: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderColor: 'rgba(148,163,184,0.25)',
  },
} as const;

export const nativeWind = {
  screen: 'flex-1 bg-[#090d16] dark:bg-[#090d16]',
  card: 'rounded-2xl border border-[#1c2842] bg-[#131b2e]',
  title: 'text-[28px] leading-[34px] font-bold tracking-tight text-[#f8fafc]',
  body: 'text-[15px] leading-[22px] text-[#94a3b8]',
  muted: 'text-xs text-[#64748b]',
} as const;
