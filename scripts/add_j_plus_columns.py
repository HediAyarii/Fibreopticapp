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

print("🔄 Ajout des colonnes j_plus_1 et j_plus_n...")

# Ajouter les colonnes
cur.execute("""
    ALTER TABLE penalites 
    ADD COLUMN IF NOT EXISTS j_plus_1 BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS j_plus_n BOOLEAN DEFAULT FALSE;
""")

# Créer l'index
cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_penalites_j_plus ON penalites(j_plus_1, j_plus_n);
""")

conn.commit()
print("✅ Colonnes ajoutées avec succès!")

# Vérifier les colonnes
cur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'penalites' 
    ORDER BY ordinal_position
""")

cols = cur.fetchall()
print("\n📋 Colonnes de la table penalites:")
for col in cols:
    print(f"  - {col[0]}: {col[1]}")

cur.close()
conn.close()
