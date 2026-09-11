'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const nav = [['dashboard','⌂','Dashboard'],['patients','◉','Patients'],['alerts','⚠','Vital alerts'],['records','▣','Records & AI'],['rx','℞','Prescriptions'],['medicines','✚','Medicine catalogue'],['nutrition','🥗','Nutrition'],['programmes','▦','Programmes'],['therapies','🧘','Therapies'],['store','▢','Store & orders'],['labs','🧪','Labs & bookings'],['members','◎','Members & plans'],['monitor','◌','Consumption'],['scheduler','◷','Scheduler'],['staff','♙','Roles & SOP'],['ai','✦','AI assistant']];
type Patient = { id: string; patient_code: string | null; status: string; plan_name: string | null; profile: { full_name: string | null; gender: string | null } | null };
type Counts = { patients: number; alerts: number; records: number; appointments: number };

export default function AdminWorkspace({ displayName = 'Care team' }: { displayName?: string }) {
  const [active, setActive] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [counts, setCounts] = useState<Counts>({ patients: 0, alerts: 0, records: 0, appointments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      setLoading(true); setError('');
      const [patientResult, alertResult, recordResult, appointmentResult] = await Promise.all([
        supabase.from('patients').select('id,patient_code,status,plan_name,profile:profiles!patients_profile_id_fkey(full_name,gender)').order('created_at', { ascending: false }).limit(10),
        supabase.from('vital_alerts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('health_records').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('starts_at', new Date().toISOString()),
      ]);
      if (patientResult.error) setError(patientResult.error.message);
      else setPatients((patientResult.data ?? []) as Patient[]);
      setCounts({ patients: patientResult.count ?? 0, alerts: alertResult.count ?? 0, records: recordResult.count ?? 0, appointments: appointmentResult.count ?? 0 });
      setLoading(false);
    };
    load();
  }, []);

  return <main className="admin-proto"><header className="admin-top"><div className="admin-brand"><span>LIVYA</span><small>OPERATIONS CONSOLE</small></div><div className="admin-search">⌕&nbsp; Search patients, records, orders or ID</div><div className="admin-who"><span className="notif">{counts.alerts}</span><div className="admin-avatar">{displayName.slice(0,2).toUpperCase()}</div><div><b>{displayName}</b><small>Care team</small></div></div></header><div className="admin-body"><aside className="admin-side"><div className="side-section">CARE OPERATIONS</div>{nav.slice(0,13).map(([id,i,l])=><button key={id} className={active===id?'admin-link on':'admin-link'} onClick={()=>setActive(id)}><span>{i}</span>{l}{id==='alerts'&&counts.alerts>0&&<em>{counts.alerts}</em>}</button>)}<div className="side-section second">ADMINISTRATION</div>{nav.slice(13).map(([id,i,l])=><button key={id} className={active===id?'admin-link on':'admin-link'} onClick={()=>setActive(id)}><span>{i}</span>{l}</button>)}<div className="admin-foot"><b>● Connected</b><small>Supabase data services</small></div></aside><section className="admin-main">{active==='dashboard'?<Dashboard counts={counts} patients={patients} loading={loading} error={error} setActive={setActive}/>:<Module id={active} count={active==='patients'?counts.patients:active==='alerts'?counts.alerts:active==='records'?counts.records:null} setActive={setActive}/>}</section></div></main>;
}

function Dashboard({ counts, patients, loading, error, setActive }: { counts: Counts; patients: Patient[]; loading: boolean; error: string; setActive: (s:string)=>void }) {
  return <><Head title="Good morning" sub="Live overview of your LIVYA care operations." action="＋ New patient"/><div className="admin-kpis"><K l="Active patients" v={counts.patients} d="From patient records"/><K l="Open vital alerts" v={counts.alerts} d={counts.alerts ? 'Needs acknowledgement' : 'No open alerts'} danger={counts.alerts>0}/><K l="Health records" v={counts.records} d="Stored records"/><K l="Upcoming appointments" v={counts.appointments} d="From scheduler"/></div>{error&&<p className="admin-auth-error">Unable to load live data: {error}</p>}<div className="admin-grid"><section className="admin-panel wide"><Title h="Patients" p="Live patient records from Supabase." action="View all →" onClick={()=>setActive('patients')}/>{loading?<Empty text="Loading patient records…"/>:patients.length===0?<Empty text="No patient records yet."/>:<table><thead><tr><th>Patient</th><th>Status</th><th>Plan</th><th>Profile</th></tr></thead><tbody>{patients.map(p=><tr key={p.id}><td><b>{p.profile?.full_name || 'Unnamed patient'}</b><small>{p.patient_code || p.id.slice(0,8)}</small></td><td>{p.status}</td><td>{p.plan_name || 'Not assigned'}</td><td>{p.profile?.gender || 'Not provided'}</td></tr>)}</tbody></table>}</section><section className="admin-panel"><Title h="Vital alerts" p="Live open alerts." action={`${counts.alerts} open`} onClick={()=>setActive('alerts')}/><Empty text={counts.alerts ? `${counts.alerts} alert${counts.alerts===1?'':'s'} require review.` : 'No open vital alerts.'}/></section></div><div className="admin-grid"><section className="admin-panel"><Title h="Records & AI review" p="Live health-record queue." action="Open queue →" onClick={()=>setActive('records')}/><Empty text={counts.records ? `${counts.records} health record${counts.records===1?'':'s'} stored.` : 'No health records yet.'}/></section><section className="admin-panel"><Title h="Today’s care flow" p="Live appointment data." action="Scheduler →" onClick={()=>setActive('scheduler')}/><Empty text={counts.appointments ? `${counts.appointments} upcoming appointment${counts.appointments===1?'':'s'}.` : 'No upcoming appointments.'}/></section></div></>;
}
function Head({title,sub,action}:{title:string;sub:string;action:string}){return <div className="admin-heading"><div><span>LIVYA · OPERATIONS</span><h1>{title}</h1><p>{sub}</p></div><button className="red-btn">{action}</button></div>}
function Title({h,p,action,onClick}:{h:string;p:string;action:string;onClick:()=>void}){return <div className="panel-title"><div><h2>{h}</h2><p>{p}</p></div><button onClick={onClick}>{action}</button></div>}
function K({l,v,d,danger=false}:{l:string;v:number;d:string;danger?:boolean}){return <article className="admin-kpi"><span>{l}</span><strong>{v.toLocaleString('en-IN')}</strong><small className={danger?'danger-text':''}>{d}</small></article>}
function Empty({text}:{text:string}){return <div className="admin-empty"><b>{text}</b><small>No demo data is displayed.</small></div>}
function Module({id,count,setActive}:{id:string;count:number|null;setActive:(s:string)=>void}){const item=nav.find(n=>n[0]===id);return <><Head title={item?.[2]||'Module'} sub="Live module. Data appears here when it exists in Supabase." action="＋ Create"/><div className="module-hero"><div><span>LIVE MODULE</span><strong>{item?.[2]}</strong><p>Real records only. Empty states are shown until data is created.</p></div><b>{count ?? '—'}</b></div><div className="admin-grid"><section className="admin-panel"><h2>Recent activity</h2><Empty text="No activity has been recorded yet."/></section><section className="admin-panel"><h2>Quick actions</h2>{['Review queue','Search patient','Open audit log'].map(x=><button className="quick-admin" key={x}>{x}<b>→</b></button>)}<button className="quick-admin" onClick={()=>setActive('dashboard')}>Back to overview <b>→</b></button></section></div></>}
