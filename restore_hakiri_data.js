const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

(async () => {
  try {
    // First check column names
    const cols = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'cout_par_salaire'
    `);
    console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));
    
    // Update ID=291 with the real data from the deleted ID=278
    const result = await pool.query(`
      UPDATE cout_par_salaire 
      SET 
        salaire_net = 861.90,
        salaire_brut = 1069.71,
        cout_total = 1160.65,
        charge = 298.75,
        taxe = 149.38,
        impot = 298.75,
        prime = 540.00,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 291
      RETURNING *
    `);
    
    console.log('✅ Updated ID=291 with correct data from deleted ID=278:');
    console.log('  salaire_net:', result.rows[0].salaire_net);
    console.log('  salaire_brut:', result.rows[0].salaire_brut);
    console.log('  prime:', result.rows[0].prime);
    console.log('  penalite:', result.rows[0].penalite);
    console.log('  employe_id:', result.rows[0].employe_id);
    
  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
