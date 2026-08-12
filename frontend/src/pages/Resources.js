import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resourcesService } from '../services/resourcesService';
import { productsService } from '../services/productsService';
import { budgetsService } from '../services/budgetsService';

function Resources() {
  const { profile } = useAuth();
  const [resources, setResources] = useState([]);
  const [products, setProducts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    product_id: '',
    job_title: '',
    job_description: '',
    supplier: '',
    allocation_percentage: 100,
    status: 'ativo',
    start_date: '',
    end_date: '',
    budget_id: ''
  });

  useEffect(() => {
    loadData();
    const unsubR = resourcesService.subscribe(() => loadData());
    const unsubP = productsService.subscribe(() => loadData());
    return () => { unsubR?.(); unsubP?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [allResources, allProducts, allBudgets] = await Promise.all([
        resourcesService.getAll(),
        productsService.getAll(),
        budgetsService.getAll()
      ]);
      setBudgets(allBudgets);

      // Filtrar se não for admin
      if (profile?.role === 'admin') {
        setResources(allResources);
        setProducts(allProducts);
      } else {
        const allowedProductIds = profile?.product_ids || [];
        const filteredResources = allResources.filter(r => allowedProductIds.includes(r.product_id));
        const filteredProducts = allProducts.filter(p => allowedProductIds.includes(p.id));
        setResources(filteredResources);
        setProducts(filteredProducts);
      }
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
      if (editingResource) {
        await resourcesService.update(editingResource.id, formData);
      } else {
        await resourcesService.create(formData);
      }
      setShowModal(false);
      setEditingResource(null);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao salvar recurso');
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      product_id: resource.product_id,
      job_title: resource.job_title,
      job_description: resource.job_description || '',
      supplier: resource.supplier || '',
      allocation_percentage: resource.allocation_percentage,
      status: resource.status,
      start_date: resource.start_date || '',
      end_date: resource.end_date || '',
      budget_id: resource.budget_id || ''
    });
    setShowModal(true);
  };

  const handleViewDetails = (resource) => {
    setSelectedResource(resource);
    setShowDetailModal(true);
  };

  const handleDelete = async (id, name) => {
    const msg = `Tem certeza que deseja excluir "${name}"?\n\nAtenção: Todas as despesas e histórico associados também serão removidos.`;
    if (!window.confirm(msg)) return;
    try {
      await resourcesService.delete(id);
      loadData();
    } catch (error) {
      alert(error.message || 'Erro ao deletar recurso');
    }
  };

  const handleAdd = () => {
    setEditingResource(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      product_id: profile?.role !== 'admin' ? profile?.product_id || '' : '',
      job_title: '',
      job_description: '',
      supplier: '',
      allocation_percentage: 100,
      status: 'ativo',
      start_date: '',
      end_date: '',
      budget_id: ''
    });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatBudgetLabel = (budget) => {
    if (!budget) return '';
    const start = budget.period_start ? new Date(budget.period_start).toLocaleDateString('pt-BR') : '?';
    const end = budget.period_end ? new Date(budget.period_end).toLocaleDateString('pt-BR') : '?';
    const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(budget.amount_usd || 0);
    return `${start} — ${end} · ${usd}`;
  };

  const filteredResources = resources.filter(r => {
    if (filterProduct && r.product_id !== filterProduct) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.job_title.toLowerCase().includes(s) || (r.supplier || '').toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <div className="loading">Carregando recursos...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Recursos</h1>
            <p className="page-subtitle">
              Gestão de profissionais alocados aos produtos · {filteredResources.length} recurso(s)
            </p>
          </div>
          <button onClick={handleAdd} className="btn-primary">+ Novo Recurso</button>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nome, cargo ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Produto</label>
            <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}>
              <option value="">Todos os produtos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="ativo">Ativo</option>
              <option value="urgente">Urgente</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Produto</th>
                  <th>Cargo</th>
                  <th>Fornecedor</th>
                  <th>Período</th>
                  <th>Alocação</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Valor Real</th>
                  <th style={{ width: '220px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredResources.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center text-muted" style={{ padding: '40px' }}>
                      Nenhum recurso encontrado
                    </td>
                  </tr>
                ) : (
                  filteredResources.map(resource => {
                    const getStatusBadge = (status) => {
                      const statusMap = {
                        'ativo': { class: 'badge-success', label: 'Ativo' },
                        'urgente': { class: 'badge-warning', label: 'Urgente' },
                        'inativo': { class: 'badge-secondary', label: 'Inativo' }
                      };
                      const s = statusMap[status] || { class: 'badge-secondary', label: status };
                      return <span className={`badge ${s.class}`}>{s.label}</span>;
                    };

                    const formatDate = (date) => {
                      if (!date) return '-';
                      return new Date(date).toLocaleDateString('pt-BR');
                    };

                    const period = resource.start_date || resource.end_date
                      ? `${formatDate(resource.start_date)} até ${formatDate(resource.end_date)}`
                      : '-';

                    return (
                      <tr key={resource.id}>
                        <td><strong>{resource.name}</strong></td>
                        <td><span className="badge badge-orange">{resource.product_name}</span></td>
                        <td>{resource.job_title}</td>
                        <td>{resource.supplier || <span className="text-muted">-</span>}</td>
                        <td className="text-muted" style={{ fontSize: '13px' }}>{period}</td>
                        <td><strong>{resource.allocation_percentage}%</strong></td>
                        <td>{getStatusBadge(resource.status)}</td>
                        <td>
                          {resource.budget ? (
                            <span className="badge badge-info">{formatBudgetLabel(resource.budget)}</span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '13px' }}>Sem budget</span>
                          )}
                        </td>
                        <td className="font-semibold">
                          {formatCurrency(parseFloat(resource.actual_value || 0))}
                        </td>
                        <td className="actions">
                          <button onClick={() => handleViewDetails(resource)} className="btn-ghost btn-small">
                            Detalhes
                          </button>
                          <button onClick={() => handleEdit(resource)} className="btn-secondary btn-small">
                            Editar
                          </button>
                          <button onClick={() => handleDelete(resource.id, resource.name)} className="btn-danger btn-small">
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingResource ? 'Editar Recurso' : 'Novo Recurso'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div>
                      <label>Nome Completo *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label>Produto *</label>
                      <select
                        value={formData.product_id}
                        onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                        required
                        disabled={profile?.role !== 'admin' && !!editingResource}
                      >
                        <option value="">Selecione o produto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Cargo / Função *</label>
                      <input
                        type="text"
                        value={formData.job_title}
                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                        placeholder="Ex: Desenvolvedor Senior, Tech Lead, Product Manager..."
                        required
                      />
                    </div>

                    <div>
                      <label>Fornecedor</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Ex: Accenture, TCS, Contratação direta..."
                      />
                    </div>
                  </div>

                  <div>
                    <label>Descrição Detalhada do Cargo (Job Description)</label>
                    <textarea
                      value={formData.job_description}
                      onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                      rows="8"
                      placeholder="Descreva responsabilidades, atividades, requisitos técnicos, soft skills..."
                      style={{ minHeight: '180px', maxHeight: '400px', fontFamily: 'inherit' }}
                      maxLength={5000}
                    />
                    <div className="form-hint">
                      Máximo 5000 caracteres. Arraste o canto inferior direito para aumentar.
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Data Início</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label>Data Término</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Alocação no Produto (%) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.allocation_percentage}
                        onChange={(e) => setFormData({ ...formData, allocation_percentage: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <label>Status *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="ativo">Ativo</option>
                        <option value="urgente">Urgente</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label>Budget Atual</label>
                    <select
                      value={formData.budget_id}
                      onChange={(e) => setFormData({ ...formData, budget_id: e.target.value })}
                    >
                      <option value="">Nenhum budget vinculado</option>
                      {budgets.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.description ? `${b.description} · ` : ''}{formatBudgetLabel(b)}
                        </option>
                      ))}
                    </select>
                    <div className="form-hint">
                      Despesas já lançadas na Conta Corrente não são afetadas se o recurso trocar de budget depois.
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingResource ? 'Salvar Alterações' : 'Criar Recurso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetailModal && selectedResource && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detalhes do Recurso</h2>
                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--tr-light-gray)' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--tr-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700 }}>
                    {selectedResource.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ marginBottom: '4px' }}>{selectedResource.name}</h2>
                    <div style={{ color: 'var(--tr-medium-gray)', fontSize: '15px' }}>{selectedResource.job_title}</div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-orange">{selectedResource.product_name}</span>
                      <span className={`badge ${
                        selectedResource.status === 'ativo' ? 'badge-success' :
                        selectedResource.status === 'urgente' ? 'badge-warning' : 'badge-secondary'
                      }`}>
                        {selectedResource.status === 'ativo' ? 'Ativo' :
                         selectedResource.status === 'urgente' ? 'Urgente' : 'Inativo'}
                      </span>
                      <span className="badge badge-info">{selectedResource.allocation_percentage}% alocado</span>
                      {selectedResource.supplier && (
                        <span className="badge badge-secondary">Fornecedor: {selectedResource.supplier}</span>
                      )}
                      {selectedResource.budget ? (
                        <span className="badge badge-orange">Budget: {formatBudgetLabel(selectedResource.budget)}</span>
                      ) : (
                        <span className="badge badge-info">Sem budget vinculado</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px', color: 'var(--tr-medium-gray)', marginBottom: '8px', display: 'block' }}>
                      Período de Alocação
                    </label>
                    <div style={{ fontSize: '15px' }}>
                      {selectedResource.start_date || selectedResource.end_date ? (
                        <>
                          <strong>Início:</strong> {selectedResource.start_date ? new Date(selectedResource.start_date).toLocaleDateString('pt-BR') : 'Não definido'}
                          <br />
                          <strong>Término:</strong> {selectedResource.end_date ? new Date(selectedResource.end_date).toLocaleDateString('pt-BR') : 'Não definido'}
                        </>
                      ) : (
                        <em style={{ color: 'var(--tr-medium-gray)' }}>Período não definido</em>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px', color: 'var(--tr-medium-gray)', marginBottom: '8px', display: 'block' }}>
                      Valores
                    </label>
                    <div style={{ fontSize: '15px' }}>
                      <strong>Real (Despesas):</strong> {formatCurrency(parseFloat(selectedResource.actual_value || 0))}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.5px', color: 'var(--tr-medium-gray)' }}>
                    Job Description
                  </label>
                  <div style={{ background: 'var(--tr-bg-gray)', padding: '20px', borderRadius: 'var(--radius-md)', marginTop: '8px', whiteSpace: 'pre-wrap', lineHeight: '1.7', minHeight: '200px', fontSize: '14px' }}>
                    {selectedResource.job_description || (
                      <em style={{ color: 'var(--tr-medium-gray)' }}>Nenhuma descrição cadastrada.</em>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowDetailModal(false)} className="btn-secondary">Fechar</button>
                <button onClick={() => { setShowDetailModal(false); handleEdit(selectedResource); }} className="btn-primary">
                  Editar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Resources;
