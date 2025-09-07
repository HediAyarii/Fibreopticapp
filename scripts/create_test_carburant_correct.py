import pandas as pd
import os

# Créer un fichier Excel de test pour l'import carburant avec la structure correcte
data = {
    'Date fact.': ['31.05.2025', '31.05.2025', '31.05.2025'],
    'Date de livraison': ['30.04.2025', '16.05.2025', '16.05.2025'],
    'Heure de livraison': ['00:00:01', '12:56:01', '19:09:01'],
    'Immat. véhicule': ['ED316DL', 'EK431DD', 'EK431DD'],
    'N° de carte': ['CARD-001', 'CARD-002', 'CARD-003'],
    'km': [0, 17, 17],
    'Poste 1': [0, 959, 2222],
    'Poste 2': [0, 0, 0],
    'Pays': ['DEU', 'FRA', 'FRA'],
    'N° de station': ['90970', '649404', '649402'],
    'Point d\'acceptation': ['UTA Hauptverwaltung', 'E. LECLERC Quimper', 'E. LECLERC Lanester'],
    'Identifiant autoroute': ['', '', ''],
    'CP': ['--', '29000', '56600'],
    'Type marchandises': ['UTA One Move Frais', 'Gasoil', 'Super, sans plomb E10'],
    'Quantité': [1.00, 53.01, 12.20],
    'Taux TVA': [0, 0, 0],
    ' ': ['EUR', 'EUR', 'EUR'],
    'CA HT': [2.95, 68.10, 17.67],
    'TVA': [0, 0, 0],
    'CA TTC': [2.95, 68.10, 17.67],
    'N° de justificatif': ['BEqAxkLErgRcr', '133569', '186105']
}

df = pd.DataFrame(data)

# Créer le dossier temp s'il n'existe pas
os.makedirs('temp', exist_ok=True)

# Sauvegarder le fichier Excel avec le nom de feuille correct
file_path = 'temp/test_carburant_correct.xlsx'
with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
    df.to_excel(writer, sheet_name='Sheet0', index=False)

print(f"Fichier de test créé: {file_path}")
print(f"Nombre de lignes: {len(df)}")
print("Colonnes:", list(df.columns))
