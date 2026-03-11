const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

(async () => {
  try {
    // Delete duplicate entries keeping the one with employe_id
    const result = await pool.query(`
      WITH duplicates AS (
        SELECT id, nom, prenom, mois, annee, employe_id,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(nom)), LOWER(TRIM(prenom)), mois, annee 
            ORDER BY employe_id NULLS LAST, id
          ) as rn
        FROM cout_par_salaire
      )
      DELETE FROM cout_par_salaire 
      WHERE id IN (SELECT id FROM duplicates WHERE rn > 1)
      RETURNING id, nom, prenom, mois, annee
    `);
    
    console.log('Deleted duplicates:', result.rows.length);
    result.rows.forEach(r => console.log(`  - ID=${r.id}: ${r.prenom} ${r.nom} (${r.mois}/${r.annee})`));
    
    // Also update entries with null employe_id that have matching employe by name
    const updateResult = await pool.query(`
      UPDATE cout_par_salaire c
      SET employe_id = e.id
      FROM employes e
      WHERE c.employe_id IS NULL
        AND LOWER(TRIM(c.nom)) = LOWER(TRIM(e.nom))
        AND LOWER(TRIM(c.prenom)) = LOWER(TRIM(e.prenom))
      RETURNING c.id, c.nom, c.prenom, e.id as new_employe_id
    `);
    
    console.log('\nUpdated employe_id:', updateResult.rows.length);
    updateResult.rows.forEach(r => console.log(`  - ID=${r.id}: ${r.prenom} ${r.nom} -> employe_id=${r.new_employe_id}`));
    
    // Verify HAKIRI entries
    const verify = await pool.query(`
      SELECT id, nom, prenom, employe_id, mois, annee 
      FROM cout_par_salaire 
      WHERE UPPER(nom) LIKE '%HAKIRI%' 
      ORDER BY annee DESC, mois DESC
    `);
    console.log('\nRemaining HAKIRI entries:');
    verify.rows.forEach(r => console.log(`  ID=${r.id}: ${r.prenom} ${r.nom}, mois=${r.mois}/${r.annee}, employe_id=${r.employe_id}`));
    
  } catch(err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
