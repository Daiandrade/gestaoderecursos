import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { entregasService } from '../services/entregasService';
import { consultoriasService } from '../services/consultoriasService';
import { agendasService } from '../services/agendasService';

const emptyForm = { tema: '', data_agenda: '', participantes: [''], ata: '', pontos_discutidos: '', proximos_passos: '' };

function EntregaAgendas() {
  const { entregaId } = useParams();
  const navigate = useNavigate();
  const [entrega, setEntrega] = useState(null);
  const [consultoria, setConsultoria] = useState(null);
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entregaId]);

  const loadData = async () => {
    try {
      const e = await entregasService.getById(entregaId);
      const [c, a] = await Promise.all([
        consultoriasService.getById(e.consultoria_id),
        agendasService.getByEntrega(entregaId)
      ]);
      setEntrega(e);
      setConsultoria(c);
      setAgendas(a);
    } catch (error) {
      console.error('Erro ao carregar entrega:', error);
      alert('Entrega não encontrada ou foi excluída.');
      navigate('/consultorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const participantes = formData.participantes.map(p => p.trim()).filter(Boolean);
    const { ata, pontos_discutidos, proximos_passos } = formData;
    try {
      if (editing) {
        await agendasService.update(editing.id, {
          tema: formData.tema,
          data_agenda: formData.data_agenda,
          participantes,
          ata,
          pontos_discutidos,
          proximos_passos
        });
      } else {
        await agendasService.create({
          entrega_id: entregaId,
          tema: formData.tema,
          data_agenda: formData.data_agenda,
          participantes,
          ata,
          pontos_discutidos,
          proximos_passos
        });
      }
      setShowModal(false);
      setEditing(null);
      setFormData(emptyForm);
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao salvar agenda');
    }
  };

  const handleEdit = (agenda) => {
    setEditing(agenda);
    setFormData({
      tema: agenda.tema,
      data_agenda: agenda.data_agenda ? agenda.data_agenda.substring(0, 16) : '',
      participantes: agenda.participantes.length > 0 ? agenda.participantes : [''],
      ata: agenda.ata || '',
      pontos_discutidos: agenda.pontos_discutidos || '',
      proximos_passos: agenda.proximos_passos || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta agenda?')) return;
    try {
      await agendasService.delete(id);
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao excluir agenda');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const updateParticipante = (idx, value) => {
    const next = [...formData.participantes];
    next[idx] = value;
    setFormData({ ...formData, participantes: next });
  };

  const addParticipanteField = () => {
    setFormData({ ...formData, participantes: [...formData.participantes, ''] });
  };

  const removeParticipanteField = (idx) => {
    setFormData({ ...formData, participantes: formData.participantes.filter((_, i) => i !== idx) });
  };

  if (loading) return <div className="loading">Carregando agendas...</div>;
  if (!entrega) return null;

  const semVagas = entrega.agendas_restantes <= 0;
  const limiteAtingido = formData.participantes.length >= entrega.limite_participantes;

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            {consultoria && (
              <Link to={`/consultorias/${consultoria.id}`} className="page-subtitle" style={{ display: 'inline-block', marginBottom: '6px' }}>
                ← {consultoria.nome}
              </Link>
            )}
            <h1>{entrega.nome}</h1>
            <p className="page-subtitle">Agendas desta entrega · {agendas.length} agenda(s) criada(s)</p>
          </div>
          <button onClick={handleAdd} className="btn-primary" disabled={semVagas} title={semVagas ? 'Cota de agendas desta entrega esgotada' : ''}>
            + Nova Agenda
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Cota de Agendas</div>
                <div className="stat-value">{entrega.quantidade_agendas}</div>
                <div className="stat-change">Total contratado</div>
              </div>
              <div className="stat-icon">🗓️</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Agendas Usadas</div>
                <div className="stat-value">{entrega.agendas_usadas}</div>
                <div className="stat-change">Já criadas</div>
              </div>
              <div className="stat-icon info">✅</div>
            </div>
          </div>

          <div className={`stat-card ${semVagas ? 'danger' : 'success'}`}>
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Agendas Restantes</div>
                <div className="stat-value">{entrega.agendas_restantes}</div>
                <div className="stat-change">{semVagas ? 'Cota esgotada' : 'Disponíveis'}</div>
              </div>
              <div className={`stat-icon ${semVagas ? 'danger' : 'success'}`}>⏳</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Agendas</span>
            <span className="card-subtitle">Limite de {entrega.limite_participantes} participante(s) por agenda</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tema</th>
                  <th>Data</th>
                  <th>Participantes</th>
                  <th style={{ width: '180px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {agendas.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.tema}</strong></td>
                    <td className="text-muted">
                      {a.data_agenda ? new Date(a.data_agenda).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td>
                      {a.participantes.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {a.participantes.map((nome, idx) => (
                            <span key={idx} className="badge badge-orange">{nome}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">Nenhum</span>
                      )}
                    </td>
                    <td className="actions">
                      <button onClick={() => handleEdit(a)} className="btn-secondary btn-small">Editar</button>
                      <button onClick={() => handleDelete(a.id)} className="btn-danger btn-small">Excluir</button>
                    </td>
                  </tr>
                ))}
                {agendas.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>
                      Nenhuma agenda criada ainda.
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
                <h2>{editing ? 'Editar Agenda' : 'Nova Agenda'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Tema da Agenda *</label>
                    <input
                      type="text"
                      value={formData.tema}
                      onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                      placeholder="Ex: Alinhamento de requisitos"
                      required
                    />
                  </div>

                  <div>
                    <label>Data e Hora</label>
                    <input
                      type="datetime-local"
                      value={formData.data_agenda}
                      onChange={(e) => setFormData({ ...formData, data_agenda: e.target.value })}
                    />
                  </div>

                  <div>
                    <label>Participantes (até {entrega.limite_participantes})</label>
                    <div style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      backgroundColor: '#f9f9f9'
                    }}>
                      {formData.participantes.map((nome, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            value={nome}
                            onChange={(e) => updateParticipante(idx, e.target.value)}
                            placeholder="Nome do participante"
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => removeParticipanteField(idx)}
                            className="btn-danger btn-small"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addParticipanteField}
                        className="btn-secondary btn-small"
                        disabled={limiteAtingido}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        + Adicionar participante
                      </button>
                    </div>
                    <div className="form-hint">
                      Apenas o nome do participante, sem necessidade de e-mail ou cadastro no sistema
                    </div>
                  </div>

                  <div>
                    <label>Ata</label>
                    <textarea
                      value={formData.ata}
                      onChange={(e) => setFormData({ ...formData, ata: e.target.value })}
                      placeholder="Registro da reunião"
                      rows={4}
                      maxLength={2000}
                    />
                  </div>

                  <div>
                    <label>Pontos Discutidos</label>
                    <textarea
                      value={formData.pontos_discutidos}
                      onChange={(e) => setFormData({ ...formData, pontos_discutidos: e.target.value })}
                      placeholder="Principais pontos discutidos na agenda"
                      rows={4}
                      maxLength={2000}
                    />
                  </div>

                  <div>
                    <label>Próximos Passos (se houver)</label>
                    <textarea
                      value={formData.proximos_passos}
                      onChange={(e) => setFormData({ ...formData, proximos_passos: e.target.value })}
                      placeholder="Próximos passos definidos, se houver"
                      rows={3}
                      maxLength={1500}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editing ? 'Salvar Alterações' : 'Criar Agenda'}
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

export default EntregaAgendas;
