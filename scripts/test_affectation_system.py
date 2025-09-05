#!/usr/bin/env python3
"""
Script de test pour vérifier le système d'affectation de matériel
"""

import psycopg2
import requests
import json

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

def test_database_schema():
    """Teste le schéma de la base de données"""
    print("=== Test du schéma de base de données ===")
    
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Vérifier la table materiel
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'materiel' 
            ORDER BY ordinal_position
        """)
        materiel_columns = cursor.fetchall()
        
        print("✓ Colonnes de la table materiel:")
        for col in materiel_columns:
            print(f"  - {col[0]} ({col[1]}) - Nullable: {col[2]} - Default: {col[3]}")
        
        # Vérifier la table affectations_materiel
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'affectations_materiel' 
            ORDER BY ordinal_position
        """)
        affectations_columns = cursor.fetchall()
        
        print("\n✓ Colonnes de la table affectations_materiel:")
        for col in affectations_columns:
            print(f"  - {col[0]} ({col[1]}) - Nullable: {col[2]} - Default: {col[3]}")
        
        # Vérifier les contraintes de clé étrangère
        cursor.execute("""
            SELECT 
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name IN ('materiel', 'affectations_materiel')
        """)
        foreign_keys = cursor.fetchall()
        
        print("\n✓ Contraintes de clé étrangère:")
        for fk in foreign_keys:
            print(f"  - {fk[1]}.{fk[2]} -> {fk[3]}.{fk[4]}")
        
        return True
        
    except Exception as e:
        print(f"[ERREUR] Erreur lors du test du schéma: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def test_api_endpoints():
    """Teste les endpoints API"""
    print("\n=== Test des endpoints API ===")
    
    base_url = "http://localhost:3000"
    
    # Test de l'API matériel
    try:
        response = requests.get(f"{base_url}/api/materiel")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API matériel: {len(data.get('materiel', []))} matériels trouvés")
        else:
            print(f"✗ API matériel: Erreur {response.status_code}")
    except Exception as e:
        print(f"✗ API matériel: {e}")
    
    # Test de l'API affectations
    try:
        response = requests.get(f"{base_url}/api/affectations-materiel")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API affectations: {len(data.get('affectations', []))} affectations trouvées")
        else:
            print(f"✗ API affectations: Erreur {response.status_code}")
    except Exception as e:
        print(f"✗ API affectations: {e}")
    
    # Test de l'API employés
    try:
        response = requests.get(f"{base_url}/api/employes")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ API employés: {len(data.get('employes', []))} employés trouvés")
        else:
            print(f"✗ API employés: Erreur {response.status_code}")
    except Exception as e:
        print(f"✗ API employés: {e}")

def create_test_data():
    """Crée des données de test"""
    print("\n=== Création de données de test ===")
    
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Créer un employé de test
        cursor.execute("""
            INSERT INTO employes (matricule, nom, prenom, email, telephone, poste, statut)
            VALUES ('EMP001', 'Dupont', 'Jean', 'jean.dupont@test.com', '0123456789', 'Technicien', 'actif')
            ON CONFLICT (matricule) DO NOTHING
            RETURNING id
        """)
        result = cursor.fetchone()
        if result:
            employe_id = result[0]
            print(f"✓ Employé de test créé (ID: {employe_id})")
        else:
            cursor.execute("SELECT id FROM employes WHERE matricule = 'EMP001'")
            employe_id = cursor.fetchone()[0]
            print(f"✓ Employé de test existant (ID: {employe_id})")
        
        # Créer un matériel de test
        cursor.execute("""
            INSERT INTO materiel (nom_equipement, type_materiel, marque, modele, statut, quantite)
            VALUES ('Routeur Test', 'routeur', 'Cisco', 'ASR1000', 'disponible', 5)
            ON CONFLICT (numero_serie) DO NOTHING
            RETURNING id
        """)
        result = cursor.fetchone()
        if result:
            materiel_id = result[0]
            print(f"✓ Matériel de test créé (ID: {materiel_id})")
        else:
            cursor.execute("SELECT id FROM materiel WHERE nom_equipement = 'Routeur Test'")
            materiel_id = cursor.fetchone()[0]
            print(f"✓ Matériel de test existant (ID: {materiel_id})")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"[ERREUR] Erreur lors de la création des données de test: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def test_affectation_workflow():
    """Teste le workflow d'affectation"""
    print("\n=== Test du workflow d'affectation ===")
    
    base_url = "http://localhost:3000"
    
    try:
        # Récupérer les données existantes
        response = requests.get(f"{base_url}/api/materiel")
        materiel_data = response.json().get('materiel', [])
        
        response = requests.get(f"{base_url}/api/employes")
        employes_data = response.json().get('employes', [])
        
        if not materiel_data or not employes_data:
            print("✗ Données insuffisantes pour le test")
            return False
        
        materiel_id = materiel_data[0]['id']
        employe_id = employes_data[0]['id']
        quantite_initiale = materiel_data[0]['quantite']
        
        print(f"✓ Matériel sélectionné: {materiel_data[0]['nom_equipement']} (Stock: {quantite_initiale})")
        print(f"✓ Employé sélectionné: {employes_data[0]['prenom']} {employes_data[0]['nom']}")
        
        # Créer une affectation
        affectation_data = {
            "materiel_id": materiel_id,
            "employe_id": employe_id,
            "quantite_assignee": 2,
            "commentaires": "Test d'affectation automatique"
        }
        
        response = requests.post(f"{base_url}/api/affectations-materiel", 
                               json=affectation_data)
        
        if response.status_code == 200:
            print("✓ Affectation créée avec succès")
            
            # Vérifier que le stock a été diminué
            response = requests.get(f"{base_url}/api/materiel")
            updated_materiel = response.json().get('materiel', [])
            materiel_updated = next((m for m in updated_materiel if m['id'] == materiel_id), None)
            
            if materiel_updated and materiel_updated['quantite'] == quantite_initiale - 2:
                print(f"✓ Stock mis à jour: {quantite_initiale} -> {materiel_updated['quantite']}")
            else:
                print(f"✗ Stock non mis à jour correctement")
            
            # Vérifier l'affectation
            response = requests.get(f"{base_url}/api/affectations-materiel")
            affectations = response.json().get('affectations', [])
            nouvelle_affectation = next((a for a in affectations if a['materiel_id'] == materiel_id and a['employe_id'] == employe_id), None)
            
            if nouvelle_affectation:
                print(f"✓ Affectation trouvée: {nouvelle_affectation['quantite_assignee']} unités assignées")
            else:
                print("✗ Affectation non trouvée")
            
            return True
        else:
            print(f"✗ Erreur lors de la création de l'affectation: {response.status_code}")
            print(f"  Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERREUR] Erreur lors du test du workflow: {e}")
        return False

if __name__ == "__main__":
    print("=== Test du système d'affectation de matériel ===")
    print()
    
    # Tests
    schema_ok = test_database_schema()
    data_ok = create_test_data()
    workflow_ok = test_affectation_workflow()
    
    print("\n=== Résumé des tests ===")
    print(f"Schéma de base de données: {'✓' if schema_ok else '✗'}")
    print(f"Données de test: {'✓' if data_ok else '✗'}")
    print(f"Workflow d'affectation: {'✓' if workflow_ok else '✗'}")
    
    if schema_ok and data_ok and workflow_ok:
        print("\n🎉 Tous les tests sont passés avec succès!")
        print("Le système d'affectation de matériel est fonctionnel.")
    else:
        print("\n❌ Certains tests ont échoué.")
        print("Vérifiez les logs ci-dessus pour plus de détails.")
