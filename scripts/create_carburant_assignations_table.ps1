# Script PowerShell pour créer la table carburant_assignations
# Ce script exécute le SQL directement via psql

Write-Host "🚀 Création de la table carburant_assignations..." -ForegroundColor Green

# Configuration de la base de données
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGDATABASE = "finalfibre_db"
$env:PGUSER = "finalfibre_user"
$env:PGPASSWORD = "finalfibre_password_2024"

# SQL pour créer la table
$sql = @"
-- Script pour créer la table carburant_assignations
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
    
    -- Contraintes
    CONSTRAINT fk_carburant_assignations_employe 
        FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_employe_id ON carburant_assignations(employe_id);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_numero_carte ON carburant_assignations(numero_carte);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_statut ON carburant_assignations(statut);
CREATE INDEX IF NOT EXISTS idx_carburant_assignations_date_assignation ON carburant_assignations(date_assignation);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_carburant_assignations_updated_at()
RETURNS TRIGGER AS `$`
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
`$` language 'plpgsql';

CREATE TRIGGER trigger_update_carburant_assignations_updated_at
    BEFORE UPDATE ON carburant_assignations
    FOR EACH ROW
    EXECUTE FUNCTION update_carburant_assignations_updated_at();

-- Vérifier que la table existe
SELECT 'Table carburant_assignations créée avec succès!' as message;
"@

try {
    Write-Host "🔌 Connexion à la base de données PostgreSQL..." -ForegroundColor Yellow
    
    # Exécuter le SQL
    $result = $sql | psql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Table carburant_assignations créée avec succès!" -ForegroundColor Green
        Write-Host "💡 Vous pouvez maintenant utiliser l'assignation de cartes carburant." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Erreur lors de la création de la table." -ForegroundColor Red
        Write-Host "Code de sortie: $LASTEXITCODE" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Script terminé!" -ForegroundColor Green
