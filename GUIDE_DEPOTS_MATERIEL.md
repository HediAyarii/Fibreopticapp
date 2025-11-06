# 🚀 GUIDE RAPIDE - GESTION DES DÉPÔTS MATÉRIEL

## 📋 Fonctionnalités Ajoutées

### ✅ Ce qui a été ajouté :

1. **🏢 Colonne `depot` dans la table materiel**
   - Valeurs possibles : `AXECOM` ou `ERT`
   - Champ obligatoire lors de la création
   - Valeur par défaut : `AXECOM`

2. **📊 Table `historique_transferts_materiel`**
   - Enregistre tous les transferts entre dépôts
   - Conserve : date, motif, utilisateur, commentaires
   - Permet audit et traçabilité

3. **🔌 API `/api/materiel/transfer`**
   - POST : Transférer un matériel entre dépôts
   - GET : Consulter l'historique des transferts
   - Validation et transaction sécurisée

4. **🖥️ Composants React**
   - `<MaterialForm />` : Sélecteur de dépôt ajouté
   - `<TransferMaterielDialog />` : Interface de transfert

---

## 🔧 INSTALLATION

### 1. Appliquer la migration SQL

**Option A - Docker (recommandé)** :
```powershell
# Copier le script dans le container
docker cp scripts/add_depot_to_materiel.sql finalfibre-app-db-1:/app/scripts/

# Exécuter la migration
docker exec -i finalfibre-app-db-1 psql -U postgres -d finalfibre_db -f /app/scripts/add_depot_to_materiel.sql
```

**Option B - Script PowerShell automatique** :
```powershell
.\scripts\migrate_depot_system.ps1
```

### 2. Vérifier l'installation

```powershell
# Vérifier la colonne depot
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "\d materiel" | Select-String "depot"

# Vérifier la table d'historique
docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "\dt historique_transferts_materiel"
```

**Résultat attendu** :
```
depot | character varying(20) | | | 'AXECOM'::character varying
```

---

## 📖 UTILISATION

### 🆕 Créer un matériel avec un dépôt

**Via API** :
```javascript
const response = await fetch('/api/materiel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nom_equipement: 'Testeur fibre optique',
    type_materiel: 'Équipement de mesure',
    depot: 'AXECOM',  // 🏢 OBLIGATOIRE: AXECOM ou ERT
    quantite: 2,
    prix_unitaire: 2500.00,
    marque: 'EXFO',
    modele: 'FiberScope Pro'
  })
})
```

**Via Formulaire** :
1. Ouvrir le formulaire de création de matériel
2. Remplir les champs obligatoires
3. **Sélectionner le dépôt** : AXECOM ou ERT
4. Sauvegarder

---

### 🔄 Transférer un matériel entre dépôts

**Via API** :
```javascript
const response = await fetch('/api/materiel/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    materiel_id: 5,
    depot_destination: 'ERT',
    motif: 'Réorganisation du stock',
    commentaires: 'Besoin pour chantier ERT',
    utilisateur_nom: 'DUPONT Jean'
  })
})
```

**Via Interface** :
1. Sélectionner un matériel
2. Cliquer sur "Transférer" 
3. Choisir le dépôt de destination
4. Indiquer le motif (optionnel)
5. Confirmer le transfert

**Exemple de code React** :
```tsx
import { TransferMaterielDialog } from '@/components/TransferMaterielDialog'

function MaterielList() {
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [selectedMateriel, setSelectedMateriel] = useState(null)

  const handleTransfer = (materiel: any) => {
    setSelectedMateriel(materiel)
    setShowTransferDialog(true)
  }

  return (
    <>
      {/* Bouton de transfert */}
      <Button onClick={() => handleTransfer(materiel)}>
        <ArrowRightLeft className="w-4 h-4 mr-2" />
        Transférer
      </Button>

      {/* Dialog de transfert */}
      <TransferMaterielDialog
        materiel={selectedMateriel}
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onTransferSuccess={() => {
          loadMateriel() // Recharger la liste
        }}
      />
    </>
  )
}
```

---

### 📊 Consulter l'historique des transferts

**Via API** :
```javascript
// Tous les transferts (50 derniers par défaut)
const response = await fetch('/api/materiel/transfer')

// Transferts d'un matériel spécifique
const response = await fetch('/api/materiel/transfer?materiel_id=5')

// Transferts concernant un dépôt
const response = await fetch('/api/materiel/transfer?depot=AXECOM&limit=100')
```

**Via SQL** :
```sql
-- Historique complet d'un matériel
SELECT 
  htm.*,
  m.nom_equipement,
  m.depot as depot_actuel
FROM historique_transferts_materiel htm
JOIN materiel m ON htm.materiel_id = m.id
WHERE htm.materiel_id = 5
ORDER BY htm.date_transfert DESC;

-- Transferts des 7 derniers jours
SELECT 
  COUNT(*) as nombre_transferts,
  depot_origine,
  depot_destination
FROM historique_transferts_materiel
WHERE date_transfert >= NOW() - INTERVAL '7 days'
GROUP BY depot_origine, depot_destination;
```

---

## 🔍 REQUÊTES UTILES

### Statistiques par dépôt

```sql
-- Nombre de matériels par dépôt
SELECT 
  depot,
  COUNT(*) as nombre_materiels,
  SUM(quantite) as quantite_totale,
  SUM(COALESCE(prix_unitaire, 0) * quantite) as valeur_totale
FROM materiel
GROUP BY depot
ORDER BY valeur_totale DESC;
```

**Résultat** :
```
 depot  | nombre_materiels | quantite_totale | valeur_totale 
--------+------------------+-----------------+---------------
 AXECOM |               42 |              87 |     125,450.00
 ERT    |               28 |              53 |      78,200.00
```

### Matériels disponibles par dépôt

```sql
-- Matériels disponibles et leur valeur
SELECT 
  depot,
  nom_equipement,
  type_materiel,
  quantite,
  prix_unitaire,
  (quantite * COALESCE(prix_unitaire, 0)) as valeur_stock
FROM materiel
WHERE statut = 'disponible'
ORDER BY depot, valeur_stock DESC;
```

### Derniers transferts

```sql
-- 10 derniers transferts
SELECT 
  m.nom_equipement,
  htm.depot_origine,
  htm.depot_destination,
  htm.date_transfert,
  htm.motif,
  htm.utilisateur_nom
FROM historique_transferts_materiel htm
JOIN materiel m ON htm.materiel_id = m.id
ORDER BY htm.date_transfert DESC
LIMIT 10;
```

---

## ⚠️ RÈGLES ET VALIDATIONS

### Contraintes de la base de données

1. **Dépôt obligatoire** :
   - Le champ `depot` ne peut pas être NULL
   - Valeurs autorisées : `AXECOM` ou `ERT` uniquement
   - Valeur par défaut : `AXECOM`

2. **Validation du transfert** :
   - Le matériel doit exister
   - Le dépôt de destination doit être différent du dépôt actuel
   - Le dépôt de destination doit être valide (AXECOM ou ERT)

3. **Transaction sécurisée** :
   - Mise à jour du matériel + enregistrement historique en une seule transaction
   - ROLLBACK automatique en cas d'erreur

### Validation côté API

```typescript
// Vérification dans /api/materiel POST
if (!depot || !['AXECOM', 'ERT'].includes(depot)) {
  return NextResponse.json({ 
    error: "Le dépôt est obligatoire (AXECOM ou ERT)" 
  }, { status: 400 })
}

// Vérification dans /api/materiel/transfer POST
if (depot_origine === depot_destination) {
  return NextResponse.json({ 
    error: `Le matériel est déjà dans le dépôt ${depot_destination}` 
  }, { status: 400 })
}
```

---

## 📈 CAS D'USAGE

### Scénario 1 : Création de matériel
```
1. Réception d'un nouveau testeur fibre optique
2. Saisie dans le système avec dépôt = AXECOM
3. Matériel disponible dans le stock AXECOM
```

### Scénario 2 : Transfert inter-dépôts
```
1. Besoin d'un routeur sur un chantier ERT
2. Recherche du routeur dans le dépôt AXECOM
3. Transfert du routeur vers ERT avec motif "Chantier zone Sud"
4. Enregistrement dans l'historique
5. Routeur maintenant disponible dans le dépôt ERT
```

### Scénario 3 : Audit et traçabilité
```
1. Demande de rapport sur les mouvements de matériel
2. Consultation de l'historique des transferts
3. Filtrage par période, dépôt ou matériel
4. Export des données pour comptabilité
```

---

## 🎯 PROCHAINES ÉTAPES

### Extensions possibles

1. **Notifications automatiques** :
   - Alerter lors d'un transfert
   - Notifier le responsable du dépôt de destination

2. **Demandes de transfert** :
   - Workflow d'approbation
   - Validation par le responsable du dépôt source

3. **Rapports avancés** :
   - Tableau de bord par dépôt
   - Graphiques d'évolution des stocks
   - Prévisions de besoins

4. **Géolocalisation** :
   - Localisation GPS des dépôts
   - Carte interactive des matériels

5. **QR Codes** :
   - Génération de QR codes pour chaque matériel
   - Scan pour transfert rapide

---

## 📞 SUPPORT

En cas de problème :

1. **Vérifier la migration** :
   ```powershell
   docker exec finalfibre-app-db-1 psql -U postgres -d finalfibre_db -c "\d materiel"
   ```

2. **Consulter les logs** :
   ```powershell
   docker logs finalfibre-app-db-1 --tail 100
   ```

3. **Réinitialiser si nécessaire** :
   ```sql
   -- Supprimer la colonne et recommencer
   ALTER TABLE materiel DROP COLUMN IF EXISTS depot;
   DROP TABLE IF EXISTS historique_transferts_materiel;
   -- Puis réexécuter le script de migration
   ```

---

**Document créé le** : 06/11/2025  
**Version** : 1.0  
**Projet** : FinalFibre - Gestion des Dépôts de Matériel
