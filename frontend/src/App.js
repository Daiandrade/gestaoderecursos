import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Hub from './pages/Hub';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Resources from './pages/Resources';
import Budget from './pages/Budget';
import Expenses from './pages/Expenses';
import Users from './pages/Users';
import Consultorias from './pages/Consultorias';
import ConsultoriaDetail from './pages/ConsultoriaDetail';
import EntregaAgendas from './pages/EntregaAgendas';
import CockpitProdutos from './pages/CockpitProdutos';
import Eventos from './pages/Eventos';
import Playbook from './pages/Playbook';
import IaBoasPraticas from './pages/IaBoasPraticas';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import './App.css';

const BUDGET_ADDON_PATHS = ['/dashboard', '/products', '/resources', '/budget', '/expenses'];
const FULLSCREEN_PATHS = ['/cockpit-produtos', '/playbook'];

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return isAdmin() ? children : <Navigate to="/dashboard" />;
};

const AddonRoute = ({ addonId, children }) => {
  const { user, loading, canAccessAddon } = useAuth();

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return canAccessAddon(addonId) ? children : <Navigate to="/" />;
};

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const showBudgetNavbar = user && BUDGET_ADDON_PATHS.includes(location.pathname);
  const isFullscreenPath = FULLSCREEN_PATHS.includes(location.pathname);
  const showAdminNavbar = user && location.pathname !== '/' && !showBudgetNavbar && !isFullscreenPath;

  return (
    <>
      {showBudgetNavbar && <Navbar />}
      {showAdminNavbar && <AdminNavbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Hub />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AddonRoute addonId="budget">
              <Dashboard />
            </AddonRoute>
          }
        />
        <Route
          path="/products"
          element={
            <AddonRoute addonId="budget">
              <Products />
            </AddonRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <AddonRoute addonId="budget">
              <Resources />
            </AddonRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <AddonRoute addonId="budget">
              <Budget />
            </AddonRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <AddonRoute addonId="budget">
              <Expenses />
            </AddonRoute>
          }
        />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
        <Route
          path="/consultorias"
          element={
            <AddonRoute addonId="consultorias">
              <Consultorias />
            </AddonRoute>
          }
        />
        <Route
          path="/consultorias/:consultoriaId"
          element={
            <AddonRoute addonId="consultorias">
              <ConsultoriaDetail />
            </AddonRoute>
          }
        />
        <Route
          path="/entregas/:entregaId"
          element={
            <AddonRoute addonId="consultorias">
              <EntregaAgendas />
            </AddonRoute>
          }
        />
        <Route
          path="/cockpit-produtos"
          element={
            <AddonRoute addonId="cockpit-produtos">
              <CockpitProdutos />
            </AddonRoute>
          }
        />
        <Route
          path="/eventos"
          element={
            <AddonRoute addonId="eventos">
              <Eventos />
            </AddonRoute>
          }
        />
        <Route
          path="/playbook"
          element={
            <AddonRoute addonId="playbook">
              <Playbook />
            </AddonRoute>
          }
        />
        <Route
          path="/ia-boas-praticas"
          element={
            <AddonRoute addonId="ia-boas-praticas">
              <IaBoasPraticas />
            </AddonRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
