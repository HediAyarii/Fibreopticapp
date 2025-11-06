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

// MaterialForm component
export function MaterialForm({ material, onSave, onCancel }: { 
  material: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    nom_equipement: material?.nom_equipement || '',
    type_materiel: material?.type_materiel || '',
    depot: material?.depot || 'AXECOM',
    quantite: material?.quantite || '',
    prix_unitaire: material?.prix_unitaire || '',
    marque: material?.marque || '',
    modele: material?.modele || '',
    date_acquisition: material?.date_acquisition || '',
    statut: material?.statut || 'disponible',
    notes_maintenance: material?.notes_maintenance || ''
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
          {material ? 'Modifier le Matériel' : 'Nouveau Matériel'}
        </DialogTitle>
        <DialogDescription>
          {material ? 'Modifiez les informations du matériel' : 'Ajoutez un nouveau matériel à l\'inventaire'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nom_equipement">Nom du Matériel *</Label>
            <Input
              id="nom_equipement"
              value={formData.nom_equipement}
              onChange={(e) => handleChange('nom_equipement', e.target.value)}
              placeholder="Ex: Câble fibre optique"
              required
            />
          </div>
          <div>
            <Label htmlFor="type_materiel">Type *</Label>
            <Select value={formData.type_materiel} onValueChange={(value) => handleChange('type_materiel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routeur">Routeur</SelectItem>
                <SelectItem value="modem">Modem</SelectItem>
                <SelectItem value="cable">Câble</SelectItem>
                <SelectItem value="outil">Outil</SelectItem>
                <SelectItem value="vehicule">Véhicule</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="depot">Dépôt de Stockage *</Label>
            <Select value={formData.depot} onValueChange={(value) => handleChange('depot', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un dépôt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AXECOM">AXECOM</SelectItem>
                <SelectItem value="ERT">ERT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="statut">Statut</Label>
            <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="affecte">Affecté</SelectItem>
                <SelectItem value="en_maintenance">En Maintenance</SelectItem>
                <SelectItem value="hors_service">Hors Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantite">Quantité *</Label>
            <Input
              id="quantite"
              type="number"
              value={formData.quantite}
              onChange={(e) => handleChange('quantite', e.target.value)}
              placeholder="0"
              min="0"
              required
            />
          </div>
          <div>
            <Label htmlFor="prix_unitaire">Prix Unitaire (€)</Label>
            <Input
              id="prix_unitaire"
              type="number"
              step="0.01"
              value={formData.prix_unitaire}
              onChange={(e) => handleChange('prix_unitaire', e.target.value)}
              placeholder="0.00"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="marque">Marque</Label>
            <Input
              id="marque"
              value={formData.marque}
              onChange={(e) => handleChange('marque', e.target.value)}
              placeholder="Nom de la marque"
            />
          </div>
          <div>
            <Label htmlFor="modele">Modèle</Label>
            <Input
              id="modele"
              value={formData.modele}
              onChange={(e) => handleChange('modele', e.target.value)}
              placeholder="Modèle du matériel"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="date_acquisition">Date d'Acquisition</Label>
          <Input
            id="date_acquisition"
            type="date"
            value={formData.date_acquisition}
            onChange={(e) => handleChange('date_acquisition', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="statut">Statut *</Label>
          <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="en_utilisation">En Utilisation</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="hors_service">Hors Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes_maintenance">Notes de Maintenance</Label>
          <Textarea
            id="notes_maintenance"
            value={formData.notes_maintenance}
            onChange={(e) => handleChange('notes_maintenance', e.target.value)}
            placeholder="Notes de maintenance et description du matériel..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {material ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// EmployeeForm component
export function EmployeeForm({ employee, onSave, onCancel }: { 
  employee: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    nom: employee?.nom || '',
    prenom: employee?.prenom || '',
    matricule: employee?.matricule || '',
    email: employee?.email || '',
    telephone: employee?.telephone || '',
    poste: employee?.poste || '',
    departement: employee?.departement || '',
    date_embauche: employee?.date_embauche || '',
    salaire_base: employee?.salaire_base || '',
    statut: employee?.statut || 'actif',
    niveau_acces: employee?.niveau_acces || 'technicien',
    rib_salaire: employee?.rib_salaire || '',
    rib2: employee?.rib2 || ''
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
          {employee ? 'Modifier l\'Employé' : 'Nouvel Employé'}
        </DialogTitle>
        <DialogDescription>
          {employee ? 'Modifiez les informations de l\'employé' : 'Ajoutez un nouvel employé'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              placeholder="Nom de famille"
              required
            />
          </div>
          <div>
            <Label htmlFor="prenom">Prénom *</Label>
            <Input
              id="prenom"
              value={formData.prenom}
              onChange={(e) => handleChange('prenom', e.target.value)}
              placeholder="Prénom"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="matricule">Matricule *</Label>
            <Input
              id="matricule"
              value={formData.matricule}
              onChange={(e) => handleChange('matricule', e.target.value)}
              placeholder="Ex: TECH_ABC123"
              required
            />
          </div>
          <div>
            <Label htmlFor="poste">Poste *</Label>
            <Input
              id="poste"
              value={formData.poste}
              onChange={(e) => handleChange('poste', e.target.value)}
              placeholder="Ex: Technicien Fibre"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
          <div>
            <Label htmlFor="date_embauche">Date d'Embauche</Label>
            <Input
              id="date_embauche"
              type="date"
              value={formData.date_embauche}
              onChange={(e) => handleChange('date_embauche', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departement">Département</Label>
            <Input
              id="departement"
              value={formData.departement}
              onChange={(e) => handleChange('departement', e.target.value)}
              placeholder="Ex: Installation"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date_embauche">Date d'Embauche</Label>
            <Input
              id="date_embauche"
              type="date"
              value={formData.date_embauche}
              onChange={(e) => handleChange('date_embauche', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="salaire_base">Salaire (€)</Label>
            <Input
              id="salaire_base"
              type="number"
              step="0.01"
              value={formData.salaire_base}
              onChange={(e) => handleChange('salaire_base', e.target.value)}
              placeholder="0.00"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="niveau_acces">Niveau d'accès *</Label>
            <Select value={formData.niveau_acces} onValueChange={(value) => handleChange('niveau_acces', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un niveau d'accès" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="technicien">Technicien</SelectItem>
                <SelectItem value="controleur">Contrôleur</SelectItem>
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
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rib_salaire">RIB Salaire</Label>
            <Input
              id="rib_salaire"
              value={formData.rib_salaire}
              onChange={(e) => handleChange('rib_salaire', e.target.value)}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              RIB principal pour les salaires
            </p>
          </div>
          <div>
            <Label htmlFor="rib2">RIB Secondaire</Label>
            <Input
              id="rib2"
              value={formData.rib2}
              onChange={(e) => handleChange('rib2', e.target.value)}
              placeholder="FR76 9876 5432 1098 7654 3210 987"
              className="font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              RIB alternatif (optionnel)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {employee ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

