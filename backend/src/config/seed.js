const db = require('./database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  console.log('Populando banco de dados com dados de exemplo...\n');

  try {
    // Buscar produtos
    const products = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM products', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`✓ ${products.length} produtos encontrados`);

    // Criar usuários gerentes de produto
    const managers = [
      { username: 'manager_taxone', email: 'taxone@example.com', password: 'senha123', product: 'Tax One' },
      { username: 'manager_sap', email: 'sap@example.com', password: 'senha123', product: 'Tax One For SAP' },
      { username: 'manager_obi', email: 'obi@example.com', password: 'senha123', product: 'Integrações-OBI' },
      { username: 'manager_dfe', email: 'dfe@example.com', password: 'senha123', product: 'DF-e' }
    ];

    for (const manager of managers) {
      const product = products.find(p => p.name === manager.product);
      const hashedPassword = bcrypt.hashSync(manager.password, 10);

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO users (username, email, password, role, product_id) VALUES (?, ?, ?, ?, ?)',
          [manager.username, manager.email, hashedPassword, 'product_manager', product.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    console.log(`✓ ${managers.length} gerentes de produto criados`);

    // Criar recursos de exemplo
    const sampleResources = [
      // Tax One
      { name: 'João Silva', product: 'Tax One', job_title: 'Desenvolvedor Senior', job_description: 'Desenvolvimento de features core do sistema', allocation: 100 },
      { name: 'Maria Santos', product: 'Tax One', job_title: 'Tech Lead', job_description: 'Liderança técnica e arquitetura', allocation: 80 },
      { name: 'Pedro Oliveira', product: 'Tax One', job_title: 'QA Engineer', job_description: 'Testes e garantia de qualidade', allocation: 100 },

      // Tax One For SAP
      { name: 'Ana Costa', product: 'Tax One For SAP', job_title: 'Desenvolvedor SAP', job_description: 'Integração SAP e ABAP', allocation: 100 },
      { name: 'Carlos Lima', product: 'Tax One For SAP', job_title: 'Consultor SAP', job_description: 'Consultoria e implementação', allocation: 60 },

      // Integrações-OBI
      { name: 'Julia Ferreira', product: 'Integrações-OBI', job_title: 'Engenheiro de Integração', job_description: 'Desenvolvimento de APIs e integrações', allocation: 100 },
      { name: 'Roberto Alves', product: 'Integrações-OBI', job_title: 'DevOps Engineer', job_description: 'Infraestrutura e CI/CD', allocation: 50 },

      // DF-e
      { name: 'Fernanda Rocha', product: 'DF-e', job_title: 'Desenvolvedora Full Stack', job_description: 'Desenvolvimento frontend e backend', allocation: 100 },
      { name: 'Lucas Mendes', product: 'DF-e', job_title: 'Analista de Sistemas', job_description: 'Análise e documentação', allocation: 80 }
    ];

    let resourceCount = 0;
    for (const resource of sampleResources) {
      const product = products.find(p => p.name === resource.product);

      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO resources (name, product_id, job_title, job_description, allocation_percentage, status) VALUES (?, ?, ?, ?, ?, ?)',
          [resource.name, product.id, resource.job_title, resource.job_description, resource.allocation, 'active'],
          (err) => {
            if (err) reject(err);
            else {
              resourceCount++;
              resolve();
            }
          }
        );
      });
    }

    console.log(`✓ ${resourceCount} recursos criados`);

    // Buscar recursos criados
    const resources = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM resources', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Criar despesas de exemplo (últimos 6 meses)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    let expenseCount = 0;
    for (const resource of resources) {
      // Gerar despesas para os últimos 6 meses
      for (let i = 0; i < 6; i++) {
        let month = currentMonth - i;
        let year = currentYear;

        if (month <= 0) {
          month += 12;
          year -= 1;
        }

        // Valor base aleatório entre 8000 e 15000
        const baseAmount = Math.random() * 7000 + 8000;
        const amount = Math.round(baseAmount * (resource.allocation_percentage / 100) * 100) / 100;

        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO expenses (resource_id, month, year, amount, description) VALUES (?, ?, ?, ?, ?)',
            [resource.id, month, year, amount, `Salário + encargos ${month}/${year}`],
            (err) => {
              if (err) reject(err);
              else {
                expenseCount++;
                resolve();
              }
            }
          );
        });
      }
    }

    console.log(`✓ ${expenseCount} despesas criadas`);

    console.log('\n✅ Banco de dados populado com sucesso!');
    console.log('\nCredenciais criadas:');
    console.log('  Admin:');
    console.log('    Username: admin');
    console.log('    Password: admin123');
    console.log('\n  Gerentes de Produto:');
    managers.forEach(m => {
      console.log(`    Username: ${m.username}`);
      console.log(`    Password: senha123`);
      console.log(`    Produto: ${m.product}\n`);
    });

  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  }
};

// Executar se chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Concluído!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
