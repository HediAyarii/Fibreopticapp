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
    print(f"✅ Total enregistrements: {total}")
    
    if total == 0:
        print("\n❌ La table est VIDE !")
    elif total == 1:
        print("\n⚠️ UN SEUL enregistrement trouvé (problème !)")
    else:
        print(f"\n🎉 {total} enregistrements importés avec succès !")
    
    # Afficher les 10 premiers
    cursor.execute("""
        SELECT id, numero_justificatif, date_livraison, numero_carte, ca_ttc, immat_vehicule
        FROM carburant_consommation 
        ORDER BY id 
        LIMIT 10
    """)
    
    print(f"\n📊 Les 10 premiers enregistrements:")
    for row in cursor.fetchall():
        id_val, justif, date, carte, ttc, immat = row
        print(f"  ID: {id_val} | Justif: {justif} | Date: {date} | Carte: {carte} | Immat: {immat} | TTC: {ttc}")
    
    # Vérifier les numéros justificatifs uniques
    cursor.execute("""
        SELECT COUNT(DISTINCT numero_justificatif) 
        FROM carburant_consommation
    """)
    unique_justif = cursor.fetchone()[0]
    print(f"\n📋 Numéros de justificatif uniques: {unique_justif}")
    
    if unique_justif < total:
        print(f"⚠️ Attention: {total - unique_justif} doublons détectés")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()
