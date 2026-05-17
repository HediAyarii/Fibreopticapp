const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function testReclaFreeByConfirmationDate() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📅 TEST: RÉCLAMATIONS FREE SELON DATE DE CONFIRMATION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Vérifier les réclamations Free confirmées
    console.log('📋 1. RÉCLAMATIONS FREE CONFIRMÉES:\n');
    
    const reclaFreeResult = await pool.query(`
      SELECT 
        rf.id,
        e.nom,
        e.prenom,
        rf.type_litige,
        rf.montant,
        rf.montant_technicien,
        rf.montant_entreprise,
        rf.date as date_reclamation,
        rf.date_confirmation,
        rf.confirmer,
        rf.created_at
      FROM recla_free rf
      JOIN employes e ON rf.employe_id = e.id
      WHERE rf.confirmer = TRUE
      ORDER BY rf.date_confirmation DESC NULLS LAST
      LIMIT 10
    `);

    if (reclaFreeResult.rows.length === 0) {
      console.log('   ℹ️  Aucune réclamation Free confirmée trouvée\n');
    } else {
      console.log(`   ✅ ${reclaFreeResult.rows.length} réclamation(s) confirmée(s):\n`);
      
      reclaFreeResult.rows.forEach((rf, index) => {
        console.log(`   ${index + 1}. ${rf.prenom} ${rf.nom} (ID: ${rf.id})`);
        console.log(`      ├─ Type: ${rf.type_litige}`);
        console.log(`      ├─ Montant total: ${rf.montant}€`);
        console.log(`      ├─ Montant technicien: ${rf.montant_technicien}€`);
        console.log(`      ├─ Montant entreprise: ${rf.montant_entreprise}€`);
        console.log(`      ├─ Date réclamation: ${rf.date_reclamation || 'N/A'}`);
        console.log(`      ├─ Date confirmation: ${rf.date_confirmation ? new Date(rf.date_confirmation).toLocaleString('fr-FR') : '⚠️  NON RENSEIGNÉE'}`);
        console.log(`      └─ Créé le: ${new Date(rf.created_at).toLocaleString('fr-FR')}\n`);
      });
    }

    // 2. Tester le filtrage par date de confirmation
    console.log('─────────────────────────────────────────────────────────────');
    console.log('📊 2. TEST FILTRAGE PAR DATE DE CONFIRMATION:\n');

    const testPeriods = [
      { name: 'Avril 2026', dateFrom: '2026-04-01', dateTo: '2026-04-30' },
      { name: 'Mai 2026', dateFrom: '2026-05-01', dateTo: '2026-05-31' }
    ];

    for (const period of testPeriods) {
      console.log(`   📅 Période: ${period.name} (${period.dateFrom} au ${period.dateTo})`);
      
      const periodResult = await pool.query(`
        SELECT 
          e.id as employe_id,
          e.nom,
          e.prenom,
          COUNT(*) as nombre_recla,
          SUM(rf.montant_technicien) as total_tech,
          SUM(rf.montant_entreprise) as total_ent
        FROM recla_free rf
        JOIN employes e ON rf.employe_id = e.id
        WHERE rf.confirmer = TRUE
          AND rf.date_confirmation IS NOT NULL
          AND DATE(rf.date_confirmation) >= $1::date
          AND DATE(rf.date_confirmation) <= $2::date
        GROUP BY e.id, e.nom, e.prenom
        ORDER BY total_tech DESC
      `, [period.dateFrom, period.dateTo]);

      if (periodResult.rows.length === 0) {
        console.log(`      └─ Aucune réclamation confirmée dans cette période\n`);
      } else {
        periodResult.rows.forEach(emp => {
          console.log(`      └─ ${emp.prenom} ${emp.nom}:`);
          console.log(`         • ${emp.nombre_recla} réclamation(s)`);
          console.log(`         • Tech: ${parseFloat(emp.total_tech).toFixed(2)}€`);
          console.log(`         • Ent: ${parseFloat(emp.total_ent).toFixed(2)}€`);
        });
        console.log('');
      }
    }

    // 3. Identifier les réclamations confirmées sans date_confirmation
    console.log('─────────────────────────────────────────────────────────────');
    console.log('⚠️  3. RÉCLAMATIONS CONFIRMÉES SANS DATE_CONFIRMATION:\n');

    const noDateResult = await pool.query(`
      SELECT 
        rf.id,
        e.nom,
        e.prenom,
        rf.confirmer,
        rf.date_confirmation,
        rf.created_at
      FROM recla_free rf
      JOIN employes e ON rf.employe_id = e.id
      WHERE rf.confirmer = TRUE 
        AND rf.date_confirmation IS NULL
    `);

    if (noDateResult.rows.length === 0) {
      console.log('   ✅ Toutes les réclamations confirmées ont une date_confirmation\n');
    } else {
      console.log(`   ⚠️  ${noDateResult.rows.length} réclamation(s) confirmée(s) SANS date_confirmation:\n`);
      noDateResult.rows.forEach((rf, index) => {
        console.log(`   ${index + 1}. ID ${rf.id} - ${rf.prenom} ${rf.nom}`);
        console.log(`      └─ Créée le: ${new Date(rf.created_at).toLocaleString('fr-FR')}\n`);
      });
      
      console.log('   💡 SOLUTION: Ces réclamations doivent être mises à jour avec:');
      console.log('      UPDATE recla_free SET date_confirmation = created_at WHERE confirmer = TRUE AND date_confirmation IS NULL;\n');
    }

    // 4. Résumé
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ - LOGIQUE DE DATE DE CONFIRMATION:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ DATE UTILISÉE POUR LES RECLA FREE:');
    console.log('   • date_confirmation (date où l\'admin confirme la réclamation)');
    console.log('   • La réclamation est ajoutée à la recette du mois de confirmation\n');

    console.log('❌ DATES NON UTILISÉES:');
    console.log('   • rf.date (date de la réclamation)');
    console.log('   • rf.created_at (date d\'ajout en base)\n');

    console.log('💡 COMPORTEMENT:');
    console.log('   1. Réclamation créée en avril → date = avril');
    console.log('   2. Admin confirme en mai → date_confirmation = mai');
    console.log('   3. Montants ajoutés à la recette de MAI (pas avril)\n');

    console.log('⚠️  IMPORTANT:');
    console.log('   • Seules les réclamations avec confirmer = TRUE sont prises en compte');
    console.log('   • Si date_confirmation IS NULL, la réclamation est IGNORÉE');
    console.log('   • date_confirmation est automatiquement renseignée à NOW() lors de la confirmation\n');

    console.log('✅ Test terminé\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testReclaFreeByConfirmationDate();
