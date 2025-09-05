#!/usr/bin/env python3
"""
Script d'importation des données CSV vers PostgreSQL
FinalFibre Application - Import des interventions et consommation carburant
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import argparse
from datetime import datetime
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('import_log.txt'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

class DatabaseImporter:
    def __init__(self):
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """Établir la connexion à la base de données"""
        try:
            self.conn = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.conn.cursor()
            logger.info("✅ Connexion à PostgreSQL établie avec succès")
            return True
        except Exception as e:
            logger.error(f"❌ Erreur de connexion à PostgreSQL: {e}")
            return False
    
    def disconnect(self):
        """Fermer la connexion à la base de données"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("🔌 Connexion PostgreSQL fermée")
    
    def import_interventions(self, csv_file_path):
        """Importer les données d'interventions depuis un fichier CSV"""
        try:
            logger.info(f"📁 Lecture du fichier interventions: {csv_file_path}")
            
            # Lire le fichier CSV avec différentes tentatives de parsing
            df = None
            for sep in [',', ';', '\t']:
                try:
                    df = pd.read_csv(csv_file_path, sep=sep, encoding='utf-8')
                    logger.info(f"✅ CSV parsé avec succès (séparateur: '{sep}')")
                    break
                except Exception as e:
                    logger.warning(f"⚠️ Échec avec séparateur '{sep}': {e}")
                    continue
            
            if df is None:
                logger.error("❌ Impossible de parser le fichier CSV")
                return False
            
            logger.info(f"📊 Données chargées: {len(df)} lignes, {len(df.columns)} colonnes")
            
            # Préparer les données pour l'insertion
            interventions_data = []
            saved_count = 0
            duplicate_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Vérifier si l'intervention existe déjà
                    num_inter = str(row.get('Num Inter', '')).strip()
                    if not num_inter:
                        duplicate_count += 1
                        continue
                    
                    # Vérifier l'existence dans la base
                    self.cursor.execute(
                        "SELECT id FROM interventions WHERE num_inter = %s",
                        (num_inter,)
                    )
                    
                    if self.cursor.fetchone():
                        duplicate_count += 1
                        continue
                    
                    # Préparer les données pour l'insertion
                    intervention_data = {
                        'date_rdv': str(row.get('Date RDV', '')).strip(),
                        'region': str(row.get('Region', '')).strip(),
                        'plaque': str(row.get('Plaque', '')).strip(),
                        'societe': str(row.get('Societe', '')).strip(),
                        'nom_technicien': str(row.get('Nom Technicien', '')).strip(),
                        'prenom_technicien': str(row.get('Prenom Technicien', '')).strip(),
                        'debut': str(row.get('Debut', '')).strip(),
                        'duree': str(row.get('Duree', '')).strip(),
                        'type_intervention': str(row.get('Type Intervention', '')).strip(),
                        'sav24': str(row.get('SAV24', '')).strip(),
                        'sav_rouge': str(row.get('SAV Rouge', '')).strip(),
                        'client': str(row.get('Client', '')).strip(),
                        'num_inter': num_inter,
                        'commande_id': str(row.get('Commande ID', '')).strip(),
                        'statut': str(row.get('Statut', '')).strip(),
                        'cloture_hotline': str(row.get('Cloture Hotline', '')).strip(),
                        'cloture_tech': str(row.get('Cloture Tech', '')).strip(),
                        'debut_intervention': str(row.get('Debut Intervention', '')).strip(),
                        'non_clos_pda': str(row.get('Non Clos PDA', '')).strip(),
                        'creneau_plus_2h': str(row.get('Creneau Plus 2h', '')).strip(),
                        'articles': str(row.get('Articles', '')).strip(),
                        'garantie': str(row.get('Garantie', '')).strip(),
                        'motif_echec': str(row.get('Motif Echec', '')).strip(),
                        'echec_niveau_1': str(row.get('Echec Niveau 1', '')).strip(),
                        'echec_niveau_2': str(row.get('Echec Niveau 2', '')).strip(),
                        'panne_reseau': str(row.get('Panne Reseau', '')).strip(),
                        'commentaires_technicien': str(row.get('Commentaires Technicien', '')).strip(),
                        'commentaires_cloture': str(row.get('Commentaires Cloture', '')).strip(),
                        'num_abonne': str(row.get('Num Abonne', '')).strip(),
                        'nom_abonne': str(row.get('Nom Abonne', '')).strip(),
                        'numero': str(row.get('Numero', '')).strip(),
                        'rue': str(row.get('Rue', '')).strip(),
                        'mobile': str(row.get('Mobile', '')).strip(),
                        'domicile': str(row.get('Domicile', '')).strip(),
                        'bureau': str(row.get('Bureau', '')).strip(),
                        'voip': str(row.get('VoIP', '')).strip(),
                        'code_postal': str(row.get('Code Postal', '')).strip(),
                        'ville': str(row.get('Ville', '')).strip(),
                        'id_osiris': str(row.get('ID Osiris', '')).strip(),
                        'tap_fttla': str(row.get('TAP FTTLA', '')).strip(),
                        'noeud': str(row.get('Noeud', '')).strip(),
                        'numero_efacture': str(row.get('Numero Efacture', '')).strip(),
                        'montant_efacture': str(row.get('Montant Efacture', '')).strip(),
                        'sav_apres_sav': str(row.get('SAV Apres SAV', '')).strip(),
                        'drapeau': str(row.get('Drapeau', '')).strip(),
                        'type_logement': str(row.get('Type Logement', '')).strip(),
                        'codes_secondaires': str(row.get('Codes Secondaires', '')).strip(),
                        'motif_delai_wig': str(row.get('Motif Delai WIG', '')).strip(),
                        'dernier_rdv': str(row.get('Dernier RDV', '')).strip(),
                        'occurences_abo_90_jours': str(row.get('Occurences Abo 90 Jours', '')).strip(),
                        'gestionnaire_infra': str(row.get('Gestionnaire Infra', '')).strip(),
                        'idra': str(row.get('IDRA', '')).strip(),
                        'cause_sav': str(row.get('Cause SAV', '')).strip(),
                        'action_sav': str(row.get('Action SAV', '')).strip(),
                        'longueur_cable': str(row.get('Longueur Cable', '')).strip(),
                        'infos_racco_pavillon': str(row.get('Infos Racco Pavillon', '')).strip(),
                        'type_pbo': str(row.get('Type PBO', '')).strip(),
                        'nom_sro': str(row.get('Nom SRO', '')).strip(),
                        'be1': str(row.get('BE1', '')).strip(),
                        'ref_pbo': str(row.get('Ref PBO', '')).strip(),
                        'type_operation': str(row.get('Type Operation', '')).strip(),
                        'type_habitation': str(row.get('Type Habitation', '')).strip(),
                        'ref_ephem': str(row.get('Ref Ephem', '')).strip(),
                        'activite': str(row.get('Activite', '')).strip(),
                        'statut_wig': str(row.get('Statut WIG', '')).strip(),
                        'raison_sociale': str(row.get('Raison Sociale', '')).strip(),
                        'type_offre_ref': str(row.get('Type Offre Ref', '')).strip(),
                        'type_offre_lib': str(row.get('Type Offre Lib', '')).strip(),
                        'type_pon': str(row.get('Type PON', '')).strip(),
                        'marque': str(row.get('Marque', '')).strip(),
                        'marque_gp': str(row.get('Marque GP', '')).strip(),
                        'grille': str(row.get('Grille', '')).strip(),
                        'commentaire_modif_echec': str(row.get('Commentaire Modif Echec', '')).strip(),
                        'id_immeuble': str(row.get('ID Immeuble', '')).strip(),
                        'ndi_contrat': str(row.get('NDI Contrat', '')).strip(),
                        'sct': str(row.get('SCT', '')).strip(),
                        'affectation_bpi_vertical_1': str(row.get('Affectation BPI Vertical 1', '')).strip(),
                        'affectation_bpi_horizontale': str(row.get('Affectation BPI Horizontale', '')).strip(),
                        'ref_prise': str(row.get('Ref Prise', '')).strip(),
                        'statut_box_4g': str(row.get('Statut Box 4G', '')).strip(),
                        'presta_precedent_succes': str(row.get('Presta Precedent Succes', '')).strip(),
                        'tech_precedent_succes': str(row.get('Tech Precedent Succes', '')).strip(),
                        'liste_prestations_realisees': str(row.get('Liste Prestations Realisees', '')).strip(),
                        'prise_existante': str(row.get('Prise Existante', '')).strip(),
                        'nb_echange_materiel': str(row.get('NB Echange Materiel', '')).strip(),
                        'commentaire_inter': str(row.get('Commentaire Inter', '')).strip(),
                        'inter_prioritaire': str(row.get('Inter Prioritaire', '')).strip(),
                        'gem': str(row.get('GEM', '')).strip(),
                        'transfo_cable': str(row.get('Transfo Cable', '')).strip(),
                        'a_securiser': str(row.get('A Securiser', '')).strip(),
                        'vip': str(row.get('VIP', '')).strip(),
                        'decharge_check_voisinage': str(row.get('Decharge Check Voisinage', '')).strip(),
                        'inter_cloturee_par': str(row.get('Inter Cloturee Par', '')).strip(),
                        'decharge_blocage_jy_suis': str(row.get('Decharge Blocage Jy Suis', '')).strip(),
                        'deblocage_blocage_jy_suis_par': str(row.get('Deblocage Blocage Jy Suis Par', '')).strip(),
                        'check_voisinage': str(row.get('Check Voisinage', '')).strip(),
                        'numero_ig_pr': str(row.get('Numero IG PR', '')).strip(),
                        'note_gem': str(row.get('Note GEM', '')).strip(),
                        'parcours_type': str(row.get('Parcours Type', '')).strip(),
                        'parcours_lib': str(row.get('Parcours Lib', '')).strip(),
                        'reco_racc': str(row.get('Reco Racc', '')).strip(),
                        'date_racc': str(row.get('Date Racc', '')).strip(),
                        'dernier_gem': str(row.get('Dernier GEM', '')).strip(),
                        'motif_decharge': str(row.get('Motif Decharge', '')).strip(),
                        'lignes_dechargees': str(row.get('Lignes Dechargees', '')).strip(),
                        'commentaire_decharge': str(row.get('Commentaire Decharge', '')).strip(),
                        'date_import': str(row.get('Date Import', '')).strip(),
                        'ref_maestro': str(row.get('Ref Maestro', '')).strip(),
                        'ref_cmd': str(row.get('Ref CMD', '')).strip(),
                        'categorie_rdv': str(row.get('Categorie RDV', '')).strip(),
                        'date_1er_rdv': str(row.get('Date 1er RDV', '')).strip(),
                        'presence_amiante': str(row.get('Presence Amiante', '')).strip(),
                        'fil_nu': str(row.get('Fil Nu', '')).strip(),
                        'flag_bot': str(row.get('Flag Bot', '')).strip(),
                        'flag_appel_hors_presence_client': str(row.get('Flag Appel Hors Presence Client', '')).strip(),
                        'sav_regroupe': str(row.get('SAV Regroupe', '')).strip(),
                        'sav_rattachement': str(row.get('SAV Rattachement', '')).strip(),
                        'idur': str(row.get('IDUR', '')).strip(),
                        'adresse_pm': str(row.get('Adresse PM', '')).strip()
                    }
                    
                    interventions_data.append(intervention_data)
                    saved_count += 1
                    
                except Exception as e:
                    logger.error(f"❌ Erreur lors du traitement de la ligne {index}: {e}")
                    duplicate_count += 1
            
            # Insertion en lot dans la base de données
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
                
                # Convertir les données en tuples pour l'insertion
                data_tuples = [tuple(data.values()) for data in interventions_data]
                
                execute_values(
                    self.cursor, insert_query, data_tuples,
                    template=None, page_size=1000
                )
                
                self.conn.commit()
                logger.info(f"✅ {saved_count} interventions importées avec succès")
            
            logger.info(f"📊 Résumé import interventions:")
            logger.info(f"   - Nouvelles interventions: {saved_count}")
            logger.info(f"   - Doublons ignorés: {duplicate_count}")
            logger.info(f"   - Total traité: {len(df)}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'import des interventions: {e}")
            if self.conn:
                self.conn.rollback()
            return False
    
    def import_carburant(self, csv_file_path):
        """Importer les données de consommation carburant depuis un fichier CSV"""
        try:
            logger.info(f"📁 Lecture du fichier carburant: {csv_file_path}")
            
            # Lire le fichier CSV avec différentes tentatives de parsing
            df = None
            for sep in [',', ';', '\t']:
                try:
                    df = pd.read_csv(csv_file_path, sep=sep, encoding='utf-8')
                    logger.info(f"✅ CSV parsé avec succès (séparateur: '{sep}')")
                    break
                except Exception as e:
                    logger.warning(f"⚠️ Échec avec séparateur '{sep}': {e}")
                    continue
            
            if df is None:
                logger.error("❌ Impossible de parser le fichier CSV")
                return False
            
            logger.info(f"📊 Données chargées: {len(df)} lignes, {len(df.columns)} colonnes")
            
            # Préparer les données pour l'insertion
            carburant_data = []
            saved_count = 0
            duplicate_count = 0
            
            for index, row in df.iterrows():
                try:
                    # Vérifier si la transaction existe déjà
                    numero_justificatif = str(row.get('N° de justificatif', '')).strip()
                    if not numero_justificatif:
                        duplicate_count += 1
                        continue
                    
                    # Vérifier l'existence dans la base
                    self.cursor.execute(
                        "SELECT id FROM carburant_consommation WHERE numero_justificatif = %s",
                        (numero_justificatif,)
                    )
                    
                    if self.cursor.fetchone():
                        duplicate_count += 1
                        continue
                    
                    # Préparer les données pour l'insertion
                    carburant_record = {
                        'date_fact': str(row.get('Date fact.', '')).strip(),
                        'date_livraison': str(row.get('Date de livraison', '')).strip(),
                        'heure_livraison': str(row.get('Heure de livraison', '')).strip(),
                        'immat_vehicule': str(row.get('Immat. véhicule', '')).strip(),
                        'numero_carte': str(row.get('N° de carte', '')).strip(),
                        'km': str(row.get('km', '')).strip(),
                        'poste_1': str(row.get('Poste 1', '')).strip(),
                        'poste_2': str(row.get('Poste 2', '')).strip(),
                        'pays': str(row.get('Pays', '')).strip(),
                        'numero_station': str(row.get('N° de station', '')).strip(),
                        'point_acceptation': str(row.get('Point d\'acceptation', '')).strip(),
                        'identifiant_autoroute': str(row.get('Identifiant autoroute', '')).strip(),
                        'cp': str(row.get('CP', '')).strip(),
                        'type_marchandises': str(row.get('Type marchandises', '')).strip(),
                        'quantite': str(row.get('Quantité', '')).strip(),
                        'taux_tva': str(row.get('Taux TVA', '')).strip(),
                        'ca_ht': str(row.get('CA HT', '')).strip(),
                        'tva': str(row.get('TVA', '')).strip(),
                        'ca_ttc': str(row.get('CA TTC', '')).strip(),
                        'numero_justificatif': numero_justificatif
                    }
                    
                    carburant_data.append(carburant_record)
                    saved_count += 1
                    
                except Exception as e:
                    logger.error(f"❌ Erreur lors du traitement de la ligne {index}: {e}")
                    duplicate_count += 1
            
            # Insertion en lot dans la base de données
            if carburant_data:
                insert_query = """
                    INSERT INTO carburant_consommation (
                        date_fact, date_livraison, heure_livraison, immat_vehicule,
                        numero_carte, km, poste_1, poste_2, pays, numero_station,
                        point_acceptation, identifiant_autoroute, cp, type_marchandises,
                        quantite, taux_tva, ca_ht, tva, ca_ttc, numero_justificatif
                    ) VALUES %s
                """
                
                # Convertir les données en tuples pour l'insertion
                data_tuples = [tuple(data.values()) for data in carburant_data]
                
                execute_values(
                    self.cursor, insert_query, data_tuples,
                    template=None, page_size=1000
                )
                
                self.conn.commit()
                logger.info(f"✅ {saved_count} transactions carburant importées avec succès")
            
            logger.info(f"📊 Résumé import carburant:")
            logger.info(f"   - Nouvelles transactions: {saved_count}")
            logger.info(f"   - Doublons ignorés: {duplicate_count}")
            logger.info(f"   - Total traité: {len(df)}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erreur lors de l'import du carburant: {e}")
            if self.conn:
                self.conn.rollback()
            return False

def main():
    parser = argparse.ArgumentParser(description='Import des données CSV vers PostgreSQL')
    parser.add_argument('--type', choices=['interventions', 'carburant'], required=True,
                       help='Type de données à importer')
    parser.add_argument('--file', required=True,
                       help='Chemin vers le fichier CSV à importer')
    parser.add_argument('--test', action='store_true',
                       help='Mode test (ne pas insérer en base)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        logger.error(f"❌ Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    importer = DatabaseImporter()
    
    try:
        if not importer.connect():
            sys.exit(1)
        
        logger.info(f"🚀 Début de l'import {args.type} depuis {args.file}")
        
        if args.type == 'interventions':
            success = importer.import_interventions(args.file)
        elif args.type == 'carburant':
            success = importer.import_carburant(args.file)
        
        if success:
            logger.info("✅ Import terminé avec succès!")
        else:
            logger.error("❌ Import échoué!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("⏹️ Import interrompu par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Erreur inattendue: {e}")
        sys.exit(1)
    finally:
        importer.disconnect()

if __name__ == "__main__":
    main()
