#!/usr/bin/env python3
"""
Script de migration pour mettre à jour la base de données
- Ajoute le champ quantite à la table materiel
- Supprime le champ employe_responsable de la table materiel  
- Crée la table affectations_materiel
- Met à jour les index
"""

import psycopg2
import os
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
        script_path = Path(__file__).parent / "migrate_database.sql"
        with open(script_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("[DEBUT] Exécution de la migration...")
        
        # Exécuter le script de migration
        cursor.execute(migration_sql)
        conn.commit()
        
        print("[SUCCES] Migration terminée avec succès!")
        
        # Vérifier les modifications
        print("\n[VERIFICATION] Vérification des modifications...")
        
        # Vérifier la colonne quantite
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'materiel' AND column_name = 'quantite'
        """)
        quantite_col = cursor.fetchone()
        if quantite_col:
            print(f"✓ Colonne 'quantite' ajoutée: {quantite_col}")
        else:
            print("✗ Colonne 'quantite' non trouvée")
        
        # Vérifier que employe_responsable a été supprimée
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'materiel' AND column_name = 'employe_responsable'
        """)
        employe_resp = cursor.fetchone()
        if not employe_resp:
            print("✓ Colonne 'employe_responsable' supprimée")
        else:
            print("✗ Colonne 'employe_responsable' existe encore")
        
        # Vérifier la table affectations_materiel
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'affectations_materiel'
        """)
        affectations_table = cursor.fetchone()
        if affectations_table:
            print("✓ Table 'affectations_materiel' créée")
        else:
            print("✗ Table 'affectations_materiel' non trouvée")
        
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
    print("=== Migration de la base de données FinalFibre ===")
    print("Ce script va:")
    print("- Ajouter le champ 'quantite' à la table materiel")
    print("- Supprimer le champ 'employe_responsable' de la table materiel")
    print("- Créer la table 'affectations_materiel'")
    print("- Mettre à jour les index")
    print()
    
    success = execute_migration()
    
    if success:
        print("\n[TERMINE] Migration réussie!")
        print("Vous pouvez maintenant utiliser le nouveau système d'affectation de matériel.")
    else:
        print("\n[ECHEC] Migration échouée!")
        print("Vérifiez les logs ci-dessus pour plus de détails.")
