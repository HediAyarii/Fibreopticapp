"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, RefreshCw, TrendingUp, Package, Users, DollarSign, Eye } from "lucide-react"
import { useAutoSync } from "@/hooks/useAutoSync"

interface EmployeeMaterialValue {
  employe_id: number
  employe_nom: string
  employe_prenom: string
  employe_matricule: string
  nombre_affectations: number
  quantite_totale: number
  valeur_totale: number
  premiere_affectation: string
  derniere_affectation: string
  ert_label: string
  axecom_label: string
}

export function EmployeeMaterialValueTable() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedGrille, setSelectedGrille] = useState<'all' | 'ERT' | 'AXECOM'>('all')
  const [employees, setEmployees] = useState<any[]>([])
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<any>(null)
  const [employeeMaterials, setEmployeeMaterials] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Hook personnalisé pour la synchronisation automatique avec filtres
  const fetchEmployeeValuesWithFilters = useCallback(async () => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (selectedEmployee !== 'all') params.append('employeId', selectedEmployee)
    if (selectedGrille !== 'all') params.append('grille', selectedGrille)

    const response = await fetch(`/api/employee-material-value?${params.toString()}`)
    if (!response.ok) throw new Error('Erreur lors du chargement des valeurs employés')
    const data = await response.json()
    return data.employeeValues || []
  }, [startDate, endDate, selectedEmployee, selectedGrille])

  // Utiliser le hook personnalisé avec les filtres
  const { data: employeeValues, loading, triggerSync } = useAutoSync({
    fetchFunction: fetchEmployeeValuesWithFilters,
    dependencies: [startDate, endDate, selectedEmployee, selectedGrille],
    syncEvents: ['material-assignment-updated', 'material-updated', 'employee-updated']
  })

  useEffect(() => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatEmployeeName = (employee: any) => {
    const ertLabel = employee.ert_label || ''
    const axecomLabel = employee.axecom_label || ''
    
    let displayName = `${employee.employe_nom} ${employee.employe_prenom}`
    
    // Ajouter l'étiquette ERT devant le nom
    if (ertLabel) {
      displayName = `[${ertLabel}] ${displayName}`
    }
    
    // Ajouter l'étiquette AXECOM après le nom
    if (axecomLabel) {
      displayName = `${displayName} (${axecomLabel})`
    }
    
    return displayName
  }

  const getTotalValue = () => {
    return employeeValues.reduce((sum, item: any) => sum + (item.valeur_totale || 0), 0)
  }

  const getTotalAssignments = () => {
    return employeeValues.reduce((sum, item: any) => sum + (item.nombre_affectations || 0), 0)
  }

  const handleFilterChange = () => {
    // Le hook useAutoSync se mettra automatiquement à jour grâce aux dependencies
    // Pas besoin d'appeler triggerSync() car les filtres sont dans les dependencies
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedEmployee('all')
    setSelectedGrille('all')
    // Le hook se mettra automatiquement à jour grâce aux dependencies
  }

  const showEmployeeDetails = async (employee: any) => {
    setSelectedEmployeeDetails(employee)
    setShowDetailsModal(true)
    setLoadingDetails(true)
    
    try {
      const params = new URLSearchParams()
      params.append('employeId', employee.employe_id.toString())
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/employee-material-details?${params.toString()}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des détails')
      
      const data = await response.json()
      setEmployeeMaterials(data.materials || [])
    } catch (error) {
      console.error('Erreur chargement détails:', error)
      alert('Erreur lors du chargement des détails')
    } finally {
      setLoadingDetails(false)
    }
  }

  return (
    <Card className="glass-card border border-white/20 hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Valeur Totale du Matériel par Employé</CardTitle>
              <CardDescription>
                Vue d'ensemble de la valeur du matériel affecté à chaque employé
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={triggerSync}
            disabled={loading}
            className="glass-card border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Filtres de période</h3>
            <p className="text-sm text-muted-foreground">
              Filtrez les employés selon la période d'affectation du matériel
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  // Le hook se mettra automatiquement à jour grâce aux dependencies
                }}
                className="glass-card border border-white/20"
                placeholder="Sélectionnez une date de début"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  // Le hook se mettra automatiquement à jour grâce aux dependencies
                }}
                className="glass-card border border-white/20"
                placeholder="Sélectionnez une date de fin"
              />
            </div>
            <div>
              <Label htmlFor="employee">Employé</Label>
              <Select 
                value={selectedEmployee} 
                onValueChange={(value) => {
                  setSelectedEmployee(value)
                  // Le hook se mettra automatiquement à jour grâce aux dependencies
                }}
              >
                <SelectTrigger className="glass-card border border-white/20">
                  <SelectValue placeholder="Tous les employés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.nom} {emp.prenom} ({emp.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="grille">Grille</Label>
              <Select 
                value={selectedGrille} 
                onValueChange={(value: 'all' | 'ERT' | 'AXECOM') => {
                  setSelectedGrille(value)
                  // Le hook se mettra automatiquement à jour grâce aux dependencies
                }}
              >
                <SelectTrigger className="glass-card border border-white/20">
                  <SelectValue placeholder="Toutes les grilles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les grilles</SelectItem>
                  <SelectItem value="ERT">ERT</SelectItem>
                  <SelectItem value="AXECOM">AXECOM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleFilterChange}
                className="flex-1 glass-card border border-white/20"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="glass-card border border-white/20"
              >
                Effacer
              </Button>
            </div>
          </div>
          
          {/* Indicateur des filtres actifs */}
          {(startDate || endDate || selectedEmployee !== 'all' || selectedGrille !== 'all') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Filtres actifs :</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {startDate && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Début: {new Date(startDate).toLocaleDateString('fr-FR')}
                  </Badge>
                )}
                {endDate && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Fin: {new Date(endDate).toLocaleDateString('fr-FR')}
                  </Badge>
                )}
                {selectedEmployee !== 'all' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Employé: {employees.find((emp: any) => emp.id.toString() === selectedEmployee)?.nom} {employees.find((emp: any) => emp.id.toString() === selectedEmployee)?.prenom}
                  </Badge>
                )}
                {selectedGrille !== 'all' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Grille: {selectedGrille}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valeur Totale</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(getTotalValue())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Affectations</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {getTotalAssignments()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employés</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {employeeValues.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table des valeurs par employé */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 font-medium text-muted-foreground">Employé</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Matricule</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Affectations</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Quantité</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Valeur Totale</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Période</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : employeeValues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Aucun employé trouvé</p>
                        <p className="text-sm">
                          {startDate || endDate || selectedEmployee !== 'all' 
                            ? 'Aucun employé n\'a été affecté au matériel pendant cette période'
                            : 'Aucun employé n\'a encore été affecté au matériel'
                          }
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                employeeValues.map((employee: any) => (
                  <tr key={employee.employe_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div className="font-medium">
                        {formatEmployeeName(employee)}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="glass-card border border-white/20">
                        {employee.employe_matricule}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="secondary" className="glass-card border border-white/20">
                        {employee.nombre_affectations}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-medium">
                        {employee.quantite_totale}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(employee.valeur_totale)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-xs text-muted-foreground">
                        <div>Début: {formatDate(employee.premiere_affectation)}</div>
                        <div>Fin: {formatDate(employee.derniere_affectation)}</div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showEmployeeDetails(employee)}
                        className="glass-card border border-white/20"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Détails
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal des détails */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent 
            className="w-[95vw] sm:max-w-[1100px] lg:max-w-[1300px] p-0 gap-0 flex flex-col"
            style={{ maxHeight: '85vh', height: '85vh' }}
          >
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
              <DialogTitle>
                Matériels affectés - {selectedEmployeeDetails && formatEmployeeName(selectedEmployeeDetails)}
              </DialogTitle>
              <DialogDescription>
                Liste détaillée des matériels affectés avec les dates d'affectation
              </DialogDescription>
            </DialogHeader>

            {loadingDetails ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">Chargement des détails...</span>
              </div>
            ) : (
              <div 
                className="flex-1 px-6 pb-6"
                style={{ 
                  overflowY: 'auto', 
                  overflowX: 'auto',
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 font-medium text-muted-foreground">Matériel</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Dépôt</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Quantité</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Prix Unitaire</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Valeur</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Date Affectation</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-muted-foreground">
                          Aucun matériel trouvé
                        </td>
                      </tr>
                    ) : (
                      employeeMaterials.map((material: any, index: number) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-3">
                            <div className="font-medium">{material.nom_equipement}</div>
                            {material.marque && (
                              <div className="text-xs text-muted-foreground">{material.marque} {material.modele}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{material.type_materiel}</Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={material.depot === 'ERT' ? 'default' : 'secondary'}>
                              {material.depot}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium">{material.quantite_assignee}</span>
                          </td>
                          <td className="p-3 text-right">
                            {formatCurrency(material.prix_unitaire || 0)}
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-primary">
                              {formatCurrency((material.prix_unitaire || 0) * (material.quantite_assignee || 0))}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="text-sm">
                              {formatDate(material.date_affectation)}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={
                                material.type_affectation === 'permanent' ? 'default' :
                                material.type_affectation === 'temporaire' ? 'secondary' :
                                'outline'
                              }
                            >
                              {material.type_affectation}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-white/20">
                    <tr>
                      <td colSpan={5} className="p-3 text-right font-bold">Total:</td>
                      <td className="p-3 text-right">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(
                            employeeMaterials.reduce((sum, m) => 
                              sum + ((m.prix_unitaire || 0) * (m.quantite_assignee || 0)), 0
                            )
                          )}
                        </span>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
