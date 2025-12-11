# 📊 Section "Charges par Salarié" - Documentation Complète

## 🎯 Vue d'ensemble

La section "Charges par Salarié" permet de gérer les coûts salariaux des techniciens, calculer leurs recettes générées, gérer les paiements et suivre le RAP (Reste À Payer).

---

## 🗂️ Architecture des Fichiers

### Composant Principal
```
components/CoutParSalaireManager.tsx     # Composant React principal (2031 lignes)
```

### APIs Backend
```
app/api/cout-par-salaire/
├── route.ts                             # CRUD principal (GET, POST, PUT, DELETE)
└── assign/route.ts                      # Attribution manuelle employé

app/api/paiements-employes/route.ts      # Gestion des paiements (GET, POST, PUT, DELETE)

app/api/sync/
├── total-genere/route.ts                # Synchronisation du Total Généré
├── taxes/route.ts                       # Synchronisation des taxes
├── penalites/route.ts                   # Synchronisation des pénalités
├── names/route.ts                       # Correction des noms via matricule
├── auto-detect/route.ts                 # Détection automatique des correspondances
├── benefice-brut/route.ts               # Sync avec Bénéfice Brut
└── benefice-brut-smart/route.ts         # Sync intelligent avec Bénéfice Brut
```

### Scripts de Base de Données
```
scripts/create_cout_par_salaire_table.sql    # Création table cout_par_salaire
scripts/create_cout_par_salaire_table.js     # Version JS
scripts/create_cout_par_salaire_table.mjs    # Version ES Module
scripts/create_paiements_employes_table.mjs  # Création table paiements_employes
```

---

## 🗄️ Structure Base de Données

### Table `cout_par_salaire`
```sql
CREATE TABLE cout_par_salaire (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    salaire_net DECIMAL(10,2) DEFAULT 0,
    salaire_brut DECIMAL(10,2) DEFAULT 0,
    cout_total DECIMAL(10,2) DEFAULT 0,
    charge DECIMAL(10,2) DEFAULT 0,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    matricule VARCHAR(50),              -- Lien avec table employes
    taxe DECIMAL(5,2) DEFAULT 50,       -- Pourcentage taxe (0, 50, 100)
    impot DECIMAL(10,2) DEFAULT 0,      -- Calculé: charge * (taxe/100)
    penalite DECIMAL(10,2) DEFAULT 0,   -- Total pénalités du mois
    prime DECIMAL(10,2) DEFAULT 0,      -- Prime ajoutée manuellement
    total_genere DECIMAL(10,2) DEFAULT 0, -- Recettes générées (calculé)
    rap DECIMAL(10,2) DEFAULT 0,        -- Reste À Payer (calculé)
    employe_id INTEGER,                 -- FK vers employes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `paiements_employes`
```sql
CREATE TABLE paiements_employes (
    id SERIAL PRIMARY KEY,
    cout_par_salaire_id INTEGER NOT NULL,  -- FK vers cout_par_salaire
    employe_id INTEGER NOT NULL,            -- FK vers employes
    montant_verse DECIMAL(10,2) NOT NULL,
    date_paiement DATE NOT NULL,
    methode_paiement VARCHAR(50) DEFAULT 'virement',
    reference_paiement VARCHAR(255),
    commentaires TEXT,
    statut VARCHAR(20) DEFAULT 'confirme',  -- confirme, annule, en_attente
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📐 Formules de Calcul

### 1. Impôt
```
Si taxe = 100%  → impot = 0
Si taxe = 50%   → impot = charge / 2
Si taxe = 0%    → impot = charge
Sinon           → impot = charge * (taxe / 100)
```

### 2. Total Généré
Le total généré est calculé à partir des interventions `CLOTURE TERMINEE` :
```sql
SELECT SUM(
    CASE 
        WHEN statut = 'CLOTURE TERMINEE' THEN
            (SELECT SUM(prix_tech * quantité) FROM articles WHERE ...)
        ELSE 0
    END
) FROM interventions
WHERE nom_technicien = ... 
  AND date_cloture BETWEEN debut_mois AND fin_mois
```

### 3. RAP (Reste À Payer)
```
RAP = Total Généré - Salaire Net - Impôt + Prime - Total Paiements
```

---

## 🔄 Flux de Données

### Import CSV
```
1. Utilisateur upload fichier CSV
2. Parsing avec détection séparateur (;, , ou tab)
3. Correspondance automatique nom/prénom avec employes
4. Récupération matricule et taxe de l'employé
5. Insertion/Mise à jour dans cout_par_salaire
6. Synchronisation automatique du Total Généré
```

### Chargement des Données (loadData)
```
1. POST /api/sync/total-genere     → Synchronise les recettes
2. POST /api/sync/taxes            → Synchronise les taxes
3. GET /api/cout-par-salaire       → Charge les données avec calculs
4. Pour chaque employé :
   - Calcul total_genere en temps réel
   - Récupération total paiements
   - Calcul RAP final
```

---

## 🎛️ Fonctionnalités du Composant

### 1. Filtrage par Mois/Année
- Sélecteurs déroulants pour mois et année
- Rechargement automatique au changement

### 2. Import/Export CSV
- **Import** : Supporte CSV avec séparateurs ; , ou tab
- **Export** : Génère fichier TSV téléchargeable
- Correspondance intelligente des noms

### 3. Gestion des Paiements
- Ajouter un paiement
- Historique des paiements par employé
- Suppression de paiement
- Recalcul automatique du RAP

### 4. Gestion des Primes
- Ajout de prime (cumulative)
- Modification de prime (remplacement)
- Impact direct sur le RAP

### 5. Édition en Double-Clic
- Modifier nom, prénom, salaires, charges
- Sauvegarde automatique

### 6. Attribution Manuelle
- Lier un coût à un employé existant
- Récupère matricule et taxe

### 7. Synchronisations
- **Sync Pénalités** : Importe les pénalités depuis la table penalites
- **Corriger Noms** : Corrige nom/prénom via matricule

---

## 📡 API Endpoints

### GET /api/cout-par-salaire
```
Params: ?mois=X&annee=YYYY
Response: { success, couts[], total }
```

### POST /api/cout-par-salaire
```
Body: { importData: [...] } ou { nom, prenom, salaire_net, ... }
Response: { success, inserted, updated, errors }
```

### PUT /api/cout-par-salaire
```
Body: { id, [champs à modifier] }
Response: { success, cout }
```

### DELETE /api/cout-par-salaire
```
Params: ?id=X
Response: { success, message }
```

### POST /api/cout-par-salaire/assign
```
Body: { coutId, employeeId, matricule, taxe }
Response: { success, message, data }
```

### GET /api/paiements-employes
```
Params: ?employe_id=X ou ?cout_id=X
Response: { success, paiements[], statistiques }
```

### POST /api/paiements-employes
```
Body: { cout_par_salaire_id, employe_id, montant_verse, date_paiement, ... }
Response: { success, paiement_id }
```

---

## 🔧 Synchronisations Automatiques

### 1. Total Généré (/api/sync/total-genere)
- Parcourt tous les employés dans cout_par_salaire
- Calcule le total des recettes depuis interventions
- Met à jour total_genere et recalcule le RAP

### 2. Taxes (/api/sync/taxes)
- Synchronise pourcentage_taxe depuis table employes
- Recalcule l'impôt selon la formule

### 3. Pénalités (/api/sync/penalites)
- Importe les pénalités des 6 derniers mois
- Crée les coûts manquants si nécessaire
- Met à jour le champ penalite

### 4. Noms (/api/sync/names)
- Corrige nom/prénom via matricule
- Utile après import avec erreurs de saisie

---

## 📊 Statistiques Affichées

| Indicateur | Description |
|------------|-------------|
| Salariés | Nombre total d'enregistrements |
| Coût Total | Somme des cout_total |
| Total Généré | Somme des recettes calculées |
| Total Salaire Net | Somme des salaires nets |
| Total Versé | Somme de tous les paiements |
| Total RAP | Somme des RAP positifs |

---

## 🎨 Interface Utilisateur

### Tableau Principal
| Colonne | Description | Éditable |
|---------|-------------|----------|
| Nom | Nom de l'employé | ✅ Double-clic |
| Prénom | Prénom de l'employé | ✅ Double-clic |
| Matricule | Code employé | ❌ (via attribution) |
| Taxe | Pourcentage (0/50/100) | ❌ (via sync) |
| Salaire Net | Salaire mensuel | ✅ Double-clic |
| Impôt | Calculé auto | ❌ |
| Pénalité | Total pénalités | ❌ (via sync) |
| Prime | Bonus ajouté | ✅ Via bouton |
| Total Généré | Recettes | ❌ (calculé) |
| Versé | Total paiements | ❌ |
| RAP | Reste à payer | ❌ (calculé) |

### Actions par Ligne
- 💰 **Ajouter Paiement** : Ouvre modal de paiement
- 📜 **Historique** : Affiche les paiements passés
- 🎁 **Ajouter/Modifier Prime** : Gestion des primes
- 🔗 **Attribuer** : Attribution manuelle (si pas de matricule)

---

## 🐛 Dépannage

### RAP incorrect
1. Vérifier que total_genere est calculé
2. Lancer "Sync Pénalités" 
3. Vérifier les paiements enregistrés

### Employé non trouvé à l'import
1. Vérifier orthographe nom/prénom
2. Utiliser "Attribuer" manuellement
3. Vérifier que l'employé est "actif"

### Total Généré à 0
1. Vérifier les interventions CLOTURE TERMINEE
2. Vérifier les dates de clôture
3. Vérifier le matching nom_technicien

---

## 📝 Notes Techniques

### Triggers PostgreSQL
- `trigger_recalcul_rap` : Recalcule RAP après modification
- `trigger_calcul_rap_auto` : Calcul automatique du RAP

### Fonction PostgreSQL
```sql
calculer_rap_avec_paiements(cout_id) -- Retourne le RAP final
calculer_total_paiements(cout_id)    -- Retourne total des paiements
```

### Cache Employés
Le composant utilise un cache `employeesCache` pour éviter les appels API répétés lors de la recherche de correspondances.

---

## 🔗 Relations avec autres Modules

```
cout_par_salaire ←→ employes        (via matricule/employe_id)
cout_par_salaire ←→ paiements_employes (via id)
cout_par_salaire ←→ interventions   (via nom/prénom technicien)
cout_par_salaire ←→ penalites       (via employe_id)
cout_par_salaire ←→ company_pricing (pour calcul tarifs)
```

---

**Version** : 2.0  
**Dernière mise à jour** : Décembre 2024  
**Auteur** : FinalFibre App
