#!/bin/sh

# Script d'entrée pour Docker
echo "🚀 Démarrage de l'application FinalFibre..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "⏳ Base de données non disponible - attente..."
  sleep 2
done

echo "✅ Base de données disponible"

# Vérifier la connexion à la base de données
echo "🔍 Test de connexion à la base de données..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Connexion à la base de données réussie"
else
  echo "❌ Impossible de se connecter à la base de données"
  exit 1
fi

# Exécuter les migrations si nécessaire
echo "🔄 Vérification des migrations..."
if [ -f "scripts/migrate.js" ]; then
  echo "📋 Exécution des migrations..."
  node scripts/migrate.js
fi

# Démarrer l'application
echo "🎯 Démarrage de l'application sur le port $PORT"
exec "$@"
