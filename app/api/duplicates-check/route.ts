import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Recherche des doublons basée sur plusieurs champs clés...')
    
    // Fonction pour normaliser les dates (convertir dd/MM/yyyy vers yyyy-MM-dd)
    const normalizeDateField = (fieldName: string) => `
      CASE 
        WHEN ${fieldName} ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' THEN TO_CHAR(TO_DATE(${fieldName}, 'DD/MM/YYYY'), 'YYYY-MM-DD')
        WHEN ${fieldName} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN ${fieldName}
        ELSE ${fieldName}
      END
    `
    
    // Étape 1: Trouver les doublons basés sur num_inter nettoyé (sans _DUP_)
    const duplicatesQuery = `
      WITH normalized_data AS (
        SELECT
          id,
          num_inter,
          -- Nettoyer le num_inter en enlevant les suffixes _DUP_
          REGEXP_REPLACE(num_inter, '_DUP_[0-9]+$', '') as clean_num_inter,
          ${normalizeDateField('date_rdv')} as normalized_date_rdv,
          statut,
          COALESCE(articles, '') as normalized_articles,
          type_intervention,
          nom_technicien,
          prenom_technicien,
          inter_cloturee_par,
          created_at,
          -- Indicateur si l'intervention a des articles valides
          CASE 
            WHEN articles IS NOT NULL 
              AND articles != '' 
              AND articles != 'nan' 
            THEN 1 
            ELSE 0 
          END as has_articles
        FROM interventions
        WHERE num_inter IS NOT NULL 
          AND num_inter != '' 
          AND num_inter != 'nan'
      )
      SELECT
        clean_num_inter,
        normalized_date_rdv,
        statut,
        type_intervention,
        nom_technicien,
        prenom_technicien,
        inter_cloturee_par,
        COUNT(*) as count,
        -- Si au moins une est CLOTURE TERMINEE, garder celle avec articles, sinon la plus ancienne
        ARRAY_AGG(
          id ORDER BY 
            CASE WHEN statut = 'CLOTURE TERMINEE' THEN has_articles ELSE 0 END DESC,
            created_at ASC
        ) as all_ids,
        ARRAY_AGG(
          json_build_object(
            'id', id,
            'num_inter', num_inter,
            'created_at', created_at,
            'statut', statut,
            'has_articles', has_articles,
            'articles', normalized_articles
          ) ORDER BY 
            CASE WHEN statut = 'CLOTURE TERMINEE' THEN has_articles ELSE 0 END DESC,
            created_at ASC
        ) as records
      FROM normalized_data
      GROUP BY 
        clean_num_inter,
        normalized_date_rdv,
        statut,
        type_intervention,
        nom_technicien,
        prenom_technicien,
        inter_cloturee_par
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `
    
    const duplicates = await query(duplicatesQuery)
    console.log(`📊 ${duplicates.rows.length} groupes de doublons trouvés (même num_inter)`)
    
    // Afficher les détails des doublons trouvés
    duplicates.rows.forEach(dup => {
      console.log(`📋 Doublon: clean_num_inter=${dup.clean_num_inter}, statut=${dup.statut}, count=${dup.count}`)
      console.log(`   Records:`, dup.records)
    })
    
    // Supprimer les doublons
    let deletedCount = 0
    const deletedDetails: any[] = []
    
    try {
      for (const duplicate of duplicates.rows) {
        const idsToDelete = duplicate.all_ids.slice(1) // Garder le premier (selon l'ordre de priorité)
        
        if (idsToDelete.length > 0) {
          const deleteResult = await query(
            'DELETE FROM interventions WHERE id = ANY($1) RETURNING id, num_inter',
            [idsToDelete]
          )
          
          deletedCount += deleteResult.rowCount || 0
          deletedDetails.push({
            kept_id: duplicate.all_ids[0],
            deleted_ids: idsToDelete,
            clean_num_inter: duplicate.clean_num_inter,
            date_rdv: duplicate.normalized_date_rdv,
            statut: duplicate.statut,
            type_intervention: duplicate.type_intervention,
            count: duplicate.count,
            records_info: duplicate.records
          })
          
          console.log(`✅ Doublon supprimé pour num_inter ${duplicate.clean_num_inter}: gardé ID ${duplicate.all_ids[0]} (${duplicate.records[0].num_inter}), supprimé ${idsToDelete.join(', ')}`)
        }
      }

    } catch (error) {
      console.error("Erreur lors de la suppression des doublons:", error)
      throw error
    }
    
    return NextResponse.json({
      duplicates: deletedDetails,
      totalDuplicateGroups: duplicates.rows.length,
      deletedCount: deletedCount,
      message: `${deletedCount} doublons supprimés, ${duplicates.rows.length} groupes de doublons traités`
    })
    
  } catch (error) {
    console.error("Erreur lors de la vérification des doublons:", error)
    return NextResponse.json({
      error: "Erreur lors de la vérification des doublons" 
    }, { status: 500 })
  }
}
