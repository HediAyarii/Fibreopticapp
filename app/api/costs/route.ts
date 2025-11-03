import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export const dynamic = 'force-dynamic'

// Fonction pour mettre à jour les mois suivants (seulement les mois futurs)
async function updateFutureMonths(name: string, amount: number, description: string, startMonth: number, startYear: number) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  console.log(`🔄 updateFutureMonths: ${name}, ${amount} DT, à partir de ${startMonth}/${startYear}`)
  
  // Limiter à 6 mois maximum pour éviter de créer trop de charges
  const maxMonths = 6
  
  // Calculer les mois suivants à partir du mois sélectionné
  for (let i = 1; i <= maxMonths; i++) { // Commencer à 1 pour éviter le mois de départ
    let targetMonth = startMonth + i
    let targetYear = startYear
    
    // Gérer le passage d'année
    while (targetMonth > 12) {
      targetMonth -= 12
      targetYear += 1
    }
    
    // Ne pas créer de charges pour les mois passés
    if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
      console.log(`   ⏭️ Mois passé ignoré: ${targetMonth}/${targetYear}`)
      continue
    }
    
    console.log(`   📅 Traitement du mois: ${targetMonth}/${targetYear}`)
    
    // Vérifier si une charge existe déjà pour ce mois
    const existingCharge = await query(`
      SELECT id FROM frais_entreprise 
      WHERE fournisseur = $1 
      AND type_frais = 'Charge Fixe'
      AND EXTRACT(MONTH FROM date_facture) = $2 
      AND EXTRACT(YEAR FROM date_facture) = $3
      AND statut = 'actif'
    `, [name, targetMonth, targetYear])
    
    if (existingCharge.rows.length > 0) {
      // Mettre à jour la charge existante
      await query(`
        UPDATE frais_entreprise 
        SET 
          montant_ht = $1,
          montant_ttc = $2,
          tva = $3,
          description = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva (limité à 999.99)
        description,
        existingCharge.rows[0].id
      ])
      console.log(`   ✅ Mise à jour: ${targetMonth}/${targetYear} (${amount} DT)`)
    } else {
      // Créer une nouvelle charge pour ce mois
      const targetDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
      const serviceCode = `FIXED-${targetYear}-${targetMonth.toString().padStart(2, '0')}`
      
      await query(`
        INSERT INTO frais_entreprise (
          company_name, service_code, category, numero_facture, date_facture,
          fournisseur, type_frais, montant_ht, montant_ttc, tva, description, statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'actif')
      `, [
        'FinalFibre', // company_name
        serviceCode, // service_code
        'Frais généraux', // category
        `FACT-${Date.now()}-${i}`, // numero_facture
        targetDate, // date_facture
        name, // fournisseur
        'Charge Fixe', // type_frais
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva (limité à 999.99)
        description, // description
      ])
      console.log(`   ✅ Créé: ${targetMonth}/${targetYear} (${amount} DT) - ${serviceCode}`)
    }
  }
}

// Fonction pour mettre à jour les charges fixes pour les mois futurs uniquement
// Fonction pour créer des charges fixes pour les mois futurs (limité à 12 mois)
async function createFixedChargesForFutureMonths(name: string, amount: number, description: string, startMonth: number, startYear: number) {
  console.log(`🔄 createFixedChargesForFutureMonths: ${name}, ${amount} DT, à partir de ${startMonth}/${startYear}`)
  
  // Limiter à 12 mois maximum pour éviter de créer trop de charges
  const maxMonths = 12
  
  for (let i = 1; i <= maxMonths; i++) {
    let targetMonth = startMonth + i
    let targetYear = startYear
    
    // Gérer le passage d'année
    while (targetMonth > 12) {
      targetMonth -= 12
      targetYear += 1
    }
    
    const targetDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
    const serviceCode = `FIXED-${targetYear}-${targetMonth.toString().padStart(2, '0')}`
    
    // Vérifier si une charge existe déjà pour ce mois
    const existingCharge = await query(`
      SELECT id FROM frais_entreprise 
      WHERE fournisseur = $1 
      AND type_frais = 'Charge Fixe'
      AND EXTRACT(MONTH FROM date_facture) = $2 
      AND EXTRACT(YEAR FROM date_facture) = $3
      AND statut = 'actif'
    `, [name, targetMonth, targetYear])
    
    if (existingCharge.rows.length > 0) {
      // Mettre à jour la charge existante
      await query(`
        UPDATE frais_entreprise 
        SET 
          montant_ht = $1,
          montant_ttc = $2,
          tva = $3,
          description = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva
        description,
        existingCharge.rows[0].id
      ])
      console.log(`   ✅ Mise à jour: ${targetMonth}/${targetYear} (${amount} DT)`)
    } else {
      // Créer une nouvelle charge pour ce mois
      await query(`
        INSERT INTO frais_entreprise (
          company_name, service_code, category, numero_facture, date_facture,
          fournisseur, type_frais, montant_ht, montant_ttc, tva, description, statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'actif')
      `, [
        'FinalFibre', // company_name
        serviceCode, // service_code
        'Frais généraux', // category
        `FACT-${Date.now()}-${i}`, // numero_facture
        targetDate, // date_facture
        name, // fournisseur
        'Charge Fixe', // type_frais
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva
        description, // description
      ])
      console.log(`   ✅ Créé: ${targetMonth}/${targetYear} (${amount} DT) - ${serviceCode}`)
    }
  }
}

async function updateFixedChargeForFutureMonths(name: string, amount: number, description: string, startMonth: number, startYear: number) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  console.log(`🔄 updateFixedChargeForFutureMonths: ${name}, ${amount} DT, à partir de ${startMonth}/${startYear}`)
  
  // Limiter à 12 mois maximum pour éviter de créer trop de charges
  const maxMonths = 12
  
  // Calculer les mois suivants à partir du mois sélectionné (exclure le mois de départ)
  for (let i = 1; i <= maxMonths; i++) {
    let targetMonth = startMonth + i
    let targetYear = startYear
    
    // Gérer le passage d'année
    while (targetMonth > 12) {
      targetMonth -= 12
      targetYear += 1
    }
    
    // Ne pas créer de charges pour les mois passés
    if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
      console.log(`   ⏭️ Mois passé ignoré: ${targetMonth}/${targetYear}`)
      continue
    }
    
    console.log(`   📅 Traitement du mois futur: ${targetMonth}/${targetYear}`)
    
    // Vérifier si une charge existe déjà pour ce mois
    const existingCharge = await query(`
      SELECT id FROM frais_entreprise 
      WHERE fournisseur = $1 
      AND type_frais = 'Charge Fixe'
      AND EXTRACT(MONTH FROM date_facture) = $2 
      AND EXTRACT(YEAR FROM date_facture) = $3
      AND statut = 'actif'
    `, [name, targetMonth, targetYear])
    
    if (existingCharge.rows.length > 0) {
      // Mettre à jour la charge existante pour les mois futurs
      await query(`
        UPDATE frais_entreprise 
        SET 
          montant_ht = $1,
          montant_ttc = $2,
          tva = $3,
          description = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva (limité à 999.99)
        description,
        existingCharge.rows[0].id
      ])
      console.log(`   ✅ Mise à jour mois futur: ${targetMonth}/${targetYear} (${amount} DT)`)
    } else {
      // Créer une nouvelle charge pour ce mois futur
      const targetDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
      const serviceCode = `FIXED-${targetYear}-${targetMonth.toString().padStart(2, '0')}`
      
      await query(`
        INSERT INTO frais_entreprise (
          company_name, service_code, category, numero_facture, date_facture,
          fournisseur, type_frais, montant_ht, montant_ttc, tva, description, statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'actif')
      `, [
        'FinalFibre', // company_name
        serviceCode, // service_code
        'Frais généraux', // category
        `FACT-${Date.now()}-${i}`, // numero_facture
        targetDate, // date_facture
        name, // fournisseur
        'Charge Fixe', // type_frais
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva (limité à 999.99)
        description, // description
      ])
      console.log(`   ✅ Créé mois futur: ${targetMonth}/${targetYear} (${amount} DT) - ${serviceCode}`)
    }
  }
}

// Fonction pour mettre à jour seulement les mois suivants (pas les mois précédents)
async function updateOnlyFutureMonths(name: string, amount: number, description: string, startMonth: number, startYear: number) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  console.log(`🔄 updateOnlyFutureMonths: ${name}, ${amount} DT, à partir de ${startMonth}/${startYear}`)
  
  // Vérifier si le mois de départ est dans le futur
  if (startYear < currentYear || (startYear === currentYear && startMonth <= currentMonth)) {
    console.log(`   ⏭️ Mois de départ dans le passé ou présent, pas de création de charges futures`)
    return
  }
  
  // Limiter à 6 mois maximum pour éviter de créer trop de charges
  const maxMonths = 6
  
  // Calculer les mois suivants à partir du mois sélectionné
  for (let i = 1; i <= maxMonths; i++) { // Commencer à 1 pour éviter le mois de départ
    let targetMonth = startMonth + i
    let targetYear = startYear
    
    // Gérer le passage d'année
    while (targetMonth > 12) {
      targetMonth -= 12
      targetYear += 1
    }
    
    // Ne pas créer de charges pour les mois passés
    if (targetYear < currentYear || (targetYear === currentYear && targetMonth < currentMonth)) {
      console.log(`   ⏭️ Mois passé ignoré: ${targetMonth}/${targetYear}`)
      continue
    }
    
    console.log(`   📅 Traitement du mois: ${targetMonth}/${targetYear}`)
    
    // Vérifier si une charge existe déjà pour ce mois
    const existingCharge = await query(`
      SELECT id FROM frais_entreprise 
      WHERE fournisseur = $1 
      AND type_frais = 'Charge Fixe'
      AND EXTRACT(MONTH FROM date_facture) = $2 
      AND EXTRACT(YEAR FROM date_facture) = $3
      AND statut = 'actif'
    `, [name, targetMonth, targetYear])
    
    if (existingCharge.rows.length > 0) {
      // Mettre à jour la charge existante
      await query(`
        UPDATE frais_entreprise 
        SET 
          montant_ht = $1,
          montant_ttc = $2,
          tva = $3,
          description = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva (limité à 999.99)
        description,
        existingCharge.rows[0].id
      ])
      console.log(`   ✅ Mise à jour: ${targetMonth}/${targetYear} (${amount} DT)`)
    } else {
      // Créer une nouvelle charge pour ce mois
      const targetDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
      const serviceCode = `FIXED-${targetYear}-${targetMonth.toString().padStart(2, '0')}`
      
      await query(`
        INSERT INTO frais_entreprise (
          company_name, service_code, category, numero_facture, date_facture,
          fournisseur, type_frais, montant_ht, montant_ttc, tva, description, statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'actif')
      `, [
        'FinalFibre', // company_name
        serviceCode, // service_code
        'Frais généraux', // category
        `FACT-${Date.now()}-${i}`, // numero_facture
        targetDate, // date_facture
        name, // fournisseur
        'Charge Fixe', // type_frais
        amount * 0.8, // montant_ht
        amount, // montant_ttc
        Math.min(amount * 0.2, 999.99), // tva (limité à 999.99)
        description, // description
      ])
      console.log(`   ✅ Créé: ${targetMonth}/${targetYear} (${amount} DT) - ${serviceCode}`)
    }
  }
}

// GET - Récupérer tous les coûts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type') // 'fixed', 'variable', 'all'

    let result

    if (type === 'fixed') {
      // Récupérer les coûts fixes depuis la table fixed_costs
      result = await query(`
        SELECT 
          id,
          name,
          description,
          amount,
          category,
          created_at,
          updated_at,
          is_active,
          frequency,
          attribution
        FROM fixed_costs 
        WHERE is_active = true
        ORDER BY name
      `)
    } else if (type === 'variable' && month && year) {
      // Récupérer les coûts variables pour un mois spécifique depuis frais_entreprise
      result = await query(`
        SELECT 
          id,
          fournisseur as name,
          description,
          montant_ttc as amount,
          type_frais as category,
          date_facture as date_facturation,
          statut,
          attribution,
          created_at,
          updated_at
        FROM frais_entreprise 
        WHERE EXTRACT(MONTH FROM date_facture) = $1 
        AND EXTRACT(YEAR FROM date_facture) = $2
        AND type_frais = 'Charge Variable'
        ORDER BY fournisseur
      `, [parseInt(month), parseInt(year)])
    } else {
      // Récupérer tous les frais
      result = await query(`
        SELECT 
          id,
          fournisseur as name,
          description,
          montant_ttc as amount,
          type_frais as category,
          date_facture as date_facturation,
          statut,
          created_at,
          updated_at
        FROM frais_entreprise 
        ORDER BY date_facture DESC
        LIMIT 100
      `)
    }

    return NextResponse.json({
      success: true,
      costs: result.rows
    })

  } catch (error) {
    console.error('Erreur récupération coûts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Créer un nouveau coût
export async function POST(request: NextRequest) {
  try {
    const { name, description, amount, category, type, month, year, attribution } = await request.json()

    if (!name || !amount || !category || !type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Valider l'attribution
    const validAttributions = ['AXECOM', 'ERT', 'LES_DEUX']
    const selectedAttribution = attribution || 'LES_DEUX'
    if (!validAttributions.includes(selectedAttribution)) {
      return NextResponse.json({ error: 'Attribution invalide' }, { status: 400 })
    }

    // Créer une date de facturation
    let dateFacturation
    if (month && year) {
      dateFacturation = `${year}-${month.toString().padStart(2, '0')}-01`
    } else {
      const now = new Date()
      dateFacturation = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
    }

    // Déterminer le type de frais et le service code
    let serviceCode, typeFrais
    if (type === 'fixed') {
      // Pour les charges fixes, inclure le mois et l'année dans le service code
      const currentMonth = month || new Date().getMonth() + 1
      const currentYear = year || new Date().getFullYear()
      serviceCode = `FIXED-${currentYear}-${currentMonth.toString().padStart(2, '0')}`
      typeFrais = 'Charge Fixe'
    } else if (type === 'variable') {
      serviceCode = 'VAR-001'
      typeFrais = 'Charge Variable'
    } else {
      return NextResponse.json({ error: 'Type de charge invalide' }, { status: 400 })
    }

    // Pour les charges fixes, utiliser la table fixed_costs
    if (type === 'fixed') {
      // Vérifier s'il existe déjà une charge avec le même nom
      const existingFixed = await query(`
        SELECT id FROM fixed_costs 
        WHERE name = $1 AND is_active = true
      `, [name])
      
      let result
      
      if (existingFixed.rows.length > 0) {
        // Mettre à jour cette charge fixe
        result = await query(`
          UPDATE fixed_costs 
          SET 
            amount = $1,
            description = $2,
            category = $3,
            attribution = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *
        `, [
          parseFloat(amount),
          description,
          category,
          selectedAttribution,
          existingFixed.rows[0].id
        ])
      } else {
        // Créer une nouvelle charge fixe
        result = await query(`
          INSERT INTO fixed_costs (
            name,
            description,
            amount,
            category,
            is_active,
            frequency,
            attribution
          )
          VALUES ($1, $2, $3, $4, true, 'monthly', $5)
          RETURNING *
        `, [
          name,
          description,
          parseFloat(amount),
          category,
          selectedAttribution
        ])
      }
      
      return NextResponse.json({
        success: true,
        cost: result.rows[0],
        attribution: selectedAttribution,
        message: `Charge fixe ${existingFixed.rows.length > 0 ? 'mise à jour' : 'créée'} avec succès pour ${selectedAttribution}`
      })
    }

    // Gérer l'attribution (AXECOM, ERT, ou LES_DEUX)
    const amountFloat = parseFloat(amount)
    const dividedAmount = selectedAttribution === 'LES_DEUX' ? amountFloat / 2 : amountFloat

    let results = []

    // Créer un frais dans la table frais_entreprise
    const fraisEntrepriseResult = await query(`
      INSERT INTO frais_entreprise (
        company_name,
        service_code,
        category,
        numero_facture,
        date_facture,
        fournisseur,
        type_frais,
        montant_ht,
        montant_ttc,
        tva,
        description,
        statut,
        attribution
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'actif', $12)
      RETURNING *
    `, [
      'FinalFibre', // company_name
      serviceCode, // service_code
      category, // category
      `FACT-${Date.now()}`, // numero_facture
      dateFacturation, // date_facture
      name, // fournisseur
      typeFrais, // type_frais
      dividedAmount * 0.8, // montant_ht (80% du montant TTC)
      dividedAmount, // montant_ttc
      dividedAmount * 0.2, // tva (20% du montant TTC)
      description, // description
      selectedAttribution // attribution
    ])
    results.push(fraisEntrepriseResult.rows[0])

    // Si AXECOM ou LES_DEUX, créer dans frais_axecom
    if (selectedAttribution === 'AXECOM' || selectedAttribution === 'LES_DEUX') {
      const axecomResult = await query(`
        INSERT INTO frais_axecom (
          article,
          intitule,
          description,
          montant_ht,
          montant_ttc,
          tva,
          date_facture,
          type_frais,
          statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'actif')
        RETURNING *
      `, [
        serviceCode, // article
        name, // intitule
        description, // description
        dividedAmount * 0.8, // montant_ht
        dividedAmount, // montant_ttc
        dividedAmount * 0.2, // tva
        dateFacturation, // date_facture
        typeFrais // type_frais
      ])
      results.push(axecomResult.rows[0])
    }

    // Si ERT ou LES_DEUX, créer dans frais_ert
    if (selectedAttribution === 'ERT' || selectedAttribution === 'LES_DEUX') {
      const ertResult = await query(`
        INSERT INTO frais_ert (
          article,
          intitule,
          description,
          montant_ht,
          montant_ttc,
          tva,
          date_facture,
          type_frais,
          statut
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'actif')
        RETURNING *
      `, [
        serviceCode, // article
        name, // intitule
        description, // description
        dividedAmount * 0.8, // montant_ht
        dividedAmount, // montant_ttc
        dividedAmount * 0.2, // tva
        dateFacturation, // date_facture
        typeFrais // type_frais
      ])
      results.push(ertResult.rows[0])
    }

    return NextResponse.json({
      success: true,
      costs: results,
      attribution: selectedAttribution,
      message: selectedAttribution === 'LES_DEUX' 
        ? `Charge ${type === 'fixed' ? 'fixe' : 'variable'} créée et divisée entre AXECOM et ERT (${dividedAmount.toFixed(2)}€ chacun)`
        : `Charge ${type === 'fixed' ? 'fixe' : 'variable'} créée pour ${selectedAttribution}`
    })

  } catch (error) {
    console.error('Erreur création charge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT - Mettre à jour un coût
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, amount, category, month, year, type } = await request.json()

    if (!id || !name || !amount || !category) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier d'abord si le frais existe
    const existingCost = await query(`
      SELECT id, fournisseur, type_frais, date_facture FROM frais_entreprise WHERE id = $1
    `, [parseInt(id)])
    
    if (existingCost.rows.length === 0) {
      return NextResponse.json({ error: 'Charge non trouvée' }, { status: 404 })
    }

    // Créer une date de facturation
    let dateFacturation
    if (month && year) {
      dateFacturation = `${year}-${month.toString().padStart(2, '0')}-01`
    } else {
      const now = new Date()
      dateFacturation = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
    }

    // Mettre à jour le frais
    const result = await query(`
      UPDATE frais_entreprise 
      SET 
        fournisseur = $1, 
        description = $2, 
        montant_ht = $3,
        montant_ttc = $4,
        tva = $5,
        type_frais = $6, 
        date_facture = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      name, 
      description, 
      parseFloat(amount) * 0.8, // montant_ht
      parseFloat(amount), // montant_ttc
      Math.min(parseFloat(amount) * 0.2, 999.99), // tva (limité à 999.99)
      category, 
      dateFacturation, 
      parseInt(id)
    ])

    // Pour les charges fixes, NE PAS créer de charges futures lors de la modification
    // La modification ne doit affecter que la charge spécifique modifiée
    if (type === 'fixed' && month && year) {
      console.log(`⏭️ Modification d'une charge fixe - pas de création de charges futures`)
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      cost: result.rows[0],
      message: 'Charge mise à jour avec succès'
    })

  } catch (error) {
    console.error('Erreur mise à jour charge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Supprimer un coût
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) {
      return NextResponse.json({ error: 'ID et type requis' }, { status: 400 })
    }

    // Vérifier d'abord si la charge existe
    let existingCost
    if (type === 'fixed') {
      existingCost = await query(`
        SELECT id, name, is_active FROM fixed_costs WHERE id = $1
      `, [parseInt(id)])
    } else {
      existingCost = await query(`
        SELECT id, fournisseur, statut, type_frais FROM frais_entreprise WHERE id = $1
      `, [parseInt(id)])
    }
    
    if (existingCost.rows.length === 0) {
      return NextResponse.json({ error: 'Charge non trouvée' }, { status: 404 })
    }
    
    const cost = existingCost.rows[0]
    
    if (type === 'fixed') {
      // Si déjà désactivé, retourner un message approprié
      if (!cost.is_active) {
        return NextResponse.json({ 
          success: true,
          message: 'Charge déjà désactivée',
          cost: cost
        })
      }
    } else {
      // Vérifier que le type correspond pour les charges variables
      if (cost.type_frais !== 'Charge Variable') {
        return NextResponse.json({ 
          error: `Type de charge incorrect. Attendu: Charge Variable, trouvé: ${cost.type_frais}` 
        }, { status: 400 })
      }
      
      // Si déjà désactivé, retourner un message approprié
      if (cost.statut === 'inactif') {
        return NextResponse.json({ 
          success: true,
          message: 'Charge déjà désactivée',
          cost: cost
        })
      }
    }
    
    // Pour les charges variables, supprimer complètement
    // Pour les charges fixes, désactiver seulement
    let result
    if (type === 'variable') {
      result = await query(`
        DELETE FROM frais_entreprise 
        WHERE id = $1 AND type_frais = 'Charge Variable'
        RETURNING *
      `, [parseInt(id)])
    } else {
      result = await query(`
        UPDATE fixed_costs 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
      `, [parseInt(id)])
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Aucune modification effectuée' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: type === 'variable' ? 'Charge variable supprimée avec succès' : 'Charge fixe désactivée avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression charge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
