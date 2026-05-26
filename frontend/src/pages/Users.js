import React, { useState, useEffect } from 'react';
import { usersService } from '../services/usersService';
import { productsService } from '../services/productsService';

function Users() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    username: '',
    email: '',
    role: 'product_manager',
    product_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, productsData] = await Promise.all([
        usersService.getAll(),
        productsService.getAll()
      ]);
      setUsers(usersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Converter array de product_ids para string separada por vírgula
      const dataToSave = {
        ...formData,
        product_id: formData.product_ids.join(',')
      };
      delete dataToSave.product_ids;

      if (editingUser) {
        await usersService.updateProfile(editingUser.id, dataToSave);
      } else {
        await usersService.createProfile(dataToSave);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao salvar perfil');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      product_ids: user.product_id ? user.product_id.split(',').filter(id => id.trim()) : []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este perfil? (A conta de autenticação não será removida)')) return;
    try {
      await usersService.deleteProfile(id);
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao deletar perfil');
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      username: '',
      email: '',
      role: 'product_manager',
      product_ids: []
    });
  };

  const getUserInitials = (username) => {
    if (!username) return '?';
    return username.substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="loading">Carregando usuários...</div>;

  const adminCount = users.filter(u => u.role === 'admin').length;
  const managerCount = users.filter(u => u.role === 'product_manager').length;

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Gerenciamento de Usuários</h1>
            <p className="page-subtitle">
              Controle de acesso e permissões · {users.length} perfil(s)
            </p>
          </div>
          <button onClick={handleAdd} className="btn-primary">+ Novo Perfil</button>
        </div>

        <div className="card mb-20" style={{ background: '#FFF4E0', borderLeftWidth: '4px', borderLeftColor: '#F5A623', borderLeftStyle: 'solid' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '20px' }}>⚠️</div>
            <div>
              <strong>Como adicionar novos usuários:</strong>
              <ol style={{ marginTop: '8px', marginLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
                <li>Primeiro, crie a conta no <strong>Appwrite Console</strong> em Auth → Users → Create user</li>
                <li>Copie o <strong>User ID</strong> gerado</li>
                <li>Aqui, clique em <strong>+ Novo Perfil</strong> e cole o User ID + dados do usuário</li>
                <li>Atribua o role (admin ou gerente) e o produto (se gerente)</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total</div>
                <div className="stat-value">{users.length}</div>
                <div className="stat-change">Perfis ativos</div>
              </div>
              <div className="stat-icon">👤</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Administradores</div>
                <div className="stat-value">{adminCount}</div>
                <div className="stat-change">Acesso total</div>
              </div>
              <div className="stat-icon info">🔑</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Gerentes</div>
                <div className="stat-value">{managerCount}</div>
                <div className="stat-change">Acesso restrito</div>
              </div>
              <div className="stat-icon success">📦</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Perfis de Usuário</span>
            <span className="card-subtitle">{users.length} perfil(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Produto</th>
                  <th>Criado em</th>
                  <th style={{ width: '180px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: user.role === 'admin' ? 'var(--tr-charcoal)' : 'var(--tr-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                          {getUserInitials(user.username)}
                        </div>
                        <strong>{user.username}</strong>
                      </div>
                    </td>
                    <td className="text-muted">{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                        {user.role === 'admin' ? 'Administrador' : 'Gerente de Produto'}
                      </span>
                    </td>
                    <td>
                      {user.product_names && user.product_names.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {user.product_names.map((name, idx) => (
                            <span key={idx} className="badge badge-orange">{name}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">Todos</span>
                      )}
                    </td>
                    <td className="text-muted">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="actions">
                      <button onClick={() => handleEdit(user)} className="btn-secondary btn-small">Editar</button>
                      <button onClick={() => handleDelete(user.id)} className="btn-danger btn-small">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingUser ? 'Editar Perfil' : 'Novo Perfil'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {!editingUser && (
                    <div>
                      <label>User ID (do Appwrite Auth) *</label>
                      <input
                        type="text"
                        value={formData.user_id}
                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                        placeholder="Cole o ID da conta criada em Auth → Users"
                        required
                      />
                      <div className="form-hint">
                        Crie a conta primeiro no Appwrite Console → Auth → Users e cole o ID aqui
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div>
                      <label>Nome do Usuário *</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Ex: João Silva"
                        required
                      />
                    </div>

                    <div>
                      <label>Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@thomsonreuters.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Perfil de Acesso *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="product_manager">Gerente de Produto</option>
                        <option value="admin">Administrador</option>
                      </select>
                      <div className="form-hint">
                        {formData.role === 'admin'
                          ? 'Acesso total a todos os produtos'
                          : 'Acesso restrito ao produto selecionado'}
                      </div>
                    </div>

                    {formData.role === 'product_manager' && (
                      <div>
                        <label>Produtos Responsável * (selecione um ou mais)</label>
                        <div style={{
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '12px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: '#f9f9f9'
                        }}>
                          {products.map(p => (
                            <label
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={formData.product_ids.includes(p.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...formData.product_ids, p.id]
                                    : formData.product_ids.filter(id => id !== p.id);
                                  setFormData({ ...formData, product_ids: newIds });
                                }}
                                style={{ marginRight: '8px' }}
                              />
                              {p.name}
                            </label>
                          ))}
                        </div>
                        <div className="form-hint">
                          Selecione todos os produtos que este gerente poderá acessar
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Salvar Alterações' : 'Criar Perfil'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
