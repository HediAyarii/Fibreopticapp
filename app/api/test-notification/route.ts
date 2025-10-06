import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

// Configuration VAPID (clés fournies par l'utilisateur)
const vapidKeys = {
  publicKey: 'BLZZNzGYoo6KLhGm_qVQDIjPWcLZVYeWwPILUwBwaBKL7lEKUQ24f7CWR2GmFhaEiKU_jDDTLv9fo52Ym8xqmak',
  privateKey: 'DqE1Bk4uzykAXsmSKIAw46-Gy7z78K7t5CDNVQdlp24'
}

// Configuration web-push
webpush.setVapidDetails(
  'mailto:admin@finalfibre.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

export async function POST(request: NextRequest) {
  try {
    const { employeeId, title, body, icon, data } = await request.json()

    if (!employeeId || !title || !body) {
      return NextResponse.json({ 
        success: false, 
        error: "Données de notification manquantes" 
      }, { status: 400 })
    }

    // Récupérer les souscriptions de l'employé
    const subscriptions = await query(
      'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE employee_id = $1',
      [employeeId]
    )

    if (subscriptions.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Aucune souscription push trouvée pour cet employé" 
      }, { status: 404 })
    }

    // Préparer le payload de notification
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/placeholder-logo.png',
      badge: '/placeholder-logo.png',
      tag: 'finalfibre-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Ouvrir',
          icon: '/placeholder-logo.png'
        }
      ],
      data: data || {}
    })

    // Envoyer la notification à toutes les souscriptions
    const sendPromises = subscriptions.rows.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        }

        await webpush.sendNotification(pushSubscription, payload)
        console.log(`✅ Notification envoyée à ${subscription.endpoint}`)
        return { success: true, endpoint: subscription.endpoint }
      } catch (error) {
        console.error(`❌ Erreur envoi notification à ${subscription.endpoint}:`, error)
        return { success: false, endpoint: subscription.endpoint, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r.success).length

    console.log(`📱 ${successCount}/${results.length} notifications envoyées avec succès`)

    return NextResponse.json({
      success: true,
      message: `${successCount} notification(s) envoyée(s) avec succès`,
      results
    })

  } catch (error) {
    console.error("Erreur API test-notification:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors de l'envoi de la notification" 
    }, { status: 500 })
  }
}
