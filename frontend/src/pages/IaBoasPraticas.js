import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { iaBoasPraticasService } from '../services/iaBoasPraticasService';

const emptyForm = {
  titulo: '',
  prompt: '',
  skill_texto: '',
  funcionalidade: '',
  beneficio: '',
  como_usar: ''
};

function IaBoasPraticas() {
  const { profile, isAdmin } = useAuth();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const itensFiltrados = itens.filter(item => {
    const termo = search.trim().toLowerCase();
    if (!termo) return true;
    return [item.titulo, item.funcionalidade, item.beneficio, item.autor_nome]
      .some(campo => campo?.toLowerCase().includes(termo));
  });

  const loadData = async () => {
    try {
      const data = await iaBoasPraticasService.getAll();
      setItens(data);
    } catch (error) {
      console.error('Erro ao carregar skills:', error);
      alert('Erro ao carregar skills');
    } finally {
      setLoading(false);
    }
  };

  const canManage = (item) => isAdmin() || item.autor_user_id === profile?.user_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await iaBoasPraticasService.update(editing.id, formData);
      } else {
        await iaBoasPraticasService.create({
          ...formData,
          autor_user_id: profile.user_id,
          autor_nome: profile.username
        });
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao salvar skill');
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({
      titulo: item.titulo,
      prompt: item.prompt,
      skill_texto: item.skill_texto,
      funcionalidade: item.funcionalidade,
      beneficio: item.beneficio,
      como_usar: item.como_usar
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta skill do catálogo?')) return;
    try {
      await iaBoasPraticasService.delete(id);
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao excluir skill');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => setFormData(emptyForm);

  if (loading) return <div className="loading">Carregando skills...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>IA - Boas Práticas</h1>
            <p className="page-subtitle">
              Catálogo colaborativo de skills de IA · {itens.length} skill(s)
            </p>
          </div>
          <button onClick={handleAdd} className="btn-primary">+ Nova Skill</button>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Buscar</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Título, funcionalidade, benefício ou autor..."
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Skills</span>
            <span className="card-subtitle">{itensFiltrados.length} de {itens.length} registro(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Funcionalidade</th>
                  <th>Autor</th>
                  <th>Criado em</th>
                  <th style={{ width: '220px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.titulo}</strong></td>
                    <td className="text-muted">{item.funcionalidade}</td>
                    <td className="text-muted">{item.autor_nome}</td>
                    <td className="text-muted">{new Date(item.$createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="actions">
                      <button onClick={() => setViewing(item)} className="btn-secondary btn-small">Ver detalhes</button>
                      {canManage(item) && (
                        <>
                          <button onClick={() => handleEdit(item)} className="btn-secondary btn-small">Editar</button>
                          <button onClick={() => handleDelete(item.id)} className="btn-danger btn-small">Excluir</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {itensFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>
                      {itens.length === 0 ? 'Nenhuma skill cadastrada ainda.' : 'Nenhuma skill encontrada para essa busca.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewing && (
          <div className="modal-overlay" onClick={() => setViewing(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{viewing.titulo}</h2>
                <button className="modal-close" onClick={() => setViewing(null)}>×</button>
              </div>

              <div className="modal-body">
                <div>
                  <label>Funcionalidade</label>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{viewing.funcionalidade}</p>
                </div>
                <div>
                  <label>No que ajuda</label>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{viewing.beneficio}</p>
                </div>
                <div>
                  <label>Como usar</label>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{viewing.como_usar}</p>
                </div>
                <div>
                  <label>Prompt</label>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{viewing.prompt}</pre>
                </div>
                <div>
                  <label>Skill (.txt)</label>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{viewing.skill_texto}</pre>
                </div>
                <p className="text-muted">
                  Por {viewing.autor_nome} em {new Date(viewing.$createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setViewing(null)} className="btn-secondary">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editing ? 'Editar Skill' : 'Nova Skill'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Título *</label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Ex: Revisor automático de contratos"
                      required
                    />
                  </div>

                  <div>
                    <label>Funcionalidade (o que ela faz) *</label>
                    <textarea
                      value={formData.funcionalidade}
                      onChange={(e) => setFormData({ ...formData, funcionalidade: e.target.value })}
                      rows="3"
                      required
                    />
                  </div>

                  <div>
                    <label>No que ela ajuda (benefício) *</label>
                    <textarea
                      value={formData.beneficio}
                      onChange={(e) => setFormData({ ...formData, beneficio: e.target.value })}
                      rows="3"
                      required
                    />
                  </div>

                  <div>
                    <label>Como usar *</label>
                    <textarea
                      value={formData.como_usar}
                      onChange={(e) => setFormData({ ...formData, como_usar: e.target.value })}
                      rows="3"
                      required
                    />
                  </div>

                  <div>
                    <label>Prompt utilizado *</label>
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      rows="6"
                      required
                    />
                  </div>

                  <div>
                    <label>Conteúdo da skill (.txt) *</label>
                    <textarea
                      value={formData.skill_texto}
                      onChange={(e) => setFormData({ ...formData, skill_texto: e.target.value })}
                      rows="10"
                      placeholder="Cole aqui o conteúdo da skill"
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editing ? 'Salvar Alterações' : 'Criar Skill'}
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

export default IaBoasPraticas;
