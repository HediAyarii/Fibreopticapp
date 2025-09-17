"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Euro, 
  Search
} from "lucide-react"

interface TarifData {
  id?: number
  company_name: string
  service_code: string
  category: string
  prix_base: number
  prix_tech: number
  total_price?: number
  created_at?: string
  updated_at?: string
}

interface TarifsManagerProps {
  tarifs: TarifData[]
  onSave: (data: TarifData) => void
  onUpdate: (data: TarifData) => void
  onDelete: (id: number) => void
}

export function TarifsManager({ tarifs, onSave, onUpdate, onDelete }: TarifsManagerProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingTarif, setEditingTarif] = useState<TarifData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCompany, setFilterCompany] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  
  const [formData, setFormData] = useState<TarifData>({
    company_name: '',
    service_code: '',
    category: '',
    prix_base: 0,
    prix_tech: 0
  })

  // Filtrer les tarifs
  const filteredTarifs = tarifs.filter(tarif => {
    const matchesSearch = searchTerm === "" || 
      tarif.service_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tarif.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCompany = filterCompany === "all" || tarif.company_name === filterCompany
    const matchesCategory = filterCategory === "all" || tarif.category === filterCategory
    
    return matchesSearch && matchesCompany && matchesCategory
  })

  // Obtenir les entreprises et catégories uniques
  const companies = Array.from(new Set(tarifs.map(t => t.company_name)))
  const categories = Array.from(new Set(tarifs.map(t => t.category)))

  const handleChange = (field: keyof TarifData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTarif) {
        await onUpdate({ ...formData, id: editingTarif.id })
      } else {
        await onSave(formData)
      }
      
      setShowModal(false)
      setEditingTarif(null)
      setFormData({
        company_name: '',
        service_code: '',
        category: '',
        prix_base: 0,
        prix_tech: 0
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const handleEdit = (tarif: TarifData) => {
    setEditingTarif(tarif)
    setFormData(tarif)
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      await onDelete(id)
    }
  }

  const getCompanyBadge = (company: string) => {
    const variants = {
      'AXECOM': { variant: 'default' as const, color: 'bg-purple-500/20 text-purple-400' },
      'ERT OUEST': { variant: 'secondary' as const, color: 'bg-blue-500/20 text-blue-400' }
    }
    
    const config = variants[company as keyof typeof variants] || variants['AXECOM']
    
    return (
      <Badge variant={config.variant} className={`glass-card border border-white/20 ${config.color}`}>
        {company}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string) => {
    const variants = {
      'SAV': { variant: 'destructive' as const, color: 'bg-red-500/20 text-red-400' },
      'RACC': { variant: 'outline' as const, color: 'bg-green-500/20 text-green-400' }
    }
    
    const config = variants[category as keyof typeof variants] || variants['SAV']
    
    return (
      <Badge variant={config.variant} className={`glass-card border border-white/20 ${config.color}`}>
        {category}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <Card className="glass-card border border-white/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Rechercher un service</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les entreprises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entreprises</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setShowModal(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Tarif
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des tarifs */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Liste des Tarifs
          </CardTitle>
          <CardDescription>
            {filteredTarifs.length} tarifs trouvés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTarifs.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun tarif trouvé</p>
              <p className="text-sm text-muted-foreground">Créez votre premier tarif pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="glass-card border border-white/20">
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Prix Entreprise</TableHead>
                    <TableHead className="text-right">Prix Technicien</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTarifs.map((tarif) => (
                    <TableRow key={tarif.id} className="hover:bg-white/5">
                      <TableCell>{getCompanyBadge(tarif.company_name)}</TableCell>
                      <TableCell className="font-medium">{tarif.service_code}</TableCell>
                      <TableCell>{getCategoryBadge(tarif.category)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Euro className="w-3 h-3" />
                          {tarif.prix_base}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Euro className="w-3 h-3" />
                          {tarif.prix_tech}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(tarif)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(tarif.id!)}
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
        <DialogContent className="glass-card border border-white/20">
          <DialogHeader>
            <DialogTitle>
              {editingTarif ? 'Modifier le Tarif' : 'Nouveau Tarif'}
            </DialogTitle>
            <DialogDescription>
              {editingTarif ? 'Modifiez les informations du tarif' : 'Créez un nouveau tarif'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Entreprise *</Label>
                <Select value={formData.company_name} onValueChange={(value) => handleChange('company_name', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AXECOM">AXECOM</SelectItem>
                    <SelectItem value="ERT OUEST">ERT OUEST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="service_code">Code Service *</Label>
                <Input
                  id="service_code"
                  value={formData.service_code}
                  onChange={(e) => handleChange('service_code', e.target.value)}
                  placeholder="Ex: CLEM, RACPRO_S"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAV">SAV</SelectItem>
                    <SelectItem value="RACC">RACC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="prix_base">Prix Entreprise (€) *</Label>
                <Input
                  id="prix_base"
                  type="number"
                  step="0.01"
                  value={formData.prix_base}
                  onChange={(e) => handleChange('prix_base', parseFloat(e.target.value))}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prix_tech">Prix Technicien (€) *</Label>
              <Input
                id="prix_tech"
                type="number"
                step="0.01"
                value={formData.prix_tech}
                onChange={(e) => handleChange('prix_tech', parseFloat(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingTarif ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
