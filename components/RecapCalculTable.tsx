"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, RefreshCw, TrendingUp, Calculator, DollarSign, TrendingDown, Users, BarChart3 } from "lucide-react"
import { useAutoSync } from "@/hooks/useAutoSync"

interface RecapCalculData {
  employe_id: number
  employe_nom: string
  employe_prenom: string
  employe_matricule: string
  recettes_generes: number
  cout_carburant: number
  cout_materiel: number
  cout_impots: number
  cout_penalites: number
  total_couts: number
  benefice_net: number
  marge_beneficiaire: number
}

export function RecapCalculTable() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedGrille, setSelectedGrille] = useState('tout')
  const [employees, setEmployees] = useState<any[]>([])

  // Hook personnalisé pour la synchronisation automatique avec filtres
  const fetchRecapData = useCallback(async () => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (selectedEmployee !== 'all') params.append('employeId', selectedEmployee)
    if (selectedGrille !== 'tout') params.append('grille', selectedGrille)

    const response = await fetch(`/api/recap-calcul?${params.toString()}`)
    if (!response.ok) throw new Error('Erreur lors du chargement du récap calcul')
    const data = await response.json()
    return data.recapData || []
  }, [startDate, endDate, selectedEmployee, selectedGrille])

  // Utiliser le hook personnalisé avec les filtres
  const { data: recapData, loading, triggerSync } = useAutoSync({
    fetchFunction: fetchRecapData,
    dependencies: [startDate, endDate, selectedEmployee, selectedGrille],
    syncEvents: [
      'material-assignment-updated', 
      'material-updated', 
      'employee-updated', 
      'revenue-updated',
      'intervention-updated',
      'carburant-updated',
      'cout-salaire-updated',
      'charges-updated',
      'penalites-updated'
    ]
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`
  }

  const getTotalRecettes = () => {
    return recapData.reduce((sum, item: any) => sum + (item.recettes_generes || 0), 0)
  }

  const getTotalCouts = () => {
    return recapData.reduce((sum, item: any) => sum + (item.total_couts || 0), 0)
  }

  const getTotalBenefice = () => {
    return recapData.reduce((sum, item: any) => sum + (item.benefice_net || 0), 0)
  }

  const getMoyenneMarge = () => {
    if (recapData.length === 0) return 0
    const totalMarge = recapData.reduce((sum, item: any) => sum + (item.marge_beneficiaire || 0), 0)
    return totalMarge / recapData.length
  }

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedEmployee('all')
    setSelectedGrille('tout')
  }

  const getBeneficeColor = (benefice: any) => {
    const beneficeNum = Number(benefice) || 0
    if (beneficeNum > 0) return 'text-green-600'
    if (beneficeNum < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getMargeColor = (marge: any) => {
    const margeNum = Number(marge) || 0
    if (margeNum > 20) return 'text-green-600'
    if (margeNum > 10) return 'text-yellow-600'
    if (margeNum > 0) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <Card className="glass-card border border-white/20 hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Récap Calcul</CardTitle>
              <CardDescription>
                Calcul du bénéfice net par employé (Recettes - Coûts)
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
            <h3 className="text-lg font-semibold mb-2">Filtres de calcul</h3>
            <p className="text-sm text-muted-foreground">
              Sélectionnez la période et les critères pour le calcul du récap
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
                className="glass-card border border-white/20"
                placeholder="Sélectionnez une date de fin"
              />
            </div>
            <div>
              <Label htmlFor="grille">Grille</Label>
              <Select value={selectedGrille} onValueChange={setSelectedGrille}>
                <SelectTrigger className="glass-card border border-white/20">
                  <SelectValue placeholder="Sélectionnez une grille" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tout">Toutes les grilles</SelectItem>
                  <SelectItem value="axecom">Axecom</SelectItem>
                  <SelectItem value="ert">ERT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employee">Employé</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
            <div className="flex items-end gap-2">
              <Button
                onClick={clearFilters}
                className="flex-1 glass-card border border-white/20"
              >
                Effacer
              </Button>
            </div>
          </div>
          
          {/* Indicateur des filtres actifs */}
          {(startDate || endDate || selectedEmployee !== 'all' || selectedGrille !== 'tout') && (
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
                {selectedGrille !== 'tout' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Grille: {selectedGrille.toUpperCase()}
                  </Badge>
                )}
                {selectedEmployee !== 'all' && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Employé: {employees.find((emp: any) => emp.id.toString() === selectedEmployee)?.nom} {employees.find((emp: any) => emp.id.toString() === selectedEmployee)?.prenom}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recettes Totales</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(getTotalRecettes())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coûts Totaux</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(getTotalCouts())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bénéfice Net</p>
                  <p className={`text-2xl font-bold ${getBeneficeColor(getTotalBenefice())}`}>
                    {formatCurrency(getTotalBenefice())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Marge Moyenne</p>
                  <p className={`text-2xl font-bold ${getMargeColor(getMoyenneMarge())}`}>
                    {formatPercentage(getMoyenneMarge())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table du récap calcul */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 font-medium text-muted-foreground">Employé</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Recettes</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Carburant</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Matériel</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Impôts</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Pénalités</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Total Coûts</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Bénéfice Net</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Marge %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center p-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : recapData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Calculator className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Aucune donnée trouvée</p>
                        <p className="text-sm">
                          {startDate || endDate || selectedEmployee !== 'all' || selectedGrille !== 'tout'
                            ? 'Aucune donnée trouvée pour les critères sélectionnés'
                            : 'Aucune donnée disponible pour le calcul du récap'
                          }
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                recapData.map((employee: any) => (
                  <tr key={employee.employe_id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div className="font-medium">
                        {employee.employe_nom} {employee.employe_prenom}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.employe_matricule}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(employee.recettes_generes)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm text-red-600">
                        {formatCurrency(employee.cout_carburant)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm text-red-600">
                        {formatCurrency(employee.cout_materiel)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm text-red-600">
                        {formatCurrency(employee.cout_impots)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm text-red-600">
                        {formatCurrency(employee.cout_penalites)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(employee.total_couts)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-lg font-bold ${getBeneficeColor(employee.benefice_net)}`}>
                        {formatCurrency(employee.benefice_net)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge 
                        variant="secondary" 
                        className={`${getMargeColor(employee.marge_beneficiaire)} bg-opacity-20`}
                      >
                        {formatPercentage(employee.marge_beneficiaire)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
