const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'sql12.freesqldatabase.com',
  user: 'sql12771806',
  password: 'zIrKU3ZcQX',
  database: 'sql12771806',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();