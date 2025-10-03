"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, Plus, Edit, Trash2, Search } from "lucide-react"

// AffectationForm component
export function AffectationForm({ affectation, onSave, onCancel }: { 
  affectation: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    materiel_id: affectation?.materiel_id || '',
    employe_id: affectation?.employe_id || '',
    quantite_assignee: affectation?.quantite_assignee || '',
    date_affectation: affectation?.date_affectation || new Date().toISOString().slice(0, 16),
    commentaires: affectation?.commentaires || '',
    type_affectation: affectation?.type_affectation || 'permanent'
  })

  const [materielOptions, setMaterielOptions] = useState([])
  const [employeOptions, setEmployeOptions] = useState([])
  const [materielSearch, setMaterielSearch] = useState('')
  const [employeSearch, setEmployeSearch] = useState('')

  useEffect(() => {
    // Charger les options de matériel
    fetch('/api/materiel')
      .then(res => res.json())
      .then(data => setMaterielOptions(data.materiel || []))
      .catch(err => console.error('Erreur chargement matériel:', err))

    // Charger les options d'employés
    fetch('/api/employes')
      .then(res => res.json())
      .then(data => setEmployeOptions(data.employes || []))
      .catch(err => console.error('Erreur chargement employés:', err))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Filtrer les options basées sur la recherche
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
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {affectation ? 'Modifier l\'Affectation' : 'Nouvelle Affectation'}
        </DialogTitle>
        <DialogDescription>
          {affectation ? 'Modifiez les informations de l\'affectation' : 'Assignez du matériel à un employé'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="materiel_id">Matériel *</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un matériel..."
                  value={materielSearch}
                  onChange={(e) => setMaterielSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={formData.materiel_id} onValueChange={(value) => handleChange('materiel_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un matériel" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredMaterielOptions.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucun matériel trouvé
                    </div>
                  ) : (
                    filteredMaterielOptions.map((materiel: any) => (
                      <SelectItem key={materiel.id} value={materiel.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{materiel.nom_equipement}</span>
                          <span className="text-sm text-muted-foreground">
                            {materiel.type_materiel} - {materiel.marque} {materiel.modele} - Stock: {materiel.quantite}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="employe_id">Employé *</Label>
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
                  {filteredEmployeOptions.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Aucun employé trouvé
                    </div>
                  ) : (
                    filteredEmployeOptions.map((employe: any) => (
                      <SelectItem key={employe.id} value={employe.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{employe.nom} {employe.prenom}</span>
                          <span className="text-sm text-muted-foreground">
                            {employe.matricule} - {employe.niveau_acces}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantite_assignee">Quantité Assignée *</Label>
            <Input
              id="quantite_assignee"
              type="number"
              value={formData.quantite_assignee}
              onChange={(e) => handleChange('quantite_assignee', e.target.value)}
              placeholder="1"
              min="1"
              required
            />
          </div>
          <div>
            <Label htmlFor="type_affectation">Type d'Affectation *</Label>
            <Select value={formData.type_affectation} onValueChange={(value) => handleChange('type_affectation', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="temporaire">Temporaire</SelectItem>
                <SelectItem value="consommable">Consommable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="date_affectation">Date d'Affectation</Label>
          <Input
            id="date_affectation"
            type="datetime-local"
            value={formData.date_affectation}
            onChange={(e) => handleChange('date_affectation', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleChange('commentaires', e.target.value)}
            placeholder="Commentaires sur l'affectation..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {affectation ? 'Modifier' : 'Créer'} l'Affectation
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
