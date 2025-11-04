import psycopg2

conn = psycopg2.connect(
    host='localhost',
    port='5432',
    database='finalfibre_db',
    user='finalfibre_user',
    password='finalfibre_password_2024'
)

cursor = conn.cursor()
cursor.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'carburant_consommation' 
    ORDER BY ordinal_position;
""")

print("\n=== Structure de la table carburant_consommation ===\n")
for row in cursor.fetchall():
    print(f"{row[0]:30} {row[1]}")

conn.close()
