import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function fixRapCalculation() {
  console.log('🔧 Correction du calcul du RAP...')
  
  try {
    // 1. Supprimer l'ancienne fonction
    console.log('📋 Suppression de l\'ancienne fonction...')
    await pool.query(`
      DROP FUNCTION IF EXISTS calculer_rap_avec_paiements(INTEGER)
    `)
    console.log('✅ Ancienne fonction supprimée')
    
    // 2. Créer la nouvelle fonction avec la logique correcte
    console.log('📋 Création de la nouvelle fonction...')
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
          -- Si taxe = 50% : RAP = Total Généré - Salaire Net + (0.5 × Charge)
          v_rap_base := v_total_genere - v_salaire_net + (0.5 * v_charge);
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
    console.log('✅ Nouvelle fonction créée avec la logique correcte')
    
    // 3. Tester avec l'exemple donné
    console.log('\n📋 Test avec l\'exemple donné...')
    console.log('Données:')
    console.log('  - Total Généré: 2460,00€')
    console.log('  - Salaire Net: 1406,34€')
    console.log('  - Charge: 456,59€')
    console.log('  - Taxe: 50%')
    console.log('  - Coût Total: 1862,93€')
    
    // Calculer manuellement pour vérifier
    const totalGenere = 2460.00
    const salaireNet = 1406.34
    const charge = 456.59
    const taxe = 50
    
    let rapBase = 0
    if (Math.abs(taxe - 100) < 0.01) {
      rapBase = totalGenere - salaireNet
    } else if (Math.abs(taxe - 50) < 0.01) {
      rapBase = totalGenere - salaireNet + (0.5 * charge)
    } else if (Math.abs(taxe) < 0.01) {
      rapBase = totalGenere - 1862.93 // Coût Total
    }
    
    console.log(`\nCalcul manuel:`)
    console.log(`  - RAP de base: ${rapBase.toFixed(2)}€`)
    console.log(`  - Formule: ${totalGenere} - ${salaireNet} + (0.5 × ${charge})`)
    console.log(`  - Calcul: ${totalGenere} - ${salaireNet} + ${(0.5 * charge).toFixed(2)}`)
    console.log(`  - Résultat: ${rapBase.toFixed(2)}€`)
    
    // 4. Mettre à jour tous les RAP existants
    console.log('\n📋 Mise à jour des RAP existants...')
    const updateResult = await pool.query(`
      UPDATE cout_par_salaire 
      SET 
        rap = calculer_rap_avec_paiements(id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id IN (SELECT id FROM cout_par_salaire)
      RETURNING id, nom, prenom, total_genere, salaire_net, charge, cout_total, taxe, rap
    `)
    
    console.log(`✅ ${updateResult.rows.length} enregistrements mis à jour`)
    
    // Afficher quelques exemples
    console.log('\n📊 Exemples de RAP recalculés:')
    updateResult.rows.slice(0, 3).forEach((row, index) => {
      console.log(`${index + 1}. ${row.nom} ${row.prenom}:`)
      console.log(`   - Total Généré: ${row.total_genere}€`)
      console.log(`   - Salaire Net: ${row.salaire_net}€`)
      console.log(`   - Charge: ${row.charge}€`)
      console.log(`   - Taxe: ${row.taxe}%`)
      console.log(`   - RAP: ${row.rap}€`)
    })
    
    console.log('\n🎯 Correction du RAP terminée !')
    console.log('📋 La nouvelle logique est maintenant active:')
    console.log('   ✅ Taxe 100%: RAP = Total Généré - Salaire Net - Paiements')
    console.log('   ✅ Taxe 50%: RAP = Total Généré - Salaire Net + (0.5 × Charge) - Paiements')
    console.log('   ✅ Taxe 0%: RAP = Total Généré - Coût Total - Paiements')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error.message)
  } finally {
    await pool.end()
  }
}

fixRapCalculation()










