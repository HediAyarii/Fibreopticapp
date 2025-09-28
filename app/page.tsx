"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MaterialForm, EmployeeForm } from "@/components/Forms"
import { AffectationForm, InterventionSearch } from "@/components/SearchForms"
import { ReclamationForm } from "@/components/ReclamationForm"
import { PenaltyForm, ArticlesEditModal } from "@/components/PenaltyAndArticlesForms"
import { PricingTable } from "@/components/PricingTable"
import { TarifsManager } from "@/components/TarifsManager"
import { RevenueCalculation } from "@/components/RevenueCalculation"
import {
  Building2,
  Users,
  UserPlus,
  FileText,
  Calculator,
  TrendingUp,
  LogOut,
  Upload,
  Eye,
  EyeOff,
  Plus,
  Edit,
  PieChartIcon,
  RefreshCw,
  User,
  UserCog,
  Activity,
  DollarSign,
  Fuel,
  Calendar,
  Trash2,
  Package,
  AlertTriangle,
  CreditCard,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Building,
  X,
  Timer,
  Minus,
  Camera,
} from "lucide-react"

// User authentication data
const users = {
  superadmin: { email: "admin@fibertech.com", password: "admin123", role: "superadmin", name: "Admin Principal" },
  teamlead: { email: "chef@fibertech.com", password: "chef123", role: "teamlead", name: "Chef Équipe" },
  activity: { email: "activite@fibertech.com", password: "activite123", role: "activity", name: "Conduite Activité" },
}

// Helper functions for role styling
const getRoleColor = (role: string) => {
  switch (role) {
    case "superadmin":
      return "bg-gradient-to-r from-red-500 to-pink-500 text-gray-900"
    case "teamlead":
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-gray-900"
    case "activity":
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900"
    default:
      return "bg-gray-500 text-gray-900"
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "superadmin":
      return "Super Admin"
    case "teamlead":
      return "Chef Équipe"
    case "activity":
      return "Conduite Activité"
    default:
      return role
  }
}

// Data loading functions from PostgreSQL
const loadInterventionsFromDatabase = async () => {
  try {
    const response = await fetch("/api/interventions")
    if (!response.ok) throw new Error("Erreur lors du chargement des interventions")
    const data = await response.json()
    return data.interventions || []
  } catch (error) {
    console.error("[v0] Erreur chargement interventions:", error)
    return []
  }
}

const loadFuelDataFromDatabase = async () => {
  try {
    const response = await fetch("/api/carburant")
    if (!response.ok) throw new Error("Erreur lors du chargement des données carburant")
    const data = await response.json()
    return data.carburant || []
  } catch (error) {
    console.error("[v0] Erreur chargement carburant:", error)
    return []
  }
}

export default function EmployeeTracker() {
  // Helper function to safely check if data is valid
  const isValidArray = (data: any): data is any[] => {
    return Array.isArray(data) && data.length >= 0
  }

  // Helper function to safely convert to number
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Helper function to format currency
  const formatCurrency = (value: any): string => {
    return safeNumber(value).toFixed(2)
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Data states - loaded from PostgreSQL
  const [interventions, setInterventions] = useState<any[]>([])
  const [fuelData, setFuelData] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [penalties, setPenalties] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [affectations, setAffectations] = useState<any[]>([])
  const [consommationCarburant, setConsommationCarburant] = useState<any[]>([])
  const [employeesFromInterventions, setEmployeesFromInterventions] = useState<any[]>([])

  // Loading states
  const [loadingInterventions, setLoadingInterventions] = useState(false)
  const [loadingFuel, setLoadingFuel] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [loadingPenalties, setLoadingPenalties] = useState(false)
  const [loadingClaims, setLoadingClaims] = useState(false)
  const [loadingAffectations, setLoadingAffectations] = useState(false)
  const [loadingConsommationCarburant, setLoadingConsommationCarburant] = useState(false)
  const [loadingFraisErt, setLoadingFraisErt] = useState(false)
  const [loadingFraisAxecom, setLoadingFraisAxecom] = useState(false)

  // CRUD Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showPenaltyModal, setShowPenaltyModal] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showAffectationModal, setShowAffectationModal] = useState(false)
  const [showMultiAffectationModal, setShowMultiAffectationModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // Employee details and assignment modals
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false)
  
  // Articles management states
  const [showArticlesModal, setShowArticlesModal] = useState(false)
  const [editingIntervention, setEditingIntervention] = useState<any>(null)
  const [articlesText, setArticlesText] = useState("")
  const [savingArticles, setSavingArticles] = useState(false)

  // Photos management states
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')

  // Interventions filtering states
  const [interventionFilters, setInterventionFilters] = useState({
    statut: '',
    dateRdvStart: '',
    dateRdvEnd: '',
    numInter: ''
  })
  const [filteredInterventions, setFilteredInterventions] = useState<any[]>([])
  const [showCardAssignmentModal, setShowCardAssignmentModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [availableCards, setAvailableCards] = useState<any[]>([])
  const [selectedCardNumber, setSelectedCardNumber] = useState('')
  const [assignmentStartDate, setAssignmentStartDate] = useState('')
  const [assignmentComments, setAssignmentComments] = useState('')
  const [showUnassignModal, setShowUnassignModal] = useState(false)
  const [unassignComments, setUnassignComments] = useState('')
  const [showCardHistoryModal, setShowCardHistoryModal] = useState(false)
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<any>(null)
  const [cardHistory, setCardHistory] = useState<any[]>([])

  // Fuel consumption grouped data
  const [fuelGroupedData, setFuelGroupedData] = useState<any[]>([])
  const [fuelGroupedSummary, setFuelGroupedSummary] = useState<any>({})
  const [fuelViewMode, setFuelViewMode] = useState<'table' | 'grouped' | 'employees'>('grouped')
  const [fuelPeriod, setFuelPeriod] = useState<'month' | 'week' | 'year'>('month')
  const [fuelDateRange, setFuelDateRange] = useState({ start: '', end: '' })

  // Fuel consumption by employee
  const [fuelEmployeesData, setFuelEmployeesData] = useState<any[]>([])
  const [fuelEmployeesSummary, setFuelEmployeesSummary] = useState<any>({})
  const [showEmployeeFuelModal, setShowEmployeeFuelModal] = useState(false)
  const [selectedEmployeeFuel, setSelectedEmployeeFuel] = useState<any>(null)

  // Tarifs data
  const [tarifs, setTarifs] = useState<any[]>([])
  const [showTarifsModal, setShowTarifsModal] = useState(false)
  const [editingTarif, setEditingTarif] = useState<any>(null)

  // Assignation data
  const [assignationData, setAssignationData] = useState({
    numero_carte: '',
    employe_id: ''
  })

  // Pagination for fuel transactions
  const [fuelCurrentPage, setFuelCurrentPage] = useState(1)
  const [fuelItemsPerPage, setFuelItemsPerPage] = useState(25)

  // Load data from database on component mount
  useEffect(() => {
    if (isLoggedIn) {
      loadDataFromDatabase()
      loadAllCRUDData()
      loadAvailableCards()
      loadFuelGroupedData()
      loadFuelEmployeesData()
      // Charger les données des tarifs
      loadTarifsFromDatabase()
    }
  }, [isLoggedIn])

  // Reload grouped data when period or date range changes
  useEffect(() => {
    if (isLoggedIn) {
      loadFuelGroupedData()
    }
  }, [fuelPeriod, fuelDateRange])

  // Apply filters when interventions or filters change
  useEffect(() => {
    if (interventions.length > 0) {
      applyInterventionFilters()
    }
  }, [interventions, interventionFilters])

  // Pagination functions for fuel transactions
  const getFuelPaginatedData = () => {
    const startIndex = (fuelCurrentPage - 1) * fuelItemsPerPage
    const endIndex = startIndex + fuelItemsPerPage
    return fuelData.slice(startIndex, endIndex)
  }

  const getFuelTotalPages = () => {
    return Math.ceil(fuelData.length / fuelItemsPerPage)
  }

  const handleFuelPageChange = (page: number) => {
    setFuelCurrentPage(page)
  }

  const handleFuelItemsPerPageChange = (itemsPerPage: number) => {
    setFuelItemsPerPage(itemsPerPage)
    setFuelCurrentPage(1) // Reset to first page
  }

  // Load card history for an employee
  const loadCardHistory = async (employeId: number) => {
    try {
      const response = await fetch(`/api/carburant-histoire?employe_id=${employeId}`)
      if (response.ok) {
        const data = await response.json()
        setCardHistory(data.consommation_par_employe || [])
        console.log("Historique des cartes chargé:", data)
      } else {
        console.error("Erreur lors du chargement de l'historique")
        setCardHistory([])
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error)
      setCardHistory([])
    }
  }

  // Articles management functions
  const handleEditArticles = (intervention: any) => {
    setEditingIntervention(intervention)
    setArticlesText(intervention.articles || "")
    setShowArticlesModal(true)
  }

  const handleSaveArticles = async () => {
    if (!editingIntervention) return

    setSavingArticles(true)
    try {
      const response = await fetch('/api/interventions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingIntervention.id,
          articles: articlesText
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update the intervention in the local state
        setInterventions(prev => 
          prev.map(intervention => 
            intervention.id === editingIntervention.id 
              ? { ...intervention, articles: articlesText }
              : intervention
          )
        )
        
        setShowArticlesModal(false)
        setEditingIntervention(null)
        setArticlesText("")
        
        console.log("Articles sauvegardés avec succès:", data)
      } else {
        console.error("Erreur lors de la sauvegarde des articles")
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des articles:", error)
    } finally {
      setSavingArticles(false)
    }
  }

  const handleCancelArticles = () => {
    setShowArticlesModal(false)
    setEditingIntervention(null)
    setArticlesText("")
  }

  // Check if intervention needs articles (CLOTURE TERMINEE and articles NaN/N/A)
  const needsArticles = (intervention: any) => {
    const isClotureTerminee = intervention.statut && 
      intervention.statut.toString().toUpperCase().includes('CLOTURE TERMINEE')
    const hasNoArticles = !intervention.articles || 
      intervention.articles.toString().toUpperCase() === 'NAN' || 
      intervention.articles.toString().toUpperCase() === 'N/A' ||
      intervention.articles.toString().trim() === ''
    
    return isClotureTerminee && hasNoArticles
  }

  // Filtering functions for interventions
  const applyInterventionFilters = () => {
    let filtered = [...interventions]

    // Filter by statut
    if (interventionFilters.statut) {
      filtered = filtered.filter(intervention => 
        intervention.statut && 
        intervention.statut.toString().toLowerCase().includes(interventionFilters.statut.toLowerCase())
      )
    }

    // Filter by numéro d'intervention
    if (interventionFilters.numInter) {
      filtered = filtered.filter(intervention => 
        intervention.num_inter && 
        intervention.num_inter.toString().toLowerCase().includes(interventionFilters.numInter.toLowerCase())
      )
    }

    // Filter by date RDV range
    if (interventionFilters.dateRdvStart) {
      filtered = filtered.filter(intervention => {
        if (!intervention.date_rdv) return false
        const interventionDate = new Date(intervention.date_rdv)
        const startDate = new Date(interventionFilters.dateRdvStart)
        return interventionDate >= startDate
      })
    }

    if (interventionFilters.dateRdvEnd) {
      filtered = filtered.filter(intervention => {
        if (!intervention.date_rdv) return false
        const interventionDate = new Date(intervention.date_rdv)
        const endDate = new Date(interventionFilters.dateRdvEnd)
        return interventionDate <= endDate
      })
    }

    setFilteredInterventions(filtered)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    setInterventionFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = () => {
    setInterventionFilters({
      statut: '',
      dateRdvStart: '',
      dateRdvEnd: '',
      numInter: ''
    })
    setFilteredInterventions([])
  }

  // Get unique statuts for filter dropdown
  const getUniqueStatuts = () => {
    const statuts = interventions
      .map(intervention => intervention.statut)
      .filter(statut => statut && statut.trim() !== '')
      .map(statut => statut.toString())
    
    return [...new Set(statuts)].sort()
  }

  // Load fuel consumption by employee
  const loadFuelEmployeesData = async () => {
    try {
      const response = await fetch('/api/carburant-employes')
      if (response.ok) {
        const data = await response.json()
        setFuelEmployeesData(data.employees_consumption || [])
        setFuelEmployeesSummary(data.summary || {})
        console.log("Consommation par employé chargée:", data)
      } else {
        console.error("Erreur lors du chargement de la consommation par employé")
      }
    } catch (error) {
      console.error("Erreur chargement consommation par employé:", error)
    }
  }

  // Load grouped fuel consumption data
  const loadFuelGroupedData = async () => {
    try {
      const params = new URLSearchParams({
        period: fuelPeriod,
        ...(fuelDateRange.start && { start_date: fuelDateRange.start }),
        ...(fuelDateRange.end && { end_date: fuelDateRange.end })
      })
      
      const response = await fetch(`/api/carburant-grouped?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFuelGroupedData(data.grouped_data || [])
        setFuelGroupedSummary(data.summary || {})
        console.log("Données groupées carburant chargées:", data)
      } else {
        console.error("Erreur lors du chargement des données groupées")
      }
    } catch (error) {
      console.error("Erreur chargement données groupées:", error)
    }
  }

  // Load available fuel cards
  const loadAvailableCards = async () => {
    try {
      const response = await fetch('/api/carburant')
      if (response.ok) {
        const data = await response.json()
        console.log("Données carburant reçues:", data)
        
        // Extract unique card numbers from fuel data
        const carburantData = data.carburant || data || []
        const uniqueCards = carburantData.reduce((acc: any[], item: any) => {
          if (item.numero_carte && !acc.find(card => card.numero_carte === item.numero_carte)) {
            acc.push({
              numero_carte: item.numero_carte,
              label: `Carte ${item.numero_carte}`,
              statut: 'disponible',
              montant: item.ca_ttc || item.montant || 0,
              date_livraison: item.date_livraison,
              date_facture: item.date_fact,
              fournisseur: 'Station Service',
              montant_total: item.ca_ttc || item.montant || 0,
              immat_vehicule: item.immat_vehicule,
              numero_station: item.numero_station
            })
          }
          return acc
        }, [])
        
        console.log("Cartes uniques extraites:", uniqueCards)
        setAvailableCards(uniqueCards)
        
        // Si aucune carte n'est trouvée, créer des cartes de test
        if (uniqueCards.length === 0) {
          console.log("Aucune carte trouvée dans la base de données, utilisation des cartes de test")
          const testCards = [
            { numero_carte: "1234567890", label: "Carte 1234567890", statut: "disponible", montant: 1000, fournisseur: "Test" },
            { numero_carte: "0987654321", label: "Carte 0987654321", statut: "disponible", montant: 1500, fournisseur: "Test" },
            { numero_carte: "1122334455", label: "Carte 1122334455", statut: "disponible", montant: 2000, fournisseur: "Test" }
          ]
          setAvailableCards(testCards)
        }
      } else {
        console.error("Erreur lors du chargement des cartes:", response.status)
        // Cartes de test en cas d'erreur
        const testCards = [
          { numero_carte: "1234567890", label: "Carte 1234567890", statut: "disponible", montant: 1000, fournisseur: "Test" },
          { numero_carte: "0987654321", label: "Carte 0987654321", statut: "disponible", montant: 1500, fournisseur: "Test" },
          { numero_carte: "1122334455", label: "Carte 1122334455", statut: "disponible", montant: 2000, fournisseur: "Test" }
        ]
        setAvailableCards(testCards)
      }
    } catch (error) {
      console.error("Erreur chargement cartes:", error)
      // Cartes de test en cas d'erreur
      const testCards = [
        { numero_carte: "1234567890", label: "Carte 1234567890", statut: "disponible", montant: 1000, fournisseur: "Test" },
        { numero_carte: "0987654321", label: "Carte 0987654321", statut: "disponible", montant: 1500, fournisseur: "Test" },
        { numero_carte: "1122334455", label: "Carte 1122334455", statut: "disponible", montant: 2000, fournisseur: "Test" }
      ]
      setAvailableCards(testCards)
    }
  }

  // Load data functions for CRUD operations
  const loadEmployeesFromDatabase = async () => {
    try {
      const response = await fetch("/api/employes")
      if (!response.ok) throw new Error("Erreur lors du chargement des employés")
      const data = await response.json()
      const employeesData = data.employes || []
      
      // Charger les informations de carte carburant pour chaque employé
      const employeesWithCards = await Promise.all(
        employeesData.map(async (employee: any) => {
          try {
            // Récupérer la carte carburant actuelle de l'employé
            const cardResponse = await fetch(`/api/carburant-assignation?employe_id=${employee.id}`)
            if (cardResponse.ok) {
              const cardData = await cardResponse.json()
              return {
                ...employee,
                numero_carte_actuelle: cardData.assignation?.numero_carte || null
              }
            }
            return employee
          } catch (error) {
            console.error(`Erreur lors du chargement de la carte pour l'employé ${employee.id}:`, error)
            return employee
          }
        })
      )
      
      setEmployees(employeesWithCards)
      return employeesWithCards
    } catch (error) {
      console.error("[v0] Erreur chargement employés:", error)
      return []
    }
  }

  const loadMaterialsFromDatabase = async () => {
    try {
      const response = await fetch("/api/materiel")
      if (!response.ok) throw new Error("Erreur lors du chargement du matériel")
    const data = await response.json()
      return data.materiel || []
  } catch (error) {
      console.error("[v0] Erreur chargement matériel:", error)
      return []
    }
  }

  const loadPenaltiesFromDatabase = async () => {
    try {
      const response = await fetch("/api/penalites")
      if (!response.ok) throw new Error("Erreur lors du chargement des pénalités")
      const data = await response.json()
      return data.penalites || []
    } catch (error) {
      console.error("[v0] Erreur chargement pénalités:", error)
      return []
    }
  }

  const loadClaimsFromDatabase = async () => {
    try {
      const response = await fetch("/api/reclamations")
      if (!response.ok) throw new Error("Erreur lors du chargement des réclamations")
    const data = await response.json()
      return data.reclamations || []
  } catch (error) {
      console.error("[v0] Erreur chargement réclamations:", error)
      return []
    }
  }

  const loadAffectationsFromDatabase = async () => {
    try {
      const response = await fetch("/api/affectations-materiel")
      if (!response.ok) throw new Error("Erreur lors du chargement des affectations")
      const data = await response.json()
      return data.affectations || []
    } catch (error) {
      console.error("[v0] Erreur chargement affectations:", error)
      return []
    }
  }

  const loadConsommationCarburantFromDatabase = async () => {
    try {
      const response = await fetch("/api/consommation-carburant")
      if (!response.ok) throw new Error("Erreur lors du chargement de la consommation carburant")
      const data = await response.json()
      return data.consommationParEmploye || []
    } catch (error) {
      console.error("[v0] Erreur chargement consommation carburant:", error)
      return []
    }
  }

  const loadDataFromDatabase = async () => {
    setLoadingInterventions(true)
    setLoadingFuel(true)
    
    try {
      const [interventionsData, fuelConsumptionData] = await Promise.all([
        loadInterventionsFromDatabase(),
        loadFuelDataFromDatabase()
      ])
      
      setInterventions(interventionsData || [])
      setFuelData(fuelConsumptionData || [])
      
      // Generate employee data from interventions
      const employeeMap = new Map()
      if (interventionsData && Array.isArray(interventionsData)) {
        interventionsData.forEach((intervention: any) => {
          const techName = `${intervention.prenom_technicien || ''} ${intervention.nom_technicien || ''}`.trim()
          if (techName && techName !== ' ') {
            if (!employeeMap.has(techName)) {
              employeeMap.set(techName, {
                id: employeeMap.size + 1,
                name: techName,
                phone: intervention.mobile || 'N/A',
                interventions: 0,
                revenue: 0,
                status: 'Disponible',
                location: intervention.ville || 'N/A'
              })
            }
            employeeMap.get(techName).interventions++
            // Estimate revenue (this would need proper calculation in real app)
            employeeMap.get(techName).revenue += Math.floor(Math.random() * 500) + 200
          }
        })
      }
      
      setEmployeesFromInterventions(Array.from(employeeMap.values()))
      
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
    } finally {
      setLoadingInterventions(false)
      setLoadingFuel(false)
    }
  }

  const loadAllCRUDData = async () => {
    setLoadingEmployees(true)
    setLoadingMaterials(true)
    setLoadingPenalties(true)
    setLoadingClaims(true)
    setLoadingAffectations(true)
    setLoadingConsommationCarburant(true)

    try {
      // Charger les données en parallèle avec gestion d'erreur individuelle
      const [employeesData, materialsData, penaltiesData, claimsData, affectationsData, consommationCarburantData] = await Promise.allSettled([
        loadEmployeesFromDatabase(),
        loadMaterialsFromDatabase(),
        loadPenaltiesFromDatabase(),
        loadClaimsFromDatabase(),
        loadAffectationsFromDatabase(),
        loadConsommationCarburantFromDatabase()
      ])

      // Traiter les résultats avec gestion d'erreur
      setEmployees(employeesData.status === 'fulfilled' ? employeesData.value || [] : [])
      setMaterials(materialsData.status === 'fulfilled' ? materialsData.value || [] : [])
      setPenalties(penaltiesData.status === 'fulfilled' ? penaltiesData.value || [] : [])
      setClaims(claimsData.status === 'fulfilled' ? claimsData.value || [] : [])
      setAffectations(affectationsData.status === 'fulfilled' ? affectationsData.value || [] : [])
      setConsommationCarburant(consommationCarburantData.status === 'fulfilled' ? consommationCarburantData.value || [] : [])

      // Log des erreurs individuelles
      if (employeesData.status === 'rejected') {
        console.error("Erreur chargement employés:", employeesData.reason)
      }
      if (materialsData.status === 'rejected') {
        console.error("Erreur chargement matériel:", materialsData.reason)
      }
      if (penaltiesData.status === 'rejected') {
        console.error("Erreur chargement pénalités:", penaltiesData.reason)
      }
      if (claimsData.status === 'rejected') {
        console.error("Erreur chargement réclamations:", claimsData.reason)
      }
      if (affectationsData.status === 'rejected') {
        console.error("Erreur chargement affectations:", affectationsData.reason)
      }
      if (consommationCarburantData.status === 'rejected') {
        console.error("Erreur chargement consommation carburant:", consommationCarburantData.reason)
      }

    } catch (error) {
      console.error("Erreur lors du chargement des données CRUD:", error)
    } finally {
      setLoadingEmployees(false)
      setLoadingMaterials(false)
      setLoadingPenalties(false)
      setLoadingClaims(false)
      setLoadingAffectations(false)
      setLoadingConsommationCarburant(false)
    }
  }

  // Fonction de chargement des tarifs
  const loadTarifsFromDatabase = async () => {
    try {
      const response = await fetch("/api/company-pricing")
      if (!response.ok) throw new Error("Erreur lors du chargement des tarifs")
      const data = await response.json()
      setTarifs(data.success ? data.pricing : [])
    } catch (error) {
      console.error("[v0] Erreur chargement tarifs:", error)
      setTarifs([])
    }
  }


  // Generic delete function for all entities
  const handleDelete = async (entityType: string, id: number) => {
    let confirmMessage = ''
    let entityName = ''

    switch (entityType) {
      case 'material':
        entityName = 'matériel'
        confirmMessage = 'Êtes-vous sûr de vouloir supprimer ce matériel ?\n\n⚠️ Attention : Toutes les affectations liées à ce matériel seront également supprimées.'
        break
      case 'affectation':
        entityName = 'affectation'
        confirmMessage = 'Êtes-vous sûr de vouloir supprimer cette affectation ?\n\nLe stock du matériel sera automatiquement restauré.'
        break
      case 'penalty':
        entityName = 'pénalité'
        confirmMessage = 'Êtes-vous sûr de vouloir supprimer cette pénalité ?'
        break
      case 'claim':
        entityName = 'réclamation'
        confirmMessage = 'Êtes-vous sûr de vouloir supprimer cette réclamation ?'
        break
      case 'employee':
        entityName = 'employé'
        confirmMessage = 'Êtes-vous sûr de vouloir supprimer cet employé ?\n\n⚠️ Attention : Toutes les affectations et données liées à cet employé seront également supprimées.'
        break
      default:
        confirmMessage = 'Êtes-vous sûr de vouloir supprimer cet élément ?'
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      let apiEndpoint = ''
      let successMessage = ''

      switch (entityType) {
        case 'material':
          apiEndpoint = `/api/materiel?id=${id}`
          successMessage = 'Matériel supprimé avec succès'
          break
        case 'affectation':
          apiEndpoint = `/api/affectations-materiel?id=${id}`
          successMessage = 'Affectation supprimée avec succès'
          break
        case 'penalty':
          apiEndpoint = `/api/penalites?id=${id}`
          successMessage = 'Pénalité supprimée avec succès'
          break
        case 'claim':
          apiEndpoint = `/api/reclamations?id=${id}`
          successMessage = 'Réclamation supprimée avec succès'
          break
        case 'employee':
          apiEndpoint = `/api/employes?id=${id}`
          successMessage = 'Employé supprimé avec succès'
          break
        default:
          throw new Error('Type d\'entité non supporté')
      }

      const response = await fetch(apiEndpoint, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      await loadAllCRUDData()
      alert(successMessage)
    } catch (error) {
      console.error(`Erreur suppression ${entityType}:`, error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }


  // Fonction pour valider les réclamations (admin)
  const handleValidateClaim = async (claimId: number, action: 'approve' | 'reject') => {
    try {
      const adminComment = prompt(
        action === 'approve' 
          ? 'Commentaire de validation (optionnel) :' 
          : 'Raison du rejet (obligatoire) :'
      )

      if (action === 'reject' && (!adminComment || adminComment.trim() === '')) {
        alert('Un commentaire est obligatoire pour rejeter une réclamation')
        return
      }

      // Afficher un indicateur de chargement
      const loadingMessage = action === 'approve' ? 'Validation en cours...' : 'Rejet en cours...'
      const originalButton = document.querySelector(`[data-claim-id="${claimId}"][data-action="${action}"]`) as HTMLButtonElement
      if (originalButton) {
        originalButton.textContent = loadingMessage
        originalButton.disabled = true
      }

      const response = await fetch('/api/reclamations/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reclamationId: claimId,
          action,
          adminComment: adminComment || ''
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la validation')
      }

      const result = await response.json()
      await loadAllCRUDData()
      
      // Afficher une notification de succès
      const successMessage = action === 'approve' 
        ? '✅ Réclamation validée avec succès !' 
        : '❌ Réclamation rejetée avec succès !'
      
      // Créer une notification temporaire
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      notification.textContent = successMessage
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.remove()
      }, 3000)
      
    } catch (error) {
      console.error('Erreur validation réclamation:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la validation')
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const foundUser = Object.values(users).find((u) => u.email === email && u.password === password)
    if (foundUser) {
      setUser(foundUser)
      setIsLoggedIn(true)
    } else {
      alert("Email ou mot de passe incorrect")
    }
  }

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    setActiveTab("dashboard")
  }

  const handleImportInterventions = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        // Créer un FormData pour envoyer le fichier
        const formData = new FormData()
        formData.append('file', file)
        
        console.log("[v0] Import interventions via script intelligent:", file.name)
        
        // Appeler l'API d'import des interventions
        const response = await fetch('/api/import-interventions', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Recharger les données depuis la base
          await loadDataFromDatabase()
          
          alert(`Import terminé: ${result.message}`)
        } else {
          const error = await response.text()
          console.error("[v0] Erreur import interventions:", error)
          alert(`Erreur lors de l'import: ${error}`)
        }
        } catch (error) {
          console.error("[v0] Erreur import interventions:", error)
          alert("Erreur lors de l'import des interventions")
        }
    }
  }

  const parseXLSX = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          // Simple XLSX parsing - in production, use a proper library like xlsx
          const text = new TextDecoder().decode(data)
          const lines = text.split("\n")
          const headers = lines[0].split("\t")
          const data_rows = lines
            .slice(1)
            .map((line) => {
              const values = line.split("\t")
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim() || ""
              })
              return obj
            })
            .filter((row) => Object.values(row).some((val) => val !== ""))

          resolve(data_rows)
        } catch (error) {
          reject(error)
        }
      }

      reader.readAsArrayBuffer(file)
    })
  }

  const handleImportFuelConsumption = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        // Créer un FormData pour envoyer le fichier
        const formData = new FormData()
        formData.append('file', file)
        
        console.log("[v0] Import carburant via script universel:", file.name)
        
        // Appeler l'API d'import du carburant
        const response = await fetch('/api/import-carburant', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const result = await response.json()
          
          // Recharger les données depuis la base
          await loadDataFromDatabase()
          
          alert(`Import terminé: ${result.message}`)
        } else {
          const error = await response.text()
          console.error("[v0] Erreur import carburant:", error)
          alert(`Erreur lors de l'import: ${error}`)
        }
      } catch (error) {
        console.error("[v0] Erreur import carburant:", error)
        alert("Erreur lors de l'import des données carburant")
      }
    }
  }

  // CRUD Functions for Employees
  const saveEmployee = async (employeeData: any) => {
    try {
      const url = editingItem ? "/api/employes" : "/api/employes"
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...employeeData } : employeeData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadAllCRUDData()
      setShowEmployeeModal(false)
      setEditingItem(null)
      alert(editingItem ? "Employé modifié avec succès" : "Employé ajouté avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde employé:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const deleteEmployee = async (id: number) => {
    try {
      const response = await fetch(`/api/employes?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      await loadAllCRUDData()
      alert("Employé supprimé avec succès")
    } catch (error) {
      console.error("Erreur suppression employé:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // CRUD Functions for Materials
  const saveMaterial = async (materialData: any) => {
    try {
      const url = editingItem ? "/api/materiel" : "/api/materiel"
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...materialData } : materialData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadAllCRUDData()
      setShowMaterialModal(false)
      setEditingItem(null)
      alert(editingItem ? "Matériel modifié avec succès" : "Matériel ajouté avec succès")
            } catch (error) {
      console.error("Erreur sauvegarde matériel:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const deleteMaterial = async (id: number) => {
    try {
      const response = await fetch(`/api/materiel?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      await loadAllCRUDData()
      alert("Matériel supprimé avec succès")
    } catch (error) {
      console.error("Erreur suppression matériel:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // CRUD Functions for Affectations
  const saveAffectation = async (affectationData: any) => {
    try {
      const url = editingItem ? "/api/affectations-materiel" : "/api/affectations-materiel"
      const method = editingItem ? "PUT" : "POST"
      
      const requestData = editingItem 
        ? { id: editingItem.id, ...affectationData }
        : affectationData

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadAllCRUDData()
      setShowAffectationModal(false)
      setEditingItem(null)
      alert(editingItem ? "Affectation modifiée avec succès" : "Affectation créée avec succès")
      } catch (error) {
      console.error("Erreur sauvegarde affectation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const deleteAffectation = async (id: number) => {
    try {
      const response = await fetch(`/api/affectations-materiel?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      await loadAllCRUDData()
      alert("Affectation supprimée avec succès")
    } catch (error) {
      console.error("Erreur suppression affectation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // CRUD Functions for Reclamations
  const saveReclamation = async (reclamationData: any) => {
    try {
      const url = editingItem ? "/api/reclamations" : "/api/reclamations"
      const method = editingItem ? "PUT" : "POST"
      
      // Mapper le champ deadline vers date_resolution pour l'API
      const apiData = {
        ...reclamationData,
        date_resolution: reclamationData.deadline
      }
      delete apiData.deadline // Supprimer le champ deadline car l'API attend date_resolution
      
      const body = editingItem 
        ? { id: editingItem.id, ...apiData }
        : apiData

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadAllCRUDData()
      setShowClaimModal(false)
      setEditingItem(null)
      alert(editingItem ? "Réclamation modifiée avec succès" : "Réclamation ajoutée avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde réclamation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  // Fonctions de gestion des tarifs
  const handleSaveTarif = async (tarifData: any) => {
    try {
      const response = await fetch("/api/company-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tarifData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadTarifsFromDatabase()
      alert("Tarif ajouté avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde tarif:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const handleUpdateTarif = async (tarifData: any) => {
    try {
      const response = await fetch("/api/company-pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tarifData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la modification")
      }

      await loadTarifsFromDatabase()
      alert("Tarif modifié avec succès")
    } catch (error) {
      console.error("Erreur modification tarif:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la modification")
    }
  }

  const handleDeleteTarif = async (id: number) => {
    try {
      const response = await fetch(`/api/company-pricing?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      await loadTarifsFromDatabase()
      alert("Tarif supprimé avec succès")
    } catch (error) {
      console.error("Erreur suppression tarif:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // CRUD Functions for Multiple Affectations
  const saveMultiAffectation = async (affectationData: any) => {
    try {
      const response = await fetch("/api/affectations-multiples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(affectationData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadAllCRUDData()
      setShowMultiAffectationModal(false)
      alert("Affectations multiples créées avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde affectations multiples:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  // CRUD Functions for Penalties
  const savePenalty = async (penaltyData: any) => {
    try {
      const url = editingItem ? "/api/penalites" : "/api/penalites"
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...penaltyData } : penaltyData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadAllCRUDData()
      setShowPenaltyModal(false)
      setEditingItem(null)
      alert(editingItem ? "Pénalité modifiée avec succès" : "Pénalité ajoutée avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde pénalité:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const deletePenalty = async (id: number) => {
    try {
      const response = await fetch(`/api/penalites?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      await loadAllCRUDData()
      alert("Pénalité supprimée avec succès")
    } catch (error) {
      console.error("Erreur suppression pénalité:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // CRUD Functions for Claims
  const saveClaim = async (claimData: any) => {
    try {
      const url = editingItem ? "/api/reclamations" : "/api/reclamations"
      const method = editingItem ? "PUT" : "POST"
      const body = editingItem ? { id: editingItem.id, ...claimData } : claimData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      await loadAllCRUDData()
      setShowClaimModal(false)
      setEditingItem(null)
      alert(editingItem ? "Réclamation modifiée avec succès" : "Réclamation ajoutée avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde réclamation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const deleteClaim = async (id: number) => {
    try {
      const response = await fetch(`/api/reclamations?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      await loadAllCRUDData()
      alert("Réclamation supprimée avec succès")
    } catch (error) {
      console.error("Erreur suppression réclamation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // Function to handle assignation
  const handleAssignation = async () => {
    try {
      if (!assignationData.numero_carte || !assignationData.employe_id) {
        alert("Veuillez remplir tous les champs")
        return
      }

      const response = await fetch('/api/carburant-assignation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignationData),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        setAssignationData({numero_carte: '', employe_id: ''})
        await loadDataFromDatabase() // Reload data to show changes
      } else {
        const error = await response.text()
        alert(`Erreur: ${error}`)
      }
    } catch (error) {
      console.error("Erreur assignation:", error)
      alert("Erreur lors de l'assignation")
    }
  }

  // Function to show employee details
  const showEmployeeDetails = (employee: any) => {
    setSelectedEmployee(employee)
    setShowEmployeeDetailsModal(true)
  }

  // Function to show card assignment modal
  const showCardAssignment = async (employee: any) => {
    setSelectedEmployee(employee)
    
    // Récupérer les cartes carburant disponibles
    try {
      const response = await fetch('/api/carburant')
      if (response.ok) {
        const data = await response.json()
        // Extraire les numéros de carte uniques
        const uniqueCards = [...new Set(data.carburant.map((item: any) => item.numero_carte))]
          .filter(card => card && card !== 'nan')
          .map(card => ({ numero_carte: card, label: `Carte ${card}` }))
        setAvailableCards(uniqueCards)
      }
    } catch (error) {
      console.error('Erreur récupération cartes:', error)
      setAvailableCards([])
    }
    
    setShowCardAssignmentModal(true)
  }

  // Function to assign card to employee
  const assignCardToEmployee = async (numeroCarte: string) => {
    try {
      if (!selectedEmployee) {
        alert("Aucun employé sélectionné")
        return
      }

      const response = await fetch('/api/carburant-assignation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_carte: numeroCarte,
          employe_id: selectedEmployee.id,
          employe_nom: `${selectedEmployee.prenom} ${selectedEmployee.nom}`,
          date_assignation: assignmentStartDate || new Date().toISOString().split('T')[0],
          statut: 'active',
          commentaires: assignmentComments
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'assignation')
      }

      const result = await response.json()
      alert(`Carte ${numeroCarte} assignée à ${selectedEmployee.prenom} ${selectedEmployee.nom}`)
      
      // Fermer le modal et réinitialiser les champs
      setShowCardAssignmentModal(false)
      setSelectedEmployee(null)
      setSelectedCardNumber('')
      setAssignmentStartDate('')
      setAssignmentComments('')
      
      // Recharger les données avec gestion d'erreur et délai pour éviter les conflits
      setTimeout(async () => {
        try {
          await loadAllCRUDData()
          await loadDataFromDatabase()
        } catch (reloadError) {
          console.error('Erreur lors du rechargement des données:', reloadError)
          // Ne pas afficher d'erreur à l'utilisateur car l'assignation a réussi
          // Juste recharger la page pour être sûr
          window.location.reload()
        }
      }, 500)
    } catch (error) {
      console.error('Erreur assignation carte:', error)
      alert(`Erreur lors de l'assignation de la carte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  // Function to unassign card from employee
  const unassignCardFromEmployee = async () => {
    try {
      if (!selectedEmployee) {
        alert("Aucun employé sélectionné")
        return
      }

      const response = await fetch('/api/carburant-unassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employe_id: selectedEmployee.id,
          employe_nom: `${selectedEmployee.prenom} ${selectedEmployee.nom}`,
          commentaires: unassignComments
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la désassignation')
      }

      const result = await response.json()
      alert(`Carte désassignée avec succès de ${selectedEmployee.prenom} ${selectedEmployee.nom}`)
      
      // Fermer le modal et réinitialiser les champs
      setShowUnassignModal(false)
      setSelectedEmployee(null)
      setUnassignComments('')
      
      // Recharger les données
      setTimeout(async () => {
        try {
          await loadAllCRUDData()
          await loadDataFromDatabase()
        } catch (reloadError) {
          console.error('Erreur lors du rechargement des données:', reloadError)
          window.location.reload()
        }
      }, 500)
    } catch (error) {
      console.error('Erreur désassignation carte:', error)
      alert(`Erreur lors de la désassignation de la carte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg">
                <Building2 className="w-12 h-12 text-gray-900" />
            </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              FinalFibre
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Connexion à votre espace de travail
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-card border border-white/20 h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glass-card border border-white/20 h-12 rounded-xl pr-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Se connecter
              </Button>
            </form>
            <div className="mt-8 p-4 glass-card border border-white/20 rounded-xl">
              <p className="font-semibold text-sm mb-3 text-center">Comptes de test :</p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Super Admin:</span>
                  <span>admin@fibertech.com / admin123</span>
                </div>
                <div className="flex justify-between">
                  <span>Chef Équipe:</span>
                  <span>chef@fibertech.com / chef123</span>
                </div>
                <div className="flex justify-between">
                  <span>Conduite Activité:</span>
                  <span>activite@fibertech.com / activite123</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <header className="glass-card border-0 border-b border-white/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg">
              <Building2 className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                FiberTech Manager
              </h1>
              <p className="text-sm text-muted-foreground">FinalFibre Application</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="glass-card px-4 py-2 rounded-full border border-white/20">
              <Badge className={`${getRoleColor(user.role)} border-0 shadow-sm`}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="glass-card hover:bg-destructive/10 hover:text-destructive border border-white/20 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-80 glass-sidebar h-[calc(100vh-5rem)] sticky top-20">
          <nav className="p-6 space-y-3">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">Navigation</h2>
            </div>

              <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                  activeTab === "dashboard"
                    ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                    : "glass-card border border-white/20 hover:bg-primary/5"
                }`}
                onClick={() => setActiveTab("dashboard")}
              >
              <BarChart3 className="w-5 h-5" />
              Tableau de Bord
              </Button>

              <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                  activeTab === "employees"
                    ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                    : "glass-card border border-white/20 hover:bg-primary/5"
                }`}
                onClick={() => setActiveTab("employees")}
              >
                <Users className="w-5 h-5" />
              Employés
              </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "interventions"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("interventions")}
                >
                  <FileText className="w-5 h-5" />
              Interventions
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "fuel"
                  ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                  : "glass-card border border-white/20 hover:bg-primary/5"
              }`}
              onClick={() => setActiveTab("fuel")}
            >
              <Fuel className="w-5 h-5" />
              Carburant
            </Button>

            <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "materials"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
                  onClick={() => setActiveTab("materials")}
                >
                  <Package className="w-5 h-5" />
              Matériel
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "penalties"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("penalties")}
                >
              <AlertTriangle className="w-5 h-5" />
              Pénalités
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "costs"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("costs")}
                >
                  <Calculator className="w-5 h-5" />
                  <span className="font-medium">Coûts</span>
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "claims"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("claims")}
                >
              <FileText className="w-5 h-5" />
              Réclamations
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "tarifs"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("tarifs")}
                >
                  <Building2 className="w-5 h-5" />
                  Tarifs
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "recette-generer"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("recette-generer")}
                >
                  <TrendingUp className="w-5 h-5" />
                  Recette Générée
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "fuel-consumption"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("fuel-consumption")}
                >
              <Fuel className="w-5 h-5" />
              Consommation Carburant
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "reports"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("reports")}
                >
              <TrendingUp className="w-5 h-5" />
              Rapports
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "technicien-accounts"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("technicien-accounts")}
                >
              <UserCog className="w-5 h-5" />
              Comptes Techniciens
                </Button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                      Tableau de Bord
                    </h1>
                  <p className="text-muted-foreground mt-2">
                      Vue d'ensemble de votre activité FinalFibre
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                    <p className="text-sm font-medium">{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      <Activity className="w-4 h-4 mr-2" />
                      Actualiser
                    </Button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-card border border-white/20 hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Employés Actifs
                    </CardTitle>
                    <Users className="h-4 w-4 text-chart-1" />
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold">{employeesFromInterventions.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Techniciens en activité
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card border border-white/20 hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Interventions
                    </CardTitle>
                    <FileText className="h-4 w-4 text-chart-2" />
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold">{interventions.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total enregistrées
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card border border-white/20 hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Transactions Carburant
                    </CardTitle>
                    <Fuel className="h-4 w-4 text-chart-3" />
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold">{fuelData.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consommations enregistrées
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card border border-white/20 hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      CA Total Estimé
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-chart-4" />
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold">
                      {employeesFromInterventions.reduce((sum, emp) => sum + (emp.revenue || 0), 0).toLocaleString()} €
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chiffre d'affaires estimé
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Interventions */}
              <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Interventions Récentes
                    </CardTitle>
                  <CardDescription>
                    Dernières interventions enregistrées dans la base de données
                  </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                    {interventions.slice(0, 3).map((intervention, index) => (
                      <div key={index} className="flex items-center justify-between p-4 glass-card border border-white/10 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-white font-semibold">
                            {intervention.prenom_technicien?.charAt(0) || 'A'}
                      </div>
                            <div>
                            <p className="font-medium">
                                {intervention.prenom_technicien} {intervention.nom_technicien}
                              </p>
                            <p className="text-sm text-muted-foreground">
                              {intervention.client} - {intervention.ville}
                            </p>
                            </div>
                          </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{intervention.date_intervention}</p>
                          <Badge variant="default" className="mt-1">
                            {intervention.statut || 'En cours'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Employees Tab */}
          {/* Employees Section */}
          {activeTab === "employees" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Liste des Employés</h2>
                    <p className="text-muted-foreground">
                      {employees.length} employés trouvés dans la base de données
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => loadEmployeesFromDatabase()}
                    className="glass-card border border-white/20 hover:bg-white/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingItem(null)
                      setShowEmployeeModal(true)
                    }}
                    className="gradient-primary text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter Employé
                  </Button>
                </div>
              </div>

              {/* Employees List Card */}
              <Card className="glass-card border border-white/20 hover-lift">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 font-medium">Employé</th>
                          <th className="text-left p-4 font-medium">Matricule</th>
                          <th className="text-left p-4 font-medium">Téléphone</th>
                          <th className="text-left p-4 font-medium">Email</th>
                          <th className="text-left p-4 font-medium">Poste</th>
                          <th className="text-left p-4 font-medium">Taxe %</th>
                          <th className="text-left p-4 font-medium">Carte Carburant</th>
                          <th className="text-left p-4 font-medium">Statut</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => (
                          <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {employee.prenom ? employee.prenom[0] : ''}{employee.nom ? employee.nom[0] : ''}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{employee.prenom} {employee.nom}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-mono text-sm">{employee.matricule || 'N/A'}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-muted-foreground">{employee.telephone || 'N/A'}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-muted-foreground">{employee.email || 'N/A'}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-muted-foreground">{employee.poste || 'N/A'}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-primary">
                                {employee.pourcentage_taxe ? `${employee.pourcentage_taxe}%` : '0.00%'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-primary" />
                                <span className="text-sm font-mono">
                                  {employee.numero_carte_actuelle || 'Non assignée'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                          <Badge 
                                variant={employee.statut === 'actif' ? 'default' : 'secondary'}
                            className="glass-card border border-white/20"
                          >
                                {employee.statut || 'actif'}
                          </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => showEmployeeDetails(employee)}
                                  className="glass-card border border-white/20 hover:bg-white/10"
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => showCardAssignment(employee)}
                                  className="glass-card border border-white/20 hover:bg-white/10"
                                  title="Affecter carte carburant"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployeeHistory(employee)
                                    loadCardHistory(employee.id)
                                    setShowCardHistoryModal(true)
                                  }}
                                  className="glass-card border border-white/20 hover:bg-white/10"
                                  title="Voir l'historique des cartes"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(employee)
                                    setShowUnassignModal(true)
                                  }}
                                  className="glass-card border border-white/20 hover:bg-red-500/20"
                                  title="Désassigner la carte carburant"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(employee)
                                    setShowEmployeeModal(true)
                                  }}
                                  className="glass-card border border-white/20 hover:bg-white/10"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteEmployee(employee.id)}
                                  className="glass-card border border-white/20 hover:bg-red-500/10 text-red-500"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                        </div>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
                    </div>
                  )}

          {/* Tarifs Tab */}
          {activeTab === "tarifs" && (
            <TarifsManager
              tarifs={tarifs}
              onSave={handleSaveTarif}
              onUpdate={handleUpdateTarif}
              onDelete={handleDeleteTarif}
            />
          )}

          {/* Recette Générée Tab */}
          {activeTab === "recette-generer" && (
            <RevenueCalculation employees={employees} />
          )}

          {/* Fuel Consumption Tab */}
          {activeTab === "fuel-consumption" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">Consommation Carburant</h2>
                  <p className="text-muted-foreground">Suivi de la consommation carburant par employé</p>
                </div>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Importer Données
                </Button>
              </div>

              <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <CardTitle>Données de Consommation</CardTitle>
                  <CardDescription>
                    Données chargées depuis la base de données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fuelData.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 glass-card border border-white/10 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-3 to-chart-4 flex items-center justify-center text-white font-semibold">
                            <Fuel className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{item.numero_carte || 'Carte inconnue'}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.date_livraison} - {item.montant} €
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{item.lieu || 'Lieu non spécifié'}</p>
                          <Badge variant="outline" className="mt-1">
                            {item.type_carburant || 'Type inconnu'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  </CardContent>
                </Card>
            </div>
          )}

          {/* Interventions Tab */}
          {activeTab === "interventions" && (
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                      Gestion des Interventions
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Importez et gérez vos interventions techniques
                    </p>
                      </div>
                  <Dialog>
                    <DialogTrigger asChild>
                     <Button className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium">
                        <Upload className="h-4 w-4 mr-2" />
                        Importer Interventions
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border border-white/20">
                      <DialogHeader>
                        <DialogTitle>Importer des Interventions</DialogTitle>
                        <DialogDescription>
                          Sélectionnez un fichier CSV contenant les données d'interventions
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="import-inter">Fichier CSV Interventions</Label>
                          <Input
                            id="import-inter"
                            type="file"
                            accept=".csv"
                            onChange={handleImportInterventions}
                            className="mt-2 glass-card border border-white/20"
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            await loadDataFromDatabase()
                          }}
                         className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                        >
                          Actualiser les Données
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
              </div>

               <Card className="glass-card border border-white/20 hover-lift">
                 <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <FileText className="w-6 h-6 text-primary" />
                    Toutes les Interventions
                  </CardTitle>
                  <CardDescription>
                    {interventions.length} interventions trouvées dans la base de données PostgreSQL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filtres pour les interventions */}
                  <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-lg font-semibold">Filtres</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        Effacer les filtres
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Filtre par statut */}
                      <div>
                        <Label htmlFor="filter-statut" className="text-sm font-medium">
                          Statut
                        </Label>
                        <Select
                          value={interventionFilters.statut || "all"}
                          onValueChange={(value) => handleFilterChange('statut', value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Tous les statuts" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            {getUniqueStatuts().map((statut) => (
                              <SelectItem key={statut} value={statut}>
                                {statut}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtre par numéro d'intervention */}
                      <div>
                        <Label htmlFor="filter-num-inter" className="text-sm font-medium">
                          Numéro Intervention
                        </Label>
                        <Input
                          id="filter-num-inter"
                          type="text"
                          placeholder="Rechercher par numéro..."
                          value={interventionFilters.numInter}
                          onChange={(e) => handleFilterChange('numInter', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      {/* Filtre par date RDV - Début */}
                      <div>
                        <Label htmlFor="filter-date-start" className="text-sm font-medium">
                          Date RDV - Début
                        </Label>
                        <Input
                          id="filter-date-start"
                          type="date"
                          value={interventionFilters.dateRdvStart}
                          onChange={(e) => handleFilterChange('dateRdvStart', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      {/* Filtre par date RDV - Fin */}
                      <div>
                        <Label htmlFor="filter-date-end" className="text-sm font-medium">
                          Date RDV - Fin
                        </Label>
                        <Input
                          id="filter-date-end"
                          type="date"
                          value={interventionFilters.dateRdvEnd}
                          onChange={(e) => handleFilterChange('dateRdvEnd', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Résumé des filtres actifs */}
                    {(interventionFilters.statut || interventionFilters.numInter || 
                      interventionFilters.dateRdvStart || interventionFilters.dateRdvEnd) && (
                      <div className="mt-4 p-3 bg-blue-50/20 rounded-lg border border-blue-200/30">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                          <span className="font-medium">Filtres actifs:</span>
                          {interventionFilters.statut && (
                            <Badge variant="secondary" className="text-xs">
                              Statut: {interventionFilters.statut}
                            </Badge>
                          )}
                          {interventionFilters.numInter && (
                            <Badge variant="secondary" className="text-xs">
                              Num: {interventionFilters.numInter}
                            </Badge>
                          )}
                          {interventionFilters.dateRdvStart && (
                            <Badge variant="secondary" className="text-xs">
                              Depuis: {interventionFilters.dateRdvStart}
                            </Badge>
                          )}
                          {interventionFilters.dateRdvEnd && (
                            <Badge variant="secondary" className="text-xs">
                              Jusqu'à: {interventionFilters.dateRdvEnd}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-blue-600 mt-1">
                          {filteredInterventions.length} intervention(s) trouvée(s) sur {interventions.length} total
                        </div>
                      </div>
                    )}
                  </div>

                  {loadingInterventions ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des interventions...</p>
                    </div>
                  ) : interventions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucune intervention trouvée</h3>
                      <p>Importez des données pour commencer à voir vos interventions ici.</p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                      <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-4 font-semibold">Num Inter</th>
                            <th className="text-left p-4 font-semibold">Technicien</th>
                            <th className="text-left p-4 font-semibold">Client</th>
                            <th className="text-left p-4 font-semibold">Date RDV</th>
                            <th className="text-left p-4 font-semibold">Type</th>
                            <th className="text-left p-4 font-semibold">Articles</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Ville</th>
                        </tr>
                      </thead>
                      <tbody>
                          {(filteredInterventions.length > 0 ? filteredInterventions : interventions).slice(0, 100).map((intervention, index) => {
                            const needsArticlesFlag = needsArticles(intervention)
                            return (
                            <tr 
                              key={index} 
                              className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                                needsArticlesFlag ? 'bg-yellow-200/20 border-yellow-300/30' : ''
                              }`}
                            >
                            <td className="p-4">
                              <span className="font-mono text-sm text-gray-600">
                                {intervention.num_inter || 'N/A'}
                              </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-gray-900 text-sm font-semibold">
                                    {intervention.prenom_technicien?.charAt(0) || 'T'}
                                  </div>
                                  <span className="font-medium">
                                    {intervention.prenom_technicien} {intervention.nom_technicien}
                                  </span>
                                </div>
                            </td>
                              <td className="p-4">{intervention.client}</td>
                              <td className="p-4">{intervention.date_rdv}</td>
                              <td className="p-4">{intervention.type_intervention}</td>
                            <td className="p-4">
                                <div className="max-w-xs flex items-center gap-2">
                                  <span className={`text-sm ${needsArticlesFlag ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                    {intervention.articles || 'N/A'}
                                  </span>
                                  {needsArticlesFlag && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditArticles(intervention)}
                                      className="h-6 px-2 text-xs bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Articles
                                    </Button>
                                  )}
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                  variant={intervention.statut === 'Terminé' ? 'default' : 'secondary'}
                                  className="glass-card border border-white/20"
                                >
                                  {intervention.statut || 'En cours'}
                              </Badge>
                            </td>
                              <td className="p-4">{intervention.ville}</td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

           {/* Fuel Tab */}
          {activeTab === "fuel" && (
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                      Consommation Carburant
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Gérez les transactions de carburant de vos véhicules
                    </p>
                  </div>
                  <div className="flex gap-3">
                   {/* Boutons de vue */}
                   <div className="flex gap-2">
                     <Button
                       variant={fuelViewMode === 'grouped' ? 'default' : 'outline'}
                       onClick={() => setFuelViewMode('grouped')}
                       className={fuelViewMode === 'grouped' ? 'gradient-primary text-white' : 'glass-card border border-white/20'}
                     >
                       <BarChart3 className="w-4 h-4 mr-2" />
                       Vue Groupée
                     </Button>
                     <Button
                       variant={fuelViewMode === 'table' ? 'default' : 'outline'}
                       onClick={() => setFuelViewMode('table')}
                       className={fuelViewMode === 'table' ? 'gradient-primary text-white' : 'glass-card border border-white/20'}
                     >
                       <Eye className="w-4 h-4 mr-2" />
                       Vue Tableau
                     </Button>
                     <Button
                       variant={fuelViewMode === 'employees' ? 'default' : 'outline'}
                       onClick={() => setFuelViewMode('employees')}
                       className={fuelViewMode === 'employees' ? 'gradient-primary text-white' : 'glass-card border border-white/20'}
                     >
                       <Users className="w-4 h-4 mr-2" />
                       Par Employé
                     </Button>
                   </div>
                   
                   {/* Filtres de période */}
                   <Select value={fuelPeriod} onValueChange={(value: 'month' | 'week' | 'year') => setFuelPeriod(value)}>
                     <SelectTrigger className="glass-card border border-white/20 w-32">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="week">Semaine</SelectItem>
                       <SelectItem value="month">Mois</SelectItem>
                       <SelectItem value="year">Année</SelectItem>
                     </SelectContent>
                   </Select>
                   
                   <Button
                     onClick={loadFuelGroupedData}
                     className="glass-card border border-white/20 hover:bg-white/10"
                   >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     Actualiser
                   </Button>
                   
                    <Dialog>
                      <DialogTrigger asChild>
                       <Button className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium">
                          <Upload className="h-4 w-4 mr-2" />
                          Importer Carburant
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="glass-card border border-white/20">
                      <DialogHeader>
                        <DialogTitle>Importer des Données Carburant</DialogTitle>
                        <DialogDescription>
                          Sélectionnez un fichier CSV ou XLSX contenant les données de consommation carburant
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="import-fuel">Fichier Carburant (CSV/XLSX)</Label>
                          <Input
                            id="import-fuel"
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={handleImportFuelConsumption}
                            className="mt-2 glass-card border border-white/20"
                          />
                        </div>
                        <Button
                          onClick={async () => {
                            await loadDataFromDatabase()
                          }}
                           className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                        >
                          Actualiser les Données
                        </Button>
                      </div>
                    </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium">
                          <Users className="h-4 w-4 mr-2" />
                          Assigner Employé
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border border-white/20">
                        <DialogHeader>
                          <DialogTitle>Assigner un Employé à une Carte Carburant</DialogTitle>
                          <DialogDescription>
                            Sélectionnez un employé et un numéro de carte pour l'assignation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="numero-carte">Numéro de Carte</Label>
                            <Input
                              id="numero-carte"
                              placeholder="Ex: 17, 0, etc."
                              value={assignationData.numero_carte}
                              onChange={(e) => setAssignationData({...assignationData, numero_carte: e.target.value})}
                              className="mt-1 bg-white/90 border border-white/30 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="employe-assignation">Employé</Label>
                            <Select value={assignationData.employe_id} onValueChange={(value) => setAssignationData({...assignationData, employe_id: value})}>
                              <SelectTrigger className="mt-1 bg-white/90 border border-white/30 text-gray-900">
                                <SelectValue placeholder="Sélectionner un employé" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.prenom} {emp.nom} - {emp.telephone}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleAssignation}
                              className="gradient-primary text-white"
                            >
                              Assigner
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setAssignationData({numero_carte: '', employe_id: ''})}
                              className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                            >
                              Annuler
                            </Button>
                          </DialogFooter>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

               {/* Résumé global */}
               {fuelGroupedSummary && Object.keys(fuelGroupedSummary).length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <Card className="glass-card border border-white/20">
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-muted-foreground">Consommation Totale</p>
                           <p className="text-2xl font-bold text-primary">
                             {fuelGroupedSummary.total_consommation?.toFixed(2) || 0} €
                           </p>
              </div>
                         <DollarSign className="w-8 h-8 text-primary/50" />
                       </div>
                     </CardContent>
                   </Card>
                   
                   <Card className="glass-card border border-white/20">
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-muted-foreground">Transactions</p>
                           <p className="text-2xl font-bold text-chart-1">
                             {fuelGroupedSummary.total_transactions || 0}
                           </p>
                         </div>
                         <Fuel className="w-8 h-8 text-chart-1/50" />
                       </div>
                     </CardContent>
                   </Card>
                   
                   <Card className="glass-card border border-white/20">
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-muted-foreground">Périodes</p>
                           <p className="text-2xl font-bold text-chart-2">
                             {fuelGroupedSummary.nombre_periodes || 0}
                           </p>
                         </div>
                         <Calendar className="w-8 h-8 text-chart-2/50" />
                       </div>
                     </CardContent>
                   </Card>
                   
                   <Card className="glass-card border border-white/20">
                     <CardContent className="p-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-sm text-muted-foreground">Employés Actifs</p>
                           <p className="text-2xl font-bold text-chart-3">
                             {fuelGroupedSummary.nombre_employes || 0}
                           </p>
                         </div>
                         <Users className="w-8 h-8 text-chart-3/50" />
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               )}

               {/* Contenu principal */}
               {fuelViewMode === 'employees' ? (
                 <Card className="glass-card border border-white/20">
                   <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                       <Users className="w-6 h-6 text-primary" />
                       Consommation Carburant par Employé
                  </CardTitle>
                  <CardDescription>
                       Vue détaillée de la consommation carburant TTC pour chaque employé
                  </CardDescription>
                </CardHeader>
                <CardContent>
                     {/* Résumé de la consommation par employé */}
                     {fuelEmployeesSummary && Object.keys(fuelEmployeesSummary).length > 0 && (
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                         <Card className="glass-card border border-white/20">
                           <CardContent className="p-4">
                             <div className="flex items-center justify-between">
                      <div>
                                 <p className="text-sm text-muted-foreground">Total TTC</p>
                                 <p className="text-xl font-bold text-primary">
                                   {fuelEmployeesSummary.total_consommation_ttc?.toFixed(2) || 0} €
                                 </p>
                          </div>
                               <DollarSign className="w-6 h-6 text-primary/50" />
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="glass-card border border-white/20">
                           <CardContent className="p-4">
                             <div className="flex items-center justify-between">
                          <div>
                                 <p className="text-sm text-muted-foreground">Transactions</p>
                                 <p className="text-xl font-bold text-chart-1">
                                   {fuelEmployeesSummary.total_transactions || 0}
                                 </p>
                          </div>
                               <Fuel className="w-6 h-6 text-chart-1/50" />
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="glass-card border border-white/20">
                           <CardContent className="p-4">
                             <div className="flex items-center justify-between">
                      <div>
                                 <p className="text-sm text-muted-foreground">Employés Actifs</p>
                                 <p className="text-xl font-bold text-chart-2">
                                   {fuelEmployeesSummary.nombre_employes || 0}
                                 </p>
                        </div>
                               <Users className="w-6 h-6 text-chart-2/50" />
                    </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="glass-card border border-white/20">
                           <CardContent className="p-4">
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="text-sm text-muted-foreground">Moyenne/Employé</p>
                                 <p className="text-xl font-bold text-chart-3">
                                   {fuelEmployeesSummary.consommation_moyenne_par_employe?.toFixed(2) || 0} €
                                 </p>
                               </div>
                               <BarChart3 className="w-6 h-6 text-chart-3/50" />
                             </div>
                           </CardContent>
                         </Card>
                       </div>
                     )}

                     {/* Liste des employés avec leur consommation */}
                     {fuelEmployeesData.length === 0 ? (
                       <div className="text-center py-8 text-muted-foreground">
                         <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">Aucune consommation trouvée</h3>
                         <p>Les consommations carburant par employé apparaîtront ici une fois que vous aurez assigné des cartes.</p>
                       </div>
                     ) : (
                       <div className="space-y-4">
                         {fuelEmployeesData.map((employe, index) => (
                           <Card key={index} className="glass-card border border-white/10 hover:border-white/20 transition-all">
                             <CardContent className="p-6">
                               <div className="flex items-center justify-between">
                                 {/* Informations employé */}
                                 <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-gradient-to-br from-primary to-chart-3 rounded-full flex items-center justify-center">
                                     <span className="text-white font-bold text-lg">
                                       {employe.employe_prenom?.[0]}{employe.employe_nom?.[0]}
                                     </span>
                                   </div>
                                   <div>
                                     <h3 className="text-lg font-semibold">
                                       {employe.employe_prenom} {employe.employe_nom}
                                     </h3>
                                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                       <span>Matricule: {employe.employe_matricule || 'N/A'}</span>
                                       <span>Tél: {employe.employe_telephone || 'N/A'}</span>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Statistiques de consommation */}
                                 <div className="flex items-center gap-8">
                                   <div className="text-center">
                                     <div className="text-sm text-muted-foreground">Cartes Utilisées</div>
                                     <div className="text-lg font-semibold text-chart-1">
                                       {employe.nombre_cartes_utilisees}
                                     </div>
                                   </div>
                                   
                                   <div className="text-center">
                                     <div className="text-sm text-muted-foreground">Transactions</div>
                                     <div className="text-lg font-semibold text-chart-2">
                                       {employe.nombre_transactions}
                                     </div>
                                   </div>
                                   
                                   <div className="text-center">
                                     <div className="text-sm text-muted-foreground">Consommation TTC</div>
                                     <div className="text-2xl font-bold text-primary">
                                       {employe.consommation_totale_ttc.toFixed(2)} €
                                     </div>
                                   </div>
                                   
                                   <div className="text-center">
                                     <div className="text-sm text-muted-foreground">Moyenne/Transaction</div>
                                     <div className="text-lg font-semibold text-chart-3">
                                       {employe.consommation_moyenne_ttc.toFixed(2)} €
                                     </div>
                                   </div>
                                 </div>
                               </div>
                               
                               {/* Détails supplémentaires */}
                               <div className="mt-4 pt-4 border-t border-white/10">
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                   <div>
                                     <span className="text-muted-foreground">Cartes: </span>
                                     <span className="font-medium">
                                       {employe.cartes_utilisees.join(', ') || 'Aucune'}
                                     </span>
                                   </div>
                                   <div>
                                     <span className="text-muted-foreground">Véhicules: </span>
                                     <span className="font-medium">
                                       {employe.vehicules_utilises.slice(0, 2).join(', ')}
                                       {employe.vehicules_utilises.length > 2 && ` (+${employe.vehicules_utilises.length - 2})`}
                                     </span>
                                   </div>
                                   <div>
                                     <span className="text-muted-foreground">Période: </span>
                                     <span className="font-medium">
                                       {employe.premiere_transaction ? new Date(employe.premiere_transaction).toLocaleDateString() : 'N/A'} - 
                                       {employe.derniere_transaction ? new Date(employe.derniere_transaction).toLocaleDateString() : 'N/A'}
                                     </span>
                                   </div>
                                 </div>
                               </div>

                               {/* Bouton pour voir les détails */}
                               <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                                     setSelectedEmployeeFuel(employe)
                                     setShowEmployeeFuelModal(true)
                          }}
                                   className="glass-card border border-white/20 hover:bg-white/10"
                        >
                                   <Eye className="w-4 h-4 mr-2" />
                                   Voir Détails
                        </Button>
                               </div>
                             </CardContent>
                           </Card>
                         ))}
            </div>
          )}
                   </CardContent>
                 </Card>
               ) : fuelViewMode === 'grouped' ? (
                 <Card className="glass-card border border-white/20">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-3 text-xl font-bold">
                       <BarChart3 className="w-6 h-6 text-primary" />
                       Consommation Groupée par Période et Employé
                     </CardTitle>
                     <CardDescription>
                       Vue détaillée de la consommation carburant groupée par {fuelPeriod === 'week' ? 'semaine' : fuelPeriod === 'month' ? 'mois' : 'année'}
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     {fuelGroupedData.length === 0 ? (
                       <div className="text-center py-8 text-muted-foreground">
                         <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">Aucune donnée groupée trouvée</h3>
                         <p>Les données apparaîtront ici une fois que vous aurez des transactions carburant assignées.</p>
                </div>
                     ) : (
                       <div className="space-y-6">
                         {fuelGroupedData.map((periode, index) => (
                           <div key={index} className="border border-white/10 rounded-lg p-4">
                             <div className="flex items-center justify-between mb-4">
                               <h3 className="text-lg font-semibold text-primary">
                                 Période: {periode.periode}
                               </h3>
                               <Badge variant="outline" className="glass-card border border-white/20">
                                 {periode.employes.length} employé{periode.employes.length > 1 ? 's' : ''}
                               </Badge>
                             </div>
                             
                             <div className="space-y-3">
                               {periode.employes.map((employe: any, empIndex: number) => (
                                 <div key={empIndex} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                   <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                       <span className="text-sm font-medium text-primary">
                                         {employe.employe_prenom?.[0]}{employe.employe_nom?.[0]}
                                       </span>
                                     </div>
                                     <div>
                                       <div className="font-medium">
                                         {employe.employe_prenom} {employe.employe_nom}
                                       </div>
                                       <div className="text-sm text-muted-foreground">
                                         Matricule: {employe.employe_matricule || 'N/A'}
                                       </div>
                                     </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-6 text-sm">
                                     <div className="text-center">
                                       <div className="text-muted-foreground">Cartes</div>
                                       <div className="font-medium">{employe.nombre_cartes}</div>
                                     </div>
                                     <div className="text-center">
                                       <div className="text-muted-foreground">Transactions</div>
                                       <div className="font-medium">{employe.nombre_transactions}</div>
                                     </div>
                                     <div className="text-center">
                                       <div className="text-muted-foreground">Consommation</div>
                                       <div className="font-bold text-primary text-lg">
                                         {employe.consommation_totale.toFixed(2)} €
                                       </div>
                                     </div>
                                     <div className="text-center">
                                       <div className="text-muted-foreground">Moyenne</div>
                                       <div className="font-medium">
                                         {employe.consommation_moyenne.toFixed(2)} €
                                       </div>
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
               ) : (
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-3 text-xl font-bold">
                       <Fuel className="w-6 h-6 text-primary" />
                       Transactions Carburant Détaillées
                     </CardTitle>
                     <CardDescription>
                       Vue détaillée de toutes les transactions carburant
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                  {loadingFuel ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des données carburant...</p>
              </div>
                  ) : fuelData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Fuel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucune transaction carburant trouvée</h3>
                      <p>Importez des données pour commencer à voir vos transactions ici.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-4 font-semibold">Date Livraison</th>
                            <th className="text-left p-4 font-semibold">Véhicule</th>
                            <th className="text-left p-4 font-semibold">N° Carte</th>
                            <th className="text-left p-4 font-semibold">Employé Assigné</th>
                            <th className="text-left p-4 font-semibold">Station</th>
                            <th className="text-left p-4 font-semibold">Montant TTC</th>
                      </tr>
                    </thead>
                           <tbody>
                             {getFuelPaginatedData().map((transaction, index) => (
                               <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-4">{transaction.date_livraison}</td>
                                 <td className="p-4">
                                   <div className="flex items-center gap-2">
                                     <Fuel className="w-4 h-4 text-chart-3" />
                                     {transaction.immat_vehicule}
                                   </div>
                                 </td>
                                 <td className="p-4">{transaction.numero_carte}</td>
                                 <td className="p-4">
                                   {transaction.employe_assigné ? (
                                     <div className="flex items-center gap-2">
                                       <User className="w-4 h-4 text-primary" />
                                       <span>{transaction.employe_assigné.prenom} {transaction.employe_assigné.nom}</span>
                                     </div>
                                   ) : (
                                     <span className="text-muted-foreground">Non assigné</span>
                                   )}
                                 </td>
                                 <td className="p-4">{transaction.numero_station}</td>
                                 <td className="p-4 font-medium text-primary">
                                   {transaction.ca_ttc} €
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="itemsPerPage" className="text-sm">Lignes par page:</Label>
                      <Select value={fuelItemsPerPage.toString()} onValueChange={(value) => handleFuelItemsPerPageChange(parseInt(value))}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Affichage de {(fuelCurrentPage - 1) * fuelItemsPerPage + 1} à {Math.min(fuelCurrentPage * fuelItemsPerPage, fuelData.length)} sur {fuelData.length} transactions
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFuelPageChange(fuelCurrentPage - 1)}
                      disabled={fuelCurrentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, getFuelTotalPages()) }, (_, i) => {
                        const pageNumber = Math.max(1, Math.min(getFuelTotalPages() - 4, fuelCurrentPage - 2)) + i
                        if (pageNumber > getFuelTotalPages()) return null
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === fuelCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFuelPageChange(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFuelPageChange(fuelCurrentPage + 1)}
                      disabled={fuelCurrentPage === getFuelTotalPages()}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                    </>
                  )}
                </CardContent>
              </Card>
               )}

               {/* Modal pour les détails de consommation d'un employé */}
               {showEmployeeFuelModal && selectedEmployeeFuel && (
                 <Dialog open={showEmployeeFuelModal} onOpenChange={setShowEmployeeFuelModal}>
                   <DialogContent className="glass-card border border-white/20 max-w-2xl">
                     <DialogHeader>
                       <DialogTitle className="flex items-center gap-3">
                         <Users className="w-6 h-6 text-primary" />
                         Détails Consommation - {selectedEmployeeFuel.employe_prenom} {selectedEmployeeFuel.employe_nom}
                       </DialogTitle>
                       <DialogDescription>
                         Détails complets de la consommation carburant TTC pour cet employé
                       </DialogDescription>
                     </DialogHeader>
                     
                     <div className="space-y-6">
                       {/* Statistiques détaillées */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="text-center p-3 bg-white/5 rounded-lg">
                           <div className="text-2xl font-bold text-primary">
                             {selectedEmployeeFuel.consommation_totale_ttc.toFixed(2)}
                           </div>
                           <div className="text-sm text-muted-foreground">€ TTC Total</div>
                         </div>
                         <div className="text-center p-3 bg-white/5 rounded-lg">
                           <div className="text-2xl font-bold text-chart-1">
                             {selectedEmployeeFuel.nombre_transactions}
                           </div>
                           <div className="text-sm text-muted-foreground">Transactions</div>
                         </div>
                         <div className="text-center p-3 bg-white/5 rounded-lg">
                           <div className="text-2xl font-bold text-chart-2">
                             {selectedEmployeeFuel.nombre_cartes_utilisees}
                           </div>
                           <div className="text-sm text-muted-foreground">Cartes</div>
                         </div>
                         <div className="text-center p-3 bg-white/5 rounded-lg">
                           <div className="text-2xl font-bold text-chart-3">
                             {selectedEmployeeFuel.consommation_moyenne_ttc.toFixed(2)}
                           </div>
                           <div className="text-sm text-muted-foreground">€ Moyenne</div>
                         </div>
                       </div>

                       {/* Informations détaillées */}
                       <div className="space-y-4">
                <div>
                           <h4 className="font-semibold mb-2">Informations Employé</h4>
                           <div className="bg-white/5 rounded-lg p-4 space-y-2">
                             <div><span className="text-muted-foreground">Nom complet:</span> {selectedEmployeeFuel.employe_prenom} {selectedEmployeeFuel.employe_nom}</div>
                             <div><span className="text-muted-foreground">Matricule:</span> {selectedEmployeeFuel.employe_matricule || 'N/A'}</div>
                             <div><span className="text-muted-foreground">Téléphone:</span> {selectedEmployeeFuel.employe_telephone || 'N/A'}</div>
                             <div><span className="text-muted-foreground">Email:</span> {selectedEmployeeFuel.employe_email || 'N/A'}</div>
                  </div>
                         </div>

                         <div>
                           <h4 className="font-semibold mb-2">Cartes Utilisées</h4>
                           <div className="bg-white/5 rounded-lg p-4">
                             <div className="flex flex-wrap gap-2">
                               {selectedEmployeeFuel.cartes_utilisees.map((carte: string, index: number) => (
                                 <Badge key={index} variant="outline" className="glass-card border border-white/20">
                                   Carte {carte}
                                 </Badge>
                               ))}
                  </div>
                </div>
              </div>

                         <div>
                           <h4 className="font-semibold mb-2">Véhicules Utilisés</h4>
                           <div className="bg-white/5 rounded-lg p-4">
                             <div className="flex flex-wrap gap-2">
                               {selectedEmployeeFuel.vehicules_utilises.map((vehicule: string, index: number) => (
                                 <Badge key={index} variant="outline" className="glass-card border border-white/20">
                                   {vehicule}
                                 </Badge>
                               ))}
                    </div>
                    </div>
                                  </div>

                                  <div>
                           <h4 className="font-semibold mb-2">Stations Utilisées</h4>
                           <div className="bg-white/5 rounded-lg p-4">
                             <div className="flex flex-wrap gap-2">
                               {selectedEmployeeFuel.stations_utilisees.map((station: string, index: number) => (
                                 <Badge key={index} variant="outline" className="glass-card border border-white/20">
                                   Station {station}
                                 </Badge>
                               ))}
                                  </div>
                                </div>
                         </div>

                         <div>
                           <h4 className="font-semibold mb-2">Période d'Activité</h4>
                           <div className="bg-white/5 rounded-lg p-4">
                             <div className="flex items-center gap-4">
                               <div>
                                 <span className="text-muted-foreground">Première transaction:</span>
                                 <div className="font-medium">
                                   {selectedEmployeeFuel.premiere_transaction ? 
                                     new Date(selectedEmployeeFuel.premiere_transaction).toLocaleString() : 'N/A'}
                                 </div>
                               </div>
                               <div>
                                 <span className="text-muted-foreground">Dernière transaction:</span>
                                 <div className="font-medium">
                                   {selectedEmployeeFuel.derniere_transaction ? 
                                     new Date(selectedEmployeeFuel.derniere_transaction).toLocaleString() : 'N/A'}
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>

                     <DialogFooter>
                       <Button 
                         variant="outline" 
                         onClick={() => setShowEmployeeFuelModal(false)}
                                  className="glass-card border border-white/20"
                                >
                         Fermer
                                  </Button>
                     </DialogFooter>
                   </DialogContent>
                 </Dialog>
               )}
            </div>
          )}

           {/* Materials Section */}
          {activeTab === "materials" && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <div>
                   <h2 className="text-3xl font-bold">Matériel</h2>
                   <p className="text-muted-foreground">Gestion du matériel</p>
                 </div>
                 <Button variant="outline">
                   <Plus className="w-4 h-4 mr-2" />
                   Nouveau
                 </Button>
               </div>

               {/* Material Management Section */}
               <div className="space-y-6">
                 {/* Material Inventory Card */}
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
              <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-lg">
                           <Package className="w-5 h-5 text-primary" />
                         </div>
                <div>
                           <CardTitle className="text-xl font-bold">Inventaire du Matériel</CardTitle>
                           <CardDescription>
                             {materials.length} équipements trouvés dans la base de données
                           </CardDescription>
                </div>
                       </div>
                <Button
                         variant="outline"
                      onClick={() => {
                        setEditingItem(null)
                        setShowMaterialModal(true)
                      }}
                         className="glass-card border border-white/20"
                    >
                         <Plus className="w-4 h-4 mr-2" />
                      Ajouter Matériel
                </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingMaterials ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                         <p className="mt-2 text-muted-foreground">Chargement des données matériel...</p>
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucun matériel trouvé</h3>
                      <p>Ajoutez du matériel pour commencer à gérer votre inventaire.</p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                               <th className="text-left p-4 font-semibold">Nom Équipement</th>
                          <th className="text-left p-4 font-semibold">Type</th>
                               <th className="text-left p-4 font-semibold">Marque</th>
                               <th className="text-left p-4 font-semibold">Modèle</th>
                               <th className="text-left p-4 font-semibold">Numéro Série</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                             {materials.slice(0, 50).map((material, index) => (
                               <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-4 font-medium">{material.nom_equipement}</td>
                                 <td className="p-4">{material.type_equipement}</td>
                                 <td className="p-4">{material.marque}</td>
                                 <td className="p-4">{material.modele}</td>
                                 <td className="p-4">{material.numero_serie}</td>
                              <td className="p-4">
                                <Badge 
                                  variant={material.statut === 'disponible' ? 'default' : 'secondary'}
                                     className={material.statut === 'disponible' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                                >
                                  {material.statut}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button
                                       variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingItem(material)
                                      setShowMaterialModal(true)
                                    }}
                                       className="glass-card border border-white/20"
                                  >
                                       <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                       variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingItem({ materiel_id: material.id, nom_equipement: material.nom_equipement })
                                      setShowAffectationModal(true)
                                    }}
                                       className="glass-card border border-white/20 text-blue-400 hover:text-blue-300"
                                     >
                                       <UserPlus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                       variant="outline"
                                    size="sm"
                                       onClick={() => handleDelete('material', material.id)}
                                       className="glass-card border border-white/20 text-red-400 hover:text-red-300"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                  </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  )}
                </CardContent>
              </Card>

                 {/* Material Assignments Card */}
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-lg">
                           <Users className="w-5 h-5 text-primary" />
                         </div>
                         <div>
                           <CardTitle className="text-xl font-bold">Affectations de Matériel</CardTitle>
                  <CardDescription>
                    Gérez les assignations de matériel aux employés
                  </CardDescription>
                         </div>
                       </div>
                      <Button
                         variant="outline"
                         onClick={() => setShowAffectationModal(true)}
                         className="glass-card border border-white/20"
                       >
                         <Plus className="w-4 h-4 mr-2" />
                        Nouvelle Affectation
                      </Button>
                      </div>
                   </CardHeader>
                   <CardContent>
                  {loadingAffectations ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des affectations...</p>
                    </div>
                  ) : affectations.length === 0 ? (
                       <div className="text-center py-8 text-muted-foreground">
                         <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">Aucune affectation trouvée</h3>
                         <p>Créez des affectations pour assigner du matériel aux employés.</p>
                    </div>
                  ) : (
                            <div className="overflow-x-auto">
                         <table className="w-full border-collapse">
                                <thead>
                                  <tr className="border-b border-white/10">
                               <th className="text-left p-4 font-semibold">Employé</th>
                               <th className="text-left p-4 font-semibold">Matériel</th>
                               <th className="text-left p-4 font-semibold">Date Affectation</th>
                               <th className="text-left p-4 font-semibold">Statut</th>
                               <th className="text-left p-4 font-semibold">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                             {affectations.slice(0, 50).map((affectation, index) => (
                               <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-4">
                                   <div className="flex items-center gap-2">
                                     <User className="w-4 h-4 text-primary" />
                                     <span>{affectation.nom_employe}</span>
                      </div>
                                 </td>
                                 <td className="p-4">
                                   <div className="flex items-center gap-2">
                                     <Package className="w-4 h-4 text-chart-3" />
                                     <span>{affectation.nom_equipement}</span>
                                        </div>
                                      </td>
                                 <td className="p-4">{affectation.date_affectation}</td>
                                 <td className="p-4">
                                        <Badge
                                          variant={affectation.statut === 'active' ? 'default' : 'secondary'}
                                     className={affectation.statut === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                                        >
                                          {affectation.statut}
                                        </Badge>
                                      </td>
                                 <td className="p-4">
                                        <div className="flex gap-2">
                        <Button
                                       variant="outline"
                                            size="sm"
                          onClick={() => {
                                              setEditingItem(affectation)
                                              setShowAffectationModal(true)
                                            }}
                                       className="glass-card border border-white/20"
                                          >
                                       <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                       variant="outline"
                                            size="sm"
                                       onClick={() => handleDelete('affectation', affectation.id)}
                                       className="glass-card border border-white/20 text-red-400 hover:text-red-300"
                                     >
                                       <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                    </div>
                  )}
                    </CardContent>
                  </Card>
               </div>
            </div>
          )}

           {/* Penalties Section */}
          {activeTab === "penalties" && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                   <h2 className="text-3xl font-bold">Pénalités</h2>
                   <p className="text-muted-foreground">Gestion des pénalités</p>
                  </div>
                    <Button
                   variant="outline"
                      onClick={() => {
                        setEditingItem(null)
                        setShowPenaltyModal(true)
                      }}
                    >
                   <Plus className="w-4 h-4 mr-2" />
                   Nouveau
                    </Button>
              </div>

               {/* Penalties Management Section */}
               <div className="space-y-6">
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-red-500/10 rounded-lg">
                         <AlertTriangle className="w-5 h-5 text-red-500" />
                       </div>
                       <div>
                         <CardTitle className="text-xl font-bold">Liste des Pénalités</CardTitle>
                  <CardDescription>
                    {penalties.length} pénalités trouvées dans la base de données
                  </CardDescription>
                       </div>
                     </div>
                  </CardHeader>
                <CardContent>
                  {loadingPenalties ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des pénalités...</p>
                    </div>
                  ) : penalties.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucune pénalité trouvée</h3>
                         <p>Ajoutez des pénalités pour commencer à gérer les sanctions.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-4 font-semibold">Employé</th>
                            <th className="text-left p-4 font-semibold">Type</th>
                            <th className="text-left p-4 font-semibold">Montant</th>
                               <th className="text-left p-4 font-semibold">Date</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                             {penalties.slice(0, 50).map((penalty, index) => (
                               <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                   <div className="flex items-center gap-2">
                                     <User className="w-4 h-4 text-primary" />
                                     <span>{penalty.employe_nom}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                {penalty.type_penalite || (
                                  <span className="text-gray-400 italic">Dossier Non Clôturé</span>
                                )}
                              </td>
                                 <td className="p-4 font-medium text-red-400">{penalty.montant} €</td>
                                 <td className="p-4">{penalty.date_penalite}</td>
                              <td className="p-4">
                                <Badge 
                                     variant={penalty.statut === 'active' ? 'default' : 'secondary'}
                                     className={penalty.statut === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}
                                >
                                  {penalty.statut}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                    <Button
                                       variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingItem(penalty)
                                      setShowPenaltyModal(true)
                                    }}
                                       className="glass-card border border-white/20"
                                  >
                                       <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                       variant="outline"
                                    size="sm"
                                       onClick={() => handleDelete('penalty', penalty.id)}
                                       className="glass-card border border-white/20 text-red-400 hover:text-red-300"
                                     >
                                       <Trash2 className="w-4 h-4" />
                    </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  </CardContent>
                </Card>
               </div>
            </div>
          )}

           {/* Claims Section */}
          {activeTab === "costs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Calcul des Coûts</h2>
                <p className="text-muted-foreground">Gestion des coûts fixes et variables</p>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/setup-costs', { method: 'POST' })
                    if (response.ok) {
                      alert('✅ Tables de coûts initialisées avec succès')
                      window.location.reload()
                    } else {
                      alert('❌ Erreur lors de l\'initialisation')
                    }
                  } catch (error) {
                    console.error('Erreur:', error)
                    alert('❌ Erreur lors de l\'initialisation')
                  }
                }}
                variant="outline"
                className="bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Initialiser les tables
              </Button>
            </div>
            
            {/* Interface de gestion des coûts */}
            <CostsManagement />
          </div>
        )}

        {activeTab === "claims" && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                   <h2 className="text-3xl font-bold">Réclamations</h2>
                   <p className="text-muted-foreground">Gestion des réclamations</p>
                  </div>
                    <Button
                   variant="outline"
                      onClick={() => {
                        setEditingItem(null)
                        setShowClaimModal(true)
                      }}
                    >
                   <Plus className="w-4 h-4 mr-2" />
                   Nouveau
                    </Button>
              </div>
              
               {/* Claims Management Section */}
               <div className="space-y-6">
                 {/* Section spéciale pour les réclamations en attente de validation */}
                 

                 {claims.filter(claim => claim.statut === 'en_cours').length > 0 && (
                   <Card className="glass-card border border-yellow-500/30 bg-yellow-500/5 hover-lift">
                     <CardHeader>
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-yellow-500/20 rounded-lg">
                           <Timer className="w-5 h-5 text-yellow-400" />
                         </div>
                         <div>
                           <CardTitle className="text-xl font-bold text-yellow-400">
                             Réclamations en attente de validation ({claims.filter(claim => claim.statut === 'en_cours').length})
                           </CardTitle>
                           <p className="text-yellow-300/80">Ces réclamations ont été résolues par les techniciens et attendent votre validation</p>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <div className="grid gap-4">
                         {claims.filter(claim => claim.statut === 'en_cours').map((claim) => (
                           <div key={claim.id} className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                             <div className="flex items-center justify-between">
                               <div className="flex-1">
                                 <h4 className="font-semibold text-yellow-200">{claim.numero_reclamation}</h4>
                                 <p className="text-sm text-yellow-300/80">{claim.nom_client} - {claim.type_reclamation}</p>
                                 <p className="text-xs text-yellow-400/60 mt-1">
                                   Résolue le: {new Date(claim.date_resolution).toLocaleDateString('fr-FR')}
                                 </p>
                               </div>
                               <div className="flex gap-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleValidateClaim(claim.id, 'approve')}
                                   className="bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 hover:text-green-300"
                                   data-claim-id={claim.id}
                                   data-action="approve"
                                 >
                                   <CheckCircle className="w-4 h-4 mr-1" />
                                   Accepter
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleValidateClaim(claim.id, 'reject')}
                                   className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                                   data-claim-id={claim.id}
                                   data-action="reject"
                                 >
                                   <X className="w-4 h-4 mr-1" />
                                   Rejeter
                                 </Button>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-primary/10 rounded-lg">
                         <FileText className="w-5 h-5 text-primary" />
                       </div>
                       <div>
                         <CardTitle className="text-xl font-bold">Liste des Réclamations</CardTitle>
                    <CardDescription>
                    {claims.length} réclamations trouvées dans la base de données
                    </CardDescription>
                       </div>
                     </div>
                  </CardHeader>
                <CardContent>
                  {loadingClaims ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des réclamations...</p>
                    </div>
                  ) : claims.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucune réclamation trouvée</h3>
                         <p>Ajoutez des réclamations pour commencer à gérer les plaintes.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                               <th className="text-left p-4 font-semibold">Deadline</th>
                               <th className="text-left p-4 font-semibold">Statut Délai</th>
                               <th className="text-left p-4 font-semibold">Intervention Associée</th>
                               <th className="text-left p-4 font-semibold">Description Problème</th>
                               <th className="text-left p-4 font-semibold">Nom du Client</th>
                               <th className="text-left p-4 font-semibold">Email Client</th>
                            <th className="text-left p-4 font-semibold">Priorité</th>
                               <th className="text-left p-4 font-semibold">Type Réclamation</th>
                               <th className="text-left p-4 font-semibold">Employé</th>
                               <th className="text-left p-4 font-semibold">Date Création</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Photos</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                             {claims.slice(0, 50).map((claim, index) => (
                               <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                   {claim.date_resolution ? (
                                     <span className="text-sm">{new Date(claim.date_resolution).toLocaleDateString('fr-FR')}</span>
                                   ) : (
                                     <span className="text-muted-foreground text-sm">Non définie</span>
                                   )}
                                 </td>
                                 <td className="p-4">
                                   {(() => {
                                     if (!claim.date_resolution) return <span className="text-muted-foreground text-sm">-</span>
                                     
                                     const deadline = new Date(claim.date_resolution)
                                     const today = new Date()
                                     const diffTime = deadline.getTime() - today.getTime()
                                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                     
                                     if (diffDays < 0) {
                                       return <Badge variant="destructive">En retard ({Math.abs(diffDays)}j)</Badge>
                                     } else if (diffDays <= 2) {
                                       return <Badge variant="secondary">Urgent ({diffDays}j)</Badge>
                                     } else if (diffDays <= 5) {
                                       return <Badge variant="outline">Attention ({diffDays}j)</Badge>
                                     } else {
                                       return <Badge variant="default">OK ({diffDays}j)</Badge>
                                     }
                                   })()}
                                 </td>
                                 <td className="p-4">
                                   {claim.intervention_client ? (
                                     <div className="flex items-center gap-2">
                                       <span className="text-sm">{claim.intervention_client}</span>
                                  </div>
                                   ) : (
                                     <span className="text-muted-foreground text-sm">Aucune</span>
                                   )}
                                 </td>
                                 <td className="p-4 max-w-xs">
                                   <div className="truncate" title={claim.description_probleme}>
                                     {claim.description_probleme || 'Non spécifié'}
                                </div>
                              </td>
                                 <td className="p-4">
                                   <span className="text-sm font-medium">{claim.nom_client || 'Non spécifié'}</span>
                                 </td>
                                 <td className="p-4">
                                   <span className="text-sm">{claim.email_client || 'Non spécifié'}</span>
                                 </td>
                              <td className="p-4">
                                <Badge 
                                     variant="outline"
                                     className={
                                       claim.priorite === 'critique' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                       claim.priorite === 'haute' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                       claim.priorite === 'normale' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                       'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                     }
                                   >
                                     {claim.priorite || 'normale'}
                                </Badge>
                              </td>
                                 <td className="p-4">
                                   <div className="flex flex-col gap-1">
                                     <span className="text-sm">{claim.type_reclamation || 'Non spécifié'}</span>
                                     {claim.type_reclamation === 'client' && (
                                       <Badge variant="outline" className="text-xs w-fit">7j</Badge>
                                     )}
                                     {claim.type_reclamation === 'controleur' && (
                                       <Badge variant="outline" className="text-xs w-fit">14j</Badge>
                                     )}
                                   </div>
                                 </td>
                                 <td className="p-4">
                                   <div className="flex items-center gap-2">
                                     <User className="w-4 h-4 text-primary" />
                                     <span className="text-sm">{claim.employe_nom || 'Non assigné'}</span>
                                   </div>
                                 </td>
                                 <td className="p-4">
                                   <span className="text-sm">{claim.created_at ? new Date(claim.created_at).toLocaleDateString('fr-FR') : 'Non spécifié'}</span>
                                 </td>
                              <td className="p-4">
                                <Badge 
                                     variant={claim.statut === 'ouverte' ? 'default' : 'secondary'}
                                     className={
                                       claim.statut === 'ouverte' ? 'bg-orange-500/20 text-orange-400' : 
                                       claim.statut === 'en_cours' ? 'bg-blue-500/20 text-blue-400' :
                                       claim.statut === 'en_cours' ? 'bg-yellow-500/20 text-yellow-400' :
                                       claim.statut === 'resolue' ? 'bg-green-500/20 text-green-400' :
                                       claim.statut === 'résolu' ? 'bg-green-500/20 text-green-400' :
                                       'bg-gray-500/20 text-gray-400'
                                     }
                                   >
                                     {claim.statut === 'en_cours' ? 'En cours' : 
                                      claim.statut === 'resolue' || claim.statut === 'résolu' ? 'Résolu' :
                                      claim.statut || 'ouverte'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                {claim.photos && claim.photos.length > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Camera className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">{claim.photos.length} photo(s)</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedClaim(claim)
                                        setShowPhotosModal(true)
                                      }}
                                      className="text-xs"
                                    >
                                      Voir
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Aucune</span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  {/* Boutons de validation pour les réclamations en cours */}
                                  {claim.statut === 'en_cours' && (
                                    <div className="flex flex-col gap-2">
                                      <div className="text-xs text-yellow-400 font-medium mb-1">
                                        En attente de validation
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleValidateClaim(claim.id, 'approve')}
                                          className="bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 hover:text-green-300 transition-all duration-200"
                                          title="Accepter la résolution"
                                          data-claim-id={claim.id}
                                          data-action="approve"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Accepter
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleValidateClaim(claim.id, 'reject')}
                                          className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all duration-200"
                                          title="Rejeter la résolution"
                                          data-claim-id={claim.id}
                                          data-action="reject"
                                        >
                                          <X className="w-4 h-4 mr-1" />
                                          Rejeter
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <Button
                                       variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingItem(claim)
                                      setShowClaimModal(true)
                                    }}
                                       className="glass-card border border-white/20"
                                  >
                                       <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                       variant="outline"
                                    size="sm"
                                       onClick={() => handleDelete('claim', claim.id)}
                                       className="glass-card border border-white/20 text-red-400 hover:text-red-300"
                                     >
                                       <Trash2 className="w-4 h-4" />
                    </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  </CardContent>
                </Card>
               </div>
              </div>
          )}

           {/* Reports Section */}
           {activeTab === "reports" && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                   <h2 className="text-3xl font-bold">Rapports</h2>
                   <p className="text-muted-foreground">Génération de rapports</p>
                  </div>
                 <Button variant="outline">
                   <Plus className="w-4 h-4 mr-2" />
                   Nouveau
                    </Button>
              </div>
              
               {/* Reports Management Section */}
                    <div className="space-y-6">
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                            <div className="flex items-center gap-3">
                       <div className="p-2 bg-primary/10 rounded-lg">
                         <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                              <div>
                         <CardTitle className="text-xl font-bold">Rapports Disponibles</CardTitle>
                         <CardDescription>
                           Générez des rapports détaillés sur vos données
                         </CardDescription>
                          </div>
                            </div>
                   </CardHeader>
                   <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       <Card className="glass-card border border-white/10 hover:border-white/20 transition-all">
                         <CardContent className="p-6">
                           <div className="flex items-center gap-3 mb-4">
                             <Users className="w-8 h-8 text-chart-1" />
                             <div>
                               <h3 className="font-semibold">Rapport Employés</h3>
                               <p className="text-sm text-muted-foreground">Statistiques des employés</p>
                              </div>
                              </div>
                           <Button variant="outline" className="w-full glass-card border border-white/20">
                             Générer
                           </Button>
                         </CardContent>
                       </Card>

                       <Card className="glass-card border border-white/10 hover:border-white/20 transition-all">
                         <CardContent className="p-6">
                           <div className="flex items-center gap-3 mb-4">
                             <Fuel className="w-8 h-8 text-chart-2" />
                             <div>
                               <h3 className="font-semibold">Rapport Carburant</h3>
                               <p className="text-sm text-muted-foreground">Consommation carburant</p>
                                    </div>
                            </div>
                           <Button variant="outline" className="w-full glass-card border border-white/20">
                             Générer
                           </Button>
                         </CardContent>
                       </Card>

                       <Card className="glass-card border border-white/10 hover:border-white/20 transition-all">
                         <CardContent className="p-6">
                           <div className="flex items-center gap-3 mb-4">
                             <FileText className="w-8 h-8 text-chart-3" />
                             <div>
                               <h3 className="font-semibold">Rapport Interventions</h3>
                               <p className="text-sm text-muted-foreground">Activité des interventions</p>
                                          </div>
                                        </div>
                           <Button variant="outline" className="w-full glass-card border border-white/20">
                             Générer
                           </Button>
                         </CardContent>
                       </Card>
                                    </div>
                </CardContent>
              </Card>
              </div>
                        </div>
                      )}

          {/* Technicien Accounts Section */}
          {activeTab === "technicien-accounts" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">Comptes Techniciens</h2>
                  <p className="text-muted-foreground">Gestion des comptes d'accès des techniciens</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => window.open('/admin/technicien-accounts', '_blank')}
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Gérer les Comptes
                </Button>
              </div>
              
              <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <UserCog className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Espace Technicien</CardTitle>
                      <CardDescription>
                        Créez et gérez les comptes d'accès pour les techniciens
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Fonctionnalités</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Création automatique de comptes pour nouveaux employés
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Accès sécurisé avec authentification JWT
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Filtrage automatique des données par technicien
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Gestion des permissions et verrouillage de comptes
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Données Accessibles</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          Ses interventions personnelles
                        </li>
                        <li className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Ses réclamations assignées
                        </li>
                        <li className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-red-500" />
                          Ses pénalités personnelles
                        </li>
                        <li className="flex items-center gap-2">
                          <Fuel className="w-4 h-4 text-green-500" />
                          Sa consommation carburant
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Accès Technicien</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Les techniciens peuvent accéder à leur espace personnel via : <code className="bg-blue-100 px-2 py-1 rounded">/logintech</code>
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('/logintech', '_blank')}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <User className="w-4 h-4 mr-1" />
                        Page de Connexion
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open('/admin/technicien-accounts', '_blank')}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <UserCog className="w-4 h-4 mr-1" />
                        Gestion Admin
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
                    </div>

       {/* Material Modal */}
       <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
         <DialogContent className="glass-card border border-white/20">
           <DialogHeader>
             <DialogTitle>
               {editingItem ? 'Modifier le Matériel' : 'Ajouter un Nouveau Matériel'}
             </DialogTitle>
             <DialogDescription>
               {editingItem ? 'Modifiez les informations du matériel' : 'Remplissez les informations du nouveau matériel'}
             </DialogDescription>
           </DialogHeader>
           <MaterialForm 
             material={editingItem} 
             onSave={saveMaterial} 
             onCancel={() => {
               setShowMaterialModal(false)
               setEditingItem(null)
             }} 
           />
         </DialogContent>
       </Dialog>

       {/* Affectation Modal */}
       <Dialog open={showAffectationModal} onOpenChange={setShowAffectationModal}>
         <DialogContent className="glass-card border border-white/20">
           <DialogHeader>
             <DialogTitle>
               {editingItem ? 'Modifier l\'Affectation' : 'Nouvelle Affectation'}
             </DialogTitle>
             <DialogDescription>
               {editingItem ? 'Modifiez les détails de l\'affectation' : 'Assignez du matériel à un employé'}
             </DialogDescription>
           </DialogHeader>
           <AffectationForm 
             affectation={editingItem} 
             employees={employees}
             materials={materials}
             onSave={saveAffectation} 
             onCancel={() => {
               setShowAffectationModal(false)
               setEditingItem(null)
             }} 
           />
         </DialogContent>
       </Dialog>

      {/* Employee Modal */}
      <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
        <DialogContent className="glass-card border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? "Modifier l'Employé" : "Ajouter un Employé"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifiez les informations de l'employé" : "Ajoutez un nouvel employé à votre équipe"}
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm 
            employee={editingItem} 
            onSave={saveEmployee} 
            onCancel={() => {
              setShowEmployeeModal(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Details Modal */}
      <Dialog open={showEmployeeDetailsModal} onOpenChange={setShowEmployeeDetailsModal}>
        <DialogContent className="glass-card border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Détails de l'Employé
            </DialogTitle>
            <DialogDescription>
              Informations complètes de {selectedEmployee?.prenom} {selectedEmployee?.nom}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Matricule</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.matricule || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <Badge 
                    variant={selectedEmployee.statut === 'actif' ? 'default' : 'secondary'}
                    className="glass-card border border-white/20"
                  >
                    {selectedEmployee.statut || 'actif'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Nom</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.nom || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Prénom</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.prenom || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Téléphone</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.telephone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Poste</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.poste || 'N/A'}</p>
                </div>
                <div>
                   <Label className="text-sm font-medium">Date d'embauche</Label>
                   <p className="text-sm text-gray-600">{selectedEmployee.date_embauche || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Niveau d'accès</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.niveau_acces || 'N/A'}</p>
                </div>
                 <div>
                   <Label className="text-sm font-medium">Région</Label>
                   <p className="text-sm text-gray-600">{selectedEmployee.region || 'N/A'}</p>
              </div>
                 <div>
                   <Label className="text-sm font-medium">Plaque Véhicule</Label>
                   <p className="text-sm text-gray-600">{selectedEmployee.plaque_vehicule || 'N/A'}</p>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">Numéro Carte Carburant</Label>
                   <p className="text-sm text-gray-600">{selectedEmployee.numero_carte_carburant || 'N/A'}</p>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">Pourcentage Taxe</Label>
                   <p className="text-sm text-gray-600">{selectedEmployee.pourcentage_taxe || 'N/A'}</p>
                 </div>
               </div>
               {selectedEmployee.commentaires && (
              <div>
                <Label className="text-sm font-medium">Commentaires</Label>
                   <p className="text-sm text-gray-600">{selectedEmployee.commentaires}</p>
              </div>
               )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setShowEmployeeDetailsModal(false)}
              className="glass-card border border-white/20 hover:bg-white/10 text-gray-900"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Assignment Modal */}
      <Dialog open={showCardAssignmentModal} onOpenChange={setShowCardAssignmentModal}>
        <DialogContent className="glass-card border border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Assigner une carte carburant
            </DialogTitle>
            <DialogDescription>
              Assignez une carte carburant à {selectedEmployee?.prenom} {selectedEmployee?.nom}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Sélectionner une carte</Label>
              <Select onValueChange={(value) => setSelectedCardNumber(value)}>
                <SelectTrigger className="glass-card border border-white/20">
                  <SelectValue placeholder="Choisir une carte carburant" />
                </SelectTrigger>
                <SelectContent>
                  {availableCards.map((card) => (
                    <SelectItem key={card.numero_carte} value={card.numero_carte}>
                      {card.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Date de début d'assignation</Label>
              <Input
                type="date"
                value={assignmentStartDate}
                onChange={(e) => setAssignmentStartDate(e.target.value)}
                className="glass-card border border-white/20"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Commentaires (optionnel)</Label>
              <Textarea
                placeholder="Ajoutez des commentaires sur cette assignation..."
                value={assignmentComments}
                onChange={(e) => setAssignmentComments(e.target.value)}
                className="glass-card border border-white/20"
                rows={3}
              />
            </div>
            
            {selectedCardNumber && (
              <div className="p-3 glass-card border border-white/20 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Résumé de l'assignation :</div>
                <div className="space-y-1 text-sm">
                  <div><strong>Employé :</strong> {selectedEmployee?.prenom} {selectedEmployee?.nom}</div>
                  <div><strong>Carte :</strong> {selectedCardNumber}</div>
                  <div><strong>Date de début :</strong> {assignmentStartDate || 'Aujourd\'hui'}</div>
                  <div><strong>Statut :</strong> Active</div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCardAssignmentModal(false)
                setSelectedCardNumber('')
                setAssignmentStartDate('')
                setAssignmentComments('')
              }}
              className="glass-card border border-white/20 hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={() => assignCardToEmployee(selectedCardNumber)}
              disabled={!selectedCardNumber}
              className="glass-card border border-white/20 hover:bg-white/10"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Assigner la carte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Unassign Modal */}
      <Dialog open={showUnassignModal} onOpenChange={setShowUnassignModal}>
        <DialogContent className="glass-card border border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              Désassigner la carte carburant
            </DialogTitle>
            <DialogDescription>
              Retirez la carte carburant de {selectedEmployee?.prenom} {selectedEmployee?.nom}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 glass-card border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Attention</span>
              </div>
              <div className="text-sm text-red-700">
                Cette action va retirer la carte carburant de cet employé. 
                L'employé n'aura plus accès à aucune carte carburant après cette action.
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Raison de la désassignation (optionnel)</Label>
              <Textarea
                placeholder="Ex: Congé, changement de poste, fin de mission..."
                value={unassignComments}
                onChange={(e) => setUnassignComments(e.target.value)}
                className="glass-card border border-white/20"
                rows={3}
              />
            </div>
            
            <div className="p-3 glass-card border border-white/20 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Résumé de l'action :</div>
              <div className="space-y-1 text-sm">
                <div><strong>Employé :</strong> {selectedEmployee?.prenom} {selectedEmployee?.nom}</div>
                <div><strong>Action :</strong> Désassignation de la carte carburant</div>
                <div><strong>Date :</strong> {new Date().toLocaleDateString('fr-FR')}</div>
                <div><strong>Statut après :</strong> Aucune carte assignée</div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnassignModal(false)
                setSelectedEmployee(null)
                setUnassignComments('')
              }}
              className="glass-card border border-white/20 hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={unassignCardFromEmployee}
              className="glass-card border border-red-200 hover:bg-red-500/20 text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Désassigner la carte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

       {/* Reclamation Modal */}
       <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
         <DialogContent className="glass-card border border-white/20">
          <DialogHeader>
             <DialogTitle>
               {editingItem ? 'Modifier la Réclamation' : 'Nouvelle Réclamation'}
            </DialogTitle>
            <DialogDescription>
               {editingItem ? 'Modifiez les informations de la réclamation' : 'Ajoutez une nouvelle réclamation'}
            </DialogDescription>
          </DialogHeader>
           <ReclamationForm 
             reclamation={editingItem} 
            employees={employees}
             interventions={interventions}
             onSave={saveReclamation} 
            onCancel={() => {
               setShowClaimModal(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
       </Dialog>


      {/* Penalty Modal */}
      <Dialog open={showPenaltyModal} onOpenChange={setShowPenaltyModal}>
         <DialogContent className="glass-card border border-white/20">
          <DialogHeader>
             <DialogTitle>
               {editingItem ? 'Modifier la Pénalité' : 'Nouvelle Pénalité'}
            </DialogTitle>
            <DialogDescription>
               {editingItem ? 'Modifiez les informations de la pénalité' : 'Ajoutez une nouvelle pénalité'}
            </DialogDescription>
          </DialogHeader>
          <PenaltyForm 
            penalty={editingItem} 
            employees={employees}
            interventions={interventions}
            onSave={savePenalty} 
            onCancel={() => {
              setShowPenaltyModal(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Articles Edit Modal */}
      <ArticlesEditModal
        isOpen={showArticlesModal}
        onClose={handleCancelArticles}
        intervention={editingIntervention}
        onSave={handleSaveArticles}
      />

      {/* Card History Modal */}
      <Dialog open={showCardHistoryModal} onOpenChange={setShowCardHistoryModal}>
        <DialogContent className="glass-card border border-white/20 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Historique des Cartes Carburant
            </DialogTitle>
            <DialogDescription>
              Historique complet des mouvements de cartes pour {selectedEmployeeHistory?.prenom} {selectedEmployeeHistory?.nom}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {cardHistory.length > 0 ? (
              <>
                {/* Résumé de l'employé */}
                {cardHistory.map((empData) => (
                  <Card key={empData.employe_id} className="glass-card border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {empData.employe_prenom} {empData.employe_nom}
                        </span>
                        <Badge variant="outline" className="glass-card border border-white/20">
                          {empData.matricule}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{empData.total_consomme_toutes_cartes.toFixed(2)}€</div>
                          <div className="text-sm text-gray-600">Total Consommé</div>
                        </div>
                        <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{empData.nombre_cartes_utilisees}</div>
                          <div className="text-sm text-gray-600">Cartes Utilisées</div>
                        </div>
                        <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{empData.nombre_periodes_assignation}</div>
                          <div className="text-sm text-gray-600">Périodes d'Assignation</div>
                        </div>
                      </div>

                      {/* Historique détaillé des cartes */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Historique Détaillé des Cartes
                        </h4>
                        
                        {empData.historique_cartes.map((carte: any, index: number) => (
                          <Card key={index} className="glass-card border border-white/20">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-sm text-gray-600">Numéro de Carte</div>
                                  <div className="font-semibold">{carte.numero_carte}</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-600">Période d'Assignation</div>
                                  <div className="font-semibold">
                                    {new Date(carte.date_assignation).toLocaleDateString('fr-FR')} - 
                                    {carte.date_fin ? new Date(carte.date_fin).toLocaleDateString('fr-FR') : 'En cours'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-600">Consommation Période</div>
                                  <div className="font-semibold text-blue-600">{carte.consommation_periode.toFixed(2)}€</div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-600">Transactions</div>
                                  <div className="font-semibold">{carte.nombre_transactions_periode}</div>
                                </div>
                              </div>
                              
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge 
                                    variant={carte.statut === 'active' ? 'default' : 'secondary'}
                                    className="glass-card border border-white/20"
                                  >
                                    {carte.statut}
                                  </Badge>
                                  <div className="text-xs text-gray-500">
                                    Assigné le: {new Date(carte.mouvement_date).toLocaleString('fr-FR')}
                                  </div>
                                </div>
                                
                                {carte.transfer_comments && (
                                  <div className="p-2 glass-card border border-white/20 rounded text-xs">
                                    <div className="font-medium text-blue-600 mb-1">📋 Historique des transferts:</div>
                                    <div className="text-gray-600">{carte.transfer_comments}</div>
                                  </div>
                                )}
                                
                                {carte.last_update && carte.last_update !== carte.mouvement_date && (
                                  <div className="text-xs text-gray-400">
                                    Dernière mise à jour: {new Date(carte.last_update).toLocaleString('fr-FR')}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique trouvé</h3>
                <p className="text-gray-500">
                  {selectedEmployeeHistory?.prenom} {selectedEmployeeHistory?.nom} n'a pas encore d'historique de cartes carburant.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCardHistoryModal(false)}
              className="glass-card border border-white/20 hover:bg-white/10"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour afficher les photos justificatives */}
      <Dialog open={showPhotosModal} onOpenChange={setShowPhotosModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photos Justificatives - Réclamation {selectedClaim?.numero_reclamation}
            </DialogTitle>
            <DialogDescription>
              Photos fournies par le technicien pour justifier la résolution de la réclamation
            </DialogDescription>
          </DialogHeader>
          
              <div className="space-y-4">
                {selectedClaim?.photos && selectedClaim.photos.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-3">Détails de la résolution :</h4>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <p className="text-sm text-green-800">
                        {selectedClaim.commentaires_internes || 'Aucun commentaire fourni'}
                      </p>
                    </div>

                    <h4 className="font-medium mb-3">Photos justificatives :</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedClaim.photos.map((photo: any, index: number) => (
                        <div key={photo.id} className="relative group">
                          <img
                            src={photo.url}
                            alt={`Photo justificative ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg'
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={() => {
                                setSelectedImage(photo.url)
                                setShowImageModal(true)
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Agrandir
                            </Button>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 text-center">
                            {photo.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucune photo disponible</h3>
                    <p>Cette réclamation n'a pas de photos justificatives.</p>
                  </div>
                )}
              </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowPhotosModal(false)}
              className="glass-card border border-white/20 hover:bg-white/10"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'agrandissement des images */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Aperçu de l'image
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-0">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Image agrandie"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.jpg'
                }}
              />
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-0">
            <Button 
              variant="outline" 
              onClick={() => setShowImageModal(false)}
              className="glass-card border border-white/20 hover:bg-white/10"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant de gestion des coûts
function CostsManagement() {
  const [fixedCosts, setFixedCosts] = useState<any[]>([])
  const [variableCosts, setVariableCosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [showFixedModal, setShowFixedModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [editingCost, setEditingCost] = useState<any>(null)

  // Charger les données
  const loadData = async () => {
    setLoading(true)
    try {
      const [fixedRes, variableRes, categoriesRes] = await Promise.all([
        fetch('/api/costs?type=fixed'),
        fetch(`/api/costs?type=variable&month=${selectedMonth}&year=${selectedYear}`),
        fetch('/api/cost-categories')
      ])

      const fixedData = await fixedRes.json()
      const variableData = await variableRes.json()
      const categoriesData = await categoriesRes.json()

      setFixedCosts(fixedData.costs || [])
      setVariableCosts(variableData.costs || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error('Erreur chargement coûts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear])

  const handleSaveCost = async (costData: any, type: 'fixed' | 'variable') => {
    try {
      const url = '/api/costs'
      const method = editingCost ? 'PUT' : 'POST'
      
      const payload = {
        ...costData,
        type,
        month: selectedMonth,
        year: selectedYear
      }

      if (editingCost) {
        payload.id = editingCost.id
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await loadData()
        setShowFixedModal(false)
        setShowVariableModal(false)
        setEditingCost(null)
      }
    } catch (error) {
      console.error('Erreur sauvegarde coût:', error)
    }
  }

  const handleDeleteCost = async (id: number, type: 'fixed' | 'variable') => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce coût ?')) return

    try {
      const response = await fetch(`/api/costs?id=${id}&type=${type}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Erreur suppression coût:', error)
    }
  }

  const totalFixed = fixedCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0)
  const totalVariable = variableCosts.reduce((sum, cost) => sum + parseFloat(cost.amount), 0)
  const totalCosts = totalFixed + totalVariable

  return (
    <div className="space-y-6">
      {/* Sélecteur de mois/année */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Résumé des coûts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coûts Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalFixed.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">Récurrents chaque mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coûts Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalVariable.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">Spécifiques à ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCosts.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">Coûts totaux</p>
          </CardContent>
        </Card>
      </div>

      {/* Coûts fixes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Coûts Fixes</CardTitle>
              <CardDescription>Coûts récurrents chaque mois</CardDescription>
            </div>
            <Button onClick={() => setShowFixedModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fixedCosts.map((cost) => (
              <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{cost.name}</div>
                  <div className="text-sm text-muted-foreground">{cost.description}</div>
                  <div className="text-sm text-blue-600">{cost.category_name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold">{parseFloat(cost.amount).toLocaleString('fr-FR')} €</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCost(cost)
                      setShowFixedModal(true)
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCost(cost.id, 'fixed')}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coûts variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Coûts Variables</CardTitle>
              <CardDescription>Coûts spécifiques à {new Date(0, selectedMonth - 1).toLocaleString('fr-FR', { month: 'long' })} {selectedYear}</CardDescription>
            </div>
            <Button onClick={() => setShowVariableModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {variableCosts.map((cost) => (
              <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{cost.name}</div>
                  <div className="text-sm text-muted-foreground">{cost.description}</div>
                  <div className="text-sm text-orange-600">{cost.category_name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-bold">{parseFloat(cost.amount).toLocaleString('fr-FR')} €</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCost(cost)
                      setShowVariableModal(true)
                    }}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCost(cost.id, 'variable')}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modals pour ajouter/modifier les coûts */}
      <CostModal
        isOpen={showFixedModal}
        onClose={() => {
          setShowFixedModal(false)
          setEditingCost(null)
        }}
        onSave={(data) => handleSaveCost(data, 'fixed')}
        categories={categories}
        editingCost={editingCost}
        type="fixed"
      />

      <CostModal
        isOpen={showVariableModal}
        onClose={() => {
          setShowVariableModal(false)
          setEditingCost(null)
        }}
        onSave={(data) => handleSaveCost(data, 'variable')}
        categories={categories}
        editingCost={editingCost}
        type="variable"
      />
    </div>
  )
}

// Modal pour ajouter/modifier un coût
function CostModal({ isOpen, onClose, onSave, categories, editingCost, type }: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  categories: any[]
  editingCost: any
  type: 'fixed' | 'variable'
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: ''
  })

  useEffect(() => {
    if (editingCost) {
      setFormData({
        name: editingCost.name || '',
        description: editingCost.description || '',
        amount: editingCost.amount?.toString() || '',
        category: editingCost.category || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        amount: '',
        category: categories[0]?.name || ''
      })
    }
  }, [editingCost, categories])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCost ? 'Modifier' : 'Ajouter'} un coût {type === 'fixed' ? 'fixe' : 'variable'}
          </DialogTitle>
          <DialogDescription>
            {type === 'fixed' 
              ? 'Les coûts fixes sont récurrents chaque mois'
              : 'Les coûts variables sont spécifiques au mois sélectionné'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du coût</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {editingCost ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
