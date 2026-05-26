const db = require('../config/database');

class Expense {
  static create(expenseData, userId) {
    return new Promise((resolve, reject) => {
      const { resource_id, month, year, amount, description } = expenseData;

      db.run(
        `INSERT INTO expenses (resource_id, month, year, amount, description, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [resource_id, month, year, amount, description, userId],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...expenseData });
        }
      );
    });
  }

  static update(id, expenseData, userId) {
    return new Promise((resolve, reject) => {
      const { amount, description } = expenseData;

      // Primeiro, buscar o valor antigo para o histórico
      db.get('SELECT * FROM expenses WHERE id = ?', [id], (err, oldExpense) => {
        if (err) {
          reject(err);
          return;
        }

        db.run(
          'UPDATE expenses SET amount = ?, description = ? WHERE id = ?',
          [amount, description, id],
          function(updateErr) {
            if (updateErr) {
              reject(updateErr);
            } else {
              // Registrar no histórico
              db.run(
                `INSERT INTO history (table_name, record_id, action, old_values, new_values, changed_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  'expenses',
                  id,
                  'update',
                  JSON.stringify({ amount: oldExpense.amount, description: oldExpense.description }),
                  JSON.stringify({ amount, description }),
                  userId
                ]
              );

              resolve({ id, updated: this.changes > 0 });
            }
          }
        );
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM expenses WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }

  static getByResource(resourceId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT e.*, r.name as resource_name, u.username as created_by_name
         FROM expenses e
         JOIN resources r ON e.resource_id = r.id
         LEFT JOIN users u ON e.created_by = u.id
         WHERE e.resource_id = ?
         ORDER BY e.year DESC, e.month DESC`,
        [resourceId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getByProduct(productId, year = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT e.*, r.name as resource_name, r.product_id, p.name as product_name
        FROM expenses e
        JOIN resources r ON e.resource_id = r.id
        JOIN products p ON r.product_id = p.id
        WHERE r.product_id = ?
      `;

      const params = [productId];
      if (year) {
        query += ' AND e.year = ?';
        params.push(year);
      }

      query += ' ORDER BY e.year DESC, e.month DESC';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getMonthlyTotals(productId, year) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
          e.month,
          e.year,
          SUM(e.amount) as total,
          COUNT(e.id) as expense_count
         FROM expenses e
         JOIN resources r ON e.resource_id = r.id
         WHERE r.product_id = ? AND e.year = ?
         GROUP BY e.month, e.year
         ORDER BY e.month`,
        [productId, year],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getHistory(expenseId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT h.*, u.username as changed_by_name
         FROM history h
         LEFT JOIN users u ON h.changed_by = u.id
         WHERE h.table_name = 'expenses' AND h.record_id = ?
         ORDER BY h.changed_at DESC`,
        [expenseId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getYearlyComparison(productId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
          e.year,
          SUM(e.amount) as total_amount,
          COUNT(DISTINCT e.resource_id) as resource_count,
          COUNT(e.id) as expense_count
         FROM expenses e
         JOIN resources r ON e.resource_id = r.id
         WHERE r.product_id = ?
         GROUP BY e.year
         ORDER BY e.year DESC`,
        [productId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = Expense;
