const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

(async () => {
  try {
    console.log('=== CORRECTION DOUBLON HAKIRI RAMZI (Février 2026) ===\n');
    
    // Étape 1: Vérifier l'état actuel
    const before = await pool.query(`
      SELECT id, nom, prenom, salaire_net, salaire_brut, prime, penalite, employe_id, mois, annee
      FROM cout_par_salaire 
      WHERE UPPER(nom) LIKE '%HAKIRI%' AND mois = 2 AND annee = 2026
      ORDER BY id
    `);
    
    console.log('État actuel:');
    before.rows.forEach(r => {
      console.log(`  ID=${r.id}: ${r.prenom} ${r.nom}, salaire_net=${r.salaire_net}, prime=${r.prime}, employe_id=${r.employe_id}`);
    });
    
    // Étape 2: Réinsérer ID=278 avec les données originales + employe_id=6
    console.log('\n📥 Réinsertion de ID=278 avec les données correctes...');
    
    await pool.query(`
      INSERT INTO cout_par_salaire (
        id, nom, prenom, salaire_net, salaire_brut, cout_total, charge, 
        mois, annee, matricule, taxe, impot, total_genere, rap, 
        created_at, updated_at, penalite, employe_id, prime, auto_added
      ) VALUES (
        278,                                    -- id original
        'HAKIRI',                               -- nom
        'RAMZI',                                -- prenom
        861.90,                                 -- salaire_net (donnée réelle)
        1069.71,                                -- salaire_brut (donnée réelle)
        1160.65,                                -- cout_total
        298.75,                                 -- charge
        2,                                      -- mois
        2026,                                   -- annee
        'TECH_HAKRA',                           -- matricule
        149.38,                                 -- taxe
        298.75,                                 -- impot
        1380.00,                                -- total_genere
        -330.03,                                -- rap
        '2026-03-02 20:49:22.364087',           -- created_at original
        CURRENT_TIMESTAMP,                      -- updated_at
        200.00,                                 -- penalite
        6,                                      -- employe_id (lié à l'employé)
        540.00,                                 -- prime (donnée réelle)
        false                                   -- auto_added
      )
      ON CONFLICT (id) DO UPDATE SET
        salaire_net = EXCLUDED.salaire_net,
        salaire_brut = EXCLUDED.salaire_brut,
        cout_total = EXCLUDED.cout_total,
        charge = EXCLUDED.charge,
        taxe = EXCLUDED.taxe,
        impot = EXCLUDED.impot,
        total_genere = EXCLUDED.total_genere,
        rap = EXCLUDED.rap,
        penalite = EXCLUDED.penalite,
        employe_id = EXCLUDED.employe_id,
        prime = EXCLUDED.prime,
        updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ ID=278 inséré/mis à jour avec les données correctes');
    
    // Étape 3: Supprimer ID=291 (le doublon avec valeurs par défaut)
    console.log('\n🗑️ Suppression de ID=291 (doublon)...');
    const deleteResult = await pool.query(`
      DELETE FROM cout_par_salaire WHERE id = 291 RETURNING id, nom, prenom
    `);
    
    if (deleteResult.rows.length > 0) {
      console.log(`✅ Supprimé: ID=${deleteResult.rows[0].id} (${deleteResult.rows[0].prenom} ${deleteResult.rows[0].nom})`);
    } else {
      console.log('⚠️ ID=291 n\'existait pas ou déjà supprimé');
    }
    
    // Étape 4: Vérification finale
    console.log('\n=== VÉRIFICATION FINALE ===');
    const after = await pool.query(`
      SELECT id, nom, prenom, salaire_net, salaire_brut, prime, penalite, employe_id, mois, annee
      FROM cout_par_salaire 
      WHERE UPPER(nom) LIKE '%HAKIRI%' AND mois = 2 AND annee = 2026
      ORDER BY id
    `);
    
    console.log('Entrées restantes pour HAKIRI (Février 2026):');
    after.rows.forEach(r => {
      console.log(`  ✅ ID=${r.id}: ${r.prenom} ${r.nom}`);
      console.log(`     salaire_net=${r.salaire_net}, salaire_brut=${r.salaire_brut}`);
      console.log(`     prime=${r.prime}, penalite=${r.penalite}, employe_id=${r.employe_id}`);
    });
    
    if (after.rows.length === 1 && after.rows[0].id === 278) {
      console.log('\n🎉 SUCCÈS: Seul ID=278 reste avec les données correctes!');
    } else {
      console.log('\n⚠️ Vérifier manuellement le résultat');
    }
    
  } catch(err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    await pool.end();
  }
})();
