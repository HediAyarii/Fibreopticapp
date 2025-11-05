#!/usr/bin/env python3
"""
Script pour appliquer les optimisations de performance à la base de données
FinalFibre Application
"""

import psycopg2
import sys
from datetime import datetime

# Configuration de connexion
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'finalfibre_db',
    'user': 'finalfibre_user',
    'password': 'finalfibre_password_2024'
}

def execute_sql(cursor, sql, description):
    """Exécute une requête SQL avec gestion d'erreur"""
    try:
        cursor.execute(sql)
        print(f"✅ {description}")
        return True
    except Exception as e:
        print(f"⚠️  {description} - Erreur: {str(e)}")
        return False

def main():
    print("🚀 Début de l'optimisation de la base de données FinalFibre")
    print(f"⏰ Heure de début: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 60)
    
    try:
        # Connexion à la base de données
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("\n📊 Connexion établie avec succès!")
        
        # ========================================
        # 1. CRÉATION D'INDEX OPTIMISÉS
        # ========================================
        print("\n" + "=" * 60)
        print("📌 PHASE 1: Création des index optimisés")
        print("=" * 60)
        
        indexes = [
            # Index sur employes
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employes_statut_actif ON employes(statut) WHERE statut = 'actif';",
             "Index employes.statut (actif uniquement)"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employes_matricule ON employes(matricule);",
             "Index employes.matricule"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employes_nom_prenom ON employes(nom, prenom);",
             "Index employes.nom + prenom"),
            
            # Index sur interventions
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_num_inter ON interventions(num_inter);",
             "Index interventions.num_inter"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_date_rdv_desc ON interventions(date_rdv DESC NULLS LAST);",
             "Index interventions.date_rdv (tri optimisé)"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_statut ON interventions(statut);",
             "Index interventions.statut"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_technicien ON interventions(nom_technicien, prenom_technicien);",
             "Index interventions.technicien (nom + prenom)"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interventions_date_statut ON interventions(date_rdv, statut);",
             "Index interventions.date_rdv + statut"),
            
            # Index sur penalites
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_penalites_employe_id ON penalites(employe_id);",
             "Index penalites.employe_id"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_penalites_date_attribution ON penalites(date_attribution);",
             "Index penalites.date_attribution"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_penalites_employe_date ON penalites(employe_id, date_attribution);",
             "Index penalites.employe_id + date_attribution"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_penalites_j_plus ON penalites(j_plus_1, j_plus_n);",
             "Index penalites.j_plus_1 + j_plus_n"),
            
            # Index sur reclamations
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reclamations_statut ON reclamations(statut);",
             "Index reclamations.statut"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reclamations_priorite ON reclamations(priorite);",
             "Index reclamations.priorite"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reclamations_created_desc ON reclamations(created_at DESC);",
             "Index reclamations.created_at (tri optimisé)"),
            
            # Index sur carburant_assignations
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carburant_assignations_employe ON carburant_assignations(employe_id);",
             "Index carburant_assignations.employe_id"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carburant_assignations_carte ON carburant_assignations(carte_id);",
             "Index carburant_assignations.carte_id"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carburant_assignations_active ON carburant_assignations(employe_id, statut, date_assignation DESC) WHERE statut = 'active';",
             "Index carburant_assignations (actives uniquement)"),
            
            # Index sur consommation_carburant
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consommation_carburant_employe ON consommation_carburant(employe_id);",
             "Index consommation_carburant.employe_id"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consommation_carburant_carte ON consommation_carburant(numero_carte);",
             "Index consommation_carburant.numero_carte"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consommation_carburant_date ON consommation_carburant(date_transaction);",
             "Index consommation_carburant.date_transaction"),
            
            # Index sur materiel_affectations
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materiel_affectations_employe ON materiel_affectations(employe_id);",
             "Index materiel_affectations.employe_id"),
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materiel_affectations_date ON materiel_affectations(date_affectation);",
             "Index materiel_affectations.date_affectation"),
            
            # Index sur cout_par_salaire
            ("CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cout_par_salaire_id ON cout_par_salaire(id);",
             "Index cout_par_salaire.id"),
        ]
        
        success_count = 0
        for sql, description in indexes:
            if execute_sql(cursor, sql, description):
                success_count += 1
        
        print(f"\n✅ {success_count}/{len(indexes)} index créés avec succès")
        
        # ========================================
        # 2. ANALYSE ET VACUUM DES TABLES
        # ========================================
        print("\n" + "=" * 60)
        print("🧹 PHASE 2: Nettoyage et analyse des tables")
        print("=" * 60)
        
        tables = [
            'employes',
            'interventions',
            'penalites',
            'reclamations',
            'carburant_assignations',
            'consommation_carburant',
            'materiel_affectations',
            'cout_par_salaire',
            'carburant',
            'materiel'
        ]
        
        for table in tables:
            execute_sql(cursor, f"VACUUM ANALYZE {table};", f"VACUUM ANALYZE {table}")
        
        # ========================================
        # 3. OPTIMISATION DES STATISTIQUES
        # ========================================
        print("\n" + "=" * 60)
        print("📈 PHASE 3: Optimisation des statistiques")
        print("=" * 60)
        
        stats_optimizations = [
            ("ALTER TABLE employes ALTER COLUMN statut SET STATISTICS 1000;", "Statistiques employes.statut"),
            ("ALTER TABLE employes ALTER COLUMN matricule SET STATISTICS 1000;", "Statistiques employes.matricule"),
            ("ALTER TABLE interventions ALTER COLUMN num_inter SET STATISTICS 1000;", "Statistiques interventions.num_inter"),
            ("ALTER TABLE interventions ALTER COLUMN date_rdv SET STATISTICS 1000;", "Statistiques interventions.date_rdv"),
            ("ALTER TABLE penalites ALTER COLUMN employe_id SET STATISTICS 1000;", "Statistiques penalites.employe_id"),
        ]
        
        for sql, description in stats_optimizations:
            execute_sql(cursor, sql, description)
        
        # ========================================
        # 4. STATISTIQUES FINALES
        # ========================================
        print("\n" + "=" * 60)
        print("📊 STATISTIQUES FINALES")
        print("=" * 60)
        
        # Compter les index
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE schemaname = 'public'
        """)
        total_indexes = cursor.fetchone()[0]
        print(f"📌 Nombre total d'index: {total_indexes}")
        
        # Taille de la base de données
        cursor.execute("""
            SELECT pg_size_pretty(pg_database_size(current_database()))
        """)
        db_size = cursor.fetchone()[0]
        print(f"💾 Taille de la base de données: {db_size}")
        
        # Connexions actives
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pg_stat_activity 
            WHERE datname = current_database()
        """)
        active_connections = cursor.fetchone()[0]
        print(f"🔌 Connexions actives: {active_connections}")
        
        print("\n" + "=" * 60)
        print("✅ OPTIMISATION TERMINÉE AVEC SUCCÈS!")
        print("=" * 60)
        print(f"⏰ Heure de fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("\n💡 Recommandations:")
        print("  1. Redémarrez votre application pour appliquer les changements")
        print("  2. Surveillez les performances dans les prochains jours")
        print("  3. Exécutez ce script régulièrement (ex: une fois par mois)")
        
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"\n❌ Erreur de connexion à la base de données: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur inattendue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
