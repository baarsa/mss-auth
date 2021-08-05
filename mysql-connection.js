const {
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_DB,
    MYSQL_USERNAME,
    MYSQL_PASSWORD,
} = process.env;

const mysql = require('mysql');
export const connection = mysql.createConnection({
    host     : MYSQL_HOST,
    user     : MYSQL_USERNAME,
    password : MYSQL_PASSWORD,
    database : MYSQL_DB
});
