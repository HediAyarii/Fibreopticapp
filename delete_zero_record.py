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
    
    # Supprimer l'enregistrement avec numero_justificatif = '0'
    cursor.execute("DELETE FROM carburant_consommation WHERE numero_justificatif = %s", ('0',))
    conn.commit()
    print(f"✅ {cursor.rowcount} enregistrement(s) supprimé(s)")
    
    # Vérifier
    cursor.execute("SELECT COUNT(*) FROM carburant_consommation")
    print(f"📊 Total restant: {cursor.fetchone()[0]}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
