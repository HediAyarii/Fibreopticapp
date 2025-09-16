import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    const pool = getPool()
    
    // Vérifier et créer les tables manquantes si nécessaire
    await ensureTablesExist(pool)
    
    // Query principale pour calculer la consommation par employé
    let query = `
      WITH employee_assignments AS (
        SELECT 
          ca.id as assignation_id,
          ca.numero_carte,
          ca.employe_id,
          ca.employe_nom,
          ca.date_assignation,
          COALESCE(ca.date_fin, CURRENT_DATE) as date_fin_effective,
          ca.statut,
          ca.commentaires,
          e.nom as employe_nom_complet,
          e.prenom as employe_prenom_complet,
          e.matricule,
          ca.created_at as assignation_date,
          ca.updated_at as last_update
        FROM carburant_assignations ca
        LEFT JOIN employes e ON ca.employe_id = e.id
        WHERE ca.statut = 'active' OR ca.date_fin IS NOT NULL
        ORDER BY ca.numero_carte, ca.date_assignation
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
        WHERE cc.ca_ttc IS NOT NULL AND cc.ca_ttc != ''
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
          ea.last_update,
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
        cbp.assignation_id,
        cbp.numero_carte,
        cbp.employe_id,
        cbp.employe_nom_complet,
        cbp.employe_prenom_complet,
        cbp.matricule,
        cbp.employe_nom,
        cbp.date_assignation,
        cbp.date_fin_effective,
        cbp.assignation_date,
        cbp.last_update,
        cbp.commentaires,
        cbp.transaction_id,
        cbp.date_livraison,
        cbp.heure_livraison,
        cbp.ca_ttc,
        cbp.numero_justificatif,
        cbp.immat_vehicule,
        cbp.point_acceptation,
        cbp.transaction_created_at,
        cbp.consommation_periode,
        cbp.transaction_in_period,
        -- Calculer la durée d'assignation en jours
        (cbp.date_fin_effective - cbp.date_assignation) as duree_assignation_jours
      FROM consumption_by_period cbp
      WHERE cbp.transaction_in_period = 1
    `
    
    const params = []
    let paramCount = 0
    
    // Ajouter les filtres
    if (employeId) {
      paramCount++
      query += ` AND cbp.employe_id = $${paramCount}`
      params.push(employeId)
    }
    
    if (dateFrom) {
      paramCount++
      query += ` AND cbp.date_assignation >= $${paramCount}`
      params.push(dateFrom)
    }
    
    if (dateTo) {
      paramCount++
      query += ` AND cbp.date_fin_effective <= $${paramCount}`
      params.push(dateTo)
    }
    
    query += ` ORDER BY cbp.numero_carte, cbp.date_assignation, cbp.date_livraison, cbp.heure_livraison`
    
    const startTime = Date.now()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${query.substring(0, 100)}...`)
    
    // Traiter les résultats pour créer un résumé par employé
    const employeeConsumption = {}
    const cardMovements = {}
    
    result.rows.forEach(row => {
      // Traitement par employé
      if (!employeeConsumption[row.employe_id]) {
        employeeConsumption[row.employe_id] = {
          employe_id: row.employe_id,
          employe_nom: row.employe_nom_complet,
          employe_prenom: row.employe_prenom_complet,
          matricule: row.matricule,
          total_consomme: 0,
          nombre_transactions: 0,
          nombre_cartes_utilisees: 0,
          nombre_periodes_assignation: 0,
          historique_cartes: [],
          transactions_detaillees: []
        }
      }
      
      // Ajouter la consommation
      employeeConsumption[row.employe_id].total_consomme += parseFloat(row.consommation_periode || 0)
      employeeConsumption[row.employe_id].nombre_transactions += 1
      
      // Ajouter la transaction détaillée
      employeeConsumption[row.employe_id].transactions_detaillees.push({
        transaction_id: row.transaction_id,
        numero_carte: row.numero_carte,
        date_livraison: row.date_livraison,
        heure_livraison: row.heure_livraison,
        montant: parseFloat(row.ca_ttc || 0),
        numero_justificatif: row.numero_justificatif,
        immat_vehicule: row.immat_vehicule,
        point_acceptation: row.point_acceptation,
        periode_assignation: `${row.date_assignation} - ${row.date_fin_effective}`,
        duree_assignation_jours: row.duree_assignation_jours
      })
      
      // Traitement par carte pour l'historique des mouvements
      if (!cardMovements[row.numero_carte]) {
        cardMovements[row.numero_carte] = {
          numero_carte: row.numero_carte,
          mouvements: [],
          consommation_totale_carte: 0
        }
      }
      
      // Vérifier si cette assignation existe déjà dans les mouvements
      const existingMovement = cardMovements[row.numero_carte].mouvements.find(
        m => m.assignation_id === row.assignation_id
      )
      
      if (!existingMovement) {
        cardMovements[row.numero_carte].mouvements.push({
          assignation_id: row.assignation_id,
          employe_id: row.employe_id,
          employe_nom: row.employe_nom_complet,
          employe_prenom: row.employe_prenom_complet,
          matricule: row.matricule,
          date_assignation: row.date_assignation,
          date_fin: row.date_fin_effective,
          duree_assignation_jours: row.duree_assignation_jours,
          commentaires: row.commentaires,
          assignation_date: row.assignation_date,
          last_update: row.last_update,
          consommation_periode: 0,
          nombre_transactions_periode: 0,
          transactions_detaillees: []
        })
      }
      
      // Trouver le mouvement correspondant et ajouter les données
      const movement = cardMovements[row.numero_carte].mouvements.find(
        m => m.assignation_id === row.assignation_id
      )
      
      if (movement) {
        movement.consommation_periode += parseFloat(row.consommation_periode || 0)
        movement.nombre_transactions_periode += 1
        movement.transactions_detaillees.push({
          transaction_id: row.transaction_id,
          date_livraison: row.date_livraison,
          heure_livraison: row.heure_livraison,
          montant: parseFloat(row.ca_ttc || 0),
          numero_justificatif: row.numero_justificatif,
          immat_vehicule: row.immat_vehicule,
          point_acceptation: row.point_acceptation
        })
      }
      
      cardMovements[row.numero_carte].consommation_totale_carte += parseFloat(row.consommation_periode || 0)
      
      // Ajouter à l'historique des cartes de l'employé
      const existingCardHistory = employeeConsumption[row.employe_id].historique_cartes.find(
        h => h.numero_carte === row.numero_carte && h.assignation_id === row.assignation_id
      )
      
      if (!existingCardHistory) {
        employeeConsumption[row.employe_id].historique_cartes.push({
          numero_carte: row.numero_carte,
          assignation_id: row.assignation_id,
          date_assignation: row.date_assignation,
          date_fin: row.date_fin_effective,
          duree_assignation_jours: row.duree_assignation_jours,
          consommation_periode: parseFloat(row.consommation_periode || 0),
          nombre_transactions_periode: 1,
          commentaires: row.commentaires,
          assignation_date: row.assignation_date,
          last_update: row.last_update
        })
        employeeConsumption[row.employe_id].nombre_periodes_assignation += 1
      } else {
        existingCardHistory.consommation_periode += parseFloat(row.consommation_periode || 0)
        existingCardHistory.nombre_transactions_periode += 1
      }
    })
    
    // Compter le nombre de cartes uniques par employé
    Object.values(employeeConsumption).forEach(emp => {
      const cartesUniques = new Set(emp.historique_cartes.map(c => c.numero_carte))
      emp.nombre_cartes_utilisees = cartesUniques.size
    })
    
    return NextResponse.json({
      consommation_par_employe: Object.values(employeeConsumption),
      historique_mouvements_cartes: Object.values(cardMovements),
      transactions_brutes: result.rows,
      resume: {
        total_employes: Object.keys(employeeConsumption).length,
        total_cartes: Object.keys(cardMovements).length,
        total_transactions: result.rows.length,
        periode_analyse: {
          date_from: dateFrom || 'Toutes les dates',
          date_to: dateTo || 'Toutes les dates',
          employe_filter: employeId || 'Tous les employés'
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la consommation par employé:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la consommation par employé' },
      { status: 500 }
    )
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
