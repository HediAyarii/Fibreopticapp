import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 50,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

async function createAutoRapCalculation() {
  console.log('🔧 Création du système automatique de calcul des RAP...');
  
  try {
    // 1. Créer une fonction pour calculer automatiquement le RAP
    console.log('\n📊 1. Création de la fonction de calcul automatique:');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculer_rap_automatique()
      RETURNS TRIGGER AS $$
      DECLARE
        impot_calcule NUMERIC;
        rap_calcule NUMERIC;
        total_paiements NUMERIC;
      BEGIN
        -- Calculer l'impôt (50% de la charge)
        impot_calcule := COALESCE(NEW.charge, 0) * 0.5;
        
        -- Calculer le total des paiements
        SELECT COALESCE(SUM(montant_verse), 0)
        INTO total_paiements
        FROM paiements_employes
        WHERE cout_par_salaire_id = NEW.id;
        
        -- Calculer le RAP avec la formule correcte
        -- RAP = Total Généré - Salaire Net - Impôt - Paiements
        rap_calcule := COALESCE(NEW.total_genere, 0) - 
                      COALESCE(NEW.salaire_net, 0) - 
                      impot_calcule - 
                      total_paiements;
        
        -- Mettre à jour les valeurs
        NEW.taxe := impot_calcule;
        NEW.rap := rap_calcule;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('   ✅ Fonction calculer_rap_automatique créée');
    
    // 2. Créer un trigger pour la mise à jour automatique
    console.log('\n📊 2. Création du trigger automatique:');
    
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_calcul_rap_auto ON cout_par_salaire;
    `);
    
    await pool.query(`
      CREATE TRIGGER trigger_calcul_rap_auto
        BEFORE INSERT OR UPDATE ON cout_par_salaire
        FOR EACH ROW
        EXECUTE FUNCTION calculer_rap_automatique();
    `);
    
    console.log('   ✅ Trigger trigger_calcul_rap_auto créé');
    
    // 3. Créer une fonction pour recalculer tous les RAP existants
    console.log('\n📊 3. Création de la fonction de recalcul global:');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION recalculer_tous_les_rap()
      RETURNS TABLE(
        id INTEGER,
        nom VARCHAR,
        prenom VARCHAR,
        ancien_rap NUMERIC,
        nouveau_rap NUMERIC,
        impot_calcule NUMERIC
      ) AS $$
      DECLARE
        rec RECORD;
        impot_calcule NUMERIC;
        total_paiements NUMERIC;
        nouveau_rap NUMERIC;
      BEGIN
        FOR rec IN 
          SELECT cps.id, cps.nom, cps.prenom, cps.total_genere, cps.salaire_net, 
                 cps.charge, cps.taxe, cps.rap
          FROM cout_par_salaire cps
        LOOP
          -- Calculer l'impôt (50% de la charge)
          impot_calcule := COALESCE(rec.charge, 0) * 0.5;
          
          -- Calculer le total des paiements
          SELECT COALESCE(SUM(montant_verse), 0)
          INTO total_paiements
          FROM paiements_employes
          WHERE cout_par_salaire_id = rec.id;
          
          -- Calculer le nouveau RAP
          nouveau_rap := COALESCE(rec.total_genere, 0) - 
                        COALESCE(rec.salaire_net, 0) - 
                        impot_calcule - 
                        total_paiements;
          
          -- Mettre à jour le RAP et la taxe
          UPDATE cout_par_salaire
          SET taxe = impot_calcule,
              rap = nouveau_rap,
              updated_at = CURRENT_TIMESTAMP
          WHERE cout_par_salaire.id = rec.id;
          
          -- Retourner les informations
          id := rec.id;
          nom := rec.nom;
          prenom := rec.prenom;
          ancien_rap := rec.rap;
          nouveau_rap := nouveau_rap;
          impot_calcule := impot_calcule;
          
          RETURN NEXT;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('   ✅ Fonction recalculer_tous_les_rap créée');
    
    // 4. Tester le système
    console.log('\n📊 4. Test du système automatique:');
    
    const testResult = await pool.query(`
      SELECT * FROM recalculer_tous_les_rap()
      WHERE ABS(ancien_rap - nouveau_rap) > 0.01
    `);
    
    console.log(`   📊 RAP recalculés: ${testResult.rows.length}`);
    
    if (testResult.rows.length > 0) {
      console.log('   🔧 RAP recalculés:');
      testResult.rows.forEach(row => {
        console.log(`      ${row.nom} ${row.prenom}: ${row.ancien_rap}€ → ${row.nouveau_rap}€ (Impôt: ${row.impot_calcule}€)`);
      });
    } else {
      console.log('   ✅ Tous les RAP étaient déjà corrects');
    }
    
    // 5. Vérification finale
    console.log('\n📊 5. Vérification finale:');
    const verificationResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        taxe,
        rap,
        (total_genere - salaire_net - taxe) as rap_calcule
      FROM cout_par_salaire
      ORDER BY nom, prenom
    `);
    
    let correctCount = 0;
    let incorrectCount = 0;
    
    for (const row of verificationResult.rows) {
      const difference = Math.abs(parseFloat(row.rap) - parseFloat(row.rap_calcule));
      if (difference < 0.01) {
        correctCount++;
      } else {
        incorrectCount++;
        console.log(`   ❌ ${row.nom} ${row.prenom}: RAP incohérent (${row.rap}€ vs ${row.rap_calcule}€)`);
      }
    }
    
    console.log(`   📊 RAP corrects: ${correctCount}`);
    console.log(`   📊 RAP incorrects: ${incorrectCount}`);
    
    if (incorrectCount === 0) {
      console.log(`   ✅ TOUS LES RAP SONT MAINTENANT CORRECTS !`);
    }
    
    console.log('\n🎯 Système automatique créé !');
    console.log('✅ Fonctions disponibles:');
    console.log('   - calculer_rap_automatique() : Calcule automatiquement le RAP lors des insertions/mises à jour');
    console.log('   - recalculer_tous_les_rap() : Recalcule tous les RAP existants');
    console.log('✅ Le système se déclenche automatiquement sans bouton de synchronisation');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

createAutoRapCalculation().catch(console.error);
