"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, RefreshCw, Upload, Download, Check, X, Filter } from "lucide-react"
import { fetchWithAuth } from '@/lib/authManager'

interface Document {
  id: number
  employe_id: number
  prenom: string
  nom: string
  matricule: string
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

export function AdminDocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({
    statut: '',
    employe: ''
  })
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [commentaireAdmin, setCommentaireAdmin] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadDocuments = async () => {
    setLoading(true)
    try {
      let url = '/api/documents-administratifs?'
      if (filter.statut) url += `statut=${filter.statut}&`
      
      const response = await fetchWithAuth(url)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    
    // Mise à jour automatique toutes les 5 secondes
    const interval = setInterval(loadDocuments, 5000)
    return () => clearInterval(interval)
  }, [filter.statut])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleUploadAndApprove = async (documentId: number) => {
    if (!uploadFile) return

    setUploading(true)
    try {
      // Upload du fichier
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('document_id', documentId.toString())

      const uploadResponse = await fetchWithAuth('/api/documents-upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        console.error('❌ Erreur lors de l\'upload')
        return
      }

      const uploadData = await uploadResponse.json()

      // Mise à jour du document
      const updateResponse = await fetchWithAuth('/api/documents-administratifs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: documentId,
          statut: 'traite',
          commentaire_admin: commentaireAdmin,
          fichier_jointe: uploadData.file.name,
          chemin_fichier: uploadData.file.path,
          taille_fichier: uploadData.file.size,
          type_fichier: uploadData.file.extension
        })
      })

      if (updateResponse.ok) {
        console.log('✅ Document traité avec succès')
        setSelectedDocument(null)
        setUploadFile(null)
        setCommentaireAdmin('')
        loadDocuments()
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleReject = async (documentId: number) => {
    try {
      const response = await fetchWithAuth('/api/documents-administratifs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: documentId,
          statut: 'rejete',
          commentaire_admin: commentaireAdmin || 'Demande rejetée'
        })
      })

      if (response.ok) {
        console.log('✅ Document rejeté')
        setSelectedDocument(null)
        setCommentaireAdmin('')
        loadDocuments()
      }
    } catch (error) {
      console.error('❌ Erreur:', error)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    if (filter.employe && !`${doc.prenom} ${doc.nom}`.toLowerCase().includes(filter.employe.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Gestion des Documents Administratifs
            </div>
            <Button
              onClick={loadDocuments}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </CardTitle>
          <CardDescription>
            Gérez les demandes de documents des techniciens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>Statut</Label>
              <select
                value={filter.statut}
                onChange={(e) => setFilter({...filter, statut: e.target.value})}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Tous</option>
                <option value="en_attente">En attente</option>
                <option value="traite">Traité</option>
                <option value="rejete">Rejeté</option>
              </select>
            </div>
            <div>
              <Label>Employé</Label>
              <Input
                type="text"
                placeholder="Rechercher un employé..."
                value={filter.employe}
                onChange={(e) => setFilter({...filter, employe: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilter({ statut: '', employe: '' })}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>

          {/* Liste des documents */}
          {loading && documents.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Chargement...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune demande de document</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
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
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Employé:</strong> {doc.prenom} {doc.nom} ({doc.matricule})
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Demande du:</strong> {new Date(doc.date_demande).toLocaleDateString('fr-FR')}
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
                        </div>
                      )}
                    </div>
                    {doc.statut === 'en_attente' && (
                      <div className="ml-4">
                        <Button
                          size="sm"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          Traiter
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de traitement */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Traiter la demande</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDocument(null)
                    setUploadFile(null)
                    setCommentaireAdmin('')
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                {selectedDocument.type_document_libelle} - {selectedDocument.prenom} {selectedDocument.nom}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fichier à joindre *</Label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.csv,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formats acceptés: PDF, CSV, JPG, PNG, GIF, Excel (max 10MB)
                </p>
              </div>

              <div>
                <Label>Commentaire (optionnel)</Label>
                <textarea
                  value={commentaireAdmin}
                  onChange={(e) => setCommentaireAdmin(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Ajoutez un commentaire pour le technicien..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedDocument.id)}
                  disabled={uploading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  onClick={() => handleUploadAndApprove(selectedDocument.id)}
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Approuver et Envoyer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}




