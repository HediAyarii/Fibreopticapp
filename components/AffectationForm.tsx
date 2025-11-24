"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"

interface MaterialSelection {
  materiel_id: string
  nom_equipement: string
  type_materiel: string
  depot: string
  quantite_disponible: number
  quantite_assignee: number
}

interface AffectationFormProps {
  affectation: any
  onSave: (data: any) => void
  onCancel: () => void
}

export function AffectationForm({ affectation, onSave, onCancel }: AffectationFormProps) {
  const [formData, setFormData] = useState({
    employe_id: affectation?.employe_id || '',
    date_affectation: affectation?.date_affectation || new Date().toISOString().slice(0, 16),
    commentaires: affectation?.commentaires || '',
    type_affectation: affectation?.type_affectation || 'permanent'
  })

  const [selectedMaterials, setSelectedMaterials] = useState<MaterialSelection[]>(
    affectation ? [{
      materiel_id: affectation.materiel_id,
      nom_equipement: affectation.nom_equipement || '',
      type_materiel: affectation.type_materiel || '',
      depot: affectation.depot || '',
      quantite_disponible: affectation.quantite_disponible || 0,
      quantite_assignee: affectation.quantite_assignee || 1
    }] : []
  )
  const [materielOptions, setMaterielOptions] = useState<any[]>([])
  const [employeOptions, setEmployeOptions] = useState<any[]>([])
  const [materielSearch, setMaterielSearch] = useState('')
  const [employeSearch, setEmployeSearch] = useState('')
  const [selectedDepot, setSelectedDepot] = useState('ALL')

  useEffect(() => {
    const params = selectedDepot !== 'ALL' ? `?depot=${encodeURIComponent(selectedDepot)}` : ''
    fetch(`/api/materiel${params}`)
      .then(res => res.json())
      .then(data => setMaterielOptions(data.materiel || []))
      .catch(err => console.error('Erreur chargement matériel:', err))

    fetch('/api/employes')
      .then(res => res.json())
      .then(data => setEmployeOptions(data.employes || []))
      .catch(err => console.error('Erreur chargement employés:', err))
  }, [selectedDepot])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employe_id) {
      alert('Veuillez sélectionner un employé')
      return
    }
    if (selectedMaterials.length === 0) {
      alert('Veuillez sélectionner au moins un matériel')
      return
    }

    // Si c'est une modification (affectation existe)
    if (affectation) {
      const singleAffectation = {
        materiel_id: selectedMaterials[0].materiel_id,
        employe_id: formData.employe_id,
        quantite_assignee: selectedMaterials[0].quantite_assignee,
        date_affectation: formData.date_affectation,
        type_affectation: formData.type_affectation,
        commentaires: formData.commentaires
      }
      onSave(singleAffectation)
      return
    }

    // Si un seul matériel sélectionné = affectation simple
    if (selectedMaterials.length === 1) {
      const singleAffectation = {
        materiel_id: selectedMaterials[0].materiel_id,
        employe_id: formData.employe_id,
        quantite_assignee: selectedMaterials[0].quantite_assignee,
        date_affectation: formData.date_affectation,
        type_affectation: formData.type_affectation,
        commentaires: formData.commentaires
      }
      onSave(singleAffectation)
    } else {
      // Plusieurs matériels = affectation multiple
      const affectations = selectedMaterials.map(material => ({
        employe_id: formData.employe_id,
        materiel_id: material.materiel_id,
        quantite_assignee: material.quantite_assignee,
        date_affectation: formData.date_affectation,
        type_affectation: formData.type_affectation,
        commentaires: formData.commentaires
      }))

      onSave({ multiple: true, affectations })
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addMaterial = (materielId: string) => {
    const materiel = materielOptions.find((m: any) => m.id.toString() === materielId)
    if (!materiel) return

    if (selectedMaterials.some(m => m.materiel_id === materielId)) {
      alert('Ce matériel est déjà sélectionné')
      return
    }

    const newMaterial: MaterialSelection = {
      materiel_id: materielId,
      nom_equipement: materiel.nom_equipement,
      type_materiel: materiel.type_materiel,
      depot: materiel.depot,
      quantite_disponible: materiel.quantite,
      quantite_assignee: 1
    }

    setSelectedMaterials(prev => [...prev, newMaterial])
  }

  const removeMaterial = (materielId: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.materiel_id !== materielId))
  }

  const updateQuantity = (materielId: string, quantity: number) => {
    setSelectedMaterials(prev => 
      prev.map(m => 
        m.materiel_id === materielId 
          ? { ...m, quantite_assignee: Math.max(1, Math.min(quantity, m.quantite_disponible)) }
          : m
      )
    )
  }

  const filteredMaterielOptions = materielOptions.filter((materiel: any) => {
    if (!materielSearch) return true
    const searchTerm = materielSearch.toLowerCase()
    return (
      materiel.nom_equipement?.toLowerCase().includes(searchTerm) ||
      materiel.type_materiel?.toLowerCase().includes(searchTerm) ||
      materiel.marque?.toLowerCase().includes(searchTerm) ||
      materiel.modele?.toLowerCase().includes(searchTerm)
    )
  })

  const filteredEmployeOptions = employeOptions.filter((employe: any) => {
    if (!employeSearch) return true
    const searchTerm = employeSearch.toLowerCase()
    return (
      employe.nom?.toLowerCase().includes(searchTerm) ||
      employe.prenom?.toLowerCase().includes(searchTerm) ||
      employe.matricule?.toLowerCase().includes(searchTerm)
    )
  })

  return (
    <DialogContent 
      className="max-w-4xl p-0 gap-0 flex flex-col"
      style={{ maxHeight: '90vh', height: '90vh' }}
    >
      <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
        <DialogTitle>
          {affectation ? 'Modifier l\'Affectation' : 'Nouvelle Affectation'}
        </DialogTitle>
        <DialogDescription>
          {affectation ? 'Modifiez les informations de l\'affectation' : 'Sélectionnez un ou plusieurs matériels pour l\'employé'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
        <div>
          <Label>Filtrer par Dépôt</Label>
          <Select value={selectedDepot} onValueChange={setSelectedDepot}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les dépôts</SelectItem>
              <SelectItem value="AXECOM">AXECOM</SelectItem>
              <SelectItem value="ERT">ERT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Employé *</Label>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé..."
                value={employeSearch}
                onChange={(e) => setEmployeSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={formData.employe_id} onValueChange={(value) => handleChange('employe_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un employé" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredEmployeOptions.map((employe: any) => (
                  <SelectItem key={employe.id} value={employe.id.toString()}>
                    {employe.nom} {employe.prenom} - {employe.matricule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Matériels * {!affectation && selectedMaterials.length > 0 && `(${selectedMaterials.length} sélectionné${selectedMaterials.length > 1 ? 's' : ''})`}</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un matériel..."
              value={materielSearch}
              onChange={(e) => setMaterielSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {!affectation && (
            <ScrollArea className="h-40 border rounded-md p-2">
              {filteredMaterielOptions.map((materiel: any) => (
                <button
                  key={materiel.id}
                  type="button"
                  onClick={() => addMaterial(materiel.id.toString())}
                  disabled={selectedMaterials.some(m => m.materiel_id === materiel.id.toString()) || materiel.quantite <= 0}
                  className="w-full text-left p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{materiel.nom_equipement}</div>
                      <div className="text-xs text-muted-foreground">{materiel.type_materiel}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{materiel.depot}</Badge>
                      <Badge variant={materiel.quantite > 0 ? "default" : "destructive"}>
                        {materiel.quantite}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          )}

          {selectedMaterials.length > 0 && (
            <div className="mt-4">
              <div className="space-y-2 border rounded-md p-2 max-h-60 overflow-y-auto">
                {selectedMaterials.map((material) => (
                  <div key={material.materiel_id} className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{material.nom_equipement}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{material.type_materiel}</span>
                        <Badge variant="outline" className="text-xs">{material.depot}</Badge>
                        <span className="text-xs">Stock: {material.quantite_disponible}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max={material.quantite_disponible}
                        value={material.quantite_assignee}
                        onChange={(e) => updateQuantity(material.materiel_id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8"
                      />
                      {!affectation && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterial(material.materiel_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type *</Label>
            <Select value={formData.type_affectation} onValueChange={(value) => handleChange('type_affectation', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="temporaire">Temporaire</SelectItem>
                <SelectItem value="intervention">Intervention</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input
              type="datetime-local"
              value={formData.date_affectation}
              onChange={(e) => handleChange('date_affectation', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Commentaires</Label>
          <Textarea
            value={formData.commentaires}
            onChange={(e) => handleChange('commentaires', e.target.value)}
            rows={2}
          />
        </div>
        </div>

        <DialogFooter className="px-6 py-4 shrink-0 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {affectation 
              ? 'Modifier' 
              : selectedMaterials.length > 1 
                ? `Créer ${selectedMaterials.length} Affectations`
                : 'Créer Affectation'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
