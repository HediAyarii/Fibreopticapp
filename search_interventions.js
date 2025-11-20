const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
});

async function searchInterventions(searchTerm) {
  console.log(`🔍 Recherche d'interventions pour: "${searchTerm}"\n`);

  try {
    // Rechercher par différents critères
    const searches = [
      {
        name: 'Par ID exact',
        query: 'SELECT id, num_inter, client, statut FROM interventions WHERE id = $1',
        params: [searchTerm]
      },
      {
        name: 'Par numéro intervention (contient)',
        query: 'SELECT id, num_inter, client, statut FROM interventions WHERE num_inter ILIKE $1 ORDER BY id DESC LIMIT 10',
        params: [`%${searchTerm}%`]
      },
      {
        name: 'Par client (contient)',
        query: 'SELECT id, num_inter, client, statut FROM interventions WHERE client ILIKE $1 ORDER BY id DESC LIMIT 10',
        params: [`%${searchTerm}%`]
      }
    ];

    for (const search of searches) {
      console.log(`📊 ${search.name}:`);
      try {
        const result = await pool.query(search.query, search.params);
        if (result.rows.length > 0) {
          result.rows.forEach(row => {
            console.log(`  ✅ ID: ${row.id}, Numéro: ${row.num_inter}, Client: ${row.client}, Statut: ${row.statut}`);
          });
        } else {
          console.log('  ❌ Aucun résultat trouvé');
        }
      } catch (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
      }
      console.log();
    }

    // Statistiques rapides
    console.log('📈 Statistiques rapides:');
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'PLANIFIEE' THEN 1 END) as planifiees,
        COUNT(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 END) as terminees,
        COUNT(CASE WHEN statut = 'ANNULEE' THEN 1 END) as annulees,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM interventions
    `);
    const stat = stats.rows[0];
    console.log(`  - Total interventions: ${stat.total}`);
    console.log(`  - Planifiées: ${stat.planifiees}`);
    console.log(`  - Terminées: ${stat.terminees}`);
    console.log(`  - Annulées: ${stat.annulees}`);
    console.log(`  - Range des IDs: ${stat.min_id} - ${stat.max_id}`);
    console.log();

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
  } finally {
    await pool.end();
  }
}

// Récupérer le terme de recherche depuis les arguments de ligne de commande
const searchTerm = process.argv[2];

if (!searchTerm) {
  console.log('Usage: node search_interventions.js <terme_recherche>');
  console.log('Exemple: node search_interventions.js 1388');
  console.log('Exemple: node search_interventions.js SFR');
  console.log('Exemple: node search_interventions.js 119238');
  process.exit(1);
}

searchInterventions(searchTerm);