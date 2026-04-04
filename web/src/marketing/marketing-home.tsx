import { Link } from 'react-router-dom';

import { Button } from '../components/ui/button';

export function MarketingHome() {
  return (
    <main className="shell">
      <div className="container stack">
        <nav className="nav card">
          <strong>Pricely</strong>
          <div className="nav-links">
            <Link to="/">Marketing</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </nav>

        <section className="card hero">
          <span className="muted">Smart grocery optimization</span>
          <h1>Save more with local-first grocery intelligence.</h1>
          <p className="muted">
            The web surface will host both the product landing page and the
            internal admin dashboard, sharing a responsive foundation from day one.
          </p>
          <div>
            <Button>Join waitlist</Button>
          </div>
        </section>
      </div>
    </main>
  );
}
