const {
    MYSQL_HOST,
    MYSQL_DB,
    MYSQL_USERNAME,
    MYSQL_PASSWORD,
} = process.env;

const mysql = require('mysql2/promise');
const createConnection = async () => mysql.createConnection({
    host     : MYSQL_HOST,
    user     : MYSQL_USERNAME,
    password : MYSQL_PASSWORD,
    database : MYSQL_DB
});

module.exports = { createConnection };
