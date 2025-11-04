import psycopg2

conn = psycopg2.connect(
    host='localhost',
    port='5432',
    database='finalfibre_db',
    user='finalfibre_user',
    password='finalfibre_password_2024'
)

cursor = conn.cursor()

# Compter le total
cursor.execute("SELECT COUNT(*) FROM carburant_consommation;")
total = cursor.fetchone()[0]
print(f"\n✅ Total consommations en base: {total}\n")

# Afficher les 10 premières avec leurs dates
cursor.execute("""
    SELECT date_livraison, numero_carte, ca_ttc, numero_justificatif 
    FROM carburant_consommation 
    ORDER BY id DESC 
    LIMIT 10;
""")

print("📊 Les 10 dernières consommations importées:")
print("="*70)
for row in cursor.fetchall():
    print(f"Date: {row[0]:15} | Carte: {row[1]:10} | TTC: {row[2]:10} | Justif: {row[3]}")

conn.close()
