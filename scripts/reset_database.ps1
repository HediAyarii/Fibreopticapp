# Script PowerShell pour redemarrage complet de la base de donnees FinalFibre

Write-Host "Redemarrage complet de la base de donnees FinalFibre" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Arreter et supprimer les conteneurs et volumes
Write-Host "Arret des conteneurs..." -ForegroundColor Yellow
docker-compose down -v

# Attendre un peu pour s'assurer que tout est arrete
Write-Host "Attente de l'arret complet..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Redemarrer les conteneurs
Write-Host "Redemarrage des conteneurs..." -ForegroundColor Green
docker-compose up -d

# Attendre que PostgreSQL soit pret
Write-Host "Attente que PostgreSQL soit pret..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verifier que PostgreSQL est accessible
Write-Host "Verification de la connexion PostgreSQL..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 1

do {
    $result = docker exec finalfibre-postgres pg_isready -U finalfibre_user -d finalfibre_db 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL est pret!" -ForegroundColor Green
        break
    } else {
        Write-Host "Tentative $attempt/$maxAttempts - PostgreSQL pas encore pret..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $attempt++
    }
} while ($attempt -le $maxAttempts)

if ($attempt -gt $maxAttempts) {
    Write-Host "PostgreSQL n'est pas accessible apres $maxAttempts tentatives" -ForegroundColor Red
    exit 1
}

# Tester la configuration de la base de donnees
Write-Host "Test de la configuration de la base de donnees..." -ForegroundColor Cyan
python scripts/test_database_setup.py

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Redemarrage reussi!" -ForegroundColor Green
    Write-Host "Base de donnees: http://localhost:5432" -ForegroundColor Cyan
    Write-Host "PgAdmin: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "   Email: admin@finalfibre.com" -ForegroundColor White
    Write-Host "   Mot de passe: admin123" -ForegroundColor White
} else {
    Write-Host "Probleme detecte dans la configuration" -ForegroundColor Red
    exit 1
}