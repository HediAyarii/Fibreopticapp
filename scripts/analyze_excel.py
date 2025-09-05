#!/usr/bin/env python3
"""
Script pour analyser un fichier Excel et comprendre sa structure
"""

import pandas as pd
import sys
import os

def analyze_excel(file_path):
    """Analyser la structure d'un fichier Excel"""
    print(f"🔍 Analyse du fichier Excel: {file_path}")
    print("=" * 60)
    
    if not os.path.exists(file_path):
        print(f"❌ Fichier non trouvé: {file_path}")
        return
    
    try:
        # Lire toutes les feuilles du fichier Excel
        excel_file = pd.ExcelFile(file_path)
        print(f"📊 Feuilles trouvées: {excel_file.sheet_names}")
        
        for sheet_name in excel_file.sheet_names:
            print(f"\n📋 Feuille: '{sheet_name}'")
            print("-" * 40)
            
            try:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                print(f"✅ Données chargées: {len(df)} lignes, {len(df.columns)} colonnes")
                
                print(f"\n📋 Colonnes trouvées:")
                for i, col in enumerate(df.columns):
                    print(f"   {i+1:2d}. '{col}'")
                
                print(f"\n📄 Premières lignes:")
                print(df.head(3).to_string())
                
                # Chercher des colonnes qui pourraient être liées au carburant
                carburant_candidates = []
                for col in df.columns:
                    col_lower = col.lower()
                    if any(keyword in col_lower for keyword in ['carburant', 'fuel', 'essence', 'diesel', 'justificatif', 'carte', 'vehicule', 'immat']):
                        carburant_candidates.append(col)
                
                if carburant_candidates:
                    print(f"\n🎯 Colonnes candidates pour le carburant:")
                    for col in carburant_candidates:
                        non_empty = df[col].notna().sum()
                        print(f"   - '{col}': {non_empty} valeurs non-vides sur {len(df)}")
                
                # Vérifier les valeurs vides dans les premières colonnes
                print(f"\n🔍 Analyse des valeurs vides (5 premières colonnes):")
                for col in df.columns[:5]:
                    empty_count = df[col].isna().sum()
                    print(f"   '{col}': {empty_count} valeurs vides sur {len(df)}")
                
            except Exception as e:
                print(f"❌ Erreur lors de la lecture de la feuille '{sheet_name}': {e}")
                continue
        
        print("\n" + "=" * 60)
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse du fichier Excel: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_excel.py <chemin_vers_fichier_excel>")
        sys.exit(1)
    
    analyze_excel(sys.argv[1])
