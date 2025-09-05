#!/usr/bin/env python3
"""
Script d'import pour les données de consommation de carburant
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

def import_carburant(csv_file_path):
    """Importer les données de carburant avec gestion des doublons"""
    print(f"Lecture du fichier: {csv_file_path}")
    
    # Lire le CSV avec différents encodages
    df = None
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252', 'latin-1']
    separators = [',', ';', '\t']
    
    for encoding in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(csv_file_path, sep=sep, encoding=encoding)
                print(f"CSV parsé avec succès (encodage: '{encoding}', séparateur: '{sep}')")
                break
            except Exception as e:
                print(f"Échec avec encodage '{encoding}' et séparateur '{sep}': {e}")
                continue
        if df is not None:
            break
    
    if df is None:
        print("❌ Impossible de parser le fichier CSV")
        return False
    
    print(f"Données chargées: {len(df)} lignes, {len(df.columns)} colonnes")
    print("Colonnes disponibles:")
    for i, col in enumerate(df.columns):
        print(f"  {i+1:2d}. '{col}'")
    
    # Connexion à la base
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Vider la table d'abord
        print("Vidage de la table carburant_consommation...")
        cursor.execute("DELETE FROM carburant_consommation;")
        conn.commit()
        
        # Préparer les données et gérer les doublons dans le CSV
        carburant_data = []
        seen_numero_justificatif = set()
        duplicates_in_csv = 0
        
        for index, row in df.iterrows():
            try:
                # Mapper les colonnes du CSV vers la base de données
                numero_justificatif = str(row.get('N° de justificatif', '')).strip()
                if not numero_justificatif or numero_justificatif == 'nan':
                    continue
                
                # Vérifier les doublons dans le CSV
                if numero_justificatif in seen_numero_justificatif:
                    duplicates_in_csv += 1
                    print(f"Doublon dans CSV ignoré: {numero_justificatif}")
                    continue
                
                seen_numero_justificatif.add(numero_justificatif)
                
                carburant_record = {
                    'date_fact': str(row.get('Date fact.', '')).strip(),
                    'date_livraison': str(row.get('Date de livraison', '')).strip(),
                    'heure_livraison': str(row.get('Heure de livraison', '')).strip(),
                    'immat_vehicule': str(row.get('Immat. véhicule', '')).strip(),
                    'numero_carte': str(row.get('N° de carte', '')).strip(),
                    'km': str(row.get('km', '')).strip(),
                    'poste_1': '',  # Colonne non présente dans le CSV test
                    'poste_2': '',  # Colonne non présente dans le CSV test
                    'pays': '',     # Colonne non présente dans le CSV test
                    'numero_station': '',  # Colonne non présente dans le CSV test
                    'point_acceptation': '',  # Colonne non présente dans le CSV test
                    'identifiant_autoroute': '',  # Colonne non présente dans le CSV test
                    'cp': '',       # Colonne non présente dans le CSV test
                    'type_marchandises': '',  # Colonne non présente dans le CSV test
                    'quantite': str(row.get('Quantité', '')).strip(),
                    'taux_tva': '',  # Colonne non présente dans le CSV test
                    'ca_ht': '',    # Colonne non présente dans le CSV test
                    'tva': '',      # Colonne non présente dans le CSV test
                    'ca_ttc': str(row.get('CA TTC', '')).strip(),
                    'numero_justificatif': numero_justificatif
                }
                
                carburant_data.append(carburant_record)
                
            except Exception as e:
                print(f"Erreur ligne {index}: {e}")
                continue
        
        print(f"Données préparées: {len(carburant_data)} enregistrements")
        print(f"Doublons dans CSV ignorés: {duplicates_in_csv}")
        
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
            print(f"SUCCES: {len(carburant_data)} enregistrements de carburant importés!")
        
        return True
        
    except Exception as e:
        print(f"ERREUR: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def main():
    parser = argparse.ArgumentParser(description='Import des données de carburant')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier CSV')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    success = import_carburant(args.file)
    if success:
        print("Import carburant terminé avec succès!")
    else:
        print("Import carburant échoué!")
        sys.exit(1)

if __name__ == "__main__":
    main()

