require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/initDb');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const resourceRoutes = require('./routes/resources');
const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Validação de segurança em produção
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('❌ ERRO: JWT_SECRET ausente ou muito curto para produção (mínimo 32 caracteres).');
  console.error('   Configure no arquivo .env antes de iniciar em produção.');
  process.exit(1);
}

// Middleware de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// CORS - em produção restrito, em dev liberado
app.use(cors({
  origin: isProduction ? (process.env.ALLOWED_ORIGINS?.split(',') || true) : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Logs em produção
if (isProduction) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/expenses', expenseRoutes);

// Rota de saúde
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Em produção, servir o build do React
if (isProduction) {
  const buildPath = path.join(__dirname, '../../frontend/build');
  app.use(express.static(buildPath));

  // SPA - todas as rotas não-API retornam o index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: isProduction ? 'Erro interno do servidor' : err.message
  });
});

// Inicializar
const startServer = async () => {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 Sistema de Gestão de Recursos - Thomson Reuters`);
      console.log('='.repeat(60));
      console.log(`📦 Modo:        ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
      console.log(`🌐 Servidor:    http://localhost:${PORT}`);
      console.log(`📊 API:         http://localhost:${PORT}/api`);
      if (!isProduction) {
        console.log(`💻 Frontend:    http://localhost:3000 (dev server)`);
      }
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de shutdown gracioso
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nRecebido SIGINT, encerrando...');
  process.exit(0);
});

startServer();

module.exports = app;
