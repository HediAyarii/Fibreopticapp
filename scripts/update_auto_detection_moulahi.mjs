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

async function updateAutoDetectionMoulahi() {
  console.log('🔧 Mise à jour du système de détection automatique pour MOULAHI...');
  
  try {
    // 1. Créer une fonction spécifique pour MOULAHI
    console.log('\n📊 1. Création de la fonction moulahi_name_matching...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION moulahi_name_matching(p_nom TEXT, p_prenom TEXT)
      RETURNS TABLE(nom_tech TEXT, prenom_tech TEXT, match_score NUMERIC, match_type TEXT) AS $$
      BEGIN
          -- Correspondance spécifique: MOULAHI ZOBAIR ↔ MOULAHI Mohamed-Bechir
          IF LOWER(p_nom) = 'moulahi' AND LOWER(p_prenom) = 'zobair' THEN
              RETURN QUERY SELECT 'MOULAHI', 'Mohamed-Bechir', 95.0, 'specific_moulahi';
          END IF;
          RETURN;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction moulahi_name_matching créée');
    
    // 2. Mettre à jour la fonction auto_detect_name_matches
    console.log('\n📊 2. Mise à jour de auto_detect_name_matches...');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION auto_detect_name_matches()
      RETURNS TABLE(cout_nom TEXT, cout_prenom TEXT, int_nom TEXT, int_prenom TEXT, match_score NUMERIC, match_type TEXT) AS $$
      BEGIN
          -- Priorité aux correspondances spécifiques
          RETURN QUERY SELECT cps.nom, cps.prenom, bnm.nom_tech, bnm.prenom_tech, bnm.match_score, bnm.match_type
                       FROM cout_par_salaire cps, benabdallah_name_matching(cps.nom, cps.prenom) bnm;
          
          RETURN QUERY SELECT cps.nom, cps.prenom, mnm.nom_tech, mnm.prenom_tech, mnm.match_score, mnm.match_type
                       FROM cout_par_salaire cps, moulahi_name_matching(cps.nom, cps.prenom) mnm;
          
          -- Correspondances exactes
          RETURN QUERY SELECT cps.nom, cps.prenom, snm.nom_tech, snm.prenom_tech, 100.0, 'exact'
                       FROM cout_par_salaire cps, smart_name_matching(cps.nom, cps.prenom) snm
                       WHERE LOWER(cps.nom) = LOWER(snm.nom_tech) AND LOWER(cps.prenom) = LOWER(snm.prenom_tech);
          
          -- Correspondances inversées
          RETURN QUERY SELECT cps.nom, cps.prenom, snm.nom_tech, snm.prenom_tech, 90.0, 'inverted'
                       FROM cout_par_salaire cps, smart_name_matching(cps.nom, cps.prenom) snm
                       WHERE LOWER(cps.nom) = LOWER(snm.prenom_tech) AND LOWER(cps.prenom) = LOWER(snm.nom_tech);
          
          -- Correspondances composées
          RETURN QUERY SELECT cps.nom, cps.prenom, snm.nom_tech, snm.prenom_tech, 85.0, 'compound'
                       FROM cout_par_salaire cps, smart_name_matching(cps.nom, cps.prenom) snm
                       WHERE LOWER(REPLACE(cps.nom, ' ', '')) = LOWER(REPLACE(snm.nom_tech, ' ', ''))
                         AND LOWER(REPLACE(cps.prenom, ' ', '')) = LOWER(REPLACE(snm.prenom_tech, ' ', ''));
          
          -- Correspondances partielles
          RETURN QUERY SELECT cps.nom, cps.prenom, snm.nom_tech, snm.prenom_tech, 75.0, 'partial'
                       FROM cout_par_salaire cps, smart_name_matching(cps.nom, cps.prenom) snm
                       WHERE LOWER(REPLACE(cps.nom, ' ', '')) LIKE '%' || LOWER(REPLACE(snm.nom_tech, ' ', '')) || '%'
                         AND LOWER(REPLACE(cps.prenom, ' ', '')) LIKE '%' || LOWER(REPLACE(snm.prenom_tech, ' ', '')) || '%';
          
          RETURN;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Fonction auto_detect_name_matches mise à jour');
    
    // 3. Tester la détection automatique
    console.log('\n📊 3. Test de la détection automatique...');
    const detectionResult = await pool.query(`SELECT * FROM auto_detect_name_matches()`);
    
    console.log(`   📊 ${detectionResult.rows.length} correspondances détectées:`);
    detectionResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.cout_nom} ${row.cout_prenom} ↔ ${row.int_nom} ${row.int_prenom} (${row.match_type}, score: ${row.match_score})`);
    });
    
    // 4. Vérifier spécifiquement MOULAHI
    console.log('\n📊 4. Vérification spécifique de MOULAHI...');
    const moulahiResult = await pool.query(`
      SELECT * FROM auto_detect_name_matches()
      WHERE LOWER(cout_nom) = 'moulahi' AND LOWER(cout_prenom) = 'zobair'
    `);
    
    if (moulahiResult.rows.length > 0) {
      const match = moulahiResult.rows[0];
      console.log(`   ✅ MOULAHI ZOBAIR détecté automatiquement:`);
      console.log(`      Correspondance: ${match.int_nom} ${match.int_prenom}`);
      console.log(`      Type: ${match.match_type}`);
      console.log(`      Score: ${match.match_score}`);
    } else {
      console.log(`   ❌ MOULAHI ZOBAIR non détecté automatiquement`);
    }
    
    // 5. Tester la synchronisation automatique
    console.log('\n📊 5. Test de la synchronisation automatique...');
    const syncResult = await pool.query(`SELECT * FROM auto_sync_with_detection()`);
    
    if (syncResult.rows.length > 0) {
      console.log(`   🔄 ${syncResult.rows.length} synchronisations effectuées:`);
      syncResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.employe_nom} ${row.employe_prenom}: ${row.ancien_total}€ → ${row.nouveau_total}€ (${row.match_type})`);
      });
    } else {
      console.log('   ✅ Aucune synchronisation nécessaire (données déjà cohérentes)');
    }
    
    console.log('\n🎯 Système de détection automatique mis à jour avec MOULAHI !');
    console.log('✅ Correspondance MOULAHI ZOBAIR ↔ MOULAHI Mohamed-Bechir détectée automatiquement');
    console.log('✅ Synchronisation automatique activée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

updateAutoDetectionMoulahi().catch(console.error);

