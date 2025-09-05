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

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def import_carburant_excel(excel_file_path):
    """Importer les données de carburant depuis un fichier Excel"""
    print(f"Lecture du fichier Excel: {excel_file_path}")
    
    try:
        # Lire le fichier Excel en sautant la première ligne (en-tête)
        df = pd.read_excel(excel_file_path, sheet_name='Sheet0', skiprows=1)
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
            # Vider la table d'abord
            print("\nVidage de la table carburant_consommation...")
            cursor.execute("DELETE FROM carburant_consommation;")
            conn.commit()
            
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
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    success = import_carburant_excel(args.file)
    if success:
        print("\n🎉 Import carburant terminé avec succès!")
    else:
        print("\n💥 Import carburant échoué!")
        sys.exit(1)

if __name__ == "__main__":
    main()
