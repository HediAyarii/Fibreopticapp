# 🏢 SYSTÈME DE GESTION DES DÉPÔTS - RÉSUMÉ

## ✨ Nouvelles Fonctionnalités

### 📦 Gestion Multi-Dépôts
- **2 dépôts** : AXECOM et ERT
- **Sélection obligatoire** du dépôt lors de la création du matériel
- **Valeur par défaut** : AXECOM

### 🔄 Transferts Inter-Dépôts
- **Transfert simple** : Déplacer un matériel d'un dépôt à l'autre
- **Historique complet** : Traçabilité de tous les mouvements
- **Validation** : Impossible de transférer vers le même dépôt

### 📊 Traçabilité et Historique
- **Table dédiée** : `historique_transferts_materiel`
- **Informations enregistrées** :
  - Date et heure du transfert
  - Dépôt origine et destination
  - Utilisateur ayant effectué le transfert
  - Motif et commentaires

---

## 📁 Fichiers Créés/Modifiés

### Scripts SQL
- ✅ `scripts/add_depot_to_materiel.sql` - Migration complète
- ✅ `scripts/migrate_depot_system.ps1` - Script PowerShell d'installation

### API
- ✅ `app/api/materiel/route.ts` - Modifié (ajout validation `depot`)
- ✅ `app/api/materiel/transfer/route.ts` - Nouveau (POST/GET transferts)

### Composants React
- ✅ `components/Forms.tsx` - Modifié (ajout sélecteur dépôt)
- ✅ `components/TransferMaterielDialog.tsx` - Nouveau (interface transfert)

### Documentation
- ✅ `DOCUMENTATION_MATERIEL.md` - Mise à jour complète
- ✅ `GUIDE_DEPOTS_MATERIEL.md` - Guide d'utilisation
- ✅ `README_DEPOTS.md` - Ce fichier

---

## 🚀 Installation Rapide

### 1. Copier le script SQL dans le container
```powershell
docker cp scripts/add_depot_to_materiel.sql finalfibre-app-db-1:/app/scripts/
```

### 2. Exécuter la migration
```powershell
docker exec -i finalfibre-app-db-1 psql -U postgres -d finalfibre_db -f /app/scripts/add_depot_to_materiel.sql
```

**OU utiliser le script automatique** :
```powershell
.\scripts\migrate_depot_system.ps1
```

### 3. Vérifier l'installation
```powershell
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "\d materiel" | Select-String "depot"
```

---

## 📖 Utilisation

### Créer un matériel
```javascript
await fetch('/api/materiel', {
  method: 'POST',
  body: JSON.stringify({
    nom_equipement: 'Testeur fibre',
    type_materiel: 'Équipement',
    depot: 'AXECOM',  // OBLIGATOIRE
    quantite: 1,
    prix_unitaire: 2500
  })
})
```

### Transférer un matériel
```javascript
await fetch('/api/materiel/transfer', {
  method: 'POST',
  body: JSON.stringify({
    materiel_id: 5,
    depot_destination: 'ERT',
    motif: 'Réorganisation',
    commentaires: 'Besoin pour chantier'
  })
})
```

### Consulter l'historique
```javascript
// Tous les transferts
const res = await fetch('/api/materiel/transfer')

// Transferts d'un matériel
const res = await fetch('/api/materiel/transfer?materiel_id=5')

// Transferts d'un dépôt
const res = await fetch('/api/materiel/transfer?depot=AXECOM')
```

---

## 🗄️ Structure de la Base de Données

### Table `materiel` - Nouvelle colonne
```sql
depot VARCHAR(20) DEFAULT 'AXECOM' CHECK (depot IN ('AXECOM', 'ERT'))
```

### Table `historique_transferts_materiel` - Nouvelle table
```sql
CREATE TABLE historique_transferts_materiel (
    id SERIAL PRIMARY KEY,
    materiel_id INTEGER REFERENCES materiel(id),
    depot_origine VARCHAR(20) CHECK (depot_origine IN ('AXECOM', 'ERT')),
    depot_destination VARCHAR(20) CHECK (depot_destination IN ('AXECOM', 'ERT')),
    date_transfert TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    utilisateur_id INTEGER REFERENCES employes(id),
    utilisateur_nom VARCHAR(200),
    commentaires TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Index créés
```sql
CREATE INDEX idx_materiel_depot ON materiel(depot);
CREATE INDEX idx_transferts_materiel_id ON historique_transferts_materiel(materiel_id);
CREATE INDEX idx_transferts_date ON historique_transferts_materiel(date_transfert);
CREATE INDEX idx_transferts_depot_origine ON historique_transferts_materiel(depot_origine);
CREATE INDEX idx_transferts_depot_destination ON historique_transferts_materiel(depot_destination);
```

---

## 🔍 Requêtes SQL Utiles

### Statistiques par dépôt
```sql
SELECT 
  depot,
  COUNT(*) as nombre_materiels,
  SUM(quantite) as quantite_totale,
  SUM(COALESCE(prix_unitaire, 0) * quantite) as valeur_totale
FROM materiel
GROUP BY depot;
```

### Derniers transferts
```sql
SELECT 
  m.nom_equipement,
  htm.depot_origine,
  htm.depot_destination,
  htm.date_transfert,
  htm.utilisateur_nom
FROM historique_transferts_materiel htm
JOIN materiel m ON htm.materiel_id = m.id
ORDER BY htm.date_transfert DESC
LIMIT 10;
```

### Matériels par dépôt et statut
```sql
SELECT 
  depot,
  statut,
  COUNT(*) as nombre,
  SUM(quantite) as quantite
FROM materiel
GROUP BY depot, statut
ORDER BY depot, statut;
```

---

## ✅ Tests de Validation

### Test 1 : Création avec dépôt
```sql
INSERT INTO materiel (nom_equipement, type_materiel, depot, quantite)
VALUES ('Test Routeur', 'Réseau', 'ERT', 1);
-- Devrait réussir
```

### Test 2 : Création sans dépôt (utilise la valeur par défaut)
```sql
INSERT INTO materiel (nom_equipement, type_materiel, quantite)
VALUES ('Test Switch', 'Réseau', 1);
-- Devrait réussir avec depot = 'AXECOM'
```

### Test 3 : Dépôt invalide
```sql
INSERT INTO materiel (nom_equipement, type_materiel, depot, quantite)
VALUES ('Test Modem', 'Réseau', 'AUTRE', 1);
-- Devrait échouer (constraint violation)
```

### Test 4 : Transfert
```sql
-- Supposons materiel_id = 1 est dans AXECOM
INSERT INTO historique_transferts_materiel 
(materiel_id, depot_origine, depot_destination, motif)
VALUES (1, 'AXECOM', 'ERT', 'Test de transfert');

UPDATE materiel SET depot = 'ERT' WHERE id = 1;
-- Devrait réussir
```

---

## 📊 Métriques et KPIs

### Indicateurs à surveiller

1. **Répartition du stock**
   - Nombre de matériels par dépôt
   - Valeur totale par dépôt
   - Taux d'utilisation (affecté vs disponible)

2. **Mouvements inter-dépôts**
   - Nombre de transferts par jour/semaine/mois
   - Direction des flux (AXECOM → ERT vs ERT → AXECOM)
   - Durée moyenne entre transferts

3. **Traçabilité**
   - Nombre de matériels n'ayant jamais été transférés
   - Matériels ayant le plus de transferts
   - Utilisateurs effectuant le plus de transferts

---

## 🎯 Avantages du Système

### Pour la Gestion
- ✅ **Visibilité** : Savoir exactement où est chaque matériel
- ✅ **Traçabilité** : Historique complet des mouvements
- ✅ **Audit** : Justification de chaque transfert avec motif
- ✅ **Responsabilité** : Identification de l'utilisateur ayant effectué le transfert

### Pour les Opérations
- ✅ **Optimisation** : Équilibrage des stocks entre dépôts
- ✅ **Rapidité** : Transfert en quelques clics
- ✅ **Prévention** : Éviter les doublons et erreurs
- ✅ **Reporting** : Statistiques en temps réel

### Pour la Comptabilité
- ✅ **Valorisation** : Valeur du stock par site
- ✅ **Amortissement** : Suivi des actifs par localisation
- ✅ **Inventaire** : Facilite les audits comptables
- ✅ **Export** : Données structurées pour analyse

---

## 🔒 Sécurité et Permissions

### Recommandations

1. **Rôles utilisateurs** :
   - Créer un rôle "Gestionnaire de dépôt" avec droits de transfert
   - Limiter les transferts aux utilisateurs autorisés
   - Audit des actions sensibles

2. **Validation métier** :
   - Vérifier la cohérence des transferts
   - Alertes en cas de transfert inhabituel
   - Approbation pour matériel haute valeur

3. **Sauvegarde** :
   - Backup régulier de `historique_transferts_materiel`
   - Conservation longue durée pour audit
   - Archivage des rapports mensuels

---

## 📞 Support et Contact

### En cas de problème

1. **Consulter la documentation** :
   - `DOCUMENTATION_MATERIEL.md` : Documentation complète
   - `GUIDE_DEPOTS_MATERIEL.md` : Guide d'utilisation détaillé

2. **Vérifier les logs** :
   ```powershell
   docker logs finalfibre-app-db-1 --tail 100 --follow
   ```

3. **Tester la connexion** :
   ```powershell
   docker exec -i finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "SELECT version();"
   ```

---

## 📝 Changelog

### Version 2.0 - 06/11/2025
- ✅ Ajout de la gestion des dépôts (AXECOM/ERT)
- ✅ Système de transfert inter-dépôts
- ✅ Table d'historique des transferts
- ✅ API `/api/materiel/transfer` (POST/GET)
- ✅ Composant `<TransferMaterielDialog />`
- ✅ Mise à jour du formulaire de création
- ✅ Documentation complète

### Version 1.0 - 01/10/2025
- ✅ Gestion de base du matériel
- ✅ Affectations aux employés
- ✅ Calcul des valeurs

---

**Projet** : FinalFibre - Gestion du Matériel  
**Date de mise à jour** : 06/11/2025  
**Version** : 2.0  
**Auteur** : Équipe Développement FinalFibre
