"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Euro, 
  TrendingUp, 
  Users, 
  Calendar,
  Search,
  Download,
  RefreshCw
} from "lucide-react"

interface RevenueData {
  employe_id: number
  employe_nom: string
  employe_prenom: string
  matricule: string
  nombre_interventions: number
  total_recette_technicien: number
  total_recette_entreprise: number
  total_recette_generale: number
  interventions_detail: Array<{
    intervention_id: number
    num_inter: string
    client: string
    date_rdv: string
    articles: string
    recette_technicien: number
    recette_entreprise: number
    recette_totale: number
  }>
}

interface RevenueStats {
  total_interventions: number
  total_recette_technicien: number
  total_recette_entreprise: number
  total_recette_generale: number
}


interface RevenueCalculationProps {
  employees: any[]
}

export function RevenueCalculation({ employees }: RevenueCalculationProps) {
  // Fonction helper pour obtenir les dates du mois précédent
  const getDefaultDates = () => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // 0-11
    
    // Calculer le mois précédent
    let previousMonth = currentMonth - 1
    let yearForPreviousMonth = currentYear
    
    // Gérer le cas de janvier (mois 0) -> décembre de l'année précédente
    if (previousMonth < 0) {
      previousMonth = 11 // Décembre
      yearForPreviousMonth = currentYear - 1
    }
    
    // Premier jour du mois précédent
    const startMonth = (previousMonth + 1).toString().padStart(2, '0')
    const startYear = yearForPreviousMonth
    
    // Dernier jour du mois précédent
    const lastDay = new Date(yearForPreviousMonth, previousMonth + 1, 0).getDate()
    const endMonth = startMonth
    const endYear = yearForPreviousMonth
    
    return {
      start: `${startYear}-${startMonth}-01`,
      end: `${endYear}-${endMonth}-${lastDay.toString().padStart(2, '0')}`
    }
  }

  const defaultDates = getDefaultDates()
  
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [totalStats, setTotalStats] = useState<RevenueStats>({
    total_interventions: 0,
    total_recette_technicien: 0,
    total_recette_entreprise: 0,
    total_recette_generale: 0
  })
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState(defaultDates.start)
  const [dateTo, setDateTo] = useState(defaultDates.end)
  const [selectedGrille, setSelectedGrille] = useState<string>("all")
  const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null)

  const loadRevenueData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedEmployee !== "all") {
        params.append('employe_id', selectedEmployee)
      }
      if (dateFrom) {
        params.append('date_from', dateFrom)
      }
      if (dateTo) {
        params.append('date_to', dateTo)
      }
      if (selectedGrille !== "all") {
        params.append('grille', selectedGrille)
      }

      const response = await fetch(`/api/revenue-calculation?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setRevenueData(data.revenue_data)
        setTotalStats(data.total_stats)
      } else {
        console.error("Erreur lors du chargement des recettes:", data.error)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des recettes:", error)
    } finally {
      setLoading(false)
    }
  }

  const recalculateBeneficeBrut = async () => {
    if (!confirm('⚠️ Cette opération va recalculer TOUTES les recettes générées dans "Charges par Salarié" avec les tarifs corrigés (AXECOM/ERT).\n\nCela peut prendre plusieurs minutes.\n\nContinuer ?')) {
      return
    }

    setRecalculating(true)
    try {
      const response = await fetch('/api/sync/benefice-brut', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Recalcul terminé !\n\n` +
              `• ${data.synchronisations.length} enregistrements mis à jour\n` +
              `• ${data.employes_sans_match} employés non trouvés\n\n` +
              `Les données "Charges par Salarié" ont été synchronisées avec succès.`)
        // Recharger les données affichées
        await loadRevenueData()
      } else {
        alert(`❌ Erreur lors du recalcul:\n${data.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error("Erreur lors du recalcul:", error)
      alert(`❌ Erreur lors du recalcul:\n${error}`)
    } finally {
      setRecalculating(false)
    }
  }


  useEffect(() => {
    console.log('Changement de filtres détecté:', { selectedEmployee, dateFrom, dateTo, selectedGrille })
    loadRevenueData()
  }, [selectedEmployee, dateFrom, dateTo, selectedGrille])

  // Recharger les données quand on revient sur l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadRevenueData()
      }
    }

    const handleReloadRevenue = () => {
      console.log('🔄 Rechargement des recettes demandé...')
      loadRevenueData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('reloadRevenueData', handleReloadRevenue)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('reloadRevenueData', handleReloadRevenue)
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getEmployeeBadge = (employee: RevenueData) => {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="glass-card border border-white/20">
          {employee.matricule}
        </Badge>
        <span className="font-medium">
          {employee.employe_prenom} {employee.employe_nom}
        </span>
      </div>
    )
  }

  const toggleEmployeeDetails = (employeeId: number) => {
    setExpandedEmployee(expandedEmployee === employeeId ? null : employeeId)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalStats.total_interventions}</div>
            <div className="text-sm text-gray-600">Interventions Terminées</div>
          </CardContent>
        </Card>
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.total_recette_entreprise)}</div>
            <div className="text-sm text-gray-600">Recette Entreprise</div>
          </CardContent>
        </Card>
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalStats.total_recette_technicien)}</div>
            <div className="text-sm text-gray-600">Recette Technicien</div>
          </CardContent>
        </Card>
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalStats.total_recette_entreprise - totalStats.total_recette_technicien)}</div>
            <div className="text-sm text-gray-600">BÉNÉFICE BRUT</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="glass-card border border-white/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="employee">Technicien</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les techniciens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les techniciens</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.prenom} {employee.nom} ({employee.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFrom">Date de clôture - Début</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  console.log('Date début changée:', e.target.value)
                  setDateFrom(e.target.value)
                }}
                placeholder="Filtrer par date de clôture"
                className="glass-card border border-white/20"
              />
            </div>
            
            <div>
              <Label htmlFor="dateTo">Date de clôture - Fin</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  console.log('Date fin changée:', e.target.value)
                  setDateTo(e.target.value)
                }}
                placeholder="Filtrer par date de clôture"
                className="glass-card border border-white/20"
              />
            </div>
            
            <div>
              <Label htmlFor="grille">Grille</Label>
              <Select value={selectedGrille} onValueChange={setSelectedGrille}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les grilles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les grilles</SelectItem>
                  <SelectItem value="AXECOM MANCHE">AXECOM MANCHE</SelectItem>
                  <SelectItem value="ERT">ERT (Autres)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Actualisation avec dates:', { dateFrom, dateTo })
                  loadRevenueData()
                }}
                disabled={loading || recalculating}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                variant="default"
                onClick={recalculateBeneficeBrut}
                disabled={loading || recalculating}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                title="Recalculer toutes les recettes avec les tarifs AXECOM/ERT corrigés"
              >
                <TrendingUp className={`w-4 h-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalcul en cours...' : 'Recalculer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const dates = getDefaultDates()
                  setDateFrom(dates.start)
                  setDateTo(dates.end)
                  setSelectedEmployee("all")
                  setSelectedGrille("all")
                  console.log('Filtres réinitialisés avec dates du mois précédent:', dates)
                }}
                disabled={loading || recalculating}
                className="px-3"
                title="Réinitialiser les filtres"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des recettes */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recettes Générées par Technicien
          </CardTitle>
          <CardDescription>
            Calcul basé uniquement sur les interventions avec statut "CLOTURE TERMINEE" et leurs articles/services
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
              <p className="text-muted-foreground">Calcul des recettes en cours...</p>
            </div>
          ) : revenueData.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune recette trouvée</p>
              <p className="text-sm text-muted-foreground">
                Aucune intervention avec statut "CLOTURE TERMINEE" et des articles trouvée pour les critères sélectionnés.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="glass-card border border-white/20">
                    <TableHead>Technicien</TableHead>
                    <TableHead className="text-center">Interventions</TableHead>
                    <TableHead className="text-right">Recette Entreprise</TableHead>
                    <TableHead className="text-right">Recette Technicien</TableHead>
                    <TableHead className="text-right">Bénéfice Brut</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueData.map((employee) => (
                    <React.Fragment key={employee.employe_id}>
                      <TableRow className="hover:bg-white/5">
                        <TableCell>{getEmployeeBadge(employee)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="glass-card border border-white/20">
                            {employee.nombre_interventions}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          <div className="flex items-center justify-end gap-1">
                            <Euro className="w-3 h-3" />
                            {formatCurrency(employee.total_recette_entreprise)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-purple-600">
                          <div className="flex items-center justify-end gap-1">
                            <Euro className="w-3 h-3" />
                            {formatCurrency(employee.total_recette_technicien)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600">
                          <div className="flex items-center justify-end gap-1">
                            <Euro className="w-3 h-3" />
                            {formatCurrency(employee.total_recette_entreprise - employee.total_recette_technicien)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleEmployeeDetails(employee.employe_id)}
                          >
                            {expandedEmployee === employee.employe_id ? 'Masquer' : 'Détails'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      {/* Détails des interventions */}
                      {expandedEmployee === employee.employe_id && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <Card className="m-4 glass-card border border-white/20">
                              <CardHeader>
                                <CardTitle className="text-lg">
                                  Détail des interventions - {employee.employe_prenom} {employee.employe_nom}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {employee.interventions_detail.map((intervention) => (
                                    <div key={intervention.intervention_id} className="p-4 border border-white/10 rounded-lg">
                                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                                        <div>
                                          <div className="font-medium">{intervention.num_inter}</div>
                                          <div className="text-sm text-gray-600">{intervention.client}</div>
                                        </div>
                                        <div>
                                          <div className="text-sm text-gray-600">Date RDV</div>
                                          <div className="font-medium">{formatDate(intervention.date_rdv)}</div>
                                        </div>
                                        <div className="md:col-span-2">
                                          <div className="text-sm text-gray-600">Articles</div>
                                          <div className="font-medium">{intervention.articles}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">Entreprise</div>
                                          <div className="font-medium text-green-600">
                                            {formatCurrency(intervention.recette_entreprise)}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">Technicien</div>
                                          <div className="font-medium text-purple-600">
                                            {formatCurrency(intervention.recette_technicien)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
