"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, RefreshCw, TrendingUp, Calculator, DollarSign, TrendingDown, Users, BarChart3, Fuel, Zap, Wrench } from "lucide-react"
import { useAutoSync } from "@/hooks/useAutoSync"

interface RecapCalculData {
  employe_id: number
  employe_nom: string
  employe_prenom: string
  employe_matricule: string
  nombre_interventions: number
  total_recette_technicien: number
  total_recette_entreprise: number
  total_recla_free_confirmee?: number
  total_recla_free_entreprise?: number
  total_ftto_technicien?: number
  total_ftto_entreprise?: number
  nombre_transactions_carburant: number
  consommation_totale_carburant: number
  consommation_moyenne_carburant: number
  nombre_affectations_materiel: number
  quantite_totale_materiel: number
  valeur_totale_materiel: number
  prix_moyen_materiel: number
  ert_label: string
  axecom_label: string
}

interface ChargesData {
  month: number
  year: number
  total_fixed_costs: number
  total_variable_costs: number
  total_frais_entreprise: number
  total_charges: number
  nombre_charges_variables: number
  nombre_frais: number
}

interface ChargesSummary {
  totalChargesFixes: number
  totalChargesVariables: number
  totalFraisEntreprise: number
  totalChargesGlobal: number
  nombreMois: number
}

export function RecapCalculTable() {
  // Initialiser les dates pour le mois précédent complet
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
    const startDay = 1
    const startMonth = (previousMonth + 1).toString().padStart(2, '0') // +1 car les mois JS sont 0-11
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
  const [startDate, setStartDate] = useState(defaultDates.start)
  const [endDate, setEndDate] = useState(defaultDates.end)
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [selectedGrille, setSelectedGrille] = useState('tout')
  const [employees, setEmployees] = useState<any[]>([])
  const [chargesData, setChargesData] = useState<ChargesData[]>([])
  const [chargesSummary, setChargesSummary] = useState<ChargesSummary | null>(null)
  const [totalImpot, setTotalImpot] = useState(0)
  const [totalEntretiens, setTotalEntretiens] = useState(0)

  // Hook personnalisé pour la synchronisation automatique avec filtres
  const fetchRecapData = useCallback(async () => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (selectedEmployee !== 'all') params.append('employeId', selectedEmployee)
    // Passer le paramètre grille à l'API pour filtrer les interventions correctement
    if (selectedGrille && selectedGrille !== 'tout') {
      params.append('grille', selectedGrille)
    }

    const response = await fetch(`/api/recap-calcul?${params.toString()}`)
    if (!response.ok) throw new Error('Erreur lors du chargement du récap calcul')
    const data = await response.json()
    return data.recettesParTechnicien || []
  }, [startDate, endDate, selectedEmployee, selectedGrille])

  // Fonction pour récupérer les charges avec filtrage par grille
  const fetchChargesData = useCallback(async () => {
    if (!startDate || !endDate) return

    try {
      // Mapper selectedGrille vers l'attribution des charges
      let attribution = 'TOTAL'
      if (selectedGrille === 'AXECOM' || selectedGrille === 'axecom') {
        attribution = 'AXECOM'
      } else if (selectedGrille === 'ERT' || selectedGrille === 'ert') {
        attribution = 'ERT'
      }

      const response = await fetch(`/api/charges-totales?startDate=${startDate}&endDate=${endDate}&attribution=${attribution}`)
      if (!response.ok) throw new Error('Erreur lors du chargement des charges')
      const data = await response.json()
      setChargesData(data.chargesByMonth || [])
      setChargesSummary(data.summary || null)
    } catch (error) {
      console.error('Erreur chargement charges:', error)
    }
  }, [startDate, endDate, selectedGrille])

  // Utiliser le hook personnalisé avec les filtres
  const { data: rawRecapData, loading, triggerSync } = useAutoSync({
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

  // Fonction pour déterminer si un employé est ZOBAIR MOULAHI (cas spécial: toujours ERT)
  const isZobairMoulahi = (employee: any) => {
    const nom = employee.employe_nom || employee.nom || ''
    const prenom = employee.employe_prenom || employee.prenom || ''
    return (nom?.toUpperCase() === 'MOULAHI' && prenom?.toUpperCase() === 'ZOBAIR') ||
           (nom?.toUpperCase() === 'ZOBAIR' && prenom?.toUpperCase() === 'MOULAHI')
  }

  // Fonction pour déterminer la grille d'un employé basé sur recapData
  const getEmployeeGrille = useCallback((nom: string, prenom: string) => {
    // Cas spécial: ZOBAIR MOULAHI est toujours ERT
    if ((nom?.toUpperCase() === 'MOULAHI' && prenom?.toUpperCase() === 'ZOBAIR') ||
        (nom?.toUpperCase() === 'ZOBAIR' && prenom?.toUpperCase() === 'MOULAHI')) {
      return 'ert'
    }
    
    // Chercher dans rawRecapData pour trouver les labels de l'employé
    const employee: any = rawRecapData?.find((e: any) => 
      e.employe_nom?.toUpperCase() === nom?.toUpperCase() && 
      e.employe_prenom?.toUpperCase() === prenom?.toUpperCase()
    )
    
    if (!employee) return 'unknown'
    
    const hasErt = employee.ert_label === 'ERT'
    const hasAxecom = employee.axecom_label === 'AXECOM'
    
    if (hasErt && hasAxecom) return 'both'
    if (hasErt) return 'ert'
    if (hasAxecom) return 'axecom'
    return 'unknown'
  }, [rawRecapData])

  // Filtrer les données par grille côté client
  const recapData: any[] = useMemo(() => {
    if (!rawRecapData) return []
    if (selectedGrille === 'tout') return rawRecapData

    return rawRecapData.filter((employee: any) => {
      // Cas spécial: ZOBAIR MOULAHI est toujours ERT
      if (isZobairMoulahi(employee)) {
        return selectedGrille === 'ert'
      }
      
      // Sinon, filtrer par les labels ERT/AXECOM de l'API
      if (selectedGrille === 'ert') {
        return employee.ert_label === 'ERT'
      } else if (selectedGrille === 'axecom') {
        return employee.axecom_label === 'AXECOM'
      }
      return true
    })
  }, [rawRecapData, selectedGrille])

  // Fonction pour récupérer le total des entretiens véhicules avec filtrage par grille
  const fetchTotalEntretiens = useCallback(async () => {
    try {
      if (!startDate || !endDate) return
      
      // Utiliser la nouvelle API qui gère le filtrage par grille
      const response = await fetch(`/api/entretiens-vehicules/recap?startDate=${startDate}&endDate=${endDate}&grille=${selectedGrille}`)
      if (response.ok) {
        const data = await response.json()
        
        console.log('=== DEBUG ENTRETIENS AVEC GRILLE ===')
        console.log('Grille sélectionnée:', selectedGrille)
        console.log('Entretiens reçus:', data.entretiens?.length || 0)
        console.log('Total base:', data.total)
        console.log('Total filtré:', data.totalFiltre)
        
        // Utiliser le total filtré qui prend en compte l'appartenance grille
        setTotalEntretiens(data.totalFiltre || 0)
      } else {
        // Fallback vers l'ancienne API si la nouvelle échoue
        const fallbackResponse = await fetch('/api/entretiens-vehicules')
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json()
          const entretiens = data.entretiens || []
          
          const startDateStr = startDate.split('T')[0]
          const endDateStr = endDate.split('T')[0]
          
          const entretiensFiltres = entretiens.filter((entretien: any) => {
            if (!entretien.date_entretien) return false
            const dateEntretienStr = entretien.date_entretien.split('T')[0]
            return dateEntretienStr >= startDateStr && dateEntretienStr <= endDateStr
          })
          
          const total = entretiensFiltres.reduce((sum: number, entretien: any) => {
            const cout = parseFloat(entretien.cout_entretien) || parseFloat(entretien.cout) || 0
            return sum + cout
          }, 0)
          
          setTotalEntretiens(total)
        }
      }
    } catch (error) {
      console.error('Erreur chargement total entretiens:', error)
      setTotalEntretiens(0)
    }
  }, [startDate, endDate, selectedGrille])

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

  const fetchTotalImpot = useCallback(async () => {
    try {
      if (!startDate || !endDate) return
      
      const [year, month] = startDate.split('-')
      const response = await fetch(`/api/cout-par-salaire?mois=${month}&annee=${year}`)
      if (response.ok) {
        const data = await response.json()
        const total = (data.couts || []).reduce((sum: number, cout: any) => {
          // Filtrer par grille si sélectionnée
          if (selectedGrille !== 'tout') {
            const employeeGrille = getEmployeeGrille(cout.nom, cout.prenom)
            
            if (selectedGrille === 'ert' && employeeGrille !== 'ert' && employeeGrille !== 'both') {
              return sum // Ne pas compter cet employé
            }
            if (selectedGrille === 'axecom' && employeeGrille !== 'axecom' && employeeGrille !== 'both') {
              return sum // Ne pas compter cet employé
            }
          }
          
          const taxe = parseFloat(cout.taxe || 0)
          const charge = parseFloat(cout.charge || 0)
          
          // Si pourcentage_taxe = 0%, alors impôt = 0 (pas de charge pour l'entreprise)
          // Si pourcentage_taxe = 100%, alors impôt = charge complète
          // Si pourcentage_taxe = 50%, alors impôt = charge / 2
          // Sinon, calculer proportionnellement
          let impot = 0
          
          if (Math.abs(taxe - 0) < 0.01) {
            // 0% de taxe = 0 impôt (l'employé paye tout)
            impot = 0
          } else if (Math.abs(taxe - 100) < 0.01) {
            // 100% de taxe = charge complète
            impot = charge
          } else if (Math.abs(taxe - 50) < 0.01) {
            // 50% de taxe = moitié de la charge
            impot = charge / 2
          } else {
            // Autre pourcentage = proportionnel (formule inversée car taxe = ce que paie le technicien)
            // Si taxe = 30%, l'entreprise paye 70% donc impot = charge * (100 - taxe) / 100
            impot = charge * ((100 - taxe) / 100)
          }
          
          return sum + (isNaN(impot) ? 0 : impot)
        }, 0)
        setTotalImpot(total)
      }
    } catch (error) {
      console.error('Erreur chargement total impôt:', error)
      setTotalImpot(0)
    }
  }, [startDate, endDate, selectedGrille, getEmployeeGrille])

  // Charger les charges quand les dates changent
  useEffect(() => {
    if (startDate && endDate) {
      fetchChargesData()
      fetchTotalEntretiens()
    }
  }, [fetchChargesData, fetchTotalEntretiens, startDate, endDate, selectedGrille])

  // Charger le total impôt quand rawRecapData est disponible (pour le filtrage par grille)
  useEffect(() => {
    if (startDate && endDate && rawRecapData) {
      fetchTotalImpot()
    }
  }, [fetchTotalImpot, startDate, endDate, selectedGrille, rawRecapData])

  useEffect(() => {
    loadEmployees()
  }, [])

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
    return recapData.reduce((sum, item: any) => sum + (item.total_recette_technicien || 0), 0)
  }

  const getTotalRecettesEntreprise = () => {
    return recapData.reduce((sum, item: any) => sum + (item.total_recette_entreprise || 0), 0)
  }

  const getTotalReclaFree = () => {
    return recapData.reduce((sum, item: any) => sum + (item.total_recla_free_confirmee || 0), 0)
  }

  const getTotalReclaFreeEntreprise = () => {
    return recapData.reduce((sum, item: any) => sum + (item.total_recla_free_entreprise || 0), 0)
  }

  const getTotalFttoTechnicien = () => {
    return recapData.reduce((sum, item: any) => sum + (item.total_ftto_technicien || 0), 0)
  }

  const getTotalFttoEntreprise = () => {
    return recapData.reduce((sum, item: any) => sum + (item.total_ftto_entreprise || 0), 0)
  }

  const getBeneficeBrut = () => {
    // BÉNÉFICE NET = Recettes Entreprise - Recettes Technicien - Consommation Carburant - Valeur Matériel - Charges Totales - Total Impôt - Total Entretiens
    const recetteEntreprise = recapData.reduce((sum: number, item: any) => sum + (item.total_recette_entreprise || 0), 0)
    const recetteTechnicien = recapData.reduce((sum: number, item: any) => sum + (item.total_recette_technicien || 0), 0)
    const consommationCarburant = recapData.reduce((sum: number, item: any) => sum + (item.consommation_totale_carburant || 0), 0)
    const valeurMateriel = recapData.reduce((sum: number, item: any) => sum + (item.valeur_totale_materiel || 0), 0)
    const chargesTotales = chargesSummary?.totalChargesGlobal || 0
    
    return recetteEntreprise - recetteTechnicien - consommationCarburant - valeurMateriel - chargesTotales - totalImpot - totalEntretiens
  }

  const getTotalInterventions = () => {
    return recapData.reduce((sum, item: any) => sum + (item.nombre_interventions || 0), 0)
  }

  const getTotalBenefice = () => {
    return recapData.reduce((sum, item: any) => sum + (item.total_recette_technicien || 0), 0)
  }

  const getMoyenneMarge = () => {
    if (recapData.length === 0) return 0
    return 100 // Marge fixe pour l'instant
  }

  const getTotalConsommationCarburant = () => {
    return recapData.reduce((sum, item: any) => sum + (item.consommation_totale_carburant || 0), 0)
  }

  const getTotalTransactionsCarburant = () => {
    return recapData.reduce((sum, item: any) => sum + (item.nombre_transactions_carburant || 0), 0)
  }

  const getMoyenneConsommationCarburant = () => {
    const total = getTotalConsommationCarburant()
    const count = recapData.filter((item: any) => item.consommation_totale_carburant > 0).length
    return count > 0 ? total / count : 0
  }

  const getTotalAffectationsMateriel = () => {
    return recapData.reduce((sum, item: any) => sum + (item.nombre_affectations_materiel || 0), 0)
  }

  const getTotalQuantiteMateriel = () => {
    return recapData.reduce((sum, item: any) => sum + (item.quantite_totale_materiel || 0), 0)
  }

  const getTotalValeurMateriel = () => {
    return recapData.reduce((sum, item: any) => sum + (item.valeur_totale_materiel || 0), 0)
  }

  const getMoyennePrixMateriel = () => {
    if (recapData.length === 0) return 0
    const total = recapData.reduce((sum, item: any) => sum + (item.prix_moyen_materiel || 0), 0)
    return total / recapData.length
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

  const formatEmployeeName = (employee: any) => {
    const ertLabel = employee.ert_label || ''
    const axecomLabel = employee.axecom_label || ''
    
    let displayName = `${employee.employe_nom} ${employee.employe_prenom}`
    
    // Cas spécial: ZOBAIR MOULAHI (TECH_ZOBMO) est toujours ERT
    const isZobairMoulahi = 
      (employee.employe_nom?.toUpperCase() === 'MOULAHI' && employee.employe_prenom?.toUpperCase() === 'ZOBAIR') ||
      (employee.employe_nom?.toUpperCase() === 'ZOBAIR' && employee.employe_prenom?.toUpperCase() === 'MOULAHI')
    
    if (isZobairMoulahi) {
      return `[ERT] ${displayName}`
    }
    
    // Afficher la grille de l'employé devant le nom
    // Priorité: Si AXECOM uniquement -> [AXECOM], Si ERT uniquement -> [ERT], Si les deux -> [ERT/AXECOM]
    if (axecomLabel && ertLabel) {
      displayName = `[ERT/AXECOM] ${displayName}`
    } else if (axecomLabel) {
      displayName = `[AXECOM] ${displayName}`
    } else if (ertLabel) {
      displayName = `[ERT] ${displayName}`
    }
    
    return displayName
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
                Analyse des recettes par technicien : recettes technicien vs recettes entreprise
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recettes Technicien</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(Number(getTotalRecettes()))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recettes Entreprise</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {formatCurrency(Number(getTotalRecettesEntreprise()))}
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
                  <p className="text-sm text-muted-foreground">Interventions Totales</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {getTotalInterventions()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Carte Recla Free si > 0 */}
        {getTotalReclaFree() > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="glass-card border border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Calculator className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recla Free (part entreprise)</p>
                    <p className="text-2xl font-bold text-orange-500">
                      +{formatCurrency(getTotalReclaFreeEntreprise())}
                    </p>
                    <p className="text-xs text-muted-foreground">inclus dans Recettes Entreprise</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Carte FTTO si > 0 */}
        {getTotalFttoTechnicien() > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="glass-card border border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Calculator className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">FTTO (part techniciens 40%)</p>
                    <p className="text-2xl font-bold text-blue-500">
                      +{formatCurrency(getTotalFttoTechnicien())}
                    </p>
                    <p className="text-xs text-muted-foreground">inclus dans Recettes Techniciens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border border-indigo-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Calculator className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">FTTO (part entreprise 60%)</p>
                    <p className="text-2xl font-bold text-indigo-500">
                      +{formatCurrency(getTotalFttoEntreprise())}
                    </p>
                    <p className="text-xs text-muted-foreground">inclus dans Recettes Entreprise</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bénéfice Net</p>
                  <p className={`text-2xl font-bold ${getBeneficeColor(getBeneficeBrut())}`}>
                    {formatCurrency(Number(getBeneficeBrut()))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Fuel className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consommation Carburant</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(Number(getTotalConsommationCarburant()))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Calculator className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valeur Matériel</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {formatCurrency(Number(getTotalValeurMateriel()))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Charges Totales</p>
                  <p className="text-2xl font-bold text-gray-500">
                    {formatCurrency(Number(chargesSummary?.totalChargesGlobal || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/10 rounded-lg">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Impôt</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(Number(totalImpot))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Wrench className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entretiens</p>
                  <p className="text-2xl font-bold text-amber-500">
                    {formatCurrency(Number(totalEntretiens))}
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
                <th className="text-right p-3 font-medium text-muted-foreground">Interventions</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Recettes Technicien</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Recettes Entreprise</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Bénéfice Net</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Carburant</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Matériel</th>
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
              ) : recapData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
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
                recapData.map((employee: any) => {
                  // Bénéfice Net par employé = Recettes Entreprise - Recettes Technicien - Carburant - Matériel
                  // Note: Les charges totales ne sont pas réparties par employé car ce sont des charges globales
                  const beneficeNet = (employee.total_recette_entreprise || 0) - (employee.total_recette_technicien || 0) - (employee.consommation_totale_carburant || 0) - (employee.valeur_totale_materiel || 0)
                  return (
                    <tr key={employee.employe_id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3">
                        <div className="font-medium">
                          {formatEmployeeName(employee)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employe_matricule}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-medium text-blue-600">
                            {employee.nombre_interventions}
                          </span>
                          {(employee.total_recla_free_confirmee || 0) > 0 && (
                            <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                              +{formatCurrency(employee.total_recla_free_confirmee)} RF
                            </span>
                          )}
                          {(employee.total_ftto_technicien || 0) > 0 && (
                            <span className="text-xs font-semibold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                              +{formatCurrency(employee.total_ftto_technicien)} FTTO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(employee.total_recette_technicien)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm font-medium text-blue-600">
                          {formatCurrency(employee.total_recette_entreprise)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`text-sm font-medium ${getBeneficeColor(beneficeNet)}`}>
                          {formatCurrency(beneficeNet)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(employee.consommation_totale_carburant)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm font-medium text-purple-600">
                          {formatCurrency(employee.valeur_totale_materiel)}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  )
}
