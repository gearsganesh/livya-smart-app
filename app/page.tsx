'use client';

import { useMemo, useState } from 'react';
import {
  Activity, Bell, CalendarDays, ChevronRight, Droplets, FileText, HeartPulse,
  LayoutDashboard, Menu, MessageCircle, Pill, ShieldAlert, ShoppingBag,
  Sparkles, Stethoscope, UserRound, Watch, X
} from 'lucide-react';

type Mode = 'patient' | 'admin';

type Screen = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

const patientScreens: Screen[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'health', label: 'Health monitoring', icon: HeartPulse },
  { id: 'medicines', label: 'Medicines', icon: Pill },
  { id: 'records', label: 'Health records', icon: FileText },
  { id: 'nutrition', label: 'My plan', icon: Droplets },
  { id: 'wellness', label: 'Wellness', icon: Activity },
  { id: 'store', label: 'Store', icon: ShoppingBag },
  { id: 'labs', label: 'Lab tests', icon: Stethoscope },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'ai', label: 'LIVYA AI', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const adminScreens: Screen[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: UserRound },
  { id: 'alerts', label: 'Vital alerts', icon: ShieldAlert },
  { id: 'records-review', label: 'Records & AI review', icon: FileText },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'nutrition-admin', label: 'Nutrition · diet chart', icon: Droplets },
  { id: 'programmes', label: 'Programmes', icon: Activity },
  { id: 'therapies', label: 'Therapies & therapists', icon: HeartPulse },
  { id: 'orders', label: 'Store & orders', icon: ShoppingBag },
  { id: 'labs-admin', label: 'Lab partners & bookings', icon: Stethoscope },
  { id: 'members', label: 'Members & plan builder', icon: UserRound },
  { id: 'scheduler', label: 'Scheduler', icon: CalendarDays },
];

const patientWidgets = [
  { title: 'Health Score', value: '78', note: 'Steady · protect your sleep tonight', icon: HeartPulse },
  { title: 'Today’s medicines', value: '3 / 3', note: 'All doses on track', icon: Pill },
  { title: 'Recovery', value: '81', note: 'Good day for your yoga session', icon: Activity },
  { title: 'Hydration', value: '1.2 / 2.5 L', note: '48% of today’s goal', icon: Droplets },
];

function Stat({ title, value, note, icon: Icon }: { title: string; value: string; note: string; icon: Screen['icon'] }) {
  return (
    <div className="stat-card">
      <div className="icon-box"><Icon size={18} /></div>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('patient');
  const [screen, setScreen] = useState('home');
  const [drawer, setDrawer] = useState(false);

  const screens = mode === 'patient' ? patientScreens : adminScreens;
  const active = useMemo(() => screens.find((s) => s.id === screen) ?? screens[0], [screen, screens]);

  function switchMode(next: Mode) {
    setMode(next);
    setScreen(next === 'patient' ? 'home' : 'dashboard');
    setDrawer(false);
  }

  return (
    <main className="app-shell">
      <aside className={`rail ${drawer ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark">L</div><span>LIVYA AI</span></div>
        <div className="mode-switch">
          <button className={mode === 'patient' ? 'active' : ''} onClick={() => switchMode('patient')}>Patient</button>
          <button className={mode === 'admin' ? 'active' : ''} onClick={() => switchMode('admin')}>Admin</button>
        </div>
        <nav>
          {screens.map(({ id, label, icon: Icon }) => (
            <button key={id} className={screen === id ? 'nav-item active' : 'nav-item'} onClick={() => { setScreen(id); setDrawer(false); }}>
              <Icon size={17} /><span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setDrawer(!drawer)} aria-label="Menu"><Menu size={21} /></button>
          <div><div className="eyebrow">{mode === 'patient' ? 'PATIENT APP' : 'ADMIN CONSOLE'}</div><h1>{active.label}</h1></div>
          <div className="top-actions">
            <button className="circle"><Bell size={18} /></button>
            <button className="circle"><MessageCircle size={18} /></button>
            <div className="avatar">PR</div>
          </div>
        </header>

        {mode === 'patient' ? (
          <PatientView screen={screen} />
        ) : (
          <AdminView screen={screen} />
        )}
      </section>

      {drawer && <button className="scrim" onClick={() => setDrawer(false)} aria-label="Close menu" />}
    </main>
  );
}

function PatientView({ screen }: { screen: string }) {
  if (screen === 'home') return <>
    <div className="hero-row"><div><span className="pill">Tue 10 Sep · Chennai</span><h2>Good morning, Priya</h2><p>Your health, coordinated. Here’s what needs your attention today.</p></div><button className="sos"><ShieldAlert size={18} /> SOS</button></div>
    <div className="grid four">{patientWidgets.map((w) => <Stat key={w.title} {...w} />)}</div>
    <div className="grid two content-grid">
      <Panel title="Today’s medicines" action="View schedule"><ListRow icon={<Pill size={18} />} title="Metformin 500 mg" subtitle="After breakfast · 8:00 AM" value="Taken 8:05" /><ListRow icon={<Pill size={18} />} title="Atorvastatin 10 mg" subtitle="Night · 9:00 PM" value="Upcoming" /></Panel>
      <Panel title="Health monitoring" action="See vitals"><TrendCard /></Panel>
    </div>
    <div className="grid three"><MiniCard icon={<Droplets size={19} />} title="Log water" text="48% of today’s goal" /><MiniCard icon={<Watch size={19} />} title="Devices" text="Watch synced 4 min ago" /><MiniCard icon={<CalendarDays size={19} />} title="Scheduler" text="Yoga · Thu 7:00 AM" /></div>
  </>;

  const copy: Record<string, { title: string; text: string }> = {
    health: { title: 'Health monitoring', text: 'Vitals, wearable data, manual offline readings, trends and alarm thresholds will live here.' },
    medicines: { title: 'Medicines', text: 'Medication schedule, adherence, stock, refill and prescription-linked ordering.' },
    records: { title: 'Health records', text: 'Upload reports, review AI extraction and compare health markers over time.' },
    nutrition: { title: 'My plan', text: 'Programme targets, diet chart, recipes, coach notes and progress.' },
    wellness: { title: 'Wellness', text: 'Therapies, sessions, therapists, bookings and plan consumption.' },
    store: { title: 'Store', text: 'Prescribed medicines, devices, supplements, cart and checkout.' },
    labs: { title: 'Lab tests', text: 'Advised tests, partner labs, home collection and slot booking.' },
    schedule: { title: 'Schedule', text: 'Consultations, therapy, treatment and lab appointments in one calendar.' },
    ai: { title: 'LIVYA AI', text: 'A patient-aware assistant that can use authorised records, medicines and programme context.' },
    profile: { title: 'Profile', text: 'Personal details, family members, membership and connected health settings.' },
  };
  const item = copy[screen] ?? copy.health;
  return <EmptyFeature title={item.title} text={item.text} />;
}

function AdminView({ screen }: { screen: string }) {
  if (screen === 'dashboard') return <>
    <div className="hero-row"><div><span className="pill">Wednesday 10 Sep 2026 · Chennai hubs · Live</span><h2>Good morning, Dr. Krishnan</h2><p>Operational overview across patients, care, bookings and AI review queues.</p></div><button className="primary"><CalendarDays size={17} /> Open scheduler</button></div>
    <div className="grid four"><Stat title="Active members" value="1,284" note="+62 this month" icon={UserRound} /><Stat title="Vital alerts" value="7" note="2 critical · 5 open" icon={ShieldAlert} /><Stat title="AI review queue" value="12" note="3 high priority" icon={Sparkles} /><Stat title="Bookings today" value="48" note="6 home visits" icon={CalendarDays} /></div>
    <div className="grid two content-grid"><Panel title="Vital alerts" action="Open alerts"><ListRow icon={<ShieldAlert size={18} />} title="Priya Raghavan · BP" subtitle="128/84 · manual · 7:40 AM" value="Normal" /><ListRow icon={<ShieldAlert size={18} />} title="Arun Kumar · SpO₂" subtitle="91% · wearable · 8:14 AM" value="Critical" /></Panel><Panel title="Records & AI review" action="Review queue"><ListRow icon={<FileText size={18} />} title="Ultrasound abdomen · Priya R." subtitle="Uploaded 9 Sep · AI extracted" value="Review" /><ListRow icon={<FileText size={18} />} title="Lipid profile · Karthik S." subtitle="Low confidence on LDL" value="Review" /></Panel></div>
  </>;
  const labels: Record<string, string> = Object.fromEntries(adminScreens.map(s => [s.id, s.label]));
  return <EmptyFeature title={labels[screen] ?? 'Admin'} text="This module is mapped from the prototype and is now reserved for its production workflow, permissions and Supabase-backed data." admin />;
}

function Panel({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-head"><h3>{title}</h3><button>{action}<ChevronRight size={15} /></button></div>{children}</section>;
}

function ListRow({ icon, title, subtitle, value }: { icon: React.ReactNode; title: string; subtitle: string; value: string }) {
  return <div className="list-row"><div className="row-icon">{icon}</div><div className="row-copy"><strong>{title}</strong><span>{subtitle}</span></div><span className="row-value">{value}</span></div>;
}

function TrendCard() {
  return <div className="trend"><div className="trend-head"><strong>Recovery Score</strong><b>81</b></div><div className="bars">{[38, 48, 43, 60, 52, 72, 66, 81].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div><div className="trend-foot"><span>Mon</span><span>Today</span></div></div>;
}

function MiniCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="mini-card"><div className="icon-box">{icon}</div><strong>{title}</strong><span>{text}</span><ChevronRight size={16} /></div>;
}

function EmptyFeature({ title, text, admin = false }: { title: string; text: string; admin?: boolean }) {
  return <div className={`feature-placeholder ${admin ? 'admin' : ''}`}><div className="feature-icon"><Sparkles size={25} /></div><h2>{title}</h2><p>{text}</p><div className="feature-tags"><span>Prototype mapped</span><span>Supabase ready</span><span>{admin ? 'Role controlled' : 'Patient scoped'}</span></div></div>;
}
