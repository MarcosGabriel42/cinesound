
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'cinesound',
  user: process.env.DB_USER || 'cinesound_user',
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Erro inesperado no pool do PostgreSQL:', error.message);
});

export default pool;
