import psycopg2
import os
from datetime import datetime

# Connexion à la base de données
conn = psycopg2.connect(
    dbname='finalfibre_db',
    user=os.getenv('POSTGRES_USER', 'finalfibre_user'),
    password=os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024'),
    host='localhost'
)
cur = conn.cursor()

print("🔍 Vérification des pénalités dans la base de données\n")

# Compter toutes les pénalités
cur.execute("SELECT COUNT(*) FROM penalites")
total = cur.fetchone()[0]
print(f"📊 Total pénalités: {total}\n")

# Afficher toutes les pénalités avec leurs détails
cur.execute("""
    SELECT 
        id,
        numero_penalite,
        employe_id,
        type_penalite,
        montant,
        j_plus_1,
        j_plus_n,
        created_at,
        date_attribution
    FROM penalites
    ORDER BY created_at DESC
""")

penalites = cur.fetchall()

if penalites:
    print("📋 Liste des pénalités:\n")
    for p in penalites:
        print(f"ID: {p[0]}")
        print(f"  Numéro: {p[1]}")
        print(f"  Employé ID: {p[2]}")
        print(f"  Type: {p[3]}")
        print(f"  Montant: {p[4]}€")
        print(f"  J+1: {p[5]}")
        print(f"  J+N: {p[6]}")
        print(f"  CreatedAt: {p[7]}")
        print(f"  Date Attribution: {p[8]}")
        print()
else:
    print("❌ Aucune pénalité trouvée")

# Tester la requête des statistiques
print("\n" + "="*60)
print("🧪 Test de la requête des statistiques")
print("="*60 + "\n")

start_date = '2025-05-01'
end_date = '2025-11-04'

print(f"Période: {start_date} à {end_date}\n")

cur.execute("""
    SELECT 
        CASE 
            WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
            WHEN j_plus_n = TRUE THEN 'J+N (140€)'
            ELSE type_penalite
        END as statut,
        COUNT(*) as count,
        SUM(montant) as total_amount,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM penalites 
    WHERE created_at >= %s AND created_at <= %s
    GROUP BY 
        CASE 
            WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
            WHEN j_plus_n = TRUE THEN 'J+N (140€)'
            ELSE type_penalite
        END
    ORDER BY count DESC
""", (start_date, end_date))

stats = cur.fetchall()

if stats:
    print("📊 Résultats des statistiques:\n")
    for s in stats:
        print(f"  {s[0]}: {s[1]} pénalités ({s[3]}%) - Total: {s[2]}€")
else:
    print("❌ Aucune statistique pour cette période")
    print("\n🔍 Vérification: Y a-t-il des pénalités dans cette période?")
    cur.execute("""
        SELECT COUNT(*), MIN(created_at), MAX(created_at)
        FROM penalites
    """)
    result = cur.fetchone()
    print(f"  Total: {result[0]}")
    print(f"  Plus ancienne: {result[1]}")
    print(f"  Plus récente: {result[2]}")

cur.close()
conn.close()
