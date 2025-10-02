#!/usr/bin/env python3
import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import argparse
from datetime import datetime
import time

DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def import_interventions_optimized(csv_file_path):
    print(f'[DEBUT] Import optimisé des interventions: {csv_file_path}')
    print('=' * 60)
    
    df = pd.read_csv(csv_file_path, sep=';', encoding='iso-8859-1')
    print(f'[INFO] Données chargées: {len(df)} lignes, {len(df.columns)} colonnes')
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Ne pas vérifier les doublons en base - importer tout
        print(f'[INFO] Import de toutes les lignes sans vérification de doublons en base')
        
        # Traitement par petits lots pour éviter les timeouts
        batch_size = 100
        total_processed = 0
        total_inserted = 0
        
        for batch_start in range(0, len(df), batch_size):
            batch_end = min(batch_start + batch_size, len(df))
            batch_df = df.iloc[batch_start:batch_end]
            
            print(f'[INFO] Traitement du lot {batch_start//batch_size + 1}: lignes {batch_start+1}-{batch_end}')
            
            interventions_data = []
            seen_combinations = {}
            
            for index, row in batch_df.iterrows():
                try:
                    num_inter = str(row.get('Num Inter', '')).strip()
                    date_rdv = str(row.get('Date de rdv', '')).strip()
                    
                    if not num_inter or num_inter == 'nan':
                        continue
                    
                    # Créer une clé unique basée sur Num Inter + Date RDV
                    unique_key = f"{num_inter}|{date_rdv}"
                    
                    # Ajouter un timestamp unique à toutes les lignes pour éviter les conflits
                    timestamp = int(time.time() * 1000) + index  # timestamp unique
                    num_inter = f"{num_inter}_TMP_{timestamp}"
                    
                    seen_combinations[unique_key] = 1
                    
                    # Préparer les données pour l'insertion (champs essentiels seulement)
                    intervention_data = {
                        'date_rdv': date_rdv,
                        'client': str(row.get('Client', '')).strip(),
                        'num_inter': num_inter,
                        'statut': str(row.get('Statut', '')).strip(),
                        'nom_technicien': str(row.get('Nom Technicien', '')).strip(),
                        'rue': str(row.get('Rue', '')).strip(),
                        'type_intervention': str(row.get('Type', '')).strip(),
                        'region': str(row.get('Région', '')).strip(),
                        'plaque': str(row.get('Plaque', '')).strip(),
                        'societe': str(row.get('Sociéte', '')).strip()
                    }
                    
                    interventions_data.append(intervention_data)
                    
                except Exception as e:
                    print(f'[ERREUR] Erreur ligne {index}: {e}')
                    continue
            
            # Insertion du lot
            if interventions_data:
                try:
                    insert_query = """
                        INSERT INTO interventions (
                            date_rdv, client, num_inter, statut, nom_technicien, rue, 
                            type_intervention, region, plaque, societe
                        ) VALUES %s
                    """
                    
                    data_tuples = [tuple(data.values()) for data in interventions_data]
                    
                    execute_values(
                        cursor, insert_query, data_tuples,
                        template=None, page_size=50
                    )
                    
                    conn.commit()
                    total_inserted += len(interventions_data)
                    print(f'[SUCCES] Lot {batch_start//batch_size + 1}: {len(interventions_data)} interventions insérées')
                    
                except Exception as e:
                    print(f'[ERREUR] Erreur lors de l\'insertion du lot {batch_start//batch_size + 1}: {e}')
                    conn.rollback()
                    continue
            
            total_processed += len(batch_df)
            print(f'[INFO] Progression: {total_processed}/{len(df)} lignes traitées')
        
        print(f'\n[STATISTIQUES] Statistiques de traitement:')
        print(f'   - Total lignes dans CSV: {len(df)}')
        print(f'   - Lignes traitées: {total_processed}')
        print(f'   - Interventions insérées: {total_inserted}')
        print(f'\n[SUCCES] {total_inserted} interventions importées au total!')
        
        # Les doublons seront supprimés avec le bouton "Vérifier Doublons"
        print(f'\n[INFO] Import terminé. Utilisez le bouton "Vérifier Doublons" pour supprimer les doublons.')
        
        return True
        
    except Exception as e:
        print(f'[ERREUR] {e}')
        conn.rollback()
        return False
    
    finally:
        cursor.close()
        conn.close()

def main():
    parser = argparse.ArgumentParser(description='Import optimisé des interventions')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier CSV')
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f'[ERREUR] Fichier non trouvé: {args.file}')
        sys.exit(1)
    
    try:
        import_interventions_optimized(args.file)
    except Exception as e:
        print(f'[ERREUR] Erreur fatale: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()
