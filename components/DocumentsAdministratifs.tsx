"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, RefreshCw, Download, Shield, Users, User, Eye, ChevronDown, ChevronRight, Loader2 } from "lucide-react"

interface Document {
  id: number
  type_document: string
  type_document_libelle: string
  statut: string
  statut_libelle: string
  date_demande: string
  date_traitement?: string
  commentaire_demande?: string
  commentaire_admin?: string
  fichier_jointe?: string
  chemin_fichier?: string
  taille_fichier?: number
  type_fichier?: string
}

interface SecuriteDocument {
  id: number
  categorie_id: number
  technicien_account_id: number | null
  nom: string
  description: string
  fichier_url: string
  fichier_nom: string
  fichier_type: string
  fichier_taille: number
  est_global: boolean
  categorie_nom: string
  created_at: string
}

interface SecuriteCategorie {
  id: number
  nom: string
  description: string
  ordre: number
}

interface DocumentsAdministratifsProps {
  documents: Document[]
  loading: boolean
  onNewRequest: () => void
  technicienAccountId?: number
}

export function DocumentsAdministratifs({ documents, loading, onNewRequest, technicienAccountId }: DocumentsAdministratifsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'demandes' | 'securite'>('demandes')
  const [securiteDocuments, setSecuriteDocuments] = useState<SecuriteDocument[]>([])
  const [securiteCategories, setSecuriteCategories] = useState<SecuriteCategorie[]>([])
  const [loadingSecurite, setLoadingSecurite] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [showPdfViewer, setShowPdfViewer] = useState<string | null>(null)

  // Charger les documents de sécurité
  useEffect(() => {
    if (activeSubTab === 'securite') {
      loadSecuriteDocuments()
    }
  }, [activeSubTab, technicienAccountId])

  const loadSecuriteDocuments = async () => {
    setLoadingSecurite(true)
    try {
      const [catRes, docRes] = await Promise.all([
        fetch('/api/securite-categories'),
        fetch(technicienAccountId 
          ? `/api/securite-documents?technicien_id=${technicienAccountId}` 
          : '/api/securite-documents?global_only=true')
      ])

      const catData = await catRes.json()
      const docData = await docRes.json()

      if (catData.success) {
        setSecuriteCategories(catData.categories)
        // Ouvrir toutes les catégories par défaut
        setExpandedCategories(new Set(catData.categories.map((c: SecuriteCategorie) => c.id)))
      }
      if (docData.success) {
        setSecuriteDocuments(docData.documents)
      }
    } catch (error) {
      console.error('Erreur chargement documents sécurité:', error)
    }
    setLoadingSecurite(false)
  }

  const toggleCategorie = (catId: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId)
    } else {
      newExpanded.add(catId)
    }
    setExpandedCategories(newExpanded)
  }

  const getDocumentsByCategorie = (categorieId: number) => {
    return securiteDocuments.filter(d => d.categorie_id === categorieId)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documents
            </div>
            {activeSubTab === 'demandes' && (
              <Button
                onClick={onNewRequest}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Demande</span>
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Vos documents administratifs et de sécurité
          </CardDescription>
          
          {/* Sous-onglets */}
          <div className="flex gap-2 mt-4 border-b pb-2">
            <Button 
              variant={activeSubTab === 'demandes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('demandes')}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Demandes
              <Badge variant="secondary" className="ml-1">{documents.length}</Badge>
            </Button>
            <Button 
              variant={activeSubTab === 'securite' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveSubTab('securite')}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Sécurité
              <Badge variant="secondary" className="ml-1">{securiteDocuments.length}</Badge>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Onglet Demandes Administratives */}
          {activeSubTab === 'demandes' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Chargement des documents...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucun document demandé</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Cliquez sur "Nouvelle Demande" pour demander un document
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {doc.type_document_libelle}
                            </h3>
                            <Badge 
                              variant={
                                doc.statut === 'en_attente' ? 'secondary' :
                                doc.statut === 'traite' ? 'default' : 'destructive'
                              }
                            >
                              {doc.statut_libelle}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Demande du {new Date(doc.date_demande).toLocaleDateString('fr-FR')}
                          </p>
                          {doc.commentaire_demande && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Commentaire:</strong> {doc.commentaire_demande}
                            </p>
                          )}
                          {doc.commentaire_admin && (
                            <p className="text-sm text-blue-700 mb-2">
                              <strong>Réponse admin:</strong> {doc.commentaire_admin}
                            </p>
                          )}
                          {doc.fichier_jointe && (
                            <div className="flex items-center space-x-2 mt-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <a 
                                href={doc.chemin_fichier} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                              >
                                <Download className="w-3 h-3" />
                                <span>{doc.fichier_jointe}</span>
                              </a>
                              <span className="text-xs text-gray-500">
                                ({((doc.taille_fichier || 0) / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Onglet Documents de Sécurité */}
          {activeSubTab === 'securite' && (
            <>
              {loadingSecurite ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Chargement des documents de sécurité...</span>
                </div>
              ) : securiteCategories.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune catégorie de document</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securiteCategories.map(categorie => {
                    const catDocs = getDocumentsByCategorie(categorie.id)
                    const isExpanded = expandedCategories.has(categorie.id)
                    const globalDocs = catDocs.filter(d => d.est_global)
                    const myDocs = catDocs.filter(d => !d.est_global)

                    return (
                      <div key={categorie.id} className="border rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50"
                          onClick={() => toggleCategorie(categorie.id)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{categorie.nom}</span>
                          </div>
                          <Badge variant="secondary">
                            {catDocs.length} document(s)
                          </Badge>
                        </div>

                        {isExpanded && (
                          <div className="p-3 border-t bg-white">
                            {catDocs.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">
                                Aucun document dans cette catégorie
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {/* Documents globaux */}
                                {globalDocs.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Users className="w-3 h-3 text-green-500" />
                                      <span className="text-xs font-medium text-green-700">Documents Globaux</span>
                                    </div>
                                    <div className="space-y-2 pl-5">
                                      {globalDocs.map(doc => (
                                        <SecuriteDocItem
                                          key={doc.id}
                                          document={doc}
                                          onView={() => setShowPdfViewer(doc.fichier_url)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Mes documents spécifiques */}
                                {myDocs.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <User className="w-3 h-3 text-blue-500" />
                                      <span className="text-xs font-medium text-blue-700">Mes Documents</span>
                                    </div>
                                    <div className="space-y-2 pl-5">
                                      {myDocs.map(doc => (
                                        <SecuriteDocItem
                                          key={doc.id}
                                          document={doc}
                                          onView={() => setShowPdfViewer(doc.fichier_url)}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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

// Composant pour afficher un document de sécurité
function SecuriteDocItem({ document, onView }: { document: SecuriteDocument, onView: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 rounded border bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{document.nom}</div>
          <div className="text-xs text-gray-500 truncate">{document.fichier_nom}</div>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onView} title="Visualiser">
          <Eye className="w-4 h-4" />
        </Button>
        <a 
          href={document.fichier_url} 
          download
          className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}






