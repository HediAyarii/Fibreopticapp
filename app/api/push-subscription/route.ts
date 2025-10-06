import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import webpush from 'web-push'

// Configuration VAPID (clés fournies par l'utilisateur)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BLZZNzGYoo6KLhGm_qVQDIjPWcLZVYeWwPILUwBwaBKL7lEKUQ24f7CWR2GmFhaEiKU_jDDTLv9fo52Ym8xqmak'
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'DqE1Bk4uzykAXsmSKIAw46-Gy7z78K7t5CDNVQdlp24'

webpush.setVapidDetails(
  'mailto:admin@finalfibre.com',
  vapidPublicKey,
  vapidPrivateKey
)

export async function POST(request: NextRequest) {
  try {
    const { subscription, employeeId } = await request.json()

    if (!subscription || !employeeId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Enregistrer la souscription dans la base de données
    await query(`
      INSERT INTO push_subscriptions (employee_id, endpoint, p256dh_key, auth_key, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (endpoint) 
      DO UPDATE SET 
        employee_id = $1,
        p256dh_key = $3,
        auth_key = $4,
        updated_at = NOW()
    `, [
      employeeId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth
    ])

    console.log(`✅ Souscription push enregistrée pour l'employé ${employeeId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Souscription enregistrée' 
    })

  } catch (error) {
    console.error('Erreur enregistrement souscription push:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json({ error: 'ID employé requis' }, { status: 400 })
    }

    // Supprimer toutes les souscriptions de l'employé
    await query(
      'DELETE FROM push_subscriptions WHERE employee_id = $1',
      [employeeId]
    )

    console.log(`✅ Souscriptions push supprimées pour l'employé ${employeeId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Souscriptions supprimées' 
    })

  } catch (error) {
    console.error('Erreur suppression souscriptions push:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employee_id')

    if (!employeeId) {
      return NextResponse.json({ error: 'ID employé requis' }, { status: 400 })
    }

    const result = await query(
      'SELECT * FROM push_subscriptions WHERE employee_id = $1',
      [employeeId]
    )

    return NextResponse.json({ 
      subscriptions: result.rows,
      count: result.rows.length 
    })

  } catch (error) {
    console.error('Erreur récupération souscriptions push:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}