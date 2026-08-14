import React, { useState, useEffect } from 'react';
import { eventosService } from '../services/eventosService';
import { gruposService } from '../services/gruposService';
import {
  TIPOS_EVENTO, FORMATOS_EVENTO, STATUS_EVENTO, PUBLICOS_EVENTO,
  getTipoEvento, getFormatoEvento, getStatusEvento, getPublicoEvento
} from '../config/eventosConfig';
import { TIPOS_GRUPO, getTipoGrupo } from '../config/gruposConfig';
import {
  addDays, addWeeks, addMonths, isSameDay,
  startOfMonth, startOfNextMonth, getMonthMatrix, getWeekDates, getHoursRange,
  formatMonthYear, formatDayLabel, formatWeekRangeLabel
} from '../utils/calendarUtils';

const emptyForm = {
  nome: '', formato: 'presencial', data_hora: '', responsavel: '',
  tipo_evento: 'reuniao', status: 'agendado', publico: 'todos'
};

const emptyGrupoForm = {
  nome: '', tipo: 'tributario', responsavel: '',
  participantes_fixos: [''], participantes_suplentes: ['']
};

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function Eventos() {
  const [activeTab, setActiveTab] = useState('mes');
  const [calendarView, setCalendarView] = useState('mes');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [cadastroEventos, setCadastroEventos] = useState([]);
  const [mesEventos, setMesEventos] = useState([]);
  const [calendarEventos, setCalendarEventos] = useState([]);
  const [cadastroLoading, setCadastroLoading] = useState(true);
  const [mesLoading, setMesLoading] = useState(true);
  const [calLoading, setCalLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const [grupos, setGrupos] = useState([]);
  const [gruposLoading, setGruposLoading] = useState(true);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState(null);
  const [grupoFormData, setGrupoFormData] = useState(emptyGrupoForm);

  useEffect(() => {
    loadCadastroEventos();
    loadGrupos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMesEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  useEffect(() => {
    loadCalendarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, calendarView]);

  const loadCadastroEventos = async () => {
    setCadastroLoading(true);
    try {
      const data = await eventosService.getAll();
      setCadastroEventos(data);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setCadastroLoading(false);
    }
  };

  const loadMesEventos = async () => {
    setMesLoading(true);
    try {
      const start = startOfMonth(currentDate);
      const end = startOfNextMonth(currentDate);
      const data = await eventosService.getByRange(start.toISOString(), end.toISOString());
      setMesEventos(data);
    } catch (error) {
      console.error('Erro ao carregar eventos do mês:', error);
    } finally {
      setMesLoading(false);
    }
  };

  const loadCalendarEventos = async () => {
    setCalLoading(true);
    try {
      let start, end;
      if (calendarView === 'mes') {
        const matrix = getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth());
        start = matrix.gridStart;
        end = matrix.gridEnd;
      } else if (calendarView === 'semana') {
        const week = getWeekDates(currentDate);
        start = week[0];
        end = addDays(week[6], 1);
      } else {
        start = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        end = addDays(start, 1);
      }
      const data = await eventosService.getByRange(start.toISOString(), end.toISOString());
      setCalendarEventos(data);
    } catch (error) {
      console.error('Erro ao carregar eventos do calendário:', error);
    } finally {
      setCalLoading(false);
    }
  };

  const refreshAll = () => {
    loadCadastroEventos();
    loadMesEventos();
    loadCalendarEventos();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await eventosService.update(editing.id, formData);
      } else {
        await eventosService.create(formData);
      }
      setShowModal(false);
      setEditing(null);
      setFormData(emptyForm);
      refreshAll();
    } catch (error) {
      alert(error.message || 'Erro ao salvar evento');
    }
  };

  const handleEdit = (evento) => {
    setEditing(evento);
    setFormData({
      nome: evento.nome,
      formato: evento.formato,
      data_hora: evento.data_hora ? evento.data_hora.substring(0, 16) : '',
      responsavel: evento.responsavel,
      tipo_evento: evento.tipo_evento,
      status: evento.status,
      publico: evento.publico
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este evento?')) return;
    try {
      await eventosService.delete(id);
      refreshAll();
    } catch (error) {
      alert(error.message || 'Erro ao excluir evento');
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const loadGrupos = async () => {
    setGruposLoading(true);
    try {
      const data = await gruposService.getAll();
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    } finally {
      setGruposLoading(false);
    }
  };

  const handleGrupoSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingGrupo) {
        await gruposService.update(editingGrupo.id, grupoFormData);
      } else {
        await gruposService.create(grupoFormData);
      }
      setShowGrupoModal(false);
      setEditingGrupo(null);
      setGrupoFormData(emptyGrupoForm);
      loadGrupos();
    } catch (error) {
      alert(error.message || 'Erro ao salvar grupo');
    }
  };

  const handleGrupoEdit = (grupo) => {
    setEditingGrupo(grupo);
    setGrupoFormData({
      nome: grupo.nome,
      tipo: grupo.tipo,
      responsavel: grupo.responsavel,
      participantes_fixos: grupo.participantes_fixos.length > 0 ? grupo.participantes_fixos : [''],
      participantes_suplentes: grupo.participantes_suplentes.length > 0 ? grupo.participantes_suplentes : ['']
    });
    setShowGrupoModal(true);
  };

  const handleGrupoDelete = async (id) => {
    if (!window.confirm('Excluir este grupo?')) return;
    try {
      await gruposService.delete(id);
      loadGrupos();
    } catch (error) {
      alert(error.message || 'Erro ao excluir grupo');
    }
  };

  const handleGrupoAdd = () => {
    setEditingGrupo(null);
    setGrupoFormData(emptyGrupoForm);
    setShowGrupoModal(true);
  };

  const updateParticipanteGrupo = (campo, idx, value) => {
    const next = [...grupoFormData[campo]];
    next[idx] = value;
    setGrupoFormData({ ...grupoFormData, [campo]: next });
  };

  const addParticipanteGrupoField = (campo) => {
    setGrupoFormData({ ...grupoFormData, [campo]: [...grupoFormData[campo], ''] });
  };

  const removeParticipanteGrupoField = (campo, idx) => {
    setGrupoFormData({ ...grupoFormData, [campo]: grupoFormData[campo].filter((_, i) => i !== idx) });
  };

  const navigateMes = (amount) => setCurrentDate((d) => addMonths(d, amount));
  const navigateCalendar = (amount) => {
    setCurrentDate((d) => {
      if (calendarView === 'dia') return addDays(d, amount);
      if (calendarView === 'semana') return addWeeks(d, amount);
      return addMonths(d, amount);
    });
  };
  const goToday = () => setCurrentDate(new Date());

  const totals = {
    totalMes: mesEventos.length,
    confirmadosMes: mesEventos.filter((ev) => ev.status === 'confirmado').length,
    agendadosMes: mesEventos.filter((ev) => ev.status === 'agendado').length,
    canceladosMes: mesEventos.filter((ev) => ev.status === 'cancelado').length
  };

  const calendarLabel = calendarView === 'mes'
    ? formatMonthYear(currentDate)
    : calendarView === 'semana'
      ? formatWeekRangeLabel(getWeekDates(currentDate))
      : formatDayLabel(currentDate);

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Gestor de Calendário e Eventos</h1>
            <p className="page-subtitle">Reuniões, treinamentos, workshops e demais eventos da área</p>
          </div>
          {activeTab === 'grupos' ? (
            <button onClick={handleGrupoAdd} className="btn-primary">+ Novo Grupo</button>
          ) : (
            <button onClick={handleAdd} className="btn-primary">+ Novo Evento</button>
          )}
        </div>

        <div className="page-tabs">
          <button className={`page-tab ${activeTab === 'mes' ? 'active' : ''}`} onClick={() => setActiveTab('mes')}>
            📅 Eventos do Mês
          </button>
          <button className={`page-tab ${activeTab === 'cadastro' ? 'active' : ''}`} onClick={() => setActiveTab('cadastro')}>
            📝 Cadastro
          </button>
          <button className={`page-tab ${activeTab === 'calendario' ? 'active' : ''}`} onClick={() => setActiveTab('calendario')}>
            🗓️ Calendário
          </button>
          <button className={`page-tab ${activeTab === 'grupos' ? 'active' : ''}`} onClick={() => setActiveTab('grupos')}>
            👥 Grupos Tributários e Piloto Governo
          </button>
        </div>

        {activeTab === 'mes' && (
          <MesTab
            eventos={mesEventos}
            loading={mesLoading}
            currentDate={currentDate}
            onPrev={() => navigateMes(-1)}
            onNext={() => navigateMes(1)}
            onToday={goToday}
            totals={totals}
            onEdit={handleEdit}
          />
        )}

        {activeTab === 'cadastro' && (
          <CadastroTab
            eventos={cadastroEventos}
            loading={cadastroLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarioTab
            eventos={calendarEventos}
            loading={calLoading}
            currentDate={currentDate}
            calendarView={calendarView}
            setCalendarView={setCalendarView}
            calendarLabel={calendarLabel}
            onPrev={() => navigateCalendar(-1)}
            onNext={() => navigateCalendar(1)}
            onToday={goToday}
            onEdit={handleEdit}
          />
        )}

        {activeTab === 'grupos' && (
          <GruposTab
            grupos={grupos}
            loading={gruposLoading}
            onEdit={handleGrupoEdit}
            onDelete={handleGrupoDelete}
          />
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editing ? 'Editar Evento' : 'Novo Evento'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Nome do Evento *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Ex: Reunião de alinhamento com o cliente"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Tipo do Evento *</label>
                      <select
                        value={formData.tipo_evento}
                        onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                        required
                      >
                        {TIPOS_EVENTO.map((t) => (
                          <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>Formato *</label>
                      <select
                        value={formData.formato}
                        onChange={(e) => setFormData({ ...formData, formato: e.target.value })}
                        required
                      >
                        {FORMATOS_EVENTO.map((f) => (
                          <option key={f.value} value={f.value}>{f.icon} {f.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Data e Hora *</label>
                      <input
                        type="datetime-local"
                        value={formData.data_hora}
                        onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label>Responsável *</label>
                      <input
                        type="text"
                        value={formData.responsavel}
                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                        placeholder="Nome do responsável"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        {STATUS_EVENTO.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>Público *</label>
                      <select
                        value={formData.publico}
                        onChange={(e) => setFormData({ ...formData, publico: e.target.value })}
                        required
                      >
                        {PUBLICOS_EVENTO.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editing ? 'Salvar Alterações' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showGrupoModal && (
          <div className="modal-overlay" onClick={() => setShowGrupoModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}</h2>
                <button className="modal-close" onClick={() => setShowGrupoModal(false)}>×</button>
              </div>

              <form onSubmit={handleGrupoSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div>
                      <label>Nome do Grupo *</label>
                      <input
                        type="text"
                        value={grupoFormData.nome}
                        onChange={(e) => setGrupoFormData({ ...grupoFormData, nome: e.target.value })}
                        placeholder="Ex: Grupo Tributário ICMS"
                        required
                      />
                    </div>

                    <div>
                      <label>Tipo *</label>
                      <select
                        value={grupoFormData.tipo}
                        onChange={(e) => setGrupoFormData({ ...grupoFormData, tipo: e.target.value })}
                        required
                      >
                        {TIPOS_GRUPO.map((t) => (
                          <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>Responsável *</label>
                    <input
                      type="text"
                      value={grupoFormData.responsavel}
                      onChange={(e) => setGrupoFormData({ ...grupoFormData, responsavel: e.target.value })}
                      placeholder="Nome do responsável"
                      required
                    />
                  </div>

                  <ParticipantesField
                    label="Participantes Fixos"
                    values={grupoFormData.participantes_fixos}
                    onChange={(idx, value) => updateParticipanteGrupo('participantes_fixos', idx, value)}
                    onAdd={() => addParticipanteGrupoField('participantes_fixos')}
                    onRemove={(idx) => removeParticipanteGrupoField('participantes_fixos', idx)}
                  />

                  <ParticipantesField
                    label="Participantes Suplentes"
                    values={grupoFormData.participantes_suplentes}
                    onChange={(idx, value) => updateParticipanteGrupo('participantes_suplentes', idx, value)}
                    onAdd={() => addParticipanteGrupoField('participantes_suplentes')}
                    onRemove={(idx) => removeParticipanteGrupoField('participantes_suplentes', idx)}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowGrupoModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingGrupo ? 'Salvar Alterações' : 'Criar Grupo'}
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

function MesTab({ eventos, loading, currentDate, onPrev, onNext, onToday, totals, onEdit }) {
  const { totalMes, confirmadosMes, agendadosMes, canceladosMes } = totals;

  return (
    <>
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={onPrev}>◀</button>
          <button className="calendar-nav-today" onClick={onToday}>Hoje</button>
          <button className="calendar-nav-btn" onClick={onNext}>▶</button>
          <span className="calendar-nav-label">{formatMonthYear(currentDate)}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-label">Total no Mês</div>
              <div className="stat-value">{totalMes}</div>
              <div className="stat-change">Eventos cadastrados</div>
            </div>
            <div className="stat-icon">📅</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-card-header">
            <div>
              <div className="stat-label">Confirmados</div>
              <div className="stat-value">{confirmadosMes}</div>
              <div className="stat-change">Prontos para ocorrer</div>
            </div>
            <div className="stat-icon success">✅</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-card-header">
            <div>
              <div className="stat-label">Agendados</div>
              <div className="stat-value">{agendadosMes}</div>
              <div className="stat-change">Aguardando confirmação</div>
            </div>
            <div className="stat-icon info">🕓</div>
          </div>
        </div>

        <div className="stat-card danger">
          <div className="stat-card-header">
            <div>
              <div className="stat-label">Cancelados</div>
              <div className="stat-value">{canceladosMes}</div>
              <div className="stat-change">Não vão ocorrer</div>
            </div>
            <div className="stat-icon danger">🚫</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span>Eventos do Mês</span>
          <span className="card-subtitle">Ordenados por data e hora</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data/Hora</th>
                <th>Formato</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Público</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>Carregando...</td></tr>
              ) : eventos.length === 0 ? (
                <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>Nenhum evento neste mês.</td></tr>
              ) : (
                eventos.map((ev) => {
                  const tipo = getTipoEvento(ev.tipo_evento);
                  const formato = getFormatoEvento(ev.formato);
                  const status = getStatusEvento(ev.status);
                  const publico = getPublicoEvento(ev.publico);
                  return (
                    <tr key={ev.id} onClick={() => onEdit(ev)} style={{ cursor: 'pointer' }}>
                      <td><strong>{tipo.icon} {ev.nome}</strong></td>
                      <td className="text-muted">{ev.data_hora ? new Date(ev.data_hora).toLocaleString('pt-BR') : '—'}</td>
                      <td>{formato ? `${formato.icon} ${formato.label}` : '—'}</td>
                      <td>{ev.responsavel}</td>
                      <td><span className={`badge ${status.badge}`}>{status.label}</span></td>
                      <td>{publico ? publico.label : '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function CadastroTab({ eventos, loading, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="card-header">
        <span>Eventos Cadastrados</span>
        <span className="card-subtitle">{eventos.length} evento(s)</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Evento</th>
              <th>Data/Hora</th>
              <th>Formato</th>
              <th>Responsável</th>
              <th>Status</th>
              <th>Público</th>
              <th style={{ width: '180px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>Carregando...</td></tr>
            ) : eventos.length === 0 ? (
              <tr><td colSpan="8" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>Nenhum evento cadastrado ainda.</td></tr>
            ) : (
              eventos.map((ev) => {
                const tipo = getTipoEvento(ev.tipo_evento);
                const formato = getFormatoEvento(ev.formato);
                const status = getStatusEvento(ev.status);
                const publico = getPublicoEvento(ev.publico);
                return (
                  <tr key={ev.id}>
                    <td>{tipo.icon} {tipo.label}</td>
                    <td><strong>{ev.nome}</strong></td>
                    <td className="text-muted">{ev.data_hora ? new Date(ev.data_hora).toLocaleString('pt-BR') : '—'}</td>
                    <td>{formato ? `${formato.icon} ${formato.label}` : '—'}</td>
                    <td>{ev.responsavel}</td>
                    <td><span className={`badge ${status.badge}`}>{status.label}</span></td>
                    <td>{publico ? publico.label : '—'}</td>
                    <td className="actions">
                      <button onClick={() => onEdit(ev)} className="btn-secondary btn-small">Editar</button>
                      <button onClick={() => onDelete(ev.id)} className="btn-danger btn-small">Excluir</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarioTab({ eventos, loading, currentDate, calendarView, setCalendarView, calendarLabel, onPrev, onNext, onToday, onEdit }) {
  return (
    <>
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={onPrev}>◀</button>
          <button className="calendar-nav-today" onClick={onToday}>Hoje</button>
          <button className="calendar-nav-btn" onClick={onNext}>▶</button>
          <span className="calendar-nav-label">{calendarLabel}</span>
        </div>
        <div className="calendar-view-switch">
          <button className={`view-switch-btn ${calendarView === 'dia' ? 'active' : ''}`} onClick={() => setCalendarView('dia')}>Dia</button>
          <button className={`view-switch-btn ${calendarView === 'semana' ? 'active' : ''}`} onClick={() => setCalendarView('semana')}>Semana</button>
          <button className={`view-switch-btn ${calendarView === 'mes' ? 'active' : ''}`} onClick={() => setCalendarView('mes')}>Mês</button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>Carregando calendário...</div>
      ) : calendarView === 'mes' ? (
        <MonthGrid currentDate={currentDate} eventos={eventos} onEdit={onEdit} />
      ) : (
        <HoursGrid currentDate={currentDate} calendarView={calendarView} eventos={eventos} onEdit={onEdit} />
      )}
    </>
  );
}

function MonthGrid({ currentDate, eventos, onEdit }) {
  const { days } = getMonthMatrix(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  const MAX_CHIPS = 3;

  const eventosDoDia = (day) => eventos.filter((ev) => ev.data_hora && isSameDay(new Date(ev.data_hora), day));

  return (
    <div className="calendar-grid-month">
      {WEEKDAY_LABELS.map((label) => (
        <div key={label} className="calendar-weekday-header">{label}</div>
      ))}
      {days.map((day, idx) => {
        const dayEventos = eventosDoDia(day);
        const isOtherMonth = day.getMonth() !== currentDate.getMonth();
        const isToday = isSameDay(day, today);
        const visible = dayEventos.slice(0, MAX_CHIPS);
        const extra = dayEventos.length - visible.length;
        return (
          <div
            key={idx}
            className={`calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
          >
            <span className="calendar-day-number">{day.getDate()}</span>
            {visible.map((ev) => {
              const tipo = getTipoEvento(ev.tipo_evento);
              return (
                <div key={ev.id} className="calendar-event-chip" onClick={() => onEdit(ev)} title={ev.nome}>
                  <span>{tipo.icon}</span>
                  <span>{ev.nome}</span>
                </div>
              );
            })}
            {extra > 0 && <div className="calendar-event-chip-more">+{extra} mais</div>}
          </div>
        );
      })}
    </div>
  );
}

function HoursGrid({ currentDate, calendarView, eventos, onEdit }) {
  const days = calendarView === 'semana' ? getWeekDates(currentDate) : [currentDate];
  const hours = getHoursRange(7, 20);
  const today = new Date();

  const eventosDoDiaHora = (day, hour) => eventos.filter((ev) => {
    if (!ev.data_hora) return false;
    const d = new Date(ev.data_hora);
    return isSameDay(d, day) && d.getHours() === hour;
  });

  return (
    <div className="calendar-grid-hours" style={{ gridTemplateColumns: `70px repeat(${days.length}, 1fr)` }}>
      <div className="calendar-hours-corner" />
      {days.map((day, idx) => (
        <div key={idx} className={`calendar-hours-daylabel ${isSameDay(day, today) ? 'today' : ''}`}>
          {day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
        </div>
      ))}

      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className="calendar-hour-label">{String(hour).padStart(2, '0')}:00</div>
          {days.map((day, idx) => {
            const dayEventos = eventosDoDiaHora(day, hour);
            return (
              <div key={idx} className={`calendar-hour-cell ${isSameDay(day, today) ? 'today' : ''}`}>
                {dayEventos.map((ev) => {
                  const tipo = getTipoEvento(ev.tipo_evento);
                  const formato = getFormatoEvento(ev.formato);
                  return (
                    <div key={ev.id} className="calendar-event-slot" onClick={() => onEdit(ev)} title={ev.nome}>
                      <span>{tipo.icon}</span>
                      <span>{formato ? formato.icon : ''}</span>
                      <span>{new Date(ev.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{ev.nome}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function ParticipantesField({ label, values, onChange, onAdd, onRemove }) {
  return (
    <div>
      <label>{label}</label>
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        {values.map((nome, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={nome}
              onChange={(e) => onChange(idx, e.target.value)}
              placeholder="Nome do participante"
              style={{ flex: 1 }}
            />
            <button type="button" onClick={() => onRemove(idx)} className="btn-danger btn-small">
              Remover
            </button>
          </div>
        ))}
        <button type="button" onClick={onAdd} className="btn-secondary btn-small" style={{ alignSelf: 'flex-start' }}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}

function GruposTab({ grupos, loading, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="card-header">
        <span>Grupos Tributários e Piloto Governo</span>
        <span className="card-subtitle">{grupos.length} grupo(s)</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Grupo</th>
              <th>Responsável</th>
              <th>Participantes Fixos</th>
              <th>Participantes Suplentes</th>
              <th style={{ width: '180px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>Carregando...</td></tr>
            ) : grupos.length === 0 ? (
              <tr><td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>Nenhum grupo cadastrado ainda.</td></tr>
            ) : (
              grupos.map((g) => {
                const tipo = getTipoGrupo(g.tipo);
                return (
                  <tr key={g.id}>
                    <td>{tipo.icon} {tipo.label}</td>
                    <td><strong>{g.nome}</strong></td>
                    <td>{g.responsavel}</td>
                    <td>
                      {g.participantes_fixos.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {g.participantes_fixos.map((nome, idx) => (
                            <span key={idx} className="badge badge-info">{nome}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">Nenhum</span>
                      )}
                    </td>
                    <td>
                      {g.participantes_suplentes.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {g.participantes_suplentes.map((nome, idx) => (
                            <span key={idx} className="badge badge-orange">{nome}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">Nenhum</span>
                      )}
                    </td>
                    <td className="actions">
                      <button onClick={() => onEdit(g)} className="btn-secondary btn-small">Editar</button>
                      <button onClick={() => onDelete(g.id)} className="btn-danger btn-small">Excluir</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Eventos;
