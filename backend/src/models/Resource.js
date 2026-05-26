const db = require('../config/database');

class Resource {
  static create(resourceData) {
    return new Promise((resolve, reject) => {
      const { name, product_id, job_title, job_description, allocation_percentage } = resourceData;

      db.run(
        `INSERT INTO resources (name, product_id, job_title, job_description, allocation_percentage)
         VALUES (?, ?, ?, ?, ?)`,
        [name, product_id, job_title, job_description, allocation_percentage || 100],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...resourceData });
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT r.*, p.name as product_name
         FROM resources r
         JOIN products p ON r.product_id = p.id
         WHERE r.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static getByProduct(productId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, p.name as product_name
         FROM resources r
         JOIN products p ON r.product_id = p.id
         WHERE r.product_id = ?
         ORDER BY r.name`,
        [productId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, p.name as product_name
         FROM resources r
         JOIN products p ON r.product_id = p.id
         ORDER BY p.name, r.name`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static update(id, resourceData) {
    return new Promise((resolve, reject) => {
      const { name, job_title, job_description, allocation_percentage, status } = resourceData;

      db.run(
        `UPDATE resources
         SET name = ?, job_title = ?, job_description = ?, allocation_percentage = ?,
             status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, job_title, job_description, allocation_percentage, status, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, updated: this.changes > 0 });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Buscar IDs das despesas para limpar histórico
        db.all('SELECT id FROM expenses WHERE resource_id = ?', [id], (err, expenses) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }

          const expenseIds = expenses.map(e => e.id);

          // Apagar histórico das despesas
          if (expenseIds.length > 0) {
            const placeholders = expenseIds.map(() => '?').join(',');
            db.run(
              `DELETE FROM history WHERE table_name = 'expenses' AND record_id IN (${placeholders})`,
              expenseIds,
              (histErr) => {
                if (histErr) {
                  db.run('ROLLBACK');
                  return reject(histErr);
                }
              }
            );
          }

          // Apagar despesas do recurso
          db.run('DELETE FROM expenses WHERE resource_id = ?', [id], (expErr) => {
            if (expErr) {
              db.run('ROLLBACK');
              return reject(expErr);
            }

            // Apagar o recurso
            db.run('DELETE FROM resources WHERE id = ?', [id], function(resErr) {
              if (resErr) {
                db.run('ROLLBACK');
                return reject(resErr);
              }

              db.run('COMMIT', (commitErr) => {
                if (commitErr) return reject(commitErr);
                resolve({ deleted: this.changes > 0 });
              });
            });
          });
        });
      });
    });
  }

  static getWithExpenses(productId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT
          r.*,
          p.name as product_name,
          COALESCE(SUM(e.amount), 0) as total_expenses,
          COUNT(e.id) as expense_count
        FROM resources r
        JOIN products p ON r.product_id = p.id
        LEFT JOIN expenses e ON r.id = e.resource_id
      `;

      const params = [];
      if (productId) {
        query += ' WHERE r.product_id = ?';
        params.push(productId);
      }

      query += ' GROUP BY r.id ORDER BY p.name, r.name';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Resource;
