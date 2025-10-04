import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test du système de carburant avec l\'exemple concret')
    
    const pool = getPool()
    
    // Vérifier et créer les tables manquantes si nécessaire
    await ensureTablesExist(pool)
    
    // Créer des données de test basées sur votre exemple
    await createTestData(pool)
    
    // Analyser les données avec le nouveau système
    const analysisQuery = `
      WITH employee_assignments AS (
        SELECT 
          ca.id as assignation_id,
          ca.carte_id,
          ca.employe_id,
          e.nom || ' ' || e.prenom as employe_nom,
          ca.date_assignation,
          COALESCE(ca.date_fin, CURRENT_DATE) as date_fin_effective,
          ca.statut,
          ca.commentaires,
          e.nom as employe_nom_complet,
          e.prenom as employe_prenom_complet,
          e.matricule,
          ca.created_at as assignation_date
        FROM carburant_assignations ca
        LEFT JOIN employes e ON ca.employe_id = e.id
        WHERE ca.carte_id = '12'
        ORDER BY ca.date_assignation
      ),
      fuel_transactions AS (
        SELECT 
          cc.id as transaction_id,
          cc.numero_carte,
          cc.date_livraison,
          cc.heure_livraison,
          cc.ca_ttc,
          cc.numero_justificatif,
          cc.immat_vehicule,
          cc.point_acceptation,
          cc.created_at as transaction_created_at
        FROM carburant_consommation cc
        WHERE cc.numero_carte = '12'
          AND cc.ca_ttc IS NOT NULL AND cc.ca_ttc != ''
        ORDER BY cc.date_livraison, cc.heure_livraison
      ),
      consumption_by_period AS (
        SELECT 
          ea.assignation_id,
          ea.numero_carte,
          ea.employe_id,
          ea.employe_nom_complet,
          ea.employe_prenom_complet,
          ea.matricule,
          ea.employe_nom,
          ea.date_assignation,
          ea.date_fin_effective,
          ea.assignation_date,
          ea.commentaires,
          ft.transaction_id,
          ft.date_livraison,
          ft.heure_livraison,
          ft.ca_ttc,
          ft.numero_justificatif,
          ft.immat_vehicule,
          ft.point_acceptation,
          ft.transaction_created_at,
          -- Calculer si la transaction est dans la période d'assignation
          CASE 
            WHEN TO_DATE(ft.date_livraison, 'DD.MM.YYYY') >= ea.date_assignation 
             AND TO_DATE(ft.date_livraison, 'DD.MM.YYYY') <= ea.date_fin_effective
            THEN COALESCE(CAST(ft.ca_ttc AS DECIMAL), 0)
            ELSE 0
          END as consommation_periode,
          -- Vérifier si la transaction est dans la période
          CASE 
            WHEN TO_DATE(ft.date_livraison, 'DD.MM.YYYY') >= ea.date_assignation 
             AND TO_DATE(ft.date_livraison, 'DD.MM.YYYY') <= ea.date_fin_effective
            THEN 1
            ELSE 0
          END as transaction_in_period
        FROM employee_assignments ea
        LEFT JOIN fuel_transactions ft ON ea.numero_carte = ft.numero_carte
        WHERE ft.transaction_id IS NOT NULL
      )
      SELECT 
        cbp.*,
        -- Calculer la durée d'assignation en jours
        (cbp.date_fin_effective - cbp.date_assignation) as duree_assignation_jours
      FROM consumption_by_period cbp
      WHERE cbp.transaction_in_period = 1
      ORDER BY cbp.date_livraison, cbp.heure_livraison
    `
    
    const startTime = Date.now()
    const result = await pool.query(analysisQuery)
    const duration = Date.now() - startTime
    
    console.log(`📊 Analysis query executed in ${duration}ms`)
    
    // Traiter les résultats pour créer un résumé
    const summary = {
      numero_carte: '12',
      periode_analyse: '01/05/2025 - 03/05/2025',
      total_transactions: result.rows.length,
      total_consommation: 0,
      consommation_par_employe: {},
      historique_detaille: []
    }
    
    result.rows.forEach(row => {
      // Ajouter à la consommation totale
      summary.total_consommation += parseFloat(row.consommation_periode || 0)
      
      // Traitement par employé
      if (!summary.consommation_par_employe[row.employe_id]) {
        summary.consommation_par_employe[row.employe_id] = {
          employe_id: row.employe_id,
          employe_nom: row.employe_nom_complet,
          employe_prenom: row.employe_prenom_complet,
          matricule: row.matricule,
          periode_assignation: `${row.date_assignation} - ${row.date_fin_effective}`,
          duree_assignation_jours: row.duree_assignation_jours,
          total_consomme: 0,
          nombre_transactions: 0,
          transactions_detaillees: []
        }
      }
      
      // Ajouter la consommation
      summary.consommation_par_employe[row.employe_id].total_consomme += parseFloat(row.consommation_periode || 0)
      summary.consommation_par_employe[row.employe_id].nombre_transactions += 1
      
      // Ajouter la transaction détaillée
      summary.consommation_par_employe[row.employe_id].transactions_detaillees.push({
        transaction_id: row.transaction_id,
        date_livraison: row.date_livraison,
        heure_livraison: row.heure_livraison,
        montant: parseFloat(row.ca_ttc || 0),
        numero_justificatif: row.numero_justificatif,
        immat_vehicule: row.immat_vehicule,
        point_acceptation: row.point_acceptation
      })
      
      // Ajouter à l'historique détaillé
      summary.historique_detaille.push({
        transaction_id: row.transaction_id,
        numero_carte: row.numero_carte,
        employe_responsable: row.employe_nom_complet,
        date_livraison: row.date_livraison,
        heure_livraison: row.heure_livraison,
        montant: parseFloat(row.ca_ttc || 0),
        periode_assignation: `${row.date_assignation} - ${row.date_fin_effective}`,
        numero_justificatif: row.numero_justificatif,
        immat_vehicule: row.immat_vehicule,
        point_acceptation: row.point_acceptation
      })
    })
    
    return NextResponse.json({
      success: true,
      message: 'Test du système de carburant terminé avec succès',
      exemple_concret: {
        description: 'Carte #12 utilisée par Aymen BEN KHALIFA puis BEN CHEDLI HAMDI',
        periode: '01/05/2025 - 03/05/2025',
        total_transactions: summary.total_transactions,
        total_consommation: summary.total_consommation
      },
      consommation_par_employe: Object.values(summary.consommation_par_employe),
      historique_detaille: summary.historique_detaille,
      resume: {
        duree_analyse_ms: duration,
        nombre_employes_impliques: Object.keys(summary.consommation_par_employe).length,
        verification: {
          total_calcule: summary.total_consommation,
          attendu: 140, // 50 + 50 + 40 selon votre exemple
          correct: Math.abs(summary.total_consommation - 140) < 0.01
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors du test du système:', error)
    return NextResponse.json(
      { error: 'Erreur lors du test du système de carburant' },
      { status: 500 }
    )
  }
}

// Fonction pour créer les données de test
async function createTestData(pool: any) {
  try {
    console.log('📝 Création des données de test...')
    
    // Créer les employés de test
    await pool.query(`
      INSERT INTO employes (matricule, nom, prenom, email, telephone, poste, statut)
      VALUES 
        ('EMP001', 'BEN KHALIFA', 'Aymen', 'aymen@example.com', '0123456789', 'Technicien', 'actif'),
        ('EMP002', 'BEN CHEDLI', 'HAMDI', 'hamdi@example.com', '0987654321', 'Technicien', 'actif')
      ON CONFLICT (matricule) DO NOTHING
    `)
    
    // Créer la carte de test
    await pool.query(`
      INSERT INTO carburant (numero_carte, montant, date_livraison, statut)
      VALUES ('12', 1000.00, '2025-01-01', 'active')
      ON CONFLICT (numero_carte) DO NOTHING
    `)
    
    // Créer les assignations de test
    await pool.query(`
      INSERT INTO carburant_assignations (numero_carte, employe_id, employe_nom, date_assignation, date_fin, statut, commentaires)
      VALUES 
        ('12', (SELECT id FROM employes WHERE matricule = 'EMP001'), 'Aymen BEN KHALIFA', '2025-05-01', '2025-05-02', 'inactive', 'Assignation initiale'),
        ('12', (SELECT id FROM employes WHERE matricule = 'EMP002'), 'BEN CHEDLI HAMDI', '2025-05-02', NULL, 'active', 'Transfert depuis Aymen BEN KHALIFA')
      ON CONFLICT DO NOTHING
    `)
    
    // Créer les transactions de test
    await pool.query(`
      INSERT INTO carburant_consommation (numero_carte, date_livraison, heure_livraison, ca_ttc, numero_justificatif, immat_vehicule, point_acceptation)
      VALUES 
        ('12', '01.05.2025', '10:00', '50.00', 'TXN001', 'ABC123', 'Station A'),
        ('12', '02.05.2025', '09:00', '50.00', 'TXN002', 'ABC123', 'Station B'),
        ('12', '02.05.2025', '16:14', '40.00', 'TXN003', 'XYZ789', 'Station C')
      ON CONFLICT (numero_justificatif) DO NOTHING
    `)
    
    console.log('✅ Données de test créées avec succès')
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error)
  }
}

// Fonction pour s'assurer que les tables existent
async function ensureTablesExist(pool: any) {
  try {
    // Vérifier si la table carburant_assignations existe
    const assignationsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'carburant_assignations'
      );
    `)
    
    if (!assignationsTableCheck.rows[0].exists) {
      console.log('⚠️ Table carburant_assignations n\'existe pas, création en cours...')
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS carburant_assignations (
          id SERIAL PRIMARY KEY,
          numero_carte VARCHAR(50) NOT NULL,
          employe_id INTEGER NOT NULL,
          employe_nom VARCHAR(100),
          date_assignation DATE NOT NULL DEFAULT CURRENT_DATE,
          date_fin DATE,
          statut VARCHAR(20) DEFAULT 'active',
          commentaires TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_carburant_assignations_carte ON carburant_assignations(numero_carte);
        CREATE INDEX IF NOT EXISTS idx_carburant_assignations_employe ON carburant_assignations(employe_id);
        CREATE INDEX IF NOT EXISTS idx_carburant_assignations_statut ON carburant_assignations(statut);
      `)
      console.log('✅ Table carburant_assignations créée avec succès')
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error)
  }
}
