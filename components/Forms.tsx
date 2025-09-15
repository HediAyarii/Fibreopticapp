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
    nom: material?.nom || '',
    type: material?.type || '',
    quantite: material?.quantite || '',
    prix_unitaire: material?.prix_unitaire || '',
    fournisseur: material?.fournisseur || '',
    date_achat: material?.date_achat || '',
    statut: material?.statut || 'disponible',
    description: material?.description || ''
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
            <Label htmlFor="nom">Nom du Matériel *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => handleChange('nom', e.target.value)}
              placeholder="Ex: Câble fibre optique"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cable">Câble</SelectItem>
                <SelectItem value="connecteur">Connecteur</SelectItem>
                <SelectItem value="outil">Outil</SelectItem>
                <SelectItem value="equipement">Équipement</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
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
            <Label htmlFor="fournisseur">Fournisseur</Label>
            <Input
              id="fournisseur"
              value={formData.fournisseur}
              onChange={(e) => handleChange('fournisseur', e.target.value)}
              placeholder="Nom du fournisseur"
            />
          </div>
          <div>
            <Label htmlFor="date_achat">Date d'Achat</Label>
            <Input
              id="date_achat"
              type="date"
              value={formData.date_achat}
              onChange={(e) => handleChange('date_achat', e.target.value)}
            />
          </div>
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
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Description détaillée du matériel..."
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
    email: employee?.email || '',
    telephone: employee?.telephone || '',
    poste: employee?.poste || '',
    departement: employee?.departement || '',
    date_embauche: employee?.date_embauche || '',
    salaire: employee?.salaire || '',
    statut: employee?.statut || 'actif',
    role: employee?.role || 'technicien'
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <Label htmlFor="departement">Département</Label>
            <Input
              id="departement"
              value={formData.departement}
              onChange={(e) => handleChange('departement', e.target.value)}
              placeholder="Ex: Installation"
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
            <Label htmlFor="salaire">Salaire (€)</Label>
            <Input
              id="salaire"
              type="number"
              step="0.01"
              value={formData.salaire}
              onChange={(e) => handleChange('salaire', e.target.value)}
              placeholder="0.00"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Rôle *</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un rôle" />
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
