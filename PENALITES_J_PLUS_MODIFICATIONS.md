# Modifications - Pénalités J+1 / J+N

## ✅ Modifications effectuées

### 1. Base de données
- ✅ Ajout des colonnes `j_plus_1` (BOOLEAN) et `j_plus_n` (BOOLEAN) à la table `penalites`
- ✅ Création de l'index `idx_penalites_j_plus` pour optimiser les requêtes

### 2. API Backend (`app/api/penalites/route.ts`)
- ✅ POST: Ajout de `j_plus_1` et `j_plus_n` dans le destructuring des données
- ✅ POST: Ajout des colonnes dans l'INSERT query
- ✅ PUT: Utilise déjà une approche dynamique qui supporte automatiquement les nouveaux champs

### 3. API Statistiques (`app/api/statistics/route.ts`)
- ✅ Modification de la requête pour afficher les pénalités par type:
  - `J+1 (60€)` pour les dossiers clôturés à J+1
  - `J+N (140€)` pour les dossiers clôturés à J+N
  - Autres types de pénalités
- ✅ Ajout de compteurs `j_plus_1_count` et `j_plus_n_count` dans les statistiques par employé

### 4. Interface utilisateur (`app/page.tsx`)
- ✅ Modification du titre: "Pénalités par Type (J+1 / J+N)"
- ✅ Ajout d'une description: "Distribution des pénalités selon le délai de clôture"

### 5. Formulaire de pénalité (`components/PenaltyAndArticlesForms.tsx`)
- ℹ️ Déjà implémenté: Les checkboxes J+1 et J+N existent déjà
- ℹ️ Calcul automatique déjà en place:
  - J+1 cochée → montant = 60€
  - J+N cochée → montant = 140€

## 📊 Résultats attendus

### Dans les statistiques:
```
Pénalités par Type (J+1 / J+N)
├── J+1 (60€): 45% (12 pénalités)
├── J+N (140€): 35% (9 pénalités)
└── Autres: 20% (5 pénalités)
```

### Dans le formulaire:
- Checkbox "J+1 (60€)" → Montant automatique de 60€
- Checkbox "J+N (140€)" → Montant automatique de 140€
- Les deux checkboxes sont mutuellement exclusives

## 🔄 Actions à effectuer

1. **Redémarrer le serveur Next.js** pour appliquer les changements:
   ```bash
   npm run dev
   ```

2. **Tester le formulaire**:
   - Ouvrir une pénalité
   - Cocher "J+1 (60€)" → Vérifier que le montant = 60€
   - Cocher "J+N (140€)" → Vérifier que le montant = 140€
   - Sauvegarder et vérifier en base de données

3. **Vérifier les statistiques**:
   - Aller dans l'onglet "Statistiques"
   - Vérifier que le graphique affiche "J+1 (60€)" et "J+N (140€)"

## 🗄️ Structure de la base de données

```sql
-- Table penalites
CREATE TABLE penalites (
    id SERIAL PRIMARY KEY,
    numero_penalite TEXT UNIQUE,
    date_penalite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    employe_id INTEGER REFERENCES employes(id) NOT NULL,
    type_penalite TEXT NOT NULL,
    motif TEXT NOT NULL,
    montant DECIMAL(8,2) NOT NULL,
    manager_approbateur TEXT,
    commentaires TEXT,
    intervention_concernee INTEGER REFERENCES interventions(id),
    reclamation_concernee INTEGER REFERENCES reclamations(id),
    materiel_concerne INTEGER REFERENCES materiel(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_attribution TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    j_plus_1 BOOLEAN DEFAULT FALSE,  -- ✨ NOUVEAU
    j_plus_n BOOLEAN DEFAULT FALSE   -- ✨ NOUVEAU
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_penalites_j_plus ON penalites(j_plus_1, j_plus_n);
```

## 📝 Requête SQL des statistiques

```sql
SELECT 
  CASE 
    WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
    WHEN j_plus_n = TRUE THEN 'J+N (140€)'
    ELSE type_penalite
  END as statut,
  COUNT(*) as count,
  SUM(montant) as total_amount,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM penalites 
WHERE created_at >= $1 AND created_at <= $2
GROUP BY 
  CASE 
    WHEN j_plus_1 = TRUE THEN 'J+1 (60€)'
    WHEN j_plus_n = TRUE THEN 'J+N (140€)'
    ELSE type_penalite
  END
ORDER BY count DESC
```
