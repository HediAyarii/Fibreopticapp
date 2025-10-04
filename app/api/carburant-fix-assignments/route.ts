import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Début de la mise à jour des assignations d\'employés dans carburant_consommation')
    
    const pool = getPool()
    
    // Vérifier et créer les tables manquantes si nécessaire
    await ensureTablesExist(pool)
    
    // Query pour mettre à jour les assignations d'employés dans carburant_consommation
    const updateQuery = `
      WITH employee_assignments AS (
        SELECT 
          ca.carte_id,
          ca.employe_id,
          e.nom || ' ' || e.prenom as employe_nom,
          ca.date_assignation,
          COALESCE(ca.date_fin, CURRENT_DATE) as date_fin_effective,
          ca.statut,
          ca.created_at as assignation_date
        FROM carburant_assignations ca
        WHERE ca.statut = 'active' OR ca.date_fin IS NOT NULL
      ),
      fuel_transactions AS (
        SELECT 
          cc.id,
          cc.numero_carte,
          cc.date_livraison,
          cc.ca_ttc,
          cc.employe_assigné as current_employee_assigned
        FROM carburant_consommation cc
        WHERE cc.ca_ttc IS NOT NULL AND cc.ca_ttc != ''
      ),
      correct_assignments AS (
        SELECT 
          ft.id as transaction_id,
          ft.numero_carte,
          ft.date_livraison,
          ft.ca_ttc,
          ft.current_employee_assigned,
          ea.employe_id as correct_employee_id,
          ea.employe_nom as correct_employee_nom,
          ea.date_assignation,
          ea.date_fin_effective,
          -- Vérifier si la transaction est dans la période d'assignation
          CASE 
            WHEN TO_DATE(ft.date_livraison, 'DD.MM.YYYY') >= ea.date_assignation 
             AND TO_DATE(ft.date_livraison, 'DD.MM.YYYY') <= ea.date_fin_effective
            THEN ea.employe_id
            ELSE NULL
          END as should_be_assigned_to
        FROM fuel_transactions ft
        LEFT JOIN employee_assignments ea ON ft.numero_carte = ea.numero_carte
        WHERE ea.numero_carte IS NOT NULL
      )
      UPDATE carburant_consommation 
      SET employe_assigné = ca.should_be_assigned_to,
          updated_at = NOW()
      FROM correct_assignments ca
      WHERE carburant_consommation.id = ca.transaction_id
        AND ca.should_be_assigned_to IS NOT NULL
        AND (carburant_consommation.employe_assigné IS NULL 
             OR carburant_consommation.employe_assigné != ca.should_be_assigned_to)
      RETURNING 
        carburant_consommation.id,
        carburant_consommation.numero_carte,
        carburant_consommation.date_livraison,
        carburant_consommation.ca_ttc,
        carburant_consommation.employe_assigné as new_employee_assigned,
        ca.correct_employee_nom,
        ca.current_employee_assigned as old_employee_assigned
    `
    
    const startTime = Date.now()
    const result = await pool.query(updateQuery)
    const duration = Date.now() - startTime
    
    console.log(`📊 Update query executed in ${duration}ms`)
    console.log(`✅ ${result.rows.length} transactions mises à jour`)
    
    // Créer un résumé des changements
    const changesSummary = {}
    result.rows.forEach(row => {
      const key = `${row.numero_carte}_${row.date_livraison}`
      if (!changesSummary[key]) {
        changesSummary[key] = {
          numero_carte: row.numero_carte,
          date_livraison: row.date_livraison,
          montant: parseFloat(row.ca_ttc || 0),
          ancien_employe: row.old_employee_assigned,
          nouveau_employe: row.new_employee_assigned,
          nom_employe: row.correct_employee_nom,
          nombre_changements: 1
        }
      } else {
        changesSummary[key].nombre_changements += 1
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Mise à jour terminée avec succès`,
      summary: {
        transactions_mises_a_jour: result.rows.length,
        duree_execution_ms: duration,
        changements_detaillees: Object.values(changesSummary),
        total_cartes_affectees: new Set(result.rows.map(r => r.numero_carte)).size
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des assignations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des assignations d\'employés' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numeroCarte = searchParams.get('numero_carte')
    
    console.log('📊 Vérification des assignations d\'employés dans carburant_consommation')
    
    const pool = getPool()
    
    // Query pour vérifier les assignations actuelles
    let query = `
      WITH employee_assignments AS (
        SELECT 
          ca.carte_id,
          ca.employe_id,
          e.nom || ' ' || e.prenom as employe_nom,
          ca.date_assignation,
          COALESCE(ca.date_fin, CURRENT_DATE) as date_fin_effective,
          ca.statut,
          ca.created_at as assignation_date
        FROM carburant_assignations ca
        WHERE ca.statut = 'active' OR ca.date_fin IS NOT NULL
      ),
      fuel_transactions AS (
        SELECT 
          cc.id,
          cc.numero_carte,
          cc.date_livraison,
          cc.heure_livraison,
          cc.ca_ttc,
          cc.employe_assigné as current_employee_assigned,
          cc.created_at as transaction_created_at
        FROM carburant_consommation cc
        WHERE cc.ca_ttc IS NOT NULL AND cc.ca_ttc != ''
      ),
      assignment_analysis AS (
        SELECT 
          ft.id as transaction_id,
          ft.numero_carte,
          ft.date_livraison,
          ft.heure_livraison,
          ft.ca_ttc,
          ft.current_employee_assigned,
          ft.transaction_created_at,
          ea.employe_id as correct_employee_id,
          ea.employe_nom as correct_employee_nom,
          ea.date_assignation,
          ea.date_fin_effective,
          -- Vérifier si la transaction est dans la période d'assignation
          CASE 
            WHEN TO_DATE(ft.date_livraison, 'DD.MM.YYYY') >= ea.date_assignation 
             AND TO_DATE(ft.date_livraison, 'DD.MM.YYYY') <= ea.date_fin_effective
            THEN ea.employe_id
            ELSE NULL
          END as should_be_assigned_to,
          -- Vérifier si l'assignation est correcte
          CASE 
            WHEN TO_DATE(ft.date_livraison, 'DD.MM.YYYY') >= ea.date_assignation 
             AND TO_DATE(ft.date_livraison, 'DD.MM.YYYY') <= ea.date_fin_effective
             AND ft.current_employee_assigned = ea.employe_id
            THEN 'correct'
            WHEN TO_DATE(ft.date_livraison, 'DD.MM.YYYY') >= ea.date_assignation 
             AND TO_DATE(ft.date_livraison, 'DD.MM.YYYY') <= ea.date_fin_effective
             AND (ft.current_employee_assigned IS NULL OR ft.current_employee_assigned != ea.employe_id)
            THEN 'incorrect'
            ELSE 'no_assignment'
          END as assignment_status
        FROM fuel_transactions ft
        LEFT JOIN employee_assignments ea ON ft.numero_carte = ea.numero_carte
        WHERE ea.numero_carte IS NOT NULL
      )
      SELECT 
        aa.*,
        e.nom as current_employee_nom,
        e.prenom as current_employee_prenom,
        e.matricule as current_employee_matricule
      FROM assignment_analysis aa
      LEFT JOIN employes e ON aa.current_employee_assigned = e.id
    `
    
    const params = []
    if (numeroCarte) {
      query += ` WHERE aa.numero_carte = $1`
      params.push(numeroCarte)
    }
    
    query += ` ORDER BY aa.numero_carte, aa.date_livraison, aa.heure_livraison`
    
    const startTime = Date.now()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Analysis query executed in ${duration}ms`)
    
    // Analyser les résultats
    const analysis = {
      total_transactions: result.rows.length,
      correct_assignments: 0,
      incorrect_assignments: 0,
      no_assignments: 0,
      transactions_by_card: {},
      transactions_by_employee: {},
      incorrect_transactions: []
    }
    
    result.rows.forEach(row => {
      // Compter par statut
      if (row.assignment_status === 'correct') {
        analysis.correct_assignments++
      } else if (row.assignment_status === 'incorrect') {
        analysis.incorrect_assignments++
        analysis.incorrect_transactions.push({
          transaction_id: row.transaction_id,
          numero_carte: row.numero_carte,
          date_livraison: row.date_livraison,
          heure_livraison: row.heure_livraison,
          montant: parseFloat(row.ca_ttc || 0),
          current_employee: row.current_employee_nom || 'Non assigné',
          correct_employee: row.correct_employee_nom,
          periode_assignation: `${row.date_assignation} - ${row.date_fin_effective}`
        })
      } else {
        analysis.no_assignments++
      }
      
      // Compter par carte
      if (!analysis.transactions_by_card[row.numero_carte]) {
        analysis.transactions_by_card[row.numero_carte] = {
          numero_carte: row.numero_carte,
          total_transactions: 0,
          correct_assignments: 0,
          incorrect_assignments: 0,
          total_montant: 0
        }
      }
      
      analysis.transactions_by_card[row.numero_carte].total_transactions++
      analysis.transactions_by_card[row.numero_carte].total_montant += parseFloat(row.ca_ttc || 0)
      
      if (row.assignment_status === 'correct') {
        analysis.transactions_by_card[row.numero_carte].correct_assignments++
      } else if (row.assignment_status === 'incorrect') {
        analysis.transactions_by_card[row.numero_carte].incorrect_assignments++
      }
    })
    
    return NextResponse.json({
      success: true,
      analysis: analysis,
      transactions_detaillees: result.rows,
      resume: {
        pourcentage_correct: analysis.total_transactions > 0 
          ? Math.round((analysis.correct_assignments / analysis.total_transactions) * 100) 
          : 0,
        pourcentage_incorrect: analysis.total_transactions > 0 
          ? Math.round((analysis.incorrect_assignments / analysis.total_transactions) * 100) 
          : 0,
        duree_analyse_ms: duration
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des assignations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse des assignations d\'employés' },
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
