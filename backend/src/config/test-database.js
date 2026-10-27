
import 'dotenv/config';
import pool from './database.js';

try {
  const result = await pool.query(
    'SELECT current_database() AS database, NOW() AS connected_at',
  );

  console.log('Conexão com PostgreSQL estabelecida!');
  console.log('Banco:', result.rows[0].database);
} catch (error) {
  console.error('Falha na conexão com PostgreSQL:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
