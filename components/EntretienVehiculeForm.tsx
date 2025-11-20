"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function EntretienVehiculeForm({ 
  entretien, 
  vehicules,
  onSave, 
  onCancel 
}: { 
  entretien: any,
  vehicules: any[],
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    vehicule_id: entretien?.vehicule_id || '',
    categorie_entretien: entretien?.categorie_entretien || 'vidange',
    date_entretien: entretien?.date_entretien || new Date().toISOString().split('T')[0],
    cout_entretien: entretien?.cout_entretien || 0,
    kilometrage_entretien: entretien?.kilometrage_entretien || 0,
    garage: entretien?.garage || '',
    facture_numero: entretien?.facture_numero || '',
    description: entretien?.description || '',
    prochain_entretien_km: entretien?.prochain_entretien_km || 0,
    prochain_entretien_date: entretien?.prochain_entretien_date || ''
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
          {entretien ? 'Modifier l\'Entretien' : 'Nouvel Entretien de Véhicule'}
        </DialogTitle>
        <DialogDescription>
          {entretien ? 'Modifiez les informations de l\'entretien' : 'Enregistrez un entretien ou une réparation'}
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
                {vehicules.map((vehicule) => (
                  <SelectItem key={vehicule.id} value={vehicule.id.toString()}>
                    {vehicule.matricule} - {vehicule.marque} {vehicule.modele}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="categorie_entretien">Catégorie d'Entretien *</Label>
            <Select value={formData.categorie_entretien} onValueChange={(value) => handleChange('categorie_entretien', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vidange">Vidange</SelectItem>
                <SelectItem value="revision">Révision</SelectItem>
                <SelectItem value="pneus">Pneus</SelectItem>
                <SelectItem value="freins">Freins</SelectItem>
                <SelectItem value="batterie">Batterie</SelectItem>
                <SelectItem value="carrosserie">Carrosserie</SelectItem>
                <SelectItem value="mecanique">Mécanique</SelectItem>
                <SelectItem value="electricite">Électricité</SelectItem>
                <SelectItem value="climatisation">Climatisation</SelectItem>
                <SelectItem value="controle_technique">Contrôle Technique</SelectItem>
                <SelectItem value="assurance">Assurance</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date_entretien">Date d'Entretien *</Label>
            <Input
              id="date_entretien"
              type="date"
              value={formData.date_entretien}
              onChange={(e) => handleChange('date_entretien', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="cout_entretien">Coût d'Entretien (€) *</Label>
            <Input
              id="cout_entretien"
              type="number"
              min="0"
              step="0.01"
              value={formData.cout_entretien}
              onChange={(e) => handleChange('cout_entretien', parseFloat(e.target.value))}
              placeholder="Ex: 150.50"
              required
            />
          </div>

          <div>
            <Label htmlFor="kilometrage_entretien">Kilométrage lors de l'Entretien</Label>
            <Input
              id="kilometrage_entretien"
              type="number"
              min="0"
              value={formData.kilometrage_entretien}
              onChange={(e) => handleChange('kilometrage_entretien', parseInt(e.target.value))}
              placeholder="Ex: 50000"
            />
          </div>

          <div>
            <Label htmlFor="garage">Garage / Prestataire</Label>
            <Input
              id="garage"
              value={formData.garage}
              onChange={(e) => handleChange('garage', e.target.value)}
              placeholder="Nom du garage"
            />
          </div>

          <div>
            <Label htmlFor="facture_numero">Numéro de Facture</Label>
            <Input
              id="facture_numero"
              value={formData.facture_numero}
              onChange={(e) => handleChange('facture_numero', e.target.value)}
              placeholder="Ex: FACT-2025-001"
            />
          </div>

          <div>
            <Label htmlFor="prochain_entretien_km">Prochain Entretien (km)</Label>
            <Input
              id="prochain_entretien_km"
              type="number"
              min="0"
              value={formData.prochain_entretien_km}
              onChange={(e) => handleChange('prochain_entretien_km', parseInt(e.target.value))}
              placeholder="Ex: 60000"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="prochain_entretien_date">Prochain Entretien (date)</Label>
            <Input
              id="prochain_entretien_date"
              type="date"
              value={formData.prochain_entretien_date}
              onChange={(e) => handleChange('prochain_entretien_date', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description / Notes</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Détails de l'entretien, pièces changées, observations..."
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {entretien ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
