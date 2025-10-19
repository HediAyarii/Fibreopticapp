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

async function verifyMoulahiZobair() {
  console.log('🔍 Vérification de MOULAHI ZOBAIR...');
  
  try {
    // 1. Vérifier l'état dans cout_par_salaire
    console.log('\n📊 1. État dans cout_par_salaire:');
    const coutResult = await pool.query(`
      SELECT id, nom, prenom, mois, annee, total_genere, salaire_net, charge, taxe, penalite, rap
      FROM cout_par_salaire
      WHERE LOWER(nom) = 'moulahi' AND LOWER(prenom) = 'zobair'
        AND mois = 5 AND annee = 2025
    `);
    
    if (coutResult.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé pour MOULAHI ZOBAIR');
      return;
    }
    
    const coutRecord = coutResult.rows[0];
    console.log(`   📊 ID: ${coutRecord.id}`);
    console.log(`   📊 Nom: ${coutRecord.nom} ${coutRecord.prenom}`);
    console.log(`   📊 Période: ${coutRecord.mois}/${coutRecord.annee}`);
    console.log(`   📊 Total généré: ${coutRecord.total_genere}€`);
    console.log(`   📊 Salaire net: ${coutRecord.salaire_net}€`);
    console.log(`   📊 Charge: ${coutRecord.charge}€`);
    console.log(`   📊 Taxe: ${coutRecord.taxe}€`);
    console.log(`   📊 Pénalité: ${coutRecord.penalite}€`);
    console.log(`   📊 RAP: ${coutRecord.rap}€`);
    
    // 2. Rechercher les interventions correspondantes
    console.log('\n📊 2. Recherche des interventions correspondantes:');
    
    // Essayer différentes variantes du nom
    const nameVariants = [
      { nom: 'moulahi', prenom: 'zobair' },
      { nom: 'zobair', prenom: 'moulahi' },
      { nom: 'moula', prenom: 'zobair' },
      { nom: 'zobair', prenom: 'moula' }
    ];
    
    let foundInterventions = false;
    for (const variant of nameVariants) {
      const interventionResult = await pool.query(`
        SELECT COUNT(*) as count,
               COALESCE(SUM(
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
        WHERE LOWER(i.nom_technicien) = LOWER($1)
          AND LOWER(i.prenom_technicien) = LOWER($2)
          AND i.statut = 'CLOTURE TERMINEE'
          AND i.articles IS NOT NULL 
          AND i.articles != ''
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
      `, [variant.nom, variant.prenom]);
      
      const count = parseInt(interventionResult.rows[0].count);
      const beneficeTotal = parseFloat(interventionResult.rows[0].benefice_total || 0);
      
      if (count > 0) {
        console.log(`   ✅ Trouvé avec ${variant.nom} ${variant.prenom}:`);
        console.log(`      📊 Nombre d'interventions: ${count}`);
        console.log(`      📊 Bénéfice total: ${beneficeTotal.toFixed(2)}€`);
        foundInterventions = true;
        break;
      }
    }
    
    if (!foundInterventions) {
      console.log('   ❌ Aucune intervention trouvée avec les variantes testées');
      
      // Rechercher toutes les interventions de mai pour voir les noms disponibles
      console.log('\n📊 3. Recherche de toutes les interventions de mai (pour voir les noms):');
      const allInterventionsResult = await pool.query(`
        SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as count
        FROM interventions
        WHERE statut = 'CLOTURE TERMINEE'
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
        ORDER BY count DESC
      `);
      
      console.log(`   📊 ${allInterventionsResult.rows.length} techniciens trouvés en mai:`);
      allInterventionsResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}: ${row.count} interventions`);
      });
      
      // Rechercher spécifiquement des noms contenant "moulahi" ou "zobair"
      console.log('\n📊 4. Recherche de noms contenant "moulahi" ou "zobair":');
      const similarNamesResult = await pool.query(`
        SELECT DISTINCT nom_technicien, prenom_technicien, COUNT(*) as count
        FROM interventions
        WHERE statut = 'CLOTURE TERMINEE'
          AND articles IS NOT NULL 
          AND articles != ''
          AND (
            LOWER(nom_technicien) LIKE '%moulahi%' OR 
            LOWER(prenom_technicien) LIKE '%moulahi%' OR
            LOWER(nom_technicien) LIKE '%zobair%' OR 
            LOWER(prenom_technicien) LIKE '%zobair%' OR
            LOWER(nom_technicien) LIKE '%moula%' OR 
            LOWER(prenom_technicien) LIKE '%moula%'
          )
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
        ORDER BY count DESC
      `);
      
      if (similarNamesResult.rows.length > 0) {
        console.log(`   📊 ${similarNamesResult.rows.length} noms similaires trouvés:`);
        similarNamesResult.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.nom_technicien} ${row.prenom_technicien}: ${row.count} interventions`);
        });
      } else {
        console.log('   ❌ Aucun nom similaire trouvé');
      }
    }
    
    // 3. Vérifier la cohérence du RAP
    console.log('\n📊 5. Vérification de la cohérence du RAP:');
    const totalGenere = parseFloat(coutRecord.total_genere || 0);
    const salaireNet = parseFloat(coutRecord.salaire_net || 0);
    const charge = parseFloat(coutRecord.charge || 0);
    const taxe = parseFloat(coutRecord.taxe || 0);
    const penalite = parseFloat(coutRecord.penalite || 0);
    const rap = parseFloat(coutRecord.rap || 0);
    
    const totalDepenses = salaireNet + charge + taxe + penalite;
    const rapAttendu = totalGenere - totalDepenses;
    const difference = Math.abs(rap - rapAttendu);
    
    console.log(`   📊 Calcul: ${totalGenere.toFixed(2)} - (${salaireNet.toFixed(2)} + ${charge.toFixed(2)} + ${taxe.toFixed(2)} + ${penalite.toFixed(2)})`);
    console.log(`   📊 RAP attendu: ${rapAttendu.toFixed(2)}€`);
    console.log(`   📊 RAP actuel: ${rap.toFixed(2)}€`);
    console.log(`   📊 Différence: ${difference.toFixed(2)}€`);
    
    if (difference < 0.01) {
      console.log(`   ✅ RAP cohérent !`);
    } else {
      console.log(`   ❌ RAP incohérent !`);
    }
    
    // 4. Résumé
    console.log('\n📊 6. Résumé:');
    console.log(`   📊 MOULAHI ZOBAIR dans cout_par_salaire:`);
    console.log(`      Total généré: ${totalGenere.toFixed(2)}€`);
    console.log(`      RAP: ${rap.toFixed(2)}€`);
    
    if (foundInterventions) {
      console.log(`   ✅ Correspondance trouvée avec les interventions`);
    } else {
      console.log(`   ❌ Aucune correspondance trouvée avec les interventions`);
      console.log(`   💡 Possible problème de correspondance de nom`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

verifyMoulahiZobair().catch(console.error);

