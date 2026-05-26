const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Todas as rotas requerem autenticação e privilégios de admin
router.use(authMiddleware);
router.use(adminOnly);

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Criar novo usuário
router.post(
  '/',
  [
    body('username').notEmpty().withMessage('Username é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('role').isIn(['admin', 'product_manager']).withMessage('Role inválido')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username ou email já existe' });
      }
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }
);

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const result = await User.update(req.params.id, req.body);
    if (result.updated) {
      const user = await User.findById(req.params.id);
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const result = await User.delete(req.params.id);
    if (result.deleted) {
      res.json({ message: 'Usuário deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

module.exports = router;
