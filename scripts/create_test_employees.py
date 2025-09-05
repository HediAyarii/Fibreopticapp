#!/usr/bin/env python3
"""
Script pour créer des employés de test avec les nouveaux champs
"""

import psycopg2
import os
from datetime import datetime

def connect_to_database():
    """Connexion à la base de données PostgreSQL"""
    try:
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="finalfibre_db",
            user="finalfibre_user",
            password="finalfibre_password",
            sslmode="disable"
        )
        return conn
    except Exception as e:
        print(f"[ERREUR] Connexion à la base de données: {e}")
        return None

def create_test_employees():
    """Créer des employés de test avec les nouveaux champs"""
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Employés de test avec les nouveaux champs
        test_employees = [
            {
                'matricule': 'EMP001',
                'nom': 'BEN SALAH',
                'prenom': 'Hamza',
                'email': 'hamza.bensalah@finalfibre.com',
                'telephone': '+33 6 12 34 56 78',
                'poste': 'Technicien Senior',
                'departement': 'Technique',
                'region': 'AVRANCHES',
                'plaque_vehicule': 'ED316DL',
                'numero_carte_carburant': '17',
                'salaire_base': 3500.00,
                'taux_horaire': 25.50,
                'pourcentage_taxe': 20.00,
                'statut': 'actif',
                'niveau_acces': 'technicien',
                'commentaires': 'Excellent technicien avec 5 ans d\'expérience'
            },
            {
                'matricule': 'EMP002',
                'nom': 'MARTIN',
                'prenom': 'Sophie',
                'email': 'sophie.martin@finalfibre.com',
                'telephone': '+33 6 98 76 54 32',
                'poste': 'Chef d\'Équipe',
                'departement': 'Technique',
                'region': 'BRECEY',
                'plaque_vehicule': 'EK431DD',
                'numero_carte_carburant': '0',
                'salaire_base': 4200.00,
                'taux_horaire': 30.00,
                'pourcentage_taxe': 22.00,
                'statut': 'actif',
                'niveau_acces': 'chef_equipe',
                'commentaires': 'Chef d\'équipe expérimentée, gestion de 8 techniciens'
            },
            {
                'matricule': 'EMP003',
                'nom': 'DUPONT',
                'prenom': 'Jean',
                'email': 'jean.dupont@finalfibre.com',
                'telephone': '+33 6 11 22 33 44',
                'poste': 'Technicien',
                'departement': 'Technique',
                'region': 'PARIS',
                'plaque_vehicule': 'AB123CD',
                'numero_carte_carburant': '25',
                'salaire_base': 2800.00,
                'taux_horaire': 22.00,
                'pourcentage_taxe': 18.50,
                'statut': 'actif',
                'niveau_acces': 'technicien',
                'commentaires': 'Technicien junior, en formation'
            },
            {
                'matricule': 'EMP004',
                'nom': 'LEBLANC',
                'prenom': 'Marie',
                'email': 'marie.leblanc@finalfibre.com',
                'telephone': '+33 6 55 66 77 88',
                'poste': 'Superviseur',
                'departement': 'Administration',
                'region': 'LYON',
                'plaque_vehicule': 'EF456GH',
                'numero_carte_carburant': '30',
                'salaire_base': 4500.00,
                'taux_horaire': 35.00,
                'pourcentage_taxe': 25.00,
                'statut': 'actif',
                'niveau_acces': 'superadmin',
                'commentaires': 'Superviseur régional, gestion multi-sites'
            },
            {
                'matricule': 'EMP005',
                'nom': 'PETIT',
                'prenom': 'Pierre',
                'email': 'pierre.petit@finalfibre.com',
                'telephone': '+33 6 99 88 77 66',
                'poste': 'Technicien',
                'departement': 'Technique',
                'region': 'MARSEILLE',
                'plaque_vehicule': 'IJ789KL',
                'numero_carte_carburant': '42',
                'salaire_base': 3200.00,
                'taux_horaire': 24.00,
                'pourcentage_taxe': 19.00,
                'statut': 'actif',
                'niveau_acces': 'technicien',
                'commentaires': 'Spécialiste fibre optique, certifications Cisco'
            }
        ]
        
        print(f"[INFO] Création de {len(test_employees)} employés de test...")
        
        for i, emp in enumerate(test_employees, 1):
            # Vérifier si l'employé existe déjà
            cursor.execute("SELECT id FROM employes WHERE matricule = %s OR email = %s", 
                         (emp['matricule'], emp['email']))
            existing = cursor.fetchone()
            
            if existing:
                print(f"[ATTENTION] Employé {emp['matricule']} existe déjà, ignoré")
                continue
            
            # Insérer le nouvel employé
            insert_query = """
                INSERT INTO employes (
                    matricule, nom, prenom, email, telephone, poste, departement,
                    region, plaque_vehicule, numero_carte_carburant, salaire_base, 
                    taux_horaire, pourcentage_taxe, statut, niveau_acces, commentaires,
                    created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING id
            """
            
            values = (
                emp['matricule'], emp['nom'], emp['prenom'], emp['email'], emp['telephone'],
                emp['poste'], emp['departement'], emp['region'], emp['plaque_vehicule'],
                emp['numero_carte_carburant'], emp['salaire_base'], emp['taux_horaire'],
                emp['pourcentage_taxe'], emp['statut'], emp['niveau_acces'], emp['commentaires'],
                datetime.now(), datetime.now()
            )
            
            cursor.execute(insert_query, values)
            emp_id = cursor.fetchone()[0]
            
            print(f"[SUCCES] Employé {i}/{len(test_employees)} créé: {emp['prenom']} {emp['nom']} (ID: {emp_id})")
        
        conn.commit()
        
        # Vérifier le nombre total d'employés
        cursor.execute("SELECT COUNT(*) FROM employes")
        total_count = cursor.fetchone()[0]
        print(f"[INFO] Total d'employés dans la base: {total_count}")
        
        return True
        
    except Exception as e:
        print(f"[ERREUR] Création des employés: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("Création d'employés de test avec les nouveaux champs")
    print("=" * 60)
    
    success = create_test_employees()
    
    if success:
        print("\n[TERMINE] Employés de test créés avec succès!")
    else:
        print("\n[ECHEC] Erreur lors de la création des employés")
