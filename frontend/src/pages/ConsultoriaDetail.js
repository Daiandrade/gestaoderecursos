import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { consultoriasService } from '../services/consultoriasService';
import { entregasService } from '../services/entregasService';

function ConsultoriaDetail() {
  const { consultoriaId } = useParams();
  const navigate = useNavigate();
  const [consultoria, setConsultoria] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    quantidade_agendas: '',
    limite_participantes: ''
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultoriaId]);

  const loadData = async () => {
    try {
      const [c, e] = await Promise.all([
        consultoriasService.getById(consultoriaId),
        entregasService.getByConsultoria(consultoriaId)
      ]);
      setConsultoria(c);
      setEntregas(e);
    } catch (error) {
      console.error('Erro ao carregar consultoria:', error);
      alert('Consultoria não encontrada ou foi excluída.');
      navigate('/consultorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        quantidade_agendas: parseInt(formData.quantidade_agendas, 10),
        limite_participantes: parseInt(formData.limite_participantes, 10)
      };
      if (editing) {
        await entregasService.update(editing.id, payload);
      } else {
        await entregasService.create({ consultoria_id: consultoriaId, ...payload });
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao salvar entrega');
    }
  };

  const handleEdit = (entrega) => {
    setEditing(entrega);
    setFormData({
      nome: entrega.nome,
      descricao: entrega.descricao || '',
      quantidade_agendas: String(entrega.quantidade_agendas),
      limite_participantes: String(entrega.limite_participantes)
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta entrega? As agendas cadastradas nela não serão excluídas automaticamente.')) return;
    try {
      await entregasService.delete(id);
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao excluir entrega');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => setFormData({ nome: '', descricao: '', quantidade_agendas: '', limite_participantes: '' });

  if (loading) return <div className="loading">Carregando consultoria...</div>;
  if (!consultoria) return null;

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <Link to="/consultorias" className="page-subtitle" style={{ display: 'inline-block', marginBottom: '6px' }}>
              ← Consultorias
            </Link>
            <h1>{consultoria.nome}</h1>
            <p className="page-subtitle">
              {consultoria.descricao || 'Entregas e agendas desta consultoria'} · {entregas.length} entrega(s)
            </p>
          </div>
          <button onClick={handleAdd} className="btn-primary">+ Nova Entrega</button>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Entregas</span>
            <span className="card-subtitle">{entregas.length} registro(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Agendas</th>
                  <th>Restantes</th>
                  <th>Limite de participantes</th>
                  <th style={{ width: '260px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {entregas.map(e => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.nome}</strong>
                      {e.descricao && <div className="text-muted" style={{ fontSize: '12px' }}>{e.descricao}</div>}
                    </td>
                    <td className="text-muted">{e.agendas_usadas} de {e.quantidade_agendas}</td>
                    <td>
                      <span className={`badge ${e.agendas_restantes > 0 ? 'badge-info' : 'badge-danger'}`}>
                        {e.agendas_restantes} restante(s)
                      </span>
                    </td>
                    <td className="text-muted">{e.limite_participantes} por agenda</td>
                    <td className="actions">
                      <Link to={`/entregas/${e.id}`} className="btn-secondary btn-small">Abrir agendas</Link>
                      <button onClick={() => handleEdit(e)} className="btn-secondary btn-small">Editar</button>
                      <button onClick={() => handleDelete(e.id)} className="btn-danger btn-small">Excluir</button>
                    </td>
                  </tr>
                ))}
                {entregas.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>
                      Nenhuma entrega cadastrada ainda.
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
                <h2>{editing ? 'Editar Entrega' : 'Nova Entrega'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Nome da Entrega *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Workshop de Onboarding"
                      required
                    />
                  </div>

                  <div>
                    <label>Descrição</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Quantidade de Agendas *</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantidade_agendas}
                        onChange={(e) => setFormData({ ...formData, quantidade_agendas: e.target.value })}
                        placeholder="Ex: 10"
                        required
                      />
                      <div className="form-hint">Total de agendas que esta entrega disponibiliza</div>
                    </div>

                    <div>
                      <label>Limite de Participantes por Agenda *</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.limite_participantes}
                        onChange={(e) => setFormData({ ...formData, limite_participantes: e.target.value })}
                        placeholder="Ex: 5"
                        required
                      />
                      <div className="form-hint">Máximo 30 participantes por agenda</div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editing ? 'Salvar Alterações' : 'Criar Entrega'}
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

export default ConsultoriaDetail;
