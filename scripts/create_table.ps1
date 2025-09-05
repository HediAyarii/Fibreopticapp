# Script PowerShell pour créer la table carburant_assignations
Write-Host "Creation de la table carburant_assignations..." -ForegroundColor Green

# Configuration de la base de données
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGDATABASE = "finalfibre_db"
$env:PGUSER = "finalfibre_user"
$env:PGPASSWORD = "finalfibre_password_2024"

# SQL pour créer la table
$sql = @"
CREATE TABLE IF NOT EXISTS carburant_assignations (
    id SERIAL PRIMARY KEY,
    numero_carte VARCHAR(50) NOT NULL,
    employe_id INTEGER NOT NULL,
    employe_nom VARCHAR(255) NOT NULL,
    date_assignation DATE NOT NULL,
    date_fin DATE NULL,
    statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_carburant_assignations_employe 
        FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_carburant_assignations_employe_id ON carburant_assignations(employe_id);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_numero_carte ON carburant_assignations(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_statut ON carburant_assignations(statut);

SELECT 'Table carburant_assignations creee avec succes!' as message;
"@

try {
    Write-Host "Connexion a la base de donnees PostgreSQL..." -ForegroundColor Yellow
    
    $result = $sql | psql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Table carburant_assignations creee avec succes!" -ForegroundColor Green
        Write-Host "Vous pouvez maintenant utiliser l'assignation de cartes carburant." -ForegroundColor Cyan
    } else {
        Write-Host "Erreur lors de la creation de la table." -ForegroundColor Red
        Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Script termine!" -ForegroundColor Green
