import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (!result.profile) {
        setError('Sua conta não tem perfil cadastrado. Contate o administrador.');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">TR</div>
          <h1 className="login-brand-title">Gestão de Recursos de Produtos</h1>
          <p className="login-brand-subtitle">
            Sistema corporativo para organização de recursos, gestão de despesas e
            acompanhamento de produtos da Thomson Reuters.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">✓</div>
              <span>Gestão centralizada de recursos por produto</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">✓</div>
              <span>Controle financeiro mensal com histórico</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">✓</div>
              <span>Atualização em tempo real</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">✓</div>
              <span>Controle de acesso por produto</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-box">
          <h2 className="login-title">Bem-vindo de volta</h2>
          <p className="login-subtitle">Acesse sua conta corporativa</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@thomsonreuters.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button
              type="submit"
              className="btn-primary login-button"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="login-info">
            <div className="login-info-title">Primeiro acesso?</div>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              Solicite ao administrador a criação da sua conta com email TR.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
