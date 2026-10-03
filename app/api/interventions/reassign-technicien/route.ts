import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getAdminUser } from "@/lib/auth"
import { logHistorique, getClientIP, getUserAgent } from "@/lib/historique"

export const dynamic = 'force-dynamic'

// Réattribution en masse du technicien (nom/prénom) des interventions — réservé aux administrateurs

// Nom complet normalisé (casse, accents, tirets, espaces) pour regrouper les variantes d'un même technicien
// ex : "Mohamed-Bechir MOULAHI" et "MOHAMED BECHIR MOULAHI" → "mohamed bechir moulahi"
const normTech = (prenom: string, nom: string) => `TRIM(REGEXP_REPLACE(
  TRANSLATE(LOWER(CONCAT(COALESCE(${prenom}, ''), ' ', COALESCE(${nom}, ''))), 'àâäáãéèêëíìîïóòôöõúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
  '[[:space:]_.-]+', ' ', 'g'))`
const NORM_TECH = normTech('prenom_technicien', 'nom_technicien')

interface TechnicienGroupe {
  key: string
  nom_technicien: string
  prenom_technicien: string | null
  nb_interventions: number
  variantes: string[]
}

// GET
//  - sans paramètre : liste des techniciens regroupés par nom normalisé (+ employés actifs sans intervention)
//  - ?key=... : interventions du technicien (toutes orthographes confondues)
export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const result = await query(`
        SELECT id, num_inter, nom_technicien, prenom_technicien, statut, client, date_rdv,
               cloture_tech, cloture_hotline, type_intervention, articles, ville, grille
        FROM interventions
        WHERE ${NORM_TECH} = $1
        ORDER BY created_at DESC
      `, [key])

      return NextResponse.json({ interventions: result.rows })
    }

    const variantes = await query(`
      SELECT ${NORM_TECH} as tech_key, nom_technicien, prenom_technicien, COUNT(*)::int as nb
      FROM interventions
      WHERE nom_technicien IS NOT NULL AND nom_technicien != '' AND nom_technicien != 'nan'
      GROUP BY nom_technicien, prenom_technicien
      ORDER BY nb DESC
    `)

    // Regrouper les variantes ; l'orthographe la plus fréquente sert de nom de référence
    const groupes = new Map<string, TechnicienGroupe>()
    for (const v of variantes.rows) {
      const label = `${v.prenom_technicien || ''} ${v.nom_technicien}`.trim()
      const g = groupes.get(v.tech_key)
      if (g) {
        g.nb_interventions += v.nb
        g.variantes.push(`${label} (${v.nb})`)
      } else {
        groupes.set(v.tech_key, {
          key: v.tech_key,
          nom_technicien: v.nom_technicien,
          prenom_technicien: v.prenom_technicien,
          nb_interventions: v.nb,
          variantes: [`${label} (${v.nb})`]
        })
      }
    }

    // Employés actifs absents des interventions (pour pouvoir les choisir comme nouveau technicien)
    const employes = await query(`
      SELECT ${normTech('e.prenom', 'e.nom')} as tech_key, e.nom, e.prenom
      FROM employes e
      WHERE e.statut = 'actif' AND e.nom IS NOT NULL AND e.nom != ''
    `)
    for (const e of employes.rows) {
      if (!e.tech_key || groupes.has(e.tech_key)) continue
      groupes.set(e.tech_key, {
        key: e.tech_key,
        nom_technicien: e.nom,
        prenom_technicien: e.prenom,
        nb_interventions: 0,
        variantes: []
      })
    }

    const techniciens = Array.from(groupes.values()).sort((a, b) =>
      `${a.prenom_technicien || ''} ${a.nom_technicien}`.localeCompare(`${b.prenom_technicien || ''} ${b.nom_technicien}`, 'fr', { sensitivity: 'base' })
    )

    return NextResponse.json({ techniciens })
  } catch (error) {
    console.error("Erreur GET reassign-technicien:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST { ids: number[], sourceKey: string, target: { nom, prenom } }
// Seules les interventions encore attribuées au technicien source (toutes orthographes) sont modifiées
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request)
  if (!admin) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 })
  }

  try {
    const { ids, sourceKey, target } = await request.json()

    const cleanIds: number[] = Array.isArray(ids)
      ? ids.map((id: any) => parseInt(id)).filter((id: number) => Number.isInteger(id))
      : []
    const targetNom = typeof target?.nom === 'string' ? target.nom.trim() : ''
    const targetPrenom = typeof target?.prenom === 'string' ? target.prenom.trim() : ''

    if (cleanIds.length === 0) {
      return NextResponse.json({ error: "Aucune intervention sélectionnée" }, { status: 400 })
    }
    if (!targetNom) {
      return NextResponse.json({ error: "Nouveau technicien requis" }, { status: 400 })
    }
    if (typeof sourceKey !== 'string' || !sourceKey) {
      return NextResponse.json({ error: "Technicien source requis" }, { status: 400 })
    }

    const targetKeyResult = await query(`SELECT ${normTech('$1::text', '$2::text')} as tech_key`, [targetPrenom, targetNom])
    if (targetKeyResult.rows[0].tech_key === sourceKey) {
      return NextResponse.json({ error: "Le nouveau technicien est identique au technicien actuel" }, { status: 400 })
    }

    const result = await query(`
      WITH anciennes AS (
        SELECT id, num_inter, nom_technicien, prenom_technicien
        FROM interventions
        WHERE id = ANY($3::int[]) AND ${NORM_TECH} = $4
        FOR UPDATE
      )
      UPDATE interventions i
      SET nom_technicien = $1, prenom_technicien = $2
      FROM anciennes
      WHERE i.id = anciennes.id
      RETURNING anciennes.id, anciennes.num_inter, anciennes.nom_technicien, anciennes.prenom_technicien
    `, [targetNom, targetPrenom, cleanIds, sourceKey])

    const updated = result.rows as { id: number, num_inter: string, nom_technicien: string, prenom_technicien: string | null }[]

    if (updated.length > 0) {
      const sourceLabel = `${updated[0].prenom_technicien || ''} ${updated[0].nom_technicien}`.trim()
      await logHistorique({
        userId: admin.id,
        userName: admin.email || admin.name,
        action: 'UPDATE',
        tableName: 'interventions',
        section: 'Interventions',
        description: `Réattribution de ${updated.length} intervention(s) : ${sourceLabel} → ${targetPrenom} ${targetNom}`,
        oldValues: { technicien: sourceKey, interventions: updated },
        newValues: { nom_technicien: targetNom, prenom_technicien: targetPrenom },
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })
    }

    return NextResponse.json({
      success: true,
      updated: updated.length,
      skipped: cleanIds.length - updated.length
    })
  } catch (error) {
    console.error("Erreur POST reassign-technicien:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
