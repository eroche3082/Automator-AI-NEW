import { pool } from '../server/db';

async function main() {
  try {
    const result = await pool.query('SELECT NOW() AS now, current_database() AS database, current_user AS user, version() AS version');
    console.log('✅ Connected to Neon PostgreSQL successfully');
    console.log('📅 Server time:', result.rows[0].now);
    console.log('🗄️  Database:', result.rows[0].database);
    console.log('👤 User:', result.rows[0].user);
    console.log('🚀 Version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Test table existence
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    // Test schema extensions
    const extensionsResult = await pool.query(`
      SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    console.log('🔧 Extensions:', extensionsResult.rows.map(row => row.extname));
    
  } catch (err) {
    console.error('❌ Neon connection error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);