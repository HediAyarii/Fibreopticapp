import requests
import pandas as pd
import csv
from io import StringIO

def analyze_csv_robust():
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/EXPORT_INTER_%5B02-06-2025_15h39%5D-SrJ3NlubpZrE24WEciqdMLQkayXvVL.csv"
    
    try:
        print("[v0] Downloading CSV file...")
        response = requests.get(url)
        response.raise_for_status()
        
        content = response.text
        print(f"[v0] CSV file downloaded successfully. Size: {len(content)} characters")
        
        # Afficher les premières lignes pour comprendre la structure
        lines = content.split('\n')[:10]
        print("\n[v0] Premières lignes du fichier:")
        for i, line in enumerate(lines):
            print(f"Ligne {i+1}: {line}")
        
        # Essayer différentes approches de parsing
        print("\n[v0] Tentative 1: Parsing standard avec pandas...")
        try:
            df = pd.read_csv(StringIO(content))
            print(f"✓ Succès! Colonnes trouvées: {list(df.columns)}")
            print(f"Nombre de lignes: {len(df)}")
            return df
        except Exception as e:
            print(f"✗ Échec: {e}")
        
        print("\n[v0] Tentative 2: Parsing avec séparateur point-virgule...")
        try:
            df = pd.read_csv(StringIO(content), sep=';')
            print(f"✓ Succès! Colonnes trouvées: {list(df.columns)}")
            print(f"Nombre de lignes: {len(df)}")
            return df
        except Exception as e:
            print(f"✗ Échec: {e}")
        
        print("\n[v0] Tentative 3: Parsing avec détection automatique du séparateur...")
        try:
            # Détecter le séparateur
            sniffer = csv.Sniffer()
            sample = '\n'.join(lines[:5])
            delimiter = sniffer.sniff(sample).delimiter
            print(f"Séparateur détecté: '{delimiter}'")
            
            df = pd.read_csv(StringIO(content), sep=delimiter)
            print(f"✓ Succès! Colonnes trouvées: {list(df.columns)}")
            print(f"Nombre de lignes: {len(df)}")
            return df
        except Exception as e:
            print(f"✗ Échec: {e}")
        
        print("\n[v0] Tentative 4: Parsing ligne par ligne...")
        try:
            reader = csv.reader(StringIO(content))
            rows = list(reader)
            if rows:
                headers = rows[0]
                print(f"✓ En-têtes trouvés: {headers}")
                print(f"Nombre total de lignes: {len(rows)}")
                
                # Vérifier la consistance des colonnes
                col_counts = {}
                for i, row in enumerate(rows[:20]):  # Vérifier les 20 premières lignes
                    col_count = len(row)
                    col_counts[col_count] = col_counts.get(col_count, 0) + 1
                    if i < 5:
                        print(f"Ligne {i+1}: {col_count} colonnes - {row}")
                
                print(f"Distribution des nombres de colonnes: {col_counts}")
                return headers
        except Exception as e:
            print(f"✗ Échec: {e}")
        
        print("\n[v0] Toutes les tentatives ont échoué.")
        return None
        
    except Exception as e:
        print(f"[v0] Erreur lors du téléchargement: {e}")
        return None

# Exécuter l'analyse
result = analyze_csv_robust()
if result is not None:
    print(f"\n[v0] Analyse terminée avec succès!")
else:
    print(f"\n[v0] Impossible d'analyser le fichier CSV.")
