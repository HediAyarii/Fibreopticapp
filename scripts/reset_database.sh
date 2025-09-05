#!/bin/bash

echo "🔄 Redémarrage complet de la base de données FinalFibre"
echo "=================================================="

# Arrêter et supprimer les conteneurs et volumes
echo "🛑 Arrêt des conteneurs..."
docker-compose down -v

# Attendre un peu pour s'assurer que tout est arrêté
echo "⏳ Attente de l'arrêt complet..."
sleep 5

# Redémarrer les conteneurs
echo "🚀 Redémarrage des conteneurs..."
docker-compose up -d

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente que PostgreSQL soit prêt..."
sleep 10

# Vérifier que PostgreSQL est accessible
echo "🔍 Vérification de la connexion PostgreSQL..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker exec finalfibre-postgres pg_isready -U finalfibre_user -d finalfibre_db > /dev/null 2>&1; then
        echo "✅ PostgreSQL est prêt!"
        break
    else
        echo "⏳ Tentative $attempt/$max_attempts - PostgreSQL pas encore prêt..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ PostgreSQL n'est pas accessible après $max_attempts tentatives"
    exit 1
fi

# Tester la configuration de la base de données
echo "🧪 Test de la configuration de la base de données..."
python scripts/test_database_setup.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Redémarrage réussi!"
    echo "📊 Base de données: http://localhost:5432"
    echo "🔧 PgAdmin: http://localhost:8080"
    echo "   Email: admin@finalfibre.com"
    echo "   Mot de passe: admin123"
else
    echo "❌ Problème détecté dans la configuration"
    exit 1
fi
