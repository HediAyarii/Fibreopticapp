"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, Plus, Trash2, FileText, Upload, Eye, X, FolderPlus, 
  Users, User, Calendar, AlertTriangle, RefreshCw, Download,
  ChevronDown, ChevronRight, Loader2
} from "lucide-react"

interface Categorie {
  id: number
  nom: string
  description: string
  ordre: number
  actif: boolean
}

interface Document {
  id: number
  categorie_id: number
  technicien_account_id: number | null
  nom: string
  description: string
  fichier_url: string
  fichier_nom: string
  fichier_type: string
  fichier_taille: number
  date_expiration: string | null
  est_global: boolean
  categorie_nom: string
  technicien_username: string | null
  technicien_nom: string | null
  technicien_prenom: string | null
  created_at: string
}

interface TechnicienAccount {
  id: number
  username: string
  employe_id: number
  nom: string
  prenom: string
}

export function SecuriteDocumentsManager() {
  const [categories, setCategories] = useState<Categorie[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [techniciens, setTechniciens] = useState<TechnicienAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategorie, setSelectedCategorie] = useState<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [expandedTechniciens, setExpandedTechniciens] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<'categories' | 'techniciens'>('categories')
  
  // Modals
  const [showCategorieModal, setShowCategorieModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState<string | null>(null)
  
  // Form states
  const [newCategorie, setNewCategorie] = useState({ nom: '', description: '' })
  const [newDocument, setNewDocument] = useState({
    categorie_id: '',
    nom: '',
    description: '',
    date_expiration: '',
    est_global: true,
    technicien_account_id: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les données
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [catRes, docRes, techRes] = await Promise.all([
        fetch('/api/securite-categories'),
        fetch('/api/securite-documents'),
        fetch('/api/admin/technicien-accounts')
      ])

      const catData = await catRes.json()
      const docData = await docRes.json()
      const techData = await techRes.json()

      if (catData.success) setCategories(catData.categories)
      if (docData.success) setDocuments(docData.documents)
      if (techData.success) setTechniciens(techData.accounts || [])
      
      // Ouvrir toutes les catégories par défaut
      if (catData.success) {
        setExpandedCategories(new Set(catData.categories.map((c: Categorie) => c.id)))
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    }
    setLoading(false)
  }

  // Créer une catégorie
  const handleCreateCategorie = async () => {
    if (!newCategorie.nom.trim()) {
      alert('Le nom de la catégorie est requis')
      return
    }

    try {
      const response = await fetch('/api/securite-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategorie)
      })

      const data = await response.json()
      if (data.success) {
        setCategories([...categories, data.categorie])
        setShowCategorieModal(false)
        setNewCategorie({ nom: '', description: '' })
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erreur création catégorie:', error)
      alert('Erreur lors de la création')
    }
  }

  // Supprimer une catégorie
  const handleDeleteCategorie = async (id: number) => {
    if (!confirm('Supprimer cette catégorie et tous ses documents ?')) return

    try {
      const response = await fetch(`/api/securite-categories?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(categories.filter(c => c.id !== id))
        setDocuments(documents.filter(d => d.categorie_id !== id))
      }
    } catch (error) {
      console.error('Erreur suppression catégorie:', error)
    }
  }

  // Upload document
  const handleUploadDocument = async () => {
    if (!selectedFile || !newDocument.categorie_id || !newDocument.nom.trim()) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('fichier', selectedFile)
      formData.append('categorie_id', newDocument.categorie_id)
      formData.append('nom', newDocument.nom)
      formData.append('description', newDocument.description)
      formData.append('date_expiration', newDocument.date_expiration)
      formData.append('est_global', newDocument.est_global.toString())
      if (!newDocument.est_global && newDocument.technicien_account_id) {
        formData.append('technicien_account_id', newDocument.technicien_account_id)
      }

      const response = await fetch('/api/securite-documents', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        loadData() // Recharger pour avoir les infos complètes
        setShowDocumentModal(false)
        resetDocumentForm()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erreur upload document:', error)
      alert('Erreur lors de l\'upload')
    }
    setUploading(false)
  }

  // Supprimer document
  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Supprimer ce document ?')) return

    try {
      const response = await fetch(`/api/securite-documents?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(documents.filter(d => d.id !== id))
      }
    } catch (error) {
      console.error('Erreur suppression document:', error)
    }
  }

  const resetDocumentForm = () => {
    setNewDocument({
      categorie_id: '',
      nom: '',
      description: '',
      date_expiration: '',
      est_global: true,
      technicien_account_id: ''
    })
    setSelectedFile(null)
  }

  const toggleCategorie = (id: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  const getDocumentsByCategorie = (categorieId: number) => {
    return documents.filter(d => d.categorie_id === categorieId)
  }

  const getDocumentsByTechnicien = (technicienId: number) => {
    // Documents spécifiques au technicien + documents globaux
    return documents.filter(d => d.technicien_account_id === technicienId || d.est_global)
  }

  const toggleTechnicien = (techId: number) => {
    const newExpanded = new Set(expandedTechniciens)
    if (newExpanded.has(techId)) {
      newExpanded.delete(techId)
    } else {
      newExpanded.add(techId)
    }
    setExpandedTechniciens(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3">Chargement...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold">Documents de Sécurité</h3>
            <p className="text-sm text-muted-foreground">
              Gérez les documents de sécurité par catégorie et par technicien
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" onClick={() => setShowCategorieModal(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Nouvelle Catégorie
          </Button>
          <Button onClick={() => setShowDocumentModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter Document
          </Button>
        </div>
      </div>

      {/* Onglets de vue */}
      <div className="flex gap-2 border-b pb-2">
        <Button 
          variant={viewMode === 'categories' ? 'default' : 'outline'}
          onClick={() => setViewMode('categories')}
          className="gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          Par Catégorie
        </Button>
        <Button 
          variant={viewMode === 'techniciens' ? 'default' : 'outline'}
          onClick={() => setViewMode('techniciens')}
          className="gap-2"
        >
          <Users className="w-4 h-4" />
          Par Technicien
        </Button>
      </div>

      {/* VUE PAR CATÉGORIE */}
      {viewMode === 'categories' && (
        <div className="space-y-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune catégorie</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre première catégorie de documents
                </p>
                <Button onClick={() => setShowCategorieModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une catégorie
                </Button>
              </CardContent>
            </Card>
          ) : (
            categories.map(categorie => {
              const catDocuments = getDocumentsByCategorie(categorie.id)
              const isExpanded = expandedCategories.has(categorie.id)
              const globalDocs = catDocuments.filter(d => d.est_global)
              const specificDocs = catDocuments.filter(d => !d.est_global)

              return (
                <Card key={categorie.id} className="overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategorie(categorie.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <Shield className="w-5 h-5 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">{categorie.nom}</h4>
                        {categorie.description && (
                          <p className="text-sm text-muted-foreground">{categorie.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {catDocuments.length} document(s)
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCategorie(categorie.id)
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="pt-0 border-t">
                      {catDocuments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Aucun document dans cette catégorie</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-4">
                          {/* Documents Globaux */}
                          {globalDocs.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="w-4 h-4 text-green-500" />
                                <span className="font-medium text-sm">Documents Globaux (tous les techniciens)</span>
                                <Badge variant="outline" className="text-green-600 border-green-300">
                                  {globalDocs.length}
                                </Badge>
                              </div>
                              <div className="grid gap-2 pl-6">
                                {globalDocs.map(doc => (
                                  <DocumentItem 
                                    key={doc.id} 
                                    document={doc} 
                                    onView={() => setShowPdfViewer(doc.fichier_url)}
                                    onDelete={() => handleDeleteDocument(doc.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Documents Spécifiques */}
                          {specificDocs.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-blue-500" />
                                <span className="font-medium text-sm">Documents par Technicien</span>
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  {specificDocs.length}
                                </Badge>
                              </div>
                              <div className="grid gap-2 pl-6">
                                {specificDocs.map(doc => (
                                  <DocumentItem 
                                    key={doc.id} 
                                    document={doc} 
                                    onView={() => setShowPdfViewer(doc.fichier_url)}
                                    onDelete={() => handleDeleteDocument(doc.id)}
                                    showTechnicien
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* VUE PAR TECHNICIEN */}
      {viewMode === 'techniciens' && (
        <div className="space-y-4">
          {techniciens.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucun technicien</h3>
                <p className="text-muted-foreground">
                  Aucun compte technicien n'a été trouvé
                </p>
              </CardContent>
            </Card>
          ) : (
            techniciens.map(tech => {
              const techDocs = getDocumentsByTechnicien(tech.id)
              const isExpanded = expandedTechniciens.has(tech.id)
              const specificDocs = techDocs.filter(d => d.technicien_account_id === tech.id)
              const globalDocs = techDocs.filter(d => d.est_global)

              // Grouper les documents par catégorie
              const docsByCategorie = new Map<number, { categorie: Categorie, docs: Document[] }>()
              techDocs.forEach(doc => {
                const cat = categories.find(c => c.id === doc.categorie_id)
                if (cat) {
                  if (!docsByCategorie.has(cat.id)) {
                    docsByCategorie.set(cat.id, { categorie: cat, docs: [] })
                  }
                  docsByCategorie.get(cat.id)!.docs.push(doc)
                }
              })

              return (
                <Card key={tech.id} className="overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleTechnicien(tech.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{tech.prenom} {tech.nom}</h4>
                        <p className="text-sm text-muted-foreground">@{tech.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {specificDocs.length} spécifique(s)
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        {globalDocs.length} global(aux)
                      </Badge>
                      <Badge variant="default">
                        {techDocs.length} total
                      </Badge>
                    </div>
                  </div>

                  {isExpanded && (
                    <CardContent className="pt-0 border-t">
                      {techDocs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Aucun document assigné à ce technicien</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-4">
                          {Array.from(docsByCategorie.values()).map(({ categorie, docs }) => (
                            <div key={categorie.id} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-blue-500" />
                                <span className="font-medium">{categorie.nom}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {docs.length} document(s)
                                </Badge>
                              </div>
                              <div className="grid gap-2 pl-6">
                                {docs.map(doc => (
                                  <DocumentItem 
                                    key={doc.id} 
                                    document={doc} 
                                    onView={() => setShowPdfViewer(doc.fichier_url)}
                                    onDelete={() => handleDeleteDocument(doc.id)}
                                    showGlobalBadge={doc.est_global}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Modal Nouvelle Catégorie */}
      <Dialog open={showCategorieModal} onOpenChange={setShowCategorieModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Catégorie</DialogTitle>
            <DialogDescription>
              Créez une nouvelle catégorie de documents de sécurité
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-nom">Nom de la catégorie *</Label>
              <Input
                id="cat-nom"
                value={newCategorie.nom}
                onChange={(e) => setNewCategorie({ ...newCategorie, nom: e.target.value })}
                placeholder="Ex: Plan de Prévention, AIPR..."
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={newCategorie.description}
                onChange={(e) => setNewCategorie({ ...newCategorie, description: e.target.value })}
                placeholder="Description optionnelle..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategorieModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCategorie}>
              Créer la catégorie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nouveau Document */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un Document</DialogTitle>
            <DialogDescription>
              Uploadez un document de sécurité
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Catégorie *</Label>
              <Select
                value={newDocument.categorie_id}
                onValueChange={(v) => setNewDocument({ ...newDocument, categorie_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nom du document *</Label>
              <Input
                value={newDocument.nom}
                onChange={(e) => setNewDocument({ ...newDocument, nom: e.target.value })}
                placeholder="Ex: Habilitation B1V - Jean Dupont"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder="Description optionnelle..."
              />
            </div>

            <div className="space-y-3">
              <Label>Attribution</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={newDocument.est_global}
                    onChange={() => setNewDocument({ ...newDocument, est_global: true, technicien_account_id: '' })}
                    className="w-4 h-4"
                  />
                  <Users className="w-4 h-4 text-green-500" />
                  <span>Tous les techniciens</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!newDocument.est_global}
                    onChange={() => setNewDocument({ ...newDocument, est_global: false })}
                    className="w-4 h-4"
                  />
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Technicien spécifique</span>
                </label>
              </div>

              {!newDocument.est_global && (
                <Select
                  value={newDocument.technicien_account_id}
                  onValueChange={(v) => setNewDocument({ ...newDocument, technicien_account_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un technicien" />
                  </SelectTrigger>
                  <SelectContent>
                    {techniciens.map(tech => (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        {tech.prenom} {tech.nom} ({tech.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label>Fichier *</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary'
                }`}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-green-700">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour sélectionner un fichier
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, images ou documents (max 10 Mo)
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDocumentModal(false); resetDocumentForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleUploadDocument} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Visualisation PDF */}
      {showPdfViewer && (
        <div className="fixed inset-0 z-[9999] bg-black/90" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="absolute top-20 right-8 z-[10000] flex gap-2">
            <a 
              href={showPdfViewer} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-medium"
            >
              📄 Nouvel onglet
            </a>
            <a 
              href={showPdfViewer} 
              download
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg font-medium"
            >
              <Download className="w-4 h-4 inline mr-1" />
              Télécharger
            </a>
            <button
              onClick={() => setShowPdfViewer(null)}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-xl font-bold border-2 border-red-400"
              style={{ backgroundColor: '#dc2626' }}
            >
              ✕ Fermer
            </button>
          </div>
          <div className="w-full h-full pt-16 pb-4 px-4">
            <iframe
              src={showPdfViewer}
              className="w-full h-full rounded-lg border-2 border-white/20 bg-white"
              title="Document PDF"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Composant Document Item
function DocumentItem({ 
  document, 
  onView, 
  onDelete, 
  showTechnicien = false,
  showGlobalBadge = false
}: { 
  document: Document
  onView: () => void
  onDelete: () => void
  showTechnicien?: boolean
  showGlobalBadge?: boolean
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-white border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-5 h-5 flex-shrink-0 text-blue-500" />
        <div className="min-w-0">
          <div className="font-medium truncate flex items-center gap-2">
            {document.nom}
            {showGlobalBadge && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                <Users className="w-3 h-3 mr-1" />
                Global
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{document.fichier_nom}</span>
            {showTechnicien && document.technicien_prenom && (
              <Badge variant="outline" className="text-xs">
                <User className="w-3 h-3 mr-1" />
                {document.technicien_prenom} {document.technicien_nom}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onView} title="Visualiser">
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600" title="Supprimer">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
