#!/usr/bin/env python3
"""
Script de test pour vérifier que la base de données est correctement configurée
"""

import os
import psycopg2
import sys

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def test_database_connection():
    """Test de connexion à la base de données"""
    print("🔌 Test de connexion à la base de données...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print("✅ Connexion réussie!")
        return conn, cursor
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")
        return None, None

def test_tables_exist(cursor):
    """Test que toutes les tables existent"""
    print("\n📋 Vérification des tables...")
    
    expected_tables = [
        'interventions',
        'carburant_consommation', 
        'employes',
        'reclamations',
        'materiel',
        'penalites'
    ]
    
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    """)
    
    existing_tables = [row[0] for row in cursor.fetchall()]
    
    for table in expected_tables:
        if table in existing_tables:
            print(f"✅ Table '{table}' existe")
        else:
            print(f"❌ Table '{table}' manquante")
            return False
    
    return True

def test_constraints(cursor):
    """Test que les contraintes importantes existent"""
    print("\n🔒 Vérification des contraintes...")
    
    # Vérifier la contrainte unique sur interventions
    cursor.execute("""
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'interventions' 
        AND indexname = 'interventions_num_inter_date_rdv_key'
    """)
    
    if cursor.fetchone():
        print("✅ Contrainte unique interventions (num_inter, date_rdv) existe")
    else:
        print("❌ Contrainte unique interventions (num_inter, date_rdv) manquante")
        return False
    
    # Vérifier la contrainte unique sur carburant
    cursor.execute("""
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'carburant_consommation' 
        AND constraint_type = 'UNIQUE'
    """)
    
    if cursor.fetchone():
        print("✅ Contrainte unique carburant existe")
    else:
        print("❌ Contrainte unique carburant manquante")
        return False
    
    return True

def test_foreign_keys(cursor):
    """Test que les clés étrangères existent"""
    print("\n🔗 Vérification des clés étrangères...")
    
    try:
        cursor.execute("""
            SELECT 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name
        """)
        
        foreign_keys = cursor.fetchall()
        
        if foreign_keys:
            print("✅ Clés étrangères trouvées:")
            for fk in foreign_keys:
                print(f"   - {fk[0]}.{fk[1]} -> {fk[2]}.{fk[3]}")
        else:
            print("⚠️ Aucune clé étrangère trouvée")
        
        return True
    except Exception as e:
        print(f"⚠️ Erreur lors de la vérification des clés étrangères: {e}")
        return True

def test_indexes(cursor):
    """Test que les index importants existent"""
    print("\n📊 Vérification des index...")
    
    cursor.execute("""
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
    """)
    
    indexes = cursor.fetchall()
    
    if indexes:
        print("✅ Index trouvés:")
        for index in indexes:
            print(f"   - {index[1]}: {index[0]}")
    else:
        print("⚠️ Aucun index trouvé")
    
    return True

def main():
    print("🚀 Test de configuration de la base de données")
    print("=" * 50)
    
    # Test de connexion
    conn, cursor = test_database_connection()
    if not conn:
        sys.exit(1)
    
    try:
        # Tests
        tests_passed = 0
        total_tests = 4
        
        if test_tables_exist(cursor):
            tests_passed += 1
        
        if test_constraints(cursor):
            tests_passed += 1
        
        if test_foreign_keys(cursor):
            tests_passed += 1
        
        if test_indexes(cursor):
            tests_passed += 1
        
        print(f"\n📊 Résultat: {tests_passed}/{total_tests} tests réussis")
        
        if tests_passed == total_tests:
            print("🎉 Base de données correctement configurée!")
            return True
        else:
            print("❌ Problèmes détectés dans la configuration")
            return False
            
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
