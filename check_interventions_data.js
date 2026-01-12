const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function check() {
  // Structure de la table
  const columns = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'interventions' 
    ORDER BY ordinal_position
  `);
  
  console.log('=== COLONNES TABLE INTERVENTIONS ===');
  columns.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  
  // Valeurs distinctes de statut
  const statuts = await pool.query(`
    SELECT DISTINCT statut, COUNT(*) as count 
    FROM interventions 
    GROUP BY statut 
    ORDER BY count DESC
  `);
  
  console.log('\n=== STATUTS DISPONIBLES ===');
  statuts.rows.forEach(s => console.log(`  ${s.statut}: ${s.count} interventions`));
  
  // Valeurs distinctes de type_intervention
  const types = await pool.query(`
    SELECT DISTINCT type_intervention, COUNT(*) as count 
    FROM interventions 
    GROUP BY type_intervention 
    ORDER BY count DESC
  `);
  
  console.log('\n=== TYPES D\'INTERVENTION ===');
  types.rows.forEach(t => console.log(`  ${t.type_intervention}: ${t.count}`));
  
  // Valeurs distinctes de grille
  const grilles = await pool.query(`
    SELECT DISTINCT grille, COUNT(*) as count 
    FROM interventions 
    GROUP BY grille 
    ORDER BY count DESC
  `);
  
  console.log('\n=== GRILLES ===');
  grilles.rows.forEach(g => console.log(`  ${g.grille}: ${g.count}`));
  
  // Exemple de données par semaine
  const parSemaine = await pool.query(`
    SELECT 
      EXTRACT(YEAR FROM date_rdv::date) as annee,
      EXTRACT(WEEK FROM date_rdv::date) as semaine,
      COUNT(*) as total,
      SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as succes,
      ROUND(SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 1) as taux_reussite
    FROM interventions
    WHERE date_rdv IS NOT NULL 
      AND date_rdv != '' 
      AND date_rdv != 'nan'
      AND date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
    GROUP BY EXTRACT(YEAR FROM date_rdv::date), EXTRACT(WEEK FROM date_rdv::date)
    ORDER BY annee DESC, semaine DESC
    LIMIT 12
  `);
  
  console.log('\n=== STATS PAR SEMAINE (12 dernieres) ===');
  parSemaine.rows.forEach(s => console.log(`  ${s.annee}-S${s.semaine}: ${s.succes}/${s.total} (${s.taux_reussite}%)`));
  
  // Stats par type (RACC vs SAV)
  const parType = await pool.query(`
    SELECT 
      CASE 
        WHEN type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'Raccordement'
        ELSE 'SAV'
      END as categorie,
      COUNT(*) as total,
      SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END) as succes,
      ROUND(SUM(CASE WHEN statut = 'CLOTURE TERMINEE' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 1) as taux_reussite
    FROM interventions
    WHERE date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan'
    GROUP BY CASE WHEN type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'Raccordement' ELSE 'SAV' END
  `);
  
  console.log('\n=== STATS PAR CATEGORIE ===');
  parType.rows.forEach(t => console.log(`  ${t.categorie}: ${t.succes}/${t.total} (${t.taux_reussite}%)`));
  
  await pool.end();
}

check().catch(e => { console.error(e); process.exit(1); });
