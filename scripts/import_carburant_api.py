#!/usr/bin/env python3
"""
Script d'import du carburant via API Next.js
Utilise le script universel pour gérer les fichiers CSV/Excel
"""

import os
import sys
import subprocess
import argparse

def import_carburant_via_api(file_path):
    """Importer le carburant en utilisant le script universel"""
    print(f"🚀 Import du carburant via script universel: {file_path}")
    print("=" * 60)
    
    if not os.path.exists(file_path):
        print(f"❌ Fichier non trouvé: {file_path}")
        return False
    
    try:
        # Déterminer le script à utiliser selon l'extension
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == '.xlsx':
            # Utiliser le script Excel pour les fichiers .xlsx
            cmd = [sys.executable, "scripts/import_carburant_excel.py", "--file", file_path]
        else:
            # Utiliser le script universel pour les fichiers CSV
            cmd = [sys.executable, "scripts/import_carburant_universal.py", "--file", file_path]
        
        print(f"📋 Commande exécutée: {' '.join(cmd)}")
        print("🔄 Exécution en cours...")
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print("✅ Import réussi!")
            print(result.stdout)
            return True
        else:
            print("❌ Erreur lors de l'import:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Import du carburant via script universel')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier CSV ou XLSX')
    
    args = parser.parse_args()
    
    success = import_carburant_via_api(args.file)
    if success:
        print("\n🎉 Import terminé avec succès!")
    else:
        print("\n💥 Import échoué!")
        sys.exit(1)

if __name__ == "__main__":
    main()
