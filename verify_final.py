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
    
    # Compter le total
    cursor.execute("SELECT COUNT(*) FROM carburant_consommation")
    total = cursor.fetchone()[0]
    print(f"✅ Total enregistrements dans la base: {total}")
    
    if total == 0:
        print("\n❌ La table est vide !")
    else:
        # Afficher les 10 derniers
        cursor.execute("""
            SELECT id, numero_justificatif, date_livraison, numero_carte, ca_ttc
            FROM carburant_consommation 
            ORDER BY id DESC 
            LIMIT 10
        """)
        
        print(f"\n📊 Les {min(total, 10)} derniers enregistrements:")
        for row in cursor.fetchall():
            id_val, justif, date, carte, ttc = row
            print(f"  ID: {id_val} | Justif: {justif} | Date: {date} | Carte: {carte} | TTC: {ttc}")
        
        # Vérifier les numéros justificatifs uniques
        cursor.execute("""
            SELECT COUNT(DISTINCT numero_justificatif) 
            FROM carburant_consommation
        """)
        unique_justif = cursor.fetchone()[0]
        print(f"\n📋 Numéros de justificatif uniques: {unique_justif}")
        
        # Afficher quelques justificatifs
        cursor.execute("""
            SELECT DISTINCT numero_justificatif 
            FROM carburant_consommation 
            ORDER BY numero_justificatif 
            LIMIT 15
        """)
        print("\n🔢 Exemples de numéros de justificatif:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()
