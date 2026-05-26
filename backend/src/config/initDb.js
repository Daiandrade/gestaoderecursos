const db = require('./database');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de Produtos
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de Usuários
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'product_manager')),
          product_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);

      // Tabela de Recursos (Pessoas/Profissionais)
      db.run(`
        CREATE TABLE IF NOT EXISTS resources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          product_id INTEGER NOT NULL,
          job_title TEXT NOT NULL,
          job_description TEXT,
          allocation_percentage INTEGER DEFAULT 100,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `);

      // Tabela de Despesas Mensais
      db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resource_id INTEGER NOT NULL,
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_by INTEGER,
          FOREIGN KEY (resource_id) REFERENCES resources(id),
          FOREIGN KEY (created_by) REFERENCES users(id),
          UNIQUE(resource_id, month, year)
        )
      `);

      // Tabela de Histórico de Alterações
      db.run(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          record_id INTEGER NOT NULL,
          action TEXT NOT NULL CHECK(action IN ('create', 'update', 'delete')),
          old_values TEXT,
          new_values TEXT,
          changed_by INTEGER,
          changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (changed_by) REFERENCES users(id)
        )
      `);

      // Inserir produtos padrão
      const products = [
        { name: 'Tax One', description: 'Sistema Tax One' },
        { name: 'Tax One For SAP', description: 'Tax One integrado com SAP' },
        { name: 'Integrações-OBI', description: 'Integrações OBI' },
        { name: 'DF-e', description: 'Sistema DF-e' }
      ];

      const insertProduct = db.prepare('INSERT OR IGNORE INTO products (name, description) VALUES (?, ?)');
      products.forEach(product => {
        insertProduct.run(product.name, product.description);
      });
      insertProduct.finalize();

      // Criar usuário admin padrão
      const adminPassword = bcrypt.hashSync('admin123', 10);
      db.run(
        'INSERT OR IGNORE INTO users (username, email, password, role, product_id) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', adminPassword, 'admin', null],
        (err) => {
          if (err) {
            console.error('Erro ao criar usuário admin:', err.message);
            reject(err);
          } else {
            console.log('Banco de dados inicializado com sucesso!');
            console.log('Usuário admin criado:');
            console.log('  Username: admin');
            console.log('  Password: admin123');
            console.log('\nProdutos criados:');
            products.forEach(p => console.log(`  - ${p.name}`));
            resolve();
          }
        }
      );
    });
  });
};

// Executar se chamado diretamente
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('\nInicialização concluída!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro na inicialização:', err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
