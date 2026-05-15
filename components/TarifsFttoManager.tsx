"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Search, FileText, Euro } from "lucide-react"

interface FttoTarifData {
  id?: number
  code_article: string
  designation: string
  bpu: number
  created_at?: string
  updated_at?: string
}

interface TarifsFttoManagerProps {
  tarifs: FttoTarifData[]
  onSave: (data: FttoTarifData) => void
  onUpdate: (data: FttoTarifData) => void
  onDelete: (id: number) => void
}

export function TarifsFttoManager({ tarifs, onSave, onUpdate, onDelete }: TarifsFttoManagerProps) {
  const [showModal, setShowModal] = useState(false)
  const [editingTarif, setEditingTarif] = useState<FttoTarifData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const emptyForm: FttoTarifData = { code_article: '', designation: '', bpu: 0 }
  const [formData, setFormData] = useState<FttoTarifData>(emptyForm)

  const filteredTarifs = tarifs.filter(t =>
    searchTerm === "" ||
    t.code_article.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.designation.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleChange = (field: keyof FttoTarifData, value: any) => {
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
      setFormData(emptyForm)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde FTTO:', error)
    }
  }

  const handleEdit = (tarif: FttoTarifData) => {
    setEditingTarif(tarif)
    setFormData(tarif)
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tarif FTTO ?')) {
      await onDelete(id)
    }
  }

  const handleOpenCreate = () => {
    setEditingTarif(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche + bouton ajout */}
      <Card className="glass-card border border-white/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="ftto-search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="ftto-search"
                  placeholder="Code article ou désignation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={handleOpenCreate} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Tarif FTTO
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des tarifs FTTO */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tarifs FTTO (BPU)
          </CardTitle>
          <CardDescription>
            {filteredTarifs.length} tarif{filteredTarifs.length > 1 ? 's' : ''} trouvé{filteredTarifs.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTarifs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun tarif FTTO trouvé</p>
              <p className="text-sm text-muted-foreground">Créez votre premier tarif pour commencer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="glass-card border border-white/20">
                    <TableHead className="w-32">Code Article</TableHead>
                    <TableHead>Désignation</TableHead>
                    <TableHead className="text-right w-28">BPU (€)</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTarifs.map((tarif) => (
                    <TableRow key={tarif.id} className="hover:bg-white/5">
                      <TableCell className="font-mono font-medium text-blue-400">
                        {tarif.code_article}
                      </TableCell>
                      <TableCell className="text-sm max-w-md">
                        {tarif.designation}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 font-medium">
                          <Euro className="w-3 h-3 text-muted-foreground" />
                          {Number(tarif.bpu).toFixed(2)}
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

      {/* Modal création / édition */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingTarif(null); setFormData(emptyForm) } }}>
        <DialogContent className="glass-card border border-white/20">
          <DialogHeader>
            <DialogTitle>
              {editingTarif ? 'Modifier le Tarif FTTO' : 'Nouveau Tarif FTTO'}
            </DialogTitle>
            <DialogDescription>
              {editingTarif ? 'Modifiez les informations du tarif' : 'Ajoutez un nouveau tarif au BPU FTTO'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="ftto-code">Code Article *</Label>
              <Input
                id="ftto-code"
                value={formData.code_article}
                onChange={(e) => handleChange('code_article', e.target.value)}
                placeholder="Ex: FO-010, ALIGNEMENT..."
                required
              />
            </div>

            <div>
              <Label htmlFor="ftto-designation">Désignation *</Label>
              <Input
                id="ftto-designation"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                placeholder="Description du service"
                required
              />
            </div>

            <div>
              <Label htmlFor="ftto-bpu">BPU (€) *</Label>
              <Input
                id="ftto-bpu"
                type="number"
                step="0.01"
                min="0"
                value={formData.bpu}
                onChange={(e) => handleChange('bpu', parseFloat(e.target.value) || 0)}
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
