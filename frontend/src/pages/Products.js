import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { productsService } from '../services/productsService';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const { profile, isAdmin } = useAuth();

  useEffect(() => {
    loadProducts();
    const unsub = productsService.subscribe(() => loadProducts());
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProducts = async () => {
    try {
      const filter = profile?.role === 'admin' ? null : profile?.product_id;
      const data = await productsService.getAll(filter);
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      alert('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productsService.update(editingProduct.id, formData);
      } else {
        await productsService.create(formData);
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '' });
      loadProducts();
    } catch (error) {
      alert(error.message || 'Erro ao salvar produto');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, description: product.description || '' });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) return <div className="loading">Carregando produtos...</div>;

  return (
    <div className="main-content">
      <div className="container">
        <div className="page-header">
          <div className="page-title-section">
            <h1>Produtos</h1>
            <p className="page-subtitle">Gestão e acompanhamento dos produtos sob responsabilidade</p>
          </div>
          {isAdmin() && (
            <button onClick={handleAdd} className="btn-primary">+ Novo Produto</button>
          )}
        </div>

        <div className="grid grid-2">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-card-header">
                <div className="product-card-title">{product.name}</div>
                <div className="product-card-description">{product.description}</div>
              </div>

              <div className="product-card-body">
                <div className="product-stats">
                  <div className="product-stat">
                    <div className="product-stat-label">Total</div>
                    <div className="product-stat-value">{product.total_resources || 0}</div>
                  </div>
                  <div className="product-stat">
                    <div className="product-stat-label">Ativos</div>
                    <div className="product-stat-value success">{product.active_resources || 0}</div>
                  </div>
                  <div className="product-stat">
                    <div className="product-stat-label">Despesas</div>
                    <div className="product-stat-value-sm">
                      {formatCurrency(parseFloat(product.total_expenses || 0))}
                    </div>
                  </div>
                </div>

                {isAdmin() && (
                  <button onClick={() => handleEdit(product)} className="btn-secondary btn-small">
                    Editar Produto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div>
                    <label>Nome do Produto *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label>Descrição</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">Salvar Produto</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
