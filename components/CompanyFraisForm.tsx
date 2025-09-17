"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Euro, 
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

interface PricingData {
  id: number
  company_name: string
  service_code: string
  category: string
  prix_base: number
  prix_tech: number
  total_price: number
}

interface FraisData {
  id?: number
  company_name: string
  service_code: string
  category: string
  numero_facture: string
  date_facture: string
  fournisseur: string
  type_frais: string
  montant_ht: number
  montant_ttc: number
  tva: number
  description: string
  statut: string
  employe_id?: number
  projet_reference?: string
  justificatifs: string[]
  commentaires?: string
  prix_reference?: number
}

interface CompanyFraisFormProps {
  company: string
  frais: FraisData[]
  onSave: (data: FraisData) => void
  onUpdate: (data: FraisData) => void
  onDelete: (id: number) => void
  employees: any[]
}

export function CompanyFraisForm({ 
  company, 
  frais, 
  onSave, 
  onUpdate, 
  onDelete, 
  employees 
}: CompanyFraisFormProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingFrais, setEditingFrais] = useState<FraisData | null>(null)
  const [pricingData, setPricingData] = useState<PricingData[]>([])
  const [selectedService, setSelectedService] = useState<PricingData | null>(null)
  
  const [formData, setFormData] = useState<FraisData>({
    company_name: company,
    service_code: '',
    category: '',
    numero_facture: '',
    date_facture: new Date().toISOString().split('T')[0],
    fournisseur: '',
    type_frais: '',
    montant_ht: 0,
    montant_ttc: 0,
    tva: 20,
    description: '',
    statut: 'en_attente',
    employe_id: undefined,
    projet_reference: '',
    justificatifs: [],
    commentaires: ''
  })

  // Charger les tarifs de l'entreprise
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        const response = await fetch(`/api/company-pricing?company=${encodeURIComponent(company)}`)
        const data = await response.json()
        if (data.success) {
          setPricingData(data.pricing)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des tarifs:', error)
      }
    }
    loadPricingData()
  }, [company])

  const handleChange = (field: keyof FraisData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceSelect = (service: PricingData) => {
    setSelectedService(service)
    setFormData(prev => ({
      ...prev,
      service_code: service.service_code,
      category: service.category,
      prix_reference: service.total_price
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingFrais) {
        await onUpdate(formData)
      } else {
        await onSave(formData)
      }
      
      setShowModal(false)
      setEditingFrais(null)
      setFormData({
        company_name: company,
        service_code: '',
        category: '',
        numero_facture: '',
        date_facture: new Date().toISOString().split('T')[0],
        fournisseur: '',
        type_frais: '',
        montant_ht: 0,
        montant_ttc: 0,
        tva: 20,
        description: '',
        statut: 'en_attente',
        employe_id: undefined,
        projet_reference: '',
        justificatifs: [],
        commentaires: ''
      })
      setSelectedService(null)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const handleEdit = (frais: FraisData) => {
    setEditingFrais(frais)
    setFormData(frais)
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce frais ?')) {
      await onDelete(id)
    }
  }

  const getStatutBadge = (statut: string) => {
    const variants = {
      'en_attente': { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      'valide': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'paye': { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
      'refuse': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    }
    
    const config = variants[statut as keyof typeof variants] || variants['en_attente']
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="glass-card border border-white/20">
        <Icon className="w-3 h-3 mr-1" />
        {statut.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  // Grouper les tarifs par catégorie
  const pricingByCategory = pricingData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, PricingData[]>)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Frais Entreprise {company}</h2>
          <p className="text-muted-foreground">Gestion des frais d'entreprise {company}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setEditingFrais(null)
            setShowModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Frais
        </Button>
      </div>

      {/* Liste des frais */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle>Liste des Frais {company}</CardTitle>
          <CardDescription>
            {frais.length} frais trouvés dans la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          {frais.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun frais {company} trouvé</p>
              <p className="text-sm text-muted-foreground">Créez votre premier frais pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="glass-card border border-white/20">
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Montant HT</TableHead>
                    <TableHead>Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {frais.map((frais) => (
                    <TableRow key={frais.id} className="hover:bg-white/5">
                      <TableCell className="font-medium">{frais.numero_facture}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{frais.service_code}</div>
                          {frais.prix_reference && (
                            <div className="text-xs text-gray-500">
                              Référence: {frais.prix_reference}€
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={frais.category === "SAV" ? "destructive" : "outline"}
                          className="glass-card border border-white/20"
                        >
                          {frais.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{frais.fournisseur}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Euro className="w-3 h-3" />
                          {frais.montant_ht}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <Euro className="w-3 h-3" />
                          {frais.montant_ttc}
                        </div>
                      </TableCell>
                      <TableCell>{getStatutBadge(frais.statut)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(frais)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(frais.id!)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création/édition */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFrais ? 'Modifier le Frais' : 'Nouveau Frais'}
            </DialogTitle>
            <DialogDescription>
              {editingFrais ? 'Modifiez les informations du frais' : 'Créez un nouveau frais pour ' + company}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection du service */}
            <div>
              <Label htmlFor="service">Service *</Label>
              <div className="space-y-4">
                {Object.entries(pricingByCategory).map(([category, services]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedService?.id === service.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-sm">{service.service_code}</div>
                              <div className="text-xs text-gray-500">
                                Base: {service.prix_base}€ + Tech: {service.prix_tech}€
                              </div>
                            </div>
                            <div className="text-sm font-bold text-blue-600">
                              {service.total_price}€
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_facture">N° Facture *</Label>
                <Input
                  id="numero_facture"
                  value={formData.numero_facture}
                  onChange={(e) => handleChange('numero_facture', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date_facture">Date Facture *</Label>
                <Input
                  id="date_facture"
                  type="date"
                  value={formData.date_facture}
                  onChange={(e) => handleChange('date_facture', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fournisseur">Fournisseur *</Label>
                <Input
                  id="fournisseur"
                  value={formData.fournisseur}
                  onChange={(e) => handleChange('fournisseur', e.target.value)}
                  required
                />
              </div>
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
                    <SelectItem value="materiel">Matériel</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Montants */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="montant_ht">Montant HT (€) *</Label>
                <Input
                  id="montant_ht"
                  type="number"
                  step="0.01"
                  value={formData.montant_ht}
                  onChange={(e) => handleChange('montant_ht', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tva">TVA (%)</Label>
                <Input
                  id="tva"
                  type="number"
                  step="0.01"
                  value={formData.tva}
                  onChange={(e) => handleChange('tva', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="montant_ttc">Montant TTC (€) *</Label>
                <Input
                  id="montant_ttc"
                  type="number"
                  step="0.01"
                  value={formData.montant_ttc}
                  onChange={(e) => handleChange('montant_ttc', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Description et commentaires */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="commentaires">Commentaires</Label>
              <Textarea
                id="commentaires"
                value={formData.commentaires || ''}
                onChange={(e) => handleChange('commentaires', e.target.value)}
                rows={2}
              />
            </div>

            {/* Employé et projet */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employe_id">Employé</Label>
                <Select value={formData.employe_id?.toString() || ''} onValueChange={(value) => handleChange('employe_id', value ? parseInt(value) : undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.prenom} {emp.nom} ({emp.matricule})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="projet_reference">Référence Projet</Label>
                <Input
                  id="projet_reference"
                  value={formData.projet_reference || ''}
                  onChange={(e) => handleChange('projet_reference', e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingFrais ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
