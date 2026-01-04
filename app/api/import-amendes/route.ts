import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Fichier vide ou invalide' },
        { status: 400 }
      )
    }

    // Détecter le séparateur
    const firstLine = lines[0]
    let separator = ';'
    if (firstLine.includes('\t')) separator = '\t'
    else if (firstLine.includes(',') && !firstLine.includes(';')) separator = ','

    const headers = firstLine.split(separator).map(h => h.trim().toLowerCase())
    console.log('📋 Headers détectés:', headers)

    // Mapping des colonnes possibles
    const columnMap: { [key: string]: string } = {
      'matricule': 'matricule',
      'immatriculation': 'matricule',
      'vehicule': 'matricule',
      'date': 'date_amende',
      'date_amende': 'date_amende',
      'date amende': 'date_amende',
      'date_infraction': 'date_infraction',
      'date infraction': 'date_infraction',
      'type': 'type_infraction',
      'type_infraction': 'type_infraction',
      'infraction': 'type_infraction',
      'type infraction': 'type_infraction',
      'lieu': 'lieu_infraction',
      'lieu_infraction': 'lieu_infraction',
      'lieu infraction': 'lieu_infraction',
      'montant': 'montant',
      'prix': 'montant',
      'amende': 'montant',
      'numero': 'numero_amende',
      'numero_amende': 'numero_amende',
      'n°': 'numero_amende',
      'reference': 'numero_amende',
      'description': 'description',
      'commentaire': 'description',
      'notes': 'description',
      'employe': 'employe_nom',
      'conducteur': 'employe_nom',
      'chauffeur': 'employe_nom',
      'nom': 'employe_nom'
    }

    // Trouver les indices des colonnes
    const columnIndices: { [key: string]: number } = {}
    headers.forEach((header, index) => {
      const cleanHeader = header.replace(/[^a-zàâäéèêëïîôùûü0-9_\s]/gi, '').trim()
      for (const [key, value] of Object.entries(columnMap)) {
        if (cleanHeader.includes(key) || key.includes(cleanHeader)) {
          columnIndices[value] = index
          break
        }
      }
    })

    console.log('📊 Colonnes mappées:', columnIndices)

    // Charger les véhicules pour le mapping
    const vehiculesResult = await query('SELECT id, matricule FROM vehicules')
    const vehiculesMap = new Map<string, number>(
      vehiculesResult.rows.map((v: any) => [v.matricule?.toLowerCase().replace(/\s/g, ''), v.id])
    )

    // Charger les employés pour le mapping
    const employesResult = await query('SELECT id, nom, prenom FROM employes')
    const employesMap = new Map<string, number>(
      employesResult.rows.map((e: any) => [
        `${e.nom?.toLowerCase()} ${e.prenom?.toLowerCase()}`.trim(),
        e.id
      ])
    )

    let imported = 0
    let skipped = 0
    let errors: string[] = []

    // Parser les lignes de données
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Parser la ligne CSV avec gestion des guillemets
      const values = parseCSVLine(line, separator)
      
      const matricule = values[columnIndices['matricule']]?.trim()
      const dateAmende = values[columnIndices['date_amende']]?.trim()
      const typeInfraction = values[columnIndices['type_infraction']]?.trim()
      const montantStr = values[columnIndices['montant']]?.trim()
      const lieuInfraction = values[columnIndices['lieu_infraction']]?.trim()
      const numeroAmende = values[columnIndices['numero_amende']]?.trim()
      const description = values[columnIndices['description']]?.trim()
      const employeNom = values[columnIndices['employe_nom']]?.trim()

      if (!matricule) {
        skipped++
        continue
      }

      // Trouver le véhicule
      const vehiculeId = vehiculesMap.get(matricule.toLowerCase().replace(/\s/g, ''))
      
      if (!vehiculeId) {
        errors.push(`Ligne ${i + 1}: Véhicule "${matricule}" non trouvé`)
        skipped++
        continue
      }

      // Parser la date
      let parsedDate = null
      if (dateAmende) {
        parsedDate = parseDate(dateAmende)
      }

      // Parser le montant
      let montant = 0
      if (montantStr) {
        montant = parseFloat(montantStr.replace(',', '.').replace(/[^\d.-]/g, '')) || 0
      }

      // Trouver l'employé si spécifié
      let employeId: number | null = null
      if (employeNom) {
        for (const [key, id] of employesMap.entries()) {
          const keyStr = key as string
          if (keyStr.includes(employeNom.toLowerCase()) || employeNom.toLowerCase().includes(keyStr)) {
            employeId = id
            break
          }
        }
      }

      try {
        await query(
          `INSERT INTO amendes_vehicules (
            vehicule_id, employe_id, date_amende, type_infraction,
            lieu_infraction, montant, numero_amende, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            vehiculeId,
            employeId,
            parsedDate,
            typeInfraction || 'Non spécifié',
            lieuInfraction || null,
            montant,
            numeroAmende || null,
            description || null
          ]
        )
        imported++
      } catch (err: any) {
        errors.push(`Ligne ${i + 1}: ${err.message}`)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import terminé: ${imported} amende(s) importée(s), ${skipped} ignorée(s)`,
      imported,
      skipped,
      errors: errors.slice(0, 10) // Limiter à 10 erreurs
    })

  } catch (error: any) {
    console.error('❌ Erreur import amendes:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === separator && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  
  // Format JJ/MM/AAAA
  const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
  }
  
  // Format AAAA-MM-JJ
  const yyyymmdd = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (yyyymmdd) {
    return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`
  }
  
  return null
}
