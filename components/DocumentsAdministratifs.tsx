"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, RefreshCw, Download } from "lucide-react"

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

interface DocumentsAdministratifsProps {
  documents: Document[]
  loading: boolean
  onNewRequest: () => void
}

export function DocumentsAdministratifs({ documents, loading, onNewRequest }: DocumentsAdministratifsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documents Administratifs
            </div>
            <Button
              onClick={onNewRequest}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Demande</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Demandez vos documents administratifs (fiche de paie, attestations, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}

