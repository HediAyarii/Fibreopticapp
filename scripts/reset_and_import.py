#!/usr/bin/env python3
"""
Script pour vider les tables et réimporter les données
"""

import os
import sys
import psycopg2
import subprocess
import argparse
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def reset_tables():
    """Vider les tables interventions et carburant_consommation"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        logger.info("🗑️ Vidage des tables...")
        
        # Vider les tables dans l'ordre correct (respecter les contraintes FK)
        cursor.execute("DELETE FROM penalites;")
        cursor.execute("DELETE FROM reclamations;")
        cursor.execute("DELETE FROM materiel;")
        cursor.execute("DELETE FROM employes;")
        cursor.execute("DELETE FROM carburant_consommation;")
        cursor.execute("DELETE FROM interventions;")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        logger.info("✅ Tables vidées avec succès")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du vidage des tables: {e}")
        return False

def run_import(file_path, data_type):
    """Exécuter l'import avec le script amélioré"""
    try:
        logger.info(f"🚀 Lancement de l'import {data_type} depuis {file_path}")
        
        cmd = [
            sys.executable, 
            "scripts/import_to_database_improved.py",
            "--type", data_type,
            "--file", file_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("✅ Import terminé avec succès")
            logger.info("📄 Sortie:")
            print(result.stdout)
        else:
            logger.error("❌ Import échoué")
            logger.error("📄 Erreur:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'exécution de l'import: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Reset et import des données')
    parser.add_argument('--type', choices=['interventions', 'carburant'], required=True,
                       help='Type de données à importer')
    parser.add_argument('--file', required=True,
                       help='Chemin vers le fichier CSV à importer')
    parser.add_argument('--no-reset', action='store_true',
                       help='Ne pas vider les tables avant l\'import')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        logger.error(f"❌ Fichier non trouvé: {args.file}")
        sys.exit(1)
    
    try:
        # Vider les tables si demandé
        if not args.no_reset:
            if not reset_tables():
                sys.exit(1)
        
        # Exécuter l'import
        if not run_import(args.file, args.type):
            sys.exit(1)
            
        logger.info("🎉 Processus terminé avec succès!")
            
    except KeyboardInterrupt:
        logger.info("⏹️ Processus interrompu par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Erreur inattendue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
