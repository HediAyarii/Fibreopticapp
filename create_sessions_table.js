const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) NOT NULL,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)');
    console.log('✅ Table user_sessions créée avec succès');
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  } finally {
    await pool.end();
  }
}

main();
