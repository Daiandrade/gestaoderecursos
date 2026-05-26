import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expensesService } from '../services/expensesService';
import { productsService } from '../services/productsService';
import { resourcesService } from '../services/resourcesService';
import { CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

function Expenses() {
  const { user, profile } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [resources, setResources] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    resource_id: '',
    product_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    description: ''
  });

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    loadInitial();
    const unsub = expensesService.subscribe(() => {
      if (selectedProduct) {
        loadExpenses();
        loadMonthlyData();
      }
    });
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadExpenses();
      loadMonthlyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, selectedYear]);

  const loadInitial = async () => {
    try {
      const filter = profile?.role === 'admin' ? null : profile?.product_id;
      const [productsData, resourcesData] = await Promise.all([
        productsService.getAll(filter),
        resourcesService.getAll(filter)
      ]);

      setProducts(productsData);
      setResources(resourcesData);

      if (productsData.length > 0) {
        setSelectedProduct(productsData[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    if (!selectedProduct) return;
    try {
      const data = await expensesService.getByProduct(selectedProduct, selectedYear);
      setExpenses(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    }
  };

  const loadMonthlyData = async () => {
    if (!selectedProduct) return;
    try {
      const data = await expensesService.getMonthlyTotals(selectedProduct, selectedYear);
      const result = months.map((month, index) => {
        const md = data.find(d => d.month === index + 1);
        return { month: month.substring(0, 3), valor: md ? parseFloat(md.total) : 0 };
      });
      setMonthlyData(result);
    } catch (error) {
      console.error('Erro mensal:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await expensesService.update(editingExpense.id, formData, user);
      } else {
        await expensesService.create({ ...formData, product_id: selectedProduct }, user);
      }
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
      loadExpenses();
      loadMonthlyData();
    } catch (error) {
      alert(error.message || 'Erro ao salvar despesa');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      resource_id: expense.resource_id,
      product_id: expense.product_id,
      month: expense.month,
      year: expense.year,
      amount: expense.amount,
      description: expense.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      await expensesService.delete(id);
      loadExpenses();
      loadMonthlyData();
    } catch (error) {
      alert(error.message || 'Erro ao deletar despesa');
    }
  };

  const viewHistory = async (expenseId) => {
    try {
      const data = await expensesService.getHistory(expenseId);
      setHistory(data);
      setShowHistory(true);
    } catch (error) {
      alert('Erro ao carregar histórico');
    }
  };

  const handleAdd = () => {
    setEditingExpense(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      resource_id: '',
      product_id: selectedProduct,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: '',
      description: ''
    });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const filteredResources = resources.filter(r => r.product_id === selectedProduct);
  const totalYear = monthlyData.reduce((sum, m) => sum + m.valor, 0);
  const monthsWithData = monthlyData.filter(m => m.valor > 0).length;
  const avgMonthly = monthsWithData > 0 ? totalYear / monthsWithData : 0;
  const maxMonth = monthlyData.reduce((max, m) => m.valor > max.valor ? m : max, { month: '-', valor: 0 });

  if (loading) return <div className="loading">Carregando despesas...</div>;

  const currentProductName = products.find(p => p.id === selectedProduct)?.name || '';

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Conta Corrente</h1>
            <p className="page-subtitle">Controle financeiro de despesas mensais por produto</p>
          </div>
          <button onClick={handleAdd} className="btn-primary" disabled={!selectedProduct}>
            + Nova Despesa
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            <label>Produto</label>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Ano</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total {selectedYear}</div>
                <div className="stat-value">{formatCurrency(totalYear)}</div>
                <div className="stat-change">{currentProductName}</div>
              </div>
              <div className="stat-icon">💰</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Média Mensal</div>
                <div className="stat-value">{formatCurrency(avgMonthly)}</div>
                <div className="stat-change">Por mês</div>
              </div>
              <div className="stat-icon info">📊</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Pico Mensal</div>
                <div className="stat-value">{formatCurrency(maxMonth.valor)}</div>
                <div className="stat-change">{maxMonth.month}/{selectedYear}</div>
              </div>
              <div className="stat-icon warning">📈</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Lançamentos</div>
                <div className="stat-value">{expenses.length}</div>
                <div className="stat-change positive">Despesas registradas</div>
              </div>
              <div className="stat-icon success">📝</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Evolução de Despesas - {currentProductName} ({selectedYear})</span>
            <span className="card-subtitle">Valores em R$</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FA6400" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FA6400" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6E6E6E' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6E6E6E' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="valor" stroke="#FA6400" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" name="Despesas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Lançamentos</span>
            <span className="card-subtitle">{expenses.length} despesa(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th>Período</th>
                  <th>Valor</th>
                  <th>Descrição</th>
                  <th>Registrado por</th>
                  <th style={{ width: '240px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: '40px' }}>
                      Nenhuma despesa registrada para este período
                    </td>
                  </tr>
                ) : (
                  expenses.map(expense => (
                    <tr key={expense.id}>
                      <td><strong>{expense.resource_name}</strong></td>
                      <td><span className="badge badge-info">{months[expense.month - 1]}/{expense.year}</span></td>
                      <td className="font-semibold text-primary">{formatCurrency(parseFloat(expense.amount))}</td>
                      <td className="text-muted">{expense.description || '-'}</td>
                      <td>{expense.created_by_name || '-'}</td>
                      <td className="actions">
                        <button onClick={() => viewHistory(expense.id)} className="btn-ghost btn-small">Histórico</button>
                        <button onClick={() => handleEdit(expense)} className="btn-secondary btn-small">Editar</button>
                        <button onClick={() => handleDelete(expense.id)} className="btn-danger btn-small">Excluir</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Recurso *</label>
                    <select
                      value={formData.resource_id}
                      onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
                      required
                      disabled={!!editingExpense}
                    >
                      <option value="">Selecione o recurso...</option>
                      {filteredResources.map(r => (
                        <option key={r.id} value={r.id}>{r.name} - {r.job_title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Mês *</label>
                      <select
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                        required
                        disabled={!!editingExpense}
                      >
                        {months.map((month, index) => (
                          <option key={index} value={index + 1}>{month}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>Ano *</label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        required
                        disabled={!!editingExpense}
                      />
                    </div>
                  </div>

                  <div>
                    <label>Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <label>Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="4"
                      placeholder="Descreva a despesa..."
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">
                    {editingExpense ? 'Salvar Alterações' : 'Registrar Despesa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="modal-overlay" onClick={() => setShowHistory(false)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Histórico de Alterações</h2>
                <button className="modal-close" onClick={() => setShowHistory(false)}>×</button>
              </div>

              <div className="modal-body">
                {history.length === 0 ? (
                  <div className="text-center text-muted" style={{ padding: '40px' }}>
                    Nenhuma alteração registrada para esta despesa
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Ação</th>
                          <th>Usuário</th>
                          <th>Valores Antigos</th>
                          <th>Valores Novos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(h => (
                          <tr key={h.id}>
                            <td>{new Date(h.changed_at).toLocaleString('pt-BR')}</td>
                            <td><span className="badge badge-info">{h.action}</span></td>
                            <td>{h.changed_by_name || '-'}</td>
                            <td><pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>{h.old_values}</pre></td>
                            <td><pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap' }}>{h.new_values}</pre></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowHistory(false)} className="btn-secondary">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Expenses;
