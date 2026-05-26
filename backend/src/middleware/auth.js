const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }
  next();
};

const checkProductAccess = (req, res, next) => {
  const productId = parseInt(req.params.productId || req.body.product_id);

  // Admin pode acessar tudo
  if (req.user.role === 'admin') {
    return next();
  }

  // Product manager só pode acessar seu próprio produto
  if (req.user.role === 'product_manager' && req.user.product_id === productId) {
    return next();
  }

  return res.status(403).json({ error: 'Você não tem permissão para acessar este produto.' });
};

module.exports = { authMiddleware, adminOnly, checkProductAccess };
