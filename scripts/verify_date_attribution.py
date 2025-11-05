import psycopg2
import os

# Connexion à la base de données
conn = psycopg2.connect(
    dbname='finalfibre_db',
    user=os.getenv('POSTGRES_USER', 'finalfibre_user'),
    password=os.getenv('POSTGRES_PASSWORD', 'finalfibre_password_2024'),
    host='localhost'
)
cur = conn.cursor()

print("🔍 Vérification des dates des pénalités\n")

# Afficher les pénalités avec leurs dates
cur.execute("""
    SELECT 
        id,
        numero_penalite,
        montant,
        j_plus_1,
        j_plus_n,
        DATE(created_at) as date_creation,
        DATE(date_attribution) as date_attribution,
        CASE 
            WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
            WHEN j_plus_n = TRUE THEN 'J+N (140€)'
            ELSE type_penalite
        END as type_affiche
    FROM penalites
    ORDER BY id
""")

penalites = cur.fetchall()

print("📋 Pénalités avec dates:\n")
for p in penalites:
    print(f"ID {p[0]}: {p[1]}")
    print(f"  Montant: {p[2]}€")
    print(f"  Type: {p[7]}")
    print(f"  Date création: {p[5]}")
    print(f"  Date attribution: {p[6]} ✅ (utilisée pour les stats)")
    print()

# Test avec date_attribution
print("="*60)
print("🧪 Test requête avec date_attribution")
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
    WHERE date_attribution >= %s::date AND date_attribution < (%s::date + INTERVAL '1 day')
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
    print("✅ Résultats avec date_attribution:\n")
    for s in stats:
        print(f"  {s[0]}: {s[1]} pénalité(s) ({s[3]}%) - Total: {s[2]}€")
else:
    print("❌ Aucune pénalité trouvée dans cette période")

cur.close()
conn.close()
