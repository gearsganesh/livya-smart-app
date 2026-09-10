import type { ReactNode } from 'react';

export type CardShellProps = {
  children: ReactNode;
  className?: string;
};

export function CardShell({ children, className = '' }: CardShellProps) {
  return <section className={`livya-card ${className}`}>{children}</section>;
}

export type MetricBadgeProps = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

export function MetricBadge({ label, value, tone = 'default' }: MetricBadgeProps) {
  return (
    <span className={`livya-metric livya-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}
