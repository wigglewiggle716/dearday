export default function MigrationHome() {
  return (
    <main className="migration-shell">
      <section className="migration-card" aria-labelledby="migration-title">
        <p className="eyebrow">Dear Day</p>
        <h1 id="migration-title">React migration workspace</h1>
        <p>
          This isolated Next.js app is being rebuilt from the approved Dear Day
          production experience. The current production website is not modified
          by this workspace.
        </p>
        <div className="status-grid">
          <div><strong>Source</strong><span>Production snapshot</span></div>
          <div><strong>Framework</strong><span>Next.js 16.4 + React 19.3</span></div>
          <div><strong>Deployment</strong><span>Separate preview only</span></div>
        </div>
      </section>
    </main>
  );
}
