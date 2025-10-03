import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date_debut = searchParams.get('date_debut')
    const date_fin = searchParams.get('date_fin')
    const employe_id = searchParams.get('employe_id')
    const numero_carte = searchParams.get('numero_carte')

    console.log('Paramètres reçus:', { date_debut, date_fin, employe_id, numero_carte })

    // Requête pour récupérer les consommations avec l'historique des assignations
    let consommationQuery = `
      SELECT 
        cc.*,
        ca.employe_id,
        ca.employe_nom,
        ca.date_debut as assignation_debut,
        ca.date_fin_prevue as assignation_fin_prevue,
        ca.date_fin_reelle as assignation_fin_reelle,
        CASE 
          WHEN ca.date_fin_reelle IS NOT NULL THEN ca.date_fin_reelle
          WHEN ca.date_fin_prevue IS NOT NULL THEN ca.date_fin_prevue
          ELSE '2099-12-31'::DATE
        END as assignation_fin_effective
      FROM carburant_consommation cc
      LEFT JOIN carburant_assignations ca ON (
        cc.numero_carte = ca.numero_carte 
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= ca.date_debut 
        AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= CASE 
          WHEN ca.date_fin_reelle IS NOT NULL THEN ca.date_fin_reelle
          WHEN ca.date_fin_prevue IS NOT NULL THEN ca.date_fin_prevue
          ELSE '2099-12-31'::DATE
        END
        AND ca.statut = 'active'
      )
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    // Filtrer par date de début
    if (date_debut) {
      consommationQuery += ` AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') >= $${paramIndex}`
      params.push(date_debut)
      paramIndex++
    }

    // Filtrer par date de fin
    if (date_fin) {
      consommationQuery += ` AND TO_DATE(cc.date_livraison, 'DD.MM.YYYY') <= $${paramIndex}`
      params.push(date_fin)
      paramIndex++
    }

    // Filtrer par employé
    if (employe_id) {
      consommationQuery += ` AND ca.employe_id = $${paramIndex}`
      params.push(parseInt(employe_id))
      paramIndex++
    }

    // Filtrer par numéro de carte
    if (numero_carte) {
      consommationQuery += ` AND cc.numero_carte = $${paramIndex}`
      params.push(numero_carte)
      paramIndex++
    }

    consommationQuery += ` ORDER BY TO_DATE(cc.date_livraison, 'DD.MM.YYYY') DESC, cc.heure_livraison DESC`

    console.log('Requête SQL:', consommationQuery)
    console.log('Paramètres:', params)

    const result = await query(consommationQuery, params)

    // Traitement des données
    const consommations = result.rows.map(row => ({
      ...row,
      ca_ttc: row.ca_ttc ? parseFloat(row.ca_ttc.toString().replace(',', '.')) : 0,
      ca_ht: row.ca_ht ? parseFloat(row.ca_ht.toString().replace(',', '.')) : 0,
      tva: row.tva ? parseFloat(row.tva.toString().replace(',', '.')) : 0,
      quantite: row.quantite ? parseFloat(row.quantite.toString().replace(',', '.')) : 0,
      // Indicateur si l'assignation était active à cette date
      assignation_valide: !!row.employe_id
    }))

    // Statistiques globales
    const stats = {
      total_consommations: consommations.length,
      total_montant_ttc: consommations.reduce((sum, c) => sum + c.ca_ttc, 0),
      total_quantite: consommations.reduce((sum, c) => sum + c.quantite, 0),
      consommations_avec_assignation: consommations.filter(c => c.assignation_valide).length,
      consommations_sans_assignation: consommations.filter(c => !c.assignation_valide).length
    }

    // Groupement par employé
    const parEmploye = consommations
      .filter(c => c.assignation_valide)
      .reduce((acc, consommation) => {
        const key = `${consommation.employe_id}-${consommation.employe_nom}`
        if (!acc[key]) {
          acc[key] = {
            employe_id: consommation.employe_id,
            employe_nom: consommation.employe_nom,
            consommations: [],
            total_montant: 0,
            total_quantite: 0
          }
        }
        acc[key].consommations.push(consommation)
        acc[key].total_montant += consommation.ca_ttc
        acc[key].total_quantite += consommation.quantite
        return acc
      }, {} as any)

    // Groupement par carte
    const parCarte = consommations.reduce((acc, consommation) => {
      const carte = consommation.numero_carte
      if (!acc[carte]) {
        acc[carte] = {
          numero_carte: carte,
          consommations: [],
          total_montant: 0,
          total_quantite: 0,
          employes_assignes: new Set()
        }
      }
      acc[carte].consommations.push(consommation)
      acc[carte].total_montant += consommation.ca_ttc
      acc[carte].total_quantite += consommation.quantite
      if (consommation.employe_nom) {
        acc[carte].employes_assignes.add(consommation.employe_nom)
      }
      return acc
    }, {} as any)

    // Convertir les Sets en arrays
    Object.values(parCarte).forEach((carte: any) => {
      carte.employes_assignes = Array.from(carte.employes_assignes)
    })

    return NextResponse.json({
      success: true,
      consommations,
      stats,
      parEmploye: Object.values(parEmploye),
      parCarte: Object.values(parCarte),
      filtres_appliques: {
        date_debut,
        date_fin,
        employe_id,
        numero_carte
      }
    })

  } catch (error) {
    console.error('Erreur API consommation carburant historique:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des consommations',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
