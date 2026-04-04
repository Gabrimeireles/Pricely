import { Link } from 'react-router-dom';

export function DashboardHome() {
  return (
    <main className="shell">
      <div className="container stack">
        <nav className="nav card">
          <strong>Pricely Dashboard</strong>
          <div className="nav-links">
            <Link to="/">Marketing</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </nav>

        <section className="card hero">
          <span className="muted">Admin visibility</span>
          <h1>Price, list, and store metrics will live here.</h1>
          <p className="muted">
            This shell reserves the dashboard route and responsive layout primitives
            for later analytics and administration tasks.
          </p>
        </section>
      </div>
    </main>
  );
}
