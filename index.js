if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const { createApp } = require('./app');
const { connection } = require('./mysql-connection');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';

const app = createApp({}, {});
app.listen(port, host);
console.log(`running on http://${host}:${port}`);

connection.connect();
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    if (error) throw error;
    console.log('The solution is: ', results[0].solution);
});

connection.end();
