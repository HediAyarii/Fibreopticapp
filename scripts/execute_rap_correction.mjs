import pkg from 'pg'
const { Pool } = pkg
import fs from 'fs'

// Configuration de la base de données
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'finalfibre',
  password: 'postgres',
  port: 5432,
  ssl: false,
})

async function executeRapCorrection() {
  try {
    console.log('🔧 Exécution de la correction de la formule RAP...')
    
    // 1. Mettre à jour la fonction de calcul du RAP
    console.log('\n📋 Mise à jour de la fonction calculer_rap_avec_paiements...')
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_rap_avec_paiements(
        p_cout_par_salaire_id INTEGER
      ) RETURNS DECIMAL(10,2) AS $$
      DECLARE
        v_total_genere DECIMAL(10,2);
        v_salaire_net DECIMAL(10,2);
        v_charge DECIMAL(10,2);
        v_cout_total DECIMAL(10,2);
        v_taxe DECIMAL(5,2);
        v_total_paiements DECIMAL(10,2);
        v_rap_base DECIMAL(10,2);
        v_rap_final DECIMAL(10,2);
      BEGIN
        -- Récupérer les données du cout_par_salaire
        SELECT 
          COALESCE(total_genere, 0),
          COALESCE(salaire_net, 0),
          COALESCE(charge, 0),
          COALESCE(cout_total, 0),
          COALESCE(taxe, 0)
        INTO v_total_genere, v_salaire_net, v_charge, v_cout_total, v_taxe
        FROM cout_par_salaire 
        WHERE id = p_cout_par_salaire_id;
        
        -- Calculer le total des paiements
        v_total_paiements := calculer_total_paiements(p_cout_par_salaire_id);
        
        -- Calculer le RAP de base selon la logique correcte
        IF ABS(v_taxe - 100) < 0.01 THEN
          -- Si taxe = 100% : RAP = Total Généré - Salaire Net
          v_rap_base := v_total_genere - v_salaire_net;
        ELSIF ABS(v_taxe - 50) < 0.01 THEN
          -- Si taxe = 50% : RAP = Total Généré - Salaire Net - (0.5 × Charge)
          v_rap_base := v_total_genere - v_salaire_net - (0.5 * v_charge);
        ELSIF ABS(v_taxe) < 0.01 THEN
          -- Si taxe = 0% : RAP = Total Généré - Coût Total
          v_rap_base := v_total_genere - v_cout_total;
        ELSE
          -- Pourcentage de taxe personnalisé : utiliser la logique 0%
          v_rap_base := v_total_genere - v_cout_total;
        END IF;
        
        -- Soustraire les paiements du RAP de base
        v_rap_final := v_rap_base - v_total_paiements;
        
        RETURN v_rap_final;
      END;
      $$ LANGUAGE plpgsql;
    `)
    console.log('✅ Fonction mise à jour avec la nouvelle formule pour taxe 50%')
    
    // 2. Recalculer tous les RAP existants
    console.log('\n🔄 Recalcul des RAP existants...')
    const updateResult = await pool.query(`
      UPDATE cout_par_salaire 
      SET rap = calculer_rap_avec_paiements(id),
          updated_at = CURRENT_TIMESTAMP
      WHERE rap IS NOT NULL
    `)
    console.log(`✅ ${updateResult.rowCount} RAP mis à jour`)
    
    // 3. Vérifier le cas spécifique de BENADBALLAH TAOUFIK
    console.log('\n🔍 Vérification du cas BENADBALLAH TAOUFIK...')
    const benadballahResult = await pool.query(`
      SELECT 
        nom, prenom, matricule,
        total_genere, salaire_net, charge, taxe, rap, total_paiements
      FROM cout_par_salaire 
      WHERE nom = 'BENADBALLAH' AND prenom = 'TAOUFIK'
    `)
    
    if (benadballahResult.rows.length > 0) {
      const row = benadballahResult.rows[0]
      console.log(`\n📊 Données de ${row.nom} ${row.prenom} (${row.matricule}):`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - Taxe: ${row.taxe}%`)
      console.log(`   - Total Paiements: ${row.total_paiements || 0}€`)
      console.log(`   - RAP (nouveau): ${row.rap}€`)
      
      // Calcul manuel pour vérification
      const totalGenere = parseFloat(row.total_genere) || 0
      const salaireNet = parseFloat(row.salaire_net) || 0
      const charge = parseFloat(row.charge) || 0
      const totalPaiements = parseFloat(row.total_paiements) || 0
      
      const rapManuel = totalGenere - salaireNet - (0.5 * charge) - totalPaiements
      console.log(`   - Calcul manuel: ${totalGenere} - ${salaireNet} - (0.5 × ${charge}) - ${totalPaiements} = ${rapManuel.toFixed(2)}€`)
      console.log(`   - Différence: ${Math.abs(parseFloat(row.rap) - rapManuel).toFixed(2)}€`)
      
      if (Math.abs(parseFloat(row.rap) - rapManuel) < 0.01) {
        console.log('✅ Le calcul est correct !')
      } else {
        console.log('❌ Il y a encore un problème dans le calcul')
      }
    } else {
      console.log('❌ BENADBALLAH TAOUFIK non trouvé dans la base')
    }
    
    // 4. Afficher quelques autres exemples
    console.log('\n📊 Autres exemples avec taxe 50%:')
    const examples = await pool.query(`
      SELECT 
        nom, prenom, matricule,
        total_genere, salaire_net, charge, taxe, rap, total_paiements
      FROM cout_par_salaire 
      WHERE ABS(taxe - 50) < 0.01 
      ORDER BY id 
      LIMIT 3
    `)
    
    examples.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.nom} ${row.prenom} (${row.matricule}):`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - RAP: ${row.rap}€`)
    })
    
    console.log('\n🎯 Correction terminée avec succès !')
    console.log('📋 La nouvelle formule est maintenant active:')
    console.log('   ✅ Taxe 50%: RAP = Total Généré - Salaire Net - (0.5 × Charge) - Total Paiements')
    console.log('💡 Le front devrait maintenant afficher les bons RAP')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
    console.error('Détails:', error)
  } finally {
    await pool.end()
  }
}

executeRapCorrection()
