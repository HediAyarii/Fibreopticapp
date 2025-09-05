#!/usr/bin/env python3
"""
Script de migration pour ajouter le champ prix_unitaire à la table materiel
"""

import psycopg2
from pathlib import Path

def connect_to_database():
    """Connexion à la base de données PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="finalfibre_db",
            user="finalfibre_user",
            password="finalfibre_password_2024",
            sslmode="disable"
        )
        return conn
    except Exception as e:
        print(f"[ERREUR] Impossible de se connecter à la base de données: {e}")
        return None

def execute_migration():
    """Exécute le script de migration"""
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Lire le script de migration
        script_path = Path(__file__).parent / "migrate_prix_unitaire.sql"
        with open(script_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("[DEBUT] Exécution de la migration prix_unitaire...")
        
        # Exécuter le script de migration
        cursor.execute(migration_sql)
        conn.commit()
        
        print("[SUCCES] Migration prix_unitaire terminée avec succès!")
        
        # Vérifier les modifications
        print("\n[VERIFICATION] Vérification des modifications...")
        
        # Vérifier la colonne prix_unitaire
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'materiel' AND column_name = 'prix_unitaire'
        """)
        prix_col = cursor.fetchone()
        if prix_col:
            print(f"✓ Colonne 'prix_unitaire' ajoutée: {prix_col}")
        else:
            print("✗ Colonne 'prix_unitaire' non trouvée")
        
        # Compter les enregistrements dans materiel
        cursor.execute("SELECT COUNT(*) FROM materiel")
        count = cursor.fetchone()[0]
        print(f"✓ {count} enregistrements dans la table materiel")
        
        return True
        
    except Exception as e:
        print(f"[ERREUR] Erreur lors de la migration: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("=== Migration prix_unitaire pour FinalFibre ===")
    print("Ce script va:")
    print("- Ajouter le champ 'prix_unitaire' à la table materiel")
    print("- Définir la valeur par défaut à 0.00")
    print()
    
    success = execute_migration()
    
    if success:
        print("\n[TERMINE] Migration réussie!")
        print("Vous pouvez maintenant utiliser le champ prix_unitaire pour calculer les totaux.")
    else:
        print("\n[ECHEC] Migration échouée!")
        print("Vérifiez les logs ci-dessus pour plus de détails.")
