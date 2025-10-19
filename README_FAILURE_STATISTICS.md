# 📊 Statistiques des Interventions Échouées

## 🎯 Fonctionnalité

Cette fonctionnalité permet d'analyser les interventions échouées dans le tableau de bord admin avec des statistiques détaillées par technicien, motif d'échec et évolution temporelle.

## 🚀 Fonctionnalités Implémentées

### ✅ API de Statistiques (`/api/statistics/failures`)
- **Endpoint**: `GET /api/statistics/failures`
- **Paramètres**:
  - `startDate`: Date de début (format YYYY-MM-DD)
  - `endDate`: Date de fin (format YYYY-MM-DD)
  - `technicien`: Filtre par technicien (optionnel, 'all' par défaut)

### ✅ Composant React (`FailureStatistics`)
- **Localisation**: `components/FailureStatistics.tsx`
- **Fonctionnalités**:
  - Filtres par date et technicien
  - Graphiques interactifs (PieChart, BarChart, LineChart)
  - Tableau des techniciens avec statistiques
  - Évolution temporelle des échecs
  - Analyse des motifs d'échec

### ✅ Intégration Dashboard Admin
- **Nouvel onglet**: "Échecs" dans la navigation
- **Icône**: AlertTriangle
- **Section**: Statistiques des interventions échouées

## 📈 Types de Statistiques

### 1. **Résumé Général**
- Total des échecs
- Échecs terminés
- Nombre de techniciens concernés
- Interventions avec motif d'échec

### 2. **Analyse par Statut**
- Répartition des statuts d'échec
- Pourcentages par statut
- Graphique en secteurs

### 3. **Motifs d'Échec**
- Top 10 des motifs d'échec
- Fréquence des motifs
- Graphique en barres

### 4. **Analyse par Technicien**
- Nombre d'échecs par technicien
- Échecs terminés par technicien
- Interventions avec motif
- Pourcentage de contribution
- **Motifs détaillés par technicien** (R1, R2, etc.)
- Nombre de chaque motif pour chaque technicien
- Pourcentage de chaque motif par technicien

### 5. **Évolution Temporelle**
- Évolution hebdomadaire des échecs
- Tendance des échecs terminés
- Progression des motifs d'échec

### 6. **Niveaux d'Échec**
- Analyse par niveau 1 et 2
- Répartition des niveaux
- Statistiques détaillées

## 🎨 Interface Utilisateur

### **Filtres Disponibles**
- **Période**: Sélecteur de dates (début/fin)
- **Technicien**: Dropdown avec tous les techniciens
- **Actualisation**: Bouton de rechargement des données

### **Graphiques**
- **PieChart**: Répartition des statuts d'échec
- **BarChart**: Top motifs d'échec
- **BarChart**: Motifs par technicien (détaillé)
- **LineChart**: Évolution temporelle
- **Tableau**: Statistiques par technicien
- **Tableau**: Motifs détaillés par technicien

### **Couleurs**
- Rouge (#EF4444): Échecs principaux
- Orange (#F97316): Échecs terminés
- Vert (#22C55E): Avec motif
- Bleu (#3B82F6): Autres métriques

## 🔧 Structure Technique

### **Base de Données**
```sql
-- Colonnes utilisées dans la table interventions
statut              -- Statut de l'intervention
motif_echec         -- Motif de l'échec
echec_niveau_1      -- Niveau d'échec 1
echec_niveau_2      -- Niveau d'échec 2
nom_technicien      -- Nom du technicien
prenom_technicien   -- Prénom du technicien
date_rdv           -- Date de rendez-vous
```

### **Requêtes SQL Principales**
1. **Statistiques par statut**: Filtrage des statuts contenant "ECHEC"
2. **Motifs d'échec**: Analyse des motifs non vides
3. **Par technicien**: Groupement par nom/prénom
4. **Évolution temporelle**: Agrégation par semaine
5. **Niveaux d'échec**: Analyse des colonnes niveau 1 et 2

## 🚀 Utilisation

### **Accès**
1. Se connecter en tant qu'admin
2. Cliquer sur l'onglet "Échecs" dans la navigation
3. Sélectionner la période d'analyse
4. Optionnellement filtrer par technicien
5. Cliquer sur "Actualiser"

### **Interprétation des Données**
- **Total Échecs**: Nombre total d'interventions échouées
- **Échec Terminé**: Interventions avec statut "ECHEC TERMINER"
- **Avec Motif**: Interventions ayant un motif d'échec renseigné
- **Pourcentage**: Contribution relative de chaque technicien

## 📊 Exemples de Données

### **Réponse API Type**
```json
{
  "success": true,
  "statistics": {
    "failures": {
      "byStatus": [
        {"statut": "ECHEC TERMINER", "count": 45, "percentage": 75.0},
        {"statut": "ECHEC", "count": 15, "percentage": 25.0}
      ],
      "byReason": [
        {"motif_echec": "Client absent", "count": 20, "percentage": 33.3},
        {"motif_echec": "Problème technique", "count": 15, "percentage": 25.0}
      ],
      "byTechnician": [
        {
          "nom_technicien": "Dupont",
          "prenom_technicien": "Jean",
          "total_failures": 12,
          "echec_terminer": 8,
          "with_reason": 10,
          "percentage": 20.0
        }
      ],
      "motifsByTechnician": [
        {
          "nom_technicien": "Dupont",
          "prenom_technicien": "Jean",
          "motif_echec": "R1 - Client absent",
          "count": 5,
          "percentage_technicien": 50.0,
          "percentage_total": 8.3
        },
        {
          "nom_technicien": "Dupont",
          "prenom_technicien": "Jean",
          "motif_echec": "R2 - Problème technique",
          "count": 3,
          "percentage_technicien": 30.0,
          "percentage_total": 5.0
        }
      ],
      "temporalEvolution": [
        {
          "week": "2024-01-01T00:00:00.000Z",
          "total_failures": 5,
          "echec_terminer": 3,
          "with_reason": 4
        }
      ],
      "total": 60
    }
  }
}
```

## 🔍 Filtrage et Recherche

### **Filtres Disponibles**
- **Période**: Analyse sur une plage de dates
- **Technicien**: Focus sur un technicien spécifique
- **Statut**: Filtrage automatique des statuts d'échec

### **Recherche Intelligente**
- Support de multiples formats de dates
- Filtrage insensible à la casse
- Gestion des valeurs nulles et vides

## 🎯 Cas d'Usage

### **Pour les Managers**
- Identifier les techniciens avec le plus d'échecs
- Analyser les motifs d'échec récurrents
- Suivre l'évolution des performances

### **Pour l'Amélioration Continue**
- Identifier les problèmes récurrents
- Mesurer l'efficacité des formations
- Optimiser les processus d'intervention

## 🔧 Maintenance

### **Mise à Jour des Données**
- Actualisation automatique lors du changement de filtres
- Cache des données pour optimiser les performances
- Gestion des erreurs et états de chargement

### **Performance**
- Requêtes SQL optimisées avec index
- Pagination des résultats
- Mise en cache des statistiques

## 📝 Notes Techniques

- **Framework**: Next.js 14 avec App Router
- **Base de données**: PostgreSQL
- **Graphiques**: Recharts
- **UI**: Tailwind CSS + shadcn/ui
- **TypeScript**: Support complet des types

## 🚀 Prochaines Améliorations

- [ ] Export des statistiques en PDF/Excel
- [ ] Alertes automatiques sur les échecs
- [ ] Comparaison entre périodes
- [ ] Prédiction des échecs avec IA
- [ ] Intégration avec les notifications push
