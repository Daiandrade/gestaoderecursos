import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { consultoriasService } from '../services/consultoriasService';

function Consultorias() {
  const [consultorias, setConsultorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nome: '', descricao: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await consultoriasService.getAll();
      setConsultorias(data);
    } catch (error) {
      console.error('Erro ao carregar consultorias:', error);
      alert('Erro ao carregar consultorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await consultoriasService.update(editing.id, formData);
      } else {
        await consultoriasService.create(formData);
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao salvar consultoria');
    }
  };

  const handleEdit = (consultoria) => {
    setEditing(consultoria);
    setFormData({ nome: consultoria.nome, descricao: consultoria.descricao || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta consultoria? As entregas e agendas cadastradas nela não serão excluídas automaticamente.')) return;
    try {
      await consultoriasService.delete(id);
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao excluir consultoria');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => setFormData({ nome: '', descricao: '' });

  if (loading) return <div className="loading">Carregando consultorias...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Gestão de Consultorias</h1>
            <p className="page-subtitle">
              Consultorias contratadas, entregas e agendas · {consultorias.length} consultoria(s)
            </p>
          </div>
          <button onClick={handleAdd} className="btn-primary">+ Nova Consultoria</button>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Consultorias</span>
            <span className="card-subtitle">{consultorias.length} registro(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Entregas</th>
                  <th>Criado em</th>
                  <th style={{ width: '220px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {consultorias.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nome}</strong></td>
                    <td className="text-muted">{c.descricao || '—'}</td>
                    <td><span className="badge badge-info">{c.entregas_count}</span></td>
                    <td className="text-muted">{new Date(c.$createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="actions">
                      <Link to={`/consultorias/${c.id}`} className="btn-secondary btn-small">Abrir</Link>
                      <button onClick={() => handleEdit(c)} className="btn-secondary btn-small">Editar</button>
                      <button onClick={() => handleDelete(c.id)} className="btn-danger btn-small">Excluir</button>
                    </td>
                  </tr>
                ))}
                {consultorias.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>
                      Nenhuma consultoria cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editing ? 'Editar Consultoria' : 'Nova Consultoria'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Nome da Consultoria *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Consultoria de Governança Fiscal"
                      required
                    />
                  </div>

                  <div>
                    <label>Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editing ? 'Salvar Alterações' : 'Criar Consultoria'}
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

export default Consultorias;
