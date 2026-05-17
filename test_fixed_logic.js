const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function testFixedLogic() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST DE LA CORRECTION - LOGIQUE AVEC PRIORITÉ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const interventionId = '156786709';

    // Test 1: Intervention avec les deux dates
    console.log(`📋 INTERVENTION DE TEST: ${interventionId}\n`);

    const inter = await pool.query(`
      SELECT num_inter, cloture_tech, cloture_hotline
      FROM interventions
      WHERE num_inter = $1
    `, [interventionId]);

    if (inter.rows.length > 0) {
      const i = inter.rows[0];
      console.log(`   ├─ cloture_tech     : ${i.cloture_tech} (30 avril)`);
      console.log(`   └─ cloture_hotline  : ${i.cloture_hotline} (04 mai)\n`);
    }

    // Test 2: Compter en AVRIL avec la nouvelle logique
    console.log('─────────────────────────────────────────────────────────────');
    console.log('📊 TEST AVRIL (01/04/2026 - 30/04/2026):\n');

    const avrilTest = await pool.query(`
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
        END as date_utilisee
      FROM interventions
      WHERE num_inter = $1
        AND statut = 'CLOTURE TERMINEE'
        AND (
          CASE 
            WHEN cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' THEN
              CASE
                WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date >= '2026-04-01'::date AND cloture_tech::date <= '2026-04-30'::date
                WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-04-01'::date AND TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-04-30'::date
                ELSE FALSE
              END
            WHEN cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' THEN
              CASE
                WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date >= '2026-04-01'::date AND cloture_hotline::date <= '2026-04-30'::date
                WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-04-01'::date AND TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-04-30'::date
                ELSE FALSE
              END
            ELSE FALSE
          END
        )
    `, [interventionId]);

    if (avrilTest.rows.length > 0) {
      console.log(`   ✅ INCLUSE en avril`);
      console.log(`   └─ Date utilisée : ${avrilTest.rows[0].date_utilisee}`);
    } else {
      console.log(`   ❌ EXCLUE d'avril`);
    }

    // Test 3: Compter en MAI avec la nouvelle logique
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('📊 TEST MAI (01/05/2026 - 31/05/2026):\n');

    const maiTest = await pool.query(`
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
        END as date_utilisee
      FROM interventions
      WHERE num_inter = $1
        AND statut = 'CLOTURE TERMINEE'
        AND (
          CASE 
            WHEN cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' THEN
              CASE
                WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date >= '2026-05-01'::date AND cloture_tech::date <= '2026-05-31'::date
                WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-05-01'::date AND TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-05-31'::date
                ELSE FALSE
              END
            WHEN cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' THEN
              CASE
                WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date >= '2026-05-01'::date AND cloture_hotline::date <= '2026-05-31'::date
                WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-05-01'::date AND TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-05-31'::date
                ELSE FALSE
              END
            ELSE FALSE
          END
        )
    `, [interventionId]);

    if (maiTest.rows.length > 0) {
      console.log(`   ✅ INCLUSE en mai`);
      console.log(`   └─ Date utilisée : ${maiTest.rows[0].date_utilisee}`);
    } else {
      console.log(`   ❌ EXCLUE de mai`);
    }

    // Test 4: Vérifier l'unicité
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 RÉSULTAT:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const totalCount = (avrilTest.rows.length > 0 ? 1 : 0) + (maiTest.rows.length > 0 ? 1 : 0);

    if (totalCount === 1) {
      console.log('✅ SUCCÈS: L\'intervention est comptée UNE SEULE FOIS!\n');
      if (avrilTest.rows.length > 0) {
        console.log('   └─ Comptée en AVRIL (car cloture_tech = 30/04/2026)');
      } else {
        console.log('   └─ Comptée en MAI (car cloture_hotline = 04/05/2026)');
      }
    } else if (totalCount === 0) {
      console.log('⚠️  ATTENTION: L\'intervention n\'est comptée dans aucune période!');
    } else {
      console.log('❌ ÉCHEC: L\'intervention est toujours comptée DEUX FOIS!');
    }

    // Test 5: Compter toutes les interventions de Marouen BOUAFFOURA
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 COMPTAGE TOTAL POUR MAROUEN BOUAFFOURA:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const avrilTotal = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE LOWER(nom_technicien) = 'bouaffoura'
        AND LOWER(prenom_technicien) = 'marouen'
        AND statut = 'CLOTURE TERMINEE'
        AND (
          CASE 
            WHEN cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' THEN
              CASE
                WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date >= '2026-04-01'::date AND cloture_tech::date <= '2026-04-30'::date
                WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-04-01'::date AND TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-04-30'::date
                ELSE FALSE
              END
            WHEN cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' THEN
              CASE
                WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date >= '2026-04-01'::date AND cloture_hotline::date <= '2026-04-30'::date
                WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-04-01'::date AND TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-04-30'::date
                ELSE FALSE
              END
            ELSE FALSE
          END
        )
    `);

    const maiTotal = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE LOWER(nom_technicien) = 'bouaffoura'
        AND LOWER(prenom_technicien) = 'marouen'
        AND statut = 'CLOTURE TERMINEE'
        AND (
          CASE 
            WHEN cloture_tech IS NOT NULL AND cloture_tech != '' AND cloture_tech != 'nan' AND cloture_tech ~ '^[0-9]' THEN
              CASE
                WHEN cloture_tech ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_tech::date >= '2026-05-01'::date AND cloture_tech::date <= '2026-05-31'::date
                WHEN cloture_tech ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-05-01'::date AND TO_DATE(SUBSTRING(cloture_tech FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-05-31'::date
                ELSE FALSE
              END
            WHEN cloture_hotline IS NOT NULL AND cloture_hotline != '' AND cloture_hotline != 'nan' AND cloture_hotline ~ '^[0-9]' THEN
              CASE
                WHEN cloture_hotline ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN cloture_hotline::date >= '2026-05-01'::date AND cloture_hotline::date <= '2026-05-31'::date
                WHEN cloture_hotline ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') >= '2026-05-01'::date AND TO_DATE(SUBSTRING(cloture_hotline FROM 1 FOR 10), 'DD/MM/YYYY') <= '2026-05-31'::date
                ELSE FALSE
              END
            ELSE FALSE
          END
        )
    `);

    console.log(`   AVRIL 2026: ${avrilTotal.rows[0].count} interventions`);
    console.log(`   MAI 2026  : ${maiTotal.rows[0].count} interventions`);

    console.log('\n✅ Test terminé\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testFixedLogic();
