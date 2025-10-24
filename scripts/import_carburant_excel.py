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
        try:
            df = pd.read_excel(excel_file_path, sheet_name='Sheet0', skiprows=1, header=0)
        except ValueError:
            # Si 'Sheet0' n'existe pas, utiliser la première feuille
            df = pd.read_excel(excel_file_path, skiprows=1, header=0)
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
            
            for index, row in df.iterrows():
                try:
                    # Mapper les colonnes du Excel vers la base de données
                    numero_justificatif = str(row.get('N° de justificatif', '')).strip()
                    
                    # Ignorer les lignes vides
                    if not numero_justificatif or numero_justificatif == 'nan' or numero_justificatif == '':
                        empty_rows += 1
                        continue
                    
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
                    
                    carburant_record = {
                        'date_fact': str(row.get('Date fact.', '')).strip(),
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
            
            # Insertion en lot
            if carburant_data:
                insert_query = """
                    INSERT INTO carburant_consommation (
                        date_fact, date_livraison, heure_livraison, immat_vehicule,
                        numero_carte, km, poste_1, poste_2, pays, numero_station,
                        point_acceptation, identifiant_autoroute, cp, type_marchandises,
                        quantite, taux_tva, ca_ht, tva, ca_ttc, numero_justificatif
                    ) VALUES %s
                """
                
                data_tuples = [tuple(data.values()) for data in carburant_data]
                
                execute_values(
                    cursor, insert_query, data_tuples,
                    template=None, page_size=1000
                )
                
                conn.commit()
                print(f"\n[SUCCES] {len(carburant_data)} enregistrements de carburant importes!")
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
