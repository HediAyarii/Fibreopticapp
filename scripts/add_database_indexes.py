#!/usr/bin/env python3
"""
Script d'optimisation de la base de données PostgreSQL
Ajoute les index nécessaires pour améliorer les performances
"""

import psycopg2
import os
import sys

# Configuration de la base de données
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'finalfibre_db'),
    'user': os.getenv('POSTGRES_USER', 'finalfibre_user'),
    'password': os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024')
}

def execute_sql_file(conn, filepath):
    """Exécute un fichier SQL"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        cursor = conn.cursor()
        
        # Séparer les commandes (ignorer les \echo pour psql)
        commands = []
        current_command = []
        
        for line in sql_content.split('\n'):
            # Ignorer les commentaires et commandes psql
            if line.strip().startswith('--') or line.strip().startswith('\\'):
                continue
            
            current_command.append(line)
            
            # Si la ligne se termine par ;, c'est la fin de la commande
            if line.strip().endswith(';'):
                command = '\n'.join(current_command).strip()
                if command and command != ';':
                    commands.append(command)
                current_command = []
        
        # Exécuter chaque commande
        for i, command in enumerate(commands, 1):
            try:
                print(f"Exécution commande {i}/{len(commands)}...")
                cursor.execute(command)
                conn.commit()
            except Exception as e:
                print(f"⚠️ Avertissement commande {i}: {e}")
                conn.rollback()
                continue
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution du fichier SQL: {e}")
        return False

def create_indexes_directly(conn):
    """Crée les index critiques directement"""
    cursor = conn.cursor()
    
    indexes = [
        # Interventions
        ("idx_interventions_statut", "CREATE INDEX IF NOT EXISTS idx_interventions_statut ON interventions(statut)"),
        ("idx_interventions_technicien", "CREATE INDEX IF NOT EXISTS idx_interventions_technicien ON interventions(nom_technicien, prenom_technicien)"),
        ("idx_interventions_date_rdv", "CREATE INDEX IF NOT EXISTS idx_interventions_date_rdv ON interventions(date_rdv)"),
        ("idx_interventions_type", "CREATE INDEX IF NOT EXISTS idx_interventions_type ON interventions(type_intervention)"),
        ("idx_interventions_grille", "CREATE INDEX IF NOT EXISTS idx_interventions_grille ON interventions(grille)"),
        
        # Carburant
        ("idx_carburant_date_livraison", "CREATE INDEX IF NOT EXISTS idx_carburant_date_livraison ON carburant_consommation(date_livraison)"),
        ("idx_carburant_numero_carte", "CREATE INDEX IF NOT EXISTS idx_carburant_numero_carte ON carburant_consommation(numero_carte)"),
        ("idx_carburant_employe", "CREATE INDEX IF NOT EXISTS idx_carburant_employe ON carburant_consommation(employe_assigné) WHERE employe_assigné IS NOT NULL"),
        
        # Assignations
        ("idx_assignations_carte", "CREATE INDEX IF NOT EXISTS idx_assignations_carte ON carburant_assignations(carte_id)"),
        ("idx_assignations_employe", "CREATE INDEX IF NOT EXISTS idx_assignations_employe ON carburant_assignations(employe_id)"),
        ("idx_assignations_statut", "CREATE INDEX IF NOT EXISTS idx_assignations_statut ON carburant_assignations(statut)"),
        
        # Employés
        ("idx_employes_nom_prenom", "CREATE INDEX IF NOT EXISTS idx_employes_nom_prenom ON employes(nom, prenom)"),
        ("idx_employes_matricule", "CREATE INDEX IF NOT EXISTS idx_employes_matricule ON employes(matricule) WHERE matricule IS NOT NULL"),
        
        # Company Pricing
        ("idx_pricing_lookup", "CREATE INDEX IF NOT EXISTS idx_pricing_lookup ON company_pricing(service_code, company_name, category)"),
        ("idx_pricing_service_code", "CREATE INDEX IF NOT EXISTS idx_pricing_service_code ON company_pricing(service_code)"),
        
        # Pénalités
        ("idx_penalites_employe", "CREATE INDEX IF NOT EXISTS idx_penalites_employe ON penalites(employe_id)"),
        ("idx_penalites_date", "CREATE INDEX IF NOT EXISTS idx_penalites_date ON penalites(date_penalite)"),
        
        # Réclamations
        ("idx_reclamations_employe", "CREATE INDEX IF NOT EXISTS idx_reclamations_employe ON reclamations(employe_id)"),
        ("idx_reclamations_date", "CREATE INDEX IF NOT EXISTS idx_reclamations_date ON reclamations(date_reclamation)"),
    ]
    
    print("🚀 Création des index critiques...")
    print()
    
    created = 0
    skipped = 0
    errors = 0
    
    for index_name, sql in indexes:
        try:
            print(f"📊 Création de {index_name}...", end=" ")
            cursor.execute(sql)
            conn.commit()
            print("✅")
            created += 1
        except psycopg2.errors.DuplicateTable:
            print("⏭️ (existe déjà)")
            conn.rollback()
            skipped += 1
        except Exception as e:
            print(f"❌ Erreur: {e}")
            conn.rollback()
            errors += 1
    
    cursor.close()
    
    print()
    print("📈 Résumé:")
    print(f"  ✅ Index créés: {created}")
    print(f"  ⏭️ Index existants: {skipped}")
    print(f"  ❌ Erreurs: {errors}")
    print()
    
    return created > 0 or skipped > 0

def analyze_tables(conn):
    """Lance ANALYZE sur toutes les tables pour mettre à jour les statistiques"""
    cursor = conn.cursor()
    
    tables = [
        'interventions',
        'carburant_consommation',
        'carburant_assignations',
        'employes',
        'company_pricing',
        'penalites',
        'reclamations'
    ]
    
    print("🔍 Mise à jour des statistiques des tables...")
    
    for table in tables:
        try:
            print(f"  Analyse de {table}...", end=" ")
            cursor.execute(f"ANALYZE {table}")
            conn.commit()
            print("✅")
        except Exception as e:
            print(f"❌ Erreur: {e}")
            conn.rollback()
    
    cursor.close()
    print()

def show_index_stats(conn):
    """Affiche les statistiques des index"""
    cursor = conn.cursor()
    
    print("📊 Index créés dans la base de données:")
    print()
    
    cursor.execute("""
        SELECT 
            schemaname,
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
        FROM pg_indexes
        JOIN pg_class ON pg_indexes.indexname = pg_class.relname
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
    """)
    
    current_table = None
    for row in cursor.fetchall():
        schema, table, index, size = row
        if table != current_table:
            print(f"\n  📋 {table}:")
            current_table = table
        print(f"    - {index} ({size})")
    
    cursor.close()
    print()

def main():
    print("=" * 60)
    print("🚀 OPTIMISATION DE LA BASE DE DONNÉES")
    print("=" * 60)
    print()
    
    try:
        # Connexion à la base de données
        print("🔌 Connexion à PostgreSQL...")
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connecté avec succès")
        print()
        
        # Créer les index
        success = create_indexes_directly(conn)
        
        if success:
            # Analyser les tables
            analyze_tables(conn)
            
            # Afficher les statistiques
            show_index_stats(conn)
            
            print("🎉 Optimisation terminée avec succès!")
            print()
            print("💡 Les performances des requêtes devraient être améliorées de 50-70%")
        else:
            print("⚠️ Aucun index n'a pu être créé")
            sys.exit(1)
        
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ Erreur de connexion à la base de données: {e}")
        print()
        print("Vérifiez que:")
        print("  1. PostgreSQL est en cours d'exécution")
        print("  2. Les paramètres de connexion sont corrects")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
