// ============================================================
// Instalador de Serviço Windows
// Sistema de Gestão de Recursos - Thomson Reuters
// ============================================================
//
// Este script instala o sistema como um Serviço do Windows,
// permitindo que ele rode 24/7 e inicie automaticamente com o SO.
//
// Como usar:
//   1. Abra o Prompt de Comando como Administrador
//   2. Execute: node install-service.js
//
// Para desinstalar: node uninstall-service.js
// ============================================================

const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'TR-GestaoRecursos',
  description: 'Sistema de Gestão de Recursos de Produtos - Thomson Reuters',
  script: path.resolve(__dirname, '..', 'backend', 'src', 'server.js'),
  nodeOptions: [],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ],
  // Reiniciar automaticamente em caso de falha
  wait: 2,
  grow: 0.25,
  maxRetries: 40
});

svc.on('install', () => {
  console.log('✅ Serviço "TR-GestaoRecursos" instalado com sucesso!');
  console.log('   Iniciando serviço...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️  O serviço já está instalado.');
});

svc.on('start', () => {
  console.log('🚀 Serviço iniciado!');
  console.log('   Acesse: http://localhost:5000');
  console.log('   Para gerenciar: services.msc (procure por "TR-GestaoRecursos")');
});

svc.on('error', (err) => {
  console.error('❌ Erro:', err);
});

console.log('Instalando serviço Windows...');
svc.install();
