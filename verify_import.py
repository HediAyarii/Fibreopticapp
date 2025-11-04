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
    print(f"✅ Total consommations: {total}")
    
    # Afficher les 10 derniers
    cursor.execute("""
        SELECT date_livraison, numero_carte, montant_ttc, numero_justificatif, immatriculation
        FROM carburant_consommation 
        ORDER BY id DESC 
        LIMIT 10
    """)
    
    print("\n📊 Les 10 dernières consommations:")
    for row in cursor.fetchall():
        date, carte, ttc, justif, immat = row
        print(f"  Date: {date} | Carte: {carte} | TTC: {ttc} | Justif: {justif} | Immat: {immat}")
    
    # Vérifier les dates
    cursor.execute("""
        SELECT DISTINCT date_livraison 
        FROM carburant_consommation 
        ORDER BY date_livraison DESC 
        LIMIT 5
    """)
    print("\n📅 Dates distinctes:")
    for row in cursor.fetchall():
        print(f"  {row[0]}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
