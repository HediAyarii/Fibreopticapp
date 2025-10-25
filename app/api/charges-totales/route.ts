import { query } from '@/lib/database'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Récupérer les charges totales par mois
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Dates de début et fin requises' }, { status: 400 })
    }

    // Extraire le mois et l'année des dates
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const startMonth = startDateObj.getMonth() + 1
    const startYear = startDateObj.getFullYear()
    const endMonth = endDateObj.getMonth() + 1
    const endYear = endDateObj.getFullYear()

    console.log(`🔍 Recherche des charges pour la période: ${startMonth}/${startYear} à ${endMonth}/${endYear}`)

    // Récupérer les charges fixes (toujours actives)
    const fixedCostsResult = await query(`
      SELECT 
        SUM(amount) as total_fixed_costs
      FROM fixed_costs 
      WHERE is_active = true
    `)

    // Récupérer les charges variables depuis frais_entreprise
    const variableCostsResult = await query(`
      SELECT 
        EXTRACT(MONTH FROM date_facture) as month,
        EXTRACT(YEAR FROM date_facture) as year,
        SUM(montant_ttc) as total_variable_costs,
        COUNT(*) as nombre_charges_variables
      FROM frais_entreprise 
      WHERE date_facture >= $1::date 
        AND date_facture <= $2::date
        AND statut = 'actif'
        AND type_frais = 'Charge Variable'
      GROUP BY EXTRACT(MONTH FROM date_facture), EXTRACT(YEAR FROM date_facture)
      ORDER BY year, month
    `, [startDate, endDate])

    // Ne plus inclure les frais d'entreprise dans le calcul
    const fraisEntrepriseResult = { rows: [] }

    const totalFixedCosts = Number(fixedCostsResult.rows[0]?.total_fixed_costs || 0)
    const variableCostsByMonth = variableCostsResult.rows
    const fraisEntrepriseByMonth = fraisEntrepriseResult.rows

    // Créer un objet pour regrouper toutes les charges par mois
    const chargesByMonth: { [key: string]: any } = {}

    // Ajouter les charges fixes à chaque mois de la période
    const currentDate = new Date(startDate)
    const endDateForLoop = new Date(endDate)
    
    while (currentDate <= endDateForLoop) {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      const key = `${year}-${month.toString().padStart(2, '0')}`
      
      if (!chargesByMonth[key]) {
        chargesByMonth[key] = {
          month,
          year,
          total_fixed_costs: totalFixedCosts,
          total_variable_costs: 0,
          total_frais_entreprise: 0,
          total_charges: totalFixedCosts,
          nombre_charges_variables: 0,
          nombre_frais: 0
        }
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Ajouter les charges variables
    variableCostsByMonth.forEach((row: any) => {
      const key = `${row.year}-${row.month.toString().padStart(2, '0')}`
      if (chargesByMonth[key]) {
        chargesByMonth[key].total_variable_costs = Number(row.total_variable_costs || 0)
        chargesByMonth[key].nombre_charges_variables = Number(row.nombre_charges_variables || 0)
        chargesByMonth[key].total_charges += Number(row.total_variable_costs || 0)
      }
    })

    // Les frais d'entreprise ne sont plus inclus

    // Convertir en tableau et trier
    const chargesArray = Object.values(chargesByMonth).sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })

    // Calculer les totaux globaux
    const totalChargesFixes = totalFixedCosts * chargesArray.length
    const totalChargesVariables = chargesArray.reduce((sum: number, month: any) => sum + month.total_variable_costs, 0)
    const totalFraisEntreprise = 0 // Plus inclus
    const totalChargesGlobal = totalChargesFixes + totalChargesVariables

    console.log(`✅ Charges récupérées: ${chargesArray.length} mois, Total: ${totalChargesGlobal}€`)

    return NextResponse.json({
      success: true,
      chargesByMonth: chargesArray,
      summary: {
        totalChargesFixes,
        totalChargesVariables,
        totalFraisEntreprise,
        totalChargesGlobal,
        nombreMois: chargesArray.length
      }
    })

  } catch (error) {
    console.error('Erreur récupération charges:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
