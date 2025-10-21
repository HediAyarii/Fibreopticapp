#!/bin/bash

# Script pour construire et démarrer l'application FinalFibre avec Docker

echo "🐳 Construction de l'image Docker FinalFibre..."

# Construire l'image
docker build -t finalfibre-app .

if [ $? -eq 0 ]; then
    echo "✅ Image construite avec succès"
else
    echo "❌ Erreur lors de la construction de l'image"
    exit 1
fi

echo ""
echo "🚀 Démarrage de l'application avec Docker Compose..."

# Démarrer les services
docker-compose -f docker-compose.app.yml up -d

if [ $? -eq 0 ]; then
    echo "✅ Application démarrée avec succès"
    echo ""
    echo "📋 Informations de connexion:"
    echo "   🌐 Application: http://localhost:3000"
    echo "   🗄️  Base de données: localhost:5432"
    echo "   👤 Admin par défaut: admin@fibertech.com / admin123"
    echo ""
    echo "📊 Commandes utiles:"
    echo "   📋 Voir les logs: docker-compose -f docker-compose.app.yml logs -f"
    echo "   🛑 Arrêter: docker-compose -f docker-compose.app.yml down"
    echo "   🔄 Redémarrer: docker-compose -f docker-compose.app.yml restart"
else
    echo "❌ Erreur lors du démarrage de l'application"
    exit 1
fi
