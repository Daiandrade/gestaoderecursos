const db = require('../config/database');

class Product {
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static create(productData) {
    return new Promise((resolve, reject) => {
      const { name, description } = productData;
      db.run(
        'INSERT INTO products (name, description) VALUES (?, ?)',
        [name, description],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, description });
        }
      );
    });
  }

  static update(id, productData) {
    return new Promise((resolve, reject) => {
      const { name, description } = productData;
      db.run(
        'UPDATE products SET name = ?, description = ? WHERE id = ?',
        [name, description, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, updated: this.changes > 0 });
        }
      );
    });
  }

  static getWithStats(productId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT
          p.*,
          COUNT(DISTINCT r.id) as total_resources,
          COUNT(DISTINCT CASE WHEN r.status = 'active' THEN r.id END) as active_resources,
          COALESCE(SUM(e.amount), 0) as total_expenses
        FROM products p
        LEFT JOIN resources r ON p.id = r.product_id
        LEFT JOIN expenses e ON r.id = e.resource_id
      `;

      const params = [];
      if (productId) {
        query += ' WHERE p.id = ?';
        params.push(productId);
      }

      query += ' GROUP BY p.id ORDER BY p.name';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Product;
