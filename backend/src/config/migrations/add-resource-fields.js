const db = require('../database');

/**
 * Migração: Adicionar campos de status expandido, período de alocação e valores
 * - Adiciona novos status: ativo, urgente, inativo
 * - Adiciona start_date e end_date para período de alocação
 * - Adiciona planned_value (valor planejado) e actual_value será calculado das despesas
 */
const migrate = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Criar tabela temporária com a nova estrutura
      db.run(`
        CREATE TABLE IF NOT EXISTS resources_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          product_id INTEGER NOT NULL,
          job_title TEXT NOT NULL,
          job_description TEXT,
          allocation_percentage INTEGER DEFAULT 100,
          status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo', 'urgente', 'inativo')),
          start_date DATE,
          end_date DATE,
          planned_value DECIMAL(10, 2) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `, (err) => {
        if (err) {
          console.error('Erro ao criar tabela temporária:', err);
          reject(err);
          return;
        }

        // 2. Copiar dados existentes, convertendo status
        db.run(`
          INSERT INTO resources_new (
            id, name, product_id, job_title, job_description,
            allocation_percentage, status, planned_value,
            created_at, updated_at
          )
          SELECT
            id, name, product_id, job_title, job_description,
            allocation_percentage,
            CASE
              WHEN status = 'active' THEN 'ativo'
              WHEN status = 'inactive' THEN 'inativo'
              ELSE 'ativo'
            END as status,
            0 as planned_value,
            created_at, updated_at
          FROM resources
        `, (err) => {
          if (err) {
            console.error('Erro ao copiar dados:', err);
            reject(err);
            return;
          }

          // 3. Remover tabela antiga
          db.run('DROP TABLE resources', (err) => {
            if (err) {
              console.error('Erro ao remover tabela antiga:', err);
              reject(err);
              return;
            }

            // 4. Renomear tabela nova
            db.run('ALTER TABLE resources_new RENAME TO resources', (err) => {
              if (err) {
                console.error('Erro ao renomear tabela:', err);
                reject(err);
                return;
              }

              console.log('✓ Migração concluída com sucesso!');
              console.log('  - Novos status: ativo, urgente, inativo');
              console.log('  - Campos adicionados: start_date, end_date, planned_value');
              resolve();
            });
          });
        });
      });
    });
  });
};

// Executar se chamado diretamente
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('\nMigração finalizada!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Erro na migração:', err);
      process.exit(1);
    });
}

module.exports = { migrate };
