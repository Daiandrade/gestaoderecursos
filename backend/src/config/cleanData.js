const db = require('./database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

const cleanData = async () => {
  console.log('\n⚠️  ATENÇÃO - LIMPEZA DE DADOS PARA PRODUÇÃO ⚠️\n');
  console.log('Este script irá apagar TODOS os dados fictícios:');
  console.log('  • Todas as despesas');
  console.log('  • Todo o histórico de alterações');
  console.log('  • Todos os recursos cadastrados');
  console.log('  • Todos os usuários gerentes (managers)');
  console.log('\nSerão MANTIDOS:');
  console.log('  • Os 4 produtos (Tax One, Tax One For SAP, Integrações-OBI, DF-e)');
  console.log('  • O usuário admin');
  console.log('\n');

  const answer = await ask('Digite "CONFIRMAR" para prosseguir: ');

  if (answer.trim() !== 'CONFIRMAR') {
    console.log('\n❌ Operação cancelada. Nenhum dado foi alterado.\n');
    rl.close();
    process.exit(0);
  }

  console.log('\n🧹 Iniciando limpeza...\n');

  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 1. Apagar histórico de alterações
        db.run('DELETE FROM history', function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log(`✓ ${this.changes} registro(s) de histórico removido(s)`);
        });

        // 2. Apagar despesas
        db.run('DELETE FROM expenses', function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log(`✓ ${this.changes} despesa(s) removida(s)`);
        });

        // 3. Apagar recursos
        db.run('DELETE FROM resources', function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log(`✓ ${this.changes} recurso(s) removido(s)`);
        });

        // 4. Apagar usuários que não são admin
        db.run("DELETE FROM users WHERE role != 'admin'", function(err) {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log(`✓ ${this.changes} usuário(s) gerente(s) removido(s)`);
        });

        // 5. Resetar sequências de auto-increment para recursos, despesas, histórico
        db.run("DELETE FROM sqlite_sequence WHERE name IN ('resources', 'expenses', 'history')", (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
        });

        db.run('COMMIT', (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    // Verificar estado final
    const products = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM products ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const users = await new Promise((resolve, reject) => {
      db.all('SELECT username, email, role FROM users', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log('\n✅ Limpeza concluída com sucesso!\n');
    console.log('📦 Produtos mantidos:');
    products.forEach(p => console.log(`   • ${p.name}`));
    console.log('\n👤 Usuários mantidos:');
    users.forEach(u => console.log(`   • ${u.username} (${u.role}) - ${u.email}`));
    console.log('\n🚀 Sistema pronto para produção!\n');
    console.log('Próximos passos:');
    console.log('  1. Faça login com o admin');
    console.log('  2. Crie os usuários gerentes reais (página Usuários)');
    console.log('  3. Cadastre os recursos reais de cada produto');
    console.log('  4. Comece a registrar as despesas mensais\n');

  } catch (error) {
    console.error('\n❌ Erro durante a limpeza:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
};

// Executar
cleanData();
