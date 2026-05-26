const express = require('express');
const Resource = require('../models/Resource');
const { authMiddleware, checkProductAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Listar recursos
router.get('/', async (req, res) => {
  try {
    let resources;

    if (req.user.role === 'admin') {
      resources = await Resource.getWithExpenses();
    } else {
      resources = await Resource.getWithExpenses(req.user.product_id);
    }

    res.json(resources);
  } catch (error) {
    console.error('Erro ao listar recursos:', error);
    res.status(500).json({ error: 'Erro ao listar recursos' });
  }
});

// Listar recursos por produto
router.get('/product/:productId', checkProductAccess, async (req, res) => {
  try {
    const resources = await Resource.getByProduct(req.params.productId);
    res.json(resources);
  } catch (error) {
    console.error('Erro ao listar recursos:', error);
    res.status(500).json({ error: 'Erro ao listar recursos' });
  }
});

// Buscar recurso por ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.product_id !== resource.product_id) {
      return res.status(403).json({ error: 'Sem permissão para acessar este recurso' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Erro ao buscar recurso:', error);
    res.status(500).json({ error: 'Erro ao buscar recurso' });
  }
});

// Criar recurso
router.post('/', async (req, res) => {
  try {
    // Verificar se o usuário pode criar recurso para este produto
    if (req.user.role !== 'admin' && req.user.product_id !== req.body.product_id) {
      return res.status(403).json({ error: 'Sem permissão para criar recurso neste produto' });
    }

    const resource = await Resource.create(req.body);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Erro ao criar recurso:', error);
    res.status(500).json({ error: 'Erro ao criar recurso' });
  }
});

// Atualizar recurso
router.put('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.product_id !== resource.product_id) {
      return res.status(403).json({ error: 'Sem permissão para atualizar este recurso' });
    }

    const result = await Resource.update(req.params.id, req.body);
    const updatedResource = await Resource.findById(req.params.id);
    res.json(updatedResource);
  } catch (error) {
    console.error('Erro ao atualizar recurso:', error);
    res.status(500).json({ error: 'Erro ao atualizar recurso' });
  }
});

// Deletar recurso (e todas as despesas/histórico associados)
router.delete('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.product_id !== resource.product_id) {
      return res.status(403).json({ error: 'Sem permissão para deletar este recurso' });
    }

    await Resource.delete(req.params.id);
    res.json({ message: 'Recurso e dados associados deletados com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar recurso:', error);
    res.status(500).json({ error: error.message || 'Erro ao deletar recurso' });
  }
});

module.exports = router;
