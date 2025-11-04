#!/usr/bin/env python3
"""
Script d'import pour les données de consommation de carburant depuis un fichier Excel
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import argparse
import warnings

# Supprimer les warnings d'openpyxl qui ne sont pas critiques
warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')
warnings.filterwarnings('ignore', category=UserWarning, module='pandas')

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def import_carburant_excel(excel_file_path, clear_table=True):
    """Importer les données de carburant depuis un fichier Excel"""
    print(f"Lecture du fichier Excel: {excel_file_path}")
    
    try:
        # Lire le fichier Excel avec les en-têtes corrects
        # Le fichier a un titre sur la première ligne, puis les en-têtes sur la deuxième ligne
        # On ignore la première ligne (titre) et utilise la deuxième ligne comme en-têtes
        # IMPORTANT: Forcer N° de justificatif en STRING pour conserver les zéros initiaux
        dtype_mapping = {
            'N° de justificatif': str,
            'N° de carte': str,
            'N° de station': str,
            'km': str,
            'CP': str
        }
        try:
            df = pd.read_excel(excel_file_path, sheet_name='Sheet0', skiprows=1, header=0, dtype=dtype_mapping)
        except ValueError:
            # Si 'Sheet0' n'existe pas, utiliser la première feuille
            df = pd.read_excel(excel_file_path, skiprows=1, header=0, dtype=dtype_mapping)
        print(f"Données chargées: {len(df)} lignes, {len(df.columns)} colonnes")
        
        # Afficher les colonnes pour debug
        print("Colonnes disponibles:")
        for i, col in enumerate(df.columns):
            print(f"  {i+1:2d}. '{col}'")
        
        # Afficher les premières lignes pour comprendre la structure
        print("\nPremières lignes:")
        print(df.head(3).to_string())
        
        # Connexion à la base
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        try:
            # Vider la table seulement si demandé
            if clear_table:
                print("\nVidage de la table carburant_consommation...")
                cursor.execute("DELETE FROM carburant_consommation;")
                conn.commit()
            else:
                print("\nConservation des données existantes...")
            
            # Préparer les données et gérer les doublons dans le Excel
            carburant_data = []
            seen_numero_justificatif = set()
            duplicates_in_excel = 0
            empty_rows = 0
            
            # Import pour générer des timestamps uniques
            import time
            
            for index, row in df.iterrows():
                try:
                    # Mapper les colonnes du Excel vers la base de données
                    # IMPORTANT: Nettoyer le numéro de justificatif pour enlever ".0" ajouté par pandas
                    numero_justificatif_raw = str(row.get('N° de justificatif', '')).strip()
                    
                    # Si pandas a converti en float (ex: "529.0"), enlever le ".0"
                    if numero_justificatif_raw.endswith('.0'):
                        numero_justificatif_raw = numero_justificatif_raw[:-2]
                    
                    # Debug pour la première ligne
                    if index == 0:
                        print(f"\n[DEBUG] Première ligne - Numéro justificatif brut: '{numero_justificatif_raw}'")
                    
                    # Générer un identifiant unique UNIQUEMENT si vide ou 'nan'
                    # Ne PAS traiter les numéros comme "00000529" ou "0" comme invalides
                    if (not numero_justificatif_raw or 
                        numero_justificatif_raw == 'nan' or 
                        numero_justificatif_raw == ''):
                        # Générer un ID unique avec timestamp et index
                        numero_justificatif = f"AUTO_{int(time.time() * 1000)}_{index}"
                        if index == 0:
                            print(f"[DEBUG] Généré AUTO ID: {numero_justificatif}")
                    else:
                        # Conserver le numéro tel quel (même si c'est "0" ou "00000529")
                        numero_justificatif = numero_justificatif_raw
                        if index == 0:
                            print(f"[DEBUG] Conservé tel quel: {numero_justificatif}")
                    
                    # Vérifier les doublons dans le Excel
                    if numero_justificatif in seen_numero_justificatif:
                        duplicates_in_excel += 1
                        print(f"Doublon dans Excel ignoré: {numero_justificatif}")
                        continue
                    
                    seen_numero_justificatif.add(numero_justificatif)
                    
                    # Fonction pour nettoyer les nombres avec virgules
                    def clean_number(value):
                        if pd.isna(value) or value == '' or str(value).strip() == '':
                            return '0'
                        return str(value).replace(',', '.').strip()
                    
                    # Nouveau format (prioritaire) - colonnes réorganisées
                    # Date de livraison, Heure de livraison, Pays, N° de station, Point d'acceptation, etc.
                    # Ancienne format - avec Date fact., CA HT, TVA séparées
                    
                    # Déterminer si c'est le nouveau ou l'ancien format
                    has_date_fact = 'Date fact.' in df.columns
                    has_valeur_ttc = 'Valeur TTC du produit' in df.columns
                    
                    if has_valeur_ttc:
                        # Nouveau format
                        carburant_record = {
                            'date_livraison': str(row.get('Date de livraison', '')).strip(),
                            'heure_livraison': str(row.get('Heure de livraison', '')).strip(),
                            'immat_vehicule': str(row.get('Immat. véhicule', '')).strip(),
                            'numero_carte': str(row.get('N° de carte', '')).strip(),
                            'km': clean_number(row.get('km', '0')),
                            'poste_1': clean_number(row.get('Poste 1', '0')),
                            'poste_2': clean_number(row.get('Poste 2', '0')),
                            'pays': str(row.get('Pays', '')).strip(),
                            'numero_station': clean_number(row.get('N° de station', '0')),
                            'point_acceptation': str(row.get('Point d\'acceptation', '')).strip(),
                            'identifiant_autoroute': str(row.get('Identifiant autoroute', '')).strip(),
                            'cp': str(row.get('CP', '')).strip(),
                            'type_marchandises': str(row.get('Type marchandises', '')).strip(),
                            'quantite': clean_number(row.get('Quantité', '0')),
                            'ca_ttc': clean_number(row.get('Valeur TTC du produit', '0')),
                            'numero_justificatif': numero_justificatif,
                            # Champs absents dans le nouveau format
                            'taux_tva': '0',
                            'ca_ht': '0',
                            'tva': '0'
                        }
                    else:
                        # Ancien format
                        carburant_record = {
                            'date_livraison': str(row.get('Date de livraison', '')).strip(),
                            'heure_livraison': str(row.get('Heure de livraison', '')).strip(),
                            'immat_vehicule': str(row.get('Immat. véhicule', '')).strip(),
                            'numero_carte': str(row.get('N° de carte', '')).strip(),
                            'km': clean_number(row.get('km', '0')),
                            'poste_1': clean_number(row.get('Poste 1', '0')),
                            'poste_2': clean_number(row.get('Poste 2', '0')),
                            'pays': str(row.get('Pays', '')).strip(),
                            'numero_station': clean_number(row.get('N° de station', '0')),
                            'point_acceptation': str(row.get('Point d\'acceptation', '')).strip(),
                            'identifiant_autoroute': str(row.get('Identifiant autoroute', '')).strip(),
                            'cp': str(row.get('CP', '')).strip(),
                            'type_marchandises': str(row.get('Type marchandises', '')).strip(),
                            'quantite': clean_number(row.get('Quantité', '0')),
                            'taux_tva': clean_number(row.get('Taux TVA', '0')),
                            'ca_ht': clean_number(row.get('CA HT', '0')),
                            'tva': clean_number(row.get('TVA', '0')),
                            'ca_ttc': clean_number(row.get('CA TTC', '0')),
                            'numero_justificatif': numero_justificatif
                        }
                    
                    carburant_data.append(carburant_record)
                    
                except Exception as e:
                    print(f"Erreur ligne {index}: {e}")
                    continue
            
            print(f"\nDonnées préparées: {len(carburant_data)} enregistrements")
            print(f"Lignes vides ignorées: {empty_rows}")
            print(f"Doublons dans Excel ignorés: {duplicates_in_excel}")
            
            # Insertion en lot avec gestion des conflits
            if carburant_data:
                insert_query = """
                    INSERT INTO carburant_consommation (
                        date_livraison, heure_livraison, immat_vehicule,
                        numero_carte, km, poste_1, poste_2, pays, numero_station,
                        point_acceptation, identifiant_autoroute, cp, type_marchandises,
                        quantite, taux_tva, ca_ht, tva, ca_ttc, numero_justificatif
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (numero_justificatif) 
                    DO UPDATE SET
                        date_livraison = EXCLUDED.date_livraison,
                        heure_livraison = EXCLUDED.heure_livraison,
                        immat_vehicule = EXCLUDED.immat_vehicule,
                        numero_carte = EXCLUDED.numero_carte,
                        km = EXCLUDED.km,
                        poste_1 = EXCLUDED.poste_1,
                        poste_2 = EXCLUDED.poste_2,
                        pays = EXCLUDED.pays,
                        numero_station = EXCLUDED.numero_station,
                        point_acceptation = EXCLUDED.point_acceptation,
                        identifiant_autoroute = EXCLUDED.identifiant_autoroute,
                        cp = EXCLUDED.cp,
                        type_marchandises = EXCLUDED.type_marchandises,
                        quantite = EXCLUDED.quantite,
                        taux_tva = EXCLUDED.taux_tva,
                        ca_ht = EXCLUDED.ca_ht,
                        tva = EXCLUDED.tva,
                        ca_ttc = EXCLUDED.ca_ttc
                """
                
                inserted = 0
                updated = 0
                
                for i, data in enumerate(carburant_data):
                    # Construire le tuple dans l'ORDRE EXACT des colonnes SQL
                    data_tuple = (
                        data['date_livraison'],
                        data['heure_livraison'],
                        data['immat_vehicule'],
                        data['numero_carte'],
                        data['km'],
                        data['poste_1'],
                        data['poste_2'],
                        data['pays'],
                        data['numero_station'],
                        data['point_acceptation'],
                        data['identifiant_autoroute'],
                        data['cp'],
                        data['type_marchandises'],
                        data['quantite'],
                        data['taux_tva'],
                        data['ca_ht'],
                        data['tva'],
                        data['ca_ttc'],
                        data['numero_justificatif']  # DERNIER
                    )
                    
                    # Debug pour les 3 premières lignes
                    if i < 3:
                        print(f"\n[DEBUG] Ligne {i} - Justif dans dict: {data.get('numero_justificatif')}")
                        print(f"[DEBUG] Ligne {i} - Tuple[18]: {data_tuple[18]}")  # Position 18 = dernier
                    
                    cursor.execute(insert_query, data_tuple)
                    if cursor.rowcount > 0:
                        inserted += 1
                
                conn.commit()
                print(f"\n[SUCCES] {len(carburant_data)} enregistrements traités ({inserted} nouveaux)")
            else:
                print("\n[ATTENTION] Aucune donnee valide trouvee pour l'import")
            
            return True
            
        except Exception as e:
            print(f"\n[ERREUR] {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"[ERREUR] Erreur lors de la lecture du fichier Excel: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Import des données de carburant depuis Excel')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier Excel')
    parser.add_argument('--no-clear', action='store_true', help='Ne pas vider la table avant import')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    # Déterminer si on doit vider la table
    clear_table = not args.no_clear
    
    success = import_carburant_excel(args.file, clear_table)
    if success:
        print("\n[SUCCES] Import carburant termine avec succes!")
    else:
        print("\n[ERREUR] Import carburant echoue!")
        sys.exit(1)

if __name__ == "__main__":
    main()
