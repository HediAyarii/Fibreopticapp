"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function VehiculeForm({ 
  vehicule, 
  onSave, 
  onCancel 
}: { 
  vehicule: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
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

  // Mettre à jour le formulaire quand le véhicule change
  useEffect(() => {
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
    }
  }, [vehicule])

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
          {vehicule ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
        </DialogTitle>
        <DialogDescription>
          {vehicule ? 'Modifiez les informations du véhicule' : 'Ajoutez un nouveau véhicule à la flotte'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {vehicule ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
