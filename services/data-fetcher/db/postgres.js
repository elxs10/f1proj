import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: 5432,
    database: process.env.POSTGRES_DB || 'f1_app',
    user: process.env.POSTGRES_USER || 'kunju',
    password: process.env.POSTGRES_PASSWORD || '',

});

pool.on('connect', () => console.log('[Postgres] Connected to database'));
pool.on('error', (err) => console.error('[Postgres] Error:', err));

export default pool;