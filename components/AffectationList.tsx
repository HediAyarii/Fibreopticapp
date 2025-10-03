"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Package, User } from "lucide-react"
import { AffectationForm } from "./AffectationForm"

export function AffectationList() {
  const [affectations, setAffectations] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingAffectation, setEditingAffectation] = useState(null)

  useEffect(() => {
    loadAffectations()
  }, [])

  const loadAffectations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/affectations-materiel')
      if (response.ok) {
        const data = await response.json()
        setAffectations(data.affectations || [])
      }
    } catch (error) {
      console.error('Erreur chargement affectations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAffectation = async (formData: any) => {
    try {
      const url = '/api/affectations-materiel'
      const method = editingAffectation ? 'PUT' : 'POST'
      
      // Vérifier que l'ID existe pour les modifications
      if (editingAffectation && !editingAffectation.id) {
        alert('Erreur: ID d\'affectation manquant pour la modification')
        return
      }
      
      // Ajouter l'ID dans le body pour les modifications
      const requestBody = editingAffectation 
        ? { id: editingAffectation.id, ...formData }
        : formData
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        await loadAffectations()
        setShowForm(false)
        setEditingAffectation(null)
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur sauvegarde affectation:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteAffectation = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) return

    try {
      const response = await fetch(`/api/affectations-materiel?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadAffectations()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur suppression affectation:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'permanent': return 'bg-blue-100 text-blue-800'
      case 'temporaire': return 'bg-yellow-100 text-yellow-800'
      case 'consommable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Supprimé la fonction getStatutColor car on n'affiche plus le statut

  // Filtrer les affectations
  const filteredAffectations = affectations.filter(affectation => {
    const matchesSearch = 
      affectation.nom_equipement?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affectation.employe_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affectation.employe_prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affectation.type_materiel?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || affectation.type_affectation === filterType
    
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Affectations de Matériel
              </CardTitle>
              <CardDescription>
                Gérer les affectations de matériel aux employés
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Affectation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher par nom d'équipement, employé, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="filter-type">Type d'Affectation</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="temporaire">Temporaire</SelectItem>
                  <SelectItem value="consommable">Consommable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des affectations */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement des affectations...</p>
            </CardContent>
          </Card>
        ) : filteredAffectations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune affectation trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Aucune affectation ne correspond à vos critères de recherche.'
                  : 'Commencez par créer votre première affectation de matériel.'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une Affectation
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAffectations.map((affectation: any) => (
            <Card key={affectation.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{affectation.nom_equipement}</h3>
                  <Badge className={getTypeColor(affectation.type_affectation)}>
                    {affectation.type_affectation}
                  </Badge>
                </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{affectation.employe_nom} {affectation.employe_prenom}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>Quantité: {affectation.quantite_assignee}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p><strong>Employé:</strong> {affectation.employe_nom} {affectation.employe_prenom}</p>
                          <p><strong>Matériel:</strong> {affectation.nom_equipement}</p>
                          <p><strong>Type:</strong> {affectation.type_materiel}</p>
                        </div>
                        <div>
                          <p><strong>Marque/Modèle:</strong> {affectation.marque} {affectation.modele}</p>
                          <p><strong>Date d'affectation:</strong> {new Date(affectation.date_affectation).toLocaleDateString('fr-FR')}</p>
                          <p><strong>Quantité:</strong> {affectation.quantite_assignee}</p>
                        </div>
                      </div>
                      {affectation.commentaires && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p><strong>Commentaires:</strong> {affectation.commentaires}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('Modification affectation:', affectation)
                        setEditingAffectation(affectation)
                        setShowForm(true)
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAffectation(affectation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Formulaire d'affectation */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <AffectationForm
          affectation={editingAffectation}
          onSave={handleSaveAffectation}
          onCancel={() => {
            setShowForm(false)
            setEditingAffectation(null)
          }}
        />
      </Dialog>
    </div>
  )
}
