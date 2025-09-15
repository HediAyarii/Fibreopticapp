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

// FraisErtForm component
export function FraisErtForm({ frais, onSave, onCancel }: { 
  frais: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    employe_id: frais?.employe_id || '',
    date_frais: frais?.date_frais || new Date().toISOString().split('T')[0],
    type_frais: frais?.type_frais || '',
    montant: frais?.montant || '',
    description: frais?.description || '',
    statut: frais?.statut || 'en_attente',
    justificatif: frais?.justificatif || '',
    date_validation: frais?.date_validation || '',
    commentaires: frais?.commentaires || ''
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
          {frais ? 'Modifier les Frais ERT' : 'Nouveaux Frais ERT'}
        </DialogTitle>
        <DialogDescription>
          {frais ? 'Modifiez les informations des frais ERT' : 'Ajoutez de nouveaux frais ERT'}
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
                {/* Les employés seront passés en props */}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date_frais">Date des Frais *</Label>
            <Input
              id="date_frais"
              type="date"
              value={formData.date_frais}
              onChange={(e) => handleChange('date_frais', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type_frais">Type de Frais *</Label>
            <Select value={formData.type_frais} onValueChange={(value) => handleChange('type_frais', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="repas">Repas</SelectItem>
                <SelectItem value="hebergement">Hébergement</SelectItem>
                <SelectItem value="peage">Péage</SelectItem>
                <SelectItem value="carburant">Carburant</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="montant">Montant (€) *</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => handleChange('montant', e.target.value)}
              placeholder="0.00"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez les frais engagés..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="statut">Statut *</Label>
            <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En Attente</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="rembourse">Remboursé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="justificatif">Justificatif</Label>
            <Input
              id="justificatif"
              value={formData.justificatif}
              onChange={(e) => handleChange('justificatif', e.target.value)}
              placeholder="Référence du justificatif"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="date_validation">Date de Validation</Label>
          <Input
            id="date_validation"
            type="date"
            value={formData.date_validation}
            onChange={(e) => handleChange('date_validation', e.target.value)}
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
            {frais ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// FraisAxecomForm component
export function FraisAxecomForm({ frais, onSave, onCancel }: { 
  frais: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    employe_id: frais?.employe_id || '',
    date_frais: frais?.date_frais || new Date().toISOString().split('T')[0],
    type_frais: frais?.type_frais || '',
    montant: frais?.montant || '',
    description: frais?.description || '',
    statut: frais?.statut || 'en_attente',
    justificatif: frais?.justificatif || '',
    date_validation: frais?.date_validation || '',
    commentaires: frais?.commentaires || ''
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
          {frais ? 'Modifier les Frais Axecom' : 'Nouveaux Frais Axecom'}
        </DialogTitle>
        <DialogDescription>
          {frais ? 'Modifiez les informations des frais Axecom' : 'Ajoutez de nouveaux frais Axecom'}
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
                {/* Les employés seront passés en props */}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date_frais">Date des Frais *</Label>
            <Input
              id="date_frais"
              type="date"
              value={formData.date_frais}
              onChange={(e) => handleChange('date_frais', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type_frais">Type de Frais *</Label>
            <Select value={formData.type_frais} onValueChange={(value) => handleChange('type_frais', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="repas">Repas</SelectItem>
                <SelectItem value="hebergement">Hébergement</SelectItem>
                <SelectItem value="peage">Péage</SelectItem>
                <SelectItem value="carburant">Carburant</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="montant">Montant (€) *</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              value={formData.montant}
              onChange={(e) => handleChange('montant', e.target.value)}
              placeholder="0.00"
              min="0"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Décrivez les frais engagés..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="statut">Statut *</Label>
            <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En Attente</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="rembourse">Remboursé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="justificatif">Justificatif</Label>
            <Input
              id="justificatif"
              value={formData.justificatif}
              onChange={(e) => handleChange('justificatif', e.target.value)}
              placeholder="Référence du justificatif"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="date_validation">Date de Validation</Label>
          <Input
            id="date_validation"
            type="date"
            value={formData.date_validation}
            onChange={(e) => handleChange('date_validation', e.target.value)}
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
            {frais ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
