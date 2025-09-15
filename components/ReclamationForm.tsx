"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, CheckCircle, Plus, Edit, Trash2 } from "lucide-react"

// ReclamationForm component
export function ReclamationForm({ reclamation, employees, interventions, onSave, onCancel }: { 
  reclamation: any, 
  employees: any[], 
  interventions: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    numero_reclamation: reclamation?.numero_reclamation || '',
    client: reclamation?.client || '',
    type_reclamation: reclamation?.type_reclamation || '',
    description: reclamation?.description || '',
    employe_responsable: reclamation?.employe_responsable || '',
    intervention_concernee: reclamation?.intervention_concernee || '',
    priorite: reclamation?.priorite || 'moyenne',
    statut: reclamation?.statut || 'ouverte',
    date_creation: reclamation?.date_creation || new Date().toISOString().split('T')[0],
    deadline_calculated: reclamation?.deadline_calculated || '',
    deadline: reclamation?.deadline || '',
    resolution: reclamation?.resolution || '',
    date_resolution: reclamation?.date_resolution || '',
    commentaires: reclamation?.commentaires || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    let newFormData = { ...formData, [field]: value }
    
    // Calculate deadline based on type_reclamation
    if (field === 'type_reclamation') {
      const today = new Date()
      let deadlineDate = new Date(today)
      
      if (value === 'client') {
        deadlineDate.setDate(today.getDate() + 7) // 7 days for client
      } else if (value === 'controleur') {
        deadlineDate.setDate(today.getDate() + 14) // 14 days for controleur
      }
      
      newFormData.deadline_calculated = deadlineDate.toISOString().split('T')[0]
      newFormData.deadline = deadlineDate.toISOString().split('T')[0]
    }
    
    setFormData(newFormData)
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {reclamation ? 'Modifier la Réclamation' : 'Nouvelle Réclamation'}
        </DialogTitle>
        <DialogDescription>
          {reclamation ? 'Modifiez les informations de la réclamation' : 'Créez une nouvelle réclamation'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numero_reclamation">Numéro de Réclamation *</Label>
            <Input
              id="numero_reclamation"
              value={formData.numero_reclamation}
              onChange={(e) => handleChange('numero_reclamation', e.target.value)}
              placeholder="Ex: REC-2024-001"
              required
            />
          </div>
          <div>
            <Label htmlFor="client">Client *</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => handleChange('client', e.target.value)}
              placeholder="Nom du client"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type_reclamation">Type de Réclamation *</Label>
            <Select value={formData.type_reclamation} onValueChange={(value) => handleChange('type_reclamation', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client (7 jours)</SelectItem>
                <SelectItem value="controleur">Contrôleur (14 jours)</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priorite">Priorité *</Label>
            <Select value={formData.priorite} onValueChange={(value) => handleChange('priorite', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez la réclamation en détail..."
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employe_responsable">Employé Responsable</Label>
            <Select value={formData.employe_responsable} onValueChange={(value) => handleChange('employe_responsable', value)}>
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
            <Label htmlFor="intervention_concernee">Intervention Concernée</Label>
            <Select value={formData.intervention_concernee} onValueChange={(value) => handleChange('intervention_concernee', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une intervention" />
              </SelectTrigger>
              <SelectContent>
                {interventions.map((inter) => (
                  <SelectItem key={inter.id} value={inter.id.toString()}>
                    {inter.num_inter} - {inter.client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <Label htmlFor="date_creation">Date de Création *</Label>
            <Input
              id="date_creation"
              type="date"
              value={formData.date_creation}
              onChange={(e) => handleChange('date_creation', e.target.value)}
              required
            />
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
                {formData.type_reclamation === 'client' ? '7 jours' : '14 jours'} pour traitement
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="resolution">Résolution</Label>
          <Textarea
            id="resolution"
            value={formData.resolution}
            onChange={(e) => handleChange('resolution', e.target.value)}
            placeholder="Décrivez la résolution de la réclamation..."
            rows={3}
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

        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleChange('commentaires', e.target.value)}
            placeholder="Commentaires supplémentaires..."
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {reclamation ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
