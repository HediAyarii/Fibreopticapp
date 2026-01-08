"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RefreshCw, CheckCircle, Plus, Edit, Trash2, Upload, X, Image as ImageIcon } from "lucide-react"

// ReclamationForm component
export function ReclamationForm({ reclamation, employees, interventions, onSave, onCancel }: { 
  reclamation: any, 
  employees: any[], 
  interventions: any[], 
  onSave: (data: any, photos?: File[]) => void, 
  onCancel: () => void 
}) {
  const formatDateForInput = (date: any) => {
    if (!date) return ''
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      return d.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const [formData, setFormData] = useState({
    numero_reclamation: reclamation?.numero_reclamation || '',
    nom_client: reclamation?.nom_client || reclamation?.client || '',
    type_reclamation: reclamation?.type_reclamation || '',
    description_probleme: reclamation?.description_probleme || reclamation?.description || '',
    employe_id: reclamation?.employe_id || reclamation?.employe_responsable || '',
    intervention_id: reclamation?.intervention_id || reclamation?.intervention_concernee || '',
    priorite: reclamation?.priorite || 'normale',
    statut: reclamation?.statut || 'ouverte',
    date_reclamation: formatDateForInput(reclamation?.date_reclamation || reclamation?.date_creation) || new Date().toISOString().split('T')[0],
    telephone_client: reclamation?.telephone_client || '',
    email_client: reclamation?.email_client || '',
    adresse_client: reclamation?.adresse_client || '',
    description_solution: reclamation?.description_solution || reclamation?.resolution || '',
    date_resolution: formatDateForInput(reclamation?.date_resolution) || '',
    commentaires_internes: reclamation?.commentaires_internes || reclamation?.commentaires || '',
    deadline_calculated: reclamation?.deadline_calculated || '',
    deadline: reclamation?.deadline || ''
  })

  const [selectedIntervention, setSelectedIntervention] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [interventionDisplayValue, setInterventionDisplayValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // État pour les photos uploadées
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<any[]>(reclamation?.photos || [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData, uploadedPhotos)
  }

  // Gestion des photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newPhotos = Array.from(files).filter(file => {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          alert(`Le fichier ${file.name} n'est pas une image valide`)
          return false
        }
        // Limiter la taille à 10MB
        if (file.size > 10 * 1024 * 1024) {
          alert(`Le fichier ${file.name} est trop volumineux (max 10MB)`)
          return false
        }
        return true
      })
      setUploadedPhotos(prev => [...prev, ...newPhotos])
    }
    // Reset l'input pour permettre de re-sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = (photoId: number) => {
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const handleChange = (field: string, value: any) => {
    let newFormData = { ...formData, [field]: value }
    
    // Calculate deadline based on type_reclamation
    if (field === 'type_reclamation') {
      const today = new Date()
      let deadlineDate = new Date(today)
      
      if (value === 'client') {
        deadlineDate.setDate(today.getDate() + 5) // 5 days for client
      } else if (value === 'controleur') {
        deadlineDate.setDate(today.getDate() + 7) // 7 days for controleur
      }
      
      newFormData.deadline_calculated = deadlineDate.toISOString().split('T')[0]
      newFormData.deadline = deadlineDate.toISOString().split('T')[0]
    }
    
    setFormData(newFormData)
  }

  const handleInterventionSelect = (intervention: any) => {
    setSelectedIntervention(intervention)
    setInterventionDisplayValue(intervention.num_inter) // Afficher le numéro d'intervention
    setFormData(prev => ({
      ...prev,
      intervention_id: intervention.id.toString(), // Stocker l'ID pour la base de données
      nom_client: intervention.client // Auto-fill client name
    }))
    setShowDropdown(false)
  }

  const searchInterventions = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/interventions/search?q=${encodeURIComponent(searchTerm)}&limit=10`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.interventions)
        setShowDropdown(data.interventions.length > 0)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'interventions:', error)
      setSearchResults([])
      setShowDropdown(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInterventionInputChange = (value: string) => {
    setInterventionDisplayValue(value) // Mettre à jour la valeur d'affichage
    
    // Si on efface le champ, réinitialiser la sélection
    if (!value) {
      setSelectedIntervention(null)
      setSearchResults([])
      setShowDropdown(false)
      setFormData(prev => ({ ...prev, intervention_id: '' }))
      return
    }

    // Si l'utilisateur tape quelque chose de différent de l'intervention sélectionnée
    if (selectedIntervention && value !== selectedIntervention.num_inter) {
      setSelectedIntervention(null)
      setFormData(prev => ({ ...prev, intervention_id: value }))
    }

    // Rechercher les interventions avec un délai pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      searchInterventions(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  // Fermer la liste déroulante quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Charger les détails de l'intervention lors de l'édition
  useEffect(() => {
    const loadInterventionDetails = async () => {
      if (reclamation?.intervention_id && !selectedIntervention) {
        // Si on a déjà le numéro d'intervention dans les données, l'utiliser directement
        if (reclamation.numero_intervention) {
          setInterventionDisplayValue(reclamation.numero_intervention)
          // Optionnellement, charger les détails complets de l'intervention
          try {
            const response = await fetch(`/api/interventions/search?q=${reclamation.numero_intervention}&limit=1`)
            const data = await response.json()
            
            if (data.success && data.interventions && data.interventions.length > 0) {
              setSelectedIntervention(data.interventions[0])
            }
          } catch (error) {
            console.error('Erreur lors du chargement de l\'intervention:', error)
          }
        } else {
          // Sinon, rechercher par ID d'intervention
          try {
            const response = await fetch(`/api/interventions/search?q=${reclamation.intervention_id}&limit=1`)
            const data = await response.json()
            
            if (data.success && data.interventions && data.interventions.length > 0) {
              const intervention = data.interventions[0]
              setSelectedIntervention(intervention)
              setInterventionDisplayValue(intervention.num_inter) // Afficher le numéro, pas l'ID
            } else {
              // Si pas trouvé par recherche, afficher l'ID en attendant
              setInterventionDisplayValue(reclamation.intervention_id)
            }
          } catch (error) {
            console.error('Erreur lors du chargement de l\'intervention:', error)
            setInterventionDisplayValue(reclamation.intervention_id)
          }
        }
      }
    }

    loadInterventionDetails()
  }, [reclamation?.intervention_id, reclamation?.numero_intervention])

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numero_reclamation">Numéro de Réclamation</Label>
            <Input
              id="numero_reclamation"
              value={formData.numero_reclamation}
              onChange={(e) => handleChange('numero_reclamation', e.target.value)}
              placeholder="Laissé vide pour génération automatique"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laissez vide pour génération automatique (REC-YYYY-NNNN)
            </p>
          </div>
          <div>
            <Label htmlFor="type_reclamation">Type de Réclamation *</Label>
            <Select value={formData.type_reclamation} onValueChange={(value) => handleChange('type_reclamation', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client (5 jours)</SelectItem>
                <SelectItem value="controleur">Contrôleur (7 jours)</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description_probleme">Description du Problème *</Label>
          <Textarea
            id="description_probleme"
            value={formData.description_probleme}
            onChange={(e) => handleChange('description_probleme', e.target.value)}
            placeholder="Décrivez la réclamation en détail..."
            rows={4}
            required
          />
        </div>

        <div>
          <Label htmlFor="intervention_id">Recherche par Numéro d'Intervention</Label>
          <div className="space-y-2 relative" ref={dropdownRef}>
            <div className="relative">
              <Input
                value={interventionDisplayValue}
                onChange={(e) => handleInterventionInputChange(e.target.value)}
                placeholder="Entrez le numéro d'intervention..."
                className="pr-8"
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* Liste déroulante des résultats */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((intervention) => (
                  <div
                    key={intervention.id}
                    onClick={() => handleInterventionSelect(intervention)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {intervention.num_inter}
                        </div>
                        <div className="text-xs text-gray-600">
                          Client: {intervention.client}
                        </div>
                        <div className="text-xs text-gray-500">
                          Technicien: {intervention.prenom_technicien} {intervention.nom_technicien}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        <div>{new Date(intervention.date_rdv).toLocaleDateString('fr-FR')}</div>
                        <div className="capitalize">{intervention.statut}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Message si aucune intervention trouvée */}
            {showDropdown && searchResults.length === 0 && !isSearching && formData.intervention_id && formData.intervention_id.length >= 2 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg p-3">
                <div className="text-sm text-gray-500 text-center">
                  Aucune intervention trouvée pour "{formData.intervention_id}"
                </div>
              </div>
            )}
          </div>
          
          {/* Intervention sélectionnée */}
          {selectedIntervention && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-2">
              <div className="text-sm font-medium text-blue-800">
                Intervention sélectionnée: {selectedIntervention.num_inter}
              </div>
              <div className="text-xs text-blue-600">
                Client: {selectedIntervention.client} | Technicien: {selectedIntervention.prenom_technicien} {selectedIntervention.nom_technicien}
              </div>
              <div className="text-xs text-blue-500">
                Date RDV: {new Date(selectedIntervention.date_rdv).toLocaleDateString('fr-FR')} | Statut: {selectedIntervention.statut}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employe_id">Employé Responsable</Label>
            <Select value={formData.employe_id?.toString()} onValueChange={(value) => handleChange('employe_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.prenom} {emp.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nom_client">Client *</Label>
            <Input
              id="nom_client"
              value={formData.nom_client}
              onChange={(e) => handleChange('nom_client', e.target.value)}
              placeholder="Nom du client"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priorite">Priorité *</Label>
            <Select value={formData.priorite} onValueChange={(value) => handleChange('priorite', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="statut">Statut *</Label>
            <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ouverte">Ouverte</SelectItem>
                <SelectItem value="en_cours">En Cours</SelectItem>
                <SelectItem value="resolue">Résolue</SelectItem>
                <SelectItem value="fermee">Fermée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.deadline_calculated && (
          <div>
            <Label>Délai de Traitement</Label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm font-medium text-blue-800">
                Échéance: {formData.deadline_calculated}
              </div>
              <div className="text-xs text-blue-600">
                {formData.type_reclamation === 'client' ? '5 jours' : '7 jours'} pour traitement
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="description_solution">Résolution</Label>
          <Textarea
            id="description_solution"
            value={formData.description_solution}
            onChange={(e) => handleChange('description_solution', e.target.value)}
            placeholder="Décrivez la résolution de la réclamation..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date_reclamation">Date de Création *</Label>
            <Input
              id="date_reclamation"
              type="date"
              value={formData.date_reclamation}
              onChange={(e) => handleChange('date_reclamation', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="date_resolution">Date de Résolution</Label>
            <Input
              id="date_resolution"
              type="date"
              value={formData.date_resolution}
              onChange={(e) => handleChange('date_resolution', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="commentaires_internes">Commentaires</Label>
          <Textarea
            id="commentaires_internes"
            value={formData.commentaires_internes}
            onChange={(e) => handleChange('commentaires_internes', e.target.value)}
            placeholder="Commentaires supplémentaires..."
            rows={2}
          />
        </div>

        {/* Section Upload Photos */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Photos Justificatives
          </Label>
          <p className="text-xs text-gray-500">
            Ajoutez des photos pour accompagner la réclamation (formats: JPG, PNG, GIF - max 10MB par fichier)
          </p>
          
          {/* Photos existantes (lors de l'édition) */}
          {existingPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 font-medium">Photos déjà enregistrées:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {existingPhotos.map((photo: any) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.name || 'Photo réclamation'}
                      className="w-full h-20 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(photo.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelles photos à uploader */}
          {uploadedPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 font-medium">Nouvelles photos à ajouter:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {uploadedPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton d'ajout de photos */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Ajouter des photos
            </Button>
            {uploadedPhotos.length > 0 && (
              <span className="text-sm text-gray-500">
                {uploadedPhotos.length} nouvelle(s) photo(s)
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t sticky bottom-0 bg-white">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {reclamation ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
  )
}
