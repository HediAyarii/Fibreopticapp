import requests
import pandas as pd
import io

def analyze_csv_file():
    """Analyze the CSV file to extract all attributes/columns"""
    
    url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/EXPORT_INTER_%5B02-06-2025_15h39%5D-SrJ3NlubpZrE24WEciqdMLQkayXvVL.csv"
    
    try:
        # Download the CSV file
        print("[v0] Downloading CSV file...")
        response = requests.get(url)
        response.raise_for_status()
        
        # Read CSV content
        csv_content = response.text
        print(f"[v0] CSV file downloaded successfully. Size: {len(csv_content)} characters")
        
        # Parse CSV with pandas
        df = pd.read_csv(io.StringIO(csv_content))
        
        print(f"[v0] CSV parsed successfully. Shape: {df.shape}")
        print(f"[v0] Number of rows: {df.shape[0]}")
        print(f"[v0] Number of columns: {df.shape[1]}")
        
        # Display all column names
        print("\n=== TOUS LES ATTRIBUTS/COLONNES DU FICHIER CSV ===")
        for i, column in enumerate(df.columns, 1):
            print(f"{i:2d}. {column}")
        
        # Display first few rows to understand data structure
        print("\n=== APERÇU DES PREMIÈRES LIGNES ===")
        print(df.head(3).to_string())
        
        # Display data types
        print("\n=== TYPES DE DONNÉES ===")
        for column in df.columns:
            print(f"{column}: {df[column].dtype}")
        
        # Check for missing values
        print("\n=== VALEURS MANQUANTES ===")
        missing_values = df.isnull().sum()
        for column in df.columns:
            if missing_values[column] > 0:
                print(f"{column}: {missing_values[column]} valeurs manquantes")
        
        return df.columns.tolist()
        
    except requests.exceptions.RequestException as e:
        print(f"[v0] Erreur lors du téléchargement: {e}")
        return None
    except pd.errors.EmptyDataError:
        print("[v0] Le fichier CSV est vide")
        return None
    except Exception as e:
        print(f"[v0] Erreur lors de l'analyse: {e}")
        return None

if __name__ == "__main__":
    columns = analyze_csv_file()
    if columns:
        print(f"\n[v0] Analyse terminée. {len(columns)} colonnes trouvées.")
    else:
        print("[v0] Échec de l'analyse du fichier CSV.")
