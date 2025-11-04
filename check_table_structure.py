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
    
    # Vérifier structure table
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'carburant_consommation' 
        ORDER BY ordinal_position
    """)
    
    print("📋 Colonnes de carburant_consommation:")
    for row in cursor.fetchall():
        print(f"  - {row[0]}: {row[1]}")
    
    # Compter les enregistrements
    cursor.execute("SELECT COUNT(*) FROM carburant_consommation")
    total = cursor.fetchone()[0]
    print(f"\n✅ Total enregistrements: {total}")
    
    # Afficher quelques enregistrements
    cursor.execute("""
        SELECT id, date_livraison, numero_carte, numero_justificatif, valeur_ttc
        FROM carburant_consommation 
        ORDER BY id DESC 
        LIMIT 10
    """)
    
    print(f"\n📊 Les {min(total, 10)} derniers enregistrements:")
    for row in cursor.fetchall():
        print(f"  ID: {row[0]} | Date: {row[1]} | Carte: {row[2]} | Justif: {row[3]} | TTC: {row[4]}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
