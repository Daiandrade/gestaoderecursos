import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsService } from '../services/productsService';
import { resourcesService } from '../services/resourcesService';
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
      const productFilter = profile?.role === 'admin' ? null : profile?.product_id;
      const [productsData, resourcesData] = await Promise.all([
        productsService.getAll(productFilter),
        resourcesService.getAll(productFilter)
      ]);

      setProducts(productsData);
      setResources(resourcesData);
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
  const totalResources = resources.filter(r => r.status === 'active').length;
  const totalExpenses = resources.reduce((sum, r) => sum + parseFloat(r.total_expenses || 0), 0);
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
                <div className="stat-value">{totalResources}</div>
                <div className="stat-change positive">Profissionais alocados</div>
              </div>
              <div className="stat-icon success">👥</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Despesas Totais</div>
                <div className="stat-value">{formatCurrency(totalExpenses)}</div>
                <div className="stat-change">Acumulado</div>
              </div>
              <div className="stat-icon info">💰</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-card-header">
              <div>
                <div className="stat-label">Custo Médio</div>
                <div className="stat-value">{formatCurrency(avgExpensePerResource)}</div>
                <div className="stat-change">Por recurso</div>
              </div>
              <div className="stat-icon warning">📈</div>
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
