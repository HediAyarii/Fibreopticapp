import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// GET - Récupérer les primes pour un cout_par_salaire_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coutParSalaireId = searchParams.get('cout_par_salaire_id')
    const matricule = searchParams.get('matricule')
    
    let whereClause = ''
    const params: any[] = []
    
    if (coutParSalaireId) {
      whereClause = 'WHERE cout_par_salaire_id = $1'
      params.push(parseInt(coutParSalaireId))
    } else if (matricule) {
      whereClause = 'WHERE matricule = $1'
      params.push(matricule)
    }
    
    const result = await query(`
      SELECT 
        id,
        cout_par_salaire_id,
        matricule,
        montant,
        note,
        deduit_rap,
        date_prime,
        created_at,
        updated_at
      FROM primes_employes
      ${whereClause}
      ORDER BY date_prime DESC, created_at DESC
    `, params)
    
    // Calculer les totaux
    let totalPrimes = 0
    let totalPrimesRap = 0
    let totalPrimesNonRap = 0
    
    result.rows.forEach((prime: any) => {
      const montant = parseFloat(prime.montant) || 0
      totalPrimes += montant
      if (prime.deduit_rap) {
        totalPrimesRap += montant
      } else {
        totalPrimesNonRap += montant
      }
    })
    
    return NextResponse.json({
      success: true,
      primes: result.rows,
      totaux: {
        total: totalPrimes,
        deduit_rap: totalPrimesRap,
        non_deduit_rap: totalPrimesNonRap
      }
    })
    
  } catch (error) {
    console.error("Erreur GET primes-employes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle prime
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { cout_par_salaire_id, matricule, montant, note, deduit_rap } = data
    
    if (!cout_par_salaire_id || montant === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'cout_par_salaire_id et montant sont requis' 
      }, { status: 400 })
    }
    
    const montantValue = parseFloat(montant) || 0
    if (montantValue <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Le montant doit être positif' 
      }, { status: 400 })
    }
    
    // Vérifier que le cout_par_salaire existe
    const coutCheck = await query(
      'SELECT id, matricule FROM cout_par_salaire WHERE id = $1',
      [cout_par_salaire_id]
    )
    
    if (coutCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Enregistrement cout_par_salaire non trouvé' 
      }, { status: 404 })
    }
    
    // Utiliser le matricule du cout_par_salaire si non fourni
    const matriculeValue = matricule || coutCheck.rows[0].matricule
    
    // Insérer la prime
    const result = await query(`
      INSERT INTO primes_employes (
        cout_par_salaire_id,
        matricule,
        montant,
        note,
        deduit_rap,
        date_prime
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
      RETURNING *
    `, [
      cout_par_salaire_id,
      matriculeValue,
      montantValue,
      note || null,
      deduit_rap !== false // Par défaut true
    ])
    
    // Récupérer le nouveau total des primes
    const totalResult = await query(`
      SELECT 
        calculer_total_primes($1) as total_primes,
        calculer_total_primes_rap($1) as total_primes_rap
    `, [cout_par_salaire_id])
    
    return NextResponse.json({
      success: true,
      prime: result.rows[0],
      totaux: {
        total: parseFloat(totalResult.rows[0].total_primes) || 0,
        deduit_rap: parseFloat(totalResult.rows[0].total_primes_rap) || 0
      },
      message: `Prime de ${montantValue}€ ajoutée avec succès`
    })
    
  } catch (error) {
    console.error("Erreur POST primes-employes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// PUT - Mettre à jour une prime
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, montant, note, deduit_rap } = data
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de la prime requis' 
      }, { status: 400 })
    }
    
    // Construire la requête de mise à jour
    const updateFields: string[] = []
    const params: any[] = []
    let paramIndex = 1
    
    if (montant !== undefined) {
      updateFields.push(`montant = $${paramIndex}`)
      params.push(parseFloat(montant) || 0)
      paramIndex++
    }
    
    if (note !== undefined) {
      updateFields.push(`note = $${paramIndex}`)
      params.push(note)
      paramIndex++
    }
    
    if (deduit_rap !== undefined) {
      updateFields.push(`deduit_rap = $${paramIndex}`)
      params.push(deduit_rap)
      paramIndex++
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Aucune donnée à mettre à jour' 
      }, { status: 400 })
    }
    
    params.push(id)
    
    const result = await query(`
      UPDATE primes_employes 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, params)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prime non trouvée' 
      }, { status: 404 })
    }
    
    // Récupérer le nouveau total des primes
    const coutId = result.rows[0].cout_par_salaire_id
    const totalResult = await query(`
      SELECT 
        calculer_total_primes($1) as total_primes,
        calculer_total_primes_rap($1) as total_primes_rap
    `, [coutId])
    
    return NextResponse.json({
      success: true,
      prime: result.rows[0],
      totaux: {
        total: parseFloat(totalResult.rows[0].total_primes) || 0,
        deduit_rap: parseFloat(totalResult.rows[0].total_primes_rap) || 0
      }
    })
    
  } catch (error) {
    console.error("Erreur PUT primes-employes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// DELETE - Supprimer une prime
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de la prime requis' 
      }, { status: 400 })
    }
    
    // Récupérer le cout_par_salaire_id avant suppression
    const primeCheck = await query(
      'SELECT cout_par_salaire_id FROM primes_employes WHERE id = $1',
      [id]
    )
    
    if (primeCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prime non trouvée' 
      }, { status: 404 })
    }
    
    const coutId = primeCheck.rows[0].cout_par_salaire_id
    
    // Supprimer la prime
    await query('DELETE FROM primes_employes WHERE id = $1', [id])
    
    // Récupérer le nouveau total des primes
    const totalResult = await query(`
      SELECT 
        calculer_total_primes($1) as total_primes,
        calculer_total_primes_rap($1) as total_primes_rap
    `, [coutId])
    
    return NextResponse.json({
      success: true,
      message: 'Prime supprimée avec succès',
      totaux: {
        total: parseFloat(totalResult.rows[0].total_primes) || 0,
        deduit_rap: parseFloat(totalResult.rows[0].total_primes_rap) || 0
      }
    })
    
  } catch (error) {
    console.error("Erreur DELETE primes-employes:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
