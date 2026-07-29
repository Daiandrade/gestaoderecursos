import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsService } from '../services/productsService';
import { resourcesService } from '../services/resourcesService';
import { exportPDF, exportExcel } from '../utils/reportExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#FA6400', '#1A1B27', '#0052CC', '#00875A'];

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile, isAdmin } = useAuth();

  useEffect(() => {
    loadData();

    // Realtime: atualiza quando produtos, recursos ou despesas mudam
    const unsubProducts = productsService.subscribe(() => loadData());
    const unsubResources = resourcesService.subscribe(() => loadData());

    return () => {
      unsubProducts?.();
      unsubResources?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Buscar todos os produtos e recursos
      const [allProducts, allResources] = await Promise.all([
        productsService.getAll(),
        resourcesService.getAll()
      ]);

      // Filtrar se não for admin
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
  const totalPlanned = resources.reduce((sum, r) => sum + parseFloat(r.planned_value || 0), 0);
  const avgExpensePerResource = totalResources > 0 ? totalExpenses / totalResources : 0;

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

  const buildReportSections = () => ({
    title: 'Dashboard Gerencial',
    subtitle: isAdmin()
      ? 'Visão consolidada de todos os produtos e recursos'
      : `Gerenciando: ${products[0]?.name || 'Nenhum produto atribuído'}`,
    sections: [
      {
        heading: 'Resumo Geral',
        columns: ['Indicador', 'Valor'],
        rows: [
          ['Produtos', String(totalProducts)],
          ['Recursos Ativos', String(resourcesAtivos)],
          ['Recursos Urgentes', String(resourcesUrgentes)],
          ['Recursos Inativos', String(resourcesInativos)],
          ['Valor Planejado', formatCurrency(totalPlanned)],
          ['Valor Real (Despesas)', formatCurrency(totalExpenses)],
          ['Variação', totalPlanned > 0 ? `${((totalExpenses / totalPlanned) * 100).toFixed(1)}%` : '-'],
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

        <div className="stats-grid">
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
                <div className="stat-label">Valor Planejado</div>
                <div className="stat-value">{formatCurrency(totalPlanned)}</div>
                <div className="stat-change">Total estimado</div>
              </div>
              <div className="stat-icon info">📋</div>
            </div>
          </div>

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
                <div className="stat-label">Variação</div>
                <div className="stat-value" style={{
                  color: totalExpenses > totalPlanned ? '#dc3545' : '#28a745',
                  fontSize: totalPlanned > 0 ? '1.5rem' : '2rem'
                }}>
                  {totalPlanned > 0
                    ? `${((totalExpenses / totalPlanned) * 100).toFixed(1)}%`
                    : '-'}
                </div>
                <div className="stat-change">
                  {totalPlanned > 0 && totalExpenses > totalPlanned && 'Acima do planejado'}
                  {totalPlanned > 0 && totalExpenses <= totalPlanned && 'Dentro do planejado'}
                  {totalPlanned === 0 && 'Sem planejamento'}
                </div>
              </div>
              <div className="stat-icon">📊</div>
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

        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <span>Recursos por Status</span>
            <span className="card-subtitle">Distribuição atual dos {totalResources} recursos</span>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', border: '1px solid #c3e6cb' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: '#155724', marginBottom: '8px' }}>
                    {resourcesAtivos}
                  </div>
                  <div style={{ fontSize: '14px', color: '#155724', fontWeight: 600 }}>RECURSOS ATIVOS</div>
                  <div style={{ fontSize: '12px', color: '#155724', marginTop: '4px' }}>
                    {totalResources > 0 ? `${((resourcesAtivos / totalResources) * 100).toFixed(0)}% do total` : '0%'}
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)', border: '1px solid #ffe69c' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: '#856404', marginBottom: '8px' }}>
                    {resourcesUrgentes}
                  </div>
                  <div style={{ fontSize: '14px', color: '#856404', fontWeight: 600 }}>RECURSOS URGENTES</div>
                  <div style={{ fontSize: '12px', color: '#856404', marginTop: '4px' }}>
                    {totalResources > 0 ? `${((resourcesUrgentes / totalResources) * 100).toFixed(0)}% do total` : '0%'}
                  </div>
                </div>
              </div>

              <div className="card" style={{ background: 'linear-gradient(135deg, #e2e3e5 0%, #d6d8db 100%)', border: '1px solid #d6d8db' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', fontWeight: 700, color: '#383d41', marginBottom: '8px' }}>
                    {resourcesInativos}
                  </div>
                  <div style={{ fontSize: '14px', color: '#383d41', fontWeight: 600 }}>RECURSOS INATIVOS</div>
                  <div style={{ fontSize: '12px', color: '#383d41', marginTop: '4px' }}>
                    {totalResources > 0 ? `${((resourcesInativos / totalResources) * 100).toFixed(0)}% do total` : '0%'}
                  </div>
                </div>
              </div>
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
