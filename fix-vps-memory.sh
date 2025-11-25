#!/bin/bash

# Script pour résoudre les problèmes de mémoire sur le VPS
echo "🔧 Correction des problèmes de mémoire sur le VPS..."

# 1. Augmenter la limite de mémoire Node.js pour PM2
echo "📝 1. Configuration de la limite de mémoire Node.js..."
pm2 delete server 2>/dev/null || true

# Démarrer avec plus de mémoire (2GB au lieu de 512MB par défaut)
NODE_OPTIONS="--max-old-space-size=2048" pm2 start server.js --name server

# 2. Optimiser les paramètres PM2
echo "📝 2. Configuration PM2 pour économiser la mémoire..."
pm2 set pm2:autodump true
pm2 set pm2:watch false

# 3. Nettoyer le cache Next.js
echo "🧹 3. Nettoyage du cache Next.js..."
cd ~/Fibreopticapp
rm -rf .next/cache

# 4. Activer la compression et le cache
echo "📦 4. Configuration de la compression..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'server',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '1500M',
    node_args: '--max-old-space-size=2048',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=2048'
    },
    error_file: '~/.pm2/logs/server-error.log',
    out_file: '~/.pm2/logs/server-out.log',
    log_file: '~/.pm2/logs/server-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

# 5. Redémarrer avec la nouvelle configuration
echo "🔄 5. Redémarrage avec la nouvelle configuration..."
pm2 delete server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 6. Vérifier le statut
echo "✅ 6. Vérification du statut..."
pm2 status
pm2 logs server --lines 20

echo ""
echo "✅ Configuration terminée!"
echo "📊 Monitorer la mémoire avec: pm2 monit"
echo "📋 Voir les logs avec: pm2 logs server"
