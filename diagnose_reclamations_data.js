const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
});

async function diagnoseData() {
  console.log('🔍 Diagnostic des données réclamations...\n');

  try {
    // 1. Vérifier les interventions disponibles
    console.log('📊 1. Interventions disponibles:');
    const interventions = await pool.query(`
      SELECT id, num_inter, client, statut 
      FROM interventions 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.log(`Total interventions: ${interventions.rowCount}`);
    console.log('Dernières interventions:');
    interventions.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Numéro: ${row.num_inter}, Client: ${row.client}, Statut: ${row.statut}`);
    });
    console.log();

    // 2. Vérifier les réclamations avec intervention_id invalides
    console.log('⚠️  2. Réclamations avec intervention_id invalides:');
    const invalidReclamations = await pool.query(`
      SELECT r.id, r.numero_reclamation, r.intervention_id, r.nom_client
      FROM reclamations r
      LEFT JOIN interventions i ON r.intervention_id = i.id
      WHERE r.intervention_id IS NOT NULL AND i.id IS NULL
    `);
    console.log(`Réclamations avec intervention_id invalide: ${invalidReclamations.rowCount}`);
    invalidReclamations.rows.forEach(row => {
      console.log(`  - Réclamation ID: ${row.id}, Numéro: ${row.numero_reclamation}, intervention_id invalide: ${row.intervention_id}, Client: ${row.nom_client}`);
    });
    console.log();

    // 3. Vérifier les employés disponibles
    console.log('👥 3. Employés disponibles:');
    const employes = await pool.query(`
      SELECT id, nom, prenom, matricule 
      FROM employes 
      ORDER BY id DESC 
      LIMIT 10
    `);
    console.log(`Total employés: ${employes.rowCount}`);
    console.log('Derniers employés:');
    employes.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Nom: ${row.prenom} ${row.nom}, Matricule: ${row.matricule}`);
    });
    console.log();

    // 4. Vérifier les réclamations avec employe_id invalides
    console.log('⚠️  4. Réclamations avec employe_id invalides:');
    const invalidEmployeReclamations = await pool.query(`
      SELECT r.id, r.numero_reclamation, r.employe_id, r.nom_client
      FROM reclamations r
      LEFT JOIN employes e ON r.employe_id = e.id
      WHERE r.employe_id IS NOT NULL AND e.id IS NULL
    `);
    console.log(`Réclamations avec employe_id invalide: ${invalidEmployeReclamations.rowCount}`);
    invalidEmployeReclamations.rows.forEach(row => {
      console.log(`  - Réclamation ID: ${row.id}, Numéro: ${row.numero_reclamation}, employe_id invalide: ${row.employe_id}, Client: ${row.nom_client}`);
    });
    console.log();

    // 5. Statistiques générales
    console.log('📈 5. Statistiques générales:');
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_reclamations,
        COUNT(intervention_id) as avec_intervention,
        COUNT(employe_id) as avec_employe,
        COUNT(CASE WHEN statut = 'ouverte' THEN 1 END) as ouvertes,
        COUNT(CASE WHEN statut = 'resolue' THEN 1 END) as resolues
      FROM reclamations
    `);
    const stat = stats.rows[0];
    console.log(`  - Total réclamations: ${stat.total_reclamations}`);
    console.log(`  - Avec intervention liée: ${stat.avec_intervention}`);
    console.log(`  - Avec employé assigné: ${stat.avec_employe}`);
    console.log(`  - Ouvertes: ${stat.ouvertes}`);
    console.log(`  - Résolues: ${stat.resolues}`);
    console.log();

    // 6. Rechercher les interventions 1388 et 10725 mentionnées dans l'erreur
    console.log('🔎 6. Vérifier les interventions mentionnées dans l\'erreur:');
    const searchInterventions = await pool.query(`
      SELECT id, num_inter, client, statut 
      FROM interventions 
      WHERE id IN (1388, 10725)
    `);
    console.log(`Interventions trouvées: ${searchInterventions.rowCount}`);
    searchInterventions.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Numéro: ${row.num_inter}, Client: ${row.client}, Statut: ${row.statut}`);
    });
    if (searchInterventions.rowCount === 0) {
      console.log('  ❌ Aucune des interventions 1388 et 10725 n\'existe dans la base !');
    }
    console.log();

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await pool.end();
  }
}

diagnoseData();