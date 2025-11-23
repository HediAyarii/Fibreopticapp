"use client"

import React from "react"
import dynamic from "next/dynamic"
import { useState, useEffect, useMemo } from "react"
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
import { AdminDocumentsManager } from "@/components/AdminDocumentsManager"
import { HistoriqueManager } from "@/components/HistoriqueManager"
import { MaterialForm, EmployeeForm } from "@/components/Forms"
import { AffectationForm, InterventionSearch } from "@/components/SearchForms"
import { AffectationTest } from "@/components/AffectationTest"
import { EmployeeMaterialValueTable } from "@/components/EmployeeMaterialValueTable"
import { RecapCalculTable } from "@/components/RecapCalculTable"
import { ReclamationForm } from "@/components/ReclamationForm"
import { PenaltyForm, ArticlesEditModal } from "@/components/PenaltyAndArticlesForms"
import { VehiculeForm } from "@/components/VehiculeForm"
import { AssignationVehiculeForm } from "@/components/AssignationVehiculeForm"
import { EntretienVehiculeForm } from "@/components/EntretienVehiculeForm"
import { ValidationKmList } from "@/components/ValidationKmList"
import { MonVehicule } from "@/components/MonVehicule"
import { TestKmAlerts } from "@/components/TestKmAlerts"
import { PricingTable } from "@/components/PricingTable"
import { TarifsManager } from "@/components/TarifsManager"
import { RevenueCalculation } from "@/components/RevenueCalculation"
import { CoutParSalaireManager } from "@/components/CoutParSalaireManager"
import ReclamationsTechniques from "@/components/ReclamationsTechniques"
import AutoSyncTotalGenere from "@/components/AutoSyncTotalGenere"
import SyncButton from "@/components/SyncButton"
import AutoDetectButton from "@/components/AutoDetectButton"
import RapAutoCorrectButton from "@/components/RapAutoCorrectButton"
import FailureStatistics from "@/components/FailureStatistics"
import EmployeeSyncManager from "@/components/EmployeeSyncManager"
import UserManagement from "@/components/UserManagement"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useSmartRealtime } from "@/hooks/useSmartRealtime"

// Import dynamique sans SSR pour éviter les erreurs d'hydratation
const RaccByTypeStatistics = dynamic(() => import("@/components/RaccByTypeStatistics"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
})

const ParcoursStatistics = dynamic(() => import("@/components/ParcoursStatistics"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>
})
// import { useEmployeeUpdates } from "@/hooks/useEmployeeUpdates" // Désactivé pour éviter les erreurs de build
import {
  Building2,
  Users,
  UserPlus,
  FileText,
  Calculator,
  BarChart3,
  TrendingUp,
  LogOut,
  Upload,
  Search,
  Loader2,
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
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Building,
  X,
  Timer,
  Minus,
  Camera,
  AlertCircle,
  History,
  Filter,
  MessageSquare,
  RotateCcw,
  Car,
  Wrench,
  UserCheck,
  Clock,
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
const loadInterventionsFromDatabase = async (filters?: any) => {
  try {
    // Construire les paramètres de requête
    const params = new URLSearchParams()
    
    if (filters) {
      if (filters.statut && filters.statut !== 'all') params.append('statut', filters.statut)
      if (filters.numInter) params.append('numInter', filters.numInter)
      if (filters.dateRdvStart) params.append('dateRdvStart', filters.dateRdvStart)
      if (filters.dateRdvEnd) params.append('dateRdvEnd', filters.dateRdvEnd)
      if (filters.client && filters.client !== 'all') params.append('client', filters.client)
      if (filters.grille && filters.grille !== 'all') params.append('grille', filters.grille)
      if (filters.sansArticles) params.append('sansArticles', 'true')
      if (filters.typeIntervention && filters.typeIntervention !== 'all') params.append('typeIntervention', filters.typeIntervention)
      if (filters.technicien && filters.technicien !== 'all') params.append('technicien', filters.technicien)
    }
    
    const queryString = params.toString()
    const url = `/api/interventions${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error("Erreur lors du chargement des interventions")
    const data = await response.json()
    return {
      interventions: data.interventions || [],
      total: data.total || 0
    }
  } catch (error) {
    console.error("[v0] Erreur chargement interventions:", error)
    return {
      interventions: [],
      total: 0
    }
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
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  // Helper function to safely check if data is valid
  const isValidArray = (data: any): data is any[] => {
    return Array.isArray(data) && data.length >= 0
  }

  // Hook pour gérer les permissions
  const { hasPermission, isAdmin, getAvailableSections } = useUserPermissions()

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
  
  // Polling automatique DÉSACTIVÉ pour meilleures performances
  // Les données se rechargent quand nécessaire (changement d'onglet, actions utilisateur)
  // Si besoin de temps réel, utiliser WebSocket via useSocketIO.tsx
  
  /*
  const { isConnected: realtimeConnected } = useSmartRealtime({
    interval: 30000, // 30 secondes
    enabled: isLoggedIn,
    onUpdate: () => {
      // Mise à jour seulement des données critiques
      loadPenaltiesFromDatabase()
      loadClaimsFromDatabase()
    }
  })
  */
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Data states - loaded from PostgreSQL
  const [interventions, setInterventions] = useState<any[]>([])
  const [totalInterventions, setTotalInterventions] = useState<number>(0) // Total réel d'interventions
  const [fuelData, setFuelData] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [depotFilter, setDepotFilter] = useState<'ALL' | 'AXECOM' | 'ERT'>('ALL')
  const [materialSearch, setMaterialSearch] = useState<string>('')
  const [materialPage, setMaterialPage] = useState<number>(1)
  const [materialItemsPerPage] = useState<number>(20)
  const [penalties, setPenalties] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [affectations, setAffectations] = useState<any[]>([])
  const [consommationCarburant, setConsommationCarburant] = useState<any[]>([])
  const [employeesFromInterventions, setEmployeesFromInterventions] = useState<any[]>([])
  const [totalRevenue, setTotalRevenue] = useState<number>(0) // CA Total réel

  // États pour les véhicules
  const [vehicules, setVehicules] = useState<any[]>([])
  const [assignationsVehicules, setAssignationsVehicules] = useState<any[]>([])
  const [entretiensVehicules, setEntretiensVehicules] = useState<any[]>([])
  const [kmUpdates, setKmUpdates] = useState<any[]>([])
  const [loadingVehicules, setLoadingVehicules] = useState(false)
  const [showVehiculeModal, setShowVehiculeModal] = useState(false)
  const [showAssignationVehiculeModal, setShowAssignationVehiculeModal] = useState(false)
  const [showEntretienVehiculeModal, setShowEntretienVehiculeModal] = useState(false)
  const [editingVehicule, setEditingVehicule] = useState<any>(null)
  const [editingAssignationVehicule, setEditingAssignationVehicule] = useState<any>(null)
  const [editingEntretienVehicule, setEditingEntretienVehicule] = useState<any>(null)
  const [vehiculesSubTab, setVehiculesSubTab] = useState<'flotte' | 'assignations' | 'validations' | 'entretiens'>('flotte')

  // Filtres pour réclamations
  const [claimSearchTerm, setClaimSearchTerm] = useState('')
  const [claimEmployeeFilter, setClaimEmployeeFilter] = useState<string>('all')
  const [claimDateFilter, setClaimDateFilter] = useState<string>('all')

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

  // Tax edit states
  const [editingTaxEmployee, setEditingTaxEmployee] = useState<any>(null)
  const [taxValue, setTaxValue] = useState("")
  const [savingTax, setSavingTax] = useState(false)

  // Photos management states
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<any>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Transfer material states
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedMaterialForTransfer, setSelectedMaterialForTransfer] = useState<any>(null)
  const [transferQuantity, setTransferQuantity] = useState<number>(0)
  const [transferDepotDestination, setTransferDepotDestination] = useState<'AXECOM' | 'ERT'>('AXECOM')
  const [transferMotif, setTransferMotif] = useState<string>('')
  const [transferComments, setTransferComments] = useState<string>('')
  const [stockSortOrder, setStockSortOrder] = useState<'asc' | 'desc'>('desc')
  const [transferring, setTransferring] = useState(false)

  // Interventions filtering states - Initialisé avec le mois précédent
  const [interventionFilters, setInterventionFilters] = useState(() => {
    const today = new Date()
    // Calculer le premier jour du mois précédent
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    // Calculer le dernier jour du mois précédent (jour 0 du mois actuel = dernier jour du mois précédent)
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    
    console.log('📅 Initialisation des filtres:')
    console.log('  Aujourd\'hui:', today.toLocaleDateString('fr-FR'))
    console.log('  Mois actuel:', today.getMonth() + 1) // +1 car getMonth() retourne 0-11
    console.log('  Premier jour mois précédent:', firstDayLastMonth.toLocaleDateString('fr-FR'))
    console.log('  Dernier jour mois précédent:', lastDayLastMonth.toLocaleDateString('fr-FR'))
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const startDate = formatDate(firstDayLastMonth)
    const endDate = formatDate(lastDayLastMonth)
    
    console.log('  Date début (format ISO):', startDate)
    console.log('  Date fin (format ISO):', endDate)
    
    return {
      statut: '',
      dateRdvStart: startDate,
      dateRdvEnd: endDate,
      numInter: '',
      client: '',
      grille: '',
      sansArticles: false,
      typeIntervention: '',
      technicien: ''
    }
  })
  // Cache des derniers filtres appliqués pour éviter les requêtes inutiles
  const [lastAppliedFilters, setLastAppliedFilters] = useState<any>(null)
  const [filteredInterventions, setFilteredInterventions] = useState<any[]>([])
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [loadingDuplicates, setLoadingDuplicates] = useState(false)
  const [showCardAssignmentModal, setShowCardAssignmentModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  
  // Pagination states for interventions
  const [interventionsPage, setInterventionsPage] = useState(1)
  const [interventionsPerPage] = useState(50)

  // Pagination states for consommation carburant
  const [consommationPage, setConsommationPage] = useState(1)
  const [consommationPerPage] = useState(50)
  const [availableCards, setAvailableCards] = useState<any[]>([])
  const [selectedCardNumber, setSelectedCardNumber] = useState('')
  const [assignmentStartDate, setAssignmentStartDate] = useState('')
  const [assignmentEndDate, setAssignmentEndDate] = useState('')
  const [assignmentComments, setAssignmentComments] = useState('')
  const [assignmentType, setAssignmentType] = useState<'permanent' | 'temporary'>('temporary')
  const [showUnassignModal, setShowUnassignModal] = useState(false)
  
  // Employee sync states
  const [showEmployeeSync, setShowEmployeeSync] = useState(false)
  const [autoSyncTriggered, setAutoSyncTriggered] = useState(false)
  const [unassignComments, setUnassignComments] = useState('')
  const [showCardHistoryModal, setShowCardHistoryModal] = useState(false)
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<any>(null)
  
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
  
  // États pour les filtres de consommation carburant
  const [consumptionFilters, setConsumptionFilters] = useState({
    date_debut: defaultDates.start,
    date_fin: defaultDates.end,
    employe_id: 'all',
    numero_carte: 'all'
  })
  const [consumptionData, setConsumptionData] = useState<any>({
    consommations: [],
    stats: {},
    parEmploye: [],
    parCarte: []
  })
  const [loadingConsumption, setLoadingConsumption] = useState(false)
  const [cardHistory, setCardHistory] = useState<any[]>([])
  const [showAssignmentHistoryModal, setShowAssignmentHistoryModal] = useState(false)
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

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

  // États pour les mises à jour en temps réel
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [updateNotification, setUpdateNotification] = useState<string | null>(null)

  // Fonctions de gestion des mises à jour SSE
  const handleEmployeeUpdate = (update: any) => {
    console.log('📡 Mise à jour employé reçue:', update)
    setLastUpdateTime(new Date())
    
    if (update.type === 'employee_updated' && update.employeeData) {
      // Mettre à jour l'employé dans la liste locale
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === update.employeeId 
            ? { ...emp, ...update.employeeData }
            : emp
        )
      )
      
      setUpdateNotification(`Employé ${update.employeeData.prenom} ${update.employeeData.nom} mis à jour`)
      
      // Masquer la notification après 3 secondes
      setTimeout(() => setUpdateNotification(null), 3000)
    }
  }

  const handlePersonalDataUpdate = (update: any) => {
    console.log('📡 Mise à jour données personnelles reçue:', update)
    setLastUpdateTime(new Date())
    
    // Mettre à jour l'employé dans la liste locale
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        emp.id === update.employeeId 
          ? { ...emp, [update.field]: update.newValue }
          : emp
      )
    )
    
    setUpdateNotification(`Données personnelles de l'employé ID ${update.employeeId} mises à jour`)
    
    // Masquer la notification après 3 secondes
    setTimeout(() => setUpdateNotification(null), 3000)
  }

  // Hook pour les mises à jour en temps réel (désactivé temporairement)
  // const { isConnected } = useEmployeeUpdates({
  //   onEmployeeUpdate: handleEmployeeUpdate,
  //   onPersonalDataUpdate: handlePersonalDataUpdate,
  //   enabled: isLoggedIn
  // })

  // Solution alternative : polling automatique plus fréquent
  const [isConnected, setIsConnected] = useState(true)

  // Fonction de synchronisation automatique des employés
  const autoSyncEmployees = async () => {
    if (autoSyncTriggered) return // Éviter les appels multiples
    
    try {
      console.log('🔄 Synchronisation automatique des employés...')
      setAutoSyncTriggered(true)
      
      const response = await fetch('/api/sync/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data.employes_crees > 0) {
          console.log(`✅ ${data.data.employes_crees} employés créés automatiquement`)
          // Recharger les données des employés
          loadDataFromDatabase()
        }
      }
    } catch (error) {
      console.log('⚠️ Erreur synchronisation automatique:', error)
    }
  }

  // Filtrer les réclamations selon les critères de recherche
  const filteredClaims = useMemo(() => {
    let filtered = [...claims]
    
    // Filtre par numéro d'intervention
    if (claimSearchTerm) {
      const searchLower = claimSearchTerm.toLowerCase().trim()
      filtered = filtered.filter(claim => {
        const numInter = (claim.numero_intervention || claim.intervention_id || '').toString().toLowerCase()
        return numInter.includes(searchLower)
      })
    }
    
    // Filtre par employé
    if (claimEmployeeFilter !== 'all') {
      filtered = filtered.filter(claim => 
        claim.employe_id && claim.employe_id.toString() === claimEmployeeFilter
      )
    }
    
    // Filtre par date de création
    if (claimDateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      filtered = filtered.filter(claim => {
        if (!claim.created_at) return false
        const claimDate = new Date(claim.created_at)
        
        switch (claimDateFilter) {
          case 'today':
            return claimDate >= today
          case 'week':
            const weekAgo = new Date(today)
            weekAgo.setDate(today.getDate() - 7)
            return claimDate >= weekAgo
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            return claimDate >= monthStart
          case 'last-month':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            return claimDate >= lastMonthStart && claimDate <= lastMonthEnd
          default:
            return true
        }
      })
    }
    
    return filtered
  }, [claims, claimSearchTerm, claimEmployeeFilter, claimDateFilter])

  // Load data from database on component mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      // Charger SEULEMENT les données essentielles au démarrage
      loadEssentialData()
    }
  }, [isLoggedIn])

  // Lazy loading: charger les données selon l'onglet actif
  useEffect(() => {
    if (!isLoggedIn) return
    
    switch(activeTab) {
      case 'interventions':
        // Les interventions sont chargées automatiquement par le useEffect des filtres
        break
      case 'carburant':
        if (fuelData.length === 0) {
          loadAvailableCards()
          loadFuelGroupedData()
          loadFuelEmployeesData()
        }
        break
      case 'fuel-consumption':
        // Charger les cartes disponibles pour le filtre
        if (fuelData.length === 0) {
          loadFuelDataFromDatabase().then(data => setFuelData(data || []))
        }
        break
      case 'materiel':
        if (materials.length === 0) {
          loadMaterialsFromDatabase().then(setMaterials)
        }
        if (affectations.length === 0) {
          loadAffectationsFromDatabase().then(setAffectations)
        }
        break
      case 'tarifs':
        if (tarifs.length === 0) {
          loadTarifsFromDatabase()
        }
        break
      case 'vehicules':
        if (vehicules.length === 0) {
          setLoadingVehicules(true)
          Promise.all([
            loadVehiculesFromDatabase(),
            loadAssignationsVehiculesFromDatabase(),
            loadEntretiensVehiculesFromDatabase(),
            loadKmUpdatesFromDatabase()
          ]).then(([vehiculesData, assignationsData, entretiensData, kmUpdatesData]) => {
            setVehicules(vehiculesData)
            setAssignationsVehicules(assignationsData)
            setEntretiensVehicules(entretiensData)
            setKmUpdates(kmUpdatesData)
          }).finally(() => setLoadingVehicules(false))
        }
        break
      // dashboard, employes, penalites, reclamations sont déjà chargés
    }
  }, [activeTab, isLoggedIn])

  // Reload materials when depot filter changes while on materials tab
  useEffect(() => {
    if (!isLoggedIn) return
    if (activeTab !== 'materials') return
    // Fetch materials for selected depot
    (async () => {
      try {
        const params = depotFilter && depotFilter !== 'ALL' ? `?depot=${encodeURIComponent(depotFilter)}` : ''
        const response = await fetch(`/api/materiel${params}`)
        if (!response.ok) throw new Error('Erreur lors du chargement du matériel')
        const data = await response.json()
        setMaterials(data.materiel || [])
      } catch (err) {
        console.error('Erreur rechargement materiel après changement de dépôt:', err)
        setMaterials([])
      }
    })()
  }, [depotFilter, activeTab, isLoggedIn])

  // Fonction pour charger les données essentielles au login
  const loadEssentialData = async () => {
    try {
      // Charger en parallèle uniquement les données critiques pour le dashboard
      await Promise.all([
        loadDataFromDatabase(), // Charger interventions, carburant et revenue pour le tableau de bord
        loadEmployeesFromDatabase(),
        (async () => {
          setLoadingPenalties(true)
          try {
            const data = await loadPenaltiesFromDatabase()
            setPenalties(data)
          } finally {
            setLoadingPenalties(false)
          }
        })(),
        (async () => {
          setLoadingClaims(true)
          try {
            const data = await loadClaimsFromDatabase()
            setClaims(data)
          } finally {
            setLoadingClaims(false)
          }
        })()
      ])
      
      // Synchronisation auto en arrière-plan (non-bloquante)
      setTimeout(() => autoSyncEmployees(), 1000)
    } catch (error) {
      console.error("Erreur lors du chargement des données essentielles:", error)
    }
  }

  // Reload grouped data when period or date range changes
  useEffect(() => {
    if (isLoggedIn) {
      loadFuelGroupedData()
    }
  }, [fuelPeriod, fuelDateRange])

  // Auto-apply filters with debounce to avoid multiple queries
  useEffect(() => {
    // Ne charger que si on est sur l'onglet interventions et connecté
    if (!isLoggedIn || activeTab !== 'interventions') return
    
    // Debounce pour éviter les requêtes multiples lors de changements rapides
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Debounce terminé, application des filtres...')
      applyInterventionFilters()
      setInterventionsPage(1)
    }, 300) // 300ms de délai
    
    return () => clearTimeout(timeoutId)
  }, [interventionFilters, activeTab, isLoggedIn])

  // Reset consommation page when filters change
  useEffect(() => {
    setConsommationPage(1)
  }, [consumptionFilters])

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
    // Nettoyer les articles pour l'édition (remplacer "nan" par chaîne vide)
    const cleanArticles = intervention.articles && intervention.articles.toString().toLowerCase() !== 'nan' 
      ? intervention.articles 
      : ""
    setArticlesText(cleanArticles)
    setShowArticlesModal(true)
  }

  const handleSaveArticles = async (id?: number, articles?: string) => {
    const interventionId = id || editingIntervention?.id
    const articlesToSave = articles || articlesText

    if (!interventionId) return

    console.log('🔍 Debug - Articles à sauvegarder:', articlesToSave)
    console.log('🔍 Debug - Intervention ID:', interventionId)

    setSavingArticles(true)
    try {
      // Nettoyer les articles (supprimer "nan" et valeurs vides)
      const cleanArticles = articlesToSave.trim() === '' || articlesToSave.toLowerCase() === 'nan' ? '' : articlesToSave.trim()
      
      console.log('🔍 Debug - Articles nettoyés:', cleanArticles)

      const response = await fetch('/api/interventions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: interventionId,
          articles: cleanArticles
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update the intervention in the local state
        setInterventions(prev => 
          prev.map(intervention => 
            intervention.id === interventionId 
              ? { ...intervention, articles: cleanArticles }
              : intervention
          )
        )
        
        setShowArticlesModal(false)
        setEditingIntervention(null)
        setArticlesText("")
        
        // Recharger les données pour mettre à jour les recettes
        await loadDataFromDatabase()
        
        // Forcer le rechargement des recettes avec un délai
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('reloadRevenueData'))
        }, 500)
        
        console.log("Articles sauvegardés avec succès:", data)
        alert('Articles mis à jour avec succès! Les recettes seront actualisées automatiquement.')
      } else {
        console.error("Erreur lors de la sauvegarde des articles")
        alert('Erreur lors de la sauvegarde des articles')
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des articles:", error)
      alert('Erreur lors de la sauvegarde des articles')
    } finally {
      setSavingArticles(false)
    }
  }

  const handleCancelArticles = () => {
    setShowArticlesModal(false)
    setEditingIntervention(null)
    setArticlesText("")
  }

  // Tax edit functions
  const handleEditTax = (employee: any) => {
    setEditingTaxEmployee(employee)
    setTaxValue(employee.pourcentage_taxe ? employee.pourcentage_taxe.toString() : "0")
  }

  const handleSaveTax = async () => {
    if (!editingTaxEmployee) return

    const taxValueNum = parseFloat(taxValue)
    if (isNaN(taxValueNum) || taxValueNum < 0 || taxValueNum > 100) {
      alert("Le pourcentage de taxe doit être entre 0 et 100")
      return
    }

    setSavingTax(true)
    try {
      const response = await fetch('/api/employes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTaxEmployee.id,
          pourcentage_taxe: taxValueNum
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Taxe mise à jour:', data)
        
        // Mettre à jour l'employé dans la liste locale
        setEmployees(prevEmployees => 
          prevEmployees.map(emp => 
            emp.id === editingTaxEmployee.id 
              ? { ...emp, pourcentage_taxe: taxValueNum }
              : emp
          )
        )
        
        setEditingTaxEmployee(null)
        setTaxValue("")
        alert(`Taxe mise à jour avec succès: ${taxValueNum}%`)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur sauvegarde taxe:', error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    } finally {
      setSavingTax(false)
    }
  }

  const handleCancelTax = () => {
    setEditingTaxEmployee(null)
    setTaxValue("")
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
  const applyInterventionFilters = async () => {
    // Vérifier si les filtres ont changé pour éviter les requêtes inutiles
    if (lastAppliedFilters && JSON.stringify(lastAppliedFilters) === JSON.stringify(interventionFilters)) {
      console.log('⚠️ Filtres identiques, requête évitée')
      return
    }

    setLoadingInterventions(true)
    try {
      console.log('🔍 Application des filtres:', interventionFilters)
      const result = await loadInterventionsFromDatabase(interventionFilters)
      setInterventions(result.interventions)
      setTotalInterventions(result.total)
      setFilteredInterventions([]) // Clear client-side filters since we're using server-side
      setInterventionsPage(1) // Reset to first page
      setLastAppliedFilters({ ...interventionFilters }) // Sauvegarder les filtres appliqués
      console.log(`✅ ${result.total} interventions trouvées (${result.interventions.length} affichées)`)
    } catch (error) {
      console.error('Erreur lors de l\'application des filtres:', error)
    } finally {
      setLoadingInterventions(false)
    }
  }

  const handleFilterChange = (filterType: string, value: string | boolean) => {
    setInterventionFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const clearFilters = async () => {
    // Calculer les dates du mois précédent
    const today = new Date()
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    setInterventionFilters({
      statut: '',
      dateRdvStart: formatDate(firstDayLastMonth),
      dateRdvEnd: formatDate(lastDayLastMonth),
      numInter: '',
      client: '',
      grille: '',
      sansArticles: false,
      typeIntervention: '',
      technicien: ''
    })
    setFilteredInterventions([])
    setLastAppliedFilters(null) // Réinitialiser le cache pour forcer le rechargement
    setInterventionsPage(1)
    
    // Le useEffect va automatiquement appliquer les filtres du mois précédent
  }

  // Get unique statuts for filter dropdown
  const getUniqueStatuts = () => {
    const statuts = interventions
      .map(intervention => intervention.statut)
      .filter(statut => statut && statut.trim() !== '')
      .map(statut => statut.toString())
    
    return [...new Set(statuts)].sort()
  }

  // Get unique clients for filter dropdown
  const getUniqueClients = () => {
    const clients = interventions
      .map(intervention => intervention.client)
      .filter(client => client && client.trim() !== '')
      .map(client => client.toString())
    
    return [...new Set(clients)].sort()
  }

  // Get unique intervention types for filter dropdown
  const getUniqueInterventionTypes = () => {
    const types = interventions
      .map(intervention => intervention.type_intervention)
      .filter(type => type && type.trim() !== '')
      .map(type => type.toString())
    
    return [...new Set(types)].sort()
  }

  // Get unique technicians for filter dropdown
  const getUniqueTechnicians = () => {
    const technicians = interventions
      .map(intervention => {
        const nom = intervention.nom_technicien || ''
        const prenom = intervention.prenom_technicien || ''
        return `${prenom} ${nom}`.trim()
      })
      .filter(technician => technician.trim() !== '')
    
    return [...new Set(technicians)].sort()
  }

  // Check and remove duplicates
  const handleCheckDuplicates = async () => {
    if (!confirm('⚠️ Cette action va supprimer les doublons définitivement.\n\nVoulez-vous continuer ?')) {
      return
    }

    setLoadingDuplicates(true)
    try {
      const response = await fetch('/api/duplicates-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des doublons')
      }

      const data = await response.json()
      
      // Message amélioré avec les statistiques
      const stats = `
✅ NETTOYAGE TERMINÉ EN ${data.executionTime}

📊 Résultats:
• ${data.totalDuplicateGroups} groupes de doublons traités
• ${data.deletedCount} doublons supprimés
• ${data.dupCleanedCount || 0} entrées _DUP_ nettoyées

${data.summary && data.summary.length > 0 ? '\n🔍 Exemples de doublons trouvés:\n' + data.summary.slice(0, 3).map((s: any) => `  • ${s.num_inter} (${s.count} fois)`).join('\n') : ''}
      `
      
      alert(stats)
      
      console.log('✅ Résultat du nettoyage:', data)
      
      // Recharger les données
      await loadDataFromDatabase()
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des doublons:', error)
      alert('Erreur lors de la vérification des doublons: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    } finally {
      setLoadingDuplicates(false)
    }
  }

  // Supprimer toutes les interventions
  const handleClearAllInterventions = async () => {
    if (!confirm('⚠️ ATTENTION: Cette action va supprimer TOUTES les interventions de la base de données.\n\nÊtes-vous sûr de vouloir continuer ?')) {
      return
    }

    try {
      const response = await fetch('/api/clear-all-interventions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression des interventions')
      }

      const data = await response.json()
      
      // Afficher un message de confirmation
      alert(`✅ Suppression terminée !\n\n${data.message}`)
      
      console.log('Résultat de la suppression:', data)
      
      // Recharger les données
      await loadDataFromDatabase()
      
    } catch (error) {
      console.error('Erreur lors de la suppression des interventions:', error)
      alert('Erreur lors de la suppression des interventions')
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
        
        // Trier les cartes par numéro en ordre croissant
        uniqueCards.sort((a, b) => {
          const numA = String(a.numero_carte || '')
          const numB = String(b.numero_carte || '')
          return numA.localeCompare(numB, undefined, { numeric: true })
        })
        
        console.log("Cartes uniques extraites (triées):", uniqueCards)
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
      setLoadingEmployees(true)
      const response = await fetch("/api/employes")
      if (!response.ok) throw new Error("Erreur lors du chargement des employés")
      const data = await response.json()
      // L'API retourne déjà les employés avec les infos de carte (LEFT JOIN LATERAL)
      // Pas besoin de boucle supplémentaire!
      const employeesData = data.employes || []
      setEmployees(employeesData)
      return employeesData
    } catch (error) {
      console.error("[v0] Erreur chargement employés:", error)
      return []
    } finally {
      setLoadingEmployees(false)
    }
  }

  const syncTaxes = async () => {
    try {
      console.log('🔄 Synchronisation des taxes...')
      
      // Afficher un message d'information
      alert('Pour synchroniser les taxes, exécutez la commande suivante dans le terminal :\n\nnode scripts/sync_all_taxes.mjs\n\nPuis cliquez sur "Actualiser" pour recharger les données.')
      
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
      alert(`Erreur lors de la synchronisation: ${error.message}`)
    }
  }

  const clearDatabase = async () => {
    try {
      // Demander confirmation avec un message d'avertissement
      const confirmMessage = `⚠️ ATTENTION - ACTION IRRÉVERSIBLE ⚠️

Cette action va SUPPRIMER TOUTES LES DONNÉES de la base de données :
• Tous les employés (sauf admin)
• Toutes les interventions
• Tous les coûts par salarié
• Tous les paiements
• Toutes les données de carburant
• Tout le matériel
• Toutes les réclamations
• Tous les frais d'entreprise

Seuls les utilisateurs admin seront conservés.

Êtes-vous ABSOLUMENT SÛR de vouloir continuer ?

Tapez "CONFIRMER" pour continuer :`

      const userInput = prompt(confirmMessage)
      
      if (userInput !== 'CONFIRMER') {
        alert('Opération annulée. Aucune donnée n\'a été supprimée.')
        return
      }

      console.log('🧹 Début du nettoyage de la base de données...')
      
      const response = await fetch('/api/admin/clear-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Base de données vidée avec succès:', result)
        
        alert(`✅ Base de données vidée avec succès !

📊 Résultats :
• ${result.data.totalDeleted} enregistrements supprimés
• ${result.data.tablesProcessed} tables traitées
• ${result.data.adminUsers} utilisateur(s) admin conservé(s)

La page va se recharger automatiquement...`)
        
        // Recharger la page après 2 secondes
        setTimeout(() => {
          window.location.reload()
        }, 2000)
        
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du nettoyage de la base de données')
      }
      
    } catch (error) {
      console.error('❌ Erreur nettoyage base de données:', error)
      alert(`❌ Erreur lors du nettoyage de la base de données : ${error.message}`)
    }
  }

  const loadMaterialsFromDatabase = async () => {
    try {
      // Support optional depot filtering: if depotFilter is 'ALL' we don't add the query param
      const params = depotFilter && depotFilter !== 'ALL' ? `?depot=${encodeURIComponent(depotFilter)}` : ''
      const response = await fetch(`/api/materiel${params}`)
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

  const loadRevenueFromDatabase = async () => {
    try {
      // Charger les recettes des 12 derniers mois
      const dateFrom = new Date()
      dateFrom.setMonth(dateFrom.getMonth() - 12)
      const dateTo = new Date()
      
      const response = await fetch(
        `/api/revenue-calculation?date_from=${dateFrom.toISOString().split('T')[0]}&date_to=${dateTo.toISOString().split('T')[0]}`
      )
      if (!response.ok) throw new Error("Erreur lors du chargement des recettes")
      const data = await response.json()
      
      // Récupérer le total général
      return data.total_stats?.total_recette_generale || 0
    } catch (error) {
      console.error("[v0] Erreur chargement recettes:", error)
      return 0
    }
  }

  const loadDataFromDatabase = async () => {
    setLoadingInterventions(true)
    setLoadingFuel(true)
    
    try {
      const [interventionsResult, fuelConsumptionData, revenueData] = await Promise.all([
        loadInterventionsFromDatabase(),
        loadFuelDataFromDatabase(),
        loadRevenueFromDatabase()
      ])
      
      setInterventions(interventionsResult.interventions || [])
      setTotalInterventions(interventionsResult.total || 0)
      setFuelData(fuelConsumptionData || [])
      setTotalRevenue(revenueData || 0)
      
      // Generate employee data from interventions
      const employeeMap = new Map()
      if (interventionsResult.interventions && Array.isArray(interventionsResult.interventions)) {
        interventionsResult.interventions.forEach((intervention: any) => {
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
      let tableName = ''
      let section = ''

      switch (entityType) {
        case 'material':
          apiEndpoint = `/api/materiel?id=${id}`
          successMessage = 'Matériel supprimé avec succès'
          tableName = 'materiel'
          section = 'Matériel'
          break
        case 'affectation':
          apiEndpoint = `/api/affectations-materiel?id=${id}`
          successMessage = 'Affectation supprimée avec succès'
          tableName = 'affectations_materiel'
          section = 'Matériel'
          break
        case 'penalty':
          apiEndpoint = `/api/penalites`
          successMessage = 'Pénalité supprimée avec succès'
          tableName = 'penalites'
          section = 'Pénalités'
          break
        case 'claim':
          apiEndpoint = `/api/reclamations`
          successMessage = 'Réclamation supprimée avec succès'
          tableName = 'reclamations'
          section = 'Réclamations'
          break
        case 'employee':
          apiEndpoint = `/api/employes`
          successMessage = 'Employé supprimé avec succès'
          tableName = 'employes'
          section = 'Employés'
          break
        default:
          throw new Error('Type d\'entité non supporté')
      }

      // Récupérer les données de l'élément avant suppression pour l'historique
      let oldValues: any = null
      try {
        if (entityType === 'material') {
          const item = materials.find(m => m.id === id)
          oldValues = item ? {
            designation: item.designation,
            reference: item.reference,
            stock_initial: item.stock_initial,
            stock_actuel: item.stock_actuel,
            prix_unitaire: item.prix_unitaire,
            depot: item.depot
          } : null
        } else if (entityType === 'affectation') {
          const item = affectations.find(a => a.id === id)
          oldValues = item ? {
            employe_nom: item.employe_nom,
            materiel_designation: item.materiel_designation,
            quantite: item.quantite,
            date_affectation: item.date_affectation
          } : null
        } else if (entityType === 'penalty') {
          const item = penalties.find(p => p.id === id)
          oldValues = item ? {
            numero_penalite: item.numero_penalite,
            employe_nom: item.employe_nom,
            montant: item.montant,
            motif: item.motif
          } : null
        } else if (entityType === 'claim') {
          const item = claims.find(c => c.id === id)
          oldValues = item ? {
            numero_reclamation: item.numero_reclamation,
            nom_client: item.nom_client,
            type_reclamation: item.type_reclamation,
            statut: item.statut
          } : null
        } else if (entityType === 'employee') {
          const item = employees.find(e => e.id === id)
          oldValues = item ? {
            nom: item.nom,
            prenom: item.prenom,
            matricule: item.matricule,
            role: item.role
          } : null
        }
      } catch (err) {
        console.error('Erreur récupération données pour historique:', err)
      }

      const response = await fetch(apiEndpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          _user: {
            email: user?.email || 'Inconnu',
            name: user?.name || 'Utilisateur',
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      // Enregistrer dans l'historique
      try {
        await fetch('/api/historiques', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_name: user?.email || 'admin@fibertech.com',
            action: 'DELETE',
            table_name: tableName,
            record_id: id,
            section: section,
            description: `Suppression de ${entityName} ${oldValues ? `- ${JSON.stringify(oldValues).substring(0, 100)}` : ''}`,
            old_values: oldValues,
            user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
          })
        })
      } catch (histErr) {
        console.error('Erreur enregistrement historique:', histErr)
        // Ne pas bloquer la suppression si l'historique échoue
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setIsLoggedIn(true)
        // Sauvegarder les données utilisateur dans le localStorage
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        // Déclencher un événement pour mettre à jour les permissions
        window.dispatchEvent(new CustomEvent('userChanged'))
        console.log('✅ Connexion réussie:', data.user.username)
        console.log('📋 Permissions:', data.user.permissions)
      } else {
        alert(data.error || "Email ou mot de passe incorrect")
        console.log('❌ Erreur de connexion:', data.error)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error)
      alert("Erreur de connexion au serveur")
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
      const body = editingItem 
        ? { id: editingItem.id, ...employeeData, _user: { email: user?.email, name: user?.name } } 
        : { ...employeeData, _user: { email: user?.email, name: user?.name } }

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
      const body = editingItem 
        ? { id: editingItem.id, ...materialData, _user: { email: user?.email, name: user?.name } } 
        : { ...materialData, _user: { email: user?.email, name: user?.name } }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      // Déclencher la synchronisation automatique
      window.dispatchEvent(new CustomEvent('material-updated'))
      window.dispatchEvent(new CustomEvent('revenue-updated'))
      
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

      // Déclencher la synchronisation automatique
      window.dispatchEvent(new CustomEvent('material-updated'))
      window.dispatchEvent(new CustomEvent('revenue-updated'))
      
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

      // Déclencher la synchronisation automatique
      window.dispatchEvent(new CustomEvent('material-assignment-updated'))
      window.dispatchEvent(new CustomEvent('revenue-updated'))
      
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

      // Déclencher la synchronisation automatique
      window.dispatchEvent(new CustomEvent('material-assignment-updated'))
      window.dispatchEvent(new CustomEvent('revenue-updated'))
      
      await loadAllCRUDData()
      alert("Affectation supprimée avec succès")
    } catch (error) {
      console.error("Erreur suppression affectation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  // Transfer material between depots
  const handleTransferMaterial = async () => {
    if (!selectedMaterialForTransfer) return
    
    if (transferQuantity <= 0 || transferQuantity > selectedMaterialForTransfer.quantite) {
      alert(`Quantité invalide. Disponible: ${selectedMaterialForTransfer.quantite}`)
      return
    }

    if (!transferDepotDestination) {
      alert('Veuillez sélectionner un dépôt de destination')
      return
    }

    if (selectedMaterialForTransfer.depot === transferDepotDestination) {
      alert('Le dépôt de destination doit être différent du dépôt actuel')
      return
    }

    if (!transferMotif || transferMotif.trim() === '') {
      alert('Veuillez indiquer le motif du transfert')
      return
    }

    setTransferring(true)
    try {
      const response = await fetch('/api/materiel/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materiel_id: selectedMaterialForTransfer.id,
          quantite_transferee: transferQuantity,
          depot_destination: transferDepotDestination,
          motif: transferMotif,
          commentaires: transferComments
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du transfert')
      }

      const result = await response.json()
      
      // Reload materials
      const params = depotFilter && depotFilter !== 'ALL' ? `?depot=${encodeURIComponent(depotFilter)}` : ''
      const materialsResponse = await fetch(`/api/materiel${params}`)
      if (materialsResponse.ok) {
        const data = await materialsResponse.json()
        setMaterials(data.materiel || [])
      }

      setShowTransferModal(false)
      setSelectedMaterialForTransfer(null)
      setTransferQuantity(0)
      setTransferMotif('')
      setTransferComments('')
      
      alert(`✅ Transfert réussi !\n\n${transferQuantity} ${selectedMaterialForTransfer.nom_equipement} transféré(s) vers ${transferDepotDestination}`)
    } catch (error) {
      console.error('Erreur transfert:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors du transfert')
    } finally {
      setTransferring(false)
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
        ? { id: editingItem.id, ...apiData, _user: { email: user?.email, name: user?.name } }
        : { ...apiData, _user: { email: user?.email, name: user?.name } }

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
      const body = editingItem 
        ? { id: editingItem.id, ...penaltyData, _user: { email: user?.email, name: user?.name } } 
        : { ...penaltyData, _user: { email: user?.email, name: user?.name } }

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
      const body = editingItem 
        ? { id: editingItem.id, ...claimData, _user: { email: user?.email, name: user?.name } } 
        : { ...claimData, _user: { email: user?.email, name: user?.name } }

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

  // CRUD Functions for Vehicules
  const loadVehiculesFromDatabase = async () => {
    try {
      const response = await fetch("/api/vehicules")
      if (!response.ok) throw new Error("Erreur lors du chargement des véhicules")
      const data = await response.json()
      return data.vehicules || []
    } catch (error) {
      console.error("Erreur chargement véhicules:", error)
      return []
    }
  }

  const loadAssignationsVehiculesFromDatabase = async () => {
    try {
      const response = await fetch("/api/assignations-vehicules")
      if (!response.ok) throw new Error("Erreur lors du chargement des assignations")
      const data = await response.json()
      return data.assignations || []
    } catch (error) {
      console.error("Erreur chargement assignations véhicules:", error)
      return []
    }
  }

  const loadEntretiensVehiculesFromDatabase = async () => {
    try {
      const response = await fetch("/api/entretiens-vehicules")
      if (!response.ok) throw new Error("Erreur lors du chargement des entretiens")
      const data = await response.json()
      return data.entretiens || []
    } catch (error) {
      console.error("Erreur chargement entretiens véhicules:", error)
      return []
    }
  }

  const loadKmUpdatesFromDatabase = async () => {
    try {
      const response = await fetch("/api/vehicules-km-updates?statut=en_attente")
      if (!response.ok) throw new Error("Erreur lors du chargement des MAJ KM")
      const data = await response.json()
      return data.updates || []
    } catch (error) {
      console.error("Erreur chargement MAJ KM:", error)
      return []
    }
  }

  const saveVehicule = async (vehiculeData: any) => {
    try {
      const url = "/api/vehicules"
      const method = editingVehicule ? "PUT" : "POST"
      const body = editingVehicule 
        ? { id: editingVehicule.id, ...vehiculeData } 
        : vehiculeData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      const vehiculesData = await loadVehiculesFromDatabase()
      setVehicules(vehiculesData)
      setShowVehiculeModal(false)
      setEditingVehicule(null)
      alert(editingVehicule ? "Véhicule modifié avec succès" : "Véhicule ajouté avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde véhicule:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const saveAssignationVehicule = async (assignationData: any) => {
    try {
      const url = "/api/assignations-vehicules"
      const method = editingAssignationVehicule ? "PUT" : "POST"
      const body = editingAssignationVehicule 
        ? { id: editingAssignationVehicule.id, ...assignationData } 
        : assignationData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      const [vehiculesData, assignationsData] = await Promise.all([
        loadVehiculesFromDatabase(),
        loadAssignationsVehiculesFromDatabase()
      ])
      setVehicules(vehiculesData)
      setAssignationsVehicules(assignationsData)
      setShowAssignationVehiculeModal(false)
      setEditingAssignationVehicule(null)
      alert(editingAssignationVehicule ? "Assignation modifiée avec succès" : "Assignation créée avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde assignation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const saveEntretienVehicule = async (entretienData: any) => {
    try {
      const url = "/api/entretiens-vehicules"
      const method = editingEntretienVehicule ? "PUT" : "POST"
      const body = editingEntretienVehicule 
        ? { id: editingEntretienVehicule.id, ...entretienData } 
        : entretienData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la sauvegarde")
      }

      const [vehiculesData, entretiensData] = await Promise.all([
        loadVehiculesFromDatabase(),
        loadEntretiensVehiculesFromDatabase()
      ])
      setVehicules(vehiculesData)
      setEntretiensVehicules(entretiensData)
      setShowEntretienVehiculeModal(false)
      setEditingEntretienVehicule(null)
      alert(editingEntretienVehicule ? "Entretien modifié avec succès" : "Entretien ajouté avec succès")
    } catch (error) {
      console.error("Erreur sauvegarde entretien:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la sauvegarde")
    }
  }

  const deleteVehicule = async (id: number) => {
    try {
      const response = await fetch(`/api/vehicules?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      const vehiculesData = await loadVehiculesFromDatabase()
      setVehicules(vehiculesData)
      alert("Véhicule supprimé avec succès")
    } catch (error) {
      console.error("Erreur suppression véhicule:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la suppression")
    }
  }

  const deleteAssignationVehicule = async (id: number) => {
    try {
      // Au lieu de supprimer, on termine l'assignation en mettant la date de fin
      const assignation = assignationsVehicules.find(a => a.id === id)
      if (!assignation) {
        alert("Assignation introuvable")
        return
      }

      // Utiliser automatiquement le dernier kilométrage validé par le technicien
      // ou le kilométrage de début si aucune mise à jour n'a été faite
      const kmFin = assignation.km_actuel || assignation.kilometrage_debut || 0
      
      const response = await fetch('/api/assignations-vehicules', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          vehicule_id: assignation.vehicule_id,
          employe_id: assignation.employe_id,
          date_assignation: assignation.date_assignation,
          date_fin: new Date().toISOString().split('T')[0], // Date du jour
          kilometrage_debut: assignation.kilometrage_debut,
          kilometrage_fin: kmFin, // KM automatique depuis dernière validation technicien
          statut: 'terminee',
          commentaires: assignation.commentaires
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la fin de l'assignation")
      }

      const [vehiculesData, assignationsData] = await Promise.all([
        loadVehiculesFromDatabase(),
        loadAssignationsVehiculesFromDatabase()
      ])
      setVehicules(vehiculesData)
      setAssignationsVehicules(assignationsData)
      alert(`Assignation terminée avec succès. KM final: ${kmFin.toLocaleString()} km`)
    } catch (error) {
      console.error("Erreur lors de la fin de l'assignation:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la fin de l'assignation")
    }
  }

  const validateKmUpdate = async (updateId: number) => {
    try {
      const response = await fetch('/api/vehicules-km-updates', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updateId,
          action: 'valider',
          admin_id: user?.id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la validation")
      }

      const [vehiculesData, assignationsData, kmUpdatesData] = await Promise.all([
        loadVehiculesFromDatabase(),
        loadAssignationsVehiculesFromDatabase(),
        loadKmUpdatesFromDatabase()
      ])
      setVehicules(vehiculesData)
      setAssignationsVehicules(assignationsData)
      setKmUpdates(kmUpdatesData)
      alert("Kilométrage validé avec succès")
    } catch (error) {
      console.error("Erreur validation KM:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de la validation")
    }
  }

  const rejectKmUpdate = async (updateId: number, commentaire: string) => {
    try {
      const response = await fetch('/api/vehicules-km-updates', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updateId,
          action: 'rejeter',
          admin_id: user?.id,
          commentaire_rejet: commentaire
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors du rejet")
      }

      const [assignationsData, kmUpdatesData] = await Promise.all([
        loadAssignationsVehiculesFromDatabase(),
        loadKmUpdatesFromDatabase()
      ])
      setAssignationsVehicules(assignationsData)
      setKmUpdates(kmUpdatesData)
      alert("Mise à jour rejetée")
    } catch (error) {
      console.error("Erreur rejet KM:", error)
      alert(error instanceof Error ? error.message : "Erreur lors du rejet")
    }
  }

  const deleteEntretienVehicule = async (id: number) => {
    try {
      const response = await fetch(`/api/entretiens-vehicules?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la suppression")
      }

      const entretiensData = await loadEntretiensVehiculesFromDatabase()
      setEntretiensVehicules(entretiensData)
      alert("Entretien supprimé avec succès")
    } catch (error) {
      console.error("Erreur suppression entretien:", error)
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
        // Extraire les numéros de carte uniques et trier en ordre croissant
        const uniqueCards = [...new Set(data.carburant.map((item: any) => item.numero_carte))]
          .filter(card => card && card !== 'nan')
          .map(card => ({ numero_carte: card, label: `Carte ${card}` }))
          .sort((a, b) => String(a.numero_carte).localeCompare(String(b.numero_carte), undefined, { numeric: true }))
        setAvailableCards(uniqueCards)
      }
    } catch (error) {
      console.error('Erreur récupération cartes:', error)
      setAvailableCards([])
    }
    
    setShowCardAssignmentModal(true)
  }

  // Function to assign card to employee with period
  const assignCardToEmployee = async () => {
    try {
      if (!selectedEmployee || !selectedCardNumber) {
        alert("Veuillez sélectionner un employé et une carte")
        return
      }

      if (!assignmentStartDate) {
        alert("Veuillez sélectionner une date de début")
        return
      }

      if (assignmentType === 'temporary' && !assignmentEndDate) {
        alert("Veuillez sélectionner une date de fin pour une assignation temporaire")
        return
      }

      if (assignmentEndDate && assignmentEndDate <= assignmentStartDate) {
        alert("La date de fin doit être postérieure à la date de début")
        return
      }

      const response = await fetch('/api/carburant-assignation-periode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_carte: selectedCardNumber,
          employe_id: selectedEmployee.id,
          employe_nom: `${selectedEmployee.prenom} ${selectedEmployee.nom}`,
          date_debut: assignmentStartDate,
          date_fin_prevue: assignmentType === 'permanent' ? null : assignmentEndDate,
          commentaires: assignmentComments
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          // Conflit détecté
          const conflictMessage = `Conflit détecté !\n\n${errorData.message}\n\nConflits existants:\n${
            errorData.conflits.map((c: any) => 
              `- ${c.employe_nom}: ${c.date_debut_conflit} → ${c.date_fin_conflit}`
            ).join('\n')
          }\n\nVoulez-vous continuer malgré le conflit ?`
          
          if (!confirm(conflictMessage)) {
            return
          }
          // Si l'utilisateur confirme, forcer l'assignation
          console.log('🔄 Forçage de l\'assignation malgré le conflit')
          
          // Relancer l'assignation avec le paramètre force = true
          const forceResponse = await fetch('/api/carburant-assignation-periode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              numero_carte: selectedCardNumber,
              employe_id: selectedEmployee.id,
              employe_nom: `${selectedEmployee.prenom} ${selectedEmployee.nom}`,
              date_debut: assignmentStartDate,
              date_fin_prevue: assignmentType === 'temporary' ? assignmentEndDate : null,
              commentaires: assignmentComments,
              assignee_par: 1, // ID de l'utilisateur actuel
              force: true // Forcer l'assignation
            })
          })
          
          if (!forceResponse.ok) {
            const forceErrorData = await forceResponse.json()
            throw new Error(forceErrorData.error || 'Erreur lors du forçage de l\'assignation')
          }
          
          const forceResult = await forceResponse.json()
          console.log('✅ Assignation forcée avec succès:', forceResult)
          
          // Continuer avec le message de succès normal
          const periodText = assignmentType === 'permanent' 
            ? `à partir du ${assignmentStartDate}` 
            : `du ${assignmentStartDate} au ${assignmentEndDate}`
          
          alert(`✅ Carte ${selectedCardNumber} assignée avec forçage à ${selectedEmployee.prenom} ${selectedEmployee.nom} ${periodText}`)
          
          // Fermer le modal et réinitialiser les champs
          setShowCardAssignmentModal(false)
          setSelectedEmployee(null)
          setSelectedCardNumber('')
          setAssignmentStartDate('')
          setAssignmentEndDate('')
          setAssignmentComments('')
          setAssignmentType('temporary')
          
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
          return
        }
        throw new Error(errorData.error || 'Erreur lors de l\'assignation')
      }

      const result = await response.json()
      const periodText = assignmentType === 'permanent' 
        ? `à partir du ${assignmentStartDate}` 
        : `du ${assignmentStartDate} au ${assignmentEndDate}`
      
      alert(`✅ Carte ${selectedCardNumber} assignée à ${selectedEmployee.prenom} ${selectedEmployee.nom} ${periodText}`)
      
      // Fermer le modal et réinitialiser les champs
      setShowCardAssignmentModal(false)
      setSelectedEmployee(null)
      setSelectedCardNumber('')
      setAssignmentStartDate('')
      setAssignmentEndDate('')
      setAssignmentComments('')
      setAssignmentType('temporary')
      
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
      console.error('Erreur assignation carte:', error)
      alert(`❌ Erreur lors de l'assignation de la carte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  // Function to show assignment history for an employee
  const showAssignmentHistory = async (employee: any) => {
    try {
      setLoadingHistory(true)
      setSelectedEmployeeHistory(employee)
      setShowAssignmentHistoryModal(true)

      const response = await fetch(`/api/carburant-historique?type=employe&employe_id=${employee.id}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'historique')
      }

      const data = await response.json()
      setAssignmentHistory(data.historique || [])
    } catch (error) {
      console.error('Erreur chargement historique:', error)
      alert('Erreur lors du chargement de l\'historique des assignations')
      setAssignmentHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  // Fonction pour charger les données de consommation avec filtres
  const loadConsumptionData = async () => {
    try {
      setLoadingConsumption(true)
      
      const params = new URLSearchParams()
      if (consumptionFilters.date_debut) params.append('date_debut', consumptionFilters.date_debut)
      if (consumptionFilters.date_fin) params.append('date_fin', consumptionFilters.date_fin)
      if (consumptionFilters.employe_id && consumptionFilters.employe_id !== 'all') params.append('employe_id', consumptionFilters.employe_id)
      if (consumptionFilters.numero_carte && consumptionFilters.numero_carte !== 'all') params.append('numero_carte', consumptionFilters.numero_carte)

      const response = await fetch(`/api/consommation-carburant-historique?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des consommations')
      }

      const data = await response.json()
      setConsumptionData(data)
    } catch (error) {
      console.error('Erreur chargement consommations:', error)
      alert('Erreur lors du chargement des données de consommation')
    } finally {
      setLoadingConsumption(false)
    }
  }

  // Fonction pour réinitialiser les filtres
  const resetConsumptionFilters = () => {
    const dates = getDefaultDates()
    setConsumptionFilters({
      date_debut: dates.start,
      date_fin: dates.end,
      employe_id: 'all',
      numero_carte: 'all'
    })
  }

  // Charger les données de consommation au montage du composant
  useEffect(() => {
    if (activeTab === 'fuel-consumption') {
      loadConsumptionData()
    }
  }, [activeTab])

  // Recharger quand les filtres changent
  useEffect(() => {
    if (activeTab === 'fuel-consumption') {
      loadConsumptionData()
    }
  }, [consumptionFilters])

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
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50" suppressHydrationWarning>
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
          <nav className="h-full flex flex-col">
            <div className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">Navigation</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 sidebar-scrollable">
              <div className="space-y-3">

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

              {hasPermission('employees') && (
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
              )}

                {hasPermission('interventions') && (
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
                )}

                {/* Temporarily hidden - Carburant section */}
                {/* <Button
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
            </Button> */}

                {hasPermission('materials') && (
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
                )}

                {hasPermission('recap-calcul') && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "recap-calcul"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => setActiveTab("recap-calcul")}
                    >
                      <Calculator className="w-5 h-5" />
                  Récap Calcul
                    </Button>
                )}

            {hasPermission('documents') && (
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                  activeTab === "documents"
                        ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                        : "glass-card border border-white/20 hover:bg-primary/5"
                    }`}
                onClick={() => setActiveTab("documents")}
                  >
                    <FileText className="w-5 h-5" />
                Documents
                  </Button>
            )}


                {hasPermission('penalties') && (
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
                )}

                {hasPermission('statistics') && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "statistics"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => setActiveTab("statistics")}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="font-medium">Statistiques</span>
                    </Button>
                )}


                {hasPermission('costs') && (
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
                      <span className="font-medium">Charges</span>
                    </Button>
                )}

                {hasPermission('cout-par-salaire') && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "cout-par-salaire"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => setActiveTab("cout-par-salaire")}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span className="font-medium">Charges par Salarié</span>
                    </Button>
                )}

                {/* Temporarily hidden - Sync Employés section */}
                {/* <Button
              variant="ghost"
              className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                activeTab === "employee-sync"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("employee-sync")}
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium">Sync Employés</span>
                </Button> */}

                {hasPermission('claims') && (
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
                )}

                {hasPermission('reclamations-techniques') && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "reclamations-techniques"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => setActiveTab("reclamations-techniques")}
                    >
                  <MessageSquare className="w-5 h-5" />
                  Réclamations Techniques
                    </Button>
                )}

                {hasPermission('tarifs') && (
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
                )}

                {hasPermission('vehicules') && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "vehicules"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => setActiveTab("vehicules")}
                    >
                      <Car className="w-5 h-5" />
                      Véhicules
                    </Button>
                )}

                {hasPermission('recette-generer') && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "recette-generer"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => {
                    setActiveTab("recette-generer")
                    // Recharger les recettes quand on change d'onglet
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('reloadRevenueData'))
                    }, 100)
                  }}
                    >
                      <TrendingUp className="w-5 h-5" />
                      BENEFICE BRUTE
                    </Button>
                )}

                {hasPermission('fuel-consumption') && (
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
                )}

                {/* Temporarily hidden - Rapports section */}
                {/* <Button
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
                </Button> */}

                {hasPermission('technicien-accounts') && (
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
                )}

                {isAdmin() && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "compte-admin"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => setActiveTab("compte-admin")}
                    >
                  <UserPlus className="w-5 h-5" />
                  Compte Admin
                    </Button>
                )}

                {isAdmin() && (
                  <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 ${
                    activeTab === "historique"
                          ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                          : "glass-card border border-white/20 hover:bg-primary/5"
                      }`}
                  onClick={() => setActiveTab("historique")}
                    >
                  <History className="w-5 h-5" />
                  Historique
                    </Button>
                )}
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {/* Dashboard Tab */}
        {/* Notification de mise à jour */}
        {updateNotification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{updateNotification}</span>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-8" suppressHydrationWarning>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" suppressHydrationWarning>
                <Card className="glass-card border border-white/20 hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Employés Actifs
                    </CardTitle>
                    <Users className="h-4 w-4 text-chart-1" />
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold">{employees.length}</div>
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
                    <div className="text-3xl font-bold">{totalInterventions}</div>
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

                {/* CA Total Estimé - Visible uniquement pour les admins */}
                {(user?.role === 'admin' || user?.role_id === 1) && (
                  <Card className="glass-card border border-white/20 hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        CA Total Estimé
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-chart-4" />
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="text-3xl font-bold">
                        {totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Chiffre d'affaires (12 derniers mois)
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recent Interventions */}
              <Card className="glass-card border border-white/20 hover-lift" suppressHydrationWarning>
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

              {/* Statistiques des Échecs */}
              {/* <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Clôtures et Échecs Terminés
                  </CardTitle>
                  <CardDescription>
                    Analyse des interventions terminées (clôtures et échecs) par technicien
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FailureStatistics />
                </CardContent>
              </Card> */}

              {/* Statistiques RACC par Type de Logement */}
              {/* <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    RACC par Type de Logement
                  </CardTitle>
                  <CardDescription>
                    Répartition des raccordements clôturés par type (Pavillon/Immeuble) - AXECOM vs ERT OUEST
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RaccByTypeStatistics />
                </CardContent>
              </Card> */}

              {/* Statistiques par Type de Parcours */}
              {/* <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    Type de Parcours
                  </CardTitle>
                  <CardDescription>
                    Analyse des interventions clôturées et échecs par type de parcours - AXECOM vs ERT OUEST
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParcoursStatistics />
                </CardContent>
              </Card> */}
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
                    disabled={loadingEmployees}
                    className="glass-card border border-white/20 hover:bg-white/10"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingEmployees ? 'animate-spin' : ''}`} />
                    {loadingEmployees ? 'Chargement...' : 'Actualiser'}
                  </Button>
                  
                  {/* Indicateur de connexion SSE */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {isConnected ? 'Temps réel' : 'Hors ligne'}
                    </span>
                    {lastUpdateTime && (
                      <span className="text-xs text-gray-400">
                        Dernière mise à jour: {lastUpdateTime.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
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
                              {editingTaxEmployee?.id === employee.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={taxValue}
                                    onChange={(e) => setTaxValue(e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    placeholder="0.00"
                                    autoFocus
                                  />
                                  <span className="text-sm text-gray-500">%</span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleSaveTax}
                                      disabled={savingTax}
                                      className="h-6 px-2 text-xs bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
                                    >
                                      {savingTax ? '...' : '✓'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelTax}
                                      className="h-6 px-2 text-xs bg-red-100 hover:bg-red-200 border-red-300 text-red-800"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="font-medium text-primary cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                  onDoubleClick={() => handleEditTax(employee)}
                                  title="Double-clic pour modifier la taxe"
                                >
                                  {employee.pourcentage_taxe ? `${employee.pourcentage_taxe}%` : '0.00%'}
                                </div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-mono font-semibold">
                                    {employee.numero_carte_actuelle || 'Non assignée'}
                                  </span>
                                </div>
                                {employee.numero_carte_actuelle && employee.date_debut_assignation && (
                                  <div className="text-xs text-gray-500">
                                    📅 Depuis le {new Date(employee.date_debut_assignation).toLocaleDateString('fr-FR')}
                                    {employee.date_fin_prevue_assignation && (
                                      <span> → {new Date(employee.date_fin_prevue_assignation).toLocaleDateString('fr-FR')}</span>
                                    )}
                                  </div>
                                )}
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
                                  onClick={() => showAssignmentHistory(employee)}
                                  className="glass-card border border-white/20 hover:bg-white/10"
                                  title="Historique des assignations carburant"
                                >
                                  <History className="w-4 h-4" />
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
                  <p className="text-muted-foreground">Suivi de la consommation carburant avec historique des assignations</p>
                </div>
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
                        <Label htmlFor="import-fuel-consumption">Fichier Carburant (CSV/XLSX)</Label>
                        <Input
                          id="import-fuel-consumption"
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
              </div>

              {/* Filtres de consommation */}
              <Card className="glass-card border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtres de Consommation
                  </CardTitle>
                  <CardDescription>
                    Filtrer les consommations par date, employé ou carte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Date de début</Label>
                      <Input
                        type="date"
                        value={consumptionFilters.date_debut}
                        onChange={(e) => setConsumptionFilters(prev => ({ ...prev, date_debut: e.target.value }))}
                        className="glass-card border border-white/20"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Date de fin</Label>
                      <Input
                        type="date"
                        value={consumptionFilters.date_fin}
                        onChange={(e) => setConsumptionFilters(prev => ({ ...prev, date_fin: e.target.value }))}
                        className="glass-card border border-white/20"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Employé</Label>
                      <Select 
                        value={consumptionFilters.employe_id} 
                        onValueChange={(value) => setConsumptionFilters(prev => ({ ...prev, employe_id: value }))}
                        defaultValue="all"
                      >
                        <SelectTrigger className="glass-card border border-white/20">
                          <SelectValue placeholder="Tous les employés" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les employés</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.prenom} {emp.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Numéro de carte</Label>
                      <Select 
                        value={consumptionFilters.numero_carte} 
                        onValueChange={(value) => setConsumptionFilters(prev => ({ ...prev, numero_carte: value }))}
                        defaultValue="all"
                      >
                        <SelectTrigger className="glass-card border border-white/20">
                          <SelectValue placeholder="Toutes les cartes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les cartes</SelectItem>
                          {[...new Set(fuelData.map((item: any) => item.numero_carte))]
                            .filter(carte => carte && carte !== 'nan')
                            .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
                            .map((numero_carte: any) => (
                              <SelectItem key={numero_carte} value={numero_carte}>
                                Carte {numero_carte}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={loadConsumptionData}
                      disabled={loadingConsumption}
                      className="gradient-primary text-white"
                    >
                      {loadingConsumption ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Rechercher
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={resetConsumptionFilters}
                      className="glass-card border border-white/20 hover:bg-white/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques de consommation */}
              {consumptionData.stats && Object.keys(consumptionData.stats).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {consumptionData.stats.total_consommations || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Consommations</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(consumptionData.stats.total_montant_ttc || 0).toFixed(2)}€
                      </div>
                      <div className="text-sm text-gray-600">Montant Total TTC</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(consumptionData.stats.total_quantite || 0).toFixed(1)}L
                      </div>
                      <div className="text-sm text-gray-600">Quantité Totale</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {consumptionData.stats.consommations_avec_assignation || 0}
                      </div>
                      <div className="text-sm text-gray-600">Avec Assignation</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {consumptionData.stats.consommations_sans_assignation || 0}
                      </div>
                      <div className="text-sm text-gray-600">Sans Assignation</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tableau des consommations */}
              <Card className="glass-card border border-white/20">
                <CardHeader>
                  <CardTitle>Détail des Consommations</CardTitle>
                  <CardDescription>
                    Consommations avec historique des assignations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingConsumption ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin mr-2" />
                      <span>Chargement des consommations...</span>
                    </div>
                  ) : consumptionData.consommations && consumptionData.consommations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left p-3">Date</th>
                            <th className="text-left p-3">Carte</th>
                            <th className="text-left p-3">Employé Assigné</th>
                            <th className="text-left p-3">Lieu</th>
                            <th className="text-left p-3">Quantité</th>
                            <th className="text-left p-3">Montant TTC</th>
                            <th className="text-left p-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const startIndex = (consommationPage - 1) * consommationPerPage
                            const endIndex = startIndex + consommationPerPage
                            return consumptionData.consommations.slice(startIndex, endIndex).map((consommation: any, index: number) => (
                            <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="font-medium">{consommation.date_livraison}</span>
                                  {consommation.heure_livraison && (
                                    <span className="text-sm text-gray-500">{consommation.heure_livraison}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="glass-card border border-white/20">
                                  {consommation.numero_carte}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {consommation.assignation_valide ? (
                                  <div className="flex flex-col">
                                    <span className="font-medium">{consommation.employe_nom}</span>
                                    <span className="text-sm text-gray-500">
                                      {consommation.assignation_debut} → {consommation.assignation_fin_effective !== '2099-12-31' ? consommation.assignation_fin_effective : 'Permanente'}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="destructive">Non assignée</Badge>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="text-sm">{consommation.point_acceptation || 'Non spécifié'}</span>
                                  {consommation.cp && (
                                    <span className="text-xs text-gray-500">{consommation.cp}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-medium">{consommation.quantite?.toFixed(2) || '0'}L</span>
                              </td>
                              <td className="p-3">
                                <span className="font-medium text-green-600">{consommation.ca_ttc?.toFixed(2) || '0'}€</span>
                              </td>
                              <td className="p-3">
                                {consommation.assignation_valide ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    ✓ Valide
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    ⚠ Sans assignation
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))
                          })()}
                        </tbody>
                      </table>
                      
                      {/* Pagination Controls for Consommation Carburant */}
                      {consumptionData.consommations.length > consommationPerPage && (
                        <div className="flex flex-col items-center gap-4 mt-6">
                          <div className="text-sm text-gray-600">
                            Affichage de {((consommationPage - 1) * consommationPerPage) + 1} à{' '}
                            {Math.min(consommationPage * consommationPerPage, consumptionData.consommations.length)} sur{' '}
                            {consumptionData.consommations.length} consommations
                          </div>
                          
                          <div className="flex gap-2 items-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConsommationPage(1)}
                              disabled={consommationPage === 1}
                              className="glass-card border border-white/20"
                            >
                              Première
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConsommationPage(prev => Math.max(1, prev - 1))}
                              disabled={consommationPage === 1}
                              className="glass-card border border-white/20"
                            >
                              Précédent
                            </Button>

                            {/* Page Numbers with Ellipses */}
                            {(() => {
                              const totalPages = Math.ceil(consumptionData.consommations.length / consommationPerPage)
                              const pages = []
                              
                              if (totalPages <= 7) {
                                for (let i = 1; i <= totalPages; i++) {
                                  pages.push(i)
                                }
                              } else {
                                if (consommationPage <= 4) {
                                  for (let i = 1; i <= 5; i++) pages.push(i)
                                  pages.push('...')
                                  pages.push(totalPages)
                                } else if (consommationPage >= totalPages - 3) {
                                  pages.push(1)
                                  pages.push('...')
                                  for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
                                } else {
                                  pages.push(1)
                                  pages.push('...')
                                  for (let i = consommationPage - 1; i <= consommationPage + 1; i++) pages.push(i)
                                  pages.push('...')
                                  pages.push(totalPages)
                                }
                              }

                              return pages.map((page, index) => (
                                <React.Fragment key={index}>
                                  {page === '...' ? (
                                    <span className="px-2 text-gray-500">...</span>
                                  ) : (
                                    <Button
                                      variant={consommationPage === page ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setConsommationPage(page as number)}
                                      className={consommationPage === page ? 'gradient-primary text-white' : 'glass-card border border-white/20'}
                                    >
                                      {page}
                                    </Button>
                                  )}
                                </React.Fragment>
                              ))
                            })()}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConsommationPage(prev => Math.min(Math.ceil(consumptionData.consommations.length / consommationPerPage), prev + 1))}
                              disabled={consommationPage >= Math.ceil(consumptionData.consommations.length / consommationPerPage)}
                              className="glass-card border border-white/20"
                            >
                              Suivant
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConsommationPage(Math.ceil(consumptionData.consommations.length / consommationPerPage))}
                              disabled={consommationPage >= Math.ceil(consumptionData.consommations.length / consommationPerPage)}
                              className="glass-card border border-white/20"
                            >
                              Dernière
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <Fuel className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 text-lg">Aucune consommation trouvée</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Modifiez les filtres pour voir d'autres résultats
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Résumé par employé */}
              {consumptionData.parEmploye && consumptionData.parEmploye.length > 0 && (
                <Card className="glass-card border border-white/20">
                  <CardHeader>
                    <CardTitle>Résumé par Employé</CardTitle>
                    <CardDescription>
                      Consommation totale par employé sur la période sélectionnée
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {consumptionData.parEmploye.map((employe: any, index: number) => (
                        <div key={index} className="p-4 glass-card border border-white/10 rounded-xl">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold">{employe.employe_nom}</div>
                              <div className="text-sm text-gray-500">{employe.consommations.length} transactions</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Montant total:</span>
                              <span className="font-medium text-green-600">{employe.total_montant.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Quantité totale:</span>
                              <span className="font-medium">{employe.total_quantite.toFixed(1)}L</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                  <div className="flex gap-2">
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
                  
                  <Button 
                    onClick={handleCheckDuplicates}
                    disabled={loadingDuplicates}
                    className="bg-orange-500/90 border border-orange-300/30 hover:bg-orange-600 text-white font-medium"
                  >
                    {loadingDuplicates ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Nettoyage...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Nettoyer Doublons
                      </>
                    )}
                  </Button>
                  </div>
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-4">
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

                      {/* Filtre par client */}
                      <div>
                        <Label htmlFor="filter-client" className="text-sm font-medium">
                          Client
                        </Label>
                        <Select
                          value={interventionFilters.client || "all"}
                          onValueChange={(value) => handleFilterChange('client', value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Tous les clients" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les clients</SelectItem>
                            {getUniqueClients().map((client) => (
                              <SelectItem key={client} value={client}>
                                {client}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtre par grille */}
                      <div>
                        <Label htmlFor="filter-grille" className="text-sm font-medium">
                          Grille
                        </Label>
                        <Select
                          value={interventionFilters.grille || "all"}
                          onValueChange={(value) => handleFilterChange('grille', value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Toutes les grilles" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les grilles</SelectItem>
                            <SelectItem value="AXECOM MANCHE">AXECOM MANCHE</SelectItem>
                            <SelectItem value="ERT">ERT (Autres)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtre par interventions sans articles */}
                      <div>
                        <Label htmlFor="filter-sans-articles" className="text-sm font-medium">
                          Sans Articles
                        </Label>
                        <div className="mt-1 flex items-center space-x-2">
                          <Checkbox
                            id="filter-sans-articles"
                            checked={interventionFilters.sansArticles}
                            onCheckedChange={(checked) => handleFilterChange('sansArticles', !!checked)}
                          />
                          <Label htmlFor="filter-sans-articles" className="text-sm text-gray-600">
                            CLOTURE TERMINEE sans articles
                          </Label>
                        </div>
                      </div>

                      {/* Filtre par type d'intervention */}
                      <div>
                        <Label htmlFor="filter-type-intervention" className="text-sm font-medium">
                          Type Intervention
                        </Label>
                        <Select
                          value={interventionFilters.typeIntervention || "all"}
                          onValueChange={(value) => handleFilterChange('typeIntervention', value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Tous les types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les types</SelectItem>
                            {getUniqueInterventionTypes().map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtre par technicien */}
                      <div>
                        <Label htmlFor="filter-technicien" className="text-sm font-medium">
                          Technicien
                        </Label>
                        <Select
                          value={interventionFilters.technicien || "all"}
                          onValueChange={(value) => handleFilterChange('technicien', value === "all" ? "" : value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Tous les techniciens" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les techniciens</SelectItem>
                            {getUniqueTechnicians().map((technician) => (
                              <SelectItem key={technician} value={technician}>
                                {technician}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Indicateur de chargement */}
                    {loadingInterventions && (
                      <div className="mt-4 flex items-center text-sm text-blue-600">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Chargement des interventions...
                      </div>
                    )}

                    {/* Résumé des filtres actifs */}
                    {(interventionFilters.statut || interventionFilters.numInter || 
                      interventionFilters.dateRdvStart || interventionFilters.dateRdvEnd || 
                      interventionFilters.client || interventionFilters.grille || interventionFilters.sansArticles ||
                      interventionFilters.typeIntervention || interventionFilters.technicien) && (
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
                          {interventionFilters.client && (
                            <Badge variant="secondary" className="text-xs">
                              Client: {interventionFilters.client}
                            </Badge>
                          )}
                          {interventionFilters.grille && (
                            <Badge variant="secondary" className="text-xs">
                              Grille: {interventionFilters.grille}
                            </Badge>
                          )}
                          {interventionFilters.sansArticles && (
                            <Badge variant="secondary" className="text-xs">
                              Sans Articles
                            </Badge>
                          )}
                          {interventionFilters.typeIntervention && (
                            <Badge variant="secondary" className="text-xs">
                              Type: {interventionFilters.typeIntervention}
                            </Badge>
                          )}
                          {interventionFilters.technicien && (
                            <Badge variant="secondary" className="text-xs">
                              Technicien: {interventionFilters.technicien}
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
                          {totalInterventions} intervention(s) trouvée(s) - Affichage de {interventions.length}
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
                            <th className="text-left p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                          {(() => {
                            const dataToDisplay = interventions
                            const startIndex = (interventionsPage - 1) * interventionsPerPage
                            const endIndex = startIndex + interventionsPerPage
                            const paginatedData = dataToDisplay.slice(startIndex, endIndex)
                            
                            return paginatedData.map((intervention, index) => {
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
                                <div className="max-w-xs">
                                  <span className={`text-sm ${needsArticlesFlag ? 'text-red-600 font-semibold' : 'text-gray-600'} block truncate`} title={intervention.articles}>
                                    {intervention.articles && intervention.articles.toString().toLowerCase() !== 'nan' ? intervention.articles : 'N/A'}
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
                              <td className="p-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditArticles(intervention)}
                                  className={`h-7 px-3 text-xs ${needsArticlesFlag ? 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'}`}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  {needsArticlesFlag ? 'Ajouter' : 'Modifier'}
                                </Button>
                              </td>
                          </tr>
                        )
                      })
                    })()}
                      </tbody>
                    </table>
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-6 px-4">
                      <div className="text-sm text-gray-600">
                        Affichage de {((interventionsPage - 1) * interventionsPerPage) + 1} à {Math.min(interventionsPage * interventionsPerPage, interventions.length)} sur {totalInterventions} intervention(s) {(interventionFilters.statut || interventionFilters.numInter || interventionFilters.dateRdvStart || interventionFilters.dateRdvEnd || interventionFilters.client || interventionFilters.grille || interventionFilters.sansArticles || interventionFilters.typeIntervention || interventionFilters.technicien) ? 'filtrée(s)' : ''}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInterventionsPage(prev => Math.max(1, prev - 1))}
                          disabled={interventionsPage === 1}
                          className="h-8"
                        >
                          ← Précédent
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(interventions.length / interventionsPerPage) }, (_, i) => i + 1)
                            .filter(page => {
                              const totalPages = Math.ceil(interventions.length / interventionsPerPage)
                              return page === 1 || page === totalPages || Math.abs(page - interventionsPage) <= 1
                            })
                            .map((page, idx, arr) => (
                              <React.Fragment key={page}>
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span className="px-2 text-gray-400">...</span>
                                )}
                                <Button
                                  variant={interventionsPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setInterventionsPage(page)}
                                  className="h-8 w-8 p-0"
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInterventionsPage(prev => Math.min(Math.ceil(interventions.length / interventionsPerPage), prev + 1))}
                          disabled={interventionsPage >= Math.ceil(interventions.length / interventionsPerPage)}
                          className="h-8"
                        >
                          Suivant →
                        </Button>
                      </div>
                    </div>
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
                 <div className="flex items-center gap-3">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                     <Input
                       type="text"
                       placeholder="Rechercher un équipement..."
                       value={materialSearch}
                       onChange={(e) => {
                         setMaterialSearch(e.target.value)
                         setMaterialPage(1) // Réinitialiser à la page 1 lors d'une recherche
                       }}
                       className="pl-10 w-64 bg-white/5 border-white/20"
                     />
                   </div>
                   <select
                     value={depotFilter}
                     onChange={async (e) => {
                       const val = e.target.value as 'ALL' | 'AXECOM' | 'ERT'
                       setDepotFilter(val)
                       try {
                         const params = val && val !== 'ALL' ? `?depot=${encodeURIComponent(val)}` : ''
                         const response = await fetch(`/api/materiel${params}`)
                         if (!response.ok) throw new Error('Erreur lors du chargement du matériel')
                         const data = await response.json()
                         setMaterials(data.materiel || [])
                       } catch (err) {
                         console.error('Erreur chargement materiel par dépôt:', err)
                         setMaterials([])
                       }
                     }}
                     className="border rounded-md px-2 py-1 bg-white/5 text-sm"
                     aria-label="Filtrer par dépôt"
                   >
                     <option value="ALL">Tous les dépôts</option>
                     <option value="AXECOM">AXECOM</option>
                     <option value="ERT">ERT</option>
                   </select>
                   <Button variant="outline">
                     <Plus className="w-4 h-4 mr-2" />
                     Nouveau
                   </Button>
                 </div>
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
                
                {/* Stock Statistics by Depot */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Stock All Depots */}
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Stock Total</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {materials
                                .filter((m) => {
                                  if (!materialSearch) return true
                                  const searchLower = materialSearch.toLowerCase()
                                  return (
                                    m.nom_equipement?.toLowerCase().includes(searchLower) ||
                                    m.type_equipement?.toLowerCase().includes(searchLower) ||
                                    m.marque?.toLowerCase().includes(searchLower) ||
                                    m.modele?.toLowerCase().includes(searchLower) ||
                                    m.numero_serie?.toLowerCase().includes(searchLower) ||
                                    m.depot?.toLowerCase().includes(searchLower)
                                  )
                                })
                                .reduce((sum, m) => sum + ((m.quantite || 0) * (m.prix_unitaire || 0)), 0)
                                .toFixed(2)} €
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {materials.filter((m) => {
                                if (!materialSearch) return true
                                const searchLower = materialSearch.toLowerCase()
                                return (
                                  m.nom_equipement?.toLowerCase().includes(searchLower) ||
                                  m.type_equipement?.toLowerCase().includes(searchLower) ||
                                  m.marque?.toLowerCase().includes(searchLower) ||
                                  m.modele?.toLowerCase().includes(searchLower) ||
                                  m.numero_serie?.toLowerCase().includes(searchLower) ||
                                  m.depot?.toLowerCase().includes(searchLower)
                                )
                              }).length} articles
                            </p>
                          </div>
                          <Package className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* AXECOM Stock */}
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Stock AXECOM</p>
                            <p className="text-2xl font-bold text-green-600">
                              {materials
                                .filter((m) => {
                                  if (m.depot !== 'AXECOM') return false
                                  if (!materialSearch) return true
                                  const searchLower = materialSearch.toLowerCase()
                                  return (
                                    m.nom_equipement?.toLowerCase().includes(searchLower) ||
                                    m.type_equipement?.toLowerCase().includes(searchLower) ||
                                    m.marque?.toLowerCase().includes(searchLower) ||
                                    m.modele?.toLowerCase().includes(searchLower) ||
                                    m.numero_serie?.toLowerCase().includes(searchLower)
                                  )
                                })
                                .reduce((sum, m) => sum + ((m.quantite || 0) * (m.prix_unitaire || 0)), 0)
                                .toFixed(2)} €
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {materials.filter((m) => {
                                if (m.depot !== 'AXECOM') return false
                                if (!materialSearch) return true
                                const searchLower = materialSearch.toLowerCase()
                                return (
                                  m.nom_equipement?.toLowerCase().includes(searchLower) ||
                                  m.type_equipement?.toLowerCase().includes(searchLower) ||
                                  m.marque?.toLowerCase().includes(searchLower) ||
                                  m.modele?.toLowerCase().includes(searchLower) ||
                                  m.numero_serie?.toLowerCase().includes(searchLower)
                                )
                              }).length} articles
                            </p>
                          </div>
                          <Package className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* ERT Stock */}
                    <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Stock ERT</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {materials
                                .filter((m) => {
                                  if (m.depot !== 'ERT') return false
                                  if (!materialSearch) return true
                                  const searchLower = materialSearch.toLowerCase()
                                  return (
                                    m.nom_equipement?.toLowerCase().includes(searchLower) ||
                                    m.type_equipement?.toLowerCase().includes(searchLower) ||
                                    m.marque?.toLowerCase().includes(searchLower) ||
                                    m.modele?.toLowerCase().includes(searchLower) ||
                                    m.numero_serie?.toLowerCase().includes(searchLower)
                                  )
                                })
                                .reduce((sum, m) => sum + ((m.quantite || 0) * (m.prix_unitaire || 0)), 0)
                                .toFixed(2)} €
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {materials.filter((m) => {
                                if (m.depot !== 'ERT') return false
                                if (!materialSearch) return true
                                const searchLower = materialSearch.toLowerCase()
                                return (
                                  m.nom_equipement?.toLowerCase().includes(searchLower) ||
                                  m.type_equipement?.toLowerCase().includes(searchLower) ||
                                  m.marque?.toLowerCase().includes(searchLower) ||
                                  m.modele?.toLowerCase().includes(searchLower) ||
                                  m.numero_serie?.toLowerCase().includes(searchLower)
                                )
                              }).length} articles
                            </p>
                          </div>
                          <Package className="w-8 h-8 text-orange-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

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
                               <th className="text-left p-4 font-semibold">Valeur Totale</th>
                               <th className="text-left p-4 font-semibold">Dépôt</th>
                               <th className="text-left p-4 font-semibold">
                                 <button 
                                   onClick={() => setStockSortOrder(stockSortOrder === 'asc' ? 'desc' : 'asc')}
                                   className="flex items-center gap-2 hover:text-primary transition-colors"
                                 >
                                   Stock
                                   {stockSortOrder === 'desc' ? (
                                     <ChevronRight className="w-4 h-4 transform -rotate-90" />
                                   ) : (
                                     <ChevronRight className="w-4 h-4 transform rotate-90" />
                                   )}
                                 </button>
                               </th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                             {(() => {
                               const filteredMaterials = materials
                                 .filter((material) => {
                                   if (!materialSearch) return true
                                   const searchLower = materialSearch.toLowerCase()
                                   return (
                                     material.nom_equipement?.toLowerCase().includes(searchLower) ||
                                     material.type_equipement?.toLowerCase().includes(searchLower) ||
                                     material.marque?.toLowerCase().includes(searchLower) ||
                                     material.modele?.toLowerCase().includes(searchLower) ||
                                     material.numero_serie?.toLowerCase().includes(searchLower) ||
                                     material.depot?.toLowerCase().includes(searchLower)
                                   )
                                 })
                                 .sort((a, b) => {
                                   const quantiteA = a.quantite || 0
                                   const quantiteB = b.quantite || 0
                                   return stockSortOrder === 'desc' 
                                     ? quantiteB - quantiteA 
                                     : quantiteA - quantiteB
                                 })
                               
                               const totalPages = Math.ceil(filteredMaterials.length / materialItemsPerPage)
                               const startIndex = (materialPage - 1) * materialItemsPerPage
                               const endIndex = startIndex + materialItemsPerPage
                               const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex)
                               
                               return paginatedMaterials.map((material, index) => (
                               <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-4 font-medium">{material.nom_equipement}</td>
                                 <td className="p-4">{material.type_equipement}</td>
                                 <td className="p-4">{material.marque}</td>
                                 <td className="p-4">{material.modele}</td>
                                 <td className="p-4">
                                   <span className="font-semibold text-green-600">
                                     {((material.quantite || 0) * (material.prix_unitaire || 0)).toFixed(2)} €
                                   </span>
                                 </td>
                                 <td className="p-4">{material.depot || 'AXECOM'}</td>
                                 <td className="p-4">
                                   <div className="flex items-center gap-2">
                                     <Package className="w-4 h-4 text-primary" />
                                     <span className="font-medium">{material.quantite || 0}</span>
                                   </div>
                                 </td>
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
                                      setSelectedMaterialForTransfer(material)
                                      setTransferQuantity(1)
                                      setTransferDepotDestination(material.depot === 'AXECOM' ? 'ERT' : 'AXECOM')
                                      setTransferMotif('')
                                      setTransferComments('')
                                      setShowTransferModal(true)
                                    }}
                                       className="glass-card border border-white/20 text-purple-400 hover:text-purple-300"
                                       title="Transférer vers un autre dépôt"
                                     >
                                       <RefreshCw className="w-4 h-4" />
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
                        ))
                             })()}
                      </tbody>
                    </table>
                  </div>
                  )}
                  
                  {/* Pagination Controls */}
                  {!loadingMaterials && materials.length > 0 && (() => {
                    const filteredCount = materials.filter((material) => {
                      if (!materialSearch) return true
                      const searchLower = materialSearch.toLowerCase()
                      return (
                        material.nom_equipement?.toLowerCase().includes(searchLower) ||
                        material.type_equipement?.toLowerCase().includes(searchLower) ||
                        material.marque?.toLowerCase().includes(searchLower) ||
                        material.modele?.toLowerCase().includes(searchLower) ||
                        material.numero_serie?.toLowerCase().includes(searchLower) ||
                        material.depot?.toLowerCase().includes(searchLower)
                      )
                    }).length
                    
                    const totalPages = Math.ceil(filteredCount / materialItemsPerPage)
                    
                    if (totalPages <= 1) return null
                    
                    return (
                      <div className="flex items-center justify-between px-4 py-4 border-t border-white/10">
                        <div className="text-sm text-muted-foreground">
                          Affichage de {((materialPage - 1) * materialItemsPerPage) + 1} à {Math.min(materialPage * materialItemsPerPage, filteredCount)} sur {filteredCount} résultats
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMaterialPage(1)}
                            disabled={materialPage === 1}
                            className="glass-card border border-white/20"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <ChevronLeft className="w-4 h-4 -ml-2" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMaterialPage(p => Math.max(1, p - 1))}
                            disabled={materialPage === 1}
                            className="glass-card border border-white/20"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <div className="flex items-center gap-2 px-4">
                            <span className="text-sm font-medium">Page {materialPage} sur {totalPages}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMaterialPage(p => Math.min(totalPages, p + 1))}
                            disabled={materialPage === totalPages}
                            className="glass-card border border-white/20"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMaterialPage(totalPages)}
                            disabled={materialPage === totalPages}
                            className="glass-card border border-white/20"
                          >
                            <ChevronRight className="w-4 h-4" />
                            <ChevronRight className="w-4 h-4 -ml-2" />
                          </Button>
                        </div>
                      </div>
                    )
                  })()}
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
                    {/* AffectationTest component removed */}
                    </CardContent>
                  </Card>

                  {/* Employee Material Value Table */}
                  <EmployeeMaterialValueTable />
               </div>
            </div>
          )}

          {/* Récap Calcul Section */}
          {activeTab === "recap-calcul" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">Récap Calcul</h2>
                  <p className="text-muted-foreground">Calcul du bénéfice net par employé</p>
                </div>
              </div>

              {/* Récap Calcul Table */}
              <RecapCalculTable />
            </div>
          )}

          {/* Documents Administratifs Section */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">Documents Administratifs</h2>
                  <p className="text-muted-foreground">Gestion des demandes de documents des techniciens</p>
                </div>
              </div>

              {/* Admin Documents Manager */}
              <AdminDocumentsManager />
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
                               <th className="text-left p-4 font-semibold">Date d'Attribution</th>
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
                                 <td className="p-4">{new Date(penalty.date_attribution).toLocaleDateString('fr-FR')}</td>
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
          {activeTab === "statistics" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Statistiques</h2>
                <p className="text-muted-foreground">Analyses et graphiques des données</p>
              </div>
            </div>
            
            {/* Carte Clôtures et Échecs - wrapped to prevent hydration issues */}
            <div suppressHydrationWarning>
              <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Clôtures et Échecs Terminés
                  </CardTitle>
                  <CardDescription>
                    Analyse des interventions terminées (clôtures et échecs) par technicien
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FailureStatistics />
                </CardContent>
              </Card>
            </div>

            {/* Carte Répartition par Type de Parcours */}
            <Card className="glass-card border border-white/20 hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Type de Parcours
                </CardTitle>
                <CardDescription>
                  Analyse des interventions clôturées et échecs par type de parcours - AXECOM vs ERT OUEST
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParcoursStatistics />
              </CardContent>
            </Card>

            {/* Carte RACC par Type de Logement */}
            <Card className="glass-card border border-white/20 hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  RACC par Type de Logement
                </CardTitle>
                <CardDescription>
                  Répartition des raccordements clôturés par type (Pavillon/Immeuble) - AXECOM vs ERT OUEST
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RaccByTypeStatistics />
              </CardContent>
            </Card>

            {/* Interface de statistiques */}
            <StatisticsDashboard />
          </div>
        )}


        {activeTab === "costs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Gestion des Charges</h2>
                <p className="text-muted-foreground">Gestion des charges fixes et variables</p>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/setup-costs', { method: 'POST' })
                    if (response.ok) {
                      alert('✅ Tables de charges initialisées avec succès')
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
            
            {/* Interface de gestion des charges */}
            <CostsManagement />
          </div>
        )}

        {/* Section Charges par Salarié */}
        {activeTab === "cout-par-salaire" && (
          <div className="space-y-6">
            {/* Section de synchronisation masquée */}
            {/* 
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Synchronisation des données</h3>
              <p className="text-sm text-gray-600 mb-4">
                Synchronisez automatiquement les données entre "Bénéfice Brut" et "Charges par Salarié" 
                pour maintenir la cohérence des informations.
              </p>
              <SyncButton />
            </div>
            */}
            
           {/* Détection automatique des noms - masqué */}
           {/*
           <div className="bg-white rounded-lg shadow-sm border p-6">
             <h3 className="text-lg font-semibold mb-4">Détection automatique des noms</h3>
             <p className="text-sm text-gray-600 mb-4">
               Système intelligent de détection automatique des correspondances entre les noms des techniciens 
               pour éviter les problèmes de matching manuel.
             </p>
             <AutoDetectButton />
           </div>
           */}
           
           {/* Correction automatique des RAP - masqué */}
           {/* <RapAutoCorrectButton /> */}
           
           {/* Synchronisation Automatique du Total Généré - masqué */}
           {/* <AutoSyncTotalGenere /> */}
           
            <CoutParSalaireManager />
          </div>
        )}

        {/* Section Synchronisation des Employés */}
        {activeTab === "employee-sync" && (
          <div className="space-y-6">
            <EmployeeSyncManager />
          </div>
        )}

        {/* Section Compte Admin */}
        {activeTab === "compte-admin" && (
          <div className="space-y-6">
            <UserManagement />
          </div>
        )}

        {/* Section Historique */}
        {activeTab === "historique" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Historique des Actions</h2>
                <p className="text-muted-foreground">Traçabilité de toutes les opérations effectuées</p>
              </div>
            </div>
            <HistoriqueManager />
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
                 
                 {filteredClaims.filter(claim => claim.statut === 'en_cours').length > 0 && (
                   <Card className="glass-card border border-yellow-500/30 bg-yellow-500/5 hover-lift">
                     <CardHeader>
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-yellow-500/20 rounded-lg">
                           <Timer className="w-5 h-5 text-yellow-400" />
                         </div>
                         <div>
                           <CardTitle className="text-xl font-bold text-yellow-400">
                             Réclamations en attente de validation ({filteredClaims.filter(claim => claim.statut === 'en_cours').length})
                           </CardTitle>
                           <p className="text-yellow-300/80">Ces réclamations ont été résolues par les techniciens et attendent votre validation</p>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <div className="grid gap-4">
                         {filteredClaims.filter(claim => claim.statut === 'en_cours').map((claim) => (
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
                     <div className="flex items-center justify-between gap-3">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-lg">
                           <FileText className="w-5 h-5 text-primary" />
                         </div>
                         <div>
                           <CardTitle className="text-xl font-bold">Liste des Réclamations</CardTitle>
                      <CardDescription>
                      {filteredClaims.length} réclamation{filteredClaims.length > 1 ? 's' : ''} {claimSearchTerm || claimEmployeeFilter !== 'all' || claimDateFilter !== 'all' ? `filtrée${filteredClaims.length > 1 ? 's' : ''} sur ${claims.length}` : 'dans la base de données'}
                      </CardDescription>
                         </div>
                       </div>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={async () => {
                           try {
                             const response = await fetch("/api/reclamations")
                             if (response.ok) {
                               const data = await response.json()
                               setClaims(data.reclamations || [])
                               console.log('✅ Réclamations rechargées avec succès')
                             }
                           } catch (error) {
                             console.error('❌ Erreur lors du rechargement des réclamations:', error)
                           }
                         }}
                         className="flex items-center gap-2"
                       >
                         <RefreshCw className="w-4 h-4" />
                         Actualiser
                       </Button>
                     </div>
                  </CardHeader>
                <CardContent>
                  {/* Filtres et barre de recherche */}
                  <div className="mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Barre de recherche par numéro d'intervention */}
                      <div className="relative">
                        <Label htmlFor="claim-search" className="mb-2 block text-sm font-medium">
                          Rechercher par N° Intervention
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="claim-search"
                            type="text"
                            placeholder="Ex: 120038249, 138855..."
                            value={claimSearchTerm}
                            onChange={(e) => setClaimSearchTerm(e.target.value)}
                            className="pl-10 glass-card border border-white/20"
                          />
                        </div>
                      </div>

                      {/* Filtre par employé */}
                      <div>
                        <Label htmlFor="claim-employee-filter" className="mb-2 block text-sm font-medium">
                          Filtrer par Employé
                        </Label>
                        <Select value={claimEmployeeFilter} onValueChange={setClaimEmployeeFilter}>
                          <SelectTrigger id="claim-employee-filter" className="glass-card border border-white/20">
                            <SelectValue placeholder="Tous les employés" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les employés</SelectItem>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.prenom} {emp.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtre par date de création */}
                      <div>
                        <Label htmlFor="claim-date-filter" className="mb-2 block text-sm font-medium">
                          Filtrer par Date de Création
                        </Label>
                        <Select value={claimDateFilter} onValueChange={setClaimDateFilter}>
                          <SelectTrigger id="claim-date-filter" className="glass-card border border-white/20">
                            <SelectValue placeholder="Toutes les dates" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les dates</SelectItem>
                            <SelectItem value="today">Aujourd'hui</SelectItem>
                            <SelectItem value="week">Cette semaine</SelectItem>
                            <SelectItem value="month">Ce mois</SelectItem>
                            <SelectItem value="last-month">Mois dernier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Indicateur de filtres actifs */}
                    {(claimSearchTerm || claimEmployeeFilter !== 'all' || claimDateFilter !== 'all') && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Filtres actifs:</span>
                        {claimSearchTerm && (
                          <Badge variant="outline" className="gap-1">
                            Recherche: {claimSearchTerm}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => setClaimSearchTerm('')}
                            />
                          </Badge>
                        )}
                        {claimEmployeeFilter !== 'all' && (
                          <Badge variant="outline" className="gap-1">
                            Employé filtré
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => setClaimEmployeeFilter('all')}
                            />
                          </Badge>
                        )}
                        {claimDateFilter !== 'all' && (
                          <Badge variant="outline" className="gap-1">
                            Date: {claimDateFilter === 'today' ? 'Aujourd\'hui' : 
                                   claimDateFilter === 'week' ? 'Cette semaine' :
                                   claimDateFilter === 'month' ? 'Ce mois' : 'Mois dernier'}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => setClaimDateFilter('all')}
                            />
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setClaimSearchTerm('')
                            setClaimEmployeeFilter('all')
                            setClaimDateFilter('all')
                          }}
                          className="ml-2 h-7 text-xs"
                        >
                          Réinitialiser tout
                        </Button>
                      </div>
                    )}
                  </div>

                  {loadingClaims ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des réclamations...</p>
                    </div>
                  ) : filteredClaims.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucune réclamation trouvée</h3>
                         <p>{claims.length === 0 ? 'Ajoutez des réclamations pour commencer à gérer les plaintes.' : 'Aucune réclamation ne correspond aux critères de recherche.'}</p>
                    </div>
                  ) : (
                    <>
                      {/* Version Desktop - Tableau */}
                      <div className="hidden lg:block overflow-x-auto">
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
                             {filteredClaims.slice(0, 50).map((claim, index) => (
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
                                   {claim.intervention_id ? (
                                     <div className="flex items-center gap-2">
                                       <FileText className="w-4 h-4 text-blue-500" />
                                       <span className="text-sm font-mono">{claim.numero_intervention || claim.intervention_id}</span>
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
                                        setSelectedImage(claim.photos[0].url)
                                        setSelectedImageIndex(0)
                                        setShowImageModal(true)
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
                    
                    {/* Version Mobile - Cartes */}
                    <div className="lg:hidden space-y-4">
                      {filteredClaims.slice(0, 50).map((claim, index) => (
                        <Card key={`mobile-${index}`} className="glass-card border border-white/10">
                          <CardContent className="p-4 space-y-3">
                            {/* En-tête */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant={claim.statut === 'ouverte' ? 'default' : 'secondary'}
                                className={
                                  claim.statut === 'ouverte' ? 'bg-orange-500/20 text-orange-400' : 
                                  claim.statut === 'en_cours' ? 'bg-blue-500/20 text-blue-400' :
                                  claim.statut === 'resolue' ? 'bg-green-500/20 text-green-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }
                              >
                                {claim.statut === 'en_cours' ? 'En cours' : 
                                 claim.statut === 'resolue' ? 'Résolu' :
                                 claim.statut || 'ouverte'}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={
                                  claim.priorite === 'critique' ? 'bg-red-500/20 text-red-400' :
                                  claim.priorite === 'haute' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }
                              >
                                {claim.priorite || 'normale'}
                              </Badge>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold text-sm mb-1">{claim.nom_client || 'Non spécifié'}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">{claim.description_probleme || 'Non spécifié'}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                              <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{claim.type_reclamation || 'N/A'}</span></div>
                              <div><span className="text-muted-foreground">Employé:</span> <span className="font-medium">{claim.employe_nom || 'N/A'}</span></div>
                              <div><span className="text-muted-foreground">Date:</span> <span className="font-medium">{claim.created_at ? new Date(claim.created_at).toLocaleDateString('fr-FR') : 'N/A'}</span></div>
                              {claim.photos && claim.photos.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Camera className="w-3 h-3 text-green-500" />
                                  <span className="text-green-600">{claim.photos.length} photo(s)</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              {claim.statut === 'en_cours' && (
                                <>
                                  <Button size="sm" onClick={() => handleValidateClaim(claim.id, 'approve')} className="flex-1 bg-green-500/20 text-green-400 text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />Accepter
                                  </Button>
                                  <Button size="sm" onClick={() => handleValidateClaim(claim.id, 'reject')} className="flex-1 bg-red-500/20 text-red-400 text-xs">
                                    <X className="w-3 h-3 mr-1" />Rejeter
                                  </Button>
                                </>
                              )}
                              {claim.photos && claim.photos.length > 0 && (
                                <Button size="sm" onClick={() => { setSelectedClaim(claim); setSelectedImage(claim.photos[0].url); setSelectedImageIndex(0); setShowImageModal(true); }} className="flex-1">
                                  <Eye className="w-3 h-3 mr-1" />Voir
                                </Button>
                              )}
                              <Button size="sm" onClick={() => { setEditingItem(claim); setShowClaimModal(true); }}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="sm" onClick={() => handleDelete('claim', claim.id)} className="text-red-400">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    </>
                  )}
                  </CardContent>
                </Card>
               </div>
              </div>
          )}

           {/* Vehicules Section */}
           {activeTab === "vehicules" && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                   <h2 className="text-3xl font-bold">Gestion des Véhicules</h2>
                   <p className="text-muted-foreground">Flotte, assignations et entretien</p>
                  </div>
              </div>
              
              {/* Sous-onglets */}
              <div className="flex gap-2 border-b border-white/10">
                <Button
                  variant={vehiculesSubTab === 'flotte' ? 'default' : 'ghost'}
                  onClick={() => setVehiculesSubTab('flotte')}
                  className="rounded-b-none"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Flotte
                </Button>
                <Button
                  variant={vehiculesSubTab === 'assignations' ? 'default' : 'ghost'}
                  onClick={() => setVehiculesSubTab('assignations')}
                  className="rounded-b-none"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Assignations
                </Button>
                <Button
                  variant={vehiculesSubTab === 'validations' ? 'default' : 'ghost'}
                  onClick={() => setVehiculesSubTab('validations')}
                  className="rounded-b-none relative"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validations
                  {kmUpdates.length > 0 && (
                    <Badge className="ml-2 bg-red-500 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {kmUpdates.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={vehiculesSubTab === 'entretiens' ? 'default' : 'ghost'}
                  onClick={() => setVehiculesSubTab('entretiens')}
                  className="rounded-b-none"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Entretiens
                </Button>
              </div>
              
               {/* Vehicules Management Section */}
                    <div className="space-y-6">
                 {/* Section 1: Liste des Véhicules */}
                 {vehiculesSubTab === 'flotte' && (
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                            <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-lg">
                           <Car className="w-5 h-5 text-primary" />
                          </div>
                                <div>
                           <CardTitle className="text-xl font-bold">Flotte de Véhicules</CardTitle>
                           <CardDescription>
                             {vehicules.length} véhicule(s) dans la flotte
                           </CardDescription>
                            </div>
                              </div>
                       <Button onClick={() => { setEditingVehicule(null); setShowVehiculeModal(true); }}>
                         <Plus className="w-4 h-4 mr-2" />
                         Nouveau Véhicule
                       </Button>
                            </div>
                   </CardHeader>
                   <CardContent>
                     {loadingVehicules ? (
                       <div className="text-center py-8">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                         <p className="mt-2 text-muted-foreground">Chargement des véhicules...</p>
                       </div>
                     ) : vehicules.length === 0 ? (
                       <div className="text-center py-8 text-muted-foreground">
                         <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">Aucun véhicule</h3>
                         <p>Ajoutez des véhicules à votre flotte</p>
                       </div>
                     ) : (
                       <div className="overflow-x-auto">
                         <table className="w-full border-collapse">
                           <thead>
                             <tr className="border-b border-white/10">
                               <th className="text-left p-4 font-semibold">Matricule</th>
                               <th className="text-left p-4 font-semibold">Marque/Modèle</th>
                               <th className="text-left p-4 font-semibold">Année</th>
                               <th className="text-left p-4 font-semibold">Kilométrage</th>
                               <th className="text-left p-4 font-semibold">Type</th>
                               <th className="text-left p-4 font-semibold">Statut</th>
                               <th className="text-left p-4 font-semibold">Technicien Assigné</th>
                               <th className="text-left p-4 font-semibold">Actions</th>
                             </tr>
                           </thead>
                           <tbody>
                             {vehicules.map((vehicule) => (
                               <tr key={vehicule.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-4">
                                   <span className="font-mono font-semibold">{vehicule.matricule}</span>
                                 </td>
                                 <td className="p-4">
                                   <div>
                                     <div className="font-medium">{vehicule.marque}</div>
                                     <div className="text-sm text-muted-foreground">{vehicule.modele}</div>
                                   </div>
                                 </td>
                                 <td className="p-4">{vehicule.annee}</td>
                                 <td className="p-4">{vehicule.kilometrage?.toLocaleString()} km</td>
                                 <td className="p-4">
                                   <Badge variant="outline">{vehicule.type_vehicule}</Badge>
                                 </td>
                                 <td className="p-4">
                                   <Badge className={
                                     vehicule.statut === 'disponible' ? 'bg-green-500/20 text-green-400' :
                                     vehicule.statut === 'en_service' ? 'bg-blue-500/20 text-blue-400' :
                                     vehicule.statut === 'en_maintenance' ? 'bg-yellow-500/20 text-yellow-400' :
                                     'bg-red-500/20 text-red-400'
                                   }>
                                     {vehicule.statut === 'disponible' ? 'Disponible' :
                                      vehicule.statut === 'en_service' ? 'En Service' :
                                      vehicule.statut === 'en_maintenance' ? 'En Maintenance' : 'Hors Service'}
                                   </Badge>
                                 </td>
                                 <td className="p-4">
                                   {vehicule.employe_nom ? (
                                     <span className="text-sm">{vehicule.employe_prenom} {vehicule.employe_nom}</span>
                                   ) : (
                                     <span className="text-muted-foreground text-sm">Non assigné</span>
                                   )}
                                 </td>
                                 <td className="p-4">
                                   <div className="flex gap-2">
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => {
                                         setEditingVehicule(vehicule)
                                         setShowVehiculeModal(true)
                                       }}
                                     >
                                       <Edit className="w-4 h-4" />
                                     </Button>
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => {
                                         if (confirm('Êtes-vous sûr de vouloir supprimer ce véhicule?')) {
                                           deleteVehicule(vehicule.id)
                                         }
                                       }}
                                       className="text-red-400 hover:text-red-300"
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
                 )}

                 {/* Section 2: Assignations de Véhicules */}
                 {vehiculesSubTab === 'assignations' && (<>
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                            <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500/10 rounded-lg">
                           <UserCheck className="w-5 h-5 text-blue-500" />
                          </div>
                                <div>
                           <CardTitle className="text-xl font-bold">Assignations Actives</CardTitle>
                           <CardDescription>
                             {assignationsVehicules.filter(a => a.statut === 'active').length} assignation(s) en cours
                           </CardDescription>
                            </div>
                              </div>
                       <div className="flex gap-2">
                         {assignationsVehicules.filter(a => a.statut === 'active').length > 0 && (
                           <TestKmAlerts 
                             assignationId={assignationsVehicules.filter(a => a.statut === 'active')[0]?.id || 0}
                             vehiculeId={assignationsVehicules.filter(a => a.statut === 'active')[0]?.vehicule_id || 0}
                           />
                         )}
                         <Button onClick={() => { setEditingAssignationVehicule(null); setShowAssignationVehiculeModal(true); }}>
                           <Plus className="w-4 h-4 mr-2" />
                           Nouvelle Assignation
                         </Button>
                       </div>
                            </div>
                   </CardHeader>
                   <CardContent>
                     {assignationsVehicules.filter(a => a.statut === 'active').length === 0 ? (
                       <div className="text-center py-8 text-muted-foreground">
                         <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">Aucune assignation active</h3>
                         <p>Assignez des véhicules aux techniciens</p>
                       </div>
                     ) : (
                       <div className="overflow-x-auto">
                         <table className="w-full border-collapse">
                           <thead>
                             <tr className="border-b border-white/10">
                               <th className="text-left p-4 font-semibold">Véhicule</th>
                               <th className="text-left p-4 font-semibold">Technicien</th>
                               <th className="text-left p-4 font-semibold">Date Début</th>
                               <th className="text-left p-4 font-semibold">KM Début</th>
                               <th className="text-left p-4 font-semibold">KM Actuel</th>
                               <th className="text-left p-4 font-semibold">Dernière MAJ KM</th>
                               <th className="text-left p-4 font-semibold">Durée</th>
                               <th className="text-left p-4 font-semibold">Statut KM</th>
                               <th className="text-left p-4 font-semibold">Actions</th>
                             </tr>
                           </thead>
                           <tbody>
                             {assignationsVehicules.filter(a => a.statut === 'active').map((assignation) => {
                               const dateDebut = new Date(assignation.date_assignation)
                               const aujourdhui = new Date()
                               const dureeJours = Math.floor((aujourdhui.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24))
                               
                               return (
                                 <tr key={assignation.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                   <td className="p-4">
                                     <div>
                                       <div className="font-mono font-semibold">{assignation.matricule}</div>
                                       <div className="text-sm text-muted-foreground">{assignation.marque} {assignation.modele}</div>
                                     </div>
                                   </td>
                                   <td className="p-4">
                                     <span>{assignation.employe_prenom} {assignation.employe_nom}</span>
                                   </td>
                                   <td className="p-4">
                                     {assignation.date_assignation ? new Date(assignation.date_assignation).toLocaleDateString('fr-FR') : '-'}
                                   </td>
                                   <td className="p-4">
                                     {assignation.kilometrage_debut !== null && assignation.kilometrage_debut !== undefined
                                       ? `${assignation.kilometrage_debut.toLocaleString()} km`
                                       : assignation.kilometrage_vehicule !== null && assignation.kilometrage_vehicule !== undefined
                                       ? `${assignation.kilometrage_vehicule.toLocaleString()} km`
                                       : '0 km'
                                     }
                                   </td>
                                   <td className="p-4">
                                     <div className="font-semibold text-primary">
                                       {assignation.km_actuel !== null && assignation.km_actuel !== undefined
                                         ? `${assignation.km_actuel.toLocaleString()} km`
                                         : assignation.kilometrage_debut !== null && assignation.kilometrage_debut !== undefined
                                         ? `${assignation.kilometrage_debut.toLocaleString()} km`
                                         : '0 km'
                                       }
                                     </div>
                                   </td>
                                   <td className="p-4">
                                     {assignation.date_derniere_maj ? (
                                       <div className="text-sm">
                                         <div className="font-semibold text-green-400">
                                           {new Date(assignation.date_derniere_maj).toLocaleDateString('fr-FR')}
                                         </div>
                                         <div className="text-xs text-muted-foreground">
                                           {new Date(assignation.date_derniere_maj).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                         </div>
                                       </div>
                                     ) : (
                                       <span className="text-muted-foreground text-sm">Jamais</span>
                                     )}
                                   </td>
                                   <td className="p-4">
                                     <Badge variant="outline">{dureeJours} jour{dureeJours > 1 ? 's' : ''}</Badge>
                                   </td>
                                   <td className="p-4">
                                     {assignation.statut_km === 'initial_attente' && (
                                       <Badge className="bg-orange-500/20 text-orange-400">
                                         <Clock className="w-3 h-3 mr-1" />
                                         Initial requis
                                       </Badge>
                                     )}
                                     {assignation.statut_km === 'en_attente_validation' && (
                                       <Badge className="bg-yellow-500/20 text-yellow-400">
                                         <Clock className="w-3 h-3 mr-1" />
                                         En validation
                                       </Badge>
                                     )}
                                     {assignation.statut_km === 'a_jour' && (
                                       <Badge className="bg-green-500/20 text-green-400">
                                         <CheckCircle className="w-3 h-3 mr-1" />
                                         À jour
                                       </Badge>
                                     )}
                                     {assignation.statut_km === 'retard_j0' && (
                                       <Badge className="bg-red-500/20 text-red-400">
                                         <AlertTriangle className="w-3 h-3 mr-1" />
                                         Jour J
                                       </Badge>
                                     )}
                                     {assignation.statut_km?.startsWith('retard_j') && assignation.statut_km !== 'retard_j0' && (
                                       <Badge className="bg-orange-500/20 text-orange-400">
                                         <AlertTriangle className="w-3 h-3 mr-1" />
                                         {assignation.statut_km.replace('retard_', '').toUpperCase()}
                                       </Badge>
                                     )}
                                     {assignation.statut_km === 'bloque' && (
                                       <Badge className="bg-red-500/20 text-red-400 animate-pulse">
                                         <AlertTriangle className="w-3 h-3 mr-1" />
                                         BLOQUÉ
                                       </Badge>
                                     )}
                                   </td>
                                   <td className="p-4">
                                     <div className="flex gap-2">
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => {
                                           setEditingAssignationVehicule(assignation)
                                           setShowAssignationVehiculeModal(true)
                                         }}
                                       >
                                         <Edit className="w-4 h-4" />
                                       </Button>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => {
                                           if (confirm(`Arrêter l'assignation du véhicule ${assignation.matricule} ?`)) {
                                             deleteAssignationVehicule(assignation.id)
                                           }
                                         }}
                                         className="text-orange-400 hover:text-orange-300"
                                       >
                                         <CheckCircle className="w-4 h-4 mr-1" />
                                         Arrêter l'assignation
                                       </Button>
                                     </div>
                                   </td>
                                 </tr>
                               )
                             })}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </CardContent>
                 </Card>
                 
                 {/* Section 2b: Historique des Assignations */}
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                            <div className="flex items-center gap-3">
                       <div className="p-2 bg-gray-500/10 rounded-lg">
                         <History className="w-5 h-5 text-gray-500" />
                          </div>
                                <div>
                           <CardTitle className="text-xl font-bold">Historique des Assignations</CardTitle>
                           <CardDescription>
                             {assignationsVehicules.filter(a => a.statut === 'terminee').length} assignation(s) terminée(s)
                           </CardDescription>
                            </div>
                              </div>
                   </CardHeader>
                   <CardContent>
                     {assignationsVehicules.filter(a => a.statut === 'terminee').length === 0 ? (
                       <div className="text-center py-8 text-muted-foreground">
                         <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                         <p>Les assignations terminées apparaîtront ici</p>
                       </div>
                     ) : (
                       <div className="overflow-x-auto">
                         <table className="w-full border-collapse">
                           <thead>
                             <tr className="border-b border-white/10">
                               <th className="text-left p-4 font-semibold">Véhicule</th>
                               <th className="text-left p-4 font-semibold">Technicien</th>
                               <th className="text-left p-4 font-semibold">Date Début</th>
                               <th className="text-left p-4 font-semibold">Date Fin</th>
                               <th className="text-left p-4 font-semibold">KM Début</th>
                               <th className="text-left p-4 font-semibold">KM Fin</th>
                               <th className="text-left p-4 font-semibold">KM Parcourus</th>
                               <th className="text-left p-4 font-semibold">Durée</th>
                             </tr>
                           </thead>
                           <tbody>
                             {assignationsVehicules.filter(a => a.statut === 'terminee').map((assignation) => {
                               const dateDebut = new Date(assignation.date_assignation)
                               const dateFin = assignation.date_fin ? new Date(assignation.date_fin) : new Date()
                               const dureeJours = Math.floor((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24))
                               const kmParcourus = (assignation.kilometrage_fin || 0) - (assignation.kilometrage_debut || 0)
                               
                               return (
                                 <tr key={assignation.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                   <td className="p-4">
                                     <div>
                                       <div className="font-mono font-semibold">{assignation.matricule}</div>
                                       <div className="text-sm text-muted-foreground">{assignation.marque} {assignation.modele}</div>
                                     </div>
                                   </td>
                                   <td className="p-4">
                                     <span>{assignation.employe_prenom} {assignation.employe_nom}</span>
                                   </td>
                                   <td className="p-4">
                                     {assignation.date_assignation ? new Date(assignation.date_assignation).toLocaleDateString('fr-FR') : '-'}
                                   </td>
                                   <td className="p-4">
                                     {assignation.date_fin ? new Date(assignation.date_fin).toLocaleDateString('fr-FR') : '-'}
                                   </td>
                                   <td className="p-4">{assignation.kilometrage_debut?.toLocaleString() || 0} km</td>
                                   <td className="p-4">{assignation.kilometrage_fin?.toLocaleString() || 0} km</td>
                                   <td className="p-4">
                                     <span className={kmParcourus > 0 ? 'font-semibold text-blue-400' : ''}>
                                       {kmParcourus.toLocaleString()} km
                                     </span>
                                   </td>
                                   <td className="p-4">
                                     <Badge variant="secondary">{dureeJours} jour{dureeJours > 1 ? 's' : ''}</Badge>
                                   </td>
                                 </tr>
                               )
                             })}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </CardContent>
                 </Card>
                 </>)}

                 {/* Section Validations KM */}
                 {vehiculesSubTab === 'validations' && (
                   <Card className="glass-card border border-white/20 hover-lift">
                     <CardHeader>
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-500/10 rounded-lg">
                           <CheckCircle className="w-5 h-5 text-green-500" />
                         </div>
                         <div>
                           <CardTitle className="text-xl font-bold">Validations en Attente</CardTitle>
                           <CardDescription>
                             {kmUpdates.length} mise(s) à jour de kilométrage à valider
                           </CardDescription>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <ValidationKmList
                         updates={kmUpdates}
                         onValidate={validateKmUpdate}
                         onReject={rejectKmUpdate}
                         loading={loadingVehicules}
                       />
                     </CardContent>
                   </Card>
                 )}

                 {/* Section 3: Entretiens de Véhicules */}
                 {vehiculesSubTab === 'entretiens' && (
                 <Card className="glass-card border border-white/20 hover-lift">
                   <CardHeader>
                            <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-orange-500/10 rounded-lg">
                           <Wrench className="w-5 h-5 text-orange-500" />
                          </div>
                                <div>
                           <CardTitle className="text-xl font-bold">Entretiens et Réparations</CardTitle>
                           <CardDescription>
                             {entretiensVehicules.length} entretien(s) enregistré(s)
                           </CardDescription>
                            </div>
                              </div>
                       <Button onClick={() => { setEditingEntretienVehicule(null); setShowEntretienVehiculeModal(true); }}>
                         <Plus className="w-4 h-4 mr-2" />
                         Nouvel Entretien
                       </Button>
                            </div>
                   </CardHeader>
                   <CardContent>
                     {entretiensVehicules.length === 0 ? (
                       <div className="text-center py-8 text-muted-foreground">
                         <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                         <h3 className="text-lg font-semibold mb-2">Aucun entretien</h3>
                         <p>Enregistrez les entretiens et réparations des véhicules</p>
                       </div>
                     ) : (
                       <div className="overflow-x-auto">
                         <table className="w-full border-collapse">
                           <thead>
                             <tr className="border-b border-white/10">
                               <th className="text-left p-4 font-semibold">Véhicule</th>
                               <th className="text-left p-4 font-semibold">Date</th>
                               <th className="text-left p-4 font-semibold">Catégorie</th>
                               <th className="text-left p-4 font-semibold">Coût</th>
                               <th className="text-left p-4 font-semibold">Kilométrage</th>
                               <th className="text-left p-4 font-semibold">Garage</th>
                               <th className="text-left p-4 font-semibold">Actions</th>
                             </tr>
                           </thead>
                           <tbody>
                             {entretiensVehicules.map((entretien) => (
                               <tr key={entretien.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-4">
                                   <div>
                                     <div className="font-mono font-semibold">{entretien.matricule}</div>
                                     <div className="text-sm text-muted-foreground">{entretien.marque} {entretien.modele}</div>
                                   </div>
                                 </td>
                                 <td className="p-4">
                                   {entretien.date_entretien ? new Date(entretien.date_entretien).toLocaleDateString('fr-FR') : '-'}
                                 </td>
                                 <td className="p-4">
                                   <Badge variant="outline">{entretien.categorie_entretien}</Badge>
                                 </td>
                                 <td className="p-4">
                                   <span className="font-semibold">{entretien.cout_entretien?.toFixed(2)} €</span>
                                 </td>
                                 <td className="p-4">{entretien.kilometrage_entretien?.toLocaleString() || '-'} km</td>
                                 <td className="p-4">
                                   {entretien.garage || <span className="text-muted-foreground">-</span>}
                                 </td>
                                 <td className="p-4">
                                   <div className="flex gap-2">
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => {
                                         setEditingEntretienVehicule(entretien)
                                         setShowEntretienVehiculeModal(true)
                                       }}
                                     >
                                       <Edit className="w-4 h-4" />
                                     </Button>
                                     <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => {
                                         if (confirm('Êtes-vous sûr de vouloir supprimer cet entretien?')) {
                                           deleteEntretienVehicule(entretien.id)
                                         }
                                       }}
                                       className="text-red-400 hover:text-red-300"
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
                 )}
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

          {/* Réclamations Techniques Section */}
          {activeTab === "reclamations-techniques" && (
            <div className="space-y-6">
              <ReclamationsTechniques />
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

       {/* Transfer Material Modal */}
       <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
         <DialogContent className="glass-card border border-white/20 max-w-lg">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <RefreshCw className="w-5 h-5 text-purple-400" />
               Transférer du Matériel
             </DialogTitle>
             <DialogDescription>
               Transférez une quantité de matériel d'un dépôt à un autre
             </DialogDescription>
           </DialogHeader>
           
           {selectedMaterialForTransfer && (
             <div className="space-y-4">
               {/* Material Info */}
               <div className="p-4 bg-primary/5 rounded-lg border border-white/10">
                 <h3 className="font-semibold text-sm mb-2">Matériel à transférer</h3>
                 <p className="text-sm"><strong>Nom:</strong> {selectedMaterialForTransfer.nom_equipement}</p>
                 <p className="text-sm"><strong>Type:</strong> {selectedMaterialForTransfer.type_equipement}</p>
                 <p className="text-sm"><strong>Dépôt actuel:</strong> <Badge variant="outline">{selectedMaterialForTransfer.depot || 'AXECOM'}</Badge></p>
                 <p className="text-sm"><strong>Quantité disponible:</strong> {selectedMaterialForTransfer.quantite}</p>
               </div>

               {/* Transfer Form */}
               <div className="space-y-3">
                 <div>
                   <Label htmlFor="transferQuantity">Quantité à transférer *</Label>
                   <Input
                     id="transferQuantity"
                     type="number"
                     min="1"
                     max={selectedMaterialForTransfer.quantite}
                     value={transferQuantity}
                     onChange={(e) => setTransferQuantity(Number(e.target.value))}
                     placeholder="Entrez la quantité"
                     className="mt-1"
                   />
                   <p className="text-xs text-muted-foreground mt-1">
                     Maximum: {selectedMaterialForTransfer.quantite}
                   </p>
                 </div>

                 <div>
                   <Label htmlFor="transferDepot">Dépôt de destination *</Label>
                   <Select
                     value={transferDepotDestination}
                     onValueChange={(value) => setTransferDepotDestination(value as 'AXECOM' | 'ERT')}
                   >
                     <SelectTrigger className="mt-1">
                       <SelectValue placeholder="Sélectionner le dépôt" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem 
                         value="AXECOM" 
                         disabled={selectedMaterialForTransfer.depot === 'AXECOM'}
                       >
                         AXECOM
                       </SelectItem>
                       <SelectItem 
                         value="ERT" 
                         disabled={selectedMaterialForTransfer.depot === 'ERT'}
                       >
                         ERT
                       </SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div>
                   <Label htmlFor="transferMotif">Motif du transfert *</Label>
                   <Input
                     id="transferMotif"
                     value={transferMotif}
                     onChange={(e) => setTransferMotif(e.target.value)}
                     placeholder="Ex: Besoin pour un projet, réorganisation..."
                     className="mt-1"
                   />
                 </div>

                 <div>
                   <Label htmlFor="transferComments">Commentaires (optionnel)</Label>
                   <Textarea
                     id="transferComments"
                     value={transferComments}
                     onChange={(e) => setTransferComments(e.target.value)}
                     placeholder="Informations complémentaires..."
                     className="mt-1"
                     rows={3}
                   />
                 </div>
               </div>

               {/* Summary */}
               <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                 <p className="text-sm font-medium">
                   <RefreshCw className="w-4 h-4 inline mr-1" />
                   Résumé du transfert
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   {transferQuantity} × {selectedMaterialForTransfer.nom_equipement}
                   <br />
                   De <strong>{selectedMaterialForTransfer.depot || 'AXECOM'}</strong> vers <strong>{transferDepotDestination}</strong>
                 </p>
               </div>

               <DialogFooter>
                 <Button
                   variant="outline"
                   onClick={() => {
                     setShowTransferModal(false)
                     setSelectedMaterialForTransfer(null)
                   }}
                   disabled={transferring}
                 >
                   Annuler
                 </Button>
                 <Button
                   onClick={handleTransferMaterial}
                   disabled={transferring || !transferMotif || transferQuantity <= 0}
                   className="bg-purple-600 hover:bg-purple-700"
                 >
                   {transferring ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Transfert en cours...
                     </>
                   ) : (
                     <>
                       <RefreshCw className="w-4 h-4 mr-2" />
                       Confirmer le transfert
                     </>
                   )}
                 </Button>
               </DialogFooter>
             </div>
           )}
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
                   <Label className="text-sm font-medium">RIB Salaire</Label>
                   <p className="text-sm text-gray-600 font-mono">{selectedEmployee.rib_salaire || 'Non renseigné'}</p>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">RIB Secondaire</Label>
                   <p className="text-sm text-gray-600 font-mono">{selectedEmployee.rib2 || 'Non renseigné'}</p>
                 </div>
                 <div>
                   <Label className="text-sm font-medium">Carte Carburant Assignée</Label>
                   <p className="text-sm text-gray-600">{selectedEmployee.numero_carte_actuelle || 'Aucune carte assignée'}</p>
                   {selectedEmployee.numero_carte_actuelle && (
                     <p className="text-xs text-gray-500 mt-1">
                       📅 Assignée le {selectedEmployee.date_debut_assignation ? new Date(selectedEmployee.date_debut_assignation).toLocaleDateString('fr-FR') : 'Date inconnue'}
                     </p>
                   )}
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
              <Label className="text-sm font-medium">Type d'assignation</Label>
              <Select onValueChange={(value: 'permanent' | 'temporary') => setAssignmentType(value)} defaultValue="temporary">
                <SelectTrigger className="glass-card border border-white/20">
                  <SelectValue placeholder="Choisir le type d'assignation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">🕐 Temporaire (avec date de fin)</SelectItem>
                  <SelectItem value="permanent">♾️ Permanente (sans date de fin)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date de début *</Label>
                <Input
                  type="date"
                  value={assignmentStartDate}
                  onChange={(e) => setAssignmentStartDate(e.target.value)}
                  className="glass-card border border-white/20"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  💡 Vous pouvez sélectionner une date passée pour les assignations rétroactives
                </div>
              </div>
              
              {assignmentType === 'temporary' && (
                <div>
                  <Label className="text-sm font-medium">Date de fin *</Label>
                  <Input
                    type="date"
                    value={assignmentEndDate}
                    onChange={(e) => setAssignmentEndDate(e.target.value)}
                    className="glass-card border border-white/20"
                    min={assignmentStartDate}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    📅 Doit être postérieure à la date de début
                  </div>
                </div>
              )}
            </div>

            {assignmentStartDate && (
              <div className={`p-3 rounded-lg border ${
                new Date(assignmentStartDate).getTime() < new Date().setHours(0,0,0,0) 
                  ? 'bg-orange-50/20 border-orange-200/30' 
                  : 'bg-blue-50/20 border-blue-200/30'
              }`}>
                {new Date(assignmentStartDate).getTime() < new Date().setHours(0,0,0,0) && (
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                    <span className="font-medium">📅 Assignation historique</span>
                  </div>
                )}
                
                {assignmentType === 'temporary' && assignmentEndDate ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <span className="font-medium">📅 Période d'assignation:</span>
                      <span>{assignmentStartDate} → {assignmentEndDate}</span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Durée: {Math.ceil((new Date(assignmentEndDate).getTime() - new Date(assignmentStartDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                    </div>
                  </>
                ) : assignmentType === 'permanent' ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="font-medium">♾️ Assignation permanente:</span>
                    <span>À partir du {assignmentStartDate}</span>
                  </div>
                ) : null}
              </div>
            )}
            
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
                setAssignmentEndDate('')
                setAssignmentComments('')
                setAssignmentType('temporary')
              }}
              className="glass-card border border-white/20 hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={assignCardToEmployee}
              disabled={!selectedCardNumber || !assignmentStartDate || (assignmentType === 'temporary' && !assignmentEndDate)}
              className="gradient-primary text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {assignmentType === 'permanent' ? 'Assigner définitivement' : 'Assigner pour la période'}
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

      {/* Vehicule Modal */}
      <Dialog open={showVehiculeModal} onOpenChange={setShowVehiculeModal}>
        <VehiculeForm 
          vehicule={editingVehicule} 
          onSave={saveVehicule} 
          onCancel={() => {
            setShowVehiculeModal(false)
            setEditingVehicule(null)
          }}
        />
      </Dialog>

      {/* Assignation Vehicule Modal */}
      <Dialog open={showAssignationVehiculeModal} onOpenChange={setShowAssignationVehiculeModal}>
        <AssignationVehiculeForm 
          assignation={editingAssignationVehicule} 
          vehicules={vehicules}
          employees={employees}
          onSave={saveAssignationVehicule} 
          onCancel={() => {
            setShowAssignationVehiculeModal(false)
            setEditingAssignationVehicule(null)
          }}
        />
      </Dialog>

      {/* Entretien Vehicule Modal */}
      <Dialog open={showEntretienVehiculeModal} onOpenChange={setShowEntretienVehiculeModal}>
        <EntretienVehiculeForm 
          entretien={editingEntretienVehicule} 
          vehicules={vehicules}
          onSave={saveEntretienVehicule} 
          onCancel={() => {
            setShowEntretienVehiculeModal(false)
            setEditingEntretienVehicule(null)
          }}
        />
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

      {/* Assignment History Modal */}
      <Dialog open={showAssignmentHistoryModal} onOpenChange={setShowAssignmentHistoryModal}>
        <DialogContent className="glass-card border border-white/20 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Historique des Assignations Carburant
            </DialogTitle>
            <DialogDescription>
              Historique complet des assignations de cartes pour {selectedEmployeeHistory?.prenom} {selectedEmployeeHistory?.nom}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Chargement de l'historique...</span>
              </div>
            ) : assignmentHistory.length > 0 ? (
              <div className="space-y-4">
                {/* Résumé */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {assignmentHistory.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Assignations</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {assignmentHistory.filter(h => h.statut_reel === 'active').length}
                      </div>
                      <div className="text-sm text-gray-600">Actives</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {assignmentHistory.filter(h => h.statut_reel === 'terminee').length}
                      </div>
                      <div className="text-sm text-gray-600">Terminées</div>
                    </CardContent>
                  </Card>
                  <Card className="glass-card border border-white/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {assignmentHistory.filter(h => h.statut_reel === 'expiree').length}
                      </div>
                      <div className="text-sm text-gray-600">Expirées</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Liste des assignations avec détails */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Assignations de Cartes Carburant
                  </h4>
                  
                  <div className="space-y-3">
                    {assignmentHistory.map((assignment, index) => (
                      <div key={index} className="p-4 glass-card border border-white/20 rounded-lg">
                        {/* En-tête avec carte et statut */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-lg">
                                Carte {assignment.numero_carte}
                              </div>
                              <div className="text-sm text-gray-600">
                                Montant: {assignment.montant_carte}€
                              </div>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={assignment.statut_reel === 'active' ? 'default' : 
                                   assignment.statut_reel === 'terminee' ? 'destructive' : 'secondary'}
                            className="glass-card border border-white/20"
                          >
                            {assignment.statut_reel === 'active' ? '🟢 Active' : 
                             assignment.statut_reel === 'terminee' ? '🔴 Terminée' : 
                             assignment.statut_reel === 'expiree' ? '🟠 Expirée' : 
                             '🟡 ' + assignment.statut_reel}
                          </Badge>
                        </div>

                        {/* Période d'assignation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="p-3 bg-green-50/20 rounded-lg border border-green-200/30">
                            <div className="text-sm font-medium text-green-700 mb-1">
                              📅 Date de début
                            </div>
                            <div className="text-green-800">
                              {new Date(assignment.date_debut).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          
                          <div className="p-3 bg-red-50/20 rounded-lg border border-red-200/30">
                            <div className="text-sm font-medium text-red-700 mb-1">
                              {assignment.date_fin_reelle ? '🏁 Date de fin réelle' : 
                               assignment.date_fin_prevue ? '📅 Date de fin prévue' : '♾️ Assignation permanente'}
                            </div>
                            <div className="text-red-800">
                              {assignment.date_fin_reelle ? 
                                new Date(assignment.date_fin_reelle).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) :
                               assignment.date_fin_prevue ?
                                new Date(assignment.date_fin_prevue).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) :
                               'Aucune date de fin'
                              }
                            </div>
                          </div>
                        </div>

                        {/* Durée et informations supplémentaires */}
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            {assignment.date_fin_prevue && (
                              <div className="flex items-center gap-1">
                                <Timer className="w-4 h-4" />
                                <span>
                                  Durée: {Math.ceil((new Date(assignment.date_fin_prevue).getTime() - new Date(assignment.date_debut).getTime()) / (1000 * 60 * 60 * 24))} jours
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Créée le {new Date(assignment.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Commentaires */}
                        {assignment.commentaires && (
                          <div className="mt-3 p-2 bg-gray-50/20 rounded border border-gray-200/30">
                            <div className="text-sm font-medium text-gray-700 mb-1">💬 Commentaires</div>
                            <div className="text-sm text-gray-600">{assignment.commentaires}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8">
                <History className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">
                  Aucun historique d'assignation trouvé pour cet employé
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Les assignations apparaîtront ici une fois qu'elles auront été créées
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAssignmentHistoryModal(false)}
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
                            className="w-full h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={() => {
                                setSelectedImage(photo.url)
                                setSelectedImageIndex(index)
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Aperçu de l'image {selectedClaim?.photos?.length > 0 && `(${selectedImageIndex + 1}/${selectedClaim.photos.length})`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 pt-4 space-y-4">
            {/* Détails de la résolution */}
            {selectedClaim?.commentaires_internes && (
              <div>
                <h4 className="font-medium mb-2 text-sm text-gray-700">Détails de la résolution :</h4>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    {selectedClaim.commentaires_internes}
                  </p>
                </div>
              </div>
            )}
            
            {/* Image */}
            <div className="relative">
              <img
                src={selectedImage}
                alt="Image agrandie"
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.jpg'
                }}
              />
              
              {/* Boutons de navigation */}
              {selectedClaim?.photos?.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    onClick={() => {
                      const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : selectedClaim.photos.length - 1
                      setSelectedImageIndex(newIndex)
                      setSelectedImage(selectedClaim.photos[newIndex].url)
                    }}
                    disabled={selectedClaim.photos.length <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    onClick={() => {
                      const newIndex = selectedImageIndex < selectedClaim.photos.length - 1 ? selectedImageIndex + 1 : 0
                      setSelectedImageIndex(newIndex)
                      setSelectedImage(selectedClaim.photos[newIndex].url)
                    }}
                    disabled={selectedClaim.photos.length <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
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

// Composant de gestion des charges
function CostsManagement() {
  const [fixedCosts, setFixedCosts] = useState<any[]>([])
  const [variableCosts, setVariableCosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedAttribution, setSelectedAttribution] = useState<'TOTAL' | 'AXECOM' | 'ERT'>('TOTAL')
  const [loading, setLoading] = useState(false)
  const [showFixedModal, setShowFixedModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [editingCost, setEditingCost] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      console.error('Erreur chargement charges:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear])

  const handleSaveCost = async (costData: any, type: 'fixed' | 'variable') => {
    if (loading || isSubmitting) {
      console.log('⏳ Requête en cours, veuillez patienter...')
      return
    }
    
    setLoading(true)
    setIsSubmitting(true)
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

      console.log('🔄 Envoi de la requête:', { method, payload })

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Réponse reçue:', result)
        await loadData()
        setShowFixedModal(false)
        setShowVariableModal(false)
        setEditingCost(null)
      } else {
        const error = await response.json()
        console.error('❌ Erreur API:', error)
        alert(`Erreur: ${error.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde charge:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleDeleteCost = async (id: number, type: 'fixed' | 'variable') => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette charge ?')) return

    try {
      const response = await fetch(`/api/costs?id=${id}&type=${type}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error('Erreur suppression charge:', error)
    }
  }

  // Filtrer les charges selon l'attribution sélectionnée
  const filteredFixedCosts = fixedCosts.filter(cost => {
    if (selectedAttribution === 'TOTAL') return true
    if (selectedAttribution === 'AXECOM') return cost.attribution === 'AXECOM' || cost.attribution === 'LES_DEUX'
    if (selectedAttribution === 'ERT') return cost.attribution === 'ERT' || cost.attribution === 'LES_DEUX'
    return true
  })

  const filteredVariableCosts = variableCosts.filter(cost => {
    if (selectedAttribution === 'TOTAL') return true
    if (selectedAttribution === 'AXECOM') return cost.attribution === 'AXECOM' || cost.attribution === 'LES_DEUX'
    if (selectedAttribution === 'ERT') return cost.attribution === 'ERT' || cost.attribution === 'LES_DEUX'
    return true
  })

  const totalFixed = filteredFixedCosts.reduce((sum, cost) => {
    // Si c'est LES_DEUX, diviser par 2 pour le calcul du total de l'entreprise spécifique
    if (selectedAttribution !== 'TOTAL' && cost.attribution === 'LES_DEUX') {
      return sum + (parseFloat(cost.amount) / 2)
    }
    return sum + parseFloat(cost.amount)
  }, 0)
  const totalVariable = filteredVariableCosts.reduce((sum, cost) => {
    // Si c'est LES_DEUX, diviser par 2 pour le calcul du total de l'entreprise spécifique
    if (selectedAttribution !== 'TOTAL' && cost.attribution === 'LES_DEUX') {
      return sum + (parseFloat(cost.amount) / 2)
    }
    return sum + parseFloat(cost.amount)
  }, 0)
  const totalCosts = totalFixed + totalVariable

  // Calculer les totaux par attribution (pour la vue TOTAL) - Fixes + Variables
  const totalAxecom = 
    // Charges fixes AXECOM
    fixedCosts
      .filter(cost => cost.attribution === 'AXECOM')
      .reduce((sum, cost) => sum + parseFloat(cost.amount), 0) +
    fixedCosts
      .filter(cost => cost.attribution === 'LES_DEUX')
      .reduce((sum, cost) => sum + parseFloat(cost.amount) / 2, 0) +
    // Charges variables AXECOM
    variableCosts
      .filter(cost => cost.attribution === 'AXECOM')
      .reduce((sum, cost) => sum + parseFloat(cost.amount), 0) +
    variableCosts
      .filter(cost => cost.attribution === 'LES_DEUX')
      .reduce((sum, cost) => sum + parseFloat(cost.amount) / 2, 0)
  
  const totalErt = 
    // Charges fixes ERT
    fixedCosts
      .filter(cost => cost.attribution === 'ERT')
      .reduce((sum, cost) => sum + parseFloat(cost.amount), 0) +
    fixedCosts
      .filter(cost => cost.attribution === 'LES_DEUX')
      .reduce((sum, cost) => sum + parseFloat(cost.amount) / 2, 0) +
    // Charges variables ERT
    variableCosts
      .filter(cost => cost.attribution === 'ERT')
      .reduce((sum, cost) => sum + parseFloat(cost.amount), 0) +
    variableCosts
      .filter(cost => cost.attribution === 'LES_DEUX')
      .reduce((sum, cost) => sum + parseFloat(cost.amount) / 2, 0)
  
  const totalLesDeux = 
    // Charges fixes LES_DEUX
    fixedCosts
      .filter(cost => cost.attribution === 'LES_DEUX')
      .reduce((sum, cost) => sum + parseFloat(cost.amount), 0) +
    // Charges variables LES_DEUX
    variableCosts
      .filter(cost => cost.attribution === 'LES_DEUX')
      .reduce((sum, cost) => sum + parseFloat(cost.amount), 0)

  return (
    <div className="space-y-6">
      {/* Sélecteurs de mois/année/attribution */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-2 items-center">
          <Label className="text-sm font-medium">Mois:</Label>
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-36">
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
        </div>
          
        <div className="flex gap-2 items-center">
          <Label className="text-sm font-medium">Année:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-28">
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

        <div className="flex gap-2 items-center">
          <Label className="text-sm font-medium">Vue:</Label>
          <Select value={selectedAttribution} onValueChange={(value: any) => setSelectedAttribution(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOTAL">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                  Total (Tous)
                </span>
              </SelectItem>
              <SelectItem value="AXECOM">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  AXECOM
                </span>
              </SelectItem>
              <SelectItem value="ERT">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  ERT
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Résumé des charges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={selectedAttribution === 'TOTAL' ? '' : selectedAttribution === 'AXECOM' ? 'border-blue-300 bg-blue-50/30' : 'border-green-300 bg-green-50/30'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Charges Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalFixed.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">Récurrents chaque mois</p>
          </CardContent>
        </Card>

        <Card className={selectedAttribution === 'TOTAL' ? '' : selectedAttribution === 'AXECOM' ? 'border-blue-300 bg-blue-50/30' : 'border-green-300 bg-green-50/30'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Charges Variables
              {selectedAttribution !== 'TOTAL' && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({selectedAttribution})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalVariable.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">
              {selectedAttribution === 'TOTAL' ? 'Spécifiques à ce mois' : `Charges ${selectedAttribution}`}
            </p>
          </CardContent>
        </Card>

        <Card className={selectedAttribution === 'TOTAL' ? '' : selectedAttribution === 'AXECOM' ? 'border-blue-300 bg-blue-50/30' : 'border-green-300 bg-green-50/30'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total
              {selectedAttribution !== 'TOTAL' && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({selectedAttribution})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalCosts.toLocaleString('fr-FR')} €</div>
            <p className="text-xs text-muted-foreground">
              {selectedAttribution === 'TOTAL' ? 'Charges totales' : `Total ${selectedAttribution}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Résumé par attribution - Affiché uniquement en vue TOTAL */}
      {selectedAttribution === 'TOTAL' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                AXECOM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalAxecom.toLocaleString('fr-FR')} €</div>
              <p className="text-xs text-muted-foreground">Charges AXECOM</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                ERT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalErt.toLocaleString('fr-FR')} €</div>
              <p className="text-xs text-muted-foreground">Charges ERT</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                Les Deux (Divisé)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalLesDeux.toLocaleString('fr-FR')} €</div>
              <p className="text-xs text-muted-foreground">{(totalLesDeux / 2).toLocaleString('fr-FR')}€ chacun</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charges fixes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Charges Fixes
                {selectedAttribution !== 'TOTAL' && (
                  <span className={`text-sm px-2 py-1 rounded-full font-semibold ${
                    selectedAttribution === 'AXECOM' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedAttribution}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {selectedAttribution === 'TOTAL' 
                  ? 'Charges récurrentes chaque mois'
                  : `Charges fixes ${selectedAttribution} récurrentes`
                }
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowFixedModal(true)}
              disabled={loading || isSubmitting}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading || isSubmitting ? 'Chargement...' : 'Ajouter'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredFixedCosts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucune charge fixe pour {selectedAttribution === 'TOTAL' ? 'afficher' : selectedAttribution}
              </div>
            ) : (
              filteredFixedCosts.map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{cost.name}</div>
                      {cost.attribution && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          cost.attribution === 'AXECOM' ? 'bg-blue-100 text-blue-700' :
                          cost.attribution === 'ERT' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {cost.attribution === 'LES_DEUX' ? 'AXECOM + ERT' : cost.attribution}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{cost.description}</div>
                    <div className="text-sm text-blue-600">{cost.category_name || cost.category}</div>
                    {selectedAttribution !== 'TOTAL' && cost.attribution === 'LES_DEUX' && (
                      <div className="text-xs text-purple-600 mt-1">
                        Part {selectedAttribution}: {(parseFloat(cost.amount) / 2).toLocaleString('fr-FR')} €
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold">
                      {selectedAttribution !== 'TOTAL' && cost.attribution === 'LES_DEUX' 
                        ? `${(parseFloat(cost.amount) / 2).toLocaleString('fr-FR')} €`
                        : `${parseFloat(cost.amount).toLocaleString('fr-FR')} €`
                      }
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || isSubmitting}
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
                      disabled={loading || isSubmitting}
                      onClick={() => handleDeleteCost(cost.id, 'fixed')}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charges variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Charges Variables
                {selectedAttribution !== 'TOTAL' && (
                  <span className={`text-sm px-2 py-1 rounded-full font-semibold ${
                    selectedAttribution === 'AXECOM' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {selectedAttribution}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {selectedAttribution === 'TOTAL' 
                  ? `Charges spécifiques à ${new Date(0, selectedMonth - 1).toLocaleString('fr-FR', { month: 'long' })} ${selectedYear}`
                  : `Charges ${selectedAttribution} pour ${new Date(0, selectedMonth - 1).toLocaleString('fr-FR', { month: 'long' })} ${selectedYear}`
                }
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowVariableModal(true)}
              disabled={loading || isSubmitting}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {loading || isSubmitting ? 'Chargement...' : 'Ajouter'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredVariableCosts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Aucune charge variable pour {selectedAttribution === 'TOTAL' ? 'ce mois' : selectedAttribution}
              </div>
            ) : (
              filteredVariableCosts.map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{cost.name}</div>
                      {cost.attribution && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          cost.attribution === 'AXECOM' ? 'bg-blue-100 text-blue-700' :
                          cost.attribution === 'ERT' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {cost.attribution === 'LES_DEUX' ? 'AXECOM + ERT' : cost.attribution}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{cost.description}</div>
                    <div className="text-sm text-orange-600">{cost.category_name}</div>
                    {selectedAttribution !== 'TOTAL' && cost.attribution === 'LES_DEUX' && (
                      <div className="text-xs text-purple-600 mt-1">
                        Part {selectedAttribution}: {(parseFloat(cost.amount) / 2).toLocaleString('fr-FR')} €
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold">
                      {selectedAttribution !== 'TOTAL' && cost.attribution === 'LES_DEUX' 
                        ? `${(parseFloat(cost.amount) / 2).toLocaleString('fr-FR')} €`
                        : `${parseFloat(cost.amount).toLocaleString('fr-FR')} €`
                      }
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || isSubmitting}
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
                      disabled={loading || isSubmitting}
                      onClick={() => handleDeleteCost(cost.id, 'variable')}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals pour ajouter/modifier les charges */}
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
    category: '',
    attribution: 'LES_DEUX'
  })

  useEffect(() => {
    if (editingCost) {
      setFormData({
        name: editingCost.name || '',
        description: editingCost.description || '',
        amount: editingCost.amount?.toString() || '',
        category: editingCost.category || '',
        attribution: editingCost.attribution || 'LES_DEUX'
      })
    } else {
      setFormData({
        name: '',
        description: '',
        amount: '',
        category: categories[0]?.name || '',
        attribution: 'LES_DEUX'
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
            {editingCost ? 'Modifier' : 'Ajouter'} une charge {type === 'fixed' ? 'fixe' : 'variable'}
          </DialogTitle>
          <DialogDescription>
            {type === 'fixed' 
              ? 'Les charges fixes sont récurrentes chaque mois'
              : 'Les charges variables sont spécifiques au mois sélectionné'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la charge</Label>
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

          <div>
            <Label htmlFor="attribution">Attribution</Label>
            <Select
              value={formData.attribution}
              onValueChange={(value) => setFormData({ ...formData, attribution: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AXECOM">AXECOM uniquement</SelectItem>
                <SelectItem value="ERT">ERT uniquement</SelectItem>
                <SelectItem value="LES_DEUX">Les deux (divisé)</SelectItem>
              </SelectContent>
            </Select>
            {formData.attribution === 'LES_DEUX' && formData.amount && (
              <p className="text-xs text-muted-foreground mt-1">
                Le montant sera divisé : {(parseFloat(formData.amount) / 2).toFixed(2)}€ pour AXECOM et {(parseFloat(formData.amount) / 2).toFixed(2)}€ pour ERT
              </p>
            )}
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

// Composant de tableau de bord des statistiques
function StatisticsDashboard() {
  const [mounted, setMounted] = useState(false)
  const [statistics, setStatistics] = useState<any>({
    interventions: { byStatus: [], byMonth: [], byEmployee: [], total: 0 },
    penalties: { byStatus: [], byEmployee: [] },
    claims: { byStatus: [], byType: [], byPriority: [], byMonth: [] },
    interventionTypes: []
  })
  const [loading, setLoading] = useState(false)
  
  // Fonction pour obtenir les dates du mois précédent
  const getStatisticsDefaultDates = () => {
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
  
  const statisticsDefaultDates = getStatisticsDefaultDates()
  const [startDate, setStartDate] = useState(statisticsDefaultDates.start)
  const [endDate, setEndDate] = useState(statisticsDefaultDates.end)
  const [selectedType, setSelectedType] = useState('all')

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      console.log('🔄 Chargement des statistiques pour la période:', { startDate, endDate, selectedType })
      const response = await fetch(`/api/statistics?startDate=${startDate}&endDate=${endDate}&type=${selectedType}`)
      const data = await response.json()
      console.log('📊 Données reçues:', data)
      if (data.success) {
        setStatistics(data.statistics)
        console.log('✅ Statistiques mises à jour:', data.statistics)
        if (data.statistics.penalties) {
          console.log('📊 Pénalités byStatus:', data.statistics.penalties.byStatus)
          console.log('📊 Pénalités byEmployee:', data.statistics.penalties.byEmployee)
        }
      } else {
        console.error('❌ Erreur API:', data.error)
      }
    } catch (error) {
      console.error('❌ Erreur chargement statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [startDate, endDate, selectedType])

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280']

  // Prevent hydration mismatch - render only after mount
  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Chargement des statistiques...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contrôles de période */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres de Période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type">Type de statistiques</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les statistiques</SelectItem>
                  <SelectItem value="interventions">Interventions</SelectItem>
                  <SelectItem value="fuel">Carburant</SelectItem>
                  <SelectItem value="penalties">Pénalités</SelectItem>
                  <SelectItem value="claims">Réclamations</SelectItem>
                  <SelectItem value="revenue">Revenus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadStatistics} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques des interventions */}
      {statistics.interventions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>Chargement des données...</p>
                  </div>
                </div>
              ) : statistics.interventions.byStatus.length > 0 ? (
                <>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statistics.interventions.byStatus}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="statut"
                        >
                          {statistics.interventions.byStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-2xl font-bold">{statistics.interventions.total}</p>
                    <p className="text-sm text-muted-foreground">Total des interventions</p>
                  </div>
                </>
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Aucune donnée pour cette période</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition des Interventions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.interventions.byStatus.map((item: any, index: number) => (
                  <div key={item.statut} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.statut}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.count}</div>
                      <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques du carburant */}
      {statistics.fuel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Consommation de Carburant par Mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statistics.fuel.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short' })}
                    />
                    <YAxis />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="total_liters" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Employés - Consommation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.fuel.byEmployee} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="nom" type="category" width={100} />
                    <ChartTooltip />
                    <Bar dataKey="total_cost" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques des pénalités */}
      {statistics.penalties && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pénalités par Type (J+1 / J+N)</CardTitle>
              <CardDescription>
                Distribution des pénalités selon le délai de clôture
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                console.log('🎨 Rendu graphique - byStatus:', statistics.penalties.byStatus);
                console.log('🎨 byStatus length:', statistics.penalties.byStatus?.length);
                return statistics.penalties.byStatus && statistics.penalties.byStatus.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statistics.penalties.byStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ statut, percentage }) => `${statut}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="statut"
                        >
                          {statistics.penalties.byStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune pénalité trouvée pour cette période</p>
                      <p className="text-sm mt-2">Période: {startDate} au {endDate}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Employés - Pénalités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.penalties.byEmployee.slice(0, 10).map((employee: any, index: number) => (
                  <div key={employee.nom} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{employee.prenom} {employee.nom}</div>
                        <div className="text-sm text-muted-foreground">{employee.penalty_count} pénalité(s)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{parseFloat(employee.total_amount).toLocaleString('fr-FR')} €</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques des réclamations */}
      {statistics.claims && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Réclamations par Statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistics.claims.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statistics.claims.byStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réclamations par Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.claims.byType.map((item: any, index: number) => (
                  <div key={item.type_reclamation} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.type_reclamation}</span>
                    </div>
                    <div className="text-sm font-medium">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Réclamations par Priorité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statistics.claims.byPriority.map((item: any, index: number) => (
                  <div key={item.priorite} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.priorite}</span>
                    </div>
                    <div className="text-sm font-medium">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques des revenus */}
      {statistics.revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Interventions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statistics.revenue.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short' })}
                    />
                    <YAxis />
                    <ChartTooltip />
                    <Line type="monotone" dataKey="intervention_count" stroke="#3B82F6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="completed_count" stroke="#10B981" strokeWidth={2} name="Terminées" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interventions par Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.revenue.byType.map((item: any, index: number) => (
                  <div key={item.type_intervention} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.type_intervention}</span>
                      <span className="text-sm text-muted-foreground">{item.completion_rate}% terminées</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Total: {item.count}</span>
                          <span>Terminées: {item.completed}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${item.completion_rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message si aucune donnée */}
      {Object.keys(statistics).length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
            <p className="text-muted-foreground">
              Aucune donnée trouvée pour la période sélectionnée. Essayez de modifier les filtres.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
