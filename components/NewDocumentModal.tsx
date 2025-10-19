"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface DocumentType {
  value: string
  label: string
}

interface NewDocumentModalProps {
  show: boolean
  onClose: () => void
  onSubmit: () => void
  documentTypes: DocumentType[]
  formData: {
    type_document: string
    commentaire_demande: string
    precision_autre?: string
  }
  onChange: (field: string, value: string) => void
  loading?: boolean
}

export function NewDocumentModal({ 
  show, 
  onClose, 
  onSubmit, 
  documentTypes, 
  formData, 
  onChange,
  loading = false
}: NewDocumentModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Nouvelle Demande de Document</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Sélectionnez le type de document que vous souhaitez demander
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="type_document">Type de Document *</Label>
            <select
              id="type_document"
              value={formData.type_document}
              onChange={(e) => onChange('type_document', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Sélectionnez un type</option>
              <option value="fiche_paie">Fiche de Paie</option>
              <option value="attestation_travail">Attestation de Travail</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Champ de précision pour "Autre" */}
          {formData.type_document === 'autre' && (
            <div>
              <Label htmlFor="precision_autre">Précisez le type de document *</Label>
              <Input
                id="precision_autre"
                value={formData.precision_autre || ''}
                onChange={(e) => onChange('precision_autre', e.target.value)}
                className="mt-1"
                placeholder="Ex: Certificat de formation, Attestation de stage, Bulletin de salaire, etc."
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="commentaire_demande">Commentaire (optionnel)</Label>
            <textarea
              id="commentaire_demande"
              value={formData.commentaire_demande}
              onChange={(e) => onChange('commentaire_demande', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Précisez votre demande si nécessaire..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!formData.type_document || (formData.type_document === 'autre' && !formData.precision_autre) || loading}
            >
              {loading ? 'Envoi...' : 'Envoyer la Demande'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
