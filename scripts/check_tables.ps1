# Script PowerShell pour verifier et creer les tables necessaires

Write-Host "Verification et creation des tables pour le materiel et les affectations..." -ForegroundColor Cyan

# Variables de connexion a la base de donnees
$env:PGPASSWORD = "admin123"
$dbHost = "localhost"
$port = "5432"
$database = "finalfibre_db"
$username = "postgres"

# Chemin vers le fichier SQL
$sqlFile = "scripts/check_and_create_tables.sql"

try {
    Write-Host "Execution du script SQL..." -ForegroundColor Yellow
    
    # Executer le script SQL
    $result = psql -h $dbHost -p $port -U $username -d $database -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Tables verifiees et creees avec succes!" -ForegroundColor Green
        Write-Host "Resultat:" -ForegroundColor Blue
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "Erreur lors de l'execution du script SQL" -ForegroundColor Red
        Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur lors de l'execution: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Nettoyer la variable d'environnement
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "`nVerification des tables creees..." -ForegroundColor Cyan

try {
    # Verifier les tables existantes
    $tablesResult = psql -h $dbHost -p $port -U $username -d $database -c "\dt"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Tables disponibles:" -ForegroundColor Green
        Write-Host $tablesResult -ForegroundColor White
    } else {
        Write-Host "Impossible de lister les tables" -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur lors de la verification des tables: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nScript termine!" -ForegroundColor Green
