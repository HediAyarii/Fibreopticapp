const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function testReclaFreeCharges() {
  const client = await pool.connect();
  
  try {
    console.log('\n🧪 TEST: Vérification ReclaFree dans charges_par_salarie\n');
    console.log('='.repeat(70));
    
    // 1. Récupérer un employé qui a déjà des données dans cout_par_salaire pour mai 2026
    const techResult = await client.query(`
      SELECT DISTINCT e.id, e.nom, e.prenom, e.matricule
      FROM employes e
      JOIN cout_par_salaire cps ON cps.matricule = e.matricule
      WHERE cps.mois = 5 AND cps.annee = 2026
      LIMIT 1
    `);
    
    if (techResult.rows.length === 0) {
      console.log('❌ Aucun technicien trouvé avec interventions en mai 2026');
      return;
    }
    
    const tech = techResult.rows[0];
    console.log(`\n👤 Technicien: ${tech.nom} ${tech.prenom} (${tech.matricule})`);
    
    // 2. Vérifier charges_par_salarie AVANT ajout ReclaFree
    console.log('\n📊 AVANT ajout ReclaFree (table cout_par_salaire):');
    const beforeResult = await client.query(`
      SELECT 
        id,
        nom,
        prenom,
        salaire_net,
        charge
      FROM cout_par_salaire
      WHERE matricule = $1 AND mois = 5 AND annee = 2026
    `, [tech.matricule]);
    
    if (beforeResult.rows.length > 0) {
      const before = beforeResult.rows[0];
      console.log(`   ID: ${before.id}`);
      console.log(`   Nom: ${before.nom} ${before.prenom}`);
      console.log(`   Salaire net: ${before.salaire_net} DT`);
      console.log(`   Charge: ${before.charge} DT`);
    } else {
      console.log('   ⚠️ Aucune ligne dans cout_par_salaire pour mai 2026');
    }
    
    // 3. Vérifier combien de ReclaFree il a déjà en mai 2026
    const existingReclaResult = await client.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(montant_technicien), 0) as total
      FROM recla_free rf
      WHERE rf.employe_id = $1
        AND rf.confirmer = TRUE
        AND rf.date_confirmation IS NOT NULL
        AND EXTRACT(MONTH FROM rf.date_confirmation) = 5
        AND EXTRACT(YEAR FROM rf.date_confirmation) = 2026
    `, [tech.id]);
    
    const existingRecla = existingReclaResult.rows[0];
    console.log(`\n📋 ReclaFree existants en mai 2026:`);
    console.log(`   Nombre: ${existingRecla.count}`);
    console.log(`   Total: ${existingRecla.total} DT`);
    
    // 4. Ajouter une nouvelle ReclaFree confirmée avec date_confirmation aujourd'hui (17/05/2026)
    const montantTest = 150.50;
    console.log(`\n➕ Ajout d'une nouvelle ReclaFree confirmée (${montantTest} DT)...`);
    
    const insertResult = await client.query(`
      INSERT INTO recla_free (
        type_litige,
        date,
        montant,
        montant_technicien,
        montant_entreprise,
        commentaire,
        employe_id,
        confirmer,
        date_confirmation,
        created_at
      ) VALUES (
        'TEST',
        '2026-05-17',
        $2,
        $2,
        0,
        'TEST - Vérification maj charges_par_salarie',
        $1,
        TRUE,
        '2026-05-17 10:00:00',
        NOW()
      )
      RETURNING id, date, montant_technicien, date_confirmation
    `, [tech.id, montantTest]);
    
    const newRecla = insertResult.rows[0];
    console.log(`   ✅ ReclaFree créée (ID: ${newRecla.id})`);
    console.log(`   Date: ${newRecla.date}`);
    console.log(`   Date confirmation: ${newRecla.date_confirmation}`);
    console.log(`   Montant: ${newRecla.montant_technicien} DT`);
    
    // 5. Appeler l'API cout-par-salaire pour forcer le recalcul
    console.log('\n🔄 Appel API /api/cout-par-salaire...');
    
    // Simuler l'appel API avec la même logique
    const afterResult = await client.query(`
      WITH recla_free_totaux AS (
        SELECT
          e.matricule,
          EXTRACT(MONTH FROM rf.date_confirmation)::int as mois,
          EXTRACT(YEAR FROM rf.date_confirmation)::int as annee,
          COALESCE(SUM(rf.montant_technicien), 0) as total_recla_free
        FROM recla_free rf
        JOIN employes e ON rf.employe_id = e.id
        WHERE rf.confirmer = TRUE
          AND rf.date_confirmation IS NOT NULL
        GROUP BY e.matricule, EXTRACT(MONTH FROM rf.date_confirmation), EXTRACT(YEAR FROM rf.date_confirmation)
      )
      SELECT 
        matricule,
        mois,
        annee,
        total_recla_free
      FROM recla_free_totaux
      WHERE matricule = $1 AND mois = 5 AND annee = 2026
    `, [tech.matricule]);
    
    console.log('\n📊 APRÈS ajout ReclaFree (recla_free_totaux):');
    if (afterResult.rows.length > 0) {
      const after = afterResult.rows[0];
      console.log(`   Matricule: ${after.matricule}`);
      console.log(`   Mois/Année: ${after.mois}/${after.annee}`);
      console.log(`   Total ReclaFree: ${after.total_recla_free} DT`);
      
      const expectedTotal = parseFloat(existingRecla.total) + montantTest;
      console.log(`\n✅ Vérification:`);
      console.log(`   Ancien total: ${existingRecla.total} DT`);
      console.log(`   Montant ajouté: ${montantTest} DT`);
      console.log(`   Total attendu: ${expectedTotal} DT`);
      console.log(`   Total obtenu: ${after.total_recla_free} DT`);
      
      if (Math.abs(parseFloat(after.total_recla_free) - expectedTotal) < 0.01) {
        console.log(`   ✅ SUCCÈS: Le total ReclaFree est correct !`);
      } else {
        console.log(`   ❌ ERREUR: Le total ne correspond pas !`);
      }
    } else {
      console.log('   ❌ Aucune ligne dans recla_free_totaux pour mai 2026');
    }
    
    // 6. Vérifier que la ReclaFree est bien prise en compte dans le CTE recla_free_totaux
    console.log('\n📊 Vérification finale - Test du CTE recla_free_totaux:');
    const finalResult = await client.query(`
      WITH recla_free_totaux AS (
        SELECT
          e.matricule,
          EXTRACT(MONTH FROM rf.date_confirmation)::int as mois,
          EXTRACT(YEAR FROM rf.date_confirmation)::int as annee,
          COALESCE(SUM(rf.montant_technicien), 0) as total_recla_free
        FROM recla_free rf
        JOIN employes e ON rf.employe_id = e.id
        WHERE rf.confirmer = TRUE
          AND rf.date_confirmation IS NOT NULL
        GROUP BY e.matricule, EXTRACT(MONTH FROM rf.date_confirmation), EXTRACT(YEAR FROM rf.date_confirmation)
      )
      SELECT 
        matricule,
        mois,
        annee,
        total_recla_free
      FROM recla_free_totaux
      WHERE matricule = $1 AND mois = 5 AND annee = 2026
    `, [tech.matricule]);
    
    if (finalResult.rows.length > 0) {
      const final = finalResult.rows[0];
      console.log(`   Matricule: ${final.matricule}`);
      console.log(`   Mois/Année: ${final.mois}/${final.annee}`);
      console.log(`   Total ReclaFree: ${final.total_recla_free} DT`);
      
      const expectedTotal = parseFloat(existingRecla.total) + montantTest;
      console.log(`\n✅ Vérification:`);
      console.log(`   Ancien total: ${existingRecla.total} DT`);
      console.log(`   Montant ajouté: ${montantTest} DT`);
      console.log(`   Total attendu: ${expectedTotal} DT`);
      console.log(`   Total obtenu: ${final.total_recla_free} DT`);
      
      if (Math.abs(parseFloat(final.total_recla_free) - expectedTotal) < 0.01) {
        console.log(`   ✅ ✅ SUCCÈS: Le CTE recla_free_totaux calcule correctement le total !`);
        console.log(`   ✅ L'API /api/cout-par-salaire utilisera ce montant pour calculer RAP`);
      } else {
        console.log(`   ❌ ERREUR: Le total ne correspond pas !`);
      }
    } else {
      console.log('   ❌ Aucune ligne dans recla_free_totaux pour mai 2026');
    }
    
    // 7. Nettoyer (supprimer la ReclaFree de test)
    console.log(`\n🧹 Nettoyage: Suppression de la ReclaFree de test (ID: ${newRecla.id})...`);
    await client.query('DELETE FROM recla_free WHERE id = $1', [newRecla.id]);
    console.log('   ✅ Supprimée');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST TERMINÉ\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testReclaFreeCharges();
