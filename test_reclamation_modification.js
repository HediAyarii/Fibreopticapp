const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
});

async function testReclamationModification() {
  console.log('🧪 Test de modification des réclamations avec intervention_id inexistant...\n');

  try {
    // 1. Créer une réclamation de test avec un intervention_id inexistant
    console.log('📝 1. Création d\'une réclamation de test:');
    const createResult = await pool.query(`
      INSERT INTO reclamations (
        numero_reclamation, 
        nom_client, 
        type_reclamation, 
        description_probleme, 
        intervention_id,
        statut,
        priorite,
        date_reclamation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, numero_reclamation, intervention_id
    `, [
      'TEST-' + Date.now(), 
      'Client Test', 
      'technique', 
      'Test de modification avec intervention inexistante',
      138855, // ID inexistant
      'ouverte',
      'normale',
      new Date().toISOString()
    ]);

    if (createResult.rows.length > 0) {
      console.log(`  ✅ Réclamation créée avec succès:`);
      console.log(`     - ID: ${createResult.rows[0].id}`);
      console.log(`     - Numéro: ${createResult.rows[0].numero_reclamation}`);
      console.log(`     - intervention_id: ${createResult.rows[0].intervention_id}`);
    }
    console.log();

    // 2. Tester la modification avec un autre intervention_id inexistant
    const reclamationId = createResult.rows[0].id;
    const newInterventionId = 999999; // Un autre ID inexistant
    
    console.log('🔄 2. Test de modification avec un autre intervention_id inexistant:');
    const updateResult = await pool.query(`
      UPDATE reclamations 
      SET intervention_id = $1, 
          description_probleme = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, intervention_id, description_probleme
    `, [newInterventionId, 'Description mise à jour avec nouvelle intervention', reclamationId]);

    if (updateResult.rows.length > 0) {
      console.log(`  ✅ Modification réussie:`);
      console.log(`     - Nouvelle intervention_id: ${updateResult.rows[0].intervention_id}`);
      console.log(`     - Nouvelle description: ${updateResult.rows[0].description_probleme.substring(0, 50)}...`);
    }
    console.log();

    // 3. Vérifier que la modification a bien pris effet
    console.log('🔍 3. Vérification des données modifiées:');
    const checkResult = await pool.query(`
      SELECT r.*, i.num_inter, i.client as intervention_client
      FROM reclamations r
      LEFT JOIN interventions i ON r.intervention_id = i.id
      WHERE r.id = $1
    `, [reclamationId]);

    if (checkResult.rows.length > 0) {
      const reclamation = checkResult.rows[0];
      console.log(`  ✅ Données vérifiées:`);
      console.log(`     - ID réclamation: ${reclamation.id}`);
      console.log(`     - intervention_id: ${reclamation.intervention_id}`);
      console.log(`     - Intervention trouvée: ${reclamation.intervention_client ? 'OUI' : 'NON'}`);
      if (reclamation.intervention_client) {
        console.log(`     - Détails intervention: ${reclamation.num_inter} - ${reclamation.intervention_client}`);
      } else {
        console.log(`     - ⚠️ L'intervention ${reclamation.intervention_id} n'existe pas (c'est normal pour ce test)`);
      }
    }
    console.log();

    // 4. Nettoyer - Supprimer la réclamation de test
    console.log('🧹 4. Nettoyage - Suppression de la réclamation de test:');
    const deleteResult = await pool.query(`
      DELETE FROM reclamations WHERE id = $1
      RETURNING numero_reclamation
    `, [reclamationId]);
    
    if (deleteResult.rows.length > 0) {
      console.log(`  ✅ Réclamation ${deleteResult.rows[0].numero_reclamation} supprimée avec succès`);
    }
    console.log();

    console.log('🎉 Test terminé avec succès !');
    console.log('✅ Les réclamations peuvent maintenant être modifiées avec des intervention_id qui n\'existent pas encore.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Détail:', error.message);
  } finally {
    await pool.end();
  }
}

testReclamationModification();