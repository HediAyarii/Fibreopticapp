import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    console.log('✅ Connexion PostgreSQL établie avec succès')
    
    // Vérifier et créer les tables manquantes
    const dbPool = getPool()
    
    // Vérifier si la table carburant existe
    const carburantTableCheck = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'carburant'
      );
    `)
    
    if (!carburantTableCheck.rows[0].exists) {
      console.log('⚠️ Table carburant n\'existe pas, création en cours...')
      
      // Créer la table carburant
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS carburant (
          id SERIAL PRIMARY KEY,
          numero_carte VARCHAR(50) UNIQUE NOT NULL,
          montant DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          date_livraison DATE NOT NULL,
          statut VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_carburant_numero_carte ON carburant(numero_carte);
      `)
      console.log('✅ Table carburant créée avec succès')
    }
    
    // Vérifier si la table carburant_assignations existe
    const assignationsTableCheck = await dbPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'carburant_assignations'
      );
    `)
    
    if (!assignationsTableCheck.rows[0].exists) {
      console.log('⚠️ Table carburant_assignations n\'existe pas, création en cours...')
      
      // Créer la table carburant_assignations
      await dbPool.query(`
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
    
    // Query pour récupérer l'historique des mouvements de cartes avec consommation par période
    let query = `
      WITH card_movements AS (
        SELECT 
          ca.id as assignation_id,
          ca.numero_carte,
          ca.employe_id,
          ca.employe_nom,
          ca.date_assignation,
          COALESCE(ca.date_fin, CURRENT_DATE) as date_fin_effective,
          ca.statut as assignation_statut,
          ca.commentaires as transfer_comments,
          e.nom as employe_nom_complet,
          e.prenom as employe_prenom_complet,
          e.matricule,
          c.montant as carte_montant,
          c.date_livraison as carte_date_livraison,
          c.statut as carte_statut,
          ca.created_at as mouvement_date,
          ca.updated_at as last_update
        FROM carburant_assignations ca
        LEFT JOIN employes e ON ca.employe_id = e.id
        LEFT JOIN carburant c ON ca.numero_carte = c.numero_carte
        ORDER BY ca.numero_carte, ca.date_assignation
      ),
      consommation_per_period AS (
        SELECT 
          cm.assignation_id,
          cm.numero_carte,
          cm.employe_id,
          cm.employe_nom_complet,
          cm.employe_prenom_complet,
          cm.matricule,
          cm.date_assignation,
          cm.date_fin_effective,
          cm.mouvement_date,
          cm.transfer_comments,
          cm.last_update,
          COALESCE(SUM(
            CASE 
              WHEN TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= cm.date_assignation 
               AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= cm.date_fin_effective
              THEN COALESCE(CAST(cc.ca_ttc AS DECIMAL), 0)
              ELSE 0
            END
          ), 0) as consommation_periode,
          COUNT(
            CASE 
              WHEN TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= cm.date_assignation 
               AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= cm.date_fin_effective
              THEN 1
              ELSE NULL
            END
          ) as nombre_transactions_periode
        FROM card_movements cm
        LEFT JOIN carburant_consommation cc ON cm.numero_carte = cc.numero_carte
        GROUP BY cm.assignation_id, cm.numero_carte, cm.employe_id, 
                 cm.employe_nom_complet, cm.employe_prenom_complet, cm.matricule,
                 cm.date_assignation, cm.date_fin_effective, cm.mouvement_date,
                 cm.transfer_comments, cm.last_update
      )
      SELECT 
        cpp.*,
        cm.carte_montant,
        cm.carte_date_livraison,
        cm.carte_statut,
        cm.assignation_statut
      FROM consommation_per_period cpp
      LEFT JOIN card_movements cm ON cpp.assignation_id = cm.assignation_id
    `
    
    const params = []
    
    if (employeId) {
      query += ` WHERE cpp.employe_id = $1`
      params.push(employeId)
    }
    
    query += ` ORDER BY cpp.numero_carte, cpp.date_assignation DESC`
    
    const startTime = Date.now()
    const pool = getPool()
    const result = await pool.query(query, params)
    const duration = Date.now() - startTime
    
    console.log(`📊 Query executed in ${duration}ms: ${query.substring(0, 100)}...`)
    
    // Calculer la consommation totale par employé et l'historique des mouvements
    const employeConsumption = {}
    const cardMovements = {}
    
    result.rows.forEach(row => {
      // Traitement par employé
      if (!employeConsumption[row.employe_id]) {
        employeConsumption[row.employe_id] = {
          employe_id: row.employe_id,
          employe_nom: row.employe_nom_complet,
          employe_prenom: row.employe_prenom_complet,
          matricule: row.matricule,
          total_consomme_toutes_cartes: 0,
          nombre_cartes_utilisees: 0,
          nombre_periodes_assignation: 0,
          historique_cartes: []
        }
      }
      
      employeConsumption[row.employe_id].total_consomme_toutes_cartes += parseFloat(row.consommation_periode || 0)
      employeConsumption[row.employe_id].nombre_periodes_assignation += 1
      
      // Traitement par carte pour l'historique des mouvements
      if (!cardMovements[row.numero_carte]) {
        cardMovements[row.numero_carte] = {
          numero_carte: row.numero_carte,
          carte_montant: row.carte_montant,
          carte_date_livraison: row.carte_date_livraison,
          carte_statut: row.carte_statut,
          mouvements: [],
          consommation_totale_carte: 0
        }
      }
      
      cardMovements[row.numero_carte].mouvements.push({
        assignation_id: row.assignation_id,
        employe_id: row.employe_id,
        employe_nom: row.employe_nom_complet,
        employe_prenom: row.employe_prenom_complet,
        matricule: row.matricule,
        date_assignation: row.date_assignation,
        date_fin: row.date_fin_effective,
        statut: row.assignation_statut,
        consommation_periode: parseFloat(row.consommation_periode || 0),
        nombre_transactions_periode: row.nombre_transactions_periode,
        mouvement_date: row.mouvement_date,
        transfer_comments: row.transfer_comments,
        last_update: row.last_update
      })
      
      cardMovements[row.numero_carte].consommation_totale_carte += parseFloat(row.consommation_periode || 0)
      
      // Ajouter à l'historique des cartes de l'employé
      employeConsumption[row.employe_id].historique_cartes.push({
        numero_carte: row.numero_carte,
        date_assignation: row.date_assignation,
        date_fin: row.date_fin_effective,
        statut: row.assignation_statut,
        consommation_periode: parseFloat(row.consommation_periode || 0),
        nombre_transactions_periode: row.nombre_transactions_periode,
        mouvement_date: row.mouvement_date,
        transfer_comments: row.transfer_comments,
        last_update: row.last_update
      })
    })
    
    // Compter le nombre de cartes uniques par employé
    Object.values(employeConsumption).forEach(emp => {
      const cartesUniques = new Set(emp.historique_cartes.map(c => c.numero_carte))
      emp.nombre_cartes_utilisees = cartesUniques.size
    })
    
    return NextResponse.json({
      assignations: result.rows,
      consommation_par_employe: Object.values(employeConsumption),
      historique_mouvements_cartes: Object.values(cardMovements),
      resume: {
        total_employes: Object.keys(employeConsumption).length,
        total_cartes: Object.keys(cardMovements).length,
        total_mouvements: result.rows.length
      }
    })
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    )
  }
}
