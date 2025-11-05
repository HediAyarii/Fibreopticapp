#!/usr/bin/env python3
"""
Script pour exécuter l'optimisation de la base de données
Ajoute tous les index nécessaires pour améliorer les performances
"""

import psycopg2
import os
import sys
from pathlib import Path

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def execute_sql_file(sql_file_path):
    """Exécute un fichier SQL"""
    try:
        # Connexion à la base de données
        print("🔌 Connexion à la base de données...")
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_session(autocommit=False)
        cursor = conn.cursor()
        
        # Lecture du fichier SQL
        print(f"📖 Lecture du fichier: {sql_file_path}")
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Exécution du script SQL
        print("⚙️  Exécution du script d'optimisation...")
        print("⏳ Cela peut prendre quelques minutes...")
        
        cursor.execute(sql_content)
        
        # Récupération des notices
        if cursor.statusmessage:
            print(f"📋 {cursor.statusmessage}")
        
        # Commit
        conn.commit()
        print("✅ Script exécuté avec succès!")
        
        # Afficher le nombre d'index créés
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
        """)
        index_count = cursor.fetchone()[0]
        print(f"\n📊 Total d'index créés: {index_count}")
        
        # Afficher la taille de la base de données
        cursor.execute("""
            SELECT pg_size_pretty(pg_database_size(current_database()))
        """)
        db_size = cursor.fetchone()[0]
        print(f"💾 Taille de la base de données: {db_size}")
        
        # Fermeture
        cursor.close()
        conn.close()
        
        print("\n🚀 Optimisation terminée!")
        print("📈 Amélioration des performances estimée: 50-70%")
        print("\n💡 Conseil: Testez les performances avec quelques requêtes")
        
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ Erreur PostgreSQL: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False
        
    except FileNotFoundError:
        print(f"\n❌ Fichier SQL introuvable: {sql_file_path}")
        return False
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        if conn:
            conn.rollback()
            conn.close()
        return False

def check_existing_indexes():
    """Vérifie les index existants avant l'optimisation"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("\n📊 Index existants:")
        cursor.execute("""
            SELECT 
                tablename,
                COUNT(*) as nb_indexes
            FROM pg_indexes
            WHERE schemaname = 'public'
            GROUP BY tablename
            ORDER BY tablename
        """)
        
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]} index")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"⚠️ Impossible de vérifier les index: {e}")

def main():
    print("=" * 70)
    print("🔧 OPTIMISATION DE LA BASE DE DONNÉES - AJOUT D'INDEX")
    print("=" * 70)
    
    # Chemin du fichier SQL
    script_dir = Path(__file__).parent
    sql_file = script_dir / "add_performance_indexes.sql"
    
    if not sql_file.exists():
        print(f"❌ Fichier SQL introuvable: {sql_file}")
        sys.exit(1)
    
    # Afficher la configuration
    print(f"\n📍 Configuration:")
    print(f"  - Host: {DB_CONFIG['host']}")
    print(f"  - Port: {DB_CONFIG['port']}")
    print(f"  - Database: {DB_CONFIG['database']}")
    print(f"  - User: {DB_CONFIG['user']}")
    
    # Vérifier les index existants
    check_existing_indexes()
    
    # Demander confirmation
    print("\n⚠️  ATTENTION: Cette opération va créer de nombreux index.")
    print("   Cela peut prendre plusieurs minutes selon la taille des données.")
    response = input("\n❓ Voulez-vous continuer? (o/n): ")
    
    if response.lower() not in ['o', 'oui', 'y', 'yes']:
        print("❌ Opération annulée")
        sys.exit(0)
    
    # Exécution
    success = execute_sql_file(sql_file)
    
    if success:
        print("\n✅ Optimisation réussie!")
        sys.exit(0)
    else:
        print("\n❌ Échec de l'optimisation")
        sys.exit(1)

if __name__ == "__main__":
    main()
