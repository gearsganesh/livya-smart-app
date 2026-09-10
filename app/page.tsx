'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Bell, CalendarDays, ChevronRight, Droplets, FileText, HeartPulse,
  LayoutDashboard, Menu, MessageCircle, Pill, ShieldAlert, ShoppingBag,
  Sparkles, Stethoscope, UserRound, Watch, LogOut, Plus, RefreshCw
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Mode = 'patient' | 'admin';
type Screen = { id: string; label: string; icon: React.ComponentType<{ size?: number }> };
type UserProfile = { full_name: string | null; email: string | null; phone: string | null };
type Patient = { id: string; patient_code: string | null; plan_name: string | null; status: string };
type Vital = { id: string; vital_type: string; value: number | null; secondary_value: number | null; unit: string | null; source: string; measured_at: string };
type MedicationRow = { id: string; scheduled_at: string; status: string; medication: { name: string; strength: string | null } | null };
type Appointment = { id: string; title: string; appointment_type: string; starts_at: string; location: string | null; mode: string | null; status: string };

const supabase = createSupabaseBrowserClient();

const patientScreens: Screen[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard }, { id: 'health', label: 'Health monitoring', icon: HeartPulse },
  { id: 'medicines', label: 'Medicines', icon: Pill }, { id: 'records', label: 'Health records', icon: FileText },
  { id: 'nutrition', label: 'My plan', icon: Droplets }, { id: 'wellness', label: 'Wellness', icon: Activity },
  { id: 'store', label: 'Store', icon: ShoppingBag }, { id: 'labs', label: 'Lab tests', icon: Stethoscope },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays }, { id: 'ai', label: 'LIVYA AI', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: UserRound },
];
const adminScreens: Screen[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'patients', label: 'Patients', icon: UserRound },
  { id: 'alerts', label: 'Vital alerts', icon: ShieldAlert }, { id: 'records-review', label: 'Records & AI review', icon: FileText },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill }, { id: 'nutrition-admin', label: 'Nutrition · diet chart', icon: Droplets },
  { id: 'programmes', label: 'Programmes', icon: Activity }, { id: 'therapies', label: 'Therapies & therapists', icon: HeartPulse },
  { id: 'orders', label: 'Store & orders', icon: ShoppingBag }, { id: 'labs-admin', label: 'Lab partners & bookings', icon: Stethoscope },
  { id: 'members', label: 'Members & plan builder', icon: UserRound }, { id: 'scheduler', label: 'Scheduler', icon: CalendarDays },
];

export default function Home() {
  const [session, setSession] = useState<{ userId: string; email: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [mode, setMode] = useState<Mode>('patient');
  const [screen, setScreen] = useState('home');
  const [drawer, setDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) loadUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => loadUser(next?.user ?? null));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function loadUser(user: { id: string; email?: string | null } | null) {
    if (!user) { setSession(null); setProfile(null); setPatient(null); setIsStaff(false); setLoading(false); return; }
    setLoading(true);
    const [{ data: p }, { data: staff }] = await Promise.all([
      supabase.from('profiles').select('full_name,email,phone').eq('id', user.id).maybeSingle(),
      supabase.from('staff_users').select('id,role,active').eq('user_id', user.id).eq('active', true).maybeSingle(),
    ]);
    let { data: pt } = await supabase.from('patients').select('id,patient_code,plan_name,status').eq('user_id', user.id).maybeSingle();
    if (!pt) {
      const { data: created } = await supabase.from('patients').insert({ user_id: user.id, profile_id: user.id, status: 'active' }).select('id,patient_code,plan_name,status').single();
      pt = created;
    }
    setSession({ userId: user.id, email: user.email ?? null });
    setProfile(p);
    setPatient(pt);
    setIsStaff(Boolean(staff));
    setMode(staff ? 'admin' : 'patient');
    setScreen(staff ? 'dashboard' : 'home');
    setLoading(false);
  }

  async function signOut() { await supabase.auth.signOut(); }

  if (loading) return <main className="auth-shell"><div className="auth-card"><div className="brand auth-brand"><div className="brand-mark">L</div><span>LIVYA AI</span></div><div className="loading-dot" /><p>Connecting your care workspace…</p></div></main>;
  if (!session) return <AuthScreen />;

  const screens = mode === 'patient' ? patientScreens : adminScreens;
  const active = useMemo(() => screens.find((s) => s.id === screen) ?? screens[0], [screen, mode]);
  function switchMode(next: Mode) { if (next === 'admin' && !isStaff) return; setMode(next); setScreen(next === 'patient' ? 'home' : 'dashboard'); setDrawer(false); }

  return <main className="app-shell">
    <aside className={`rail ${drawer ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">L</div><span>LIVYA AI</span></div>
      <div className="mode-switch"><button className={mode === 'patient' ? 'active' : ''} onClick={() => switchMode('patient')}>Patient</button><button className={`${mode === 'admin' ? 'active' : ''} ${!isStaff ? 'disabled' : ''}`} onClick={() => switchMode('admin')}>Admin</button></div>
      <nav>{screens.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'nav-item active' : 'nav-item'} onClick={() => { setScreen(id); setDrawer(false); }}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <button className="signout" onClick={signOut}><LogOut size={16} /> Sign out</button>
    </aside>
    <section className="workspace">
      <header className="topbar"><button className="mobile-menu" onClick={() => setDrawer(!drawer)} aria-label="Menu"><Menu size={21} /></button><div><div className="eyebrow">{mode === 'patient' ? 'PATIENT APP' : 'ADMIN CONSOLE'}</div><h1>{active.label}</h1></div><div className="top-actions"><button className="circle"><Bell size={18} /></button><button className="circle"><MessageCircle size={18} /></button><div className="avatar">{initials(profile?.full_name || profile?.email || 'LIVYA')}</div></div></header>
      {mode === 'patient' ? <PatientView patient={patient} profile={profile} screen={screen} /> : <AdminView screen={screen} />}
    </section>
    {drawer && <button className="scrim" onClick={() => setDrawer(false)} aria-label="Close menu" />}
  </main>;
}

function AuthScreen() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function sendCode(e: React.FormEvent) { e.preventDefault(); setError(''); setBusy(true); const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } }); setBusy(false); if (err) setError(err.message); else setSent(true); }
  return <main className="auth-shell"><div className="auth-card"><div className="brand auth-brand"><div className="brand-mark">L</div><span>LIVYA AI</span></div><div className="eyebrow">SECURE CARE ACCESS</div><h1>{sent ? 'Check your email' : 'Welcome to LIVYA'}</h1><p>{sent ? `A secure sign-in link was sent to ${email}.` : 'Your health, coordinated. Sign in to continue to your care workspace.'}</p>{sent ? <button className="primary full" onClick={() => setSent(false)}>Use another email</button> : <form onSubmit={sendCode}><label>Email address</label><input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="primary full" disabled={busy}>{busy ? 'Sending…' : 'Send secure sign-in link'}</button></form>}{error && <div className="error-box">{error}</div>}<small>No password to remember. Humanity has suffered enough passwords.</small></div></main>;
}

function PatientView({ patient, profile, screen }: { patient: Patient | null; profile: UserProfile | null; screen: string }) {
  if (screen === 'home') return <PatientHome patient={patient} profile={profile} />;
  if (screen === 'health') return <HealthView patientId={patient?.id} />;
  const copy: Record<string, { title: string; text: string }> = {
    medicines: { title: 'Medicines', text: 'Medication schedule, adherence, stock, refill and prescription-linked ordering.' }, records: { title: 'Health records', text: 'Upload reports, review AI extraction and compare health markers over time.' },
    nutrition: { title: 'My plan', text: 'Programme targets, diet chart, recipes, coach notes and progress.' }, wellness: { title: 'Wellness', text: 'Therapies, sessions, therapists, bookings and plan consumption.' },
    store: { title: 'Store', text: 'Prescribed medicines, devices, supplements, cart and checkout.' }, labs: { title: 'Lab tests', text: 'Advised tests, partner labs, home collection and slot booking.' },
    schedule: { title: 'Schedule', text: 'Consultations, therapy, treatment and lab appointments in one calendar.' }, ai: { title: 'LIVYA AI', text: 'A patient-aware assistant that can use authorised records, medicines and programme context.' }, profile: { title: 'Profile', text: 'Personal details, family members, membership and connected health settings.' },
  };
  const item = copy[screen] ?? copy.medicines; return <EmptyFeature title={item.title} text={item.text} />;
}

function PatientHome({ patient, profile }: { patient: Patient | null; profile: UserProfile | null }) {
  const [vitals, setVitals] = useState<Vital[]>([]); const [meds, setMeds] = useState<MedicationRow[]>([]); const [appointments, setAppointments] = useState<Appointment[]>([]); const [refreshing, setRefreshing] = useState(false);
  async function load() { if (!patient) return; setRefreshing(true); const [v, m, a] = await Promise.all([
    supabase.from('vitals').select('id,vital_type,value,secondary_value,unit,source,measured_at').eq('patient_id', patient.id).order('measured_at', { ascending: false }).limit(8),
    supabase.from('medication_schedule').select('id,scheduled_at,status, prescription_item:prescription_items(medication:medications(name,strength))').eq('patient_id', patient.id).order('scheduled_at', { ascending: true }).limit(4),
    supabase.from('appointments').select('id,title,appointment_type,starts_at,location,mode,status').eq('patient_id', patient.id).gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(3),
  ]); setVitals(v.data ?? []); setMeds((m.data ?? []) as unknown as MedicationRow[]); setAppointments(a.data ?? []); setRefreshing(false); }
  useEffect(() => { load(); }, [patient?.id]);
  const latest = latestVitals(vitals); const name = profile?.full_name?.split(' ')[0] || 'there';
  return <><div className="hero-row"><div><span className="pill">{formatDate(new Date())} · Chennai</span><h2>Good morning, {name}</h2><p>Your health, coordinated. Here’s what needs your attention today.</p></div><button className="sos"><ShieldAlert size={18} /> SOS</button></div><div className="grid four"><Stat title="Health Score" value="78" note="Steady · protect your sleep tonight" icon={HeartPulse} /><Stat title="Today’s medicines" value={meds.filter(m => m.status === 'taken').length + ' / ' + meds.length} note="Live from your schedule" icon={Pill} /><Stat title="Recovery" value="81" note="Good day for your yoga session" icon={Activity} /><Stat title="Hydration" value="1.2 / 2.5 L" note="48% of today’s goal" icon={Droplets} /></div><div className="grid two content-grid"><Panel title="Latest vitals" action="Health monitoring"><div className="vital-list">{latest.length ? latest.map(v => <ListRow key={v.id} icon={<HeartPulse size={18} />} title={prettyVital(v.vital_type)} subtitle={`${v.source} · ${formatTime(v.measured_at)}`} value={`${v.value ?? '—'} ${v.unit ?? ''}`} />) : <EmptyInline text="No vitals synced yet." />}</div></Panel><Panel title="Upcoming care" action="View schedule">{appointments.length ? appointments.map(a => <ListRow key={a.id} icon={<CalendarDays size={18} />} title={a.title} subtitle={`${formatTime(a.starts_at)} · ${a.mode || a.location || a.appointment_type}`} value="Booked" />) : <EmptyInline text="No upcoming appointments." />}</Panel></div><div className="grid three"><MiniCard icon={<Droplets size={19} />} title="Log water" text="48% of today’s goal" /><MiniCard icon={<Watch size={19} />} title="Devices" text="Connect a wearable" /><MiniCard icon={<RefreshCw size={19} />} title="Sync" text={refreshing ? 'Refreshing…' : 'Data is current'} onClick={load} /></div></>;
}

function HealthView({ patientId }: { patientId?: string }) { const [type, setType] = useState('blood_pressure'); const [value, setValue] = useState(''); const [saved, setSaved] = useState(false); async function addVital(e: React.FormEvent) { e.preventDefault(); if (!patientId || !value) return; const { error } = await supabase.from('vitals').insert({ patient_id: patientId, vital_type: type, value: Number(value), unit: type === 'heart_rate' ? 'bpm' : type === 'oxygen_saturation' ? '%' : type === 'temperature' ? '°C' : 'mmHg', source: 'manual', sync_status: 'synced' }); if (!error) { setValue(''); setSaved(true); setTimeout(() => setSaved(false), 2500); } } return <div className="module-grid"><section className="panel"><div className="panel-head"><h3>Log a vital</h3><span className="panel-badge">Offline-ready foundation</span></div><form className="vital-form" onSubmit={addVital}><label>Vital<select value={type} onChange={e => setType(e.target.value)}><option value="blood_pressure">Blood pressure</option><option value="heart_rate">Heart rate</option><option value="oxygen_saturation">SpO₂</option><option value="temperature">Temperature</option><option value="weight">Weight</option></select></label><label>Reading<input inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} placeholder="Enter value" /></label><button className="primary"><Plus size={17} /> Save reading</button></form>{saved && <div className="success-box">Vital saved securely to your LIVYA record.</div>}</section><section className="feature-placeholder compact"><div className="feature-icon"><HeartPulse size={25} /></div><h2>Wearables & trends</h2><p>Continuous readings, device sync, thresholds and trend charts are next in this module.</p></section></div>; }

function AdminView({ screen }: { screen: string }) { if (screen === 'dashboard') return <><div className="hero-row"><div><span className="pill">10 Sep 2026 · Chennai hubs · Live</span><h2>Care operations</h2><p>Operational overview across patients, care, bookings and AI review queues.</p></div><button className="primary"><CalendarDays size={17} /> Open scheduler</button></div><div className="grid four"><Stat title="Active members" value="1,284" note="Connect member data next" icon={UserRound} /><Stat title="Vital alerts" value="7" note="Live alert queue next" icon={ShieldAlert} /><Stat title="AI review queue" value="12" note="Records awaiting review" icon={Sparkles} /><Stat title="Bookings today" value="48" note="Across care teams" icon={CalendarDays} /></div><div className="grid two content-grid"><Panel title="Vital alerts" action="Open alerts"><ListRow icon={<ShieldAlert size={18} />} title="Alert engine ready" subtitle="Threshold rules are stored in Supabase" value="Ready" /></Panel><Panel title="Records & AI review" action="Review queue"><ListRow icon={<FileText size={18} />} title="Review workflow" subtitle="Health records + measurements schema deployed" value="Ready" /></Panel></div></>; const labels: Record<string, string> = Object.fromEntries(adminScreens.map(s => [s.id, s.label])); return <EmptyFeature title={labels[screen] ?? 'Admin'} text="This production module is mapped from the prototype and will be backed by role-controlled Supabase data." admin />; }

function Stat({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: Screen['icon'] }) { return <div className="stat-card"><div className="icon-box"><Icon size={18} /></div><div className="stat-title">{title}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function Panel({ title, action, children }: { title: string; action: string; children: React.ReactNode }) { return <section className="panel"><div className="panel-head"><h3>{title}</h3><button>{action}<ChevronRight size={15} /></button></div>{children}</section>; }
function ListRow({ icon, title, subtitle, value }: { icon: React.ReactNode; title: string; subtitle: string; value: string }) { return <div className="list-row"><div className="row-icon">{icon}</div><div className="row-copy"><strong>{title}</strong><span>{subtitle}</span></div><span className="row-value">{value}</span></div>; }
function MiniCard({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick?: () => void }) { return <button className="mini-card" onClick={onClick}><div className="icon-box">{icon}</div><strong>{title}</strong><span>{text}</span><ChevronRight size={16} /></button>; }
function EmptyInline({ text }: { text: string }) { return <div className="empty-inline">{text}</div>; }
function EmptyFeature({ title, text, admin = false }: { title: string; text: string; admin?: boolean }) { return <div className={`feature-placeholder ${admin ? 'admin' : ''}`}><div className="feature-icon"><Sparkles size={25} /></div><h2>{title}</h2><p>{text}</p><div className="feature-tags"><span>Prototype mapped</span><span>Supabase connected</span><span>{admin ? 'Role controlled' : 'Patient scoped'}</span></div></div>; }
function initials(name: string) { return name.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
function formatDate(d: Date) { return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }); }
function formatTime(value: string) { return new Date(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }); }
function prettyVital(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function latestVitals(vitals: Vital[]) { const seen = new Set<string>(); return vitals.filter(v => { if (seen.has(v.vital_type)) return false; seen.add(v.vital_type); return true; }).slice(0, 4); }
