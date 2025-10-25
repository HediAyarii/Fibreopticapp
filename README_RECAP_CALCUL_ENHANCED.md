# Amélioration de la Section Récap Calcul

## Vue d'ensemble

Cette amélioration permet d'afficher clairement, pour chaque technicien, deux types de recettes :
- **Recettes Technicien** : Ce que le technicien a généré pour lui-même
- **Recettes Entreprise** : Ce que le technicien a généré pour l'entreprise

## Fonctionnalités ajoutées

### 1. API améliorée (`app/api/recap-calcul/route.ts`)
- ✅ Retourne maintenant les `total_recette_entreprise` en plus des `total_recette_technicien`
- ✅ Calcul automatique du bénéfice net (Recettes Entreprise - Recettes Technicien)

### 2. Interface utilisateur améliorée (`components/RecapCalculTable.tsx`)
- ✅ **Nouvelle colonne "Recettes Entreprise"** dans le tableau
- ✅ **Nouvelle colonne "Bénéfice Net"** calculée automatiquement
- ✅ **Section de comparaison visuelle** avec graphiques en barres
- ✅ **Statistiques globales mises à jour** pour refléter les deux types de recettes

### 3. Visualisation améliorée
- ✅ **Cartes de comparaison** pour les 6 premiers techniciens
- ✅ **Barres de progression** montrant la répartition des recettes
- ✅ **Couleurs différenciées** : vert pour technicien, bleu pour entreprise
- ✅ **Calcul automatique du bénéfice net** avec code couleur

## Structure des données

```typescript
interface RecapCalculData {
  employe_id: number
  employe_nom: string
  employe_prenom: string
  employe_matricule: string
  nombre_interventions: number
  total_recette_technicien: number    // NOUVEAU
  total_recette_entreprise: number    // NOUVEAU
}
```

## Calculs effectués

### Recettes Technicien
- Basées sur `company_pricing.prix_tech`
- Calculées pour les interventions avec statut "CLOTURE TERMINEE"

### Recettes Entreprise  
- Basées sur `company_pricing.prix_base`
- Calculées pour les interventions avec statut "CLOTURE TERMINEE"

### Bénéfice Net
- **Formule** : `Recettes Entreprise - Recettes Technicien`
- **Couleur** : 
  - Vert si positif (bénéfice)
  - Rouge si négatif (perte)
  - Gris si neutre

## Interface utilisateur

### Statistiques globales
1. **Recettes Technicien** (vert) - Total des recettes pour les techniciens
2. **Recettes Entreprise** (bleu) - Total des recettes pour l'entreprise  
3. **Interventions Totales** (violet) - Nombre total d'interventions
4. **Bénéfice Net** (orange) - Différence entre recettes entreprise et technicien
5. **Marge Moyenne** (indigo) - Pourcentage de marge

### Tableau détaillé
- **Employé** : Nom, prénom et matricule
- **Interventions** : Nombre d'interventions
- **Recettes Technicien** : Montant généré pour le technicien
- **Recettes Entreprise** : Montant généré pour l'entreprise
- **Bénéfice Net** : Différence avec code couleur

### Section de comparaison visuelle
- **Cartes individuelles** pour les 6 premiers techniciens
- **Barres de progression** montrant la répartition des recettes
- **Calculs automatiques** des pourcentages et bénéfices

## Test

Un script de test est disponible : `test_recap_calcul_enhanced.js`

```bash
node test_recap_calcul_enhanced.js
```

## Utilisation

1. **Sélectionner une période** avec les filtres de date
2. **Choisir un technicien spécifique** (optionnel)
3. **Sélectionner une grille** (optionnel)
4. **Consulter les résultats** :
   - Statistiques globales en haut
   - Comparaison visuelle par technicien
   - Tableau détaillé avec toutes les données

## Avantages

- ✅ **Transparence** : Vision claire de ce que chaque technicien génère
- ✅ **Comparaison** : Facile de comparer les performances
- ✅ **Analyse** : Identification des techniciens les plus rentables
- ✅ **Visualisation** : Graphiques intuitifs pour une compréhension rapide
- ✅ **Flexibilité** : Filtres par période, technicien et grille

## Notes techniques

- Les calculs sont basés sur la table `company_pricing` avec la compagnie "ERT OUEST"
- Les recettes sont calculées uniquement pour les interventions "CLOTURE TERMINEE"
- La synchronisation automatique est maintenue avec les événements existants
- Compatible avec le système de filtres existant
