const mysql = require('mysql');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tsg_db_v2',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Handle pool errors
pool.on('error', (err) =>
{
    console.error('Unexpected error on idle client', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST')
    {
        console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR')
    {
        console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED')
    {
        console.error('Database connection was refused.');
    }
});

// Test pool connection
pool.getConnection((err, connection) =>
{
    if (err)
    {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to TSG Database');
    connection.release();
});

module.exports = pool;