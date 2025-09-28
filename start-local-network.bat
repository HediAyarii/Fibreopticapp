#!/bin/bash

# Script pour démarrer l'application sur le réseau local
echo "🌐 Démarrage de FinalFibre sur le réseau local..."

# Définir les variables d'environnement pour le réseau local
export NEXT_PUBLIC_APP_URL=http://10.5.0.2:3000
export NEXT_PUBLIC_SOCKET_URL=http://10.5.0.2:3000
export SOCKET_IO_CORS_ORIGIN=http://10.5.0.2:3000

echo "📍 Adresse IP locale: 10.5.0.2"
echo "🔗 URL d'accès: http://10.5.0.2:3000"
echo "📱 URL technicien: http://10.5.0.2:3000/logintech"
echo "📊 URL dashboard: http://10.5.0.2:3000/technicien/dashboard"
echo ""
echo "⚠️  Assurez-vous que:"
echo "   1. Votre téléphone est sur le même réseau WiFi"
echo "   2. Le pare-feu Windows autorise les connexions sur le port 3000"
echo "   3. PostgreSQL est configuré pour accepter les connexions locales"
echo ""

# Démarrer le serveur Next.js sur toutes les interfaces
npm run dev:mobile




