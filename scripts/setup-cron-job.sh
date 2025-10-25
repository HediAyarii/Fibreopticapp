#!/bin/bash

# Script pour configurer le cron job de libération automatique des assignations expirées
# Ce script doit être exécuté sur le serveur de production

echo "🔧 Configuration du cron job pour la libération automatique des assignations expirées"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js d'abord."
    exit 1
fi

# Vérifier que le script existe
SCRIPT_PATH="$(pwd)/scripts/auto-expire-assignations.js"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Le script auto-expire-assignations.js n'existe pas dans le répertoire scripts/"
    exit 1
fi

# Rendre le script exécutable
chmod +x "$SCRIPT_PATH"

# Créer le fichier de log pour le cron job
LOG_DIR="/var/log/carburant-auto-expire"
sudo mkdir -p "$LOG_DIR"
sudo chown $(whoami):$(whoami) "$LOG_DIR"

# Créer le fichier de configuration du cron job
CRON_FILE="/tmp/carburant-auto-expire-cron"
cat > "$CRON_FILE" << EOF
# Libération automatique des assignations de cartes carburant expirées
# Exécution quotidienne à 2h00 du matin
0 2 * * * cd $(pwd) && node scripts/auto-expire-assignations.js >> $LOG_DIR/auto-expire.log 2>&1

# Vérification hebdomadaire des assignations expirantes (lundi à 9h00)
0 9 * * 1 cd $(pwd) && node scripts/auto-expire-assignations.js >> $LOG_DIR/auto-expire-weekly.log 2>&1
EOF

echo "📋 Configuration du cron job:"
echo "   - Exécution quotidienne à 2h00 du matin"
echo "   - Vérification hebdomadaire le lundi à 9h00"
echo "   - Logs dans: $LOG_DIR/"

# Proposer d'installer le cron job
echo ""
echo "🤔 Voulez-vous installer ce cron job maintenant? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    # Installer le cron job
    (crontab -l 2>/dev/null; cat "$CRON_FILE") | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✅ Cron job installé avec succès!"
        echo ""
        echo "📊 Vérification du cron job installé:"
        crontab -l | grep -E "(carburant-auto-expire|auto-expire-assignations)"
        echo ""
        echo "📝 Pour vérifier les logs:"
        echo "   tail -f $LOG_DIR/auto-expire.log"
        echo "   tail -f $LOG_DIR/auto-expire-weekly.log"
    else
        echo "❌ Erreur lors de l'installation du cron job"
        exit 1
    fi
else
    echo "ℹ️  Cron job non installé. Vous pouvez l'installer manuellement avec:"
    echo "   crontab -e"
    echo "   # Puis ajouter les lignes suivantes:"
    cat "$CRON_FILE"
fi

# Nettoyer le fichier temporaire
rm -f "$CRON_FILE"

echo ""
echo "🎯 Configuration terminée!"
echo ""
echo "📚 Documentation:"
echo "   - Script: $SCRIPT_PATH"
echo "   - Logs: $LOG_DIR/"
echo "   - Pour tester: node $SCRIPT_PATH"
echo "   - Pour désinstaller: crontab -e (puis supprimer les lignes)"






