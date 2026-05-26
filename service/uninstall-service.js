// Desinstalador de Serviço Windows
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'TR-GestaoRecursos',
  script: path.resolve(__dirname, '..', 'backend', 'src', 'server.js')
});

svc.on('uninstall', () => {
  console.log('✅ Serviço desinstalado com sucesso!');
});

svc.on('error', (err) => {
  console.error('❌ Erro:', err);
});

console.log('Desinstalando serviço...');
svc.uninstall();
