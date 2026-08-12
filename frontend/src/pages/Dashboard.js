import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsService } from '../services/productsService';
import { resourcesService } from '../services/resourcesService';
import { budgetsService } from '../services/budgetsService';
import { exportPDF, exportExcel } from '../utils/reportExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#FA6400', '#1A1B27', '#0052CC', '#00875A'];

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [resources, setResources] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile, isAdmin } = useAuth();

  useEffect(() => {
    loadData();

    // Realtime: atualiza quando produtos, recursos, despesas ou budget mudam
    const unsubProducts = productsService.subscribe(() => loadData());
    const unsubResources = resourcesService.subscribe(() => loadData());
    const unsubBudgets = budgetsService.subscribe(() => loadData());

    return () => {
      unsubProducts?.();
      unsubResources?.();
      unsubBudgets?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Buscar todos os produtos, recursos e budgets (budget é geral, não filtra por produto)
      const [allProducts, allResources, allBudgets] = await Promise.all([
        productsService.getAll(),
        resourcesService.getAll(),
        budgetsService.getAllWithSpending()
      ]);

      setBudgets(allBudgets);

      // Filtrar produtos/recursos se não for admin
      if (profile?.role === 'admin') {
        setProducts(allProducts);
        setResources(allResources);
      } else {
        const allowedProductIds = profile?.product_ids || [];
        const filteredProducts = allProducts.filter(p => allowedProductIds.includes(p.id));
        const filteredResources = allResources.filter(r => allowedProductIds.includes(r.product_id));
        setProducts(filteredProducts);
        setResources(filteredResources);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  const totalProducts = products.length;
  const resourcesAtivos = resources.filter(r => r.status === 'ativo').length;
  const resourcesUrgentes = resources.filter(r => r.status === 'urgente').length;
  const resourcesInativos = resources.filter(r => r.status === 'inativo').length;
  const totalResources = resourcesAtivos + resourcesUrgentes + resourcesInativos;
  const totalExpenses = resources.reduce((sum, r) => sum + parseFloat(r.total_expenses || 0), 0);
  const avgExpensePerResource = totalResources > 0 ? totalExpenses / totalResources : 0;

  const totalBudgetBrl = budgets.reduce((sum, b) => sum + parseFloat(b.amount_brl || 0), 0);
  const totalBudgetUsd = budgets.reduce((sum, b) => sum + parseFloat(b.amount_usd || 0), 0);
  const totalBudgetResources = budgets.reduce((sum, b) => sum + parseInt(b.approved_resources || 0), 0);
  const totalBudgetSpentUsd = budgets.reduce((sum, b) => sum + parseFloat(b.spent_usd || 0), 0);
  const totalBudgetRemainingUsd = totalBudgetUsd - totalBudgetSpentUsd;
  const totalBudgetSpentBrl = budgets.reduce((sum, b) => sum + parseFloat(b.spent_brl || 0), 0);
  const totalBudgetRemainingBrl = totalBudgetBrl - totalBudgetSpentBrl;
  const budgetWarningCount = budgets.filter(b => b.status_level === 'warning').length;
  const budgetCriticalCount = budgets.filter(b => b.status_level === 'critical').length;
  const budgetAlertCount = budgetWarningCount + budgetCriticalCount;

  const productData = products.map(p => ({
    name: p.name,
    recursos: p.active_resources || 0,
    despesas: parseFloat(p.total_expenses || 0)
  }));

  const pieData = products.map(p => ({
    name: p.name,
    value: parseFloat(p.total_expenses || 0)
  })).filter(p => p.value > 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatUsd = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

  const buildReportSections = () => ({
    title: 'Dashboard Gerencial',
    subtitle: isAdmin()
      ? 'Visão consolidada de todos os produtos e recursos'
      : `Gerenciando: ${products[0]?.name || 'Nenhum produto atribuído'}`,
    sections: [
      {
        heading: 'Budget Aprovado (Geral)',
        columns: ['Indicador', 'Valor'],
        rows: [
          ['Total Aprovado (US$)', formatUsd(totalBudgetUsd)],
          ['Total Usado (US$)', formatUsd(totalBudgetSpentUsd)],
          ['Total Restante (US$)', formatUsd(totalBudgetRemainingUsd)],
          ['Total Aprovado (R$)', formatCurrency(totalBudgetBrl)],
          ['Total Usado (R$)', formatCurrency(totalBudgetSpentBrl)],
          ['Total Restante (R$)', formatCurrency(totalBudgetRemainingBrl)],
          ['Recursos Aprovados', String(totalBudgetResources)],
          ['Lançamentos de Budget', String(budgets.length)],
          ['Budgets em Aviso', String(budgetWarningCount)],
          ['Budgets em Crítico', String(budgetCriticalCount)]
        ]
      },
      {
        heading: 'Resumo Geral',
        columns: ['Indicador', 'Valor'],
        rows: [
          ['Produtos', String(totalProducts)],
          ['Recursos Ativos', String(resourcesAtivos)],
          ['Recursos Urgentes', String(resourcesUrgentes)],
          ['Recursos Inativos', String(resourcesInativos)],
          ['Valor Real (Despesas)', formatCurrency(totalExpenses)],
          ['Custo Médio por Recurso', formatCurrency(avgExpensePerResource)]
        ]
      },
      {
        heading: 'Visão Geral dos Produtos',
        columns: ['Produto', 'Descrição', 'Recursos Ativos', 'Total Recursos', 'Despesas Totais'],
        rows: products.map(p => [
          p.name,
          p.description || '-',
          String(p.active_resources || 0),
          String(p.total_resources || 0),
          formatCurrency(parseFloat(p.total_expenses || 0))
        ])
      }
    ]
  });

  const handleExportPDF = () => {
    const { title, subtitle, sections } = buildReportSections();
    exportPDF({ title, subtitle, sections, filename: 'dashboard-gerencial' });
  };

  const handleExportExcel = () => {
    const { sections } = buildReportSections();
    exportExcel({
      filename: 'dashboard-gerencial',
      sheets: sections.map(s => ({ name: s.heading, columns: s.columns, rows: s.rows }))
    });
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Dashboard Gerencial</h1>
            <p className="page-subtitle">
              {isAdmin()
                ? 'Visão consolidada de todos os produtos e recursos'
                : `Gerenciando: ${products[0]?.name || 'Nenhum produto atribuído'}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExportPDF} className="btn-secondary">Exportar PDF</button>
            <button onClick={handleExportExcel} className="btn-secondary">Exportar Excel</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span>Budget Aprovado</span>
            <span className="card-subtitle">Visão geral, não vinculado a produto</span>
          </div>
          <div style={{ padding: '20px' }}>
            <div className="stats-grid">
              <div className="stat-card info">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">Total Aprovado (US$)</div>
                    <div className="stat-value">{formatUsd(totalBudgetUsd)}</div>
                    <div className="stat-change">Original</div>
                  </div>
                  <div className="stat-icon info">💵</div>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">Total Usado (US$)</div>
                    <div className="stat-value">{formatUsd(totalBudgetSpentUsd)}</div>
                    <div className="stat-change">
                      {totalBudgetUsd > 0 ? `${((totalBudgetSpentUsd / totalBudgetUsd) * 100).toFixed(1)}% do aprovado` : 'Consumido'}
                    </div>
                  </div>
                  <div className="stat-icon info">📉</div>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">Total Restante (US$)</div>
                    <div className="stat-value">{formatUsd(totalBudgetRemainingUsd)}</div>
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
                    <div className="stat-value">{formatCurrency(totalBudgetBrl)}</div>
                    <div className="stat-change">Convertido</div>
                  </div>
                  <div className="stat-icon">💰</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">Total Usado (R$)</div>
                    <div className="stat-value">{formatCurrency(totalBudgetSpentBrl)}</div>
                    <div className="stat-change">
                      {totalBudgetBrl > 0 ? `${((totalBudgetSpentBrl / totalBudgetBrl) * 100).toFixed(1)}% do aprovado` : 'Consumido'}
                    </div>
                  </div>
                  <div className="stat-icon">📉</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">Total Restante (R$)</div>
                    <div className="stat-value">{formatCurrency(totalBudgetRemainingBrl)}</div>
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
                    <div className="stat-value">{totalBudgetResources}</div>
                    <div className="stat-change positive">Soma dos budgets</div>
                  </div>
                  <div className="stat-icon success">👥</div>
                </div>
              </div>

              <div className="stat-card warning">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">Lançamentos</div>
                    <div className="stat-value">{budgets.length}</div>
                    <div className="stat-change">Budgets registrados</div>
                  </div>
                  <div className="stat-icon warning">📝</div>
                </div>
              </div>

              <div className="stat-card danger">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-label">Budgets em Alerta</div>
                    <div className="stat-value">{budgetAlertCount}</div>
                    <div className="stat-change">{budgetWarningCount} aviso · {budgetCriticalCount} crítico</div>
                  </div>
                  <div className="stat-icon danger">⚠️</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: '20px' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Produtos</div>
                <div className="stat-value">{totalProducts}</div>
                <div className="stat-change">Sob gestão</div>
              </div>
              <div className="stat-icon">📊</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Recursos Ativos</div>
                <div className="stat-value">{resourcesAtivos}</div>
                <div className="stat-change positive">Operando normalmente</div>
              </div>
              <div className="stat-icon success">✓</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Recursos Urgentes</div>
                <div className="stat-value">{resourcesUrgentes}</div>
                <div className="stat-change">Requerem atenção</div>
              </div>
              <div className="stat-icon warning">⚠</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Recursos Inativos</div>
                <div className="stat-value">{resourcesInativos}</div>
                <div className="stat-change">Fora de operação</div>
              </div>
              <div className="stat-icon">⏸</div>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{ marginTop: '20px' }}>
          <div className="stat-card info">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Valor Real (Despesas)</div>
                <div className="stat-value">{formatCurrency(totalExpenses)}</div>
                <div className="stat-change">Acumulado</div>
              </div>
              <div className="stat-icon info">💰</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Custo Médio</div>
                <div className="stat-value">{formatCurrency(avgExpensePerResource)}</div>
                <div className="stat-change">Por recurso</div>
              </div>
              <div className="stat-icon">📈</div>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-header">
              <span>Recursos por Produto</span>
              <span className="card-subtitle">Distribuição atual</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6E6E6E' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6E6E6E' }} />
                <Tooltip />
                <Bar dataKey="recursos" fill="#FA6400" name="Recursos" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <span>Distribuição de Despesas</span>
              <span className="card-subtitle">Por produto</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card mt-20">
          <div className="card-header">
            <span>Visão Geral dos Produtos</span>
            <span className="card-subtitle">{products.length} produto(s)</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Descrição</th>
                  <th>Recursos Ativos</th>
                  <th>Total Recursos</th>
                  <th>Despesas Totais</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td><strong>{product.name}</strong></td>
                    <td className="text-muted">{product.description}</td>
                    <td>
                      <span className="badge badge-success">
                        {product.active_resources || 0} ativos
                      </span>
                    </td>
                    <td>{product.total_resources || 0}</td>
                    <td className="font-semibold">
                      {formatCurrency(parseFloat(product.total_expenses || 0))}
                    </td>
                    <td>
                      <span className="badge badge-orange">Em operação</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
