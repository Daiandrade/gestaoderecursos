import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, profile, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const displayName = profile?.username || user?.name || user?.email || 'Usuário';

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/dashboard" className="navbar-brand">
            <div className="navbar-logo">TR</div>
            <div className="navbar-title">
              <span className="navbar-title-main">Gestão de Recursos</span>
              <span className="navbar-title-sub">Thomson Reuters</span>
            </div>
          </Link>

          <ul className="navbar-menu">
            <li><Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Dashboard</Link></li>
            <li><Link to="/products" className={isActive('/products') ? 'active' : ''}>Produtos</Link></li>
            <li><Link to="/resources" className={isActive('/resources') ? 'active' : ''}>Recursos</Link></li>
            <li><Link to="/expenses" className={isActive('/expenses') ? 'active' : ''}>Conta Corrente</Link></li>
            {isAdmin() && (
              <li><Link to="/users" className={isActive('/users') ? 'active' : ''}>Usuários</Link></li>
            )}
          </ul>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">
              {profile?.role === 'admin' ? 'Administrador' : 'Gerente de Produto'}
            </div>
          </div>
          <div className="user-avatar">{getUserInitials(displayName)}</div>
          <button onClick={logout} className="logout-btn">Sair</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
