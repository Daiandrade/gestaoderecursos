import React, { useState, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';
import { useAuth } from '../context/AuthContext';
import { budgetsService } from '../services/budgetsService';
import { exportPDF, exportExcel } from '../utils/reportExport';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MAX_RANGE_MONTHS = 36;

const buildMonthRange = (monthStart, yearStart, monthEnd, yearEnd) => {
  const startIdx = yearStart * 12 + (monthStart - 1);
  const endIdx = yearEnd * 12 + (monthEnd - 1);
  if (endIdx < startIdx) return [];
  const count = Math.min(endIdx - startIdx + 1, MAX_RANGE_MONTHS);
  const range = [];
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    range.push({ month: (idx % 12) + 1, year: Math.floor(idx / 12) });
  }
  return range;
};

const reconcileMonthlyValues = (range, existing) => {
  return range.map(({ month, year }) => {
    const found = existing.find(e => e.month === month && e.year === year);
    return { month, year, amount_usd: found ? found.amount_usd : '' };
  });
};

const emptyYearMonthlyValues = (year) =>
  buildMonthRange(1, year, 12, year).map(r => ({ ...r, amount_usd: '' }));

const parseMonthlyValues = (budget) => {
  let monthly = [];
  try {
    monthly = budget.monthly_values ? JSON.parse(budget.monthly_values) : [];
  } catch (e) {
    monthly = [];
  }
  if (!monthly.length) {
    monthly = [{ month: budget.month, year: budget.year, amount_usd: budget.amount_usd }];
  }
  return monthly;
};

function Budget() {
  const { user } = useAuth();
  const now = new Date();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [viewMode, setViewMode] = useState('mensal');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [expensesBudgetId, setExpensesBudgetId] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    requested_by: '',
    approved_by: '',
    approval_date: '',
    month_start: 1,
    year_start: now.getFullYear(),
    month_end: 12,
    year_end: now.getFullYear(),
    monthly_values: emptyYearMonthlyValues(now.getFullYear()),
    approved_resources: 0,
    exchange_rate: ''
  });

  useEffect(() => {
    loadBudgets();
    const unsub = budgetsService.subscribe(() => loadBudgets());
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBudgets = async () => {
    try {
      const allBudgets = await budgetsService.getAllWithSpending();
      setBudgets(allBudgets);
    } catch (error) {
      console.error('Erro ao carregar budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.monthly_values.length === 0) {
      alert('Período inválido: o mês/ano final deve ser igual ou posterior ao inicial.');
      return;
    }
    try {
      if (editingBudget) {
        await budgetsService.update(editingBudget.id, formData);
      } else {
        await budgetsService.create(formData, user);
      }
      setShowModal(false);
      setEditingBudget(null);
      resetForm();
    } catch (error) {
      alert(error.message || 'Erro ao salvar budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      description: budget.description || '',
      requested_by: budget.requested_by,
      approved_by: budget.approved_by || '',
      approval_date: budget.approval_date ? budget.approval_date.substring(0, 10) : '',
      month_start: budget.month || now.getMonth() + 1,
      year_start: budget.year || now.getFullYear(),
      month_end: budget.month_end || budget.month || now.getMonth() + 1,
      year_end: budget.year_end || budget.year || now.getFullYear(),
      monthly_values: parseMonthlyValues(budget),
      approved_resources: budget.approved_resources || 0,
      exchange_rate: budget.exchange_rate
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const { resourceCount, expenseCount } = await budgetsService.getUsage(id);
      let msg = 'Tem certeza que deseja excluir este budget?';
      if (resourceCount > 0 || expenseCount > 0) {
        msg += `\n\nAtenção: ${resourceCount} recurso(s) e ${expenseCount} despesa(s) estão vinculados a este budget e ficarão sem essa referência.`;
      }
      if (!window.confirm(msg)) return;
      await budgetsService.delete(id);
    } catch (error) {
      alert(error.message || 'Erro ao deletar budget');
    }
  };

  const handleAdd = () => {
    setEditingBudget(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      requested_by: '',
      approved_by: '',
      approval_date: '',
      month_start: 1,
      year_start: now.getFullYear(),
      month_end: 12,
      year_end: now.getFullYear(),
      monthly_values: emptyYearMonthlyValues(now.getFullYear()),
      approved_resources: 0,
      exchange_rate: ''
    });
  };

  const handleRangeChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    const range = buildMonthRange(updated.month_start, updated.year_start, updated.month_end, updated.year_end);
    updated.monthly_values = reconcileMonthlyValues(range, formData.monthly_values);
    setFormData(updated);
  };

  const handleMonthlyValueChange = (month, year, amountUsd) => {
    setFormData({
      ...formData,
      monthly_values: formData.monthly_values.map(m =>
        m.month === month && m.year === year ? { ...m, amount_usd: amountUsd } : m
      )
    });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const formatUsd = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const explodeMonthlyEntries = (list) => {
    const entries = [];
    list.forEach(b => {
      const monthly = parseMonthlyValues(b);
      const exchangeRate = parseFloat(b.exchange_rate) || 0;
      monthly.forEach(m => {
        const amountUsd = parseFloat(m.amount_usd) || 0;
        entries.push({
          month: m.month,
          year: m.year,
          amount_usd: amountUsd,
          amount_brl: amountUsd * exchangeRate,
          budgetId: b.id,
          requested_by: b.requested_by
        });
      });
    });
    return entries;
  };

  const monthlyEntries = explodeMonthlyEntries(budgets);

  const availableYears = Array.from(new Set(monthlyEntries.map(e => e.year).filter(Boolean))).sort((a, b) => b - a);
  if (availableYears.length === 0) availableYears.push(now.getFullYear());

  const displayedBudgets = viewMode === 'geral'
    ? budgets
    : budgets
        .filter(b => selectedYear >= (b.year || 0) && selectedYear <= (b.year_end || b.year || 0))
        .sort((a, b) => (a.year - b.year) || ((a.month || 0) - (b.month || 0)));

  const displayedMonthlyEntries = viewMode === 'geral'
    ? monthlyEntries
    : monthlyEntries.filter(e => e.year === selectedYear);

  const monthlyBreakdown = Object.values(
    displayedMonthlyEntries.reduce((acc, e) => {
      const key = `${e.year}-${e.month}`;
      if (!acc[key]) acc[key] = { month: e.month, year: e.year, amount_usd: 0, amount_brl: 0, budgetIds: new Set() };
      acc[key].amount_usd += e.amount_usd;
      acc[key].amount_brl += e.amount_brl;
      acc[key].budgetIds.add(e.budgetId);
      return acc;
    }, {})
  ).sort((a, b) => (a.year - b.year) || (a.month - b.month));

  const budgetMonthlyBreakdown = displayedBudgets.map(b => {
    const exchangeRate = parseFloat(b.exchange_rate) || 0;
    const monthly = parseMonthlyValues(b)
      .map(m => {
        const amountUsd = parseFloat(m.amount_usd) || 0;
        return { month: m.month, year: m.year, amount_usd: amountUsd, amount_brl: amountUsd * exchangeRate };
      })
      .sort((a, b2) => (a.year - b2.year) || (a.month - b2.month));
    return { budget: b, monthly };
  });

  const monthYearLabel = (b) => {
    if (!b.month) return '-';
    if (b.month_end && b.year_end && (b.month_end !== b.month || b.year_end !== b.year)) {
      return `${MONTHS[b.month - 1].substring(0, 3)}/${b.year} - ${MONTHS[b.month_end - 1].substring(0, 3)}/${b.year_end}`;
    }
    return `${MONTHS[b.month - 1]}/${b.year}`;
  };

  const totalUsd = displayedBudgets.reduce((sum, b) => sum + parseFloat(b.amount_usd || 0), 0);
  const totalBrl = displayedBudgets.reduce((sum, b) => sum + parseFloat(b.amount_brl || 0), 0);
  const totalSpentUsd = displayedBudgets.reduce((sum, b) => sum + parseFloat(b.spent_usd || 0), 0);
  const totalRemainingUsd = totalUsd - totalSpentUsd;
  const totalSpentBrl = displayedBudgets.reduce((sum, b) => sum + parseFloat(b.spent_brl || 0), 0);
  const totalRemainingBrl = totalBrl - totalSpentBrl;
  const totalResources = displayedBudgets.reduce((sum, b) => sum + parseInt(b.approved_resources || 0), 0);
  const warningCount = displayedBudgets.filter(b => b.status_level === 'warning').length;
  const criticalCount = displayedBudgets.filter(b => b.status_level === 'critical').length;
  const alertCount = warningCount + criticalCount;

  const statusBadge = (statusLevel) => {
    const map = {
      ok: { class: 'badge-success', label: 'OK' },
      warning: { class: 'badge-warning', label: 'Aviso' },
      critical: { class: 'badge-danger', label: 'Crítico' },
      unknown: { class: 'badge-info', label: 'Sem referência' }
    };
    const s = map[statusLevel] || map.unknown;
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  const expensesBudget = budgets.find(b => b.id === expensesBudgetId) || null;

  const previewTotalUsd = formData.monthly_values.reduce((sum, m) => sum + (parseFloat(m.amount_usd) || 0), 0);
  const previewBrl = previewTotalUsd * (parseFloat(formData.exchange_rate) || 0);
  const monthRangeInvalid = formData.monthly_values.length === 0;
  const monthRangeTruncated = (() => {
    const startIdx = formData.year_start * 12 + (formData.month_start - 1);
    const endIdx = formData.year_end * 12 + (formData.month_end - 1);
    return endIdx >= startIdx && (endIdx - startIdx + 1) > MAX_RANGE_MONTHS;
  })();

  if (loading) return <div className="loading">Carregando budget...</div>;

  const buildReportSections = () => ({
    title: 'Budget Aprovado',
    subtitle: viewMode === 'geral' ? 'Visão geral (todos os lançamentos)' : `Visão mensal - ${selectedYear}`,
    sections: [
      {
        heading: 'Valor por Mês',
        columns: ['Mês/Ano', 'Valor USD', 'Valor BRL', 'Qtd. Budgets'],
        rows: monthlyBreakdown.map(m => [
          `${MONTHS[m.month - 1]}/${m.year}`,
          formatUsd(m.amount_usd),
          formatCurrency(m.amount_brl),
          String(m.budgetIds.size)
        ])
      },
      {
        heading: 'Valor por Mês, por Budget Aprovado',
        columns: ['Budget', 'Solicitado por', 'Mês/Ano', 'Valor USD', 'Valor BRL'],
        rows: budgetMonthlyBreakdown.flatMap(({ budget, monthly }) =>
          monthly.map(m => [
            monthYearLabel(budget),
            budget.requested_by,
            `${MONTHS[m.month - 1]}/${m.year}`,
            formatUsd(m.amount_usd),
            formatCurrency(m.amount_brl)
          ])
        )
      },
      {
        heading: 'Budgets',
        columns: ['Mês/Ano', 'Valor USD', 'Gasto USD', 'Cotação', 'Valor BRL', 'Gasto BRL', '% Consumido', 'Status', 'Recursos Aprovados', 'Solicitado por', 'Aprovado por', 'Data Aprovação'],
        rows: displayedBudgets.map(b => [
          monthYearLabel(b),
          formatUsd(parseFloat(b.amount_usd)),
          formatUsd(b.spent_usd || 0),
          parseFloat(b.exchange_rate).toFixed(4),
          formatCurrency(parseFloat(b.amount_brl)),
          formatCurrency(b.spent_brl || 0),
          `${(b.percent_used || 0).toFixed(1)}%`,
          b.status_level === 'critical' ? 'Crítico' : b.status_level === 'warning' ? 'Aviso' : b.status_level === 'unknown' ? 'Sem referência' : 'OK',
          String(b.approved_resources || 0),
          b.requested_by,
          b.approved_by || '-',
          formatDate(b.approval_date)
        ])
      }
    ]
  });

  const handleExportPDF = () => {
    const { title, subtitle, sections } = buildReportSections();
    exportPDF({ title, subtitle, sections, filename: 'budget-aprovado' });
  };

  const handleExportExcel = () => {
    const { sections } = buildReportSections();
    exportExcel({
      filename: 'budget-aprovado',
      sheets: sections.map(s => ({ name: s.heading, columns: s.columns, rows: s.rows }))
    });
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Budget</h1>
            <p className="page-subtitle">Controle geral de budgets aprovados</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
              <option value="mensal">Por Mês</option>
              <option value="geral">Geral</option>
            </select>
            {viewMode === 'mensal' && (
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
            <button onClick={handleExportPDF} className="btn-secondary" disabled={displayedBudgets.length === 0}>
              Exportar PDF
            </button>
            <button onClick={handleExportExcel} className="btn-secondary" disabled={displayedBudgets.length === 0}>
              Exportar Excel
            </button>
            <button onClick={handleAdd} className="btn-primary">
              + Novo Budget
            </button>
          </div>
        </div>

        <p className="page-subtitle" style={{ marginTop: '-8px', marginBottom: '4px' }}>
          {viewMode === 'geral' ? 'Total geral aprovado (todos os lançamentos)' : `Totais de ${selectedYear}`}
        </p>

        <div className="stats-grid">
          <div className="stat-card info">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total Aprovado (US$)</div>
                <div className="stat-value">{formatUsd(totalUsd)}</div>
                <div className="stat-change">Original</div>
              </div>
              <div className="stat-icon info">💵</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total Usado (US$)</div>
                <div className="stat-value">{formatUsd(totalSpentUsd)}</div>
                <div className="stat-change">
                  {totalUsd > 0 ? `${((totalSpentUsd / totalUsd) * 100).toFixed(1)}% do aprovado` : 'Consumido'}
                </div>
              </div>
              <div className="stat-icon info">📉</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total Restante (US$)</div>
                <div className="stat-value">{formatUsd(totalRemainingUsd)}</div>
                <div className="stat-change positive">Disponível</div>
              </div>
              <div className="stat-icon success">✅</div>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: '16px' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total Aprovado (R$)</div>
                <div className="stat-value">{formatCurrency(totalBrl)}</div>
                <div className="stat-change">Convertido</div>
              </div>
              <div className="stat-icon">💰</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total Usado (R$)</div>
                <div className="stat-value">{formatCurrency(totalSpentBrl)}</div>
                <div className="stat-change">
                  {totalBrl > 0 ? `${((totalSpentBrl / totalBrl) * 100).toFixed(1)}% do aprovado` : 'Consumido'}
                </div>
              </div>
              <div className="stat-icon">📉</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Total Restante (R$)</div>
                <div className="stat-value">{formatCurrency(totalRemainingBrl)}</div>
                <div className="stat-change positive">Disponível</div>
              </div>
              <div className="stat-icon">✅</div>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: '16px' }}>
          <div className="stat-card success">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Recursos Aprovados</div>
                <div className="stat-value">{totalResources}</div>
                <div className="stat-change positive">Soma dos budgets</div>
              </div>
              <div className="stat-icon success">👥</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Lançamentos</div>
                <div className="stat-value">{displayedBudgets.length}</div>
                <div className="stat-change">Budgets registrados</div>
              </div>
              <div className="stat-icon warning">📝</div>
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Budgets em Alerta</div>
                <div className="stat-value">{alertCount}</div>
                <div className="stat-change">{warningCount} aviso · {criticalCount} crítico</div>
              </div>
              <div className="stat-icon danger">⚠️</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <span>Valor por Mês</span>
            <span className="card-subtitle">{monthlyBreakdown.length} mês(es)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mês/Ano</th>
                  <th>Valor USD</th>
                  <th>Valor BRL</th>
                  <th>Qtd. Budgets</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted" style={{ padding: '40px' }}>
                      Nenhum valor mensal registrado
                    </td>
                  </tr>
                ) : (
                  monthlyBreakdown.map(m => (
                    <tr key={`${m.year}-${m.month}`}>
                      <td className="text-muted" style={{ fontSize: '13px' }}>{MONTHS[m.month - 1]}/{m.year}</td>
                      <td className="font-semibold">{formatUsd(m.amount_usd)}</td>
                      <td className="font-semibold text-primary">{formatCurrency(m.amount_brl)}</td>
                      <td>{m.budgetIds.size}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <span>Valor por Mês, por Budget Aprovado</span>
            <span className="card-subtitle">{budgetMonthlyBreakdown.length} budget(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Budget</th>
                  <th>Mês/Ano</th>
                  <th>Valor USD</th>
                  <th>Valor BRL</th>
                </tr>
              </thead>
              <tbody>
                {budgetMonthlyBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted" style={{ padding: '40px' }}>
                      Nenhum budget registrado
                    </td>
                  </tr>
                ) : (
                  budgetMonthlyBreakdown.map(({ budget, monthly }) => (
                    monthly.map((m, idx) => (
                      <tr key={`${budget.id}-${m.year}-${m.month}`}>
                        {idx === 0 ? (
                          <td rowSpan={monthly.length} className="font-semibold" style={{ verticalAlign: 'top' }}>
                            {monthYearLabel(budget)}
                            <div className="text-muted" style={{ fontSize: '12px' }}>{budget.requested_by}</div>
                          </td>
                        ) : null}
                        <td className="text-muted" style={{ fontSize: '13px' }}>{MONTHS[m.month - 1]}/{m.year}</td>
                        <td>{formatUsd(m.amount_usd)}</td>
                        <td className="text-primary">{formatCurrency(m.amount_brl)}</td>
                      </tr>
                    ))
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <span>Budgets Aprovados</span>
            <span className="card-subtitle">{displayedBudgets.length} lançamento(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mês/Ano</th>
                  <th>Valor USD</th>
                  <th>Cotação</th>
                  <th>Valor BRL</th>
                  <th>Gasto (US$)</th>
                  <th>Restante (US$)</th>
                  <th>% Consumido</th>
                  <th>Status</th>
                  <th>Recursos</th>
                  <th>Solicitado por</th>
                  <th>Aprovado por</th>
                  <th>Data Aprovação</th>
                  <th style={{ width: '160px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayedBudgets.length === 0 ? (
                  <tr>
                    <td colSpan="13" className="text-center text-muted" style={{ padding: '40px' }}>
                      Nenhum budget registrado
                    </td>
                  </tr>
                ) : (
                  displayedBudgets.map(budget => (
                    <tr key={budget.id}>
                      <td className="text-muted" style={{ fontSize: '13px' }}>
                        {monthYearLabel(budget)}
                      </td>
                      <td className="font-semibold">{formatUsd(parseFloat(budget.amount_usd))}</td>
                      <td>{parseFloat(budget.exchange_rate).toFixed(4)}</td>
                      <td className="font-semibold text-primary">{formatCurrency(parseFloat(budget.amount_brl))}</td>
                      <td className="font-semibold">{formatUsd(budget.spent_usd || 0)}</td>
                      <td>{formatUsd(budget.remaining_usd || 0)}</td>
                      <td>
                        <div
                          className="budget-progress"
                          onClick={() => setExpensesBudgetId(budget.id)}
                          style={{ cursor: 'pointer' }}
                          title="Ver despesas deste budget"
                        >
                          <div className="budget-progress-track">
                            <div
                              className={`budget-progress-fill ${
                                budget.status_level === 'critical' ? 'danger' :
                                budget.status_level === 'warning' ? 'warning' : ''
                              }`}
                              style={{ width: `${Math.min(budget.percent_used || 0, 100)}%` }}
                            />
                          </div>
                          <span className="budget-progress-label">{(budget.percent_used || 0).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>{statusBadge(budget.status_level)}</td>
                      <td>{budget.approved_resources || 0}</td>
                      <td>{budget.requested_by}</td>
                      <td>{budget.approved_by || '-'}</td>
                      <td>{formatDate(budget.approval_date)}</td>
                      <td className="actions">
                        <button onClick={() => handleEdit(budget)} className="btn-secondary btn-small">Editar</button>
                        <button onClick={() => handleDelete(budget.id)} className="btn-danger btn-small">Excluir</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {expensesBudget && (
          <div className="modal-overlay" onClick={() => setExpensesBudgetId(null)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Despesas do Budget - {monthYearLabel(expensesBudget)}</h2>
                <button className="modal-close" onClick={() => setExpensesBudgetId(null)}>×</button>
              </div>

              <div className="modal-body">
                <div className="stats-grid">
                  <div className="stat-card info">
                    <div className="stat-card-header">
                      <div>
                        <div className="stat-label">Aprovado</div>
                        <div className="stat-value">{formatUsd(parseFloat(expensesBudget.amount_usd))}</div>
                        <div className="stat-change">{formatCurrency(parseFloat(expensesBudget.amount_brl))}</div>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-card-header">
                      <div>
                        <div className="stat-label">Gasto</div>
                        <div className="stat-value">{formatUsd(expensesBudget.spent_usd || 0)}</div>
                        <div className="stat-change">{formatCurrency(expensesBudget.spent_brl || 0)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="stat-card success">
                    <div className="stat-card-header">
                      <div>
                        <div className="stat-label">Restante</div>
                        <div className="stat-value">{formatUsd(expensesBudget.remaining_usd || 0)}</div>
                        <div className="stat-change">{(expensesBudget.percent_used || 0).toFixed(1)}% consumido</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-wrapper" style={{ marginTop: '16px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Mês/Ano</th>
                        <th>Recurso</th>
                        <th>Descrição</th>
                        <th>Valor (US$)</th>
                        <th>Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(expensesBudget.expenses || []).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted" style={{ padding: '40px' }}>
                            Nenhuma despesa lançada neste budget ainda
                          </td>
                        </tr>
                      ) : (
                        expensesBudget.expenses.map(e => (
                          <tr key={e.id}>
                            <td className="text-muted" style={{ fontSize: '13px' }}>{MONTHS[e.month - 1]}/{e.year}</td>
                            <td>{e.resource_name}</td>
                            <td className="text-muted" style={{ fontSize: '13px' }}>{e.description || '-'}</td>
                            <td className="font-semibold">{formatUsd(e.amount_usd)}</td>
                            <td className="font-semibold text-primary">{e.amount_brl !== null ? formatCurrency(e.amount_brl) : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setExpensesBudgetId(null)} className="btn-secondary">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingBudget ? 'Editar Budget' : 'Novo Budget'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      placeholder="Descreva o budget..."
                    />
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Recursos Aprovados</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.approved_resources}
                        onChange={(e) => setFormData({ ...formData, approved_resources: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Solicitado por *</label>
                      <input
                        type="text"
                        value={formData.requested_by}
                        onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                        placeholder="Nome de quem pediu"
                        required
                      />
                    </div>

                    <div>
                      <label>Aprovado por</label>
                      <input
                        type="text"
                        value={formData.approved_by}
                        onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                        placeholder="Nome de quem aprovou"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Data de Aprovação</label>
                      <input
                        type="date"
                        value={formData.approval_date}
                        onChange={(e) => setFormData({ ...formData, approval_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Mês Inicial *</label>
                      <select
                        value={formData.month_start}
                        onChange={(e) => handleRangeChange('month_start', parseInt(e.target.value))}
                        required
                      >
                        {MONTHS.map((m, index) => (
                          <option key={m} value={index + 1}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>Ano Inicial *</label>
                      <input
                        type="number"
                        value={formData.year_start}
                        onChange={(e) => handleRangeChange('year_start', parseInt(e.target.value) || now.getFullYear())}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Mês Final *</label>
                      <select
                        value={formData.month_end}
                        onChange={(e) => handleRangeChange('month_end', parseInt(e.target.value))}
                        required
                      >
                        {MONTHS.map((m, index) => (
                          <option key={m} value={index + 1}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label>Ano Final *</label>
                      <input
                        type="number"
                        value={formData.year_end}
                        onChange={(e) => handleRangeChange('year_end', parseInt(e.target.value) || now.getFullYear())}
                        required
                      />
                    </div>
                  </div>

                  {monthRangeInvalid && (
                    <div className="form-hint">
                      Período inválido: o mês/ano final deve ser igual ou posterior ao inicial.
                    </div>
                  )}
                  {monthRangeTruncated && (
                    <div className="form-hint">
                      Período limitado a {MAX_RANGE_MONTHS} meses.
                    </div>
                  )}

                  {formData.monthly_values.length > 0 && (
                    <div>
                      <label>Valor Aprovado por Mês (US$) *</label>
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Mês/Ano</th>
                              <th>Valor (US$)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.monthly_values.map(m => (
                              <tr key={`${m.year}-${m.month}`}>
                                <td>{MONTHS[m.month - 1]}/{m.year}</td>
                                <td>
                                  <NumericFormat
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    decimalScale={2}
                                    fixedDecimalScale={false}
                                    allowNegative={false}
                                    value={m.amount_usd}
                                    onValueChange={(v) => handleMonthlyValueChange(m.month, m.year, v.value)}
                                    placeholder="0,00"
                                    required
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div>
                      <label>Cotação do Dólar (R$) *</label>
                      <NumericFormat
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={4}
                        fixedDecimalScale={false}
                        allowNegative={false}
                        value={formData.exchange_rate}
                        onValueChange={(v) => setFormData({ ...formData, exchange_rate: v.value })}
                        placeholder="Ex: 5,20"
                        required
                      />
                      <div className="form-hint">
                        Cotação única aplicada a todos os meses do período
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label>Valor Total Aprovado (US$)</label>
                      <input type="text" value={formatUsd(previewTotalUsd)} disabled />
                      <div className="form-hint">
                        Soma automática dos valores por mês
                      </div>
                    </div>

                    <div>
                      <label>Valor Total Equivalente (R$)</label>
                      <input type="text" value={formatCurrency(previewBrl)} disabled />
                      <div className="form-hint">
                        Calculado automaticamente: Valor Total USD × Cotação
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary">
                    {editingBudget ? 'Salvar Alterações' : 'Registrar Budget'}
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

export default Budget;
