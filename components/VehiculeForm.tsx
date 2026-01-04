"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, FileText, X, Eye, Loader2 } from "lucide-react"

export function VehiculeForm({ 
  vehicule, 
  onSave, 
  onCancel,
  onRefresh
}: { 
  vehicule: any, 
  onSave: (data: any) => Promise<void>, 
  onCancel: () => void,
  onRefresh?: () => void
}) {
  const [formData, setFormData] = useState({
    matricule: vehicule?.matricule || '',
    marque: vehicule?.marque || '',
    modele: vehicule?.modele || '',
    annee: vehicule?.annee || new Date().getFullYear(),
    kilometrage: vehicule?.kilometrage || 0,
    type_vehicule: vehicule?.type_vehicule || 'utilitaire',
    couleur: vehicule?.couleur || '',
    numero_chassis: vehicule?.numero_chassis || '',
    carburant: vehicule?.carburant || 'diesel',
    puissance_fiscale: vehicule?.puissance_fiscale || 0,
    assurance_expiration: vehicule?.assurance_expiration || '',
    visite_technique_expiration: vehicule?.visite_technique_expiration || '',
    statut: vehicule?.statut || 'disponible',
    notes: vehicule?.notes || ''
  })

  // États pour les documents PDF
  const [assurancePdf, setAssurancePdf] = useState<File | null>(null)
  const [carteGrisePdf, setCarteGrisePdf] = useState<File | null>(null)
  const [existingAssurancePdf, setExistingAssurancePdf] = useState({ url: '', filename: '' })
  const [existingCarteGrisePdf, setExistingCarteGrisePdf] = useState({ url: '', filename: '' })
  const [uploadingAssurance, setUploadingAssurance] = useState(false)
  const [uploadingCarteGrise, setUploadingCarteGrise] = useState(false)
  const [assuranceDragOver, setAssuranceDragOver] = useState(false)
  const [carteGriseDragOver, setCarteGriseDragOver] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState<string | null>(null)

  // Mettre à jour le formulaire quand le véhicule change
  useEffect(() => {
    // Toujours réinitialiser les fichiers sélectionnés (non sauvegardés)
    setAssurancePdf(null)
    setCarteGrisePdf(null)
    
    if (vehicule) {
      setFormData({
        matricule: vehicule.matricule || '',
        marque: vehicule.marque || '',
        modele: vehicule.modele || '',
        annee: vehicule.annee || new Date().getFullYear(),
        kilometrage: vehicule.kilometrage || 0,
        type_vehicule: vehicule.type_vehicule || 'utilitaire',
        couleur: vehicule.couleur || '',
        numero_chassis: vehicule.numero_chassis || '',
        carburant: vehicule.carburant || 'diesel',
        puissance_fiscale: vehicule.puissance_fiscale || 0,
        assurance_expiration: vehicule.assurance_expiration ? vehicule.assurance_expiration.split('T')[0] : '',
        visite_technique_expiration: vehicule.visite_technique_expiration ? vehicule.visite_technique_expiration.split('T')[0] : '',
        statut: vehicule.statut || 'disponible',
        notes: vehicule.notes || ''
      })
      // Charger les documents existants (ou vide si pas de documents)
      setExistingAssurancePdf({
        url: vehicule.assurance_pdf_url || '',
        filename: vehicule.assurance_pdf_filename || ''
      })
      setExistingCarteGrisePdf({
        url: vehicule.carte_grise_pdf_url || '',
        filename: vehicule.carte_grise_pdf_filename || ''
      })
    } else {
      // Nouveau véhicule - réinitialiser tout
      setFormData({
        matricule: '',
        marque: '',
        modele: '',
        annee: new Date().getFullYear(),
        kilometrage: 0,
        type_vehicule: 'utilitaire',
        couleur: '',
        numero_chassis: '',
        carburant: 'diesel',
        puissance_fiscale: 0,
        assurance_expiration: '',
        visite_technique_expiration: '',
        statut: 'disponible',
        notes: ''
      })
      setExistingAssurancePdf({ url: '', filename: '' })
      setExistingCarteGrisePdf({ url: '', filename: '' })
    }
  }, [vehicule])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Si c'est un véhicule existant et qu'il y a des fichiers à uploader
    if (vehicule?.id && (assurancePdf || carteGrisePdf)) {
      try {
        if (assurancePdf) {
          setUploadingAssurance(true)
          await uploadPdf(assurancePdf, 'assurance')
          setUploadingAssurance(false)
        }
        if (carteGrisePdf) {
          setUploadingCarteGrise(true)
          await uploadPdf(carteGrisePdf, 'carte_grise')
          setUploadingCarteGrise(false)
        }
        // Upload terminé, sauvegarder et recharger
        await onSave(formData)
        // Appeler onRefresh pour recharger la liste avec les documents
        if (onRefresh) {
          setTimeout(() => onRefresh(), 500)
        }
      } catch (error) {
        console.error('Erreur upload documents:', error)
        alert('Erreur lors de l\'upload des documents')
      }
    } else {
      // Pas de documents à uploader, juste sauvegarder
      await onSave(formData)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Fonctions pour gérer les uploads PDF
  const validatePdfFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier PDF')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 10 Mo')
      return false
    }
    return true
  }

  const handleAssuranceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validatePdfFile(file)) {
      setAssurancePdf(file)
    }
  }

  const handleCarteGriseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validatePdfFile(file)) {
      setCarteGrisePdf(file)
    }
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent, setter: (v: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setter(true)
  }

  const handleDragLeave = (e: React.DragEvent, setter: (v: boolean) => void) => {
    e.preventDefault()
    e.stopPropagation()
    setter(false)
  }

  const handleAssuranceDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAssuranceDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && validatePdfFile(file)) {
      setAssurancePdf(file)
    }
  }

  const handleCarteGriseDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCarteGriseDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && validatePdfFile(file)) {
      setCarteGrisePdf(file)
    }
  }

  // Upload PDF
  const uploadPdf = async (file: File, documentType: 'assurance' | 'carte_grise') => {
    if (!vehicule?.id) return null
    
    const formData = new FormData()
    formData.append('vehicule_id', vehicule.id.toString())
    formData.append('document_type', documentType)
    formData.append('pdf_file', file)
    
    const response = await fetch('/api/vehicules-documents', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'upload')
    }
    
    return await response.json()
  }

  // Supprimer un document
  const deleteDocument = async (documentType: 'assurance' | 'carte_grise') => {
    if (!vehicule?.id) return
    
    const response = await fetch(
      `/api/vehicules-documents?vehicule_id=${vehicule.id}&document_type=${documentType}`,
      { method: 'DELETE' }
    )
    
    if (response.ok) {
      if (documentType === 'assurance') {
        setExistingAssurancePdf({ url: '', filename: '' })
        setAssurancePdf(null)
      } else {
        setExistingCarteGrisePdf({ url: '', filename: '' })
        setCarteGrisePdf(null)
      }
    }
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle>
          {vehicule ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
        </DialogTitle>
        <DialogDescription>
          {vehicule ? 'Modifiez les informations du véhicule' : 'Ajoutez un nouveau véhicule à la flotte'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="matricule">Matricule *</Label>
            <Input
              id="matricule"
              value={formData.matricule}
              onChange={(e) => handleChange('matricule', e.target.value)}
              placeholder="Ex: 123 TU 4567"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="marque">Marque *</Label>
            <Input
              id="marque"
              value={formData.marque}
              onChange={(e) => handleChange('marque', e.target.value)}
              placeholder="Ex: Renault, Peugeot..."
              required
            />
          </div>

          <div>
            <Label htmlFor="modele">Modèle</Label>
            <Input
              id="modele"
              value={formData.modele}
              onChange={(e) => handleChange('modele', e.target.value)}
              placeholder="Ex: Kangoo, Partner..."
            />
          </div>

          <div>
            <Label htmlFor="annee">Année *</Label>
            <Input
              id="annee"
              type="number"
              min="1990"
              max={new Date().getFullYear() + 1}
              value={formData.annee}
              onChange={(e) => handleChange('annee', parseInt(e.target.value))}
              required
            />
          </div>

          <div>
            <Label htmlFor="kilometrage">Kilométrage *</Label>
            <Input
              id="kilometrage"
              type="number"
              min="0"
              value={formData.kilometrage}
              onChange={(e) => handleChange('kilometrage', parseInt(e.target.value))}
              placeholder="Ex: 50000"
              required
            />
          </div>

          <div>
            <Label htmlFor="type_vehicule">Type de Véhicule</Label>
            <Select value={formData.type_vehicule} onValueChange={(value) => handleChange('type_vehicule', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="voiture">Voiture</SelectItem>
                <SelectItem value="camionnette">Camionnette</SelectItem>
                <SelectItem value="fourgon">Fourgon</SelectItem>
                <SelectItem value="utilitaire">Utilitaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="couleur">Couleur</Label>
            <Input
              id="couleur"
              value={formData.couleur}
              onChange={(e) => handleChange('couleur', e.target.value)}
              placeholder="Ex: Blanc, Gris..."
            />
          </div>

          <div>
            <Label htmlFor="numero_chassis">Numéro de Chassis</Label>
            <Input
              id="numero_chassis"
              value={formData.numero_chassis}
              onChange={(e) => handleChange('numero_chassis', e.target.value)}
              placeholder="VIN"
            />
          </div>

          <div>
            <Label htmlFor="carburant">Carburant</Label>
            <Select value={formData.carburant} onValueChange={(value) => handleChange('carburant', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le carburant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="essence">Essence</SelectItem>
                <SelectItem value="electrique">Électrique</SelectItem>
                <SelectItem value="hybride">Hybride</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="puissance_fiscale">Puissance Fiscale (CV)</Label>
            <Input
              id="puissance_fiscale"
              type="number"
              min="0"
              value={formData.puissance_fiscale}
              onChange={(e) => handleChange('puissance_fiscale', parseInt(e.target.value) || 0)}
              placeholder="Ex: 7"
            />
          </div>

          <div>
            <Label htmlFor="assurance_expiration">Expiration Assurance</Label>
            <Input
              id="assurance_expiration"
              type="date"
              value={formData.assurance_expiration}
              onChange={(e) => handleChange('assurance_expiration', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="visite_technique_expiration">Expiration Visite Technique</Label>
            <Input
              id="visite_technique_expiration"
              type="date"
              value={formData.visite_technique_expiration}
              onChange={(e) => handleChange('visite_technique_expiration', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="en_service">En Service</SelectItem>
                <SelectItem value="en_maintenance">En Maintenance</SelectItem>
                <SelectItem value="hors_service">Hors Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Notes supplémentaires..."
            rows={3}
          />
        </div>

        {/* Section Documents PDF - Visible uniquement en mode édition */}
        {vehicule && (
          <div className="space-y-4 pt-4 border-t mt-4">
            <h3 className="text-base font-semibold flex items-center gap-2 text-gray-700">
              <FileText className="w-4 h-4" />
              Documents du Véhicule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PDF Assurance */}
              <div className="space-y-2">
                <Label className="text-sm">Assurance (PDF)</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-3 transition-all min-h-[100px] flex flex-col justify-center ${
                    assuranceDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 bg-gray-50/50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, setAssuranceDragOver)}
                  onDragLeave={(e) => handleDragLeave(e, setAssuranceDragOver)}
                  onDrop={handleAssuranceDrop}
                >
                  {/* Document existant */}
                  {existingAssurancePdf.url && !assurancePdf && (
                    <div className="flex items-center justify-between p-2 bg-blue-100 rounded border border-blue-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-blue-700 truncate">{existingAssurancePdf.filename}</span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPdfViewer(existingAssurancePdf.url)}
                          className="h-7 w-7 p-0 hover:bg-blue-200"
                          title="Visualiser"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument('assurance')}
                          className="h-7 w-7 p-0 hover:bg-red-100"
                          title="Supprimer"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Nouveau fichier sélectionné */}
                  {assurancePdf && (
                    <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-green-700 truncate">{assurancePdf.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAssurancePdf(null)}
                        className="h-7 w-7 p-0 hover:bg-red-100 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Zone d'upload */}
                  {!existingAssurancePdf.url && !assurancePdf && (
                    uploadingAssurance ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-4 h-full">
                        <Upload className={`w-8 h-8 mb-2 ${assuranceDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                        <span className="text-sm text-gray-500 text-center">
                          Glissez ou cliquez
                        </span>
                        <span className="text-xs text-gray-400 mt-1">PDF (max 10 Mo)</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleAssuranceFileChange}
                          className="hidden"
                        />
                      </label>
                    )
                  )}
                </div>
              </div>
              
              {/* PDF Carte Grise */}
              <div className="space-y-2">
                <Label className="text-sm">Carte Grise (PDF)</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-3 transition-all min-h-[100px] flex flex-col justify-center ${
                    carteGriseDragOver 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300 bg-gray-50/50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, setCarteGriseDragOver)}
                  onDragLeave={(e) => handleDragLeave(e, setCarteGriseDragOver)}
                  onDrop={handleCarteGriseDrop}
                >
                  {/* Document existant */}
                  {existingCarteGrisePdf.url && !carteGrisePdf && (
                    <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-green-700 truncate">{existingCarteGrisePdf.filename}</span>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPdfViewer(existingCarteGrisePdf.url)}
                          className="h-7 w-7 p-0 hover:bg-green-200"
                          title="Visualiser"
                        >
                          <Eye className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument('carte_grise')}
                          className="h-7 w-7 p-0 hover:bg-red-100"
                          title="Supprimer"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Nouveau fichier sélectionné */}
                  {carteGrisePdf && (
                    <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-green-700 truncate">{carteGrisePdf.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCarteGrisePdf(null)}
                        className="h-7 w-7 p-0 hover:bg-red-100 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Zone d'upload */}
                  {!existingCarteGrisePdf.url && !carteGrisePdf && (
                    uploadingCarteGrise ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer py-4 h-full">
                        <Upload className={`w-8 h-8 mb-2 ${carteGriseDragOver ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className="text-sm text-gray-500 text-center">
                          Glissez ou cliquez
                        </span>
                        <span className="text-xs text-gray-400 mt-1">PDF (max 10 Mo)</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleCarteGriseFileChange}
                          className="hidden"
                        />
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal visualisation PDF */}
        {showPdfViewer && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Visualisation du document</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPdfViewer(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 p-2">
                <iframe
                  src={showPdfViewer}
                  className="w-full h-full rounded border"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t bg-white sticky bottom-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            {vehicule ? 'Enregistrer les modifications' : 'Ajouter le véhicule'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
