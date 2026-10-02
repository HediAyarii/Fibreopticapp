import type { PoolClient } from 'pg'

// Une période d'assignation est [debut, fin[ : la date de fin est exclue.
// La date de fin de l'ancien titulaire = la date de début du nouveau, donc la
// consommation du jour de bascule appartient au nouveau titulaire.
// Les dates circulent au format 'YYYY-MM-DD' ; fin = null signifie sans fin.

export interface Periode {
  debut: string
  fin: string | null
}

export interface AssignationExistante extends Periode {
  id: number
  carte_id: string
  employe_id: number
  employe_nom: string
}

export type Resolution =
  | { action: 'liberer' }
  | { action: 'changer'; carte: string }

export class AssignationErreur extends Error {
  constructor(
    message: string,
    public status: number,
    public details: Record<string, any> = {}
  ) {
    super(message)
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function verifierDate(valeur: unknown, champ: string): string {
  if (typeof valeur !== 'string' || !DATE_RE.test(valeur) || isNaN(Date.parse(valeur))) {
    throw new AssignationErreur(`${champ} invalide (format attendu AAAA-MM-JJ)`, 400)
  }
  return valeur
}

export function dateFr(date: string | null): string {
  if (!date) return 'sans fin'
  const [a, m, j] = date.split('-')
  return `${j}/${m}/${a}`
}

// "le 10/09/2026" ou, si l'ancien titulaire récupère la carte après, "du 10/09/2026 au 20/09/2026"
function quandRetire(a: Periode, retrait: Periode): string {
  const debut = a.debut > retrait.debut ? a.debut : retrait.debut
  const reprise = retrait.fin !== null && (a.fin === null || a.fin > retrait.fin)
  return reprise ? `du ${dateFr(debut)} au ${dateFr(retrait.fin)}` : `à partir du ${dateFr(debut)}`
}

function finMin(a: string | null, b: string | null): string | null {
  if (a === null) return b
  if (b === null) return a
  return a < b ? a : b
}

const SELECT_ASSIGNATION = `
  SELECT ca.id, ca.carte_id, ca.employe_id,
         e.prenom || ' ' || e.nom AS employe_nom,
         to_char(ca.date_assignation, 'YYYY-MM-DD') AS debut,
         to_char(ca.date_fin, 'YYYY-MM-DD') AS fin
  FROM carburant_assignations ca
  JOIN employes e ON e.id = ca.employe_id
`

// Chevauchement entre l'assignation et [$debut, $fin[
function filtreChevauchement(debut: number, fin: number): string {
  return `ca.statut <> 'annulee'
    AND ca.date_assignation < COALESCE($${fin}::timestamp, 'infinity')
    AND COALESCE(ca.date_fin, 'infinity') > $${debut}::timestamp`
}

// Sérialise les modifications d'assignations (les contraintes d'exclusion
// garantissent la cohérence, le verrou évite les erreurs entre deux admins).
export async function commencer(client: PoolClient) {
  await client.query('BEGIN')
  await client.query('LOCK TABLE carburant_assignations IN SHARE ROW EXCLUSIVE MODE')
}

async function ajouterNote(client: PoolClient, id: number, note: string) {
  await client.query(
    `UPDATE carburant_assignations
     SET commentaires = concat_ws(' | ', NULLIF(commentaires, ''), $2::text), updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id, note]
  )
}

async function majPeriode(client: PoolClient, id: number, periode: Periode) {
  await client.query(
    `UPDATE carburant_assignations
     SET date_assignation = $2::timestamp,
         date_fin = $3::timestamp,
         statut = CASE WHEN $3::date <= CURRENT_DATE THEN 'inactive' ELSE 'active' END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id, periode.debut, periode.fin]
  )
}

async function inserer(
  client: PoolClient,
  carte: string,
  employeId: number,
  periode: Periode,
  commentaires: string | null
): Promise<number> {
  const result = await client.query(
    `INSERT INTO carburant_assignations (carte_id, employe_id, date_assignation, date_fin, statut, commentaires)
     VALUES ($1, $2, $3::timestamp, $4::timestamp,
             CASE WHEN $4::date <= CURRENT_DATE THEN 'inactive' ELSE 'active' END, NULLIF($5, ''))
     RETURNING id`,
    [carte, employeId, periode.debut, periode.fin, commentaires ?? '']
  )
  return result.rows[0].id
}

// Retire [debut, fin[ d'une assignation existante. Ce qui reste avant et/ou
// après est conservé (une assignation temporaire "rend" la carte à la fin).
async function retirerPeriode(client: PoolClient, a: AssignationExistante, retrait: Periode, note: string) {
  const avant: Periode | null = a.debut < retrait.debut ? { debut: a.debut, fin: retrait.debut } : null
  const apres: Periode | null =
    retrait.fin !== null && (a.fin === null || a.fin > retrait.fin) ? { debut: retrait.fin, fin: a.fin } : null

  if (avant) {
    await majPeriode(client, a.id, avant)
    await ajouterNote(client, a.id, note)
    if (apres) {
      await inserer(client, a.carte_id, a.employe_id, apres, `Reprise après la période du ${dateFr(retrait.debut)} au ${dateFr(retrait.fin)}`)
    }
  } else if (apres) {
    await majPeriode(client, a.id, apres)
    await ajouterNote(client, a.id, note)
  } else {
    await client.query(
      `UPDATE carburant_assignations SET statut = 'annulee', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [a.id]
    )
    await ajouterNote(client, a.id, `Annulée : ${note}`)
  }
}

async function chargerEmploye(client: PoolClient, employeId: number) {
  const result = await client.query(`SELECT id, prenom || ' ' || nom AS nom FROM employes WHERE id = $1`, [employeId])
  if (result.rows.length === 0) throw new AssignationErreur('Employé introuvable', 404)
  return result.rows[0] as { id: number; nom: string }
}

async function estBadgePeage(client: PoolClient, carte: string): Promise<boolean> {
  const result = await client.query('SELECT carburant_carte_peage($1) AS peage', [carte])
  return result.rows[0].peage
}

// Assignations de l'employé qui occupent la période et doivent lui être
// retirées : ses autres cartes du même type (carburant ou badge péage).
async function cartesDeLEmploye(client: PoolClient, employeId: number, carte: string, periode: Periode) {
  const result = await client.query(
    `${SELECT_ASSIGNATION}
     WHERE ca.employe_id = $1
       AND carburant_carte_peage(ca.carte_id) = carburant_carte_peage($2)
       AND ${filtreChevauchement(3, 4)}
     ORDER BY ca.date_assignation`,
    [employeId, carte, periode.debut, periode.fin]
  )
  return result.rows as AssignationExistante[]
}

export async function assignerCarte(
  client: PoolClient,
  params: {
    carte: string
    employeId: number
    periode: Periode
    commentaires?: string | null
    resolutions?: Record<string, Resolution>
  }
) {
  const { carte, employeId, periode } = params
  const resolutions = params.resolutions ?? {}
  if (periode.fin !== null && periode.fin <= periode.debut) {
    throw new AssignationErreur('La date de fin doit être postérieure à la date de début', 400)
  }

  const employe = await chargerEmploye(client, employeId)
  const sesCartes = await cartesDeLEmploye(client, employeId, carte, periode)

  const memeCarte = sesCartes.find(
    a => a.carte_id === carte && a.debut <= periode.debut && (a.fin === null || (periode.fin !== null && a.fin >= periode.fin))
  )
  if (memeCarte) {
    throw new AssignationErreur(
      `${employe.nom} a déjà la carte ${carte} sur cette période (depuis le ${dateFr(memeCarte.debut)})`,
      409,
      { code: 'deja_titulaire' }
    )
  }

  const occupants = (
    await client.query(
      `${SELECT_ASSIGNATION}
       WHERE ca.carte_id = $1 AND ca.employe_id <> $2 AND ${filtreChevauchement(3, 4)}
       ORDER BY ca.date_assignation`,
      [carte, employeId, periode.debut, periode.fin]
    )
  ).rows as AssignationExistante[]

  const nonResolus = occupants.filter(o => !resolutions[o.id])
  if (nonResolus.length > 0) {
    const noms = occupants.map(o => `${o.employe_nom} (depuis le ${dateFr(o.debut)})`).join(', ')
    throw new AssignationErreur(`La carte ${carte} est déjà assignée à ${noms}`, 409, {
      code: 'conflit',
      conflits: occupants,
      cartes_employe: sesCartes.filter(a => a.carte_id !== carte)
    })
  }

  const actions: string[] = []

  // 1. L'employé rend ses autres cartes du même type sur la période
  for (const a of sesCartes) {
    const note = a.carte_id === carte
      ? `Fusionnée avec la nouvelle assignation du ${dateFr(periode.debut)}`
      : `Remplacée par la carte ${carte} le ${dateFr(periode.debut)}`
    await retirerPeriode(client, a, periode, note)
    if (a.carte_id !== carte) {
      actions.push(`${employe.nom} rend la carte ${a.carte_id} ${quandRetire(a, periode)}`)
    }
  }

  // 2. Les titulaires actuels de la carte la cèdent à partir de la date de début
  for (const o of occupants) {
    const resolution = resolutions[o.id]
    await retirerPeriode(client, o, periode, `Carte reprise par ${employe.nom} le ${dateFr(periode.debut)}`)

    if (resolution.action === 'changer') {
      if (!resolution.carte || resolution.carte === carte) {
        throw new AssignationErreur(`Choisissez une autre carte pour ${o.employe_nom}`, 400)
      }
      if (await estBadgePeage(client, resolution.carte) !== await estBadgePeage(client, carte)) {
        throw new AssignationErreur(`La carte de remplacement de ${o.employe_nom} doit être du même type`, 400)
      }
      const remplacement: Periode = {
        debut: o.debut > periode.debut ? o.debut : periode.debut,
        fin: finMin(o.fin, periode.fin)
      }
      const dejaPrise = (
        await client.query(
          `${SELECT_ASSIGNATION} WHERE ca.carte_id = $1 AND ${filtreChevauchement(2, 3)}`,
          [resolution.carte, remplacement.debut, remplacement.fin]
        )
      ).rows as AssignationExistante[]
      if (dejaPrise.length > 0) {
        throw new AssignationErreur(
          `La carte ${resolution.carte} n'est pas libre : assignée à ${dejaPrise.map(d => d.employe_nom).join(', ')}`,
          409,
          { code: 'remplacement_occupe' }
        )
      }
      await inserer(client, resolution.carte, o.employe_id, remplacement,
        `Remplace la carte ${carte} reprise par ${employe.nom}`)
      actions.push(`${o.employe_nom} reçoit la carte ${resolution.carte} à partir du ${dateFr(remplacement.debut)}`)
    } else {
      actions.push(`${o.employe_nom} n'a plus la carte ${carte} ${quandRetire(o, periode)}`)
    }
  }

  // 3. Nouvelle assignation
  const id = await inserer(client, carte, employeId, periode, params.commentaires ?? null)
  actions.unshift(
    `Carte ${carte} assignée à ${employe.nom} du ${dateFr(periode.debut)}${periode.fin ? ` au ${dateFr(periode.fin)}` : ' (sans fin)'}`
  )
  return { id, actions }
}

export async function libererCarte(
  client: PoolClient,
  params: { employeId: number; carte?: string | null; dateFin: string; commentaires?: string | null }
) {
  const employe = await chargerEmploye(client, params.employeId)
  const result = await client.query(
    `${SELECT_ASSIGNATION}
     WHERE ca.employe_id = $1
       AND ($2::text IS NULL OR ca.carte_id = $2)
       AND ${filtreChevauchement(3, 4)}
     ORDER BY ca.date_assignation`,
    [params.employeId, params.carte || null, params.dateFin, null]
  )
  const assignations = result.rows as AssignationExistante[]
  if (assignations.length === 0) {
    throw new AssignationErreur(`${employe.nom} n'a aucune carte à partir du ${dateFr(params.dateFin)}`, 404)
  }

  const note = `Désassignée à partir du ${dateFr(params.dateFin)}${params.commentaires ? ` : ${params.commentaires}` : ''}`
  for (const a of assignations) {
    await retirerPeriode(client, a, { debut: params.dateFin, fin: null }, note)
  }
  return {
    actions: assignations.map(a => `${employe.nom} n'a plus la carte ${a.carte_id} à partir du ${dateFr(params.dateFin)}`)
  }
}

// Erreurs PostgreSQL des contraintes de période -> message lisible
export function messageErreurBase(error: any): AssignationErreur | null {
  if (error?.code === '23P01') {
    const surCarte = String(error.constraint || '').includes('carte')
    return new AssignationErreur(
      surCarte
        ? 'Cette carte est déjà assignée à quelqu\'un sur cette période'
        : 'Cet employé a déjà une carte sur cette période',
      409,
      { code: 'chevauchement' }
    )
  }
  if (error?.code === '23514') {
    return new AssignationErreur('Période invalide : la date de fin doit être après la date de début', 400)
  }
  return null
}
