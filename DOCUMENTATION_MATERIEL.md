# 📦 DOCUMENTATION COMPLÈTE - GESTION DU MATÉRIEL

## 🎯 Vue d'Ensemble

Le système de gestion du matériel de FinalFibre permet de :
- **Gérer l'inventaire** : Suivi de tout le matériel (équipements, véhicules, outils)
- **Affecter le matériel** : Attribution du matériel aux employés
- **Calculer les valeurs** : Valeur totale du matériel par employé
- **Suivre les stocks** : Gestion automatique des quantités disponibles

---

## 🗄️ ARCHITECTURE BASE DE DONNÉES

### 📊 Table `materiel`

#### Structure Complète
```sql
CREATE TABLE materiel (
    -- Identification
    id                     SERIAL PRIMARY KEY,
    numero_serie           TEXT UNIQUE,
    nom_equipement         TEXT NOT NULL,
    type_materiel          TEXT NOT NULL,
    
    -- Caractéristiques
    marque                 TEXT,
    modele                 TEXT,
    statut                 TEXT DEFAULT 'disponible',
    localisation           TEXT,
    
    -- 🏢 GESTION DES DÉPÔTS
    depot                  VARCHAR(20) DEFAULT 'AXECOM' CHECK (depot IN ('AXECOM', 'ERT')),
    
    -- Gestion des stocks
    quantite               INTEGER DEFAULT 1,
    prix_unitaire          NUMERIC(10,2),
    
    -- Acquisition
    date_acquisition       DATE,
    cout_acquisition       NUMERIC(10,2),
    garantie_jusqu_a       DATE,
    
    -- Maintenance
    maintenance_derniere   DATE,
    maintenance_prochaine  DATE,
    etat_general           TEXT,
    notes_maintenance      TEXT,
    
    -- Spécifique véhicules
    kilometrage_vehicule   INTEGER DEFAULT 0,
    consommation_carburant NUMERIC(5,2),
    capacite_reservoir     NUMERIC(5,2),
    niveau_carburant       NUMERIC(5,2),
    
    -- Documents et médias
    accessoires_inclus     TEXT[],
    certificats_conformite TEXT[],
    photos                 TEXT[],
    
    -- Horodatage
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Index Optimisés
```sql
-- Index primaire
CREATE INDEX idx_materiel_numero_serie ON materiel(numero_serie);

-- Index de recherche
CREATE INDEX idx_materiel_type ON materiel(type_materiel);
CREATE INDEX idx_materiel_statut ON materiel(statut);
CREATE INDEX idx_materiel_quantite ON materiel(quantite);

-- 🏢 Index pour les dépôts
CREATE INDEX idx_materiel_depot ON materiel(depot);
```

#### Statuts Possibles
- `disponible` : En stock, prêt à être affecté
- `affecte` : Assigné à un employé (géré automatiquement)
- `en_maintenance` : En réparation ou entretien
- `hors_service` : Inutilisable, à réformer

#### Types de Matériel Courants
- `Véhicule` : Voitures, utilitaires
- `Outillage` : Outils manuels, électriques
- `Équipement de mesure` : Testeurs, multimètres
- `EPI` : Équipements de protection individuelle
- `Informatique` : Ordinateurs, tablettes, téléphones
- `Consommable` : Câbles, connecteurs, fournitures

#### Dépôts de Stockage
- `AXECOM` : Dépôt principal AXECOM
- `ERT` : Dépôt ERT

**Note** : Le dépôt est **obligatoire** lors de la création d'un matériel. La valeur par défaut est AXECOM.

---

### 📊 Table `historique_transferts_materiel`

#### Structure Complète
```sql
CREATE TABLE historique_transferts_materiel (
    id SERIAL PRIMARY KEY,
    materiel_id INTEGER NOT NULL REFERENCES materiel(id) ON DELETE CASCADE,
    depot_origine VARCHAR(20) NOT NULL CHECK (depot_origine IN ('AXECOM', 'ERT')),
    depot_destination VARCHAR(20) NOT NULL CHECK (depot_destination IN ('AXECOM', 'ERT')),
    date_transfert TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    utilisateur_id INTEGER REFERENCES employes(id),
    utilisateur_nom VARCHAR(200),
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Index Optimisés
```sql
CREATE INDEX idx_transferts_materiel_id ON historique_transferts_materiel(materiel_id);
CREATE INDEX idx_transferts_date ON historique_transferts_materiel(date_transfert);
CREATE INDEX idx_transferts_depot_origine ON historique_transferts_materiel(depot_origine);
CREATE INDEX idx_transferts_depot_destination ON historique_transferts_materiel(depot_destination);
```

#### Utilité
Cette table conserve un **historique complet** de tous les transferts de matériel entre dépôts :
- 📅 **Traçabilité** : Date et heure précises de chaque transfert
- 👤 **Responsabilité** : Utilisateur ayant effectué le transfert
- 📝 **Motif** : Raison du transfert (réorganisation, besoin sur site, etc.)
- 🔍 **Audit** : Recherche et analyse des mouvements de stock

---

### 📊 Table `affectations_materiel`

#### Structure Complète
```sql
CREATE TABLE affectations_materiel (
    -- Identification
    id                SERIAL PRIMARY KEY,
    
    -- Relations
    materiel_id       INTEGER NOT NULL REFERENCES materiel(id),
    employe_id        INTEGER NOT NULL REFERENCES employes(id),
    
    -- Affectation
    quantite_assignee INTEGER NOT NULL DEFAULT 1,
    date_affectation  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_retour       TIMESTAMP,
    
    -- Gestion
    statut            TEXT DEFAULT 'active',
    type_affectation  TEXT DEFAULT 'permanent',
    commentaires      TEXT,
    
    -- Horodatage
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Index Optimisés
```sql
CREATE INDEX idx_affectations_materiel ON affectations_materiel(materiel_id);
CREATE INDEX idx_affectations_employe ON affectations_materiel(employe_id);
CREATE INDEX idx_affectations_statut ON affectations_materiel(statut);
CREATE INDEX idx_affectations_date ON affectations_materiel(date_affectation);
```

#### Statuts d'Affectation
- `active` : Affectation en cours
- `retourne` : Matériel retourné au stock
- `perdu` : Matériel perdu ou volé

#### Types d'Affectation
- `permanent` : Affectation long terme (ex: véhicule de service)
- `temporaire` : Affectation ponctuelle (ex: outil pour chantier)
- `consommable` : Matériel à usage unique (ex: câbles, connecteurs)

---

## 🔄 LOGIQUE MÉTIER

### Gestion des Stocks

#### Lors d'une Affectation (POST)
```javascript
// 1. Vérifier que le matériel existe
const materiel = await query('SELECT quantite FROM materiel WHERE id = $1', [materiel_id])

// 2. Vérifier la quantité disponible
if (quantite_assignee > materiel.quantite) {
  throw new Error('Stock insuffisant')
}

// 3. Créer l'affectation
await query('INSERT INTO affectations_materiel (...) VALUES (...)')

// 4. Déduire du stock
await query(
  'UPDATE materiel SET quantite = quantite - $1 WHERE id = $2',
  [quantite_assignee, materiel_id]
)
```

#### Lors d'un Retour (DELETE)
```javascript
// 1. Récupérer l'affectation
const affectation = await query('SELECT * FROM affectations_materiel WHERE id = $1', [id])

// 2. Supprimer l'affectation
await query('DELETE FROM affectations_materiel WHERE id = $1', [id])

// 3. Remettre en stock (sauf si consommable)
if (affectation.type_affectation !== 'consommable') {
  await query(
    'UPDATE materiel SET quantite = quantite + $1 WHERE id = $2',
    [affectation.quantite_assignee, affectation.materiel_id]
  )
}
```

---

## 💰 CALCUL DE LA VALEUR TOTALE PAR EMPLOYÉ

### Formule de Calcul
```sql
SELECT 
  e.nom,
  e.prenom,
  e.matricule,
  -- Nombre d'affectations actives
  COUNT(am.id) as nombre_affectations,
  
  -- Quantité totale de matériel
  SUM(am.quantite_assignee) as quantite_totale,
  
  -- VALEUR TOTALE = Σ(prix_unitaire × quantité_assignée)
  SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale
  
FROM employes e
LEFT JOIN affectations_materiel am ON e.id = am.employe_id
LEFT JOIN materiel m ON am.materiel_id = m.id
WHERE am.statut = 'active'
  AND e.statut = 'actif'
GROUP BY e.id, e.nom, e.prenom, e.matricule
HAVING COUNT(am.id) > 0
ORDER BY valeur_totale DESC
```

### Exemple de Résultat
| Employé | Matricule | Nb Affectations | Quantité | Valeur Totale |
|---------|-----------|-----------------|----------|---------------|
| DUPONT Jean | TECH_001 | 5 | 12 | 15,450.00€ |
| MARTIN Sophie | TECH_002 | 3 | 8 | 8,200.00€ |
| BERNARD Luc | TECH_003 | 4 | 10 | 6,750.00€ |

### Décomposition de la Valeur
```
Employé: DUPONT Jean
├─ Véhicule Renault Kangoo (1× 12,000€) = 12,000€
├─ Testeur fibre optique (1× 2,500€) = 2,500€
├─ Ordinateur portable (1× 800€) = 800€
├─ Téléphone professionnel (1× 150€) = 150€
└─ Total: 15,450€
```

---

## 🔌 API ENDPOINTS

### 📦 `/api/materiel`

#### GET - Lister tout le matériel
```typescript
// Requête
GET /api/materiel

// Réponse
{
  "materiel": [
    {
      "id": 1,
      "numero_serie": "VEH001",
      "nom_equipement": "Renault Kangoo",
      "type_materiel": "Véhicule",
      "marque": "Renault",
      "modele": "Kangoo Express",
      "statut": "disponible",
      "depot": "AXECOM",
      "quantite": 1,
      "prix_unitaire": 12000.00,
      "date_acquisition": "2024-01-15",
      "kilometrage_vehicule": 45000
    }
  ]
}
```

#### POST - Créer un matériel
```typescript
// Requête
POST /api/materiel
{
  "numero_serie": "VEH002",
  "nom_equipement": "Peugeot Partner",
  "type_materiel": "Véhicule",
  "marque": "Peugeot",
  "modele": "Partner",
  "statut": "disponible",
  "depot": "ERT",        // 🏢 OBLIGATOIRE: AXECOM ou ERT
  "quantite": 1,
  "prix_unitaire": 15000.00,
  "date_acquisition": "2024-06-20"
}

// Validation automatique :
// ✓ depot est obligatoire
// ✓ depot doit être AXECOM ou ERT
// ✓ nom_equipement requis
// ✓ type_materiel requis

// Réponse
{
  "success": true,
  "materiel": { /* objet créé */ }
}
```

#### PUT - Modifier un matériel
```typescript
// Requête
PUT /api/materiel
{
  "id": 1,
  "statut": "en_maintenance",
  "notes_maintenance": "Révision des 50,000 km"
}

// Réponse
{
  "success": true,
  "materiel": { /* objet modifié */ }
}
```

#### DELETE - Supprimer un matériel
```typescript
// Requête
DELETE /api/materiel?id=1

// Réponse
{
  "success": true,
  "message": "Matériel supprimé avec succès"
}
```

---

### 🔄 `/api/materiel/transfer`

#### POST - Transférer un matériel entre dépôts
```typescript
// Requête
POST /api/materiel/transfer
{
  "materiel_id": 5,
  "depot_destination": "ERT",
  "motif": "Réorganisation du stock",
  "commentaires": "Besoin pour chantier sur la zone ERT",
  "utilisateur_id": 12,
  "utilisateur_nom": "DUPONT Jean"
}

// Validation automatique :
// ✓ Matériel existe
// ✓ depot_destination valide (AXECOM ou ERT)
// ✓ Différent du dépôt actuel
// ✓ Transaction sécurisée (COMMIT/ROLLBACK)

// Réponse
{
  "success": true,
  "message": "Matériel transféré de AXECOM vers ERT",
  "transfer": {
    "id": 42,
    "materiel_id": 5,
    "depot_origine": "AXECOM",
    "depot_destination": "ERT",
    "date_transfert": "2024-11-06T10:30:00Z",
    "motif": "Réorganisation du stock",
    "utilisateur_nom": "DUPONT Jean"
  },
  "materiel": {
    "id": 5,
    "nom_equipement": "Testeur fibre optique",
    "depot_ancien": "AXECOM",
    "depot_nouveau": "ERT"
  }
}
```

#### GET - Historique des transferts
```typescript
// Requête avec filtres
GET /api/materiel/transfer?materiel_id=5&depot=AXECOM&limit=20

// Paramètres :
// - materiel_id : ID d'un matériel spécifique
// - depot : Filtrer par dépôt (AXECOM ou ERT)
// - limit : Nombre max de résultats (défaut: 50)

// Réponse
{
  "transferts": [
    {
      "id": 42,
      "materiel_id": 5,
      "nom_equipement": "Testeur fibre optique",
      "type_materiel": "Équipement de mesure",
      "numero_serie": "TEST001",
      "depot_actuel": "ERT",
      "depot_origine": "AXECOM",
      "depot_destination": "ERT",
      "date_transfert": "2024-11-06T10:30:00Z",
      "motif": "Réorganisation du stock",
      "utilisateur_nom": "DUPONT Jean",
      "commentaires": "Besoin pour chantier sur la zone ERT"
    }
  ],
  "total": 1
}
```

---

### 🎯 `/api/affectations-materiel`

#### GET - Lister toutes les affectations
```typescript
// Requête
GET /api/affectations-materiel

// Réponse
{
  "affectations": [
    {
      "id": 1,
      "materiel_id": 5,
      "employe_id": 3,
      "quantite_assignee": 2,
      "date_affectation": "2024-10-01T08:00:00Z",
      "statut": "active",
      "type_affectation": "permanent",
      // Données jointes
      "nom_equipement": "Testeur fibre optique",
      "type_materiel": "Équipement de mesure",
      "employe_nom": "DUPONT",
      "employe_prenom": "Jean",
      "employe_matricule": "TECH_001"
    }
  ]
}
```

#### POST - Créer une affectation
```typescript
// Requête
POST /api/affectations-materiel
{
  "materiel_id": 5,
  "employe_id": 3,
  "quantite_assignee": 2,
  "type_affectation": "permanent",
  "commentaires": "Affectation permanente pour chantier longue durée"
}

// Validation automatique :
// ✓ Matériel existe
// ✓ Employé existe
// ✓ Stock suffisant
// ✓ Déduction automatique du stock

// Réponse
{
  "success": true,
  "affectation": { /* objet créé */ }
}
```

#### PUT - Modifier une affectation
```typescript
// Requête
PUT /api/affectations-materiel
{
  "id": 1,
  "commentaires": "Changement de chantier",
  "date_retour": "2024-12-31"
}

// Réponse
{
  "success": true,
  "affectation": { /* objet modifié */ }
}
```

#### DELETE - Supprimer une affectation (retour)
```typescript
// Requête
DELETE /api/affectations-materiel?id=1

// Logique automatique :
// 1. Suppression de l'affectation
// 2. Remise en stock (sauf si consommable)

// Réponse
{
  "success": true,
  "message": "Affectation supprimée avec succès"
}
```

---

### 💎 `/api/employee-material-value`

#### GET - Valeur totale par employé
```typescript
// Requête (avec filtres optionnels)
GET /api/employee-material-value?startDate=2024-01-01&endDate=2024-12-31&employeId=3

// Paramètres de filtrage :
// - startDate : Date début (format: YYYY-MM-DD)
// - endDate : Date fin (format: YYYY-MM-DD)
// - employeId : ID employé spécifique

// Réponse
{
  "employeeValues": [
    {
      "employe_id": 3,
      "employe_nom": "DUPONT",
      "employe_prenom": "Jean",
      "employe_matricule": "TECH_001",
      "nombre_affectations": 5,
      "quantite_totale": 12,
      "valeur_totale": 15450.00,
      "premiere_affectation": "2024-01-15T10:00:00Z",
      "derniere_affectation": "2024-10-20T14:30:00Z",
      "ert_label": "ERT",
      "axecom_label": ""
    }
  ]
}
```

#### Détails du Calcul
```sql
-- Requête SQL complète utilisée
SELECT 
  e.id as employe_id,
  e.nom as employe_nom,
  e.prenom as employe_prenom,
  e.matricule as employe_matricule,
  
  -- Statistiques d'affectation
  COUNT(am.id) as nombre_affectations,
  SUM(am.quantite_assignee) as quantite_totale,
  
  -- VALEUR TOTALE (€)
  SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale,
  
  -- Historique
  MIN(am.date_affectation) as premiere_affectation,
  MAX(am.date_affectation) as derniere_affectation,
  
  -- Labels métier (ERT/AXECOM)
  COALESCE(el.ert_label, '') as ert_label,
  COALESCE(el.axecom_label, '') as axecom_label
  
FROM employes e
LEFT JOIN affectations_materiel am ON e.id = am.employe_id
LEFT JOIN materiel m ON am.materiel_id = m.id
WHERE am.statut = 'active'
  AND e.statut = 'actif'
GROUP BY e.id, e.nom, e.prenom, e.matricule
HAVING COUNT(am.id) > 0
ORDER BY valeur_totale DESC
```

---

## 🖥️ INTERFACE UTILISATEUR

### Composants React

#### `<MaterialForm />` - Formulaire de matériel
**Fichier** : `components/Forms.tsx`

**Fonctionnalités** :
- 📝 Création/édition de matériel
- 🏢 **Sélection du dépôt** (AXECOM/ERT) - **OBLIGATOIRE**
- ✅ Validation des champs requis
- 💾 Sauvegarde automatique

**Champs principaux** :
- Nom équipement *
- Type de matériel *
- **Dépôt de stockage *** (AXECOM/ERT)
- Statut (disponible/affecté/en maintenance/hors service)
- Quantité, Prix unitaire
- Marque, Modèle
- Date d'acquisition
- Notes de maintenance

#### `<TransferMaterielDialog />` - Transfert entre dépôts
**Fichier** : `components/TransferMaterielDialog.tsx`

**Fonctionnalités** :
- 🔄 Transfert de matériel entre AXECOM et ERT
- 📊 Affichage du dépôt actuel
- 📝 Saisie du motif et commentaires
- ✅ Validation et confirmation
- 🎯 Animation de succès

**Props** :
```typescript
interface TransferMaterielDialogProps {
  materiel: any              // Matériel à transférer
  open: boolean              // État d'ouverture du dialog
  onOpenChange: (open: boolean) => void
  onTransferSuccess: () => void  // Callback après transfert réussi
}
```

**Usage** :
```tsx
<TransferMaterielDialog
  materiel={selectedMateriel}
  open={showTransferDialog}
  onOpenChange={setShowTransferDialog}
  onTransferSuccess={() => {
    loadMateriel()  // Recharger la liste
  }}
/>
```

#### `<AffectationList />` - Liste des affectations
**Fichier** : `components/AffectationList.tsx`

**Fonctionnalités** :
- 📋 Affichage de toutes les affectations
- 🔍 Recherche par nom d'équipement, employé, type
- 🏷️ Filtrage par type d'affectation (permanent/temporaire/consommable)
- ✏️ Modification d'une affectation
- 🗑️ Suppression (retour au stock)
- ➕ Création de nouvelle affectation

**États** :
```typescript
const [affectations, setAffectations] = useState([])
const [searchTerm, setSearchTerm] = useState('')
const [filterType, setFilterType] = useState('all')
const [showForm, setShowForm] = useState(false)
const [editingAffectation, setEditingAffectation] = useState(null)
```

#### `<AffectationForm />` - Formulaire d'affectation
**Fichier** : `components/AffectationForm.tsx`

**Champs** :
- Sélection du matériel (avec stock disponible)
- Sélection de l'employé
- Quantité à assigner
- Type d'affectation
- Date d'affectation
- Commentaires

**Validation** :
- ✓ Stock disponible suffisant
- ✓ Employé actif
- ✓ Quantité > 0
- ✓ Dates cohérentes

---

## 📊 RAPPORTS ET STATISTIQUES

### Rapport de Valeur par Employé

**Endpoint** : `/api/employee-material-value`

**Cas d'usage** :
1. **Audit patrimonial** : Valeur totale du matériel confié
2. **Responsabilité** : Suivi de la valeur sous responsabilité
3. **Assurance** : Déclaration des biens confiés
4. **Comptabilité** : Amortissement et suivi des actifs

**Exemple de rapport** :
```
RAPPORT DE VALEUR MATÉRIEL PAR EMPLOYÉ
Période : Janvier 2024 - Décembre 2024
Date d'édition : 06/11/2025

┌─────────────────────────────────────────────────────────────────┐
│ DUPONT Jean (TECH_001)                                          │
├─────────────────────────────────────────────────────────────────┤
│ Affectations actives : 5                                        │
│ Quantité totale : 12 unités                                     │
│ Valeur totale : 15,450.00 €                                     │
│                                                                 │
│ Détail :                                                        │
│  • Véhicule Renault Kangoo        1× 12,000.00€ = 12,000.00€  │
│  • Testeur fibre optique          1×  2,500.00€ =  2,500.00€  │
│  • Ordinateur portable            1×    800.00€ =    800.00€  │
│  • Téléphone professionnel        1×    150.00€ =    150.00€  │
│                                                                 │
│ Première affectation : 15/01/2024                              │
│ Dernière affectation : 20/10/2024                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 CONTRAINTES ET RÈGLES MÉTIER

### Règles de Gestion

#### Affectation
1. **Stock obligatoire** : Un matériel ne peut être affecté que si `quantite >= quantite_assignee`
2. **Employé actif** : Seuls les employés avec `statut = 'actif'` peuvent recevoir du matériel
3. **Traçabilité** : Chaque affectation est horodatée automatiquement
4. **Unicité** : Un même matériel peut être affecté à plusieurs employés (si quantité > 1)

#### Retour
1. **Remise en stock** : La quantité est automatiquement remise en stock
2. **Exception consommable** : Les consommables ne sont PAS remis en stock
3. **Historique** : Les affectations supprimées sont perdues (pas d'archivage automatique)

#### Calcul de Valeur
1. **Prix par défaut** : Si `prix_unitaire` est NULL, la valeur est 0€
2. **Affectations actives uniquement** : Seules les affectations avec `statut = 'active'` sont comptabilisées
3. **Période** : Les filtres de dates s'appliquent sur `date_affectation`

---

## 🚀 ÉVOLUTIONS FUTURES

### Améliorations Possibles

1. **Historique des affectations**
   - Table d'archivage `affectations_materiel_historique`
   - Conservation des retours et modifications

2. **Alertes maintenance**
   - Notification avant `maintenance_prochaine`
   - Suivi du kilométrage pour véhicules

3. **Demandes de matériel**
   - Workflow d'approbation
   - Gestion des réservations

4. **QR Codes**
   - Génération automatique pour chaque matériel
   - Scan pour consultation/affectation rapide

5. **Photos et documents**
   - Upload et stockage des photos
   - Gestion des certificats de conformité

6. **Amortissement comptable**
   - Calcul automatique selon durée de vie
   - Export pour comptabilité

7. **Géolocalisation**
   - Suivi GPS des véhicules
   - Historique des déplacements

---

## 📝 SCRIPTS UTILES

### Migration de la base de données
```bash
# Créer les tables materiel et affectations_materiel
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -f /scripts/migrate_database.sql

# Ajouter la colonne prix_unitaire (si manquante)
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -f /scripts/add_prix_unitaire_column.sql

# Ajouter la colonne type_affectation (si manquante)
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -f /scripts/add_type_affectation_column.sql
```

### Vérification de la structure
```bash
# Voir la structure de la table materiel
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "\d materiel"

# Voir la structure de la table affectations_materiel
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "\d affectations_materiel"
```

### Statistiques
```bash
# Nombre total de matériel
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "SELECT COUNT(*) FROM materiel;"

# Affectations actives
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "SELECT COUNT(*) FROM affectations_materiel WHERE statut = 'active';"

# Top 10 des employés par valeur de matériel
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "
SELECT 
  e.nom, 
  e.prenom, 
  COUNT(am.id) as nb_affectations,
  SUM(COALESCE(m.prix_unitaire, 0) * am.quantite_assignee) as valeur_totale
FROM employes e
LEFT JOIN affectations_materiel am ON e.id = am.employe_id AND am.statut = 'active'
LEFT JOIN materiel m ON am.materiel_id = m.id
WHERE e.statut = 'actif'
GROUP BY e.id, e.nom, e.prenom
HAVING COUNT(am.id) > 0
ORDER BY valeur_totale DESC
LIMIT 10;"
```

---

## 🎓 RÉSUMÉ

### Points Clés

✅ **3 tables principales** :
- `materiel` : Inventaire complet avec dépôts
- `affectations_materiel` : Qui a quoi
- `historique_transferts_materiel` : Traçabilité des mouvements

✅ **🏢 Gestion des dépôts** :
- Dépôt obligatoire à la création (AXECOM ou ERT)
- Transfert entre dépôts avec historique complet
- Filtrage et recherche par dépôt
- Traçabilité complète des mouvements

✅ **Gestion automatique** :
- Déduction du stock à l'affectation
- Remise en stock au retour
- Calcul de la valeur totale
- Historisation des transferts

✅ **4 API endpoints** :
- `/api/materiel` : CRUD du matériel
- `/api/materiel/transfer` : Transfert entre dépôts
- `/api/affectations-materiel` : CRUD des affectations
- `/api/employee-material-value` : Rapport de valeur

✅ **Formule de valeur** :
```
Valeur Totale = Σ (prix_unitaire × quantite_assignee)
```

✅ **Types d'affectation** :
- `permanent` : Long terme, remis en stock au retour
- `temporaire` : Court terme, remis en stock au retour
- `consommable` : Usage unique, PAS remis en stock

✅ **Dépôts disponibles** :
- `AXECOM` : Dépôt principal (par défaut)
- `ERT` : Dépôt secondaire

---

**Document créé le** : 06/11/2025  
**Dernière mise à jour** : 06/11/2025  
**Version** : 2.0 - Ajout gestion des dépôts  
**Projet** : FinalFibre - Gestion du Matériel  
**Auteur** : Documentation automatique
