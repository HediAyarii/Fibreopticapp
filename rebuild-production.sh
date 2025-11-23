#!/bin/bash

# Script pour forcer un rebuild complet sur VPS
# Usage: ./rebuild-production.sh

echo "🔄 Démarrage du rebuild complet..."

# 1. Pull des derniers changements
echo "📥 Pull des changements..."
git pull origin staging

# 2. Nettoyer le cache Next.js
echo "🧹 Nettoyage du cache Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# 3. Rebuild de l'application
echo "🔨 Rebuild de l'application..."
npm run build

# 4. Redémarrer PM2
echo "🔄 Redémarrage de l'application..."
pm2 restart fibreoptic-app

# 5. Vérifier le statut
echo "✅ Vérification du statut..."
pm2 status

echo "✅ Rebuild terminé!"
echo "🌐 L'application devrait être accessible dans quelques secondes"
