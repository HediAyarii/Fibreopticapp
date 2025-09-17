import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

// Interface pour les souscriptions push
interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { subscription, employeeId } = await request.json()

    if (!subscription || !employeeId) {
      return NextResponse.json({ 
        success: false, 
        error: "Données de souscription manquantes" 
      }, { status: 400 })
    }

    // Vérifier que l'employé existe
    const employeeCheck = await query(
      'SELECT id FROM employes WHERE id = $1',
      [employeeId]
    )

    if (employeeCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Employé non trouvé" 
      }, { status: 404 })
    }

    // Supprimer l'ancienne souscription si elle existe
    await query(
      'DELETE FROM push_subscriptions WHERE employee_id = $1',
      [employeeId]
    )

    // Insérer la nouvelle souscription
    const result = await query(
      `INSERT INTO push_subscriptions (employee_id, endpoint, p256dh_key, auth_key, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [
        employeeId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth
      ]
    )

    console.log(`✅ Souscription push créée pour l'employé ${employeeId}`)

    return NextResponse.json({
      success: true,
      subscriptionId: result.rows[0].id,
      message: "Souscription push enregistrée avec succès"
    })

  } catch (error) {
    console.error("Erreur API push-subscription POST:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors de l'enregistrement de la souscription" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint, employeeId } = await request.json()

    if (!endpoint || !employeeId) {
      return NextResponse.json({ 
        success: false, 
        error: "Endpoint ou ID employé manquant" 
      }, { status: 400 })
    }

    // Supprimer la souscription
    const result = await query(
      'DELETE FROM push_subscriptions WHERE employee_id = $1 AND endpoint = $2',
      [employeeId, endpoint]
    )

    console.log(`✅ Souscription push supprimée pour l'employé ${employeeId}`)

    return NextResponse.json({
      success: true,
      message: "Souscription push supprimée avec succès"
    })

  } catch (error) {
    console.error("Erreur API push-subscription DELETE:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors de la suppression de la souscription" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')

    let queryText = 'SELECT * FROM push_subscriptions'
    const params = []

    if (employeeId) {
      queryText += ' WHERE employee_id = $1'
      params.push(parseInt(employeeId))
    }

    queryText += ' ORDER BY created_at DESC'

    const result = await query(queryText, params)

    return NextResponse.json({
      success: true,
      subscriptions: result.rows
    })

  } catch (error) {
    console.error("Erreur API push-subscription GET:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors de la récupération des souscriptions" 
    }, { status: 500 })
  }
}
