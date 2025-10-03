"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, User, Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react"

export function AffectationTest() {
  const [affectations, setAffectations] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    loadAffectations()
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employes')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employes || [])
      }
    } catch (error) {
      console.error('Erreur chargement employés:', error)
    }
  }

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'permanent': return 'bg-blue-100 text-blue-800'
      case 'temporaire': return 'bg-yellow-100 text-yellow-800'
      case 'consommable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filtrer les affectations par employé
  const filteredAffectations = affectations.filter(affectation => {
    if (employeeFilter === 'all') return true
    return affectation.employe_id === parseInt(employeeFilter)
  })

  // Calculer la pagination
  const totalPages = Math.ceil(filteredAffectations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAffectations = filteredAffectations.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleEmployeeFilterChange = (employeeId: string) => {
    setEmployeeFilter(employeeId)
    setCurrentPage(1) // Reset à la première page
  }

  const createTestAffectation = async () => {
    try {
      const response = await fetch('/api/affectations-materiel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materiel_id: "6",
          employe_id: "1",
          quantite_assignee: "1",
          type_affectation: "permanent",
          commentaires: "Test affectation depuis l'interface"
        })
      })

      if (response.ok) {
        await loadAffectations()
        alert('Affectation créée avec succès !')
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur création affectation:', error)
      alert('Erreur lors de la création de l\'affectation')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Test des Affectations
        </CardTitle>
        <CardDescription>
          Affichage des affectations avec les informations demandées
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtres et contrôles */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="employee-filter">Filtrer par employé</Label>
              <Select value={employeeFilter} onValueChange={handleEmployeeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les employés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {employees.map((employee: any) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.nom} {employee.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredAffectations.length} affectation(s) trouvée(s)
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Chargement...</p>
          </div>
        ) : affectations.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune affectation trouvée</h3>
            <p className="text-muted-foreground">Créez votre première affectation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedAffectations.map((affectation: any) => (
              <Card key={affectation.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{affectation.nom_equipement}</h3>
                      <Badge className={getTypeColor(affectation.type_affectation)}>
                        {affectation.type_affectation}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span><strong>Employé:</strong> {affectation.employe_nom} {affectation.employe_prenom}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span><strong>Matériel:</strong> {affectation.nom_equipement}</span>
                      </div>
                      <div>
                        <span><strong>Type:</strong> {affectation.type_materiel}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span><strong>Marque/Modèle:</strong> {affectation.marque} {affectation.modele}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span><strong>Date:</strong> {new Date(affectation.date_affectation).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div>
                        <span><strong>Quantité:</strong> {affectation.quantite_assignee}</span>
                      </div>
                    </div>
                  </div>
                  
                  {affectation.commentaires && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <strong>Commentaires:</strong> {affectation.commentaires}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages} ({filteredAffectations.length} affectation(s))
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              
              {/* Numéros de page */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button onClick={loadAffectations} variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={createTestAffectation} variant="default">
            <Package className="w-4 h-4 mr-2" />
            Créer Test Affectation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
