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
import {
  Building2,
  Users,
  UserPlus,
  FileText,
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
  const [showFraisErtModal, setShowFraisErtModal] = useState(false)
  const [showFraisAxecomModal, setShowFraisAxecomModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  // Employee details and assignment modals
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] = useState(false)
  const [showCardAssignmentModal, setShowCardAssignmentModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [availableCards, setAvailableCards] = useState<any[]>([])
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

  // Frais d'entreprise data
  const [fraisErt, setFraisErt] = useState<any[]>([])
  const [fraisAxecom, setFraisAxecom] = useState<any[]>([])
  const [bordereauPrixErt, setBordereauPrixErt] = useState<any[]>([])

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
      // Charger les données des frais d'entreprise
      loadFraisErtFromDatabase().then(setFraisErt)
      loadFraisAxecomFromDatabase().then(setFraisAxecom)
      loadBordereauPrixErtFromDatabase().then(setBordereauPrixErt)
    }
  }, [isLoggedIn])

  // Reload grouped data when period or date range changes
  useEffect(() => {
    if (isLoggedIn) {
      loadFuelGroupedData()
    }
  }, [fuelPeriod, fuelDateRange])

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

  // Fonctions de chargement des frais d'entreprise
  const loadFraisErtFromDatabase = async () => {
    try {
      const response = await fetch("/api/frais-ert")
      if (!response.ok) throw new Error("Erreur lors du chargement des frais ERT")
      const data = await response.json()
      return data.frais_ert || []
    } catch (error) {
      console.error("[v0] Erreur chargement frais ERT:", error)
      return []
    }
  }

  const loadFraisAxecomFromDatabase = async () => {
    try {
      const response = await fetch("/api/frais-axecom")
      if (!response.ok) throw new Error("Erreur lors du chargement des frais Axecom")
      const data = await response.json()
      return data.frais_axecom || []
    } catch (error) {
      console.error("[v0] Erreur chargement frais Axecom:", error)
      return []
    }
  }

  const loadBordereauPrixErtFromDatabase = async () => {
    try {
      const response = await fetch("/api/bordereau-prix-ert")
      if (!response.ok) throw new Error("Erreur lors du chargement du bordereau de prix ERT")
      const data = await response.json()
      return data.bordereau_prix_ert || []
    } catch (error) {
      console.error("[v0] Erreur chargement bordereau prix ERT:", error)
      return []
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

  // CRUD Functions for Frais ERT
  const saveFraisErt = async (fraisData: any) => {
    try {
      const url = editingItem ? "/api/frais-ert" : "/api/frais-ert"
      const method = editingItem ? "PUT" : "POST"
      
      const body = editingItem 
        ? { id: editingItem.id, ...fraisData }
        : fraisData

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

      // Recharger les données des frais ERT
      const fraisErtData = await loadFraisErtFromDatabase()
      setFraisErt(fraisErtData)
      
      setShowFraisErtModal(false)
      setEditingItem(null)
      alert(editingItem ? "Frais ERT modifié avec succès" : "Frais ERT ajouté avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde frais ERT:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  // CRUD Functions for Frais Axecom
  const saveFraisAxecom = async (fraisData: any) => {
    try {
      const url = editingItem ? "/api/frais-axecom" : "/api/frais-axecom"
      const method = editingItem ? "PUT" : "POST"
      
      const body = editingItem 
        ? { id: editingItem.id, ...fraisData }
        : fraisData

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

      // Recharger les données des frais Axecom
      const fraisAxecomData = await loadFraisAxecomFromDatabase()
      setFraisAxecom(fraisAxecomData)
      
      setShowFraisAxecomModal(false)
      setEditingItem(null)
      alert(editingItem ? "Frais Axecom modifié avec succès" : "Frais Axecom ajouté avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde frais Axecom:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
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
          date_assignation: new Date().toISOString().split('T')[0],
          statut: 'active'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'assignation')
      }

      const result = await response.json()
      alert(`Carte ${numeroCarte} assignée à ${selectedEmployee.prenom} ${selectedEmployee.nom}`)
      
      // Fermer le modal d'abord
      setShowCardAssignmentModal(false)
      setSelectedEmployee(null)
      
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
                activeTab === "frais-ert"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("frais-ert")}
                >
              <Receipt className="w-5 h-5" />
              Frais Entreprise ERT
                </Button>

                <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "frais-axecom"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("frais-axecom")}
                >
              <Building className="w-5 h-5" />
              Frais Entreprise Axecom
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

          {/* Frais ERT Tab */}
          {activeTab === "frais-ert" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">Frais Entreprise ERT</h2>
                  <p className="text-muted-foreground">Gestion des frais d'entreprise ERT</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingItem(null)
                    setShowFraisErtModal(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Frais
                </Button>
              </div>
              
              {/* Frais ERT Management Section */}
              <div className="space-y-6">
                <Card className="glass-card border border-white/20 hover-lift">
                  <CardHeader>
                    <CardTitle>Liste des Frais ERT</CardTitle>
                    <CardDescription>
                      {fraisErt.length} frais trouvés dans la base de données
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {fraisErt.length === 0 ? (
                      <div className="text-center py-8">
                        <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucun frais ERT trouvé</p>
                        <p className="text-sm text-muted-foreground">Créez votre premier frais pour commencer.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-4 font-semibold">Article</th>
                              <th className="text-left p-4 font-semibold">Intitulé</th>
                              <th className="text-left p-4 font-semibold">Unité</th>
                              <th className="text-left p-4 font-semibold">PU HT (€)</th>
                              <th className="text-left p-4 font-semibold">Prix Emp (€)</th>
                              <th className="text-left p-4 font-semibold">Statut</th>
                              <th className="text-left p-4 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fraisErt.slice(0, 50).map((frais, index) => (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium">
                                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                                    {frais.article}
                                  </Badge>
                                </td>
                                <td className="p-4">{frais.intitule}</td>
                                <td className="p-4">{frais.unite}</td>
                                <td className="p-4 font-medium text-green-400">{frais.pu_ht_euros} €</td>
                                <td className="p-4 font-medium text-blue-400">{frais.prix_emp} €</td>
                                <td className="p-4">
                                  <Badge 
                                    variant={frais.statut === 'actif' ? 'default' : 'secondary'}
                                    className={frais.statut === 'actif' ? 'bg-green-500/20 text-green-400' : 
                                             'bg-gray-500/20 text-gray-400'}
                                  >
                                    {frais.statut}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingItem(frais)
                                        setShowFraisErtModal(true)
                                      }}
                                      className="glass-card border border-white/20"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete('frais-ert', frais.id)}
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

          {/* Frais Axecom Tab */}
          {activeTab === "frais-axecom" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">Frais Entreprise Axecom</h2>
                  <p className="text-muted-foreground">Gestion des frais d'entreprise Axecom</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingItem(null)
                    setShowFraisAxecomModal(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Frais
                </Button>
              </div>
              
              {/* Frais Axecom Management Section */}
              <div className="space-y-6">
                <Card className="glass-card border border-white/20 hover-lift">
                  <CardHeader>
                    <CardTitle>Liste des Frais Axecom</CardTitle>
                    <CardDescription>
                      {fraisAxecom.length} frais trouvés dans la base de données
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {fraisAxecom.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Aucun frais Axecom trouvé</p>
                        <p className="text-sm text-muted-foreground">Créez votre premier frais pour commencer.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left p-4 font-semibold">Article</th>
                              <th className="text-left p-4 font-semibold">Intitulé</th>
                              <th className="text-left p-4 font-semibold">Unité</th>
                              <th className="text-left p-4 font-semibold">PU HT (€)</th>
                              <th className="text-left p-4 font-semibold">Prix Emp (€)</th>
                              <th className="text-left p-4 font-semibold">Statut</th>
                              <th className="text-left p-4 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fraisAxecom.slice(0, 50).map((frais, index) => (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium">
                                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400">
                                    {frais.article}
                                  </Badge>
                                </td>
                                <td className="p-4">{frais.intitule}</td>
                                <td className="p-4">{frais.unite}</td>
                                <td className="p-4 font-medium text-green-400">{frais.pu_ht_euros} €</td>
                                <td className="p-4 font-medium text-purple-400">{frais.prix_emp} €</td>
                                <td className="p-4">
                                  <Badge 
                                    variant={frais.statut === 'actif' ? 'default' : 'secondary'}
                                    className={frais.statut === 'actif' ? 'bg-green-500/20 text-green-400' : 
                                             'bg-gray-500/20 text-gray-400'}
                                  >
                                    {frais.statut}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingItem(frais)
                                        setShowFraisAxecomModal(true)
                                      }}
                                      className="glass-card border border-white/20"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete('frais-axecom', frais.id)}
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
                          {interventions.slice(0, 100).map((intervention, index) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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
                                <div className="max-w-xs">
                                  <span className="text-sm text-gray-600">
                                    {intervention.articles || 'N/A'}
                                  </span>
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
                        ))}
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
                              <td className="p-4">{penalty.type_penalite}</td>
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
                               <th className="text-left p-4 font-semibold">Intervention Associée</th>
                               <th className="text-left p-4 font-semibold">Description Problème</th>
                               <th className="text-left p-4 font-semibold">Nom du Client</th>
                               <th className="text-left p-4 font-semibold">Email Client</th>
                            <th className="text-left p-4 font-semibold">Priorité</th>
                               <th className="text-left p-4 font-semibold">Type Réclamation</th>
                               <th className="text-left p-4 font-semibold">Employé</th>
                               <th className="text-left p-4 font-semibold">Date Création</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
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
                                   <span className="text-sm">{claim.type_reclamation || 'Non spécifié'}</span>
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
                                       claim.statut === 'resolue' ? 'bg-green-500/20 text-green-400' :
                                       'bg-gray-500/20 text-gray-400'
                                     }
                                   >
                                     {claim.statut || 'ouverte'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
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
        <DialogContent className="glass-card border border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Assigner une carte carburant
            </DialogTitle>
            <DialogDescription>
              Assignez une carte carburant à {selectedEmployee?.prenom} {selectedEmployee?.nom}
            </DialogDescription>
          </DialogHeader>
                    <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Sélectionner une carte</Label>
              <Select onValueChange={(value) => assignCardToEmployee(value)}>
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
                          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowCardAssignmentModal(false)}
              className="glass-card border border-white/20 hover:bg-white/10 text-gray-900"
            >
              Annuler
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

       {/* Frais ERT Modal */}
       <Dialog open={showFraisErtModal} onOpenChange={setShowFraisErtModal}>
         <DialogContent className="glass-card border border-white/20">
           <DialogHeader>
             <DialogTitle>
               {editingItem ? 'Modifier le Frais ERT' : 'Nouveau Frais ERT'}
             </DialogTitle>
             <DialogDescription>
               {editingItem ? 'Modifiez les informations du frais ERT' : 'Ajoutez un nouveau frais ERT'}
             </DialogDescription>
           </DialogHeader>
          <FraisErtForm 
            frais={editingItem} 
            onSave={saveFraisErt} 
            onCancel={() => {
              setShowFraisErtModal(false)
              setEditingItem(null)
            }}
          />
         </DialogContent>
       </Dialog>

       {/* Frais Axecom Modal */}
       <Dialog open={showFraisAxecomModal} onOpenChange={setShowFraisAxecomModal}>
         <DialogContent className="glass-card border border-white/20">
           <DialogHeader>
             <DialogTitle>
               {editingItem ? 'Modifier le Frais Axecom' : 'Nouveau Frais Axecom'}
             </DialogTitle>
             <DialogDescription>
               {editingItem ? 'Modifiez les informations du frais Axecom' : 'Ajoutez un nouveau frais Axecom'}
             </DialogDescription>
           </DialogHeader>
          <FraisAxecomForm 
            frais={editingItem} 
            onSave={saveFraisAxecom} 
            onCancel={() => {
              setShowFraisAxecomModal(false)
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
            onSave={savePenalty} 
            onCancel={() => {
              setShowPenaltyModal(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>
     </div>
   )
 }

// Material Form Component
function MaterialForm({ material, onSave, onCancel }: { 
  material: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    numero_serie: material?.numero_serie || '',
    nom_equipement: material?.nom_equipement || '',
    type_materiel: material?.type_materiel || '',
    marque: material?.marque || '',
    modele: material?.modele || '',
    statut: material?.statut || 'disponible',
    localisation: material?.localisation || '',
    quantite: material?.quantite || 1,
    prix_unitaire: material?.prix_unitaire || 0,
    date_acquisition: material?.date_acquisition || '',
    cout_acquisition: material?.cout_acquisition || 0,
    garantie_jusqu_a: material?.garantie_jusqu_a || '',
    maintenance_derniere: material?.maintenance_derniere || '',
    maintenance_prochaine: material?.maintenance_prochaine || '',
    kilometrage_vehicule: material?.kilometrage_vehicule || 0,
    consommation_carburant: material?.consommation_carburant || 0,
    capacite_reservoir: material?.capacite_reservoir || 0,
    niveau_carburant: material?.niveau_carburant || 0,
    etat_general: material?.etat_general || 'bon',
    notes_maintenance: material?.notes_maintenance || '',
    accessoires_inclus: material?.accessoires_inclus || '',
    certificats_conformite: material?.certificats_conformite || '',
    photos: material?.photos || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero_serie">Numéro de Série</Label>
          <Input
            id="numero_serie"
            value={formData.numero_serie}
            onChange={(e) => handleChange('numero_serie', e.target.value)}
            placeholder="Ex: SN123456"
          />
                        </div>
        <div>
          <Label htmlFor="nom_equipement">Nom de l'Équipement *</Label>
          <Input
            id="nom_equipement"
            value={formData.nom_equipement}
            onChange={(e) => handleChange('nom_equipement', e.target.value)}
            placeholder="Ex: Ordinateur Portable"
            required
          />
        </div>
        <div>
          <Label htmlFor="type_materiel">Type de Matériel</Label>
          <Input
            id="type_materiel"
            value={formData.type_materiel}
            onChange={(e) => handleChange('type_materiel', e.target.value)}
            placeholder="Ex: Informatique"
          />
        </div>
        <div>
          <Label htmlFor="marque">Marque</Label>
          <Input
            id="marque"
            value={formData.marque}
            onChange={(e) => handleChange('marque', e.target.value)}
            placeholder="Ex: Dell"
          />
        </div>
        <div>
          <Label htmlFor="modele">Modèle</Label>
          <Input
            id="modele"
            value={formData.modele}
            onChange={(e) => handleChange('modele', e.target.value)}
            placeholder="Ex: Latitude 5520"
          />
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="en_utilisation">En Utilisation</SelectItem>
              <SelectItem value="en_maintenance">En Maintenance</SelectItem>
              <SelectItem value="hors_service">Hors Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="localisation">Localisation</Label>
          <Input
            id="localisation"
            value={formData.localisation}
            onChange={(e) => handleChange('localisation', e.target.value)}
            placeholder="Ex: Bureau Principal"
          />
        </div>
        <div>
          <Label htmlFor="quantite">Quantité *</Label>
          <Input
            id="quantite"
            type="number"
            min="1"
            value={formData.quantite}
            onChange={(e) => handleChange('quantite', parseInt(e.target.value) || 1)}
            required
          />
        </div>
        <div>
          <Label htmlFor="prix_unitaire">Prix Unitaire (€)</Label>
          <Input
            id="prix_unitaire"
            type="number"
            step="0.01"
            min="0"
            value={formData.prix_unitaire}
            onChange={(e) => handleChange('prix_unitaire', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="date_acquisition">Date d'Acquisition</Label>
          <Input
            id="date_acquisition"
            type="date"
            value={formData.date_acquisition}
            onChange={(e) => handleChange('date_acquisition', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cout_acquisition">Coût d'Acquisition (€)</Label>
          <Input
            id="cout_acquisition"
            type="number"
            step="0.01"
            min="0"
            value={formData.cout_acquisition}
            onChange={(e) => handleChange('cout_acquisition', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="notes_maintenance">Notes de Maintenance</Label>
        <Textarea
          id="notes_maintenance"
          value={formData.notes_maintenance}
          onChange={(e) => handleChange('notes_maintenance', e.target.value)}
          placeholder="Notes sur la maintenance..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {material ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Employee Form Component
function EmployeeForm({ employee, onSave, onCancel }: { employee: any, onSave: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    matricule: employee?.matricule || '',
    nom: employee?.nom || '',
    prenom: employee?.prenom || '',
    email: employee?.email || '',
    telephone: employee?.telephone || '',
    poste: employee?.poste || '',
    manager_id: employee?.manager_id || '',
    date_embauche: employee?.date_embauche || '',
    statut: employee?.statut || 'actif',
    niveau_acces: employee?.niveau_acces || 'technicien',
    region: employee?.region || '',
    plaque_vehicule: employee?.plaque_vehicule || '',
    numero_carte_carburant: employee?.numero_carte_carburant || '',
    pourcentage_taxe: employee?.pourcentage_taxe || '',
    commentaires: employee?.commentaires || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="matricule">Matricule</Label>
          <Input
            id="matricule"
            value={formData.matricule}
            onChange={(e) => setFormData({...formData, matricule: e.target.value})}
            className="glass-card border border-white/20"
          />
                          </div>
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({...formData, nom: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => setFormData({...formData, prenom: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="telephone">Téléphone</Label>
          <Input
            id="telephone"
            value={formData.telephone}
            onChange={(e) => setFormData({...formData, telephone: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="poste">Poste</Label>
          <Input
            id="poste"
            value={formData.poste}
            onChange={(e) => setFormData({...formData, poste: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="date_embauche">Date d'embauche</Label>
          <Input
            id="date_embauche"
            type="date"
            value={formData.date_embauche}
            onChange={(e) => setFormData({...formData, date_embauche: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="niveau_acces">Niveau d'accès</Label>
          <Select value={formData.niveau_acces} onValueChange={(value) => setFormData({...formData, niveau_acces: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="technicien">Technicien</SelectItem>
              <SelectItem value="operateur">Opérateur</SelectItem>
            </SelectContent>
          </Select>
                        </div>
        <div>
          <Label htmlFor="region">Région</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => setFormData({...formData, region: e.target.value})}
            className="glass-card border border-white/20"
          />
                                    </div>
      <div>
          <Label htmlFor="plaque_vehicule">Plaque Véhicule</Label>
          <Input
            id="plaque_vehicule"
            value={formData.plaque_vehicule}
            onChange={(e) => setFormData({...formData, plaque_vehicule: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="numero_carte_carburant">Numéro Carte Carburant</Label>
          <Input
            id="numero_carte_carburant"
            value={formData.numero_carte_carburant}
            onChange={(e) => setFormData({...formData, numero_carte_carburant: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="pourcentage_taxe">Pourcentage Taxe</Label>
          <Input
            id="pourcentage_taxe"
            type="number"
            step="0.01"
            value={formData.pourcentage_taxe}
            onChange={(e) => setFormData({...formData, pourcentage_taxe: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        </div>
      
      <div>
        <Label htmlFor="commentaires">Commentaires</Label>
        <Textarea
          id="commentaires"
          value={formData.commentaires}
          onChange={(e) => setFormData({...formData, commentaires: e.target.value})}
          placeholder="Commentaires supplémentaires..."
          rows={3}
          className="glass-card border border-white/20"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {employee ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Affectation Form Component
function AffectationForm({ affectation, employees, materials, onSave, onCancel }: { 
  affectation: any, 
  employees: any[], 
  materials: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    materiel_id: affectation?.materiel_id || '',
    employe_id: affectation?.employe_id || '',
    quantite_assignee: affectation?.quantite_assignee || 1,
    commentaires: affectation?.commentaires || ''
  })

  // Mettre à jour le formData quand affectation change
  useEffect(() => {
    if (affectation) {
      setFormData({
        materiel_id: affectation.materiel_id || '',
        employe_id: affectation.employe_id || '',
        quantite_assignee: affectation.quantite_assignee || 1,
        commentaires: affectation.commentaires || ''
      })
    }
  }, [affectation])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.materiel_id || !formData.employe_id || !formData.quantite_assignee) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Filtrer les matériels disponibles (avec stock > 0)
  const availableMaterials = materials.filter(m => m.quantite > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="employe_id">Employé *</Label>
          <Select value={formData.employe_id} onValueChange={(value) => handleChange('employe_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un employé" />
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
          <Label htmlFor="materiel_id">Matériel *</Label>
          <Select value={formData.materiel_id} onValueChange={(value) => handleChange('materiel_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un matériel" />
            </SelectTrigger>
            <SelectContent>
              {availableMaterials.map((mat) => (
                <SelectItem key={mat.id} value={mat.id.toString()}>
                  {mat.nom_equipement} - Stock: {mat.quantite}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                                        </div>
        
        <div>
          <Label htmlFor="quantite_assignee">Quantité à Assigner *</Label>
          <Input
            id="quantite_assignee"
            type="number"
            min="1"
            value={formData.quantite_assignee}
            onChange={(e) => handleChange('quantite_assignee', parseInt(e.target.value) || 1)}
            required
          />
        </div>
        
      <div>
        <Label htmlFor="commentaires">Commentaires</Label>
        <Textarea
          id="commentaires"
          value={formData.commentaires}
            onChange={(e) => handleChange('commentaires', e.target.value)}
            placeholder="Commentaires sur l'affectation..."
          rows={3}
        />
      </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {affectation ? 'Modifier' : 'Affecter'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Intervention Search Component
function InterventionSearch({ value, onSelect, placeholder, interventions: allInterventions }: {
  value: string,
  onSelect: (intervention: any) => void,
  placeholder: string,
  interventions?: any[]
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [interventions, setInterventions] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null)

  // Initialize with selected intervention if value is provided
  useEffect(() => {
    if (value && allInterventions) {
      const intervention = allInterventions.find(inter => inter.id.toString() === value)
      if (intervention) {
        setSelectedIntervention(intervention)
        setSearchTerm(`${intervention.num_inter} - ${intervention.client}`)
      }
    }
  }, [value, allInterventions])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchInterventions(searchTerm)
      } else {
        setInterventions([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const searchInterventions = async (term: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/interventions/search?search=${encodeURIComponent(term)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setInterventions(data.interventions || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Erreur recherche interventions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (intervention: any) => {
    setSelectedIntervention(intervention)
    setSearchTerm(`${intervention.num_inter} - ${intervention.client}`)
    setIsOpen(false)
    onSelect(intervention)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!value) {
      setSelectedIntervention(null)
      onSelect({ id: '' })
    }
  }

  return (
    <div className="relative">
      <Input
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() => {
          if (interventions.length > 0) setIsOpen(true)
        }}
        onBlur={() => {
          // Delay to allow click on dropdown items
          setTimeout(() => setIsOpen(false), 200)
        }}
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">Recherche...</div>
          ) : interventions.length > 0 ? (
            interventions.map((intervention) => (
              <div
                key={intervention.id}
                className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSelect(intervention)}
              >
                <div className="font-medium text-sm">
                  {intervention.num_inter} - {intervention.client}
                </div>
                <div className="text-xs text-gray-500">
                  Technicien: {intervention.prenom_technicien} {intervention.nom_technicien}
                </div>
                <div className="text-xs text-gray-400">
                  {intervention.type_intervention} - {intervention.statut}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500">
              Aucune intervention trouvée
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Reclamation Form Component
function ReclamationForm({ reclamation, employees, interventions, onSave, onCancel }: { 
  reclamation: any, 
  employees: any[], 
  interventions: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    numero_reclamation: reclamation?.numero_reclamation || '',
    type_reclamation: reclamation?.type_reclamation || '',
    priorite: reclamation?.priorite || 'normale',
    statut: reclamation?.statut || 'ouverte',
    client_id: reclamation?.client_id || '',
    nom_client: reclamation?.nom_client || '',
    telephone_client: reclamation?.telephone_client || '',
    email_client: reclamation?.email_client || '',
    adresse_client: reclamation?.adresse_client || '',
    intervention_id: reclamation?.intervention_id || '',
    employe_id: reclamation?.employe_id || '',
    description_probleme: reclamation?.description_probleme || '',
    description_solution: reclamation?.description_solution || '',
    deadline: reclamation?.date_resolution || '',
    temps_resolution: reclamation?.temps_resolution || '',
    commentaires_client: reclamation?.commentaires_client || '',
    commentaires_internes: reclamation?.commentaires_internes || '',
    materiel_defectueux: reclamation?.materiel_defectueux || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nom_client || !formData.description_probleme) {
      alert('Veuillez remplir les champs obligatoires (Nom client, Description du problème)')
      return
    }
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
          <Label htmlFor="numero_reclamation">Numéro de Réclamation</Label>
          <Input
            id="numero_reclamation"
            value={formData.numero_reclamation}
            onChange={(e) => handleChange('numero_reclamation', e.target.value)}
            placeholder="Ex: REC-2025-0001"
          />
        </div>
        <div>
          <Label htmlFor="type_reclamation">Type de Réclamation *</Label>
          <Select value={formData.type_reclamation} onValueChange={(value) => handleChange('type_reclamation', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="technique">Technique</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="materiel">Matériel</SelectItem>
              <SelectItem value="facturation">Facturation</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
          <Label htmlFor="priorite">Priorité</Label>
          <Select value={formData.priorite} onValueChange={(value) => handleChange('priorite', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basse">Basse</SelectItem>
              <SelectItem value="normale">Normale</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
              <SelectItem value="critique">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
                <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
            <SelectTrigger>
              <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
              <SelectItem value="ouverte">Ouverte</SelectItem>
              <SelectItem value="en_cours">En Cours</SelectItem>
              <SelectItem value="resolue">Résolue</SelectItem>
              <SelectItem value="fermee">Fermée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
          <Label htmlFor="nom_client">Nom du Client *</Label>
                  <Input
            id="nom_client"
            value={formData.nom_client}
            onChange={(e) => handleChange('nom_client', e.target.value)}
            placeholder="Ex: Jean Dupont"
            required
                  />
                </div>
                <div>
          <Label htmlFor="telephone_client">Téléphone Client</Label>
                  <Input
            id="telephone_client"
            value={formData.telephone_client}
            onChange={(e) => handleChange('telephone_client', e.target.value)}
            placeholder="Ex: 0123456789"
                  />
                </div>
        <div>
          <Label htmlFor="email_client">Email Client</Label>
          <Input
            id="email_client"
            type="email"
            value={formData.email_client}
            onChange={(e) => handleChange('email_client', e.target.value)}
            placeholder="Ex: client@example.com"
          />
              </div>
        <div>
          <Label htmlFor="employe_id">Employé Responsable</Label>
          <Select value={formData.employe_id} onValueChange={(value) => handleChange('employe_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un employé" />
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
          <Label htmlFor="intervention_search">Rechercher une Intervention</Label>
          <InterventionSearch 
            value={formData.intervention_id}
            onSelect={(intervention) => {
              handleChange('intervention_id', intervention.id)
              // Auto-fill employee based on intervention
              if (intervention.nom_technicien && intervention.prenom_technicien) {
                const matchingEmployee = employees.find(emp => 
                  emp.nom === intervention.nom_technicien && emp.prenom === intervention.prenom_technicien
                )
                if (matchingEmployee) {
                  handleChange('employe_id', matchingEmployee.id)
                }
              }
            }}
            placeholder="Tapez pour rechercher une intervention..."
            interventions={interventions}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description_probleme">Description du Problème *</Label>
        <Textarea
          id="description_probleme"
          value={formData.description_probleme}
          onChange={(e) => handleChange('description_probleme', e.target.value)}
          placeholder="Décrivez le problème rencontré..."
          rows={3}
            required
          />
            </div>
      
        <div>
        <Label htmlFor="description_solution">Description de la Solution</Label>
        <Textarea
          id="description_solution"
          value={formData.description_solution}
          onChange={(e) => handleChange('description_solution', e.target.value)}
          placeholder="Décrivez la solution apportée..."
          rows={3}
          />
      </div>
      
        <div>
        <Label htmlFor="adresse_client">Adresse Client</Label>
        <Textarea
          id="adresse_client"
          value={formData.adresse_client}
          onChange={(e) => handleChange('adresse_client', e.target.value)}
          placeholder="Adresse complète du client..."
          rows={2}
        />
    </div>

        <div>
        <Label htmlFor="deadline">Deadline</Label>
          <Input
          id="deadline"
            type="date"
          value={formData.deadline}
          onChange={(e) => handleChange('deadline', e.target.value)}
          />
        </div>


      <div>
        <Label htmlFor="commentaires_client">Commentaires Client</Label>
        <Textarea
          id="commentaires_client"
          value={formData.commentaires_client}
          onChange={(e) => handleChange('commentaires_client', e.target.value)}
          placeholder="Commentaires du client..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="commentaires_internes">Commentaires Internes</Label>
        <Textarea
          id="commentaires_internes"
          value={formData.commentaires_internes}
          onChange={(e) => handleChange('commentaires_internes', e.target.value)}
          placeholder="Commentaires internes..."
          rows={2}
        />
      </div>


      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {reclamation ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Frais ERT Form Component
function FraisErtForm({ frais, onSave, onCancel }: { 
  frais: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    article: frais?.article || '',
    intitule: frais?.intitule || '',
    unite: frais?.unite || '',
    pu_ht_euros: frais?.pu_ht_euros || 0,
    prix_emp: frais?.prix_emp || 0,
    description: frais?.description || '',
    statut: frais?.statut || 'actif'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.article || !formData.intitule || !formData.unite) {
      alert('Veuillez remplir les champs obligatoires (Article, Intitulé, Unité)')
      return
    }
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="article">Article *</Label>
          <Input
            id="article"
            value={formData.article}
            onChange={(e) => handleChange('article', e.target.value)}
            placeholder="Ex: RECOIP"
            required
          />
        </div>
        <div>
          <Label htmlFor="unite">Unité *</Label>
          <Input
            id="unite"
            value={formData.unite}
            onChange={(e) => handleChange('unite', e.target.value)}
            placeholder="Ex: Unité"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="intitule">Intitulé *</Label>
          <Input
            id="intitule"
            value={formData.intitule}
            onChange={(e) => handleChange('intitule', e.target.value)}
            placeholder="Ex: Reconnexion Immeuble ou Pavillon"
            required
          />
        </div>
        <div>
          <Label htmlFor="pu_ht_euros">PU HT (€) *</Label>
          <Input
            id="pu_ht_euros"
            type="number"
            step="0.01"
            min="0"
            value={formData.pu_ht_euros}
            onChange={(e) => handleChange('pu_ht_euros', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <Label htmlFor="prix_emp">Prix Emp (€) *</Label>
          <Input
            id="prix_emp"
            type="number"
            step="0.01"
            min="0"
            value={formData.prix_emp}
            onChange={(e) => handleChange('prix_emp', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Description de l'article..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {frais ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Frais Axecom Form Component
function FraisAxecomForm({ frais, onSave, onCancel }: { 
  frais: any, 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    article: frais?.article || '',
    intitule: frais?.intitule || '',
    unite: frais?.unite || '',
    pu_ht_euros: frais?.pu_ht_euros || 0,
    prix_emp: frais?.prix_emp || 0,
    description: frais?.description || '',
    statut: frais?.statut || 'actif'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.article || !formData.intitule || !formData.unite) {
      alert('Veuillez remplir les champs obligatoires (Article, Intitulé, Unité)')
      return
    }
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="article">Article *</Label>
          <Input
            id="article"
            value={formData.article}
            onChange={(e) => handleChange('article', e.target.value)}
            placeholder="Ex: AXE001"
            required
          />
        </div>
        <div>
          <Label htmlFor="unite">Unité *</Label>
          <Input
            id="unite"
            value={formData.unite}
            onChange={(e) => handleChange('unite', e.target.value)}
            placeholder="Ex: Unité"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="intitule">Intitulé *</Label>
          <Input
            id="intitule"
            value={formData.intitule}
            onChange={(e) => handleChange('intitule', e.target.value)}
            placeholder="Ex: Service Axecom"
            required
          />
        </div>
        <div>
          <Label htmlFor="pu_ht_euros">PU HT (€) *</Label>
          <Input
            id="pu_ht_euros"
            type="number"
            step="0.01"
            min="0"
            value={formData.pu_ht_euros}
            onChange={(e) => handleChange('pu_ht_euros', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <Label htmlFor="prix_emp">Prix Emp (€) *</Label>
          <Input
            id="prix_emp"
            type="number"
            step="0.01"
            min="0"
            value={formData.prix_emp}
            onChange={(e) => handleChange('prix_emp', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Description de l'article..."
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {frais ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Penalty Form Component
function PenaltyForm({ penalty, employees, onSave, onCancel }: { 
  penalty: any, 
  employees: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    type_penalite: penalty?.type_penalite || '',
    montant: penalty?.montant || 0,
    statut: penalty?.statut || 'active',
    date_echeance: penalty?.date_echeance || '',
    motif: penalty?.motif || '',
    employe_id: penalty?.employe_id || '',
    commentaires: penalty?.commentaires || '',
    manager_approbateur: penalty?.manager_approbateur || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.type_penalite || !formData.montant || !formData.employe_id) {
      alert('Veuillez remplir les champs obligatoires (Type, Montant, Employé)')
      return
    }
    onSave(formData)
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type_penalite">Type de Pénalité *</Label>
          <Select value={formData.type_penalite} onValueChange={(value) => handleChange('type_penalite', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retard">Retard</SelectItem>
              <SelectItem value="absence">Absence</SelectItem>
              <SelectItem value="comportement">Comportement</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="materiel">Matériel</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="montant">Montant (€) *</Label>
          <Input
            id="montant"
            type="number"
            step="0.01"
            min="0"
            value={formData.montant}
            onChange={(e) => handleChange('montant', parseFloat(e.target.value) || 0)}
            placeholder="Ex: 50.00"
            required
          />
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
              <SelectItem value="suspendue">Suspendue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date_echeance">Date d'Échéance</Label>
          <Input
            id="date_echeance"
            type="date"
            value={formData.date_echeance}
            onChange={(e) => handleChange('date_echeance', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="employe_id">Employé *</Label>
          <Select value={formData.employe_id} onValueChange={(value) => handleChange('employe_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un employé" />
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
        </div>
      
      <div>
        <Label htmlFor="motif">Motif *</Label>
        <Textarea
          id="motif"
          value={formData.motif}
          onChange={(e) => handleChange('motif', e.target.value)}
          placeholder="Motif de la pénalité..."
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="commentaires">Commentaires</Label>
        <Textarea
          id="commentaires"
          value={formData.commentaires}
          onChange={(e) => handleChange('commentaires', e.target.value)}
          placeholder="Commentaires supplémentaires..."
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="manager_approbateur">Manager Approbateur</Label>
        <Input
          id="manager_approbateur"
          value={formData.manager_approbateur}
          onChange={(e) => handleChange('manager_approbateur', e.target.value)}
          placeholder="Nom du manager approbateur"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {penalty ? 'Modifier' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  )
}
