const cards = [
  ['Health Dashboard', 'Your health score, daily metrics, trends and personalized insights in one calm view.', 'Client'],
  ['Reports', 'Access medical reports and health documents securely from the web.', 'Secure'],
  ['AI Insights', 'Turn health data into understandable, actionable guidance without burying the useful bits.', 'AI']
];

export default function Home() {
  return (
    <main className="shell">
      <div className="container">
        <span className="eyebrow">LIVYA Health Platform</span>
        <h1>Your health,<br />understood.</h1>
        <p className="lead">The new LIVYA client web experience is now scaffolded on Next.js, ready for Supabase authentication, health data, reports and AI insights.</p>
        <section className="grid" aria-label="LIVYA capabilities">
          {cards.map(([title, description, label]) => (
            <article className="card" key={title}>
              <h2>{title}</h2>
              <p>{description}</p>
              <span className="pill">{label}</span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
