# Initialisation Complète de la Base de Données

Ce document explique comment initialiser complètement la base de données FinalFibre avec toutes les tables, fonctions et données nécessaires.

## 🚀 Scripts d'Initialisation

### 1. Script Principal de Schéma
**Fichier:** `scripts/create_database_schema.sql`
- Crée toutes les tables nécessaires
- Inclut les fonctions PostgreSQL
- Définit les index et contraintes
- Ajoute les commentaires sur les tables

### 2. Script d'Initialisation Complète
**Fichier:** `scripts/init_complete_database.mjs`
- Exécute le schéma principal
- Insère toutes les données de tarifs d'entreprise
- Vérifie l'installation

### 3. Script de Vérification
**Fichier:** `scripts/verify_database_setup.mjs`
- Vérifie que toutes les tables existent
- Teste les fonctions
- Contrôle les données

## 📋 Tables Créées

### Tables Principales
- `interventions` - Données des interventions
- `employes` - Informations des employés
- `carburant_assignations` - Assignations de cartes carburant
- `cout_par_salaire` - Coûts par salarié avec calculs automatiques

### Tables de Gestion
- `company_pricing` - Tarifs d'entreprise
- `fixed_costs` - Coûts fixes
- `variable_costs` - Coûts variables
- `cost_categories` - Catégories de coûts

### Tables Carburant
- `carburant` - Cartes carburant
- `carburant_mouvements` - Historique des mouvements
- `carburant_conflits` - Conflits d'assignation
- `carburant_consommation` - Consommations

## 🔧 Fonctions PostgreSQL

### Fonctions de Détection de Conflits
- `detecter_conflits_assignation(INTEGER, VARCHAR, TIMESTAMP)` - Détecte les conflits d'assignation

### Fonctions d'Historique
- `historique_carte(VARCHAR)` - Historique d'une carte
- `historique_employe(INTEGER)` - Historique d'un employé

### Triggers
- `trigger_carburant_mouvement()` - Enregistre automatiquement les mouvements

## 🚀 Utilisation

### Initialisation Complète
```bash
# Exécuter l'initialisation complète
node scripts/init_complete_database.mjs
```

### Vérification
```bash
# Vérifier que tout est en place
node scripts/verify_database_setup.mjs
```

### Initialisation Manuelle (si nécessaire)
```bash
# Créer seulement les tables manquantes
node scripts/create_missing_tables.mjs

# Créer seulement la fonction de conflits
node scripts/create_detecter_conflits_assignation_function.mjs
```

## 📊 Données Incluses

### Tarifs d'Entreprise
- **AXECOM** (SAV et RACC)
- **ERT OUEST** (SAV et RACC)
- Plus de 60 services avec prix de base et prix technicien

### Catégories de Coûts
- Personnel (Bleu)
- Matériel (Rouge)
- Transport (Vert)
- Formation (Orange)
- Maintenance (Violet)
- Autres (Gris)

## 🔧 Résolution de Problèmes

### Erreurs Courantes

1. **`relation "table_name" does not exist`**
   - Solution: Exécuter `node scripts/init_complete_database.mjs`

2. **`function "function_name" does not exist`**
   - Solution: Exécuter `node scripts/create_detecter_conflits_assignation_function.mjs`

3. **`TypeError: a.toFixed is not a function`**
   - Solution: Redémarrer le serveur Next.js après les corrections

### Vérification Rapide
```bash
# Vérifier l'état de la base de données
node scripts/verify_database_setup.mjs
```

## 📝 Notes Importantes

- Tous les scripts utilisent les variables d'environnement PostgreSQL
- Les scripts sont idempotents (peuvent être exécutés plusieurs fois)
- Les données existantes sont préservées (ON CONFLICT DO NOTHING)
- Les fonctions sont mises à jour (CREATE OR REPLACE)

## 🎯 Résultat Attendu

Après l'initialisation complète, vous devriez avoir :
- ✅ Toutes les tables créées
- ✅ Toutes les fonctions opérationnelles
- ✅ Tous les tarifs d'entreprise insérés
- ✅ Toutes les catégories de coûts créées
- ✅ Aucune erreur dans les APIs






