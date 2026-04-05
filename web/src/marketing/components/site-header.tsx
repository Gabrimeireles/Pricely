import { Link } from 'react-router-dom';

import { Button } from '../../components/ui/button';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-mark" to="/">
        <span className="brand-mark__badge">P</span>
        <span>
          <strong>Pricely</strong>
          <small>economia inteligente para supermercado</small>
        </span>
      </Link>

      <nav className="site-nav" aria-label="Primary">
        <a href="#como-funciona">Como funciona</a>
        <a href="#vantagens">Vantagens</a>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      <div className="site-header__actions">
        <Button className="button button--ghost">Ver demo</Button>
        <Button className="button button--primary">Entrar na lista</Button>
      </div>
    </header>
  );
}
