import psycopg2

try:
    conn = psycopg2.connect(
        host='localhost',
        port='5432',
        database='finalfibre_db',
        user='finalfibre_user',
        password='finalfibre_password_2024'
    )
    cursor = conn.cursor()
    
    # Récupérer la structure de la table
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'carburant_consommation' 
        ORDER BY ordinal_position
    """)
    
    print("📋 Structure de la table carburant_consommation:\n")
    print(f"{'Colonne':<30} {'Type':<20} {'Nullable'}")
    print("-" * 70)
    
    for row in cursor.fetchall():
        col_name, data_type, nullable = row
        print(f"{col_name:<30} {data_type:<20} {nullable}")
    
    conn.close()
    
    print("\n" + "="*70)
    print("\n📄 Colonnes du fichier Excel:\n")
    
    excel_columns = [
        "Date de livraison",
        "Heure de livraison", 
        "Pays",
        "N° de station",
        "Point d'acceptation",
        "Identifiant autoroute",
        "CP",
        "Immat. véhicule",
        "N° de carte",
        "km",
        "Poste 1",
        "Poste 2",
        "Type marchandises",
        "N° de justificatif",
        "Quantité",
        " ",  # Colonne vide
        "Valeur TTC du produit",
        "Facturée"
    ]
    
    for i, col in enumerate(excel_columns, 1):
        print(f"{i:2d}. {col}")
    
    print("\n" + "="*70)
    print("\n🔗 MAPPING Excel → Base de données:\n")
    
    mapping = {
        "Date de livraison": "date_livraison",
        "Heure de livraison": "heure_livraison",
        "Pays": "pays",
        "N° de station": "numero_station",
        "Point d'acceptation": "point_acceptation",
        "Identifiant autoroute": "identifiant_autoroute",
        "CP": "cp",
        "Immat. véhicule": "immat_vehicule",
        "N° de carte": "numero_carte",
        "km": "km",
        "Poste 1": "poste_1",
        "Poste 2": "poste_2",
        "Type marchandises": "type_marchandises",
        "N° de justificatif": "numero_justificatif",
        "Quantité": "quantite",
        "Valeur TTC du produit": "ca_ttc",
        "Facturée": "NON MAPPÉ (ignoré)"
    }
    
    for excel_col, db_col in mapping.items():
        status = "✅" if "NON MAPPÉ" not in db_col else "⚠️"
        print(f"{status} {excel_col:<30} → {db_col}")
    
    print("\n⚠️ Colonnes de la BD NON remplies par l'Excel:")
    print("   - date_fact (non présent dans le nouveau format)")
    print("   - taux_tva (mis à '0' par défaut)")
    print("   - ca_ht (mis à '0' par défaut)")
    print("   - tva (mis à '0' par défaut)")
    print("   - employe_assigné (géré séparément)")
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()
