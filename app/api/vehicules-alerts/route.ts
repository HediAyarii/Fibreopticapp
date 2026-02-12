import { NextResponse } from "next/server"
import { query } from "@/lib/database"
import nodemailer from "nodemailer"

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

interface VehiculeAlert {
  id: number
  matricule: string
  marque: string
  modele: string
  assurance_expiration: string | null
  visite_technique_expiration: string | null
  jours_restants_assurance: number | null
  jours_restants_visite: number | null
}

// GET - Vérifier les véhicules et envoyer les alertes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceCheck = searchParams.get("force") === "true"
    
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Récupérer les véhicules avec dates d'expiration dans le futur (pas expirés)
    const result = await query(`
      SELECT 
        v.id,
        v.matricule,
        v.marque,
        v.modele,
        v.assurance_expiration,
        v.visite_technique_expiration,
        CASE 
          WHEN v.assurance_expiration IS NOT NULL AND v.assurance_expiration::date > CURRENT_DATE 
          THEN (v.assurance_expiration::date - CURRENT_DATE)
          ELSE NULL 
        END as jours_restants_assurance,
        CASE 
          WHEN v.visite_technique_expiration IS NOT NULL AND v.visite_technique_expiration::date > CURRENT_DATE 
          THEN (v.visite_technique_expiration::date - CURRENT_DATE)
          ELSE NULL 
        END as jours_restants_visite
      FROM vehicules v
      WHERE 
        (
          (v.assurance_expiration IS NOT NULL AND v.assurance_expiration::date > CURRENT_DATE AND v.assurance_expiration::date <= CURRENT_DATE + INTERVAL '30 days')
          OR
          (v.visite_technique_expiration IS NOT NULL AND v.visite_technique_expiration::date > CURRENT_DATE AND v.visite_technique_expiration::date <= CURRENT_DATE + INTERVAL '30 days')
        )
      ORDER BY 
        LEAST(
          COALESCE(v.assurance_expiration::date, '2099-12-31'::date),
          COALESCE(v.visite_technique_expiration::date, '2099-12-31'::date)
        ) ASC
    `)
    
    const vehicules: VehiculeAlert[] = result.rows
    
    if (vehicules.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Aucun véhicule avec expiration proche (30 jours)",
        sent: false 
      })
    }
    
    // Filtrer les véhicules selon les seuils de rappel (30j, 15j, 3j)
    const alertes30j: VehiculeAlert[] = []
    const alertes15j: VehiculeAlert[] = []
    const alertes3j: VehiculeAlert[] = []
    
    vehicules.forEach(v => {
      const joursAssurance = v.jours_restants_assurance
      const joursVisite = v.jours_restants_visite
      
      // Assurance
      if (joursAssurance !== null) {
        if (joursAssurance <= 3) {
          alertes3j.push({ ...v, type: 'assurance' } as any)
        } else if (joursAssurance <= 15) {
          alertes15j.push({ ...v, type: 'assurance' } as any)
        } else if (joursAssurance <= 30) {
          alertes30j.push({ ...v, type: 'assurance' } as any)
        }
      }
      
      // Visite technique
      if (joursVisite !== null) {
        if (joursVisite <= 3) {
          alertes3j.push({ ...v, type: 'visite' } as any)
        } else if (joursVisite <= 15) {
          alertes15j.push({ ...v, type: 'visite' } as any)
        } else if (joursVisite <= 30) {
          alertes30j.push({ ...v, type: 'visite' } as any)
        }
      }
    })
    
    // Vérifier si on a déjà envoyé un email aujourd'hui (sauf si force=true)
    if (!forceCheck) {
      const lastSent = await query(`
        SELECT created_at FROM email_alerts_log 
        WHERE DATE(created_at) = CURRENT_DATE 
        AND alert_type = 'vehicule_expiration'
        LIMIT 1
      `)
      
      if (lastSent.rows.length > 0) {
        return NextResponse.json({ 
          success: true, 
          message: "Email déjà envoyé aujourd'hui",
          sent: false,
          lastSent: lastSent.rows[0].created_at
        })
      }
    }
    
    // Générer le contenu de l'email
    const emailContent = generateEmailContent(alertes3j, alertes15j, alertes30j)
    
    if (!emailContent.hasAlerts) {
      return NextResponse.json({ 
        success: true, 
        message: "Aucune alerte à envoyer selon les seuils (30j, 15j, 3j)",
        sent: false 
      })
    }
    
    // Envoyer l'email
    const transporter = createTransporter()
    
    const mailOptions = {
      from: `"FinalFibre Alertes" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL_TO || "info@networkcom.paris",
      subject: emailContent.subject,
      html: emailContent.html,
    }
    
    await transporter.sendMail(mailOptions)
    
    // Logger l'envoi
    await query(`
      INSERT INTO email_alerts_log (alert_type, recipients, subject, vehicules_count, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'vehicule_expiration',
      process.env.ALERT_EMAIL_TO,
      emailContent.subject,
      vehicules.length,
      JSON.stringify({
        alertes3j: alertes3j.length,
        alertes15j: alertes15j.length,
        alertes30j: alertes30j.length,
        date: today
      })
    ])
    
    return NextResponse.json({ 
      success: true, 
      message: "Email d'alerte envoyé avec succès",
      sent: true,
      stats: {
        alertes3j: alertes3j.length,
        alertes15j: alertes15j.length,
        alertes30j: alertes30j.length,
        total: vehicules.length
      }
    })
    
  } catch (error) {
    console.error("Erreur envoi email alertes véhicules:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur lors de l'envoi",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

// POST - Envoyer manuellement
export async function POST(request: Request) {
  return GET(new Request(request.url + "?force=true"))
}

function generateEmailContent(alertes3j: VehiculeAlert[], alertes15j: VehiculeAlert[], alertes30j: VehiculeAlert[]) {
  const hasAlerts = alertes3j.length > 0 || alertes15j.length > 0 || alertes30j.length > 0
  
  if (!hasAlerts) {
    return { hasAlerts: false, subject: "", html: "" }
  }
  
  let urgencyLevel = "INFO"
  if (alertes3j.length > 0) urgencyLevel = "🚨 URGENT"
  else if (alertes15j.length > 0) urgencyLevel = "⚠️ ATTENTION"
  
  const subject = `${urgencyLevel} - Alertes expiration véhicules FinalFibre`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .alert-section { margin-bottom: 25px; padding: 15px; border-radius: 8px; }
        .alert-3j { background-color: #fee2e2; border-left: 4px solid #ef4444; }
        .alert-15j { background-color: #fef3c7; border-left: 4px solid #f59e0b; }
        .alert-30j { background-color: #dbeafe; border-left: 4px solid #3b82f6; }
        .alert-title { font-weight: bold; margin-bottom: 10px; font-size: 16px; }
        .alert-3j .alert-title { color: #dc2626; }
        .alert-15j .alert-title { color: #d97706; }
        .alert-30j .alert-title { color: #2563eb; }
        .vehicle-list { margin: 0; padding-left: 20px; }
        .vehicle-list li { margin: 8px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .badge-assurance { background: #dbeafe; color: #1d4ed8; }
        .badge-visite { background: #d1fae5; color: #065f46; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚗 Alertes Véhicules</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">FinalFibre - Gestion de Flotte</p>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Voici les véhicules dont les documents arrivent bientôt à expiration :</p>
          
          ${alertes3j.length > 0 ? `
          <div class="alert-section alert-3j">
            <div class="alert-title">🚨 URGENT - Expiration dans moins de 3 jours</div>
            <ul class="vehicle-list">
              ${alertes3j.map(v => `
                <li>
                  <strong>${v.matricule}</strong> - ${v.marque} ${v.modele}
                  ${v.jours_restants_assurance !== null && v.jours_restants_assurance <= 3 ? 
                    `<br><span class="badge badge-assurance">Assurance</span> expire le ${new Date(v.assurance_expiration!).toLocaleDateString('fr-FR')} (${v.jours_restants_assurance} jour${v.jours_restants_assurance > 1 ? 's' : ''})` : ''}
                  ${v.jours_restants_visite !== null && v.jours_restants_visite <= 3 ? 
                    `<br><span class="badge badge-visite">Visite technique</span> expire le ${new Date(v.visite_technique_expiration!).toLocaleDateString('fr-FR')} (${v.jours_restants_visite} jour${v.jours_restants_visite > 1 ? 's' : ''})` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${alertes15j.length > 0 ? `
          <div class="alert-section alert-15j">
            <div class="alert-title">⚠️ ATTENTION - Expiration dans moins de 15 jours</div>
            <ul class="vehicle-list">
              ${alertes15j.map(v => `
                <li>
                  <strong>${v.matricule}</strong> - ${v.marque} ${v.modele}
                  ${v.jours_restants_assurance !== null && v.jours_restants_assurance > 3 && v.jours_restants_assurance <= 15 ? 
                    `<br><span class="badge badge-assurance">Assurance</span> expire le ${new Date(v.assurance_expiration!).toLocaleDateString('fr-FR')} (${v.jours_restants_assurance} jours)` : ''}
                  ${v.jours_restants_visite !== null && v.jours_restants_visite > 3 && v.jours_restants_visite <= 15 ? 
                    `<br><span class="badge badge-visite">Visite technique</span> expire le ${new Date(v.visite_technique_expiration!).toLocaleDateString('fr-FR')} (${v.jours_restants_visite} jours)` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${alertes30j.length > 0 ? `
          <div class="alert-section alert-30j">
            <div class="alert-title">📋 INFO - Expiration dans moins de 30 jours</div>
            <ul class="vehicle-list">
              ${alertes30j.map(v => `
                <li>
                  <strong>${v.matricule}</strong> - ${v.marque} ${v.modele}
                  ${v.jours_restants_assurance !== null && v.jours_restants_assurance > 15 && v.jours_restants_assurance <= 30 ? 
                    `<br><span class="badge badge-assurance">Assurance</span> expire le ${new Date(v.assurance_expiration!).toLocaleDateString('fr-FR')} (${v.jours_restants_assurance} jours)` : ''}
                  ${v.jours_restants_visite !== null && v.jours_restants_visite > 15 && v.jours_restants_visite <= 30 ? 
                    `<br><span class="badge badge-visite">Visite technique</span> expire le ${new Date(v.visite_technique_expiration!).toLocaleDateString('fr-FR')} (${v.jours_restants_visite} jours)` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
          
          <p style="margin-top: 20px;">Merci de prendre les mesures nécessaires pour renouveler ces documents.</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par FinalFibre</p>
          <p>Date: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return { hasAlerts: true, subject, html }
}
