import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'f1_app',
    user: 'kunju',
    password: '',

});

pool.on('connect', () => console.log('[Postgres] Connected to database'));
pool.on('error', (err) => console.error('[Postgres] Error:', err));

export default pool;