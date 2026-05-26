const express = require('express');
const Expense = require('../models/Expense');
const Resource = require('../models/Resource');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Listar despesas por recurso
router.get('/resource/:resourceId', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.product_id !== resource.product_id) {
      return res.status(403).json({ error: 'Sem permissão para acessar estas despesas' });
    }

    const expenses = await Expense.getByResource(req.params.resourceId);
    res.json(expenses);
  } catch (error) {
    console.error('Erro ao listar despesas:', error);
    res.status(500).json({ error: 'Erro ao listar despesas' });
  }
});

// Listar despesas por produto
router.get('/product/:productId', async (req, res) => {
  try {
    // Verificar permissão
    const productId = parseInt(req.params.productId);
    if (req.user.role !== 'admin' && req.user.product_id !== productId) {
      return res.status(403).json({ error: 'Sem permissão para acessar estas despesas' });
    }

    const year = req.query.year ? parseInt(req.query.year) : null;
    const expenses = await Expense.getByProduct(productId, year);
    res.json(expenses);
  } catch (error) {
    console.error('Erro ao listar despesas:', error);
    res.status(500).json({ error: 'Erro ao listar despesas' });
  }
});

// Totais mensais por produto
router.get('/product/:productId/monthly/:year', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.product_id !== productId) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const totals = await Expense.getMonthlyTotals(productId, req.params.year);
    res.json(totals);
  } catch (error) {
    console.error('Erro ao buscar totais mensais:', error);
    res.status(500).json({ error: 'Erro ao buscar totais mensais' });
  }
});

// Comparação anual por produto
router.get('/product/:productId/yearly', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.product_id !== productId) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const comparison = await Expense.getYearlyComparison(productId);
    res.json(comparison);
  } catch (error) {
    console.error('Erro ao buscar comparação anual:', error);
    res.status(500).json({ error: 'Erro ao buscar comparação anual' });
  }
});

// Criar despesa
router.post('/', async (req, res) => {
  try {
    const resource = await Resource.findById(req.body.resource_id);

    if (!resource) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    // Verificar permissão
    if (req.user.role !== 'admin' && req.user.product_id !== resource.product_id) {
      return res.status(403).json({ error: 'Sem permissão para criar despesa neste recurso' });
    }

    const expense = await Expense.create(req.body, req.user.id);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Já existe uma despesa para este recurso neste mês/ano' });
    }
    res.status(500).json({ error: 'Erro ao criar despesa' });
  }
});

// Atualizar despesa
router.put('/:id', async (req, res) => {
  try {
    const result = await Expense.update(req.params.id, req.body, req.user.id);
    if (result.updated) {
      res.json({ message: 'Despesa atualizada com sucesso' });
    } else {
      res.status(404).json({ error: 'Despesa não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
});

// Deletar despesa
router.delete('/:id', async (req, res) => {
  try {
    const result = await Expense.delete(req.params.id);
    if (result.deleted) {
      res.json({ message: 'Despesa deletada com sucesso' });
    } else {
      res.status(404).json({ error: 'Despesa não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ error: 'Erro ao deletar despesa' });
  }
});

// Histórico de alterações
router.get('/:id/history', async (req, res) => {
  try {
    const history = await Expense.getHistory(req.params.id);
    res.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

module.exports = router;
