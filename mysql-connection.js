const {
    MYSQL_HOST,
    MYSQL_DB,
    MYSQL_USERNAME,
    MYSQL_PASSWORD,
} = process.env;

const mysql = require('mysql2/promise');
const createConnection = async () => mysql.createPool({
    host     : MYSQL_HOST || 'mysql',
    user     : MYSQL_USERNAME,
    password : MYSQL_PASSWORD,
    database : MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = { createConnection };
