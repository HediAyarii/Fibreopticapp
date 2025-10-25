# Section Récap Calcul avec Consommation Carburant

## Vue d'ensemble

Cette amélioration étend la section Récap Calcul pour inclure les données de consommation carburant par technicien, permettant une analyse complète des performances et des coûts.

## Nouvelles fonctionnalités

### 1. **Données de carburant intégrées**
- ✅ **Consommation totale** par technicien
- ✅ **Nombre de transactions** carburant
- ✅ **Consommation moyenne** par transaction
- ✅ **Analyse comparative** carburant vs recettes

### 2. **Métriques de performance**
- ✅ **Ratio Carburant/Recettes** : Pourcentage de coût carburant par rapport aux recettes
- ✅ **Efficacité** : Ratio recettes/carburant (€ générés par € de carburant)
- ✅ **Indicateurs visuels** : Excellent/Bon/À améliorer selon les ratios

### 3. **Interface enrichie**
- ✅ **Nouvelles colonnes** dans le tableau principal
- ✅ **Section d'analyse** carburant vs recettes
- ✅ **Statistiques globales** incluant la consommation carburant
- ✅ **Cartes de performance** avec indicateurs visuels

## Structure des données étendue

```typescript
interface RecapCalculData {
  employe_id: number
  employe_nom: string
  employe_prenom: string
  employe_matricule: string
  nombre_interventions: number
  total_recette_technicien: number
  total_recette_entreprise: number
  // NOUVELLES DONNÉES CARBURANT
  nombre_transactions_carburant: number
  consommation_totale_carburant: number
  consommation_moyenne_carburant: number
}
```

## Calculs et métriques

### Consommation Carburant
- **Source** : Table `carburant_consommation` liée aux employés
- **Période** : Filtrée selon les dates sélectionnées
- **Format** : Montants en euros (conversion automatique des virgules)

### Métriques de Performance

#### Ratio Carburant/Recettes
- **Formule** : `(Consommation Carburant / Recettes Entreprise) × 100`
- **Seuils** :
  - 🟢 **Excellent** : < 10%
  - 🟡 **Bon** : 10-20%
  - 🔴 **À améliorer** : > 20%

#### Efficacité
- **Formule** : `Recettes Entreprise / Consommation Carburant`
- **Seuils** :
  - 🟢 **Excellent** : > 5€/€
  - 🟡 **Bon** : 2-5€/€
  - 🔴 **À améliorer** : < 2€/€

## Interface utilisateur

### Statistiques globales (6 cartes)
1. **Recettes Technicien** (vert) - Total des recettes pour les techniciens
2. **Recettes Entreprise** (bleu) - Total des recettes pour l'entreprise
3. **Interventions Totales** (violet) - Nombre total d'interventions
4. **Bénéfice Net** (orange) - Différence entre recettes entreprise et technicien
5. **Marge Moyenne** (indigo) - Pourcentage de marge
6. **Consommation Carburant** (rouge) - Total de la consommation carburant

### Tableau détaillé (7 colonnes)
- **Employé** : Nom, prénom et matricule
- **Interventions** : Nombre d'interventions
- **Recettes Technicien** : Montant généré pour le technicien
- **Recettes Entreprise** : Montant généré pour l'entreprise
- **Bénéfice Net** : Différence avec code couleur
- **Carburant** : Consommation totale carburant
- **Transactions** : Nombre de transactions carburant

### Section d'analyse carburant vs recettes
- **Cartes individuelles** pour les 6 premiers techniciens
- **Métriques de performance** :
  - Recettes Entreprise
  - Consommation Carburant
  - Ratio Carburant/Recettes
  - Efficacité (€/€)
  - Nombre de transactions
- **Indicateur de performance** avec icônes et couleurs

## Requête SQL optimisée

La requête utilise des CTE (Common Table Expressions) pour :
1. **interventions_data** : Calcul des recettes par technicien
2. **carburant_data** : Calcul de la consommation carburant par technicien
3. **JOIN complet** : Combinaison des données avec FULL OUTER JOIN

## Avantages de l'analyse

### Pour la gestion
- ✅ **Optimisation des coûts** : Identification des techniciens les plus efficaces
- ✅ **Contrôle budgétaire** : Suivi des dépenses carburant vs recettes
- ✅ **Planification** : Données pour optimiser les assignations

### Pour les techniciens
- ✅ **Transparence** : Vision claire de leur performance
- ✅ **Motivation** : Objectifs mesurables basés sur l'efficacité
- ✅ **Formation** : Identification des axes d'amélioration

## Utilisation

1. **Sélectionner une période** avec les filtres de date
2. **Consulter les statistiques globales**
3. **Analyser les cartes de performance** carburant vs recettes
4. **Examiner le tableau détaillé** pour tous les techniciens
5. **Identifier les opportunités d'optimisation**

## Test

Script de test disponible : `test_recap_calcul_with_fuel.js`

```bash
node test_recap_calcul_with_fuel.js
```

## Notes techniques

- **Synchronisation** : Les données carburant sont synchronisées avec les événements existants
- **Performance** : Requête optimisée avec CTE pour de meilleures performances
- **Compatibilité** : Maintient la compatibilité avec le système de filtres existant
- **Évolutivité** : Structure extensible pour d'autres types de coûts

## Exemples d'utilisation

### Analyse d'un technicien performant
- **Recettes Entreprise** : 15,000€
- **Consommation Carburant** : 800€
- **Ratio** : 5.3% (Excellent)
- **Efficacité** : 18.75€/€ (Excellent)

### Identification d'optimisation
- **Recettes Entreprise** : 8,000€
- **Consommation Carburant** : 2,500€
- **Ratio** : 31.3% (À améliorer)
- **Efficacité** : 3.2€/€ (Bon)

Cette analyse permet d'identifier les techniciens qui nécessitent une formation ou un suivi particulier pour optimiser leur efficacité carburant.
