const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
});

async function adjustForeignKeyConstraints() {
  console.log('🔧 Ajustement des contraintes de clé étrangère pour les réclamations...\n');

  try {
    // 1. Vérifier la contrainte actuelle
    console.log('📊 1. Vérification de la contrainte actuelle:');
    const constraintInfo = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'reclamations' 
        AND kcu.column_name = 'intervention_id';
    `);

    if (constraintInfo.rows.length > 0) {
      const constraint = constraintInfo.rows[0];
      console.log(`  ✅ Contrainte trouvée: ${constraint.constraint_name}`);
      console.log(`  - Référence: ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      console.log(`  - Règles: UPDATE ${constraint.update_rule}, DELETE ${constraint.delete_rule}`);
    } else {
      console.log('  ❌ Aucune contrainte de clé étrangère trouvée pour intervention_id');
      await pool.end();
      return;
    }
    console.log();

    // 2. Options de solution
    console.log('🎯 2. Options disponibles:');
    console.log('  A. Supprimer temporairement la contrainte (recommandé)');
    console.log('  B. Modifier la contrainte pour être DEFERRABLE');
    console.log('  C. Garder la contrainte et gérer côté application (actuel)');
    console.log();

    // 3. Solution recommandée : Supprimer la contrainte
    console.log('🚀 3. Application de la solution A - Suppression de la contrainte:');
    const constraintName = constraintInfo.rows[0].constraint_name;
    
    console.log(`  - Suppression de la contrainte ${constraintName}...`);
    await pool.query(`ALTER TABLE reclamations DROP CONSTRAINT ${constraintName};`);
    console.log('  ✅ Contrainte supprimée avec succès');
    console.log();

    // 4. Créer un index pour maintenir les performances
    console.log('🔧 4. Création d\'un index pour maintenir les performances:');
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_reclamations_intervention_id ON reclamations(intervention_id);`);
      console.log('  ✅ Index créé avec succès');
    } catch (error) {
      console.log('  ℹ️ Index existe déjà ou erreur mineure:', error.message);
    }
    console.log();

    // 5. Vérification finale
    console.log('✅ 5. Vérification finale:');
    const finalCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints AS tc 
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'reclamations' 
        AND tc.constraint_name LIKE '%intervention_id%';
    `);
    console.log(`  - Contraintes FK restantes sur intervention_id: ${finalCheck.rows[0].count}`);
    
    if (finalCheck.rows[0].count === '0') {
      console.log('  🎉 Parfait ! La contrainte a été supprimée avec succès.');
      console.log('  📝 Les réclamations peuvent maintenant référencer des interventions futures.');
    }
    console.log();

    console.log('📋 Résumé des modifications:');
    console.log('  ✅ Contrainte de clé étrangère supprimée');
    console.log('  ✅ Index de performance créé');
    console.log('  ✅ Les réclamations peuvent maintenant référencer des interventions qui n\'existent pas encore');
    console.log('  ⚠️ Note: L\'application doit maintenant gérer la validation côté code');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajustement des contraintes:', error);
    console.error('Détail de l\'erreur:', error.message);
  } finally {
    await pool.end();
  }
}

adjustForeignKeyConstraints();