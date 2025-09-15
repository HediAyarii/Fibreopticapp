# Correction de l'Erreur de Valeur Numérique Vide

## Problème Identifié

Le système rencontrait une nouvelle erreur lors de la mise à jour des employés :

```
Erreur PUT employe: error: invalid input syntax for type numeric: ""
```

Cette erreur se produisait quand un champ de type `numeric` (comme `salaire_base`, `taux_horaire`, etc.) était envoyé comme une chaîne vide `""` au lieu de `null`, causant une erreur de syntaxe PostgreSQL.

## Cause du Problème

Après avoir corrigé l'erreur de date vide, il restait le même problème pour les champs numériques. Les valeurs vides étaient traitées comme des chaînes vides `""` au lieu de `null`, ce qui n'est pas valide pour les colonnes de type `numeric` en PostgreSQL.

## Solution Appliquée

### 1. Fonction Utilitaire Étendue

**Avant** (fonction spécifique aux dates) :
```typescript
function processDateValue(value: any): any {
  if (value === '' || value === undefined) {
    return null
  }
  return value
}
```

**Après** (fonction universelle) :
```typescript
function processValue(value: any, fieldType: 'date' | 'numeric' | 'text'): any {
  if (value === '' || value === undefined) {
    return null
  }
  
  if (fieldType === 'numeric') {
    // Pour les champs numériques, convertir en nombre ou null
    const numValue = parseFloat(value)
    return isNaN(numValue) ? null : numValue
  }
  
  return value
}
```

### 2. Mapping des Types de Champs

Ajout d'un mapping des types de champs pour traiter automatiquement tous les champs :

```typescript
const fieldTypes: { [key: string]: 'date' | 'numeric' | 'text' } = {
  date_embauche: 'date',
  salaire_base: 'numeric',
  taux_horaire: 'numeric',
  pourcentage_taxe: 'numeric',
  heures_travaillees: 'numeric',
  heures_supplementaires: 'numeric',
  prime_performance: 'numeric',
  penalites_total: 'numeric',
  date_derniere_evaluation: 'date'
}
```

### 3. Traitement Automatique des Types

**Avant** (traitement manuel) :
```typescript
Object.entries(updateData).forEach(([key, value]) => {
  if (value !== undefined) {
    let processedValue = value
    if (key === 'date_embauche') {
      processedValue = processDateValue(value)
    }
    // ❌ Seulement les dates étaient traitées
    params.push(processedValue)
  }
})
```

**Après** (traitement automatique) :
```typescript
Object.entries(updateData).forEach(([key, value]) => {
  if (value !== undefined) {
    // Traiter les valeurs selon leur type
    const fieldType = fieldTypes[key] || 'text'
    const processedValue = processValue(value, fieldType)
    // ✅ Tous les types sont traités automatiquement
    params.push(processedValue)
  }
})
```

## Champs Numériques Gérés

La correction gère maintenant tous les champs numériques de la table `employes` :

- `salaire_base` (numeric(10,2))
- `taux_horaire` (numeric(8,2))
- `pourcentage_taxe` (numeric(5,2))
- `heures_travaillees` (numeric(5,2))
- `heures_supplementaires` (numeric(5,2))
- `prime_performance` (numeric(8,2))
- `penalites_total` (numeric(8,2))

## Champs de Date Gérés

- `date_embauche` (date)
- `date_derniere_evaluation` (date)

## Impact des Corrections

Ces corrections permettent :
1. ✅ La mise à jour d'employés avec des champs numériques vides sans erreur
2. ✅ La création d'employés avec des champs numériques vides sans erreur
3. ✅ Le traitement automatique de tous les types de champs
4. ✅ La conversion correcte des chaînes vides en `null` pour PostgreSQL
5. ✅ La conversion des valeurs numériques invalides en `null`

## Test de Validation

Pour valider que les corrections fonctionnent :

1. **Modifier un employé avec salaire vide** :
   - Aller dans l'onglet "Employés"
   - Cliquer sur "Modifier" pour un employé existant
   - Laisser le champ "Salaire" vide
   - Sauvegarder et vérifier qu'il n'y a pas d'erreur

2. **Modifier un employé avec taux horaire vide** :
   - Modifier un employé
   - Laisser le champ "Taux horaire" vide
   - Sauvegarder et vérifier qu'il n'y a pas d'erreur

3. **Créer un employé avec champs numériques vides** :
   - Créer un nouvel employé
   - Laisser tous les champs numériques vides
   - Sauvegarder et vérifier qu'il n'y a pas d'erreur

## Notes Techniques

- La fonction `processValue` gère maintenant les types `date`, `numeric` et `text`
- Pour les champs numériques, elle utilise `parseFloat()` et vérifie `isNaN()`
- Le mapping des types permet d'étendre facilement le support à de nouveaux champs
- La solution est robuste et gère tous les cas de valeurs vides ou invalides

## Fichiers Modifiés

- `app/api/employes/route.ts` : Extension de la fonction `processValue` et ajout du mapping des types de champs

## Date de Correction

Correction appliquée le : $(date)
