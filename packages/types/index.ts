export type LivyaRole = 'patient' | 'super_admin' | 'admin' | 'doctor' | 'crm' | 'staff';

export type HealthMetric = {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  unit?: string | null;
  recorded_at: string;
};

export type PatientProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role: LivyaRole;
};

export type AiInsight = {
  score?: number | null;
  summary?: string | null;
  recommendations: string[];
  confidence?: number | null;
};
