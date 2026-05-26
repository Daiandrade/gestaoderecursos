const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static create(userData) {
    return new Promise((resolve, reject) => {
      const { username, email, password, role, product_id } = userData;
      const hashedPassword = bcrypt.hashSync(password, 10);

      db.run(
        'INSERT INTO users (username, email, password, role, product_id) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, role, product_id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, username, email, role, product_id });
          }
        }
      );
    });
  }

  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role, product_id FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT u.id, u.username, u.email, u.role, u.product_id, p.name as product_name
         FROM users u
         LEFT JOIN products p ON u.product_id = p.id`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  static update(id, userData) {
    return new Promise((resolve, reject) => {
      const { username, email, role, product_id } = userData;
      db.run(
        'UPDATE users SET username = ?, email = ?, role = ?, product_id = ? WHERE id = ?',
        [username, email, role, product_id, id],
        function(err) {
          if (err) reject(err);
          else resolve({ id, updated: this.changes > 0 });
        }
      );
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes > 0 });
      });
    });
  }
}

module.exports = User;
