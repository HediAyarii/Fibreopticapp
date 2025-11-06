# ====================================================================
# SCRIPT DE MIGRATION - AJOUT DE LA GESTION DES DÉPÔTS
# ====================================================================
# Ce script applique les modifications nécessaires pour ajouter :
# - Colonne 'depot' à la table materiel (AXECOM/ERT)
# - Table historique_transferts_materiel pour tracer les transferts
# ====================================================================

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "MIGRATION: Gestion des Dépôts" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Exécuter le script SQL dans le container Docker
Write-Host "📦 Application du script SQL..." -ForegroundColor Yellow
docker exec -i finalfibre-app-db-1 psql -U postgres -d finalfibre_db -f /app/scripts/add_depot_to_materiel.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration réussie !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vérification de la structure..." -ForegroundColor Yellow
    
    # Vérifier la nouvelle colonne depot
    docker exec -i finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "\d materiel" | Select-String "depot"
    
    Write-Host ""
    Write-Host "📊 Tables créées/modifiées:" -ForegroundColor Cyan
    Write-Host "  ✓ materiel.depot (VARCHAR 20)" -ForegroundColor Green
    Write-Host "  ✓ historique_transferts_materiel (nouvelle table)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Fonctionnalités ajoutées:" -ForegroundColor Cyan
    Write-Host "  • Sélection du dépôt (AXECOM/ERT) lors de la création" -ForegroundColor White
    Write-Host "  • Transfert de matériel entre dépôts avec historique" -ForegroundColor White
    Write-Host "  • Filtrage par dépôt dans l'interface" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la migration" -ForegroundColor Red
    Write-Host "Vérifiez que le container Docker est démarré" -ForegroundColor Yellow
    exit 1
}
