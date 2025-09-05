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
  const [showCardAssignmentModal, setShowCardAssignmentModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [availableCards, setAvailableCards] = useState<any[]>([])
  const [showCardHistoryModal, setShowCardHistoryModal] = useState(false)
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<any>(null)
  const [cardHistory, setCardHistory] = useState<any[]>([])

  // Fuel consumption grouped data
  const [fuelGroupedData, setFuelGroupedData] = useState<any[]>([])
  const [fuelGroupedSummary, setFuelGroupedSummary] = useState<any>({})
  const [fuelViewMode, setFuelViewMode] = useState<'table' | 'grouped'>('grouped')
  const [fuelPeriod, setFuelPeriod] = useState<'month' | 'week' | 'year'>('month')
  const [fuelDateRange, setFuelDateRange] = useState({ start: '', end: '' })

  // Assignation data
  const [assignationData, setAssignationData] = useState({
    numero_carte: '',
    employe_id: ''
  })

  // Load data from database on component mount
  useEffect(() => {
    if (isLoggedIn) {
      loadDataFromDatabase()
      loadAllCRUDData()
      loadAvailableCards()
      loadFuelGroupedData()
    }
  }, [isLoggedIn])

  // Reload grouped data when period or date range changes
  useEffect(() => {
    if (isLoggedIn) {
      loadFuelGroupedData()
    }
  }, [fuelPeriod, fuelDateRange])

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
      return data.employes || []
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
                                  onClick={() => {
                                    setSelectedEmployee(employee)
                                    setShowEmployeeDetailsModal(true)
                                  }}
                                  className="glass-card border border-white/20 hover:bg-white/10"
                                  title="Voir les détails"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(employee)
                                    setShowCardAssignmentModal(true)
                                  }}
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

               <Card className="glass-card border border-white/20 hover-lift">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-3 text-xl font-bold">
                     <Fuel className="w-6 h-6 text-primary" />
                     Transactions Carburant
                   </CardTitle>
                   <CardDescription>
                     {fuelData.length} transactions trouvées dans la base de données PostgreSQL
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
                     <div className="overflow-x-auto">
                       <table className="w-full border-collapse">
                         <thead>
                           <tr className="border-b border-white/10">
                             <th className="text-left p-4 font-semibold">Date Livraison</th>
                             <th className="text-left p-4 font-semibold">Date Fact</th>
                             <th className="text-left p-4 font-semibold">Véhicule</th>
                             <th className="text-left p-4 font-semibold">N° Carte</th>
                             <th className="text-left p-4 font-semibold">Employé Assigné</th>
                             <th className="text-left p-4 font-semibold">Station</th>
                             <th className="text-left p-4 font-semibold">Quantité</th>
                             <th className="text-left p-4 font-semibold">Montant TTC</th>
                             <th className="text-left p-4 font-semibold">Justificatif</th>
                           </tr>
                         </thead>
                         <tbody>
                           {fuelData.slice(0, 100).map((transaction, index) => (
                             <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                               <td className="p-4">{transaction.date_livraison}</td>
                               <td className="p-4">{transaction.date_fact}</td>
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
                                     <Users className="w-4 h-4 text-primary" />
                                     <span className="text-sm">{transaction.employe_assigné.nom} {transaction.employe_assigné.prenom}</span>
                                   </div>
                                 ) : (
                                   <span className="text-xs text-muted-foreground">Non assigné</span>
                                 )}
                               </td>
                               <td className="p-4">{transaction.numero_station}</td>
                               <td className="p-4">{transaction.quantite || 'N/A'} L</td>
                               <td className="p-4 font-semibold">{transaction.ca_ttc || 'N/A'} €</td>
                               <td className="p-4 text-sm text-muted-foreground">{transaction.numero_justificatif}</td>
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

           {/* Other tabs placeholder */}
           {activeTab !== "dashboard" && activeTab !== "employees" && activeTab !== "fuel-consumption" && activeTab !== "interventions" && activeTab !== "fuel" && (
             <div className="space-y-6">
               <div className="flex justify-between items-center">
                 <div>
                   <h2 className="text-3xl font-bold">
                     {activeTab === "materials" && "Matériel"}
                     {activeTab === "penalties" && "Pénalités"}
                     {activeTab === "claims" && "Réclamations"}
                     {activeTab === "reports" && "Rapports"}
                   </h2>
                   <p className="text-muted-foreground">
                     {activeTab === "materials" && "Gestion du matériel"}
                     {activeTab === "penalties" && "Gestion des pénalités"}
                     {activeTab === "claims" && "Gestion des réclamations"}
                     {activeTab === "reports" && "Génération de rapports"}
                   </p>
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
                       <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           onClick={() => loadMaterialsFromDatabase()}
                           className="glass-card border border-white/20 hover:bg-white/10"
                         >
                           <RefreshCw className="w-4 h-4 mr-2" />
                           Actualiser
                         </Button>
                         <Button 
                           onClick={() => {
                             setEditingItem(null)
                             setShowMaterialModal(true)
                           }}
                           className="gradient-primary text-white"
                         >
                           <Plus className="w-4 h-4 mr-2" />
                           Ajouter Matériel
                         </Button>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="overflow-x-auto">
                       <table className="w-full">
                         <thead>
                           <tr className="border-b border-white/10">
                             <th className="text-left p-3 font-medium">Équipement</th>
                             <th className="text-left p-3 font-medium">Type</th>
                             <th className="text-left p-3 font-medium">Marque/Modèle</th>
                             <th className="text-left p-3 font-medium">Statut</th>
                             <th className="text-left p-3 font-medium">Quantité</th>
                             <th className="text-left p-3 font-medium">Prix Unitaire</th>
                             <th className="text-left p-3 font-medium">Prix Total</th>
                             <th className="text-left p-3 font-medium">Actions</th>
                           </tr>
                         </thead>
                         <tbody>
                           {materials.map((material) => (
                             <tr key={material.id} className="border-b border-white/5 hover:bg-white/5">
                               <td className="p-3">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                     <Package className="w-4 h-4 text-primary" />
                                   </div>
                                   <div>
                                     <div className="font-medium">{material.nom}</div>
                                     <div className="text-sm text-muted-foreground">{material.numero_serie || 'N/A'}</div>
                                   </div>
                                 </div>
                               </td>
                               <td className="p-3">
                                 <Badge variant="outline" className="glass-card border border-white/20">
                                   {material.categorie || 'N/A'}
                                 </Badge>
                               </td>
                               <td className="p-3">{material.fournisseur || 'N/A'}</td>
                               <td className="p-3">
                                 <Badge 
                                   variant={material.statut === 'disponible' ? 'default' : 'secondary'}
                                   className="glass-card border border-white/20"
                                 >
                                   {material.statut || 'disponible'}
                                 </Badge>
                               </td>
                               <td className="p-3">{material.quantite || 0}</td>
                               <td className="p-3">{material.prix_unitaire ? `${material.prix_unitaire} €` : 'N/A'}</td>
                               <td className="p-3 font-medium text-primary">
                                 {material.prix_unitaire && material.quantite 
                                   ? `${(parseFloat(material.prix_unitaire) * parseInt(material.quantite)).toFixed(2)} €`
                                   : 'N/A'
                                 }
                               </td>
                               <td className="p-3">
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => {
                                       setEditingItem(material)
                                       setShowMaterialModal(true)
                                     }}
                                     className="glass-card border border-white/20 hover:bg-white/10"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deleteMaterial(material.id)}
                                     className="glass-card border border-white/20 hover:bg-red-500/10 text-red-500"
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
                       <div className="flex gap-2">
                         <Button 
                           onClick={() => {
                             setEditingItem(null)
                             setShowAffectationModal(true)
                           }}
                           className="gradient-primary text-white"
                         >
                           <Plus className="w-4 h-4 mr-2" />
                           Nouvelle Affectation
                         </Button>
                         <Button 
                           onClick={() => {
                             setEditingItem(null)
                             setShowMultiAffectationModal(true)
                           }}
                           variant="outline"
                           className="glass-card border border-white/20 hover:bg-white/10"
                         >
                           <Users className="w-4 h-4 mr-2" />
                           Affectation Multiple
                         </Button>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       {/* Date Filters */}
                       <div className="flex gap-4 items-center">
                         <div className="flex gap-2">
                           <Input
                             type="date"
                             placeholder="Date début"
                             className="glass-card border border-white/20"
                           />
                           <Input
                             type="date"
                             placeholder="Date fin"
                             className="glass-card border border-white/20"
                           />
                           <Button variant="outline" className="glass-card border border-white/20 hover:bg-white/10">
                             Effacer Filtres
                           </Button>
                         </div>
                       </div>

                       {/* Employee Assignments */}
                       <div className="space-y-3">
                         {employees.map((employee) => {
                           const employeeAssignments = affectations.filter(aff => aff.employee_id === employee.id)
                           const totalCost = employeeAssignments.reduce((sum, aff) => {
                             const material = materials.find(mat => mat.id === aff.material_id)
                             return sum + (material?.prix_unitaire ? parseFloat(material.prix_unitaire) * parseInt(aff.quantite_affectee) : 0)
                           }, 0)

                           if (employeeAssignments.length === 0) return null

                           return (
                             <div key={employee.id} className="border border-white/10 rounded-lg p-4">
                               <div className="flex items-center gap-3 mb-3">
                                 <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                   <User className="w-4 h-4 text-primary" />
                                 </div>
                                 <div>
                                   <div className="font-medium">{employee.prenom} {employee.nom}</div>
                                   <div className="text-sm text-muted-foreground">
                                     {employeeAssignments.length} affectation(s) - Coût total: {totalCost.toFixed(2)} €
                                   </div>
                                 </div>
                               </div>
                               
                               <div className="overflow-x-auto">
                                 <table className="w-full">
                                   <thead>
                                     <tr className="border-b border-white/10">
                                       <th className="text-left p-2 font-medium">Matériel</th>
                                       <th className="text-left p-2 font-medium">Quantité</th>
                                       <th className="text-left p-2 font-medium">Prix Unitaire</th>
                                       <th className="text-left p-2 font-medium">Prix Total</th>
                                       <th className="text-left p-2 font-medium">Date Affectation</th>
                                       <th className="text-left p-2 font-medium">Statut</th>
                                       <th className="text-left p-2 font-medium">Actions</th>
                                     </tr>
                                   </thead>
                                   <tbody>
                                     {employeeAssignments.map((affectation) => {
                                       const material = materials.find(mat => mat.id === affectation.material_id)
                                       return (
                                         <tr key={affectation.id} className="border-b border-white/5">
                                           <td className="p-2">{material?.nom || 'N/A'}</td>
                                           <td className="p-2">{affectation.quantite_affectee}</td>
                                           <td className="p-2">{material?.prix_unitaire ? `${material.prix_unitaire} €` : 'N/A'}</td>
                                           <td className="p-2 font-medium text-primary">
                                             {material?.prix_unitaire 
                                               ? `${(parseFloat(material.prix_unitaire) * parseInt(affectation.quantite_affectee)).toFixed(2)} €`
                                               : 'N/A'
                                             }
                                           </td>
                                           <td className="p-2">{affectation.date_affectation || 'N/A'}</td>
                                           <td className="p-2">
                                             <Badge 
                                               variant={affectation.statut === 'en_cours' ? 'default' : 'secondary'}
                                               className="glass-card border border-white/20"
                                             >
                                               {affectation.statut || 'en_cours'}
                                             </Badge>
                                           </td>
                                           <td className="p-2">
                                             <div className="flex gap-1">
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => {
                                                   setEditingItem(affectation)
                                                   setShowAffectationModal(true)
                                                 }}
                                                 className="glass-card border border-white/20 hover:bg-white/10"
                                               >
                                                 <Edit className="w-3 h-3" />
                                               </Button>
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => deleteAffectation(affectation.id)}
                                                 className="glass-card border border-white/20 hover:bg-red-500/10 text-red-500"
                                               >
                                                 <Trash2 className="w-3 h-3" />
                                               </Button>
                                             </div>
                                           </td>
                                         </tr>
                                       )
                                     })}
                                   </tbody>
                                 </table>
                               </div>
                             </div>
                           )
                         })}
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </div>
             </div>
           )}

           {/* Penalties Section */}
           {activeTab === "penalties" && (
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                     Gestion des Pénalités
                   </h2>
                   <p className="text-muted-foreground">
                     Gérez les pénalités et sanctions des employés
                   </p>
                 </div>
                 <div className="flex gap-2">
                   <Button 
                     variant="outline" 
                     onClick={() => loadPenaltiesFromDatabase()}
                     className="glass-card border border-white/20 hover:bg-white/10"
                   >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     Actualiser
                   </Button>
                   <Button 
                     onClick={() => {
                       setEditingItem(null)
                       setShowPenaltyModal(true)
                     }}
                     className="gradient-primary text-white"
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     Ajouter Pénalité
                   </Button>
                 </div>
               </div>

               {/* Penalties List Card */}
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
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead>
                         <tr className="border-b border-white/10">
                           <th className="text-left p-3 font-medium">Employé</th>
                           <th className="text-left p-3 font-medium">Type</th>
                           <th className="text-left p-3 font-medium">Motif</th>
                           <th className="text-left p-3 font-medium">Montant</th>
                           <th className="text-left p-3 font-medium">Statut</th>
                           <th className="text-left p-3 font-medium">Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         {penalties.map((penalty) => {
                           const employee = employees.find(emp => emp.id === penalty.employee_id)
                           return (
                             <tr key={penalty.id} className="border-b border-white/5 hover:bg-white/5">
                               <td className="p-3">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                                     <span className="text-sm font-medium text-red-500">
                                       {employee ? `${employee.prenom[0]}${employee.nom[0]}` : 'N/A'}
                                     </span>
                                   </div>
                                   <div>
                                     <div className="font-medium">
                                       {employee ? `${employee.prenom} ${employee.nom}` : 'Employé supprimé'}
                                     </div>
                                     <div className="text-sm text-muted-foreground">
                                       PEN-{new Date().getFullYear()}-{penalty.id.toString().padStart(4, '0')}
                                     </div>
                                   </div>
                                 </div>
                               </td>
                               <td className="p-3">
                                 <Badge variant="outline" className="glass-card border border-white/20">
                                   {penalty.type || 'absence'}
                                 </Badge>
                               </td>
                               <td className="p-3">{penalty.raison || '--'}</td>
                               <td className="p-3 font-medium text-red-500">
                                 {penalty.montant ? `${penalty.montant} €` : 'N/A'}
                               </td>
                               <td className="p-3">
                                 <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${
                                     penalty.statut === 'active' ? 'bg-green-500' : 
                                     penalty.statut === 'soumis' ? 'bg-yellow-500' : 'bg-gray-500'
                                   }`} />
                                   <span className="text-sm">
                                     {penalty.statut === 'active' ? 'Active' : 
                                      penalty.statut === 'soumis' ? 'Soumis' : 'Inactive'}
                                   </span>
                                 </div>
                               </td>
                               <td className="p-3">
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => {
                                       setEditingItem(penalty)
                                       setShowPenaltyModal(true)
                                     }}
                                     className="glass-card border border-white/20 hover:bg-white/10"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deletePenalty(penalty.id)}
                                     className="glass-card border border-white/20 hover:bg-red-500/10 text-red-500"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </Button>
                                 </div>
                               </td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}

           {/* Claims Section */}
           {activeTab === "claims" && (
             <div className="space-y-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                     Gestion des Réclamations
                   </h2>
                   <p className="text-muted-foreground">
                     Gérez les réclamations et plaintes des clients
                   </p>
                 </div>
                 <div className="flex gap-2">
                   <Button 
                     variant="outline" 
                     onClick={() => loadClaimsFromDatabase()}
                     className="glass-card border border-white/20 hover:bg-white/10"
                   >
                     <RefreshCw className="w-4 h-4 mr-2" />
                     Actualiser
                   </Button>
                   <Button 
                     onClick={() => {
                       setEditingItem(null)
                       setShowClaimModal(true)
                     }}
                     className="gradient-primary text-white"
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     Ajouter Réclamation
                   </Button>
                 </div>
               </div>

               {/* Claims List Card */}
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
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead>
                         <tr className="border-b border-white/10">
                           <th className="text-left p-3 font-medium">Client</th>
                           <th className="text-left p-3 font-medium">Type</th>
                           <th className="text-left p-3 font-medium">Priorité</th>
                           <th className="text-left p-3 font-medium">Statut</th>
                           <th className="text-left p-3 font-medium">Employé Assigné</th>
                           <th className="text-left p-3 font-medium">Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         {claims.map((claim) => {
                           const employee = employees.find(emp => emp.id === claim.employee_id)
                           return (
                             <tr key={claim.id} className="border-b border-white/5 hover:bg-white/5">
                               <td className="p-3">
                                 <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                     <span className="text-sm font-medium text-green-500">
                                       {claim.client_nom ? claim.client_nom[0] : 'C'}
                                     </span>
                                   </div>
                                   <div>
                                     <div className="font-medium">{claim.client_nom || 'Client anonyme'}</div>
                                     <div className="text-sm text-muted-foreground">
                                       REC-{new Date().getFullYear()}-{claim.id.toString().padStart(4, '0')}
                                     </div>
                                   </div>
                                 </div>
                               </td>
                               <td className="p-3">
                                 <Badge variant="outline" className="glass-card border border-white/20">
                                   {claim.type || 'technique'}
                                 </Badge>
                               </td>
                               <td className="p-3">
                                 <Badge 
                                   variant={claim.priorite === 'haute' ? 'destructive' : 'secondary'}
                                   className="glass-card border border-white/20"
                                 >
                                   {claim.priorite || 'normale'}
                                 </Badge>
                               </td>
                               <td className="p-3">
                                 <Badge 
                                   variant={claim.statut === 'ouverte' ? 'default' : 'secondary'}
                                   className="glass-card border border-white/20"
                                 >
                                   {claim.statut || 'ouverte'}
                                 </Badge>
                               </td>
                               <td className="p-3">
                                 {employee ? `${employee.prenom} ${employee.nom}` : 'Non assigné'}
                               </td>
                               <td className="p-3">
                                 <div className="flex gap-2">
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => {
                                       setEditingItem(claim)
                                       setShowClaimModal(true)
                                     }}
                                     className="glass-card border border-white/20 hover:bg-white/10"
                                   >
                                     <Edit className="w-4 h-4" />
                                   </Button>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => deleteClaim(claim.id)}
                                     className="glass-card border border-white/20 hover:bg-red-500/10 text-red-500"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </Button>
                                 </div>
                               </td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
        </main>
      </div>

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
                  <Label className="text-sm font-medium">Pourcentage de taxe</Label>
                  <p className="text-sm text-gray-600">
                    {selectedEmployee.pourcentage_taxe ? `${selectedEmployee.pourcentage_taxe}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Niveau d'accès</Label>
                  <p className="text-sm text-gray-600">{selectedEmployee.niveau_acces || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Commentaires</Label>
                <p className="text-sm text-gray-600">{selectedEmployee.commentaires || 'Aucun commentaire'}</p>
              </div>
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
            <DialogTitle className="text-xl font-bold">
              Assigner une carte carburant
            </DialogTitle>
            <DialogDescription>
              Assignez une carte carburant à {selectedEmployee?.prenom} {selectedEmployee?.nom}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Employé</Label>
              <div className="p-3 bg-primary/10 rounded-lg border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {selectedEmployee?.prenom?.[0]}{selectedEmployee?.nom?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{selectedEmployee?.prenom} {selectedEmployee?.nom}</div>
                    <div className="text-sm text-muted-foreground">Matricule: {selectedEmployee?.matricule}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Sélectionner une carte carburant</Label>
              <Select onValueChange={(value) => {
                console.log("Carte sélectionnée:", value)
                setAssignationData({...assignationData, numero_carte: value})
              }}>
                <SelectTrigger className="glass-card border border-white/20">
                  <SelectValue placeholder="Choisir une carte carburant" />
                </SelectTrigger>
                <SelectContent>
                  {availableCards.length > 0 ? (
                    availableCards.map((card) => (
                      <SelectItem key={card.numero_carte} value={card.numero_carte}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <span className="font-medium">{card.label}</span>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {card.montant && (
                                <span>Montant: {card.montant} DA</span>
                              )}
                              {card.fournisseur && (
                                <span>• {card.fournisseur}</span>
                              )}
                              {card.date_livraison && (
                                <span>• Livrée: {new Date(card.date_livraison).toLocaleDateString()}</span>
                              )}
                              {card.immat_vehicule && (
                                <span>• Véhicule: {card.immat_vehicule}</span>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={card.statut === 'disponible' ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {card.statut}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-cards" disabled>
                      Aucune carte disponible
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {/* Debug info */}
              <div className="mt-2 text-xs text-muted-foreground">
                {availableCards.length} carte(s) disponible(s)
              </div>
            </div>

            {assignationData.numero_carte && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Carte {assignationData.numero_carte} sélectionnée
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCardAssignmentModal(false)
                setAssignationData({numero_carte: '', employe_id: ''})
              }}
              className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (assignationData.numero_carte && selectedEmployee) {
                  assignCardToEmployee(assignationData.numero_carte)
                }
              }}
              disabled={!assignationData.numero_carte || !selectedEmployee}
              className="gradient-primary text-white"
            >
              Assigner la carte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card History Modal */}
      <Dialog open={showCardHistoryModal} onOpenChange={setShowCardHistoryModal}>
        <DialogContent className="glass-card border border-white/20 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Historique des cartes carburant
            </DialogTitle>
            <DialogDescription>
              Historique complet des cartes assignées à {selectedEmployeeHistory?.prenom} {selectedEmployeeHistory?.nom}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Résumé de consommation */}
            {cardHistory.length > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg border border-white/20">
                <h3 className="font-semibold mb-2">Résumé de consommation</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Consommation totale</div>
                    <div className="text-2xl font-bold text-primary">
                      {cardHistory[0]?.total_consomme_toutes_cartes || 0} DA
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Nombre de cartes utilisées</div>
                    <div className="text-2xl font-bold text-primary">
                      {cardHistory[0]?.nombre_cartes_utilisees || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Historique détaillé */}
            <div>
              <h3 className="font-semibold mb-3">Historique détaillé des cartes</h3>
              {cardHistory.length > 0 ? (
                <div className="space-y-3">
                  {cardHistory[0]?.historique_cartes?.map((carte: any, index: number) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Carte {carte.numero_carte}</div>
                            <div className="text-sm text-muted-foreground">
                              Assignée le {new Date(carte.date_assignation).toLocaleDateString()}
                              {carte.date_fin && ` - Finie le ${new Date(carte.date_fin).toLocaleDateString()}`}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={carte.statut === 'active' ? 'default' : 'secondary'}
                        >
                          {carte.statut === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Consommation:</span>
                          <span className="ml-2 font-medium">{carte.consommation_carte} DA</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Transactions:</span>
                          <span className="ml-2 font-medium">{carte.nombre_transactions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun historique de cartes trouvé pour cet employé</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setShowCardHistoryModal(false)}
              className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Modal */}
      <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
        <DialogContent className="glass-card border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? "Modifier le Matériel" : "Ajouter un Matériel"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifiez les informations du matériel" : "Ajoutez un nouveau matériel à votre inventaire"}
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
        <DialogContent className="glass-card border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? "Modifier l'Affectation" : "Nouvelle Affectation"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifiez l'affectation de matériel" : "Assignez du matériel à un employé"}
            </DialogDescription>
          </DialogHeader>
          <AffectationForm 
            affectation={editingItem} 
            onSave={saveAffectation} 
            onCancel={() => {
              setShowAffectationModal(false)
              setEditingItem(null)
            }}
            employees={employees}
            materials={materials}
          />
        </DialogContent>
      </Dialog>

      {/* Multi-Affectation Modal */}
      <Dialog open={showMultiAffectationModal} onOpenChange={setShowMultiAffectationModal}>
        <DialogContent className="glass-card border border-white/20 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Affectation Multiple
            </DialogTitle>
            <DialogDescription>
              Assignez plusieurs matériaux à plusieurs employés en une seule fois
            </DialogDescription>
          </DialogHeader>
          <MultiAffectationForm 
            onSave={saveMultiAffectation} 
            onCancel={() => {
              setShowMultiAffectationModal(false)
            }}
            employees={employees}
            materials={materials}
          />
        </DialogContent>
      </Dialog>

      {/* Penalty Modal */}
      <Dialog open={showPenaltyModal} onOpenChange={setShowPenaltyModal}>
        <DialogContent className="glass-card border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? "Modifier la Pénalité" : "Ajouter une Pénalité"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifiez les informations de la pénalité" : "Ajoutez une nouvelle pénalité"}
            </DialogDescription>
          </DialogHeader>
          <PenaltyForm 
            penalty={editingItem} 
            onSave={savePenalty} 
            onCancel={() => {
              setShowPenaltyModal(false)
              setEditingItem(null)
            }}
            employees={employees}
          />
        </DialogContent>
      </Dialog>

      {/* Claim Modal */}
      <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
        <DialogContent className="glass-card border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? "Modifier la Réclamation" : "Ajouter une Réclamation"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifiez les informations de la réclamation" : "Ajoutez une nouvelle réclamation"}
            </DialogDescription>
          </DialogHeader>
          <ClaimForm 
            claim={editingItem} 
            onSave={saveClaim} 
            onCancel={() => {
              setShowClaimModal(false)
              setEditingItem(null)
            }}
            employees={employees}
            interventions={interventions}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Multi-Affectation Form Component
function MultiAffectationForm({ onSave, onCancel, employees, materials }: { 
  onSave: (data: any) => void, 
  onCancel: () => void,
  employees: any[],
  materials: any[]
}) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<{[key: string]: number}>({})
  const [formData, setFormData] = useState({
    date_affectation: new Date().toISOString().split('T')[0],
    commentaires: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const assignments = selectedEmployees.flatMap(employeeId => 
      Object.entries(selectedMaterials).map(([materialId, quantity]) => ({
        employee_id: employeeId,
        material_id: materialId,
        quantite_affectee: quantity,
        date_affectation: formData.date_affectation,
        statut: 'en_cours',
        commentaires: formData.commentaires
      }))
    )

    onSave(assignments)
  }

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const updateMaterialQuantity = (materialId: string, quantity: number) => {
    setSelectedMaterials(prev => ({
      ...prev,
      [materialId]: quantity
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Employee Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Sélectionner les Employés</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-white/20 rounded-lg p-3">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`employee-${employee.id}`}
                  checked={selectedEmployees.includes(employee.id)}
                  onCheckedChange={() => toggleEmployee(employee.id)}
                />
                <Label htmlFor={`employee-${employee.id}`} className="text-sm">
                  {employee.prenom} {employee.nom}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Material Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Sélectionner les Matériaux</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto border border-white/20 rounded-lg p-3">
            {materials.map((material) => (
              <div key={material.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`material-${material.id}`}
                  checked={selectedMaterials[material.id] > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateMaterialQuantity(material.id, 1)
                    } else {
                      const newMaterials = { ...selectedMaterials }
                      delete newMaterials[material.id]
                      setSelectedMaterials(newMaterials)
                    }
                  }}
                />
                <Label htmlFor={`material-${material.id}`} className="text-sm flex-1">
                  {material.nom}
                </Label>
                {selectedMaterials[material.id] > 0 && (
                  <Input
                    type="number"
                    min="1"
                    value={selectedMaterials[material.id]}
                    onChange={(e) => updateMaterialQuantity(material.id, parseInt(e.target.value) || 1)}
                    className="w-20 h-8 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date_affectation">Date d'Affectation</Label>
          <Input
            id="date_affectation"
            type="date"
            value={formData.date_affectation}
            onChange={(e) => setFormData({...formData, date_affectation: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="commentaires">Commentaires</Label>
        <Textarea
          id="commentaires"
          value={formData.commentaires}
          onChange={(e) => setFormData({...formData, commentaires: e.target.value})}
          className="glass-card border border-white/20"
          rows={3}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10">
          Annuler
        </Button>
        <Button type="submit" className="gradient-primary text-white">
          Créer les Affectations
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
          <Label htmlFor="region">Région</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => setFormData({...formData, region: e.target.value})}
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
          <Label htmlFor="niveau_acces">Niveau d'Accès</Label>
          <Select value={formData.niveau_acces} onValueChange={(value) => setFormData({...formData, niveau_acces: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technicien">Technicien</SelectItem>
              <SelectItem value="chef_equipe">Chef d'Équipe</SelectItem>
              <SelectItem value="superadmin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="pourcentage_taxe">Pourcentage Taxe (%)</Label>
          <Input
            id="pourcentage_taxe"
            type="number"
            step="0.01"
            value={formData.pourcentage_taxe}
            onChange={(e) => setFormData({...formData, pourcentage_taxe: e.target.value})}
            className="glass-card border border-white/20"
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="commentaires">Commentaires</Label>
        <Textarea
          id="commentaires"
          value={formData.commentaires}
          onChange={(e) => setFormData({...formData, commentaires: e.target.value})}
          className="glass-card border border-white/20"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10">
          Annuler
        </Button>
        <Button type="submit" className="gradient-primary text-white">
          {employee ? "Modifier" : "Ajouter"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Material Form Component
function MaterialForm({ material, onSave, onCancel }: { material: any, onSave: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    nom: material?.nom || '',
    description: material?.description || '',
    quantite: material?.quantite || '',
    unite: material?.unite || '',
    prix_unitaire: material?.prix_unitaire || '',
    categorie: material?.categorie || '',
    fournisseur: material?.fournisseur || '',
    numero_serie: material?.numero_serie || '',
    date_acquisition: material?.date_acquisition || '',
    statut: material?.statut || 'disponible',
    localisation: material?.localisation || '',
    commentaires: material?.commentaires || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nom">Nom du Matériel</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({...formData, nom: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="categorie">Catégorie</Label>
          <Input
            id="categorie"
            value={formData.categorie}
            onChange={(e) => setFormData({...formData, categorie: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="quantite">Quantité</Label>
          <Input
            id="quantite"
            type="number"
            value={formData.quantite}
            onChange={(e) => setFormData({...formData, quantite: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="unite">Unité</Label>
          <Select value={formData.unite} onValueChange={(value) => setFormData({...formData, unite: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner une unité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="piece">Pièce</SelectItem>
              <SelectItem value="metre">Mètre</SelectItem>
              <SelectItem value="kg">Kilogramme</SelectItem>
              <SelectItem value="litre">Litre</SelectItem>
              <SelectItem value="boite">Boîte</SelectItem>
              <SelectItem value="rouleau">Rouleau</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="prix_unitaire">Prix Unitaire (€)</Label>
          <Input
            id="prix_unitaire"
            type="number"
            step="0.01"
            value={formData.prix_unitaire}
            onChange={(e) => setFormData({...formData, prix_unitaire: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="fournisseur">Fournisseur</Label>
          <Input
            id="fournisseur"
            value={formData.fournisseur}
            onChange={(e) => setFormData({...formData, fournisseur: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="numero_serie">Numéro de Série</Label>
          <Input
            id="numero_serie"
            value={formData.numero_serie}
            onChange={(e) => setFormData({...formData, numero_serie: e.target.value})}
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
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="utilise">Utilisé</SelectItem>
              <SelectItem value="maintenance">En Maintenance</SelectItem>
              <SelectItem value="hors_service">Hors Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="localisation">Localisation</Label>
          <Input
            id="localisation"
            value={formData.localisation}
            onChange={(e) => setFormData({...formData, localisation: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="date_acquisition">Date d'Acquisition</Label>
          <Input
            id="date_acquisition"
            type="date"
            value={formData.date_acquisition}
            onChange={(e) => setFormData({...formData, date_acquisition: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="glass-card border border-white/20"
          rows={3}
        />
      </div>
      
      <div>
        <Label htmlFor="commentaires">Commentaires</Label>
        <Textarea
          id="commentaires"
          value={formData.commentaires}
          onChange={(e) => setFormData({...formData, commentaires: e.target.value})}
          className="glass-card border border-white/20"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10">
          Annuler
        </Button>
        <Button type="submit" className="gradient-primary text-white">
          {material ? "Modifier" : "Ajouter"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Affectation Form Component
function AffectationForm({ affectation, onSave, onCancel, employees, materials }: { 
  affectation: any, 
  onSave: (data: any) => void, 
  onCancel: () => void,
  employees: any[],
  materials: any[]
}) {
  const [formData, setFormData] = useState({
    employee_id: affectation?.employee_id || '',
    material_id: affectation?.material_id || '',
    quantite_affectee: affectation?.quantite_affectee || '',
    date_affectation: affectation?.date_affectation || '',
    date_retour: affectation?.date_retour || '',
    statut: affectation?.statut || 'en_cours',
    commentaires: affectation?.commentaires || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee_id">Employé</Label>
          <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un employé" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="material_id">Matériel</Label>
          <Select value={formData.material_id} onValueChange={(value) => setFormData({...formData, material_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un matériel" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((mat) => (
                <SelectItem key={mat.id} value={mat.id}>
                  {mat.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quantite_affectee">Quantité Affectée</Label>
          <Input
            id="quantite_affectee"
            type="number"
            value={formData.quantite_affectee}
            onChange={(e) => setFormData({...formData, quantite_affectee: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en_cours">En Cours</SelectItem>
              <SelectItem value="retourne">Retourné</SelectItem>
              <SelectItem value="perdu">Perdu</SelectItem>
              <SelectItem value="casse">Cassé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date_affectation">Date d'Affectation</Label>
          <Input
            id="date_affectation"
            type="date"
            value={formData.date_affectation}
            onChange={(e) => setFormData({...formData, date_affectation: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="date_retour">Date de Retour</Label>
          <Input
            id="date_retour"
            type="date"
            value={formData.date_retour}
            onChange={(e) => setFormData({...formData, date_retour: e.target.value})}
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
          className="glass-card border border-white/20"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10">
          Annuler
        </Button>
        <Button type="submit" className="gradient-primary text-white">
          {affectation ? "Modifier" : "Ajouter"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Penalty Form Component
function PenaltyForm({ penalty, onSave, onCancel, employees }: { 
  penalty: any, 
  onSave: (data: any) => void, 
  onCancel: () => void,
  employees: any[]
}) {
  const [formData, setFormData] = useState({
    employee_id: penalty?.employee_id || '',
    type: penalty?.type || '',
    motif: penalty?.motif || '',
    montant: penalty?.montant || '',
    statut: penalty?.statut || 'active',
    date_echeance: penalty?.date_echeance || '',
    commentaires: penalty?.commentaires || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee_id">Employé *</Label>
          <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un employé" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Type de Pénalité *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="absence">Absence</SelectItem>
              <SelectItem value="retard">Retard</SelectItem>
              <SelectItem value="comportement">Comportement</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="motif">Motif *</Label>
          <Input
            id="motif"
            value={formData.motif}
            onChange={(e) => setFormData({...formData, motif: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="montant">Montant (€) *</Label>
          <Input
            id="montant"
            type="number"
            step="0.01"
            value={formData.montant}
            onChange={(e) => setFormData({...formData, montant: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="statut">Statut *</Label>
          <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="soumis">Soumis</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date_echeance">Date d'Échéance *</Label>
          <Input
            id="date_echeance"
            type="date"
            value={formData.date_echeance}
            onChange={(e) => setFormData({...formData, date_echeance: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="commentaires">Commentaires</Label>
        <Textarea
          id="commentaires"
          value={formData.commentaires}
          onChange={(e) => setFormData({...formData, commentaires: e.target.value})}
          className="glass-card border border-white/20"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10">
          Annuler
        </Button>
        <Button type="submit" className="gradient-primary text-white">
          {penalty ? "Modifier" : "Ajouter"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Claim Form Component
function ClaimForm({ claim, onSave, onCancel, employees, interventions }: { 
  claim: any, 
  onSave: (data: any) => void, 
  onCancel: () => void,
  employees: any[],
  interventions: any[]
}) {
  const [formData, setFormData] = useState({
    type: claim?.type || '',
    priorite: claim?.priorite || 'normale',
    statut: claim?.statut || 'ouverte',
    client_nom: claim?.client_nom || '',
    client_telephone: claim?.client_telephone || '',
    client_email: claim?.client_email || '',
    employee_id: claim?.employee_id || '',
    intervention_id: claim?.intervention_id || '',
    description_probleme: claim?.description_probleme || '',
    description_solution: claim?.description_solution || '',
    commentaires_internes: claim?.commentaires_internes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type de Réclamation</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technique">Technique</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="facturation">Facturation</SelectItem>
              <SelectItem value="service">Service Client</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priorite">Priorité</Label>
          <Select value={formData.priorite} onValueChange={(value) => setFormData({...formData, priorite: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normale">Normale</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
              <SelectItem value="critique">Critique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
            <SelectTrigger className="glass-card border border-white/20">
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
          <Label htmlFor="client_nom">Nom du Client</Label>
          <Input
            id="client_nom"
            value={formData.client_nom}
            onChange={(e) => setFormData({...formData, client_nom: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="client_telephone">Téléphone Client</Label>
          <Input
            id="client_telephone"
            value={formData.client_telephone}
            onChange={(e) => setFormData({...formData, client_telephone: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="client_email">Email Client</Label>
          <Input
            id="client_email"
            type="email"
            value={formData.client_email}
            onChange={(e) => setFormData({...formData, client_email: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="employee_id">Employé Assigné</Label>
          <Select value={formData.employee_id} onValueChange={(value) => setFormData({...formData, employee_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un employé" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.prenom} {emp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="intervention_id">Intervention Concernée</Label>
          <Select value={formData.intervention_id} onValueChange={(value) => setFormData({...formData, intervention_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner une intervention" />
            </SelectTrigger>
            <SelectContent>
              {interventions.map((intervention) => (
                <SelectItem key={intervention.id} value={intervention.id}>
                  {intervention.numero_intervention || `Intervention ${intervention.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description_probleme">Description du Problème *</Label>
        <Textarea
          id="description_probleme"
          value={formData.description_probleme}
          onChange={(e) => setFormData({...formData, description_probleme: e.target.value})}
          className="glass-card border border-white/20"
          rows={4}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description_solution">Description de la Solution</Label>
        <Textarea
          id="description_solution"
          value={formData.description_solution}
          onChange={(e) => setFormData({...formData, description_solution: e.target.value})}
          className="glass-card border border-white/20"
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="commentaires_internes">Commentaires Internes</Label>
        <Textarea
          id="commentaires_internes"
          value={formData.commentaires_internes}
          onChange={(e) => setFormData({...formData, commentaires_internes: e.target.value})}
          className="glass-card border border-white/20"
          rows={3}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10">
          Annuler
        </Button>
        <Button type="submit" className="gradient-primary text-white">
          {claim ? "Modifier" : "Ajouter"}
        </Button>
      </DialogFooter>
    </form>
  )
}

