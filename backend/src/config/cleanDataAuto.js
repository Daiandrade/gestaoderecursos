const db = require('./database');

const cleanDataAuto = () => {
  console.log('🧹 Limpando dados fictícios...\n');

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run('DELETE FROM history', function(err) {
        if (err) { db.run('ROLLBACK'); return reject(err); }
        console.log(`✓ ${this.changes} registro(s) de histórico removido(s)`);
      });

      db.run('DELETE FROM expenses', function(err) {
        if (err) { db.run('ROLLBACK'); return reject(err); }
        console.log(`✓ ${this.changes} despesa(s) removida(s)`);
      });

      db.run('DELETE FROM resources', function(err) {
        if (err) { db.run('ROLLBACK'); return reject(err); }
        console.log(`✓ ${this.changes} recurso(s) removido(s)`);
      });

      db.run("DELETE FROM users WHERE role != 'admin'", function(err) {
        if (err) { db.run('ROLLBACK'); return reject(err); }
        console.log(`✓ ${this.changes} usuário(s) gerente(s) removido(s)`);
      });

      db.run("DELETE FROM sqlite_sequence WHERE name IN ('resources', 'expenses', 'history')", (err) => {
        if (err) { db.run('ROLLBACK'); return reject(err); }
      });

      db.run('COMMIT', (err) => {
        if (err) return reject(err);

        db.all('SELECT * FROM products ORDER BY name', (err1, products) => {
          if (err1) return reject(err1);

          db.all('SELECT username, email, role FROM users', (err2, users) => {
            if (err2) return reject(err2);

            console.log('\n✅ Limpeza concluída!\n');
            console.log('📦 Produtos mantidos:');
            products.forEach(p => console.log(`   • ${p.name}`));
            console.log('\n👤 Usuários mantidos:');
            users.forEach(u => console.log(`   • ${u.username} (${u.role})`));
            console.log('\n🚀 Sistema pronto para produção!');

            resolve();
          });
        });
      });
    });
  });
};

cleanDataAuto()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });
