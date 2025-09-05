#!/usr/bin/env python3
"""
Script d'import universel pour les données de consommation de carburant
Supporte CSV et Excel avec détection automatique du format
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

def detect_file_type(file_path):
    """Détecter le type de fichier"""
    extension = os.path.splitext(file_path)[1].lower()
    if extension in ['.xlsx', '.xls']:
        return 'excel'
    elif extension == '.csv':
        return 'csv'
    else:
        return 'unknown'

def read_data_file(file_path):
    """Lire un fichier CSV ou Excel avec détection automatique"""
    file_type = detect_file_type(file_path)
    
    if file_type == 'excel':
        return read_excel_file(file_path)
    elif file_type == 'csv':
        return read_csv_file(file_path)
    else:
        raise ValueError(f"Type de fichier non supporté: {file_type}")

def read_excel_file(file_path):
    """Lire un fichier Excel"""
    print(f"📊 Lecture du fichier Excel: {file_path}")
    
    try:
        # Essayer de lire avec skiprows=1 d'abord (format standard)
        df = pd.read_excel(file_path, sheet_name=0, skiprows=1)
        print(f"✅ Excel lu avec succès (skiprows=1): {len(df)} lignes, {len(df.columns)} colonnes")
        return df
    except Exception as e1:
        try:
            # Essayer sans skiprows
            df = pd.read_excel(file_path, sheet_name=0)
            print(f"✅ Excel lu avec succès (sans skiprows): {len(df)} lignes, {len(df.columns)} colonnes")
            return df
        except Exception as e2:
            print(f"❌ Erreur lors de la lecture Excel: {e1}, {e2}")
            raise

def read_csv_file(file_path):
    """Lire un fichier CSV avec détection automatique de l'encodage"""
    print(f"📊 Lecture du fichier CSV: {file_path}")
    
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252', 'latin-1']
    separators = [',', ';', '\t']
    
    for encoding in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(file_path, sep=sep, encoding=encoding)
                print(f"✅ CSV lu avec succès (encodage: '{encoding}', séparateur: '{sep}'): {len(df)} lignes, {len(df.columns)} colonnes")
                return df
            except Exception as e:
                print(f"⚠️ Échec avec encodage '{encoding}' et séparateur '{sep}': {e}")
                continue
    
    raise ValueError("Impossible de lire le fichier CSV avec les encodages testés")

def map_columns_to_database(df):
    """Mapper les colonnes du fichier vers la base de données"""
    print("🔍 Mapping des colonnes...")
    
    # Dictionnaire de mapping flexible
    column_mapping = {
        'numero_justificatif': ['N° de justificatif', 'numero_justificatif', 'justificatif', 'Numéro de justificatif'],
        'date_fact': ['Date fact.', 'date_fact', 'Date facturation', 'Date de facturation'],
        'date_livraison': ['Date de livraison', 'date_livraison', 'Date livraison'],
        'heure_livraison': ['Heure de livraison', 'heure_livraison', 'Heure livraison'],
        'immat_vehicule': ['Immat. véhicule', 'immat_vehicule', 'Immatriculation', 'Plaque'],
        'numero_carte': ['N° de carte', 'numero_carte', 'Carte', 'Numéro de carte'],
        'km': ['km', 'kilometres', 'kilomètres'],
        'poste_1': ['Poste 1', 'poste_1', 'Poste'],
        'poste_2': ['Poste 2', 'poste_2'],
        'pays': ['Pays', 'pays', 'Country'],
        'numero_station': ['N° de station', 'numero_station', 'Station', 'Numéro de station'],
        'point_acceptation': ['Point d\'acceptation', 'point_acceptation', 'Point acceptation'],
        'identifiant_autoroute': ['Identifiant autoroute', 'identifiant_autoroute', 'Autoroute'],
        'cp': ['CP', 'cp', 'Code postal'],
        'type_marchandises': ['Type marchandises', 'type_marchandises', 'Type', 'Marchandises'],
        'quantite': ['Quantité', 'quantite', 'Quantite', 'Volume'],
        'taux_tva': ['Taux TVA', 'taux_tva', 'TVA'],
        'ca_ht': ['CA HT', 'ca_ht', 'Montant HT', 'Prix HT'],
        'tva': ['TVA', 'tva'],
        'ca_ttc': ['CA TTC', 'ca_ttc', 'Montant TTC', 'Prix TTC']
    }
    
    mapped_data = {}
    missing_columns = []
    
    for db_column, possible_names in column_mapping.items():
        found = False
        for name in possible_names:
            if name in df.columns:
                mapped_data[db_column] = df[name]
                found = True
                break
        
        if not found:
            missing_columns.append(db_column)
            mapped_data[db_column] = pd.Series([''] * len(df))  # Valeur par défaut
    
    if missing_columns:
        print(f"⚠️ Colonnes manquantes (remplies avec des valeurs vides): {missing_columns}")
    
    print(f"✅ Mapping terminé: {len(mapped_data)} colonnes mappées")
    return pd.DataFrame(mapped_data)

def import_carburant_universal(file_path, clear_table=True):
    """Importer les données de carburant depuis n'importe quel format supporté"""
    print(f"🚀 Début de l'import universel: {file_path}")
    print("=" * 60)
    
    try:
        # Lire le fichier
        df = read_data_file(file_path)
        
        # Mapper les colonnes
        df_mapped = map_columns_to_database(df)
        
        # Afficher les premières lignes pour vérification
        print("\n📄 Premières lignes après mapping:")
        print(df_mapped.head(3).to_string())
        
        # Connexion à la base
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        try:
            # Vider la table si demandé
            if clear_table:
                print("\n🗑️ Vidage de la table carburant_consommation...")
                cursor.execute("DELETE FROM carburant_consommation;")
                conn.commit()
            
            # Préparer les données
            carburant_data = []
            seen_numero_justificatif = set()
            duplicates_ignored = 0
            empty_rows = 0
            
            for index, row in df_mapped.iterrows():
                try:
                    numero_justificatif = str(row['numero_justificatif']).strip()
                    
                    # Ignorer les lignes vides
                    if not numero_justificatif or numero_justificatif == 'nan' or numero_justificatif == '':
                        empty_rows += 1
                        continue
                    
                    # Vérifier les doublons
                    if numero_justificatif in seen_numero_justificatif:
                        duplicates_ignored += 1
                        continue
                    
                    seen_numero_justificatif.add(numero_justificatif)
                    
                    carburant_record = {
                        'date_fact': str(row['date_fact']).strip(),
                        'date_livraison': str(row['date_livraison']).strip(),
                        'heure_livraison': str(row['heure_livraison']).strip(),
                        'immat_vehicule': str(row['immat_vehicule']).strip(),
                        'numero_carte': str(row['numero_carte']).strip(),
                        'km': str(row['km']).strip(),
                        'poste_1': str(row['poste_1']).strip(),
                        'poste_2': str(row['poste_2']).strip(),
                        'pays': str(row['pays']).strip(),
                        'numero_station': str(row['numero_station']).strip(),
                        'point_acceptation': str(row['point_acceptation']).strip(),
                        'identifiant_autoroute': str(row['identifiant_autoroute']).strip(),
                        'cp': str(row['cp']).strip(),
                        'type_marchandises': str(row['type_marchandises']).strip(),
                        'quantite': str(row['quantite']).strip(),
                        'taux_tva': str(row['taux_tva']).strip(),
                        'ca_ht': str(row['ca_ht']).strip(),
                        'tva': str(row['tva']).strip(),
                        'ca_ttc': str(row['ca_ttc']).strip(),
                        'numero_justificatif': numero_justificatif
                    }
                    
                    carburant_data.append(carburant_record)
                    
                except Exception as e:
                    print(f"⚠️ Erreur ligne {index}: {e}")
                    continue
            
            print(f"\n📊 Statistiques de l'import:")
            print(f"   - Données préparées: {len(carburant_data)} enregistrements")
            print(f"   - Lignes vides ignorées: {empty_rows}")
            print(f"   - Doublons ignorés: {duplicates_ignored}")
            
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
                print(f"\n✅ SUCCES: {len(carburant_data)} enregistrements de carburant importés!")
            else:
                print("\n⚠️ Aucune donnée valide trouvée pour l'import")
            
            return True
            
        except Exception as e:
            print(f"\n❌ ERREUR: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Erreur lors de l'import: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Import universel des données de carburant')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier (CSV ou Excel)')
    parser.add_argument('--no-clear', action='store_true', help='Ne pas vider la table avant import')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"❌ Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    clear_table = not args.no_clear
    success = import_carburant_universal(args.file, clear_table)
    
    if success:
        print("\n🎉 Import universel terminé avec succès!")
    else:
        print("\n💥 Import universel échoué!")
        sys.exit(1)

if __name__ == "__main__":
    main()
