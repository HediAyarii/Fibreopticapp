"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, CheckCircle, Plus, Edit, Trash2, Search } from "lucide-react"

// AffectationForm component - Importé depuis AffectationForm.tsx
export { AffectationForm } from "./AffectationForm"

function OldAffectationForm({ affectation, employees, materials, onSave, onCancel }: { 
  affectation: any, 
  employees: any[], 
  materials: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    employe_id: affectation?.employe_id || '',
    materiel_id: affectation?.materiel_id || '',
    date_affectation: affectation?.date_affectation || new Date().toISOString().split('T')[0],
    quantite_affectee: affectation?.quantite_affectee || '1',
    motif: affectation?.motif || '',
    statut: affectation?.statut || 'active',
    date_retour: affectation?.date_retour || '',
    commentaires: affectation?.commentaires || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {affectation ? 'Modifier l\'Affectation' : 'Nouvelle Affectation'}
        </DialogTitle>
        <DialogDescription>
          {affectation ? 'Modifiez l\'affectation de matériel' : 'Affectez du matériel à un employé'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employe_id">Employé *</Label>
            <Select value={formData.employe_id} onValueChange={(value) => handleChange('employe_id', value)}>
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
            <Label htmlFor="materiel_id">Matériel *</Label>
            <Select value={formData.materiel_id} onValueChange={(value) => handleChange('materiel_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un matériel" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((mat) => (
                  <SelectItem key={mat.id} value={mat.id.toString()}>
                    {mat.nom} ({mat.quantite} disponibles)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date_affectation">Date d'Affectation *</Label>
            <Input
              id="date_affectation"
              type="date"
              value={formData.date_affectation}
              onChange={(e) => handleChange('date_affectation', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="quantite_affectee">Quantité Affectée *</Label>
            <Input
              id="quantite_affectee"
              type="number"
              value={formData.quantite_affectee}
              onChange={(e) => handleChange('quantite_affectee', e.target.value)}
              placeholder="1"
              min="1"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="motif">Motif d'Affectation *</Label>
          <Input
            id="motif"
            value={formData.motif}
            onChange={(e) => handleChange('motif', e.target.value)}
            placeholder="Ex: Intervention client XYZ"
            required
          />
        </div>

        <div>
          <Label htmlFor="statut">Statut *</Label>
          <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="retournee">Retournée</SelectItem>
              <SelectItem value="perdue">Perdue</SelectItem>
              <SelectItem value="casse">Cassée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date_retour">Date de Retour</Label>
          <Input
            id="date_retour"
            type="date"
            value={formData.date_retour}
            onChange={(e) => handleChange('date_retour', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleChange('commentaires', e.target.value)}
            placeholder="Commentaires supplémentaires..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {affectation ? 'Modifier' : 'Affecter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// InterventionSearch component
export function InterventionSearch({ value, onSelect, placeholder, interventions: allInterventions }: {
  value: string
  onSelect: (intervention: any) => void
  placeholder?: string
  interventions: any[]
}) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [filteredInterventions, setFilteredInterventions] = useState<any[]>([])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = allInterventions.filter(intervention =>
        intervention.num_inter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intervention.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${intervention.nom_technicien} ${intervention.prenom_technicien}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredInterventions(filtered.slice(0, 10))
    } else {
      setFilteredInterventions([])
    }
  }, [searchTerm, allInterventions])

  const handleSelect = (intervention: any) => {
    setSearchTerm(intervention.num_inter)
    onSelect(intervention)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "Rechercher une intervention..."}
          className="pl-10"
        />
      </div>
      
      {isOpen && filteredInterventions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredInterventions.map((intervention) => (
            <div
              key={intervention.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(intervention)}
            >
              <div className="font-medium text-sm">{intervention.num_inter}</div>
              <div className="text-xs text-gray-500">
                {intervention.client} - {intervention.prenom_technicien} {intervention.nom_technicien}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isOpen && searchTerm.length >= 2 && filteredInterventions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="px-4 py-2 text-sm text-gray-500">
            Aucune intervention trouvée
          </div>
        </div>
      )}
    </div>
  )
}
