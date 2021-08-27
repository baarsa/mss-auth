if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const { createApp } = require('./app');
const { createConnection } = require('./mysql-connection');
const { tokenManager } = require('./token-manager');
const { createRepo } = require('./mysql-repo');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';

async function main() {
    const conn = await createConnection();
    const app = createApp(createRepo(conn), tokenManager);
    app.listen(port, host);
    console.log(`running on http://${host}:${port}`);
}

main();



