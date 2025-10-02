#!/usr/bin/env python3
"""
Script pour importer les employés des interventions dans la table employés
"""

import psycopg2
from datetime import datetime
import random

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
        print(f"[ERREUR] Connexion à la base de données: {e}")
        return None

def get_employees_from_interventions():
    """Récupérer les employés distincts des interventions"""
    conn = connect_to_database()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        
        # Récupérer les employés distincts avec leurs statistiques
        query = """
            SELECT DISTINCT 
                nom_technicien, 
                prenom_technicien,
                COUNT(*) as nb_interventions,
                MIN(date_rdv) as premiere_intervention,
                MAX(date_rdv) as derniere_intervention
            FROM interventions 
            WHERE nom_technicien IS NOT NULL 
            AND prenom_technicien IS NOT NULL
            AND nom_technicien != 'nan'
            AND prenom_technicien != 'nan'
            GROUP BY nom_technicien, prenom_technicien
            ORDER BY nb_interventions DESC
        """
        
        cursor.execute(query)
        employees = cursor.fetchall()
        
        print(f"[INFO] {len(employees)} employés trouvés dans les interventions")
        
        return employees
        
    except Exception as e:
        print(f"[ERREUR] Récupération des employés: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def generate_employee_data(nom, prenom, nb_interventions):
    """Générer des données complètes pour un employé basées sur ses interventions"""
    
    # Générer un matricule basé sur le nom/prénom
    matricule = f"EMP{nom[:3].upper()}{prenom[:2].upper()}"
    
    # Générer un email
    email = f"{prenom.lower()}.{nom.lower().replace(' ', '')}@finalfibre.com"
    
    # Générer un téléphone français
    telephone = f"+33 6 {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)} {random.randint(10, 99)}"
    
    # Déterminer le poste basé sur le nombre d'interventions
    if nb_interventions >= 100:
        poste = "Technicien Senior"
        salaire_base = random.uniform(3500, 4200)
        taux_horaire = random.uniform(25, 30)
        niveau_acces = "chef_equipe"
    elif nb_interventions >= 50:
        poste = "Technicien Confirmé"
        salaire_base = random.uniform(3000, 3500)
        taux_horaire = random.uniform(22, 25)
        niveau_acces = "technicien"
    else:
        poste = "Technicien"
        salaire_base = random.uniform(2500, 3000)
        taux_horaire = random.uniform(20, 22)
        niveau_acces = "technicien"
    
    # Pourcentage de taxe basé sur le salaire
    pourcentage_taxe = random.uniform(18, 25)
    
    # Régions possibles
    regions = ["AVRANCHES", "BRECEY", "PARIS", "LYON", "MARSEILLE", "TOULOUSE", "NANTES"]
    region = random.choice(regions)
    
    # Plaque de véhicule
    plaque_vehicule = f"{random.choice(['AB', 'CD', 'EF', 'GH', 'IJ', 'KL', 'MN', 'OP'])}{random.randint(100, 999)}{random.choice(['AB', 'CD', 'EF', 'GH'])}"
    
    # Numéro de carte carburant
    numero_carte_carburant = str(random.randint(10, 99))
    
    return {
        'matricule': matricule,
        'nom': nom,
        'prenom': prenom,
        'email': email,
        'telephone': telephone,
        'poste': poste,
        'departement': 'Technique',
        'region': region,
        'plaque_vehicule': plaque_vehicule,
        'numero_carte_carburant': numero_carte_carburant,
        'salaire_base': round(salaire_base, 2),
        'taux_horaire': round(taux_horaire, 2),
        'pourcentage_taxe': round(pourcentage_taxe, 2),
        'statut': 'actif',
        'niveau_acces': niveau_acces,
        'commentaires': f'Technicien avec {nb_interventions} interventions réalisées'
    }

def import_employees_from_interventions():
    """Importer les employés des interventions dans la table employés"""
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Récupérer les employés des interventions
        employees_data = get_employees_from_interventions()
        
        if not employees_data:
            print("[ATTENTION] Aucun employé trouvé dans les interventions")
            return False
        
        print(f"[INFO] Import de {len(employees_data)} employés...")
        
        imported_count = 0
        skipped_count = 0
        
        for nom, prenom, nb_interventions, premiere_intervention, derniere_intervention in employees_data:
            # Générer les données complètes de l'employé
            emp_data = generate_employee_data(nom, prenom, nb_interventions)
            
            # Vérifier si l'employé existe déjà
            cursor.execute("SELECT id FROM employes WHERE matricule = %s OR email = %s", 
                         (emp_data['matricule'], emp_data['email']))
            existing = cursor.fetchone()
            
            if existing:
                print(f"[ATTENTION] Employé {emp_data['matricule']} existe déjà, ignoré")
                skipped_count += 1
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
                emp_data['matricule'], emp_data['nom'], emp_data['prenom'], emp_data['email'], 
                emp_data['telephone'], emp_data['poste'], emp_data['departement'], 
                emp_data['region'], emp_data['plaque_vehicule'], emp_data['numero_carte_carburant'],
                emp_data['salaire_base'], emp_data['taux_horaire'], emp_data['pourcentage_taxe'],
                emp_data['statut'], emp_data['niveau_acces'], emp_data['commentaires'],
                datetime.now(), datetime.now()
            )
            
            cursor.execute(insert_query, values)
            emp_id = cursor.fetchone()[0]
            
            print(f"[SUCCES] {emp_data['prenom']} {emp_data['nom']} - {emp_data['poste']} - {emp_data['salaire_base']}€ - {emp_data['pourcentage_taxe']}% (ID: {emp_id})")
            imported_count += 1
        
        conn.commit()
        
        print(f"\n[RESUME] Import terminé:")
        print(f"  - {imported_count} employés importés")
        print(f"  - {skipped_count} employés ignorés (déjà existants)")
        
        # Vérifier le nombre total d'employés
        cursor.execute("SELECT COUNT(*) FROM employes")
        total_count = cursor.fetchone()[0]
        print(f"  - Total d'employés dans la base: {total_count}")
        
        return True
        
    except Exception as e:
        print(f"[ERREUR] Import des employés: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("Import des employés depuis les interventions")
    print("=" * 50)
    
    success = import_employees_from_interventions()
    
    if success:
        print("\n[TERMINE] Employés importés avec succès!")
    else:
        print("\n[ECHEC] Erreur lors de l'import des employés")
