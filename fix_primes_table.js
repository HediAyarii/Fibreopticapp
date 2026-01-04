const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function fixPrimesTable() {
  try {
    console.log('🔧 Correction de la table primes_employes...');
    
    // Ajouter la colonne matricule si elle n'existe pas
    await pool.query(`
      ALTER TABLE primes_employes 
      ADD COLUMN IF NOT EXISTS matricule VARCHAR(50)
    `);
    console.log('✅ Colonne matricule ajoutée');
    
    // Vérifier les colonnes
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'primes_employes'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Structure de la table primes_employes:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Créer les fonctions de calcul si elles n'existent pas
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_total_primes(p_cout_par_salaire_id INTEGER)
      RETURNS DECIMAL AS $$
      BEGIN
        RETURN COALESCE((
          SELECT SUM(montant) 
          FROM primes_employes 
          WHERE cout_par_salaire_id = p_cout_par_salaire_id
        ), 0);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Fonction calculer_total_primes créée');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_total_primes_rap(p_cout_par_salaire_id INTEGER)
      RETURNS DECIMAL AS $$
      BEGIN
        RETURN COALESCE((
          SELECT SUM(montant) 
          FROM primes_employes 
          WHERE cout_par_salaire_id = p_cout_par_salaire_id
            AND deduit_rap = true
        ), 0);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Fonction calculer_total_primes_rap créée');
    
    console.log('\n✅ Table primes_employes corrigée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

fixPrimesTable();
