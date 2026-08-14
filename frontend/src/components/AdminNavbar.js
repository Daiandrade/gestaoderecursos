import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminNavbar() {
  const { user, profile, logout } = useAuth();

  const displayName = profile?.username || user?.name || user?.email || 'Usuário';

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-title-sub">← Casa de Produtos Tax</Link>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-role">
              {profile?.role === 'admin' ? 'Administrador' : 'Usuário'}
            </div>
          </div>
          <div className="user-avatar">{getUserInitials(displayName)}</div>
          <button onClick={logout} className="logout-btn">Sair</button>
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;
