#!/usr/bin/env python3
import pandas as pd

# Test the extraction logic
df = pd.read_csv('test_employees_fixed.csv', sep=';', encoding='iso-8859-1')
print("CSV columns:", list(df.columns))
print("First row data:")
for col in df.columns:
    print(f"  {col}: '{df.iloc[0][col]}'")

print("\nTesting extraction logic:")
for index, row in df.iterrows():
    nom_technicien = str(row.get('Nom Technicien', '')).strip()
    prenom_technicien = str(row.get('Prénom Technicien', '')).strip()
    print(f"Row {index}: nom='{nom_technicien}', prenom='{prenom_technicien}'")
