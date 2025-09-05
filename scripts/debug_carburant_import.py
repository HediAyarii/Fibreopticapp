#!/usr/bin/env python3
"""
Script de diagnostic pour l'import de carburant
"""

import os
import sys
import pandas as pd
import psycopg2
import argparse

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def analyze_file(file_path):
    """Analyser le fichier à importer"""
    print(f"🔍 Analyse du fichier: {file_path}")
    print("=" * 60)
    
    if not os.path.exists(file_path):
        print(f"❌ Fichier non trouvé: {file_path}")
        return
    
    # Détecter le type de fichier
    extension = os.path.splitext(file_path)[1].lower()
    
    try:
        if extension in ['.xlsx', '.xls']:
            # Essayer de lire Excel
            try:
                df = pd.read_excel(file_path, sheet_name=0, skiprows=1)
                print(f"✅ Excel lu avec skiprows=1: {len(df)} lignes, {len(df.columns)} colonnes")
            except:
                df = pd.read_excel(file_path, sheet_name=0)
                print(f"✅ Excel lu sans skiprows: {len(df)} lignes, {len(df.columns)} colonnes")
        else:
            # Lire CSV avec différents encodages
            encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252', 'latin-1']
            separators = [',', ';', '\t']
            
            df = None
            for encoding in encodings:
                for sep in separators:
                    try:
                        df = pd.read_csv(file_path, sep=sep, encoding=encoding)
                        print(f"✅ CSV lu (encodage: '{encoding}', séparateur: '{sep}'): {len(df)} lignes, {len(df.columns)} colonnes")
                        break
                    except Exception as e:
                        continue
                if df is not None:
                    break
            
            if df is None:
                print("❌ Impossible de lire le fichier")
                return
        
        print(f"\n📋 Colonnes trouvées:")
        for i, col in enumerate(df.columns):
            print(f"   {i+1:2d}. '{col}'")
        
        # Chercher la colonne numero_justificatif
        justificatif_col = None
        for col in df.columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in ['justificatif', 'numero', 'n°', 'num']):
                justificatif_col = col
                break
        
        if justificatif_col:
            print(f"\n🎯 Colonne 'numero_justificatif' trouvée: '{justificatif_col}'")
            
            # Analyser les valeurs de cette colonne
            values = df[justificatif_col].dropna()
            print(f"📊 Valeurs non-vides: {len(values)} sur {len(df)}")
            
            # Vérifier les doublons dans le fichier
            duplicates = values[values.duplicated()]
            if len(duplicates) > 0:
                print(f"🔄 Doublons dans le fichier: {len(duplicates)}")
                print("Valeurs dupliquées:")
                for val in duplicates.unique()[:10]:  # Afficher les 10 premiers
                    print(f"   - '{val}'")
            else:
                print("✅ Aucun doublon dans le fichier")
            
            # Afficher quelques exemples
            print(f"\n📄 Exemples de valeurs:")
            for i, val in enumerate(values.head(10)):
                print(f"   {i+1:2d}. '{val}'")
        
        else:
            print("❌ Colonne 'numero_justificatif' non trouvée")
            print("Colonnes candidates:")
            for col in df.columns:
                col_lower = col.lower()
                if any(keyword in col_lower for keyword in ['numero', 'n°', 'num', 'justif', 'ref']):
                    print(f"   - '{col}'")
        
        # Afficher les premières lignes
        print(f"\n📄 Premières lignes:")
        print(df.head(3).to_string())
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse: {e}")

def check_database_state():
    """Vérifier l'état de la base de données"""
    print(f"\n🗄️ État de la base de données:")
    print("=" * 60)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Compter les enregistrements
        cursor.execute("SELECT COUNT(*) FROM carburant_consommation;")
        count = cursor.fetchone()[0]
        print(f"📊 Total enregistrements dans carburant_consommation: {count}")
        
        if count > 0:
            # Afficher quelques exemples
            cursor.execute("SELECT numero_justificatif, immat_vehicule, date_livraison FROM carburant_consommation LIMIT 5;")
            examples = cursor.fetchall()
            print(f"\n📄 Exemples existants:")
            for i, (justif, immat, date) in enumerate(examples):
                print(f"   {i+1}. '{justif}' - {immat} - {date}")
        
        # Vérifier les contraintes
        cursor.execute("""
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'carburant_consommation';
        """)
        constraints = cursor.fetchall()
        print(f"\n🔒 Contraintes:")
        for name, type_constraint in constraints:
            print(f"   - {name}: {type_constraint}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erreur lors de la vérification de la base: {e}")

def main():
    parser = argparse.ArgumentParser(description='Diagnostic de l\'import carburant')
    parser.add_argument('--file', help='Chemin vers le fichier à analyser')
    parser.add_argument('--check-db', action='store_true', help='Vérifier l\'état de la base de données')
    
    args = parser.parse_args()
    
    if args.file:
        analyze_file(args.file)
    
    if args.check_db:
        check_database_state()
    
    if not args.file and not args.check_db:
        print("Usage: python debug_carburant_import.py --file <fichier> [--check-db]")
        print("   ou: python debug_carburant_import.py --check-db")

if __name__ == "__main__":
    main()
