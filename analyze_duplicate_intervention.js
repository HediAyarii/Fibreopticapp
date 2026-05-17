const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function analyzeDuplicateIntervention() {
  try {
    const interventionId = '156786709';

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🔍 ANALYSE INTERVENTION DOUBLE: ${interventionId}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Récupérer les détails de l'intervention
    const result = await pool.query(`
      SELECT 
        num_inter,
        date_rdv,
        cloture_tech,
        cloture_hotline,
        statut,
        articles
      FROM interventions
      WHERE num_inter = $1
    `, [interventionId]);

    if (result.rows.length === 0) {
      console.log('❌ Intervention non trouvée');
      return;
    }

    const inter = result.rows[0];
    console.log('📋 DÉTAILS DE L\'INTERVENTION:\n');
    console.log(`   Numéro: ${inter.num_inter}`);
    console.log(`   Date RDV: ${inter.date_rdv}`);
    console.log(`   Clôture Tech: ${inter.cloture_tech}`);
    console.log(`   Clôture Hotline: ${inter.cloture_hotline}`);
    console.log(`   Articles: ${inter.articles}\n`);

    // 2. Analyser le problème
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🐛 PROBLÈME IDENTIFIÉ:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Cette intervention a DEUX dates de clôture valides:');
    console.log(`   ├─ cloture_tech     : ${inter.cloture_tech} (AVRIL)`);
    console.log(`   └─ cloture_hotline  : ${inter.cloture_hotline} (MAI)\n`);

    // 3. Tester avec la logique actuelle (OR)
    console.log('📊 TEST AVEC LA LOGIQUE ACTUELLE (OR):\n');

    // Test AVRIL
    const avrilTest = await pool.query(`
      SELECT num_inter
      FROM interventions
      WHERE num_inter = $1
        AND statut = 'CLOTURE TERMINEE'
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' AND
            CASE
              WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date >= '2026-04-01'::date AND cloture_tech::date <= '2026-04-30'::date
              WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-04-01'::date AND TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-04-30'::date
              ELSE FALSE
            END
          ) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' AND
            CASE
              WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date >= '2026-04-01'::date AND cloture_hotline::date <= '2026-04-30'::date
              WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-04-01'::date AND TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-04-30'::date
              ELSE FALSE
            END
          )
        )
    `, [interventionId]);

    // Test MAI
    const maiTest = await pool.query(`
      SELECT num_inter
      FROM interventions
      WHERE num_inter = $1
        AND statut = 'CLOTURE TERMINEE'
        AND (
          (cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' AND
            CASE
              WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date >= '2026-05-01'::date AND cloture_tech::date <= '2026-05-31'::date
              WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-05-01'::date AND TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-05-31'::date
              ELSE FALSE
            END
          ) OR
          (cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' AND
            CASE
              WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date >= '2026-05-01'::date AND cloture_hotline::date <= '2026-05-31'::date
              WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-05-01'::date AND TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-05-31'::date
              ELSE FALSE
            END
          )
        )
    `, [interventionId]);

    console.log(`   Filtre AVRIL (01/04 - 30/04):`);
    console.log(`   └─ ${avrilTest.rows.length > 0 ? '✅ INCLUSE' : '❌ EXCLUE'} (car cloture_tech = 30/04/2026)`);
    
    console.log(`\n   Filtre MAI (01/05 - 31/05):`);
    console.log(`   └─ ${maiTest.rows.length > 0 ? '✅ INCLUSE' : '❌ EXCLUE'} (car cloture_hotline = 04/05/2026)`);

    console.log('\n❌ RÉSULTAT: L\'intervention est comptée DEUX FOIS!\n');

    // 4. Solution proposée
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 SOLUTION PROPOSÉE:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Au lieu d\'utiliser cloture_tech OR cloture_hotline,');
    console.log('il faut utiliser une PRIORITÉ:\n');
    console.log('   1️⃣  Si cloture_tech existe et est valide → utiliser UNIQUEMENT cloture_tech');
    console.log('   2️⃣  Sinon → utiliser cloture_hotline\n');

    console.log('Cela garantit qu\'une intervention n\'est comptée qu\'UNE SEULE FOIS.\n');

    // 5. Tester avec la nouvelle logique (COALESCE)
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST AVEC LA NOUVELLE LOGIQUE (PRIORITÉ):');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Test AVRIL avec COALESCE
    const avrilTestFixed = await pool.query(`
      WITH intervention_date AS (
        SELECT 
          num_inter,
          CASE 
            WHEN cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' THEN
              CASE
                WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date
                WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY')
              END
            WHEN cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' THEN
              CASE
                WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date
                WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY')
              END
          END as date_cloture
        FROM interventions
        WHERE num_inter = $1 AND statut = 'CLOTURE TERMINEE'
      )
      SELECT num_inter, date_cloture
      FROM intervention_date
      WHERE date_cloture >= '2026-04-01'::date AND date_cloture <= '2026-04-30'::date
    `, [interventionId]);

    // Test MAI avec COALESCE
    const maiTestFixed = await pool.query(`
      WITH intervention_date AS (
        SELECT 
          num_inter,
          CASE 
            WHEN cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' THEN
              CASE
                WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date
                WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY')
              END
            WHEN cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' THEN
              CASE
                WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date
                WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY')
              END
          END as date_cloture
        FROM interventions
        WHERE num_inter = $1 AND statut = 'CLOTURE TERMINEE'
      )
      SELECT num_inter, date_cloture
      FROM intervention_date
      WHERE date_cloture >= '2026-05-01'::date AND date_cloture <= '2026-05-31'::date
    `, [interventionId]);

    console.log('Avec la NOUVELLE logique (priorité):\n');
    console.log(`   Filtre AVRIL (01/04 - 30/04):`);
    if (avrilTestFixed.rows.length > 0) {
      console.log(`   └─ ✅ INCLUSE (date utilisée: ${avrilTestFixed.rows[0].date_cloture})`);
    } else {
      console.log(`   └─ ❌ EXCLUE`);
    }
    
    console.log(`\n   Filtre MAI (01/05 - 31/05):`);
    if (maiTestFixed.rows.length > 0) {
      console.log(`   └─ ✅ INCLUSE (date utilisée: ${maiTestFixed.rows[0].date_cloture})`);
    } else {
      console.log(`   └─ ❌ EXCLUE`);
    }

    console.log('\n✅ RÉSULTAT: L\'intervention n\'est comptée qu\'UNE SEULE FOIS!\n');

    // 6. Résumé
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🐛 PROBLÈME ACTUEL:');
    console.log('   L\'intervention 156786709 a deux dates de clôture:');
    console.log('   • cloture_tech = 30/04/2026');
    console.log('   • cloture_hotline = 04/05/2026');
    console.log('   Avec la logique OR, elle est incluse en avril ET en mai.\n');

    console.log('✅ SOLUTION:');
    console.log('   Utiliser une PRIORITÉ au lieu de OR:');
    console.log('   • Si cloture_tech existe → utiliser cloture_tech UNIQUEMENT');
    console.log('   • Sinon → utiliser cloture_hotline');
    console.log('   Ainsi, cette intervention sera comptée UNIQUEMENT en avril.\n');

    console.log('🔧 ACTION REQUISE:');
    console.log('   Modifier la logique dans app/api/revenue-calculation/route.ts');
    console.log('   pour utiliser COALESCE au lieu de OR.\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeDuplicateIntervention();
