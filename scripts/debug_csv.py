#!/usr/bin/env python3
"""
Script de diagnostic pour analyser la structure des fichiers CSV
"""

import pandas as pd
import sys
import os

def analyze_csv(file_path):
    """Analyser la structure d'un fichier CSV"""
    print(f"🔍 Analyse du fichier: {file_path}")
    print("=" * 60)
    
    if not os.path.exists(file_path):
        print(f"❌ Fichier non trouvé: {file_path}")
        return
    
    # Essayer différents encodages et séparateurs
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252', 'latin-1']
    separators = [',', ';', '\t']
    
    for encoding in encodings:
        for sep in separators:
            try:
                print(f"\n📊 Tentative avec encodage: '{encoding}' et séparateur: '{sep}'")
                df = pd.read_csv(file_path, sep=sep, encoding=encoding)
            
                print(f"✅ Succès! {len(df)} lignes, {len(df.columns)} colonnes")
                print(f"\n📋 Colonnes trouvées:")
                for i, col in enumerate(df.columns):
                    print(f"   {i+1:2d}. '{col}'")
                
                print(f"\n📄 Premières lignes:")
                print(df.head(3).to_string())
                
                # Chercher des colonnes qui pourraient être "Num Inter"
                num_inter_candidates = []
                for col in df.columns:
                    col_lower = col.lower()
                    if any(keyword in col_lower for keyword in ['num', 'inter', 'numero', 'number']):
                        num_inter_candidates.append(col)
                
                if num_inter_candidates:
                    print(f"\n🎯 Colonnes candidates pour 'Num Inter':")
                    for col in num_inter_candidates:
                        non_empty = df[col].notna().sum()
                        print(f"   - '{col}': {non_empty} valeurs non-vides sur {len(df)}")
                
                # Vérifier les valeurs vides dans les premières colonnes
                print(f"\n🔍 Analyse des valeurs vides (5 premières colonnes):")
                for col in df.columns[:5]:
                    empty_count = df[col].isna().sum()
                    print(f"   '{col}': {empty_count} valeurs vides sur {len(df)}")
                
                return  # Sortir après le premier succès
                
            except Exception as e:
                print(f"❌ Échec avec encodage '{encoding}' et séparateur '{sep}': {e}")
                continue
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_csv.py <chemin_vers_fichier_csv>")
        sys.exit(1)
    
    analyze_csv(sys.argv[1])
