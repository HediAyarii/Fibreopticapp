import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Comparer TOUS les champs SAUF num_inter car une même intervention peut avoir plusieurs statuts
    // (échec puis clôture) sur des dates différentes - c'est normal et pas un doublon
    const fieldsToCompare = `
      date_rdv, region, plaque, societe, nom_technicien, prenom_technicien, debut, duree, 
      type_intervention, sav24, sav_rouge, client, commande_id, statut, 
      cloture_hotline, cloture_tech, debut_intervention, non_clos_pda, creneau_plus_2h, 
      articles, garantie, motif_echec, echec_niveau_1, echec_niveau_2, panne_reseau, 
      commentaires_technicien, commentaires_cloture, num_abonne, nom_abonne, numero, 
      rue, mobile, domicile, bureau, voip, code_postal, ville, id_osiris, tap_fttla, 
      noeud, numero_efacture, montant_efacture, sav_apres_sav, drapeau, type_logement, 
      codes_secondaires, motif_delai_wig, dernier_rdv, occurences_abo_90_jours, 
      gestionnaire_infra, idra, cause_sav, action_sav, longueur_cable, infos_racco_pavillon, 
      type_pbo, nom_sro, be1, ref_pbo, type_operation, type_habitation, ref_ephem, 
      activite, statut_wig, raison_sociale, type_offre_ref, type_offre_lib, type_pon, 
      marque, marque_gp, grille, commentaire_modif_echec, id_immeuble, ndi_contrat, sct, 
      affectation_bpi_vertical_1, affectation_bpi_horizontale, ref_prise, statut_box_4g, 
      presta_precedent_succes, tech_precedent_succes, liste_prestations_realisees, 
      prise_existante, nb_echange_materiel, commentaire_inter, inter_prioritaire, gem, 
      transfo_cable, a_securiser, vip, decharge_check_voisinage, inter_cloturee_par, 
      decharge_blocage_jy_suis, deblocage_blocage_jy_suis_par, check_voisinage, 
      numero_ig_pr, note_gem, parcours_type, parcours_lib, reco_racc, date_racc, 
      dernier_gem, motif_decharge, lignes_dechargees, commentaire_decharge, date_import, 
      ref_maestro, ref_cmd, categorie_rdv, date_1er_rdv, presence_amiante, fil_nu, 
      flag_bot, flag_appel_hors_presence_client, sav_regroupe, sav_rattachement, idur, 
      adresse_pm
    `
    
    // Requête pour trouver les doublons en comparant TOUS les champs
    const duplicatesQuery = `
      SELECT
        ${fieldsToCompare},
        COUNT(*) as count
      FROM interventions
      GROUP BY ${fieldsToCompare}
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `
    
    const duplicates = await query(duplicatesQuery)
    
    // Supprimer les doublons en comparant TOUS les champs
    let deletedCount = 0
    
    try {
      const deleteQuery = `
        DELETE FROM interventions
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM interventions
          GROUP BY ${fieldsToCompare}
        )
      `
      
      const result = await query(deleteQuery)
      deletedCount = result.rowCount || 0

    } catch (error) {
      console.error("Erreur lors de la suppression des doublons:", error)
      throw error
    }
    
    return NextResponse.json({
      duplicates: duplicates.rows,
      totalDuplicates: duplicates.rows.length,
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
