# Système de Gestion des Documents Administratifs

## Vue d'ensemble

Ce système permet aux techniciens de demander des documents administratifs (fiches de paie, attestations, etc.) et aux administrateurs de les traiter en joignant les fichiers correspondants.

## Architecture

### Base de données

**Table `documents_administratifs`:**
- `id`: Identifiant unique
- `employe_id`: Référence à l'employé
- `type_document`: Type de document (fiche_paie, attestation_travail, etc.)
- `statut`: Statut de la demande (en_attente, traite, rejete)
- `date_demande`: Date de la demande
- `date_traitement`: Date de traitement par l'admin
- `commentaire_demande`: Commentaire du technicien
- `commentaire_admin`: Réponse de l'administrateur
- `fichier_jointe`: Nom du fichier uploadé
- `chemin_fichier`: Chemin complet du fichier
- `taille_fichier`: Taille en bytes
- `type_fichier`: Extension du fichier

### API Endpoints

#### `/api/documents-administratifs`

**GET** - Récupérer les documents
- Query params: `employe_id`, `statut`, `type_document`
- Retourne: Liste des documents avec informations employé

**POST** - Créer une demande
- Body: `{ employe_id, type_document, commentaire_demande }`
- Retourne: Document créé

**PUT** - Mettre à jour un document (admin)
- Body: `{ id, statut, commentaire_admin, fichier_jointe, chemin_fichier, taille_fichier, type_fichier }`
- Retourne: Document mis à jour

#### `/api/documents-upload`

**POST** - Upload un fichier
- FormData: `file`, `document_id`
- Retourne: Informations du fichier uploadé
- Taille max: 10MB
- Types autorisés: PDF, CSV, JPG, PNG, GIF, Excel

## Composants Frontend

### Pour l'espace technicien

**`DocumentsAdministratifs.tsx`** - Affiche la liste des documents demandés
```typescript
import { DocumentsAdministratifs } from '@/components/DocumentsAdministratifs'

<DocumentsAdministratifs
  documents={documents}
  loading={loadingDocuments}
  onNewRequest={() => setShowDocumentModal(true)}
/>
```

**`NewDocumentModal.tsx`** - Modal pour créer une nouvelle demande
```typescript
import { NewDocumentModal } from '@/components/NewDocumentModal'

<NewDocumentModal
  show={showDocumentModal}
  onClose={() => setShowDocumentModal(false)}
  onSubmit={handleCreateDocument}
  documentTypes={documentTypes}
  formData={newDocument}
  onChange={(field, value) => setNewDocument({...newDocument, [field]: value})}
/>
```

### Intégration dans le dashboard technicien

1. **Importer les composants:**
```typescript
import { DocumentsAdministratifs } from '@/components/DocumentsAdministratifs'
import { NewDocumentModal } from '@/components/NewDocumentModal'
import { Plus } from "lucide-react"
```

2. **Ajouter les états:**
```typescript
const [documents, setDocuments] = useState<any[]>([])
const [documentTypes, setDocumentTypes] = useState<any[]>([])
const [showDocumentModal, setShowDocumentModal] = useState(false)
const [newDocument, setNewDocument] = useState({
  type_document: '',
  commentaire_demande: ''
})
const [loadingDocuments, setLoadingDocuments] = useState(false)
```

3. **Ajouter les fonctions:**
```typescript
const loadDocuments = async () => {
  if (!user) return
  setLoadingDocuments(true)
  try {
    const response = await fetchWithAuth(`/api/documents-administratifs?employe_id=${user.id}`)
    if (response.ok) {
      const data = await response.json()
      setDocuments(data.documents || [])
      setDocumentTypes(data.types || [])
    }
  } catch (error) {
    console.error('Erreur lors du chargement des documents:', error)
  } finally {
    setLoadingDocuments(false)
  }
}

const handleCreateDocument = async () => {
  if (!user || !newDocument.type_document) return
  try {
    const response = await fetchWithAuth('/api/documents-administratifs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employe_id: user.id,
        type_document: newDocument.type_document,
        commentaire_demande: newDocument.commentaire_demande
      })
    })
    if (response.ok) {
      setShowDocumentModal(false)
      setNewDocument({ type_document: '', commentaire_demande: '' })
      loadDocuments()
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
  }
}
```

4. **Ajouter dans le useEffect:**
```typescript
useEffect(() => {
  if (user) {
    loadData()
    loadPersonalData()
    loadDocuments() // Ajouter cette ligne
    
    const dataInterval = setInterval(() => {
      loadData()
      loadDocuments() // Ajouter cette ligne
    }, 2000)
    
    return () => clearInterval(dataInterval)
  }
}, [user])
```

5. **Ajouter l'onglet dans la navigation:**
```typescript
<button
  onClick={() => handleTabChange('documents-administratifs')}
  className={`py-4 px-1 border-b-2 font-medium text-sm ${
    activeTab === 'documents-administratifs'
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`}
>
  <FileText className="w-4 h-4 inline mr-2" />
  Documents Administratifs
</button>
```

6. **Ajouter la section dans le contenu:**
```typescript
{activeTab === 'documents-administratifs' && (
  <>
    <DocumentsAdministratifs
      documents={documents}
      loading={loadingDocuments}
      onNewRequest={() => setShowDocumentModal(true)}
    />
    <NewDocumentModal
      show={showDocumentModal}
      onClose={() => setShowDocumentModal(false)}
      onSubmit={handleCreateDocument}
      documentTypes={documentTypes}
      formData={newDocument}
      onChange={(field, value) => setNewDocument({...newDocument, [field]: value})}
    />
  </>
)}
```

## Section Admin (À implémenter)

La section admin devra permettre de:
1. Voir toutes les demandes de documents
2. Filtrer par statut, employé, type
3. Uploader des fichiers pour chaque demande
4. Ajouter des commentaires
5. Changer le statut (traité, rejeté)

## Types de documents disponibles

- Fiche de Paie
- Attestation de Travail
- Certificat de Salaire
- Attestation de Salaire
- Relevé de Cotisations
- Certificat de Formation
- Attestation d'Emploi
- Bulletin de Paie

## Sécurité

- Les fichiers sont stockés dans `public/uploads/documents/`
- Taille maximale: 10MB
- Types autorisés: PDF, CSV, JPG, PNG, GIF, Excel
- Chaque fichier est nommé: `document_{id}_{timestamp}.{extension}`

## Synchronisation en temps réel

Les documents sont automatiquement synchronisés toutes les 2 secondes via le système de polling existant.

## Prochaines étapes

1. ✅ Créer la table de base de données
2. ✅ Créer les API endpoints
3. ✅ Créer les composants frontend
4. ✅ Documenter l'intégration
5. ⏳ Implémenter la section admin
6. ⏳ Tester le système complet






