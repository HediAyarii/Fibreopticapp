#!/usr/bin/env python3
"""
Script d'import simplifié pour les interventions
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import argparse

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def import_interventions(csv_file_path):
    """Importer les interventions avec gestion simplifiée des doublons"""
    print(f"Lecture du fichier: {csv_file_path}")
    
    # Lire le CSV avec l'encodage correct
    df = pd.read_csv(csv_file_path, sep=';', encoding='iso-8859-1')
    print(f"Données chargées: {len(df)} lignes, {len(df.columns)} colonnes")
    
    # Connexion à la base
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Vider la table d'abord
        print("Vidage de la table interventions...")
        cursor.execute("DELETE FROM interventions;")
        conn.commit()
        
        # Préparer les données et gérer les doublons dans le CSV
        interventions_data = []
        seen_num_inter = set()
        duplicates_in_csv = 0
        
        for index, row in df.iterrows():
            try:
                num_inter = str(row.get('Num Inter', '')).strip()
                if not num_inter or num_inter == 'nan':
                    continue
                
                # Vérifier les doublons dans le CSV
                if num_inter in seen_num_inter:
                    duplicates_in_csv += 1
                    print(f"Doublon dans CSV ignoré: {num_inter}")
                    continue
                
                seen_num_inter.add(num_inter)
                
                intervention_data = {
                    'date_rdv': str(row.get('Date de rdv', '')).strip(),
                    'region': str(row.get('Région', '')).strip(),
                    'plaque': str(row.get('Plaque', '')).strip(),
                    'societe': str(row.get('Sociéte', '')).strip(),
                    'nom_technicien': str(row.get('Nom Technicien', '')).strip(),
                    'prenom_technicien': str(row.get('Prénom Technicien', '')).strip(),
                    'debut': str(row.get('Début', '')).strip(),
                    'duree': str(row.get('Durée', '')).strip(),
                    'type_intervention': str(row.get('Type', '')).strip(),
                    'sav24': str(row.get('SAV24', '')).strip(),
                    'sav_rouge': str(row.get('SAV rouge', '')).strip(),
                    'client': str(row.get('Client', '')).strip(),
                    'num_inter': num_inter,
                    'commande_id': str(row.get('Commande ID', '')).strip(),
                    'statut': str(row.get('Statut', '')).strip(),
                    'cloture_hotline': str(row.get('Clôture Hotline', '')).strip(),
                    'cloture_tech': str(row.get('Cloture Tech', '')).strip(),
                    'debut_intervention': str(row.get('Début intervention', '')).strip(),
                    'non_clos_pda': str(row.get('NON CLOS PDA', '')).strip(),
                    'creneau_plus_2h': str(row.get('Creneau+2h', '')).strip(),
                    'articles': str(row.get('Articles', '')).strip(),
                    'garantie': str(row.get('Garantie', '')).strip(),
                    'motif_echec': str(row.get('Motif Echec', '')).strip(),
                    'echec_niveau_1': str(row.get('Echec Niveau 1', '')).strip(),
                    'echec_niveau_2': str(row.get('Echec Niveau 2', '')).strip(),
                    'panne_reseau': str(row.get('Panne Réseau', '')).strip(),
                    'commentaires_technicien': str(row.get('Commentaires technicien', '')).strip(),
                    'commentaires_cloture': str(row.get('Commentaires clôture', '')).strip(),
                    'num_abonne': str(row.get('Num Abonné', '')).strip(),
                    'nom_abonne': str(row.get('Nom Abonné', '')).strip(),
                    'numero': str(row.get('Numéro', '')).strip(),
                    'rue': str(row.get('Rue', '')).strip(),
                    'mobile': str(row.get('Mobile', '')).strip(),
                    'domicile': str(row.get('Domicile', '')).strip(),
                    'bureau': str(row.get('Bureau', '')).strip(),
                    'voip': str(row.get('Voip', '')).strip(),
                    'code_postal': str(row.get('Code Postal', '')).strip(),
                    'ville': str(row.get('Ville', '')).strip(),
                    'id_osiris': str(row.get('ID Osiris', '')).strip(),
                    'tap_fttla': str(row.get('TAP FTTLA', '')).strip(),
                    'noeud': str(row.get('NOEUD', '')).strip(),
                    'numero_efacture': str(row.get('Numero eFacture', '')).strip(),
                    'montant_efacture': str(row.get('Montant eFacture', '')).strip(),
                    'sav_apres_sav': str(row.get('SAV après SAV', '')).strip(),
                    'drapeau': str(row.get('DRAPEAU', '')).strip(),
                    'type_logement': str(row.get('Type logement', '')).strip(),
                    'codes_secondaires': str(row.get('Codes Secondaires', '')).strip(),
                    'motif_delai_wig': str(row.get('Motif delai WIG', '')).strip(),
                    'dernier_rdv': str(row.get('DERNIER_RDV', '')).strip(),
                    'occurences_abo_90_jours': str(row.get('Occurences Abo (90 jours)', '')).strip(),
                    'gestionnaire_infra': str(row.get('Gestionnaire Infra', '')).strip(),
                    'idra': str(row.get('IDRA', '')).strip(),
                    'cause_sav': str(row.get('Cause SAV', '')).strip(),
                    'action_sav': str(row.get('ACTION_SAV', '')).strip(),
                    'longueur_cable': str(row.get('Longueur de cable', '')).strip(),
                    'infos_racco_pavillon': str(row.get('Infos racco pavillon', '')).strip(),
                    'type_pbo': str(row.get('Type PBO', '')).strip(),
                    'nom_sro': str(row.get('Nom SRO', '')).strip(),
                    'be1': str(row.get('BE1', '')).strip(),
                    'ref_pbo': str(row.get('Ref PBO', '')).strip(),
                    'type_operation': str(row.get('Type operation', '')).strip(),
                    'type_habitation': str(row.get('Type habitation', '')).strip(),
                    'ref_ephem': str(row.get('Ref Ephem', '')).strip(),
                    'activite': str(row.get('Activite', '')).strip(),
                    'statut_wig': str(row.get('Statut WIG', '')).strip(),
                    'raison_sociale': str(row.get('Raison sociale', '')).strip(),
                    'type_offre_ref': str(row.get('Type Offre Ref', '')).strip(),
                    'type_offre_lib': str(row.get('Type Offre Lib', '')).strip(),
                    'type_pon': str(row.get('Type PON', '')).strip(),
                    'marque': str(row.get('Marque', '')).strip(),
                    'marque_gp': str(row.get('Marque GP', '')).strip(),
                    'grille': str(row.get('Grille', '')).strip(),
                    'commentaire_modif_echec': str(row.get('Commentaire modif échec', '')).strip(),
                    'id_immeuble': str(row.get('ID Immeuble', '')).strip(),
                    'ndi_contrat': str(row.get('NDI du contrat', '')).strip(),
                    'sct': str(row.get('SCT', '')).strip(),
                    'affectation_bpi_vertical_1': str(row.get('Affectation BPI vertical 1', '')).strip(),
                    'affectation_bpi_horizontale': str(row.get('Affectation BPI horizontale', '')).strip(),
                    'ref_prise': str(row.get('Ref. Prise', '')).strip(),
                    'statut_box_4g': str(row.get('Statut box 4G', '')).strip(),
                    'presta_precedent_succes': str(row.get('Presta du précédent succès', '')).strip(),
                    'tech_precedent_succes': str(row.get('Tech du précédent succès', '')).strip(),
                    'liste_prestations_realisees': str(row.get('Liste des prestations réalisées', '')).strip(),
                    'prise_existante': str(row.get('Prise existante', '')).strip(),
                    'nb_echange_materiel': str(row.get('NB_ECHANGE_MATERIEL', '')).strip(),
                    'commentaire_inter': str(row.get('Commentaire Inter', '')).strip(),
                    'inter_prioritaire': str(row.get('Inter prioritaire', '')).strip(),
                    'gem': str(row.get('GEM', '')).strip(),
                    'transfo_cable': str(row.get('Transfo cable', '')).strip(),
                    'a_securiser': str(row.get('A sécuriser', '')).strip(),
                    'vip': str(row.get('VIP', '')).strip(),
                    'decharge_check_voisinage': str(row.get('Decharge Check Voisinage', '')).strip(),
                    'inter_cloturee_par': str(row.get('Inter cloturée par', '')).strip(),
                    'decharge_blocage_jy_suis': str(row.get('Decharge Blocage jy suis', '')).strip(),
                    'deblocage_blocage_jy_suis_par': str(row.get('Déblocage/blocage jy suis par', '')).strip(),
                    'check_voisinage': str(row.get('Check Voisinage', '')).strip(),
                    'numero_ig_pr': str(row.get('Numéro IG/PR', '')).strip(),
                    'note_gem': str(row.get('NOTE_GEM', '')).strip(),
                    'parcours_type': str(row.get('PARCOURS_TYPE', '')).strip(),
                    'parcours_lib': str(row.get('PARCOURS_LIB', '')).strip(),
                    'reco_racc': str(row.get('reco_racc', '')).strip(),
                    'date_racc': str(row.get('Date de RACC', '')).strip(),
                    'dernier_gem': str(row.get('Dernier GEM', '')).strip(),
                    'motif_decharge': str(row.get('Motif décharge', '')).strip(),
                    'lignes_dechargees': str(row.get('Lignes déchargées', '')).strip(),
                    'commentaire_decharge': str(row.get('Commentaire décharge', '')).strip(),
                    'date_import': str(row.get('Date Import', '')).strip(),
                    'ref_maestro': str(row.get('Ref. Maestro', '')).strip(),
                    'ref_cmd': str(row.get('Ref. Cmd', '')).strip(),
                    'categorie_rdv': str(row.get('Categorie RDV', '')).strip(),
                    'date_1er_rdv': str(row.get('Date 1er RDV', '')).strip(),
                    'presence_amiante': str(row.get('Présence amiante', '')).strip(),
                    'fil_nu': str(row.get('Fil nu', '')).strip(),
                    'flag_bot': str(row.get('Flag BOT', '')).strip(),
                    'flag_appel_hors_presence_client': str(row.get('Flag Appel Hors présence client', '')).strip(),
                    'sav_regroupe': str(row.get('SAV regroupé', '')).strip(),
                    'sav_rattachement': str(row.get('SAV rattachement', '')).strip(),
                    'idur': str(row.get('IDUR', '')).strip(),
                    'adresse_pm': str(row.get('Adresse PM', '')).strip()
                }
                
                interventions_data.append(intervention_data)
                
            except Exception as e:
                print(f"Erreur ligne {index}: {e}")
                continue
        
        print(f"Données préparées: {len(interventions_data)} interventions")
        print(f"Doublons dans CSV ignorés: {duplicates_in_csv}")
        
        # Insertion en lot
        if interventions_data:
            insert_query = """
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
                ) VALUES %s
            """
            
            data_tuples = [tuple(data.values()) for data in interventions_data]
            
            execute_values(
                cursor, insert_query, data_tuples,
                template=None, page_size=1000
            )
            
            conn.commit()
            print(f"SUCCES: {len(interventions_data)} interventions importées!")
        
        return True
        
    except Exception as e:
        print(f"ERREUR: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def main():
    parser = argparse.ArgumentParser(description='Import simplifié des interventions')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier CSV')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    success = import_interventions(args.file)
    if success:
        print("Import terminé avec succès!")
    else:
        print("Import échoué!")
        sys.exit(1)

if __name__ == "__main__":
    main()
