import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function debugBenabdallahNames() {
  console.log('🔍 Diagnostic des noms BENADBALLAH...');
  
  try {
    // 1. Vérifier les noms dans cout_par_salaire
    console.log('\n📊 1. Noms dans cout_par_salaire:');
    const coutResult = await pool.query(`
      SELECT nom, prenom, total_genere, mois, annee
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%benabdallah%' OR LOWER(nom) LIKE '%benadballah%'
      ORDER BY nom, prenom, annee, mois
    `);
    
    console.log(`   ${coutResult.rows.length} enregistrements trouvés:`);
    coutResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nom} ${row.prenom} - Total: ${row.total_genere}€ (${row.mois}/${row.annee})`);
    });
    
    // 2. Vérifier les noms dans interventions
    console.log('\n📊 2. Noms dans interventions:');
    const intResult = await pool.query(`
      SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as nb_interventions
      FROM interventions
      WHERE (LOWER(nom_technicien) LIKE '%benabdallah%' OR LOWER(nom_technicien) LIKE '%benadballah%')
        AND statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND 
           cloture_tech ~ '^[0-9]' AND 
           (cloture_tech::date >= '2025-05-01' AND cloture_tech::date <= '2025-05-31')) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND 
           cloture_hotline ~ '^[0-9]' AND 
           (cloture_hotline::date >= '2025-05-01' AND cloture_hotline::date <= '2025-05-31')) OR
          (cloture_tech IS NULL AND cloture_hotline IS NULL AND 
           date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' AND 
           date_rdv ~ '^[0-9]' AND 
           (date_rdv::date >= '2025-05-01' AND date_rdv::date <= '2025-05-31'))
        )
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nom_technicien, prenom_technicien
    `);
    
    console.log(`   ${intResult.rows.length} techniciens trouvés:`);
    intResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien} - ${row.nb_interventions} interventions`);
    });
    
    // 3. Calculer le bénéfice brut pour chaque technicien
    console.log('\n📊 3. Calcul du bénéfice brut pour chaque technicien:');
    for (const tech of intResult.rows) {
      const beneficeResult = await pool.query(`
        SELECT COALESCE(SUM(
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = 'ERT OUEST'
                  AND cp.category = i.type_intervention
                ), 0
              )
            ELSE 0
          END
        ), 0) as benefice_total
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
          AND LOWER(i.nom_technicien) = LOWER($1)
          AND LOWER(i.prenom_technicien) = LOWER($2)
          AND (
            (i.cloture_tech IS NOT NULL AND i.cloture_tech != '' AND i.cloture_tech != 'nan' AND 
             i.cloture_tech ~ '^[0-9]' AND 
             (i.cloture_tech::date >= '2025-05-01' AND i.cloture_tech::date <= '2025-05-31')) OR
            (i.cloture_hotline IS NOT NULL AND i.cloture_hotline != '' AND i.cloture_hotline != 'nan' AND 
             i.cloture_hotline ~ '^[0-9]' AND 
             (i.cloture_hotline::date >= '2025-05-01' AND i.cloture_hotline::date <= '2025-05-31')) OR
            (i.cloture_tech IS NULL AND i.cloture_hotline IS NULL AND 
             i.date_rdv IS NOT NULL AND i.date_rdv != '' AND i.date_rdv != 'nan' AND 
             i.date_rdv ~ '^[0-9]' AND 
             (i.date_rdv::date >= '2025-05-01' AND i.date_rdv::date <= '2025-05-31'))
          )
      `, [tech.nom_technicien, tech.prenom_technicien]);
      
      const beneficeTotal = parseFloat(beneficeResult.rows[0]?.benefice_total || 0);
      console.log(`   - ${tech.nom_technicien} ${tech.prenom_technicien}: ${beneficeTotal.toFixed(2)}€`);
    }
    
    // 4. Vérifier les correspondances possibles
    console.log('\n📊 4. Correspondances possibles:');
    for (const coutRecord of coutResult.rows) {
      console.log(`\n   Pour ${coutRecord.nom} ${coutRecord.prenom}:`);
      
      // Chercher des correspondances exactes
      const exactMatch = intResult.rows.find(int => 
        LOWER(int.nom_technicien) === LOWER(coutRecord.nom) && 
        LOWER(int.prenom_technicien) === LOWER(coutRecord.prenom)
      );
      
      if (exactMatch) {
        console.log(`     ✅ Correspondance exacte: ${exactMatch.nom_technicien} ${exactMatch.prenom_technicien}`);
      } else {
        console.log(`     ❌ Aucune correspondance exacte trouvée`);
        
        // Chercher des correspondances partielles
        const partialMatches = intResult.rows.filter(int => 
          LOWER(int.nom_technicien).includes(LOWER(coutRecord.nom)) || 
          LOWER(coutRecord.nom).includes(LOWER(int.nom_technicien))
        );
        
        if (partialMatches.length > 0) {
          console.log(`     🔍 Correspondances partielles possibles:`);
          partialMatches.forEach(match => {
            console.log(`       - ${match.nom_technicien} ${match.prenom_technicien}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugBenabdallahNames().catch(console.error);

