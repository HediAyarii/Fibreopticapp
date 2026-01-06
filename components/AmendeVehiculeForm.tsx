"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Upload, FileText, X } from "lucide-react"

interface AmendeVehiculeFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: FormData) => Promise<void>
  vehicules: any[]
  employes: any[]
  assignationsVehicules?: any[]
  editingAmende?: any
}

const TYPES_INFRACTION = [
  "Excès de vitesse",
  "Stationnement interdit",
  "Feu rouge grillé",
  "Stop non respecté",
  "Téléphone au volant",
  "Non-port de ceinture",
  "Défaut de contrôle technique",
  "Défaut d'assurance",
  "Défaut de permis",
  "Conduite en état d'ivresse",
  "Péage",
  "Autre"
]

export function AmendeVehiculeForm({
  isOpen,
  onClose,
  onSave,
  vehicules,
  employes,
  assignationsVehicules = [],
  editingAmende
}: AmendeVehiculeFormProps) {
  const [vehiculeId, setVehiculeId] = useState("")
  const [employeId, setEmployeId] = useState("")
  const [dateAmende, setDateAmende] = useState("")
  const [dateInfraction, setDateInfraction] = useState("")
  const [numeroAmende, setNumeroAmende] = useState("")
  const [typeInfraction, setTypeInfraction] = useState("")
  const [lieuInfraction, setLieuInfraction] = useState("")
  const [montant, setMontant] = useState("")
  const [description, setDescription] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [existingPdfUrl, setExistingPdfUrl] = useState("")
  const [existingPdfFilename, setExistingPdfFilename] = useState("")
  const [loading, setLoading] = useState(false)
  const [pdfDragOver, setPdfDragOver] = useState(false)

  // Synchronisation véhicule → employé
  const handleVehiculeChange = (newVehiculeId: string) => {
    setVehiculeId(newVehiculeId)
    
    console.log('🚗 Véhicule sélectionné:', newVehiculeId)
    console.log('📋 Assignations disponibles:', assignationsVehicules)
    
    // Chercher l'assignation active pour ce véhicule
    const assignation = assignationsVehicules.find(
      (a: any) => {
        const vehiculeMatch = a.vehicule_id?.toString() === newVehiculeId
        const isActive = a.statut === 'active' || a.statut === 'actif' || a.statut === 'en_cours' || !a.date_fin
        console.log(`  - Assignation ${a.id}: vehicule_id=${a.vehicule_id}, statut=${a.statut}, match=${vehiculeMatch && isActive}`)
        return vehiculeMatch && isActive
      }
    )
    
    console.log('✅ Assignation trouvée:', assignation)
    
    if (assignation && assignation.employe_id) {
      setEmployeId(assignation.employe_id.toString())
    } else {
      // Pas d'assignation trouvée, réinitialiser l'employé
      setEmployeId("none")
    }
  }

  // Synchronisation employé → véhicule
  const handleEmployeChange = (newEmployeId: string) => {
    setEmployeId(newEmployeId)
    
    if (newEmployeId && newEmployeId !== 'none') {
      // Chercher l'assignation active pour cet employé
      const assignation = assignationsVehicules.find(
        (a: any) => a.employe_id?.toString() === newEmployeId && 
          (a.statut === 'active' || a.statut === 'actif' || a.statut === 'en_cours' || !a.date_fin)
      )
      
      if (assignation && assignation.vehicule_id) {
        setVehiculeId(assignation.vehicule_id.toString())
      }
    }
  }

  useEffect(() => {
    if (editingAmende) {
      setVehiculeId(editingAmende.vehicule_id?.toString() || "")
      setEmployeId(editingAmende.employe_id?.toString() || "none")
      setDateAmende(editingAmende.date_amende ? editingAmende.date_amende.split('T')[0] : "")
      setDateInfraction(editingAmende.date_infraction ? editingAmende.date_infraction.split('T')[0] : "")
      setNumeroAmende(editingAmende.numero_amende || "")
      setTypeInfraction(editingAmende.type_infraction || "")
      setLieuInfraction(editingAmende.lieu_infraction || "")
      setMontant(editingAmende.montant?.toString() || "")
      setDescription(editingAmende.description || "")
      setExistingPdfUrl(editingAmende.pdf_url || "")
      setExistingPdfFilename(editingAmende.pdf_filename || "")
    } else {
      resetForm()
    }
  }, [editingAmende, isOpen])

  const resetForm = () => {
    setVehiculeId("")
    setEmployeId("none")
    setDateAmende("")
    setDateInfraction("")
    setNumeroAmende("")
    setTypeInfraction("")
    setLieuInfraction("")
    setMontant("")
    setDescription("")
    setPdfFile(null)
    setExistingPdfUrl("")
    setExistingPdfFilename("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetPdf(file)
    }
  }

  const validateAndSetPdf = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Veuillez sélectionner un fichier PDF')
      return
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB max
      alert('Le fichier ne doit pas dépasser 10 Mo')
      return
    }
    setPdfFile(file)
  }

  const handlePdfDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPdfDragOver(true)
  }

  const handlePdfDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPdfDragOver(false)
  }

  const handlePdfDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPdfDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndSetPdf(files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!vehiculeId || !dateAmende || !typeInfraction || !montant) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      
      if (editingAmende) {
        formData.append('id', editingAmende.id.toString())
      }
      
      formData.append('vehicule_id', vehiculeId)
      if (employeId && employeId !== 'none') formData.append('employe_id', employeId)
      formData.append('date_amende', dateAmende)
      if (dateInfraction) formData.append('date_infraction', dateInfraction)
      if (numeroAmende) formData.append('numero_amende', numeroAmende)
      formData.append('type_infraction', typeInfraction)
      if (lieuInfraction) formData.append('lieu_infraction', lieuInfraction)
      formData.append('montant', montant)
      if (description) formData.append('description', description)
      
      // PDF
      if (pdfFile) {
        formData.append('pdf_file', pdfFile)
      } else if (existingPdfUrl) {
        formData.append('existing_pdf_url', existingPdfUrl)
        formData.append('existing_pdf_filename', existingPdfFilename)
      }

      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {editingAmende ? "Modifier l'amende" : "Nouvelle amende"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Véhicule */}
            <div className="space-y-2">
              <Label htmlFor="vehicule">Véhicule *</Label>
              <Select value={vehiculeId} onValueChange={handleVehiculeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {vehicules.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.matricule} - {v.marque} {v.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employé responsable */}
            <div className="space-y-2">
              <Label htmlFor="employe">Employé responsable</Label>
              <Select value={employeId} onValueChange={handleEmployeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {employes.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.nom} {e.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date de l'amende */}
            <div className="space-y-2">
              <Label htmlFor="dateAmende">Date de l'amende *</Label>
              <Input
                type="date"
                id="dateAmende"
                value={dateAmende}
                onChange={(e) => setDateAmende(e.target.value)}
                required
              />
            </div>

            {/* Date de l'infraction */}
            <div className="space-y-2">
              <Label htmlFor="dateInfraction">Date de l'infraction</Label>
              <Input
                type="date"
                id="dateInfraction"
                value={dateInfraction}
                onChange={(e) => setDateInfraction(e.target.value)}
              />
            </div>

            {/* Numéro d'amende */}
            <div className="space-y-2">
              <Label htmlFor="numeroAmende">Numéro d'amende</Label>
              <Input
                id="numeroAmende"
                value={numeroAmende}
                onChange={(e) => setNumeroAmende(e.target.value)}
                placeholder="Ex: AM-2024-12345"
              />
            </div>

            {/* Type d'infraction */}
            <div className="space-y-2">
              <Label htmlFor="typeInfraction">Type d'infraction *</Label>
              <Select value={typeInfraction} onValueChange={setTypeInfraction}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_INFRACTION.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lieu de l'infraction */}
            <div className="space-y-2">
              <Label htmlFor="lieuInfraction">Lieu de l'infraction</Label>
              <Input
                id="lieuInfraction"
                value={lieuInfraction}
                onChange={(e) => setLieuInfraction(e.target.value)}
                placeholder="Ex: Paris, Avenue des Champs-Élysées"
              />
            </div>

            {/* Montant */}
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (€) *</Label>
              <Input
                type="number"
                id="montant"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires sur l'amende..."
              rows={3}
            />
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label>Document PDF de l'amende</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                pdfDragOver 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handlePdfDragOver}
              onDragLeave={handlePdfDragLeave}
              onDrop={handlePdfDrop}
            >
              {existingPdfUrl && !pdfFile && (
                <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">{existingPdfFilename}</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={existingPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      Voir
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setExistingPdfUrl("")
                        setExistingPdfFilename("")
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {pdfFile && (
                <div className="flex items-center justify-between mb-3 p-2 bg-green-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    <span className="text-sm">{pdfFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <label className="flex flex-col items-center cursor-pointer">
                <Upload className={`w-8 h-8 mb-2 transition-colors ${pdfDragOver ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${pdfDragOver ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                  {pdfDragOver ? 'Déposez le fichier ici' : 'Glissez-déposez ou cliquez pour uploader un PDF'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Max 10 Mo
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          </div>

          {/* Actions - Toujours visibles en bas */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-500 hover:bg-red-600">
              {loading ? "Enregistrement..." : (editingAmende ? "Modifier" : "Enregistrer")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
