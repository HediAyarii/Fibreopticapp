"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AssignationVehiculeForm({ 
  assignation, 
  vehicules,
  employees,
  onSave, 
  onCancel 
}: { 
  assignation: any,
  vehicules: any[],
  employees: any[],
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    vehicule_id: assignation?.vehicule_id || '',
    employe_id: assignation?.employe_id || '',
    date_assignation: assignation?.date_assignation || new Date().toISOString().split('T')[0],
    statut: assignation?.statut || 'active',
    commentaires: assignation?.commentaires || ''
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
          {assignation ? 'Modifier l\'Assignation' : 'Nouvelle Assignation de Véhicule'}
        </DialogTitle>
        <DialogDescription>
          {assignation ? 'Modifiez l\'assignation du véhicule' : 'Assignez un véhicule à un technicien'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="vehicule_id">Véhicule *</Label>
            <Select value={formData.vehicule_id.toString()} onValueChange={(value) => handleChange('vehicule_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un véhicule" />
              </SelectTrigger>
              <SelectContent>
                {vehicules.filter(v => v.statut === 'disponible' || v.id === assignation?.vehicule_id).map((vehicule) => (
                  <SelectItem key={vehicule.id} value={vehicule.id.toString()}>
                    {vehicule.matricule} - {vehicule.marque} {vehicule.modele}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employe_id">Technicien *</Label>
            <Select value={formData.employe_id.toString()} onValueChange={(value) => handleChange('employe_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un technicien" />
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
            <Label htmlFor="date_assignation">Date d'Assignation *</Label>
            <Input
              id="date_assignation"
              type="date"
              value={formData.date_assignation}
              onChange={(e) => handleChange('date_assignation', e.target.value)}
              required
            />
          </div>
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
            {assignation ? 'Modifier' : 'Assigner'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
