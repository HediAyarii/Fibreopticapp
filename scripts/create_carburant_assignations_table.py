#!/usr/bin/env python3
"""
Script pour créer la table carburant_assignations
Ce script crée la table nécessaire pour gérer l'historique des assignations de cartes carburant
"""

import psycopg2
import os
from pathlib import Path

def create_carburant_assignations_table():
    """Créer la table carburant_assignations dans la base de données"""
    
    # Configuration de la base de données
    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', '5432')),
        'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
        'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
        'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
    }
    
    try:
        # Connexion à la base de données
        print("🔌 Connexion à la base de données PostgreSQL...")
        conn = psycopg2.connect(**db_config)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("✅ Connexion établie avec succès")
        
        # Lire le fichier SQL
        script_path = Path(__file__).parent / "create_carburant_assignations_table.sql"
        
        if not script_path.exists():
            print(f"❌ Fichier SQL non trouvé: {script_path}")
            return False
            
        with open(script_path, 'r', encoding='utf-8') as file:
            sql_script = file.read()
        
        print("📄 Exécution du script SQL...")
        
        # Exécuter le script SQL
        cursor.execute(sql_script)
        
        print("✅ Table carburant_assignations créée avec succès")
        
        # Vérifier que la table existe
        cursor.execute("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'carburant_assignations'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        print(f"📊 Table créée avec {len(columns)} colonnes:")
        for col in columns:
            print(f"   - {col[1]} ({col[2]})")
        
        # Vérifier les contraintes
        cursor.execute("""
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'carburant_assignations'
        """)
        
        constraints = cursor.fetchall()
        print(f"🔒 {len(constraints)} contraintes créées:")
        for constraint in constraints:
            print(f"   - {constraint[0]} ({constraint[1]})")
        
        cursor.close()
        conn.close()
        
        print("🎉 Script terminé avec succès!")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Erreur PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Création de la table carburant_assignations...")
    success = create_carburant_assignations_table()
    
    if success:
        print("\n✅ La table carburant_assignations est maintenant disponible!")
        print("💡 Vous pouvez maintenant utiliser l'assignation de cartes carburant.")
    else:
        print("\n❌ Échec de la création de la table.")
        print("💡 Vérifiez les logs ci-dessus pour plus de détails.")
