const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkDateFilteringLogic() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📅 ANALYSE: QUELLE DATE EST UTILISÉE POUR LE CALCUL DE RECETTE?');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Analyser la logique de l'API revenue-calculation
    console.log('📋 1. LOGIQUE DE L\'API revenue-calculation:\n');
    console.log('✅ DATE UTILISÉE: cloture_tech OU cloture_hotline');
    console.log('   └─ Si cloture_tech existe et est valide → utilise cloture_tech');
    console.log('   └─ Sinon, si cloture_hotline existe et est valide → utilise cloture_hotline');
    console.log('   └─ L\'intervention est incluse si au moins une des deux dates est dans la période\n');

    console.log('❌ DATES NON UTILISÉES:');
    console.log('   ✗ date_rdv (date de rendez-vous) → PAS utilisée');
    console.log('   ✗ created_at (date d\'ajout en base) → PAS utilisée');
    console.log('   ✗ debut (heure de début) → PAS utilisée');
    console.log('   ✗ debut_intervention → PAS utilisée\n');

    // 2. Exemple pratique avec une intervention
    console.log('─────────────────────────────────────────────────────────────');
    console.log('📊 2. EXEMPLE PRATIQUE:\n');

    const exampleIntervention = await pool.query(`
      SELECT 
        num_inter,
        date_rdv,
        cloture_tech,
        cloture_hotline,
        created_at,
        statut,
        articles
      FROM interventions
      WHERE statut = 'CLOTURE TERMINEE'
        AND articles IS NOT NULL 
        AND articles != ''
        AND articles != 'nan'
        AND cloture_tech IS NOT NULL
        AND cloture_tech != 'nan'
        AND cloture_tech != ''
      LIMIT 1
    `);

    if (exampleIntervention.rows.length > 0) {
      const inter = exampleIntervention.rows[0];
      console.log(`Intervention exemple: ${inter.num_inter}`);
      console.log(`├─ 📅 Date RDV: ${inter.date_rdv}`);
      console.log(`├─ ✅ Clôture Tech: ${inter.cloture_tech} ← DATE UTILISÉE`);
      console.log(`├─ ✅ Clôture Hotline: ${inter.cloture_hotline} ← DATE ALTERNATIVE`);
      console.log(`├─ 🗓️  Créé le: ${inter.created_at}`);
      console.log(`└─ 📦 Articles: ${inter.articles}\n`);
      
      console.log('💡 RÈGLE DE FILTRAGE:');
      console.log(`   Si vous filtrez du 01/04/2026 au 30/04/2026:`);
      console.log(`   → Cette intervention sera INCLUSE si cloture_tech OU cloture_hotline`);
      console.log(`      est entre le 01/04/2026 et le 30/04/2026`);
      console.log(`   → La date_rdv n'a AUCUNE importance pour le filtrage\n`);
    }

    // 3. Comparer les dates pour un technicien
    console.log('─────────────────────────────────────────────────────────────');
    console.log('📊 3. ANALYSE DES DATES POUR MAROUEN BOUAFFOURA:\n');

    const dateAnalysis = await pool.query(`
      SELECT 
        COUNT(*) as total_interventions,
        COUNT(CASE WHEN cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' THEN 1 END) as avec_cloture_tech,
        COUNT(CASE WHEN cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' THEN 1 END) as avec_cloture_hotline,
        COUNT(CASE WHEN date_rdv IS NOT NULL AND date_rdv != '' AND date_rdv != 'nan' THEN 1 END) as avec_date_rdv,
        MIN(CASE 
          WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(cloture_tech, 'DD/MM/YYYY')
          WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date
        END) as min_cloture_tech,
        MAX(CASE 
          WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(cloture_tech, 'DD/MM/YYYY')
          WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date
        END) as max_cloture_tech
      FROM interventions
      WHERE LOWER(nom_technicien) = 'bouaffoura'
        AND LOWER(prenom_technicien) = 'marouen'
        AND statut = 'CLOTURE TERMINEE'
    `);

    const dates = dateAnalysis.rows[0];
    console.log(`Total interventions terminées: ${dates.total_interventions}`);
    console.log(`├─ ✅ Avec cloture_tech: ${dates.avec_cloture_tech}`);
    console.log(`├─ ✅ Avec cloture_hotline: ${dates.avec_cloture_hotline}`);
    console.log(`└─ 📅 Avec date_rdv: ${dates.avec_date_rdv}\n`);
    
    console.log(`Période couverte (cloture_tech):`);
    console.log(`├─ Première: ${dates.min_cloture_tech || 'N/A'}`);
    console.log(`└─ Dernière: ${dates.max_cloture_tech || 'N/A'}\n`);

    // 4. Test de filtrage sur une période
    console.log('─────────────────────────────────────────────────────────────');
    console.log('📊 4. TEST DE FILTRAGE PAR PÉRIODE:\n');

    const testPeriod = '2026-04-01';
    const testPeriodEnd = '2026-04-30';

    console.log(`Période de test: ${testPeriod} au ${testPeriodEnd}\n`);

    // Test avec cloture_tech/hotline (VRAIE LOGIQUE)
    const resultWithCloture = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE LOWER(nom_technicien) = 'bouaffoura'
        AND LOWER(prenom_technicien) = 'marouen'
        AND statut = 'CLOTURE TERMINEE'
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' AND
            CASE
              WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date >= $1::date AND cloture_tech::date <= $2::date
              WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= $1::date AND TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= $2::date
              ELSE FALSE
            END
          ) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' AND
            CASE
              WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date >= $1::date AND cloture_hotline::date <= $2::date
              WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= $1::date AND TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= $2::date
              ELSE FALSE
            END
          )
        )
    `, [testPeriod, testPeriodEnd]);

    // Test avec date_rdv (FAUSSE LOGIQUE - NON UTILISÉE)
    const resultWithRdv = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE LOWER(nom_technicien) = 'bouaffoura'
        AND LOWER(prenom_technicien) = 'marouen'
        AND statut = 'CLOTURE TERMINEE'
        AND date_rdv IS NOT NULL 
        AND date_rdv != ''
        AND (
          (date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND date_rdv::date >= $1::date AND date_rdv::date <= $2::date) OR
          (date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(SUBSTRING(date_rdv FROM 1 FOR 10), 'DD/MM/YYYY') >= $1::date AND TO_DATE(SUBSTRING(date_rdv FROM 1 FOR 10), 'DD/MM/YYYY') <= $2::date)
        )
    `, [testPeriod, testPeriodEnd]);

    // Test avec created_at (FAUSSE LOGIQUE - NON UTILISÉE)
    const resultWithCreated = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE LOWER(nom_technicien) = 'bouaffoura'
        AND LOWER(prenom_technicien) = 'marouen'
        AND statut = 'CLOTURE TERMINEE'
        AND created_at >= $1::date AND created_at <= $2::date
    `, [testPeriod, testPeriodEnd]);

    console.log('✅ FILTRAGE PAR cloture_tech OU cloture_hotline (UTILISÉ):');
    console.log(`   → ${resultWithCloture.rows[0].count} interventions trouvées\n`);

    console.log('❌ FILTRAGE PAR date_rdv (NON UTILISÉ):');
    console.log(`   → ${resultWithRdv.rows[0].count} interventions (pour comparaison)\n`);

    console.log('❌ FILTRAGE PAR created_at (NON UTILISÉ):');
    console.log(`   → ${resultWithCreated.rows[0].count} interventions (pour comparaison)\n`);

    // 5. Résumé final
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ FINAL:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ DATE UTILISÉE POUR LE CALCUL DE RECETTE:');
    console.log('   📅 cloture_tech (date de clôture technicien)');
    console.log('   📅 OU cloture_hotline (date de clôture hotline)');
    console.log('   → L\'intervention est incluse si au moins UNE des deux dates');
    console.log('     se trouve dans la période filtrée\n');

    console.log('❌ DATES NON UTILISÉES:');
    console.log('   ✗ date_rdv → Date du rendez-vous');
    console.log('   ✗ created_at → Date d\'ajout en base de données');
    console.log('   ✗ debut → Heure de début');
    console.log('   ✗ debut_intervention → Début de l\'intervention\n');

    console.log('💡 POURQUOI CETTE LOGIQUE?');
    console.log('   La recette est calculée sur la date de CLÔTURE car c\'est à ce');
    console.log('   moment que l\'intervention est facturée/comptabilisée.');
    console.log('   Le RDV peut être annulé ou reporté, donc on utilise la clôture.\n');

    console.log('⚠️  ATTENTION:');
    console.log('   Si une intervention a:');
    console.log('   • date_rdv = 30/04/2026');
    console.log('   • cloture_tech = 05/05/2026');
    console.log('   → Elle sera comptée en MAI (pas en avril) car on utilise cloture_tech\n');

    console.log('🔍 COHÉRENCE AVEC D\'AUTRES CALCULS:');
    console.log('   Cette logique est IDENTIQUE à celle utilisée dans:');
    console.log('   • Coût par Salaire (cout-par-salaire)');
    console.log('   • Statistiques');
    console.log('   → Garantit la cohérence des données à travers l\'application\n');

    console.log('✅ Analyse terminée');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkDateFilteringLogic();
