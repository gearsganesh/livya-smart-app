const nav = ['Dashboard', 'Patients', 'Reports', 'AI', 'Staff', 'Subscriptions', 'Payments', 'Audit Logs'];
const stats = [
  ['Active Patients', '0', 'Awaiting Supabase connection'],
  ['Reports Today', '0', 'No processing queue connected'],
  ['AI Jobs', '0', 'AI service not connected'],
  ['System Status', 'Ready', 'Foundation deployed']
];

export default function AdminHome() {
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">LIVYA Admin</div>
        <nav className="nav" aria-label="Admin navigation">
          {nav.map((item) => <a href="#" key={item}>{item}</a>)}
        </nav>
      </aside>
      <main className="main">
        <span className="eyebrow">Operations Console</span>
        <h1>Good morning</h1>
        <p className="subtitle">A desktop-first command centre for LIVYA patients, reports and AI processing.</p>
        <section className="stats" aria-label="System overview">
          {stats.map(([label, value, status]) => (
            <article className="card" key={label}>
              <div className="label">{label}</div>
              <div className="value">{value}</div>
              <div className="status">{status}</div>
            </article>
          ))}
        </section>
        <section className="section card">
          <h2>Platform foundation</h2>
          <p className="subtitle">Next.js application shell is ready. Supabase authentication, role enforcement and live operational data are deliberately deferred to Step 4, so we do not accidentally invent security while scaffolding.</p>
        </section>
      </main>
    </div>
  );
}
