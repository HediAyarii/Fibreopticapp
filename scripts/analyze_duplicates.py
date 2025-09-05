#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour analyser les doublons dans un fichier CSV d'interventions
"""

import pandas as pd
import sys
import os
from collections import Counter

def analyze_duplicates(csv_file):
    """Analyse les doublons dans le fichier CSV"""
    
    print(f"🔍 Analyse des doublons: {csv_file}")
    print("=" * 60)
    
    # Essayer différents encodages et séparateurs
    encodings = ['utf-8', 'iso-8859-1', 'windows-1252', 'cp1252', 'latin-1']
    separators = [',', ';', '\t']
    
    df = None
    used_encoding = None
    used_separator = None
    
    for encoding in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(csv_file, encoding=encoding, sep=sep, low_memory=False)
                if len(df.columns) > 5:  # Un bon fichier CSV devrait avoir plusieurs colonnes
                    used_encoding = encoding
                    used_separator = sep
                    print(f"✅ Fichier lu avec encodage: {encoding}, séparateur: '{sep}'")
                    break
            except Exception as e:
                continue
        if df is not None and len(df.columns) > 5:
            break
    
    if df is None:
        print("❌ Impossible de lire le fichier CSV")
        return
    
    print(f"📊 Total lignes dans le fichier: {len(df)}")
    print(f"📋 Colonnes détectées: {len(df.columns)}")
    
    # Chercher la colonne Num Inter
    num_inter_col = None
    for col in df.columns:
        if 'num' in col.lower() and 'inter' in col.lower():
            num_inter_col = col
            break
    
    if num_inter_col is None:
        print("❌ Colonne 'Num Inter' non trouvée")
        print("📋 Colonnes disponibles:")
        for i, col in enumerate(df.columns):
            print(f"   {i+1}. {col}")
        return
    
    print(f"✅ Colonne trouvée: '{num_inter_col}'")
    
    # Analyser les doublons
    num_inter_values = df[num_inter_col].dropna().astype(str)
    print(f"📊 Valeurs Num Inter non-vides: {len(num_inter_values)}")
    
    # Compter les occurrences
    value_counts = num_inter_values.value_counts()
    duplicates = value_counts[value_counts > 1]
    
    print(f"\n🔍 Analyse des doublons:")
    print(f"   - Valeurs uniques: {len(value_counts)}")
    print(f"   - Valeurs en doublon: {len(duplicates)}")
    print(f"   - Total lignes avec doublons: {duplicates.sum()}")
    print(f"   - Lignes à ignorer (doublons): {duplicates.sum() - len(duplicates)}")
    
    if len(duplicates) > 0:
        print(f"\n📋 Top 10 des doublons les plus fréquents:")
        for i, (value, count) in enumerate(duplicates.head(10).items()):
            print(f"   {i+1}. {value}: {count} occurrences")
    
    # Calculer le nombre final d'enregistrements uniques
    unique_records = len(value_counts)
    total_lines = len(df)
    duplicate_lines = duplicates.sum() - len(duplicates)
    
    print(f"\n📊 Résumé:")
    print(f"   - Total lignes dans CSV: {total_lines}")
    print(f"   - Lignes avec Num Inter valide: {len(num_inter_values)}")
    print(f"   - Enregistrements uniques: {unique_records}")
    print(f"   - Doublons ignorés: {duplicate_lines}")
    print(f"   - Résultat attendu: {unique_records} interventions importées")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python analyze_duplicates.py <fichier_csv>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    if not os.path.exists(csv_file):
        print(f"❌ Fichier non trouvé: {csv_file}")
        sys.exit(1)
    
    analyze_duplicates(csv_file)

