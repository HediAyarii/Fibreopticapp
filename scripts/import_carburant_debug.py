#!/usr/bin/env python3
"""
Script d'import de carburant avec diagnostic détaillé
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

def read_file_with_detection(file_path):
    """Lire le fichier avec détection automatique"""
    extension = os.path.splitext(file_path)[1].lower()
    
    if extension in ['.xlsx', '.xls']:
        try:
            df = pd.read_excel(file_path, sheet_name=0, skiprows=1)
            print(f"✅ Excel lu avec skiprows=1: {len(df)} lignes, {len(df.columns)} colonnes")
            return df
        except:
            df = pd.read_excel(file_path, sheet_name=0)
            print(f"✅ Excel lu sans skiprows: {len(df)} lignes, {len(df.columns)} colonnes")
            return df
    else:
        encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252', 'latin-1']
        separators = [',', ';', '\t']
        
        for encoding in encodings:
            for sep in separators:
                try:
                    df = pd.read_csv(file_path, sep=sep, encoding=encoding)
                    print(f"✅ CSV lu (encodage: '{encoding}', séparateur: '{sep}'): {len(df)} lignes, {len(df.columns)} colonnes")
                    return df
                except Exception as e:
                    continue
        
        raise ValueError("Impossible de lire le fichier")

def map_columns(df):
    """Mapper les colonnes vers la base de données"""
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
            mapped_data[db_column] = pd.Series([''] * len(df))
    
    if missing_columns:
        print(f"⚠️ Colonnes manquantes (remplies avec des valeurs vides): {missing_columns}")
    
    return pd.DataFrame(mapped_data)

def import_carburant_with_debug(file_path, clear_table=True):
    """Importer avec diagnostic détaillé"""
    print(f"🚀 Import carburant avec diagnostic: {file_path}")
    print("=" * 60)
    
    try:
        # Lire le fichier
        df = read_file_with_detection(file_path)
        
        # Mapper les colonnes
        df_mapped = map_columns(df)
        
        print(f"\n📊 Analyse des données:")
        print(f"   - Total lignes: {len(df_mapped)}")
        
        # Analyser la colonne numero_justificatif
        justificatif_values = df_mapped['numero_justificatif'].dropna()
        justificatif_values = justificatif_values[justificatif_values != '']
        justificatif_values = justificatif_values[justificatif_values != 'nan']
        
        print(f"   - Valeurs numero_justificatif valides: {len(justificatif_values)}")
        
        # Vérifier les doublons dans le fichier
        duplicates_in_file = justificatif_values[justificatif_values.duplicated()]
        print(f"   - Doublons dans le fichier: {len(duplicates_in_file)}")
        
        if len(duplicates_in_file) > 0:
            print(f"   - Valeurs dupliquées:")
            for val in duplicates_in_file.unique()[:5]:
                count = (justificatif_values == val).sum()
                print(f"     * '{val}': {count} occurrences")
        
        # Connexion à la base
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        try:
            # Vider la table si demandé
            if clear_table:
                print(f"\n🗑️ Vidage de la table carburant_consommation...")
                cursor.execute("DELETE FROM carburant_consommation;")
                conn.commit()
                print(f"✅ Table vidée")
            
            # Préparer les données
            carburant_data = []
            seen_numero_justificatif = set()
            duplicates_ignored = 0
            empty_rows = 0
            invalid_rows = 0
            
            print(f"\n🔄 Traitement des données:")
            
            for index, row in df_mapped.iterrows():
                try:
                    numero_justificatif = str(row['numero_justificatif']).strip()
                    
                    # Ignorer les lignes vides
                    if not numero_justificatif or numero_justificatif == 'nan' or numero_justificatif == '':
                        empty_rows += 1
                        continue
                    
                    # Vérifier les doublons dans le fichier
                    if numero_justificatif in seen_numero_justificatif:
                        duplicates_ignored += 1
                        if duplicates_ignored <= 5:  # Afficher les 5 premiers doublons
                            print(f"   🔄 Doublon ignoré: '{numero_justificatif}'")
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
                    invalid_rows += 1
                    if invalid_rows <= 5:  # Afficher les 5 premières erreurs
                        print(f"   ❌ Erreur ligne {index}: {e}")
                    continue
            
            print(f"\n📊 Statistiques finales:")
            print(f"   - Données préparées: {len(carburant_data)}")
            print(f"   - Lignes vides ignorées: {empty_rows}")
            print(f"   - Doublons ignorés: {duplicates_ignored}")
            print(f"   - Lignes invalides: {invalid_rows}")
            
            # Insertion en lot
            if carburant_data:
                print(f"\n💾 Insertion en base de données...")
                
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
                print(f"✅ SUCCES: {len(carburant_data)} enregistrements importés!")
                
                # Vérifier l'insertion
                cursor.execute("SELECT COUNT(*) FROM carburant_consommation;")
                total_count = cursor.fetchone()[0]
                print(f"📊 Total enregistrements dans la base: {total_count}")
                
            else:
                print(f"\n⚠️ Aucune donnée valide à importer!")
                print(f"   - Vérifiez que la colonne 'numero_justificatif' existe")
                print(f"   - Vérifiez que les valeurs ne sont pas toutes vides")
            
            return True
            
        except Exception as e:
            print(f"\n❌ ERREUR lors de l'insertion: {e}")
            conn.rollback()
            return False
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"❌ Erreur lors de l'import: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Import carburant avec diagnostic')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier (CSV ou Excel)')
    parser.add_argument('--no-clear', action='store_true', help='Ne pas vider la table avant import')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"❌ Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    clear_table = not args.no_clear
    success = import_carburant_with_debug(args.file, clear_table)
    
    if success:
        print("\n🎉 Import terminé avec succès!")
    else:
        print("\n💥 Import échoué!")
        sys.exit(1)

if __name__ == "__main__":
    main()
