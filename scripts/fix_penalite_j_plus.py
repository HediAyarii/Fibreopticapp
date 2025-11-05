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

print("🔄 Mise à jour de la pénalité ID=1...")

# Mettre à jour la pénalité ID=1
cur.execute("UPDATE penalites SET j_plus_1 = TRUE WHERE id = 1 AND montant = 60")
conn.commit()

print("✅ Pénalité ID=1 mise à jour: j_plus_1 = TRUE\n")

# Vérifier les pénalités
cur.execute("""
    SELECT 
        id, 
        numero_penalite, 
        montant, 
        j_plus_1, 
        j_plus_n,
        CASE 
            WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
            WHEN j_plus_n = TRUE THEN 'J+N (140€)'
            ELSE type_penalite
        END as display_type
    FROM penalites 
    ORDER BY id
""")

rows = cur.fetchall()

print("📋 Pénalités après mise à jour:\n")
for r in rows:
    print(f"  ID {r[0]}: {r[1]}")
    print(f"    Montant: {r[2]}€")
    print(f"    J+1: {r[3]}")
    print(f"    J+N: {r[4]}")
    print(f"    Type affiché: {r[5]}")
    print()

# Tester la requête des statistiques avec la nouvelle formule
print("="*60)
print("🧪 Test de la requête des statistiques (avec fix)")
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
    WHERE created_at >= %s::date AND created_at < (%s::date + INTERVAL '1 day')
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
    print("✅ Résultats des statistiques:\n")
    for s in stats:
        print(f"  {s[0]}: {s[1]} pénalité(s) ({s[3]}%) - Total: {s[2]}€")
else:
    print("❌ Aucune statistique pour cette période")

cur.close()
conn.close()
