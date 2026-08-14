import React from 'react';
import { Link } from 'react-router-dom';

function Playbook() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Link
        to="/"
        title="Voltar ao Hub"
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 10,
          background: '#002A3F',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,.25)'
        }}
      >
        ← Hub
      </Link>
      <iframe
        src="/playbook-rtc.html"
        title="Playbook"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}

export default Playbook;
