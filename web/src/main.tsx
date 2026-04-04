import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        margin: 0,
        fontFamily: 'system-ui, sans-serif',
        background:
          'linear-gradient(180deg, rgb(244 251 253) 0%, rgb(226 244 247) 100%)',
        color: 'rgb(15 23 42)',
      }}
    >
      <section style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Pricely
        </p>
        <h1 style={{ margin: '0.5rem 0 1rem' }}>
          Web workspace initialized with Vite and React
        </h1>
        <p style={{ maxWidth: '40rem', lineHeight: 1.5 }}>
          This workspace will host the landing page and admin dashboard for the
          grocery optimization platform.
        </p>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
