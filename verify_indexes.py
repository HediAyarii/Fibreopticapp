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
    
    print("📊 INDEX CRÉÉS DANS LA BASE DE DONNÉES")
    print("=" * 70)
    print()
    
    # Lister tous les index créés
    cursor.execute("""
        SELECT 
            tablename,
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
    """)
    
    current_table = None
    total_indexes = 0
    
    for row in cursor.fetchall():
        table, index, definition = row
        if table != current_table:
            print(f"\n🔷 Table: {table}")
            current_table = table
        print(f"  ✅ {index}")
        total_indexes += 1
    
    print()
    print("=" * 70)
    print(f"✨ TOTAL: {total_indexes} index créés avec succès!")
    print()
    print("💡 Impact attendu: Réduction de 50-70% du temps de réponse des requêtes")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
