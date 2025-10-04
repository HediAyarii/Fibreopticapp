import { type NextRequest, NextResponse } from "next/server"
import { query, Intervention } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { interventions } = await request.json()

    let saved = 0
    let duplicates = 0

    for (const intervention of interventions) {
      const numInter = intervention["Num Inter"] || intervention["num_inter"] || intervention.num_inter

      if (!numInter) {
        duplicates++
        continue
      }

      try {
        // Check for duplicates by num_inter
        const existingIntervention = await query(
          'SELECT id FROM interventions WHERE num_inter = $1',
          [numInter]
        )

        if (existingIntervention.rows.length === 0) {
          // Insert new intervention
          const insertQuery = `
            INSERT INTO interventions (
              date_rdv, region, plaque, societe, nom_technicien, prenom_technicien,
              debut, duree, type_intervention, sav24, sav_rouge, client, num_inter,
              commande_id, statut, cloture_hotline, cloture_tech, debut_intervention,
              non_clos_pda, creneau_plus_2h, articles, garantie, motif_echec,
              echec_niveau_1, echec_niveau_2, panne_reseau, commentaires_technicien,
              commentaires_cloture, num_abonne, nom_abonne, numero, rue, mobile,
              domicile, bureau, voip, code_postal, ville, id_osiris, tap_fttla,
              noeud, numero_efacture, montant_efacture, sav_apres_sav, drapeau,
              type_logement, codes_secondaires, motif_delai_wig, dernier_rdv,
              occurences_abo_90_jours, gestionnaire_infra, idra, cause_sav,
              action_sav, longueur_cable, infos_racco_pavillon, type_pbo, nom_sro,
              be1, ref_pbo, type_operation, type_habitation, ref_ephem, activite,
              statut_wig, raison_sociale, type_offre_ref, type_offre_lib, type_pon,
              marque, marque_gp, grille, commentaire_modif_echec, id_immeuble,
              ndi_contrat, sct, affectation_bpi_vertical_1, affectation_bpi_horizontale,
              ref_prise, statut_box_4g, presta_precedent_succes, tech_precedent_succes,
              liste_prestations_realisees, prise_existante, nb_echange_materiel,
              commentaire_inter, inter_prioritaire, gem, transfo_cable, a_securiser,
              vip, decharge_check_voisinage, inter_cloturee_par, decharge_blocage_jy_suis,
              deblocage_blocage_jy_suis_par, check_voisinage, numero_ig_pr, note_gem,
              parcours_type, parcours_lib, reco_racc, date_racc, dernier_gem,
              motif_decharge, lignes_dechargees, commentaire_decharge, date_import,
              ref_maestro, ref_cmd, categorie_rdv, date_1er_rdv, presence_amiante,
              fil_nu, flag_bot, flag_appel_hors_presence_client, sav_regroupe,
              sav_rattachement, idur, adresse_pm
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
              $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44,
              $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58,
              $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72,
              $73, $74, $75, $76, $77, $78, $79, $80, $81, $82, $83, $84, $85, $86,
              $87, $88, $89, $90, $91, $92, $93, $94, $95, $96, $97, $98, $99, $100,
              $101, $102, $103, $104, $105, $106, $107, $108, $109, $110, $111, $112,
              $113, $114, $115, $116, $117, $118, $119, $120, $121, $122, $123, $124
            )
          `

          const values = [
            intervention["Date RDV"] || intervention.date_rdv,
            intervention["Region"] || intervention.region,
            intervention["Plaque"] || intervention.plaque,
            intervention["Societe"] || intervention.societe,
            intervention["Nom Technicien"] || intervention.nom_technicien,
            intervention["Prenom Technicien"] || intervention.prenom_technicien,
            intervention["Debut"] || intervention.debut,
            intervention["Duree"] || intervention.duree,
            intervention["Type Intervention"] || intervention.type_intervention,
            intervention["SAV24"] || intervention.sav24,
            intervention["SAV Rouge"] || intervention.sav_rouge,
            intervention["Client"] || intervention.client,
            intervention["Num Inter"] || intervention.num_inter,
            intervention["Commande ID"] || intervention.commande_id,
            intervention["Statut"] || intervention.statut,
            intervention["Cloture Hotline"] || intervention.cloture_hotline,
            intervention["Cloture Tech"] || intervention.cloture_tech,
            intervention["Debut Intervention"] || intervention.debut_intervention,
            intervention["Non Clos PDA"] || intervention.non_clos_pda,
            intervention["Creneau Plus 2h"] || intervention.creneau_plus_2h,
            intervention["Articles"] || intervention.articles,
            intervention["Garantie"] || intervention.garantie,
            intervention["Motif Echec"] || intervention.motif_echec,
            intervention["Echec Niveau 1"] || intervention.echec_niveau_1,
            intervention["Echec Niveau 2"] || intervention.echec_niveau_2,
            intervention["Panne Reseau"] || intervention.panne_reseau,
            intervention["Commentaires Technicien"] || intervention.commentaires_technicien,
            intervention["Commentaires Cloture"] || intervention.commentaires_cloture,
            intervention["Num Abonne"] || intervention.num_abonne,
            intervention["Nom Abonne"] || intervention.nom_abonne,
            intervention["Numero"] || intervention.numero,
            intervention["Rue"] || intervention.rue,
            intervention["Mobile"] || intervention.mobile,
            intervention["Domicile"] || intervention.domicile,
            intervention["Bureau"] || intervention.bureau,
            intervention["VoIP"] || intervention.voip,
            intervention["Code Postal"] || intervention.code_postal,
            intervention["Ville"] || intervention.ville,
            intervention["ID Osiris"] || intervention.id_osiris,
            intervention["TAP FTTLA"] || intervention.tap_fttla,
            intervention["Noeud"] || intervention.noeud,
            intervention["Numero Efacture"] || intervention.numero_efacture,
            intervention["Montant Efacture"] || intervention.montant_efacture,
            intervention["SAV Apres SAV"] || intervention.sav_apres_sav,
            intervention["Drapeau"] || intervention.drapeau,
            intervention["Type Logement"] || intervention.type_logement,
            intervention["Codes Secondaires"] || intervention.codes_secondaires,
            intervention["Motif Delai WIG"] || intervention.motif_delai_wig,
            intervention["Dernier RDV"] || intervention.dernier_rdv,
            intervention["Occurences Abo 90 Jours"] || intervention.occurences_abo_90_jours,
            intervention["Gestionnaire Infra"] || intervention.gestionnaire_infra,
            intervention["IDRA"] || intervention.idra,
            intervention["Cause SAV"] || intervention.cause_sav,
            intervention["Action SAV"] || intervention.action_sav,
            intervention["Longueur Cable"] || intervention.longueur_cable,
            intervention["Infos Racco Pavillon"] || intervention.infos_racco_pavillon,
            intervention["Type PBO"] || intervention.type_pbo,
            intervention["Nom SRO"] || intervention.nom_sro,
            intervention["BE1"] || intervention.be1,
            intervention["Ref PBO"] || intervention.ref_pbo,
            intervention["Type Operation"] || intervention.type_operation,
            intervention["Type Habitation"] || intervention.type_habitation,
            intervention["Ref Ephem"] || intervention.ref_ephem,
            intervention["Activite"] || intervention.activite,
            intervention["Statut WIG"] || intervention.statut_wig,
            intervention["Raison Sociale"] || intervention.raison_sociale,
            intervention["Type Offre Ref"] || intervention.type_offre_ref,
            intervention["Type Offre Lib"] || intervention.type_offre_lib,
            intervention["Type PON"] || intervention.type_pon,
            intervention["Marque"] || intervention.marque,
            intervention["Marque GP"] || intervention.marque_gp,
            intervention["Grille"] || intervention.grille,
            intervention["Commentaire Modif Echec"] || intervention.commentaire_modif_echec,
            intervention["ID Immeuble"] || intervention.id_immeuble,
            intervention["NDI Contrat"] || intervention.ndi_contrat,
            intervention["SCT"] || intervention.sct,
            intervention["Affectation BPI Vertical 1"] || intervention.affectation_bpi_vertical_1,
            intervention["Affectation BPI Horizontale"] || intervention.affectation_bpi_horizontale,
            intervention["Ref Prise"] || intervention.ref_prise,
            intervention["Statut Box 4G"] || intervention.statut_box_4g,
            intervention["Presta Precedent Succes"] || intervention.presta_precedent_succes,
            intervention["Tech Precedent Succes"] || intervention.tech_precedent_succes,
            intervention["Liste Prestations Realisees"] || intervention.liste_prestations_realisees,
            intervention["Prise Existante"] || intervention.prise_existante,
            intervention["NB Echange Materiel"] || intervention.nb_echange_materiel,
            intervention["Commentaire Inter"] || intervention.commentaire_inter,
            intervention["Inter Prioritaire"] || intervention.inter_prioritaire,
            intervention["GEM"] || intervention.gem,
            intervention["Transfo Cable"] || intervention.transfo_cable,
            intervention["A Securiser"] || intervention.a_securiser,
            intervention["VIP"] || intervention.vip,
            intervention["Decharge Check Voisinage"] || intervention.decharge_check_voisinage,
            intervention["Inter Cloturee Par"] || intervention.inter_cloturee_par,
            intervention["Decharge Blocage Jy Suis"] || intervention.decharge_blocage_jy_suis,
            intervention["Deblocage Blocage Jy Suis Par"] || intervention.deblocage_blocage_jy_suis_par,
            intervention["Check Voisinage"] || intervention.check_voisinage,
            intervention["Numero IG PR"] || intervention.numero_ig_pr,
            intervention["Note GEM"] || intervention.note_gem,
            intervention["Parcours Type"] || intervention.parcours_type,
            intervention["Parcours Lib"] || intervention.parcours_lib,
            intervention["Reco Racc"] || intervention.reco_racc,
            intervention["Date Racc"] || intervention.date_racc,
            intervention["Dernier GEM"] || intervention.dernier_gem,
            intervention["Motif Decharge"] || intervention.motif_decharge,
            intervention["Lignes Dechargees"] || intervention.lignes_dechargees,
            intervention["Commentaire Decharge"] || intervention.commentaire_decharge,
            intervention["Date Import"] || intervention.date_import,
            intervention["Ref Maestro"] || intervention.ref_maestro,
            intervention["Ref CMD"] || intervention.ref_cmd,
            intervention["Categorie RDV"] || intervention.categorie_rdv,
            intervention["Date 1er RDV"] || intervention.date_1er_rdv,
            intervention["Presence Amiante"] || intervention.presence_amiante,
            intervention["Fil Nu"] || intervention.fil_nu,
            intervention["Flag Bot"] || intervention.flag_bot,
            intervention["Flag Appel Hors Presence Client"] || intervention.flag_appel_hors_presence_client,
            intervention["SAV Regroupe"] || intervention.sav_regroupe,
            intervention["SAV Rattachement"] || intervention.sav_rattachement,
            intervention["IDUR"] || intervention.idur,
            intervention["Adresse PM"] || intervention.adresse_pm
          ]

          await query(insertQuery, values)
        saved++
      } else {
          duplicates++
        }
      } catch (error) {
        console.error("Erreur lors de l'insertion de l'intervention:", error)
        duplicates++
      }
    }

    // Synchronisation automatique des employés après l'ajout d'interventions
    if (saved > 0) {
      console.log('🔄 Synchronisation automatique des employés après ajout d\'interventions...')
      try {
        const syncResponse = await fetch('http://localhost:3000/api/sync/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json()
          console.log(`✅ Synchronisation réussie: ${syncData.data.employes_crees} employés créés`)
        } else {
          console.log('⚠️ Erreur lors de la synchronisation des employés')
        }
      } catch (syncError) {
        console.log('⚠️ Erreur lors de la synchronisation des employés:', syncError)
      }
    }

    // Get total count
    const totalResult = await query('SELECT COUNT(*) as total FROM interventions')
    const total = totalResult.rows[0].total

    return NextResponse.json({
      success: true,
      saved,
      duplicates,
      total: parseInt(total),
      syncMessage: saved > 0 ? 'Synchronisation automatique des employés effectuée' : null
    })
  } catch (error) {
    console.error("Erreur API interventions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeId = searchParams.get('employe_id')
    
    let queryText = 'SELECT * FROM interventions'
    let params: any[] = []
    
    if (employeId) {
      // Filtrer par employé en utilisant nom_technicien et prenom_technicien
      const employeResult = await query(
        'SELECT prenom, nom FROM employes WHERE id = $1',
        [employeId]
      )
      
      if (employeResult.rows.length > 0) {
        const employe = employeResult.rows[0]
        queryText += ' WHERE nom_technicien = $1 AND prenom_technicien = $2'
        params = [employe.nom, employe.prenom]
      }
    }
    
    queryText += ' ORDER BY created_at DESC'
    
    const result = await query(queryText, params)
    
    return NextResponse.json({
      interventions: result.rows,
      total: result.rows.length,
    })
  } catch (error) {
    console.error("Erreur GET interventions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, articles } = await request.json()

    if (!id || articles === undefined) {
      return NextResponse.json({ error: "ID et articles requis" }, { status: 400 })
    }

    const result = await query(
      'UPDATE interventions SET articles = $1 WHERE id = $2 RETURNING *',
      [articles, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Intervention non trouvée" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      intervention: result.rows[0]
    })
  } catch (error) {
    console.error("Erreur PUT interventions:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}