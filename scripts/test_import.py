#!/usr/bin/env python3
"""
Script de test pour vérifier la fonctionnalité d'importation
FinalFibre Application - Test des imports
"""

import os
import sys
import pandas as pd
from import_to_database import DatabaseImporter

def create_test_data():
    """Créer des données de test pour les interventions"""
    test_interventions = [
        {
            'Num Inter': 'TEST001',
            'Date RDV': '2024-01-15',
            'Region': 'Paris',
            'Plaque': 'ABC-123',
            'Societe': 'Test Company',
            'Nom Technicien': 'Dupont',
            'Prenom Technicien': 'Jean',
            'Client': 'Client Test',
            'Statut': 'Termine'
        },
        {
            'Num Inter': 'TEST002',
            'Date RDV': '2024-01-16',
            'Region': 'Lyon',
            'Plaque': 'DEF-456',
            'Societe': 'Test Company',
            'Nom Technicien': 'Martin',
            'Prenom Technicien': 'Pierre',
            'Client': 'Client Test 2',
            'Statut': 'En cours'
        }
    ]
    
    df = pd.DataFrame(test_interventions)
    df.to_csv('test_interventions.csv', index=False)
    print("✅ Fichier de test interventions créé: test_interventions.csv")
    
    # Créer des données de test pour le carburant
    test_carburant = [
        {
            'N° de justificatif': 'JUST001',
            'Date fact.': '2024-01-15',
            'Date de livraison': '2024-01-15',
            'Heure de livraison': '14:30',
            'Immat. véhicule': 'ABC-123',
            'N° de carte': 'CARD001',
            'km': '50000',
            'Quantité': '50',
            'CA TTC': '75.50'
        },
        {
            'N° de justificatif': 'JUST002',
            'Date fact.': '2024-01-16',
            'Date de livraison': '2024-01-16',
            'Heure de livraison': '09:15',
            'Immat. véhicule': 'DEF-456',
            'N° de carte': 'CARD002',
            'km': '52000',
            'Quantité': '45',
            'CA TTC': '68.25'
        }
    ]
    
    df_carburant = pd.DataFrame(test_carburant)
    df_carburant.to_csv('test_carburant.csv', index=False)
    print("✅ Fichier de test carburant créé: test_carburant.csv")

def test_database_connection():
    """Tester la connexion à la base de données"""
    print("🔌 Test de connexion à la base de données...")
    
    importer = DatabaseImporter()
    
    try:
        if importer.connect():
            print("✅ Connexion à PostgreSQL réussie")
            
            # Test de requête simple
            importer.cursor.execute("SELECT version();")
            version = importer.cursor.fetchone()
            print(f"📊 Version PostgreSQL: {version[0]}")
            
            # Vérifier l'existence des tables
            importer.cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = importer.cursor.fetchall()
            print(f"📋 Tables disponibles: {[table[0] for table in tables]}")
            
            return True
        else:
            print("❌ Échec de la connexion à PostgreSQL")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test de connexion: {e}")
        return False
    finally:
        importer.disconnect()

def main():
    print("🧪 Test de la fonctionnalité d'importation FinalFibre")
    print("=" * 50)
    
    # Test 1: Connexion à la base
    if not test_database_connection():
        print("❌ Test de connexion échoué. Vérifiez que PostgreSQL est démarré.")
        sys.exit(1)
    
    # Test 2: Création des données de test
    print("\n📝 Création des données de test...")
    create_test_data()
    
    # Test 3: Import des interventions
    print("\n📥 Test d'import des interventions...")
    importer = DatabaseImporter()
    
    try:
        if importer.connect():
            success = importer.import_interventions('test_interventions.csv')
            if success:
                print("✅ Import des interventions réussi")
            else:
                print("❌ Import des interventions échoué")
        else:
            print("❌ Impossible de se connecter à la base")
    finally:
        importer.disconnect()
    
    # Test 4: Import du carburant
    print("\n⛽ Test d'import du carburant...")
    importer = DatabaseImporter()
    
    try:
        if importer.connect():
            success = importer.import_carburant('test_carburant.csv')
            if success:
                print("✅ Import du carburant réussi")
            else:
                print("❌ Import du carburant échoué")
        else:
            print("❌ Impossible de se connecter à la base")
    finally:
        importer.disconnect()
    
    print("\n🎉 Tests terminés!")
    print("\n📋 Pour utiliser le script d'import:")
    print("   python scripts/import_to_database.py --type interventions --file votre_fichier.csv")
    print("   python scripts/import_to_database.py --type carburant --file votre_fichier.csv")

if __name__ == "__main__":
    main()
