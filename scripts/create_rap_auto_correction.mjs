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

async function createRapAutoCorrection() {
  console.log('🔧 Création du système de correction automatique des RAP...');
  
  try {
    // 1. Créer une fonction pour recalculer automatiquement le RAP
    console.log('\n📊 1. Création de la fonction de recalcul automatique:');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION recalculer_rap_automatique()
      RETURNS TRIGGER AS $$
      DECLARE
        total_couts NUMERIC;
        total_paiements NUMERIC;
        nouveau_rap NUMERIC;
      BEGIN
        -- Calculer le total des coûts
        total_couts := COALESCE(NEW.salaire_net, 0) + 
                      COALESCE(NEW.charge, 0) + 
                      COALESCE(NEW.taxe, 0) + 
                      COALESCE(NEW.penalite, 0);
        
        -- Calculer le total des paiements
        SELECT COALESCE(SUM(montant_verse), 0)
        INTO total_paiements
        FROM paiements_employes
        WHERE cout_par_salaire_id = NEW.id;
        
        -- Calculer le nouveau RAP
        nouveau_rap := COALESCE(NEW.total_genere, 0) - total_couts - total_paiements;
        
        -- Mettre à jour le RAP
        NEW.rap := nouveau_rap;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('   ✅ Fonction recalculer_rap_automatique créée');
    
    // 2. Créer un trigger pour la mise à jour automatique
    console.log('\n📊 2. Création du trigger de mise à jour automatique:');
    
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_recalcul_rap ON cout_par_salaire;
    `);
    
    await pool.query(`
      CREATE TRIGGER trigger_recalcul_rap
        BEFORE UPDATE ON cout_par_salaire
        FOR EACH ROW
        EXECUTE FUNCTION recalculer_rap_automatique();
    `);
    
    console.log('   ✅ Trigger trigger_recalcul_rap créé');
    
    // 3. Créer une fonction pour corriger tous les RAP existants
    console.log('\n📊 3. Création de la fonction de correction globale:');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION corriger_tous_les_rap()
      RETURNS TABLE(
        id INTEGER,
        nom VARCHAR,
        prenom VARCHAR,
        ancien_rap NUMERIC,
        nouveau_rap NUMERIC,
        difference NUMERIC
      ) AS $$
      DECLARE
        rec RECORD;
        total_couts NUMERIC;
        total_paiements NUMERIC;
        nouveau_rap NUMERIC;
      BEGIN
        FOR rec IN 
          SELECT cps.id, cps.nom, cps.prenom, cps.total_genere, cps.salaire_net, 
                 cps.charge, cps.taxe, cps.penalite, cps.rap
          FROM cout_par_salaire cps
        LOOP
          -- Calculer le total des coûts
          total_couts := COALESCE(rec.salaire_net, 0) + 
                        COALESCE(rec.charge, 0) + 
                        COALESCE(rec.taxe, 0) + 
                        COALESCE(rec.penalite, 0);
          
          -- Calculer le total des paiements
          SELECT COALESCE(SUM(montant_verse), 0)
          INTO total_paiements
          FROM paiements_employes
          WHERE cout_par_salaire_id = rec.id;
          
          -- Calculer le nouveau RAP
          nouveau_rap := COALESCE(rec.total_genere, 0) - total_couts - total_paiements;
          
          -- Mettre à jour le RAP si nécessaire
          IF ABS(rec.rap - nouveau_rap) > 0.01 THEN
            UPDATE cout_par_salaire
            SET rap = nouveau_rap,
                updated_at = CURRENT_TIMESTAMP
            WHERE cout_par_salaire.id = rec.id;
          END IF;
          
          -- Retourner les informations
          id := rec.id;
          nom := rec.nom;
          prenom := rec.prenom;
          ancien_rap := rec.rap;
          nouveau_rap := nouveau_rap;
          difference := nouveau_rap - rec.rap;
          
          RETURN NEXT;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('   ✅ Fonction corriger_tous_les_rap créée');
    
    // 4. Créer une fonction pour vérifier la cohérence des RAP
    console.log('\n📊 4. Création de la fonction de vérification:');
    
    await pool.query(`
      CREATE OR REPLACE FUNCTION verifier_coherence_rap()
      RETURNS TABLE(
        id INTEGER,
        nom VARCHAR,
        prenom VARCHAR,
        rap_actuel NUMERIC,
        rap_calcule NUMERIC,
        difference NUMERIC,
        est_coherent BOOLEAN
      ) AS $$
      DECLARE
        rec RECORD;
        total_couts NUMERIC;
        total_paiements NUMERIC;
        rap_calcule NUMERIC;
      BEGIN
        FOR rec IN 
          SELECT cps.id, cps.nom, cps.prenom, cps.total_genere, cps.salaire_net, 
                 cps.charge, cps.taxe, cps.penalite, cps.rap
          FROM cout_par_salaire cps
        LOOP
          -- Calculer le total des coûts
          total_couts := COALESCE(rec.salaire_net, 0) + 
                        COALESCE(rec.charge, 0) + 
                        COALESCE(rec.taxe, 0) + 
                        COALESCE(rec.penalite, 0);
          
          -- Calculer le total des paiements
          SELECT COALESCE(SUM(montant_verse), 0)
          INTO total_paiements
          FROM paiements_employes
          WHERE cout_par_salaire_id = rec.id;
          
          -- Calculer le RAP
          rap_calcule := COALESCE(rec.total_genere, 0) - total_couts - total_paiements;
          
          -- Retourner les informations
          id := rec.id;
          nom := rec.nom;
          prenom := rec.prenom;
          rap_actuel := rec.rap;
          rap_calcule := rap_calcule;
          difference := rap_calcule - rec.rap;
          est_coherent := ABS(rec.rap - rap_calcule) < 0.01;
          
          RETURN NEXT;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('   ✅ Fonction verifier_coherence_rap créée');
    
    // 5. Tester le système
    console.log('\n📊 5. Test du système:');
    
    const testResult = await pool.query(`
      SELECT * FROM verifier_coherence_rap()
      WHERE est_coherent = false
    `);
    
    console.log(`   📊 RAP incohérents détectés: ${testResult.rows.length}`);
    
    if (testResult.rows.length === 0) {
      console.log('   ✅ Tous les RAP sont cohérents !');
    } else {
      console.log('   ⚠️  RAP incohérents trouvés:');
      testResult.rows.forEach(row => {
        console.log(`      ${row.nom} ${row.prenom}: ${row.rap_actuel}€ vs ${row.rap_calcule}€`);
      });
    }
    
    console.log('\n🎯 Système de correction automatique créé !');
    console.log('✅ Fonctions disponibles:');
    console.log('   - recalculer_rap_automatique() : Recalcule automatiquement le RAP lors des mises à jour');
    console.log('   - corriger_tous_les_rap() : Corrige tous les RAP existants');
    console.log('   - verifier_coherence_rap() : Vérifie la cohérence de tous les RAP');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

createRapAutoCorrection().catch(console.error);
