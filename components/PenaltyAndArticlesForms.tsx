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

// PenaltyForm component
export function PenaltyForm({ penalty, employees, interventions, onSave, onCancel }: { 
  penalty: any, 
  employees: any[], 
  interventions: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    numero_penalite: penalty?.numero_penalite || '',
    employe_id: penalty?.employe_id || '',
    motif: penalty?.motif || '',
    montant: penalty?.montant || '',
    statut: penalty?.statut || 'en_attente',
    date_echeance: penalty?.date_echeance || '',
    date_paiement: penalty?.date_paiement || '',
    methode_paiement: penalty?.methode_paiement || '',
    reference_paiement: penalty?.reference_paiement || '',
    manager_approbateur: penalty?.manager_approbateur || '',
    commentaires: penalty?.commentaires || '',
    reclamation_concernee: penalty?.reclamation_concernee || '',
    materiel_concerne: penalty?.materiel_concerne || '',
    num_inter: penalty?.num_inter || '',
    auto_calculate: penalty?.auto_calculate || false,
    j_plus_1: penalty?.j_plus_1 || false,
    j_plus_n: penalty?.j_plus_n || false
  })

  const [selectedIntervention, setSelectedIntervention] = useState<any>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      type_penalite: 'dossier_non_cloture', // Always dossier non clôturé
      intervention_concernee: selectedIntervention?.id || null
    }
    onSave(submitData)
  }

  const handleChange = (field: string, value: any) => {
    let newFormData = { ...formData, [field]: value }
    
    // Auto-calculate penalty based on checkboxes
    if (field === 'j_plus_1' && value) {
      newFormData.j_plus_n = false
      newFormData.montant = '60'
      newFormData.motif = 'Dossier clôturé à J+1'
    } else if (field === 'j_plus_n' && value) {
      newFormData.j_plus_1 = false
      newFormData.montant = '140'
      newFormData.motif = 'Dossier clôturé à J+n'
    } else if (field === 'j_plus_1' && !value && field === 'j_plus_n' && !value) {
      newFormData.montant = ''
      newFormData.motif = ''
    }
    
    setFormData(newFormData)
  }

  const handleInterventionSelect = (intervention: any) => {
    setSelectedIntervention(intervention)
    setFormData(prev => ({
      ...prev,
      num_inter: intervention.num_inter,
      employe_id: intervention.employe_id || ''
    }))
  }

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {penalty ? 'Modifier la Pénalité' : 'Nouvelle Pénalité'}
        </DialogTitle>
        <DialogDescription>
          {penalty ? 'Modifiez les informations de la pénalité' : 'Créez une nouvelle pénalité'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numero_penalite">Numéro de Pénalité *</Label>
            <Input
              id="numero_penalite"
              value={formData.numero_penalite}
              onChange={(e) => handleChange('numero_penalite', e.target.value)}
              placeholder="Ex: PEN-2024-001"
              required
            />
          </div>
          <div>
            <Label>Type de Pénalité</Label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-sm font-medium text-gray-800">
                Dossier Non Clôturé
              </div>
              <div className="text-xs text-gray-600">
                Type fixe pour les pénalités
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="num_inter">Recherche par Numéro d'Intervention</Label>
          <div className="space-y-2">
            <Input
              value={formData.num_inter}
              onChange={(e) => handleChange('num_inter', e.target.value)}
              placeholder="Entrez le numéro d'intervention..."
            />
            {selectedIntervention && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm font-medium text-blue-800">
                  Intervention: {selectedIntervention.num_inter}
                </div>
                <div className="text-xs text-blue-600">
                  Client: {selectedIntervention.client} | Technicien: {selectedIntervention.prenom_technicien} {selectedIntervention.nom_technicien}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Calcul Automatique de la Pénalité</Label>
          <div className="space-y-3 p-4 border border-gray-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="j_plus_1"
                checked={formData.j_plus_1}
                onCheckedChange={(checked) => handleChange('j_plus_1', checked)}
              />
              <Label htmlFor="j_plus_1" className="text-sm font-medium">
                J+1 (60€)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="j_plus_n"
                checked={formData.j_plus_n}
                onCheckedChange={(checked) => handleChange('j_plus_n', checked)}
              />
              <Label htmlFor="j_plus_n" className="text-sm font-medium">
                J+n (140€)
              </Label>
            </div>
            {(formData.j_plus_1 || formData.j_plus_n) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm font-medium text-green-800">
                  Montant: {formData.montant}€
                </div>
                <div className="text-xs text-green-600">
                  Motif: {formData.motif}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employe_id">Employé Concerné</Label>
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
            <Label htmlFor="statut">Statut *</Label>
            <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En Attente</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date_echeance">Date d'Échéance</Label>
            <Input
              id="date_echeance"
              type="date"
              value={formData.date_echeance}
              onChange={(e) => handleChange('date_echeance', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date_paiement">Date de Paiement</Label>
            <Input
              id="date_paiement"
              type="date"
              value={formData.date_paiement}
              onChange={(e) => handleChange('date_paiement', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="methode_paiement">Méthode de Paiement</Label>
            <Select value={formData.methode_paiement} onValueChange={(value) => handleChange('methode_paiement', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virement">Virement</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="reference_paiement">Référence de Paiement</Label>
            <Input
              id="reference_paiement"
              value={formData.reference_paiement}
              onChange={(e) => handleChange('reference_paiement', e.target.value)}
              placeholder="Référence du paiement"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="manager_approbateur">Manager Approbateur</Label>
          <Input
            id="manager_approbateur"
            value={formData.manager_approbateur}
            onChange={(e) => handleChange('manager_approbateur', e.target.value)}
            placeholder="Nom du manager approbateur"
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
            {penalty ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// ArticlesEditModal component
export function ArticlesEditModal({
  isOpen,
  onClose,
  intervention,
  onSave
}: {
  isOpen: boolean
  onClose: () => void
  intervention: any
  onSave: (id: number, articles: string) => Promise<void>
}) {
  const [articlesText, setArticlesText] = useState(intervention?.articles || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (intervention) {
      setArticlesText(intervention.articles || '')
    }
  }, [intervention])

  const handleSave = async () => {
    if (!intervention?.id || !articlesText.trim()) return
    
    setSaving(true)
    try {
      await onSave(intervention.id, articlesText.trim())
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setArticlesText(intervention?.articles || '')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier les Articles - {intervention?.num_inter}</DialogTitle>
          <DialogDescription>
            Ajoutez ou modifiez les articles utilisés lors de cette intervention
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Informations de l'intervention</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Client:</span> {intervention?.client}
              </div>
              <div>
                <span className="font-medium">Technicien:</span> {intervention?.prenom_technicien} {intervention?.nom_technicien}
              </div>
              <div>
                <span className="font-medium">Date RDV:</span> {intervention?.date_rdv}
              </div>
              <div>
                <span className="font-medium">Statut:</span> {intervention?.statut}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="articles">Articles Utilisés *</Label>
            <Textarea
              id="articles"
              value={articlesText}
              onChange={(e) => setArticlesText(e.target.value)}
              placeholder="Entrez les articles utilisés lors de cette intervention..."
              className="mt-2 min-h-[120px]"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Décrivez tous les articles, matériels ou pièces utilisés
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || !articlesText.trim()}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
