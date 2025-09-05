#!/usr/bin/env python3
"""
Script d'import des interventions via API Next.js
Utilise le script intelligent pour gérer les doublons Num Inter + Date RDV
"""

import os
import sys
import subprocess
import argparse

def import_interventions_via_api(csv_file_path):
    """Importer les interventions en utilisant le script intelligent"""
    print(f"🚀 Import des interventions via script intelligent: {csv_file_path}")
    print("=" * 60)
    
    if not os.path.exists(csv_file_path):
        print(f"❌ Fichier non trouvé: {csv_file_path}")
        return False
    
    try:
        # Utiliser le script intelligent pour les interventions
        cmd = [sys.executable, "scripts/smart_import_interventions.py", "--file", csv_file_path]
        
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
    parser = argparse.ArgumentParser(description='Import des interventions via script intelligent')
    parser.add_argument('--file', required=True, help='Chemin vers le fichier CSV')
    
    args = parser.parse_args()
    
    success = import_interventions_via_api(args.file)
    if success:
        print("\n🎉 Import terminé avec succès!")
    else:
        print("\n💥 Import échoué!")
        sys.exit(1)

if __name__ == "__main__":
    main()
