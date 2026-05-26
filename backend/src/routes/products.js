const express = require('express');
const Product = require('../models/Product');
const { authMiddleware, adminOnly, checkProductAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Listar todos os produtos (com estatísticas)
router.get('/', async (req, res) => {
  try {
    let products;

    if (req.user.role === 'admin') {
      products = await Product.getWithStats();
    } else {
      // Product manager só vê seu produto
      products = await Product.getWithStats(req.user.product_id);
    }

    res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

// Buscar produto por ID
router.get('/:id', checkProductAccess, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// Criar produto (apenas admin)
router.post('/', adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto (apenas admin)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const result = await Product.update(req.params.id, req.body);
    if (result.updated) {
      const product = await Product.findById(req.params.id);
      res.json(product);
    } else {
      res.status(404).json({ error: 'Produto não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

module.exports = router;
