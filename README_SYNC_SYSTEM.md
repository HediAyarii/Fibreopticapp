# Système de Synchronisation Automatique

## 🎯 Objectif

Ce système garantit la cohérence entre les données de "Bénéfice Brut" et "Charges par Salarié" en synchronisant automatiquement les valeurs de `total_genere` avec les calculs du bénéfice brut.

## 🔧 Fonctionnalités

### 1. API de Synchronisation (`/api/sync/benefice-brut`)

#### GET - Vérification des incohérences
```bash
GET /api/sync/benefice-brut
```
- **Fonction** : Détecte les incohérences entre les deux sections
- **Retour** : Liste des incohérences avec détails

#### POST - Synchronisation manuelle
```bash
POST /api/sync/benefice-brut
```
- **Fonction** : Synchronise toutes les données incohérentes
- **Retour** : Détails des synchronisations effectuées

### 2. Interface Utilisateur

#### Bouton de Synchronisation
- **Localisation** : Section "Charges par Salarié"
- **Fonctions** :
  - Synchroniser les données
  - Vérifier les incohérences
- **Feedback** : Affichage des résultats en temps réel

## 📊 Logique de Synchronisation

### Calcul du Bénéfice Brut
```sql
SELECT COALESCE(SUM(
  CASE 
    WHEN i.statut = 'CLOTURE TERMINEE' THEN
      COALESCE(
        (SELECT SUM(
          CASE 
            WHEN cp.prix_tech IS NOT NULL THEN cp.prix_tech
            ELSE 0
          END
        )
        FROM unnest(string_to_array(i.articles, ',')) as article_item
        LEFT JOIN company_pricing cp ON 
          TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
          AND cp.company_name = 'ERT OUEST'
          AND cp.category = i.type_intervention
        ), 0
      )
    ELSE 0
  END
), 0) as benefice_total
FROM interventions i
WHERE i.statut = 'CLOTURE TERMINEE'
  AND i.articles IS NOT NULL 
  AND i.articles != ''
  AND LOWER(i.nom_technicien) = LOWER($1)
  AND LOWER(i.prenom_technicien) = LOWER($2)
  AND [filtrage par date]
```

### Processus de Synchronisation
1. **Détection** : Compare `total_genere` avec le calcul du bénéfice brut
2. **Mise à jour** : Met à jour `total_genere` si différence > 0.01€
3. **Recalcul RAP** : Recalcule automatiquement le RAP
4. **Logging** : Enregistre toutes les modifications

## 🚀 Utilisation

### Synchronisation Manuelle
1. Aller dans la section "Charges par Salarié"
2. Cliquer sur "Synchroniser les données"
3. Vérifier les résultats affichés

### Vérification des Incohérences
1. Cliquer sur "Vérifier les incohérences"
2. Consulter la liste des problèmes détectés
3. Effectuer une synchronisation si nécessaire

## 🔍 Détection des Incohérences

### Critères de Détection
- **Différence** : |total_genere - benefice_brut| > 0.01€
- **Techniciens** : Correspondance par nom/prénom
- **Période** : Filtrage par mois/année
- **Statut** : Interventions "CLOTURE TERMINEE" uniquement

### Types d'Incohérences
1. **Valeurs incorrectes** : total_genere ≠ benefice_brut
2. **Données manquantes** : Interventions sans calcul
3. **Erreurs de calcul** : Problèmes dans la logique de pricing

## 📈 Avantages

### ✅ Garanties
- **Cohérence** : Données toujours synchronisées
- **Fiabilité** : Calculs basés sur les interventions réelles
- **Transparence** : Logs détaillés des modifications
- **Performance** : Synchronisation rapide et efficace

### 🛡️ Sécurité
- **Validation** : Vérification des données avant mise à jour
- **Rollback** : Possibilité de restaurer les valeurs précédentes
- **Audit** : Traçabilité complète des modifications

## 🔧 Maintenance

### Vérification Régulière
```bash
# Vérifier les incohérences
curl -X GET "http://localhost:3000/api/sync/benefice-brut"

# Synchroniser si nécessaire
curl -X POST "http://localhost:3000/api/sync/benefice-brut"
```

### Monitoring
- **Fréquence** : Vérification quotidienne recommandée
- **Alertes** : Notification en cas d'incohérences
- **Rapports** : Historique des synchronisations

## 🎯 Résolution des Problèmes

### Incohérences Détectées
1. **Identifier** : Utiliser la vérification des incohérences
2. **Analyser** : Examiner les différences calculées
3. **Synchroniser** : Effectuer la synchronisation
4. **Vérifier** : Confirmer la résolution

### Erreurs de Synchronisation
1. **Logs** : Consulter les logs d'erreur
2. **Base de données** : Vérifier la connectivité
3. **Permissions** : S'assurer des droits d'accès
4. **Support** : Contacter l'équipe technique

## 📝 Notes Importantes

### ⚠️ Précautions
- **Sauvegarde** : Toujours sauvegarder avant synchronisation
- **Test** : Tester sur un environnement de développement
- **Validation** : Vérifier les résultats après synchronisation

### 🔄 Fréquence Recommandée
- **Quotidienne** : Vérification des incohérences
- **Hebdomadaire** : Synchronisation complète
- **Mensuelle** : Audit approfondi du système

---

**Système de Synchronisation v1.0** - Garantit la cohérence des données entre Bénéfice Brut et Charges par Salarié

