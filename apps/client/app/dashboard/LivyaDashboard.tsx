'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Section = 'today' | 'health' | 'medicines' | 'records' | 'care';
type DashboardData = { healthScore: number | null; hydrationMl: number | null; mood: number | null; focus: number | null; note?: string | null };
const sections: Section[] = ['today', 'health', 'medicines', 'records', 'care'];
const icons: Record<Section, string> = { today: '⌂', health: '◉', medicines: '✚', records: '▣', care: '✦' };
const label = (s: Section) => s === 'today' ? 'Today' : s[0].toUpperCase() + s.slice(1);

export default function LivyaDashboard({ name }: { name: string }) {
  const [section, setSection] = useState<Section>('today');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<DashboardData>('/dashboard').then(setData).catch((e: Error) => setError(e.message));
  }, []);

  const first = name.split(' ')[0] || 'there';
  const avatar = name.slice(0, 2).toUpperCase();

  return <main className="livya-app">
    <div className="app-topbar"><div className="brand-mark"><span>LIVYA</span><small>HEALTH PLATFORM</small></div><div className="top-actions"><button className="icon-btn" aria-label="Search">⌕</button><button className="avatar" aria-label="Profile">{avatar}</button></div></div>
    <div className="app-layout">
      <aside className="app-side"><div className="side-label">Your care</div>{sections.map(s => <button key={s} className={section === s ? 'side-link active' : 'side-link'} onClick={() => setSection(s)}><span>{icons[s]}</span>{label(s)}</button>)}<div className="side-label side-label-gap">Quick actions</div><button className="side-link"><span>＋</span>Add reading</button><button className="side-link"><span>🆘</span>Emergency SOS</button></aside>
      <section className="app-content"><div className="day-row"><div>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div><span className="live-dot">●</span><div>{data ? 'Synced' : 'Loading'}</div></div>
        <header className="welcome"><div><span className="eyebrow-dark">GOOD MORNING</span><h1>Hello, {first}</h1><p>Your health, coordinated. Everything important in one calm view.</p></div></header>
        {error && <div className="auth-error" role="alert">Unable to load your health data. {error}</div>}
        {section === 'today' && <Today data={data} setSection={setSection} />}
        {section === 'health' && <EmptyPanel title="Health monitoring" sub="Live and manual measurements, trends and alarms" message="No health measurements have been recorded yet." action="Add manual reading" />}
        {section === 'medicines' && <EmptyPanel title="Medicines" sub="Your prescribed medicines and adherence" message="No medicines have been added to your account yet." action="Add medicine" />}
        {section === 'records' && <EmptyPanel title="Health records" sub="Encrypted records, smart analysis and prescriptions" message="No health records have been uploaded yet." action="Upload a record" />}
        {section === 'care' && <EmptyPanel title="Care & wellness" sub="Nutrition, programmes, therapies and your next actions" message="No care programme or appointments are available yet." action="Explore care" />}
      </section>
    </div>
    <nav className="mobile-nav">{sections.map(s => <button key={s} className={section === s ? 'on' : ''} onClick={() => setSection(s)}><span>{icons[s]}</span>{label(s)}</button>)}</nav>
  </main>;
}

function Today({ data, setSection }: { data: DashboardData | null; setSection: (s: Section) => void }) {
  const score = data?.healthScore;
  const hydration = data?.hydrationMl;
  return <>
    <section className="score-hero"><div className="score-copy"><span className="eyebrow-dark">HEALTH SCORE</span><div className="score-value">{score ?? '—'}</div><div className="score-title">{score === null || score === undefined ? 'Waiting for your health data' : 'Your current health score'}</div><p>{score === null || score === undefined ? 'Your score will appear after LIVYA has enough health data to calculate it.' : 'This score is calculated from the health data available in your LIVYA account.'}</p></div>{score !== null && score !== undefined ? <div className="score-ring" style={{ background: `conic-gradient(var(--accent) 0 ${score}%, #2a1d20 ${score}%)` }}><div><strong>{score}</strong><span>/100</span></div></div> : null}</section>
    <div className="metric-grid"><Metric k="HYDRATION" v={hydration == null ? '—' : `${(hydration / 1000).toFixed(1)} L`} p={hydration == null ? 'No hydration entry yet' : 'Latest recorded hydration'} /><Metric k="MOOD" v={data?.mood == null ? '—' : `${data.mood}/10`} p="Latest check-in" cls="mood-violet" /><Metric k="FOCUS" v={data?.focus == null ? '—' : `${data.focus}/10`} p="Latest check-in" cls="mood-blue" /><Metric k="HEALTH DATA" v={data ? 'Live' : '—'} p={data ? 'Connected to your account' : 'Loading your account'} cls="mood-cyan" /></div>
    <section className="ai-card"><div><span className="ai-kicker">✦ LIVYA AI</span><p>{data?.note ? `Latest check-in: ${data.note}` : 'AI insights will appear here after your health data is available.'}</p></div><button onClick={() => setSection('health')}>View health</button></section>
    <div className="two-col"><section className="panel-card"><div className="panel-head"><h2>Vitals</h2><button onClick={() => setSection('health')}>Open →</button></div><EmptyState message="No vital readings yet." /></section><section className="panel-card"><div className="panel-head"><h2>Today's medicines</h2><button onClick={() => setSection('medicines')}>Manage</button></div><EmptyState message="No medication schedule yet." /></section></div>
    <section className="panel-card"><div className="panel-head"><h2>Up next</h2><button onClick={() => setSection('care')}>Scheduler →</button></div><EmptyState message="No upcoming care activities." /></section>
    <section className="module-grid">{[['💊','Medicines','Your prescriptions','medicines'],['💧','Hydration','Your hydration log','today'],['🥗','Nutrition','Your nutrition plan','care'],['🧘','Wellness','Your therapy sessions','care'],['🧪','Lab tests','Your advised tests','records'],['📄','Health records','Your uploaded records','records']].map(([i,t,m,target]) => <button key={t} className="module-tile" onClick={() => setSection(target as Section)}><span>{i}</span><div><strong>{t}</strong><small>{m}</small></div><b>›</b></button>)}</section>
  </>;
}

function Metric({ cls = '', k, v, p }: { cls?: string; k: string; v: string; p: string }) { return <article className={`metric-card ${cls}`}><span className="metric-kicker">{k}</span><strong>{v}</strong><p>{p}</p><div className="metric-decoration" /></article>; }
function EmptyPanel({ title, sub, message, action }: { title: string; sub: string; message: string; action: string }) { return <div className="detail-stack"><header className="detail-head"><div><span className="eyebrow-dark">LIVYA</span><h2>{title}</h2><p>{sub}</p></div></header><section className="panel-card"><EmptyState message={message} /><button className="primary-btn">＋ {action}</button></section></div>; }
function EmptyState({ message }: { message: string }) { return <div className="empty-state"><strong>{message}</strong><span>Nothing has been recorded yet.</span></div>; }
