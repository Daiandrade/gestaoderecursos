import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADDONS, ADDON_CATEGORIES } from '../config/addons';
import { USEFUL_LINKS } from '../config/usefulLinks';
import './Hub.css';

function Hub() {
  const { user, profile, logout, isAdmin, canAccessAddon } = useAuth();

  const displayName = profile?.username || user?.name || user?.email || 'Usuário';
  const getUserInitials = (name) => (name ? name.substring(0, 2).toUpperCase() : '?');

  const visibleAddons = ADDONS.filter((addon) => canAccessAddon(addon.id));
  const sections = ADDON_CATEGORIES
    .map((cat) => ({ ...cat, addons: visibleAddons.filter((addon) => addon.category === cat.id) }))
    .filter((section) => section.addons.length > 0);

  return (
    <div className="hub">
      <header className="hub-topbar">
        <div className="hub-topbar-inner">
          <span className="hub-topbar-mark">Casa de Produtos Tax</span>
          <div className="hub-topbar-user">
            {isAdmin() && (
              <Link to="/users" className="hub-topbar-admin-link">Gerenciar Usuários</Link>
            )}
            <span className="hub-topbar-name">{displayName}</span>
            <div className="hub-topbar-avatar">{getUserInitials(displayName)}</div>
            <button onClick={logout} className="hub-topbar-logout">Sair</button>
          </div>
        </div>
      </header>

      <section className="hub-hero">
        <img
          src="/brand/radial-04.png"
          alt=""
          className="hub-hero-waypoint"
          aria-hidden="true"
        />
        <div className="hub-hero-content">
          <div className="hub-logo">
            <div className="hub-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 11.5 12 4l8 7.5M6 9.5V20h5v-6h2v6h5V9.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="hub-logo-name">Casa de Produtos Tax</h1>
          </div>
        </div>
      </section>

      <main className="hub-main">
        <div className="hub-layout">
          <aside className="hub-links-panel">
            <h2 className="hub-panel-title">Links Úteis</h2>
            <div className="hub-links-list">
              {USEFUL_LINKS.map((link) => (
                link.url ? (
                  <a
                    href={link.url}
                    key={link.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hub-link-item"
                  >
                    <div className="hub-link-icon">{link.tag}</div>
                    <div className="hub-link-body">
                      <h3>{link.name}</h3>
                      <p>{link.description}</p>
                    </div>
                    <span className="hub-link-arrow">↗</span>
                  </a>
                ) : (
                  <div key={link.id} className="hub-link-item hub-link-item-disabled">
                    <div className="hub-link-icon">{link.tag}</div>
                    <div className="hub-link-body">
                      <h3>{link.name}</h3>
                      <p>{link.description}</p>
                    </div>
                    <span className="hub-link-soon">Em breve</span>
                  </div>
                )
              ))}
            </div>
          </aside>

          <div className="hub-addons-col">
            {sections.map((section) => (
              <div className="hub-section" key={section.id}>
                <h2 className="hub-section-title">{section.label}</h2>
                <div className="hub-grid">
                  {section.addons.map((addon) => (
                    <Link to={addon.path} key={addon.id} className="hub-card">
                      <div className="hub-card-tag">{addon.tag}</div>
                      <div className="hub-card-body">
                        <div className="hub-card-header">
                          <h3>{addon.name}</h3>
                          <span className="hub-card-status">{addon.status}</span>
                        </div>
                        <p>{addon.description}</p>
                        <span className="hub-card-cta">Abrir addon →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {isAdmin() && (
              <div className="hub-section">
                <div className="hub-grid">
                  <div className="hub-card hub-card-placeholder">
                    <div className="hub-card-body">
                      <h3>Próximo addon</h3>
                      <p>Novas ferramentas da área de Produtos Tax vão aparecer aqui.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="hub-footer">Thomson Reuters</footer>
    </div>
  );
}

export default Hub;
