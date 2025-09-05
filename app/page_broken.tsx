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
  Activity,
  DollarSign,
  Fuel,
  Calendar,
  Trash2,
  Package,
  AlertTriangle,
  CreditCard,
  BarChart3,
} from "lucide-react"

// User authentication data (kept for login functionality)
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

const saveInterventionsToDatabase = async (data: any[]) => {
  try {
    const response = await fetch("/api/interventions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ interventions: data }),
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la sauvegarde en base de données")
    }

    const result = await response.json()
    console.log("[v0] Interventions sauvegardées:", result.saved, "nouvelles,", result.duplicates, "doublons ignorés")
    return result
  } catch (error) {
    console.error("[v0] Erreur sauvegarde interventions:", error)
    throw error
  }
}

const saveFuelDataToDatabase = async (data: any[]) => {
  try {
    const response = await fetch("/api/carburant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ carburant: data }),
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la sauvegarde en base de données")
    }

    const result = await response.json()
    console.log("[v0] Carburant sauvegardé:", result.saved, "nouvelles,", result.duplicates, "doublons ignorés")
    return result
  } catch (error) {
    console.error("[v0] Erreur sauvegarde carburant:", error)
    throw error
  }
}

// Function to filter fuel data
const filterFuelData = (data: any[], dateLivraisonFilter: string, dateFactFilter: string, numeroCarteFilter: string) => {
  return data.filter(item => {
    const matchesDateLivraison = !dateLivraisonFilter || 
      item.date_livraison?.toLowerCase().includes(dateLivraisonFilter.toLowerCase())
    const matchesDateFact = !dateFactFilter || 
      item.date_fact?.toLowerCase().includes(dateFactFilter.toLowerCase())
    const matchesNumeroCarte = !numeroCarteFilter || 
      item.numero_carte?.toLowerCase().includes(numeroCarteFilter.toLowerCase())
    
    return matchesDateLivraison && matchesDateFact && matchesNumeroCarte
  })
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
  const [showInterventions, setShowInterventions] = useState(false)
  const [showFuelConsumption, setShowFuelConsumption] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)
  const [showPenalties, setShowPenalties] = useState(false)
  const [showClaims, setShowClaims] = useState(false)
  const [showEmployees, setShowEmployees] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

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

  // Fuel data filters
  const [fuelDateLivraisonFilter, setFuelDateLivraisonFilter] = useState("")
  const [fuelDateFactFilter, setFuelDateFactFilter] = useState("")
  const [fuelNumeroCarteFilter, setFuelNumeroCarteFilter] = useState("")

  // Assignation data
  const [assignationData, setAssignationData] = useState({
    numero_carte: '',
    employe_id: ''
  })

  // Load data from database on component mount
  useEffect(() => {
    if (isLoggedIn) {
      loadDataFromDatabase()
      loadAllCRUDData() // Charger aussi les données CRUD
    }
  }, [isLoggedIn])

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
  };

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const foundUser = Object.values(users).find((u) => u.email === email && u.password === password)
    if (foundUser) {
      setUser(foundUser)
      setIsLoggedIn(true)
    } else {
      alert("Email ou mot de passe incorrect")
    }
  };

  const handleLogout = () => {
    setUser(null)
    setIsLoggedIn(false)
    setActiveTab("dashboard")
  };

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
  };

  // Function to show employee details
  const showEmployeeDetails = (employee: any) => {
    setSelectedEmployee(employee)
    setShowEmployeeDetailsModal(true)
  };

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
  };

  // Function to assign card to employee
  const assignCardToEmployee = async (numeroCarte: string) => {
    try {
      const response = await fetch('/api/carburant-assignation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero_carte: numeroCarte,
          employe_id: selectedEmployee.id
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
  };

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
                activeTab === "consommation-carburant"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
              onClick={() => setActiveTab("consommation-carburant")}
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

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-10 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent text-balance">
                      Tableau de Bord
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Vue d'ensemble de votre activité FinalFibre
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                      <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                    <Button
                      onClick={loadDataFromDatabase}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 via-chart-1/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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

                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-2/20 via-chart-2/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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

                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-3/20 via-chart-3/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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

                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-4/20 via-chart-4/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
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
                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <FileText className="w-6 h-6 text-primary" />
                    Interventions Récentes
                    </CardTitle>
                  <CardDescription>
                    Dernières interventions enregistrées dans la base de données
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
                    <div className="space-y-4">
                      {interventions.slice(0, 5).map((intervention, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-gray-900 font-semibold">
                              {intervention.prenom_technicien?.charAt(0) || 'T'}
                      </div>
                            <div>
                              <p className="font-semibold">
                                {intervention.prenom_technicien} {intervention.nom_technicien}
                              </p>
                              <p className="text-sm text-muted-foreground">{intervention.client}</p>
                              <p className="text-xs text-muted-foreground">{intervention.date_rdv}</p>
                            </div>
                          </div>
                          <Badge 
                            variant={intervention.statut === 'Terminé' ? 'default' : 'secondary'}
                            className="glass-card border border-white/20"
                          >
                            {intervention.statut || 'En cours'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  </CardContent>
                </Card>
            </div>
          )}

          {/* Interventions Tab */}
          {activeTab === "interventions" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
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
                      <Button className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium">
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
                            setShowInterventions(!showInterventions)
                          }}
                          className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium"
                        >
                          Actualiser les Données
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
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

        {/* Fuel Consumption Tab */}

          {/* Other tabs placeholder with glassmorphism */}
          {activeTab === "fuel" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
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
                        <Button className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium">
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
                            setShowFuelConsumption(!showFuelConsumption)
                          }}
                          className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium"
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
              </div>

              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <Fuel className="w-6 h-6 text-primary" />
                    Transactions Carburant
                  </CardTitle>
                  <CardDescription>
                    {filterFuelData(fuelData, fuelDateLivraisonFilter, fuelDateFactFilter, fuelNumeroCarteFilter).length} transactions trouvées dans la base de données PostgreSQL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="mb-6 p-4 glass-card border border-white/20 rounded-2xl">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Filtres</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dateLivraisonFilter2" className="text-xs text-gray-900 font-medium">Date Livraison</Label>
                        <Input
                          id="dateLivraisonFilter2"
                          placeholder="Filtrer par date de livraison..."
                          value={fuelDateLivraisonFilter}
                          onChange={(e) => setFuelDateLivraisonFilter(e.target.value)}
                          className="mt-1 bg-white/90 border border-white/30 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-white"
                        />
                          </div>
                          <div>
                        <Label htmlFor="dateFactFilter2" className="text-xs text-gray-900 font-medium">Date Fact</Label>
                        <Input
                          id="dateFactFilter2"
                          placeholder="Filtrer par date de facturation..."
                          value={fuelDateFactFilter}
                          onChange={(e) => setFuelDateFactFilter(e.target.value)}
                          className="mt-1 bg-white/90 border border-white/30 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-white"
                        />
                          </div>
                      <div>
                        <Label htmlFor="numeroCarteFilter2" className="text-xs text-gray-900 font-medium">N° Carte</Label>
                        <Input
                          id="numeroCarteFilter2"
                          placeholder="Filtrer par numéro de carte..."
                          value={fuelNumeroCarteFilter}
                          onChange={(e) => setFuelNumeroCarteFilter(e.target.value)}
                          className="mt-1 bg-white/90 border border-white/30 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-white"
                        />
                        </div>
                    </div>
                    {(fuelDateLivraisonFilter || fuelDateFactFilter || fuelNumeroCarteFilter) && (
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFuelDateLivraisonFilter("")
                            setFuelDateFactFilter("")
                            setFuelNumeroCarteFilter("")
                          }}
                          className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                        >
                          Effacer les filtres
                        </Button>
            </div>
          )}
                </div>
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
                          {filterFuelData(fuelData, fuelDateLivraisonFilter, fuelDateFactFilter, fuelNumeroCarteFilter).slice(0, 100).map((transaction, index) => (
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

          {activeTab === "employees" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                      Gestion des Employés
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Gérez vos employés et leurs informations
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={loadAllCRUDData}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/sync-employees', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                          })
                          const result = await response.json()
                          if (response.ok) {
                            alert(`Synchronisation réussie: ${result.stats.created} créés, ${result.stats.updated} mis à jour`)
                            await loadAllCRUDData()
                          } else {
                            alert(`Erreur: ${result.error}`)
                          }
                        } catch (error) {
                          console.error("Erreur synchronisation:", error)
                          alert("Erreur lors de la synchronisation")
                        }
                      }}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Sync Interventions
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setShowEmployeeModal(true)
                      }}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Employé
                    </Button>
                  </div>
                </div>
              </div>

              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <Users className="w-6 h-6 text-primary" />
                    Liste des Employés
                  </CardTitle>
                  <CardDescription>
                    {employees.length} employés trouvés dans la base de données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingEmployees ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des employés...</p>
                    </div>
                  ) : employees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucun employé trouvé</h3>
                      <p>Ajoutez des employés pour commencer à les gérer.</p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-4 font-semibold">Employé</th>
                            <th className="text-left p-4 font-semibold">Matricule</th>
                          <th className="text-left p-4 font-semibold">Téléphone</th>
                            <th className="text-left p-4 font-semibold">Email</th>
                            <th className="text-left p-4 font-semibold">Poste</th>
                            <th className="text-left p-4 font-semibold">Taxe %</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                          {employees && isValidArray(employees) ? employees.map((employee, index) => (
                          <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center text-gray-900 text-sm font-semibold">
                                    {employee.prenom?.charAt(0) || 'E'}{employee.nom?.charAt(0) || 'M'}
                                  </div>
                                  <div>
                                    <span className="font-medium">{employee.prenom} {employee.nom}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">{employee.matricule || 'N/A'}</td>
                              <td className="p-4">{employee.telephone || 'N/A'}</td>
                              <td className="p-4">{employee.email || 'N/A'}</td>
                              <td className="p-4">{employee.poste || 'N/A'}</td>
                              <td className="p-4">
                                <span className="font-medium text-blue-600">
                                  {employee.pourcentage_taxe ? `${employee.pourcentage_taxe}%` : 'N/A'}
                                </span>
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
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => showEmployeeDetails(employee)}
                                    className="glass-card border border-white/20 hover:bg-white/10 text-gray-900"
                                    title="Voir les détails"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => showCardAssignment(employee)}
                                    className="glass-card border border-white/20 hover:bg-blue-500/20 text-gray-900"
                                    title="Assigner carte carburant"
                                  >
                                    <CreditCard className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingItem(employee)
                                      setShowEmployeeModal(true)
                                    }}
                                    className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
                                        deleteEmployee(employee.id)
                                      }
                                    }}
                                    className="glass-card border border-white/20 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-muted-foreground">
                              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <h3 className="text-lg font-semibold mb-2">Aucun employé trouvé</h3>
                              <p>Ajoutez des employés pour commencer à les gérer.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === "materials" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
              <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                      Gestion du Matériel
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Gérez votre inventaire d'équipements et matériels
                    </p>
                </div>
                  <div className="flex gap-3">
                <Button
                      onClick={loadAllCRUDData}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setShowMaterialModal(true)
                      }}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Matériel
                </Button>
                  </div>
                </div>
              </div>

              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <Package className="w-6 h-6 text-primary" />
                    Inventaire du Matériel
                  </CardTitle>
                  <CardDescription>
                    {materials.length} équipements trouvés dans la base de données
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMaterials ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement du matériel...</p>
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
                            <th className="text-left p-4 font-semibold">Équipement</th>
                          <th className="text-left p-4 font-semibold">Type</th>
                            <th className="text-left p-4 font-semibold">Marque/Modèle</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Quantité</th>
                            <th className="text-left p-4 font-semibold">Prix Unitaire</th>
                            <th className="text-left p-4 font-semibold">Prix Total</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                          {materials.map((material, index) => (
                            <tr key={material.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-gray-900 text-sm font-semibold">
                                    <Package className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="font-medium">{material.nom_equipement}</span>
                                    <p className="text-xs text-muted-foreground">{material.numero_serie}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">{material.type_materiel}</td>
                              <td className="p-4">{material.marque} {material.modele}</td>
                              <td className="p-4">
                                <Badge 
                                  variant={material.statut === 'disponible' ? 'default' : 'secondary'}
                                  className="glass-card border border-white/20"
                                >
                                  {material.statut}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="glass-card border border-white/20">
                                  {material.quantite || 0}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className="text-sm font-medium">
                                  {formatCurrency(material.prix_unitaire)} €
                              </span>
                            </td>
                            <td className="p-4">
                                <span className="text-sm font-bold text-primary">
                                  {formatCurrency(safeNumber(material.quantite) * safeNumber(material.prix_unitaire))} €
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingItem(material)
                                      setShowMaterialModal(true)
                                    }}
                                    className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
                                        deleteMaterial(material.id)
                                      }
                                    }}
                                    className="glass-card border border-white/20 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
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

              {/* Affectations de Matériel Section */}
              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <Users className="w-6 h-6 text-primary" />
                    Affectations de Matériel
                  </CardTitle>
                  <CardDescription>
                    Gérez les assignations de matériel aux employés
                  </CardDescription>
                    </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setEditingItem(null)
                          setShowAffectationModal(true)
                        }}
                        className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle Affectation
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingItem(null)
                          setShowMultiAffectationModal(true)
                        }}
                        className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Affectation Multiple
                      </Button>
                      </div>
                    <div className="flex gap-3">
                      <Input
                        type="date"
                        placeholder="Date de début"
                        className="glass-card border border-white/20 text-gray-900"
                        onChange={(e) => {
                          // TODO: Implémenter le filtre par date
                        }}
                      />
                      <Input
                        type="date"
                        placeholder="Date de fin"
                        className="glass-card border border-white/20 text-gray-900"
                        onChange={(e) => {
                          // TODO: Implémenter le filtre par date
                        }}
                      />
                      <Button
                        onClick={() => {
                          // TODO: Réinitialiser les filtres
                        }}
                        className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                      >
                        Effacer Filtres
                      </Button>
                    </div>
                  </div>

                  {loadingAffectations ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement des affectations...</p>
                    </div>
                  ) : affectations.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Aucune affectation</h3>
                      <p className="text-muted-foreground mb-4">
                        Commencez par assigner du matériel à vos employés
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        // Grouper les affectations par employé
                        const groupedAffectations = affectations.reduce((acc, affectation) => {
                          const key = `${affectation.employe_prenom} ${affectation.employe_nom}`
                          if (!acc[key]) {
                            acc[key] = {
                              employe: {
                                nom: affectation.employe_nom,
                                prenom: affectation.employe_prenom
                              },
                              affectations: []
                            }
                          }
                          acc[key].affectations.push(affectation)
                          return acc
                        }, {} as any)

                        return Object.entries(groupedAffectations).map(([employeKey, group]: [string, any]) => (
                          <div key={employeKey} className="glass-card p-6 rounded-2xl border border-white/20">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-gray-900 text-sm font-semibold">
                                <Users className="w-5 h-5" />
                      </div>
                      <div>
                                <h3 className="text-lg font-semibold">
                                  {group.employe.prenom} {group.employe.nom}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {group.affectations.length} affectation(s) - 
                                  Coût total: <span className="font-semibold text-primary">
                                    {formatCurrency(group.affectations.reduce((total: number, aff: any) => 
                                      total + (safeNumber(aff.prix_unitaire) * safeNumber(aff.quantite_assignee)), 0
                                    ))} €
                                  </span>
                                </p>
                      </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-white/10">
                                    <th className="text-left p-3 font-semibold text-sm">Matériel</th>
                                    <th className="text-left p-3 font-semibold text-sm">Quantité</th>
                                    <th className="text-left p-3 font-semibold text-sm">Prix Unitaire</th>
                                    <th className="text-left p-3 font-semibold text-sm">Prix Total</th>
                                    <th className="text-left p-3 font-semibold text-sm">Date Affectation</th>
                                    <th className="text-left p-3 font-semibold text-sm">Statut</th>
                                    <th className="text-left p-3 font-semibold text-sm">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.affectations.map((affectation: any) => (
                                    <tr key={affectation.id} className="border-b border-white/5 hover:bg-white/5">
                                      <td className="p-3">
                      <div>
                                          <div className="font-medium text-sm">{affectation.nom_equipement}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {affectation.type_materiel} - {affectation.marque} {affectation.modele}
                      </div>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <Badge variant="outline" className="glass-card border border-white/20">
                                          {affectation.quantite_assignee}
                                        </Badge>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-sm font-medium">
                                          {formatCurrency(affectation.prix_unitaire)} €
                                        </span>
                                      </td>
                                      <td className="p-3">
                                        <span className="text-sm font-bold text-primary">
                                          {formatCurrency(safeNumber(affectation.prix_unitaire) * safeNumber(affectation.quantite_assignee))} €
                                        </span>
                                      </td>
                                      <td className="p-3 text-sm">
                                        {new Date(affectation.date_affectation).toLocaleDateString('fr-FR')}
                                      </td>
                                      <td className="p-3">
                                        <Badge
                                          variant={affectation.statut === 'active' ? 'default' : 'secondary'}
                                          className="glass-card border border-white/20"
                                        >
                                          {affectation.statut}
                                        </Badge>
                                      </td>
                                      <td className="p-3">
                                        <div className="flex gap-2">
                        <Button
                                            size="sm"
                                            variant="ghost"
                          onClick={() => {
                                              setEditingItem(affectation)
                                              setShowAffectationModal(true)
                                            }}
                                            className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              if (confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
                                                deleteAffectation(affectation.id)
                                              }
                                            }}
                                            className="bg-white/90 border border-white/20 hover:bg-destructive/10 hover:text-destructive"
                                          >
                                            <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                    </CardContent>
                  </Card>
            </div>
          )}

          {/* Penalties Tab */}
          {activeTab === "penalties" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
              <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
                      Gestion des Pénalités
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Gérez les pénalités et sanctions des employés
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={loadAllCRUDData}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setShowPenaltyModal(true)
                      }}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Pénalité
                    </Button>
                  </div>
                </div>
              </div>

              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <AlertTriangle className="w-6 h-6 text-primary" />
                    Liste des Pénalités
                    </CardTitle>
                  <CardDescription>
                    {penalties.length} pénalités trouvées dans la base de données
                  </CardDescription>
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
                      <p>Ajoutez des pénalités pour commencer à les gérer.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-4 font-semibold">Employé</th>
                            <th className="text-left p-4 font-semibold">Type</th>
                            <th className="text-left p-4 font-semibold">Motif</th>
                            <th className="text-left p-4 font-semibold">Montant</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {penalties.map((penalty, index) => (
                            <tr key={penalty.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center text-gray-900 text-sm font-semibold">
                                    {penalty.employe_prenom?.charAt(0) || 'E'}{penalty.employe_nom?.charAt(0) || 'M'}
                                  </div>
                    <div>
                                    <span className="font-medium">{penalty.employe_prenom} {penalty.employe_nom}</span>
                                    <p className="text-xs text-muted-foreground">{penalty.numero_penalite}</p>
                    </div>
                                </div>
                              </td>
                              <td className="p-4">{penalty.type_penalite}</td>
                              <td className="p-4">{penalty.motif}</td>
                              <td className="p-4 font-semibold">{penalty.montant} €</td>
                              <td className="p-4">
                                <Badge 
                                  variant={penalty.statut === 'active' ? 'destructive' : 'secondary'}
                                  className="glass-card border border-white/20"
                                >
                                  {penalty.statut}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                    <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingItem(penalty)
                                      setShowPenaltyModal(true)
                                    }}
                                    className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm('Êtes-vous sûr de vouloir supprimer cette pénalité ?')) {
                                        deletePenalty(penalty.id)
                                      }
                                    }}
                                    className="glass-card border border-white/20 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
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
          )}

          {/* Claims Tab */}
          {activeTab === "claims" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                      Gestion des Réclamations
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Gérez les réclamations et plaintes des clients
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={loadAllCRUDData}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setShowClaimModal(true)
                      }}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium text-gray-900 font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter Réclamation
                    </Button>
                  </div>
                </div>
              </div>
              
              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <FileText className="w-6 h-6 text-primary" />
                    Liste des Réclamations
                    </CardTitle>
                    <CardDescription>
                    {claims.length} réclamations trouvées dans la base de données
                    </CardDescription>
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
                      <p>Ajoutez des réclamations pour commencer à les gérer.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-4 font-semibold">Client</th>
                            <th className="text-left p-4 font-semibold">Type</th>
                            <th className="text-left p-4 font-semibold">Priorité</th>
                            <th className="text-left p-4 font-semibold">Statut</th>
                            <th className="text-left p-4 font-semibold">Employé Assigné</th>
                            <th className="text-left p-4 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {claims.map((claim, index) => (
                            <tr key={claim.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-gray-900 text-sm font-semibold">
                                    {claim.nom_client?.charAt(0) || 'C'}
                                  </div>
                    <div>
                                    <span className="font-medium">{claim.nom_client}</span>
                                    <p className="text-xs text-muted-foreground">{claim.numero_reclamation}</p>
                    </div>
                                </div>
                              </td>
                              <td className="p-4">{claim.type_reclamation}</td>
                              <td className="p-4">
                                <Badge 
                                  variant={claim.priorite === 'critique' ? 'destructive' : claim.priorite === 'haute' ? 'default' : 'secondary'}
                                  className="glass-card border border-white/20"
                                >
                                  {claim.priorite}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge 
                                  variant={claim.statut === 'resolue' ? 'default' : claim.statut === 'fermee' ? 'secondary' : 'outline'}
                                  className="glass-card border border-white/20"
                                >
                                  {claim.statut}
                                </Badge>
                              </td>
                              <td className="p-4">
                                {claim.employe_nom ? `${claim.employe_prenom} ${claim.employe_nom}` : 'N/A'}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                    <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingItem(claim)
                                      setShowClaimModal(true)
                                    }}
                                    className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm('Êtes-vous sûr de vouloir supprimer cette réclamation ?')) {
                                        deleteClaim(claim.id)
                                      }
                                    }}
                                    className="glass-card border border-white/20 hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
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
          )}

          {/* Consommation Carburant Tab */}
          {activeTab === "consommation-carburant" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
                      Consommation Carburant par Employé
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                      Suivez la consommation carburant de chaque employé avec sa carte assignée
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={loadAllCRUDData}
                      className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                </div>
              </div>
              
              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <Fuel className="w-6 h-6 text-primary" />
                    Consommation Carburant par Employé
                    </CardTitle>
                  <CardDescription>
                    {consommationCarburant.length} employé(s) avec consommation carburant
                  </CardDescription>
                  </CardHeader>
                  <CardContent>
                  {loadingConsommationCarburant ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Chargement de la consommation carburant...</p>
                        </div>
                  ) : consommationCarburant.length === 0 ? (
                    <div className="text-center py-8">
                      <Fuel className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Aucune consommation carburant</h3>
                      <p className="text-muted-foreground mb-4">
                        Aucun employé n'a encore de consommation carburant enregistrée
                      </p>
                          </div>
                  ) : (
                    <div className="space-y-6">
                      {consommationCarburant.map((employe: any) => (
                        <div key={employe.employe_id} className="glass-card p-6 rounded-2xl border border-white/20">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-gray-900 text-lg font-semibold">
                                <Users className="w-6 h-6" />
                        </div>
                              <div>
                                <h3 className="text-xl font-semibold">
                                  {employe.prenom} {employe.nom}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {employe.email} • {employe.telephone}
                                </p>
                          </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {formatCurrency(employe.consommation_totale_ttc)} €
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total TTC
                              </div>
                        </div>
                      </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-card p-4 rounded-xl border border-white/20">
                              <div className="text-sm text-muted-foreground">Transactions</div>
                              <div className="text-lg font-semibold">{employe.nombre_transactions}</div>
                                    </div>
                            <div className="glass-card p-4 rounded-xl border border-white/20">
                              <div className="text-sm text-muted-foreground">Moyenne par transaction</div>
                              <div className="text-lg font-semibold">{formatCurrency(employe.consommation_moyenne_ttc)} €</div>
                            </div>
                            <div className="glass-card p-4 rounded-xl border border-white/20">
                              <div className="text-sm text-muted-foreground">Première consommation</div>
                              <div className="text-lg font-semibold">
                                {employe.premiere_consommation ? 
                                  new Date(employe.premiere_consommation).toLocaleDateString('fr-FR') : 
                                  'N/A'
                                }
                              </div>
                            </div>
                            <div className="glass-card p-4 rounded-xl border border-white/20">
                              <div className="text-sm text-muted-foreground">Dernière consommation</div>
                              <div className="text-lg font-semibold">
                                {employe.derniere_consommation ? 
                                  new Date(employe.derniere_consommation).toLocaleDateString('fr-FR') : 
                                  'N/A'
                                }
                              </div>
                            </div>
                          </div>
                          
                          {employe.cartes_utilisees && (
                            <div className="mt-4">
                              <div className="text-sm text-muted-foreground mb-2">Cartes utilisées:</div>
                              <div className="flex flex-wrap gap-2">
                                {employe.cartes_utilisees.split(', ').map((carte: string, index: number) => (
                                  <Badge key={index} variant="outline" className="glass-card border border-white/20">
                                    Carte {carte}
                                  </Badge>
                                ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                ))}
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-8 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift text-center">
                <TrendingUp className="h-16 w-16 mx-auto mb-6 text-muted-foreground opacity-50" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent mb-4">
                  Rapports et Analyses
                </h1>
                <p className="text-lg text-muted-foreground">Cette fonctionnalité sera disponible dans une prochaine version.</p>
              </div>
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

      {/* Material Modal */}
      <Dialog open={showMaterialModal} onOpenChange={setShowMaterialModal}>
        <DialogContent className="glass-card border border-white/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingItem ? "Modifier le Matériel" : "Ajouter du Matériel"}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? "Modifiez les informations du matériel" : "Ajoutez un nouvel équipement à votre inventaire"}
            </DialogDescription>
          </DialogHeader>
          <MaterialForm 
            material={editingItem} 
            employees={employees}
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
            materials={materials}
            employees={employees}
            onSave={saveAffectation} 
            onCancel={() => {
              setShowAffectationModal(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Multi Affectation Modal */}
      <Dialog open={showMultiAffectationModal} onOpenChange={setShowMultiAffectationModal}>
        <DialogContent className="glass-card border border-white/20 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Affectation Multiple
            </DialogTitle>
            <DialogDescription>
              Assignez plusieurs matériels à un employé en une seule fois
            </DialogDescription>
          </DialogHeader>
          <MultiAffectationForm 
            materials={materials}
            employees={employees}
            onSave={saveMultiAffectation} 
            onCancel={() => {
              setShowMultiAffectationModal(false)
              setEditingItem(null)
            }}
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
            employees={employees}
            interventions={interventions}
            materials={materials}
            claims={claims}
            onSave={savePenalty} 
            onCancel={() => {
              setShowPenaltyModal(false)
              setEditingItem(null)
            }}
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
            employees={employees}
            interventions={interventions}
            onSave={saveClaim} 
            onCancel={() => {
              setShowClaimModal(false)
              setEditingItem(null)
            }}
          />
        </DialogContent>
      </Dialog>
                        </div>
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
function MaterialForm({ material, employees, onSave, onCancel }: { material: any, employees: any[], onSave: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    numero_serie: material?.numero_serie || '',
    nom_equipement: material?.nom_equipement || '',
    type_materiel: material?.type_materiel || '',
    marque: material?.marque || '',
    modele: material?.modele || '',
    statut: material?.statut || 'disponible',
    localisation: material?.localisation || '',
    quantite: material?.quantite || '',
    prix_unitaire: material?.prix_unitaire || '',
    date_acquisition: material?.date_acquisition || '',
    cout_acquisition: material?.cout_acquisition || '',
    etat_general: material?.etat_general || 'bon',
    notes_maintenance: material?.notes_maintenance || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="nom_equipement">Nom de l'Équipement</Label>
          <Input
            id="nom_equipement"
            value={formData.nom_equipement}
            onChange={(e) => setFormData({...formData, nom_equipement: e.target.value})}
            className="glass-card border border-white/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="type_materiel">Type de Matériel</Label>
          <Select value={formData.type_materiel} onValueChange={(value) => setFormData({...formData, type_materiel: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routeur">Routeur</SelectItem>
              <SelectItem value="modem">Modem</SelectItem>
              <SelectItem value="cable">Câble</SelectItem>
              <SelectItem value="outil">Outil</SelectItem>
              <SelectItem value="vehicule">Véhicule</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="marque">Marque</Label>
          <Input
            id="marque"
            value={formData.marque}
            onChange={(e) => setFormData({...formData, marque: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="modele">Modèle</Label>
          <Input
            id="modele"
            value={formData.modele}
            onChange={(e) => setFormData({...formData, modele: e.target.value})}
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
              <SelectItem value="en_maintenance">En Maintenance</SelectItem>
              <SelectItem value="defectueux">Défectueux</SelectItem>
              <SelectItem value="perdu">Perdu</SelectItem>
              <SelectItem value="vole">Volé</SelectItem>
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
          <Label htmlFor="quantite">Quantité</Label>
          <Input
            id="quantite"
            type="number"
            min="1"
            value={formData.quantite}
            onChange={(e) => setFormData({...formData, quantite: e.target.value})}
            className="glass-card border border-white/20"
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
            onChange={(e) => setFormData({...formData, prix_unitaire: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="cout_acquisition">Coût d'Acquisition (€)</Label>
          <Input
            id="cout_acquisition"
            type="number"
            value={formData.cout_acquisition}
            onChange={(e) => setFormData({...formData, cout_acquisition: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes_maintenance">Notes de Maintenance</Label>
        <Textarea
          id="notes_maintenance"
          value={formData.notes_maintenance}
          onChange={(e) => setFormData({...formData, notes_maintenance: e.target.value})}
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
function AffectationForm({ affectation, materials, employees, onSave, onCancel }: { 
  affectation: any, 
  materials: any[], 
  employees: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    materiel_id: affectation?.materiel_id || '',
    employe_id: affectation?.employe_id || '',
    quantite_assignee: affectation?.quantite_assignee || '',
    statut: affectation?.statut || 'active',
    commentaires: affectation?.commentaires || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  // Filtrer les matériels disponibles (avec stock > 0)
  const availableMaterials = materials.filter(material => 
    material.quantite > 0 || affectation?.materiel_id === material.id
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="materiel_id">Matériel</Label>
          <Select value={formData.materiel_id} onValueChange={(value) => setFormData({...formData, materiel_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un matériel" />
            </SelectTrigger>
            <SelectContent>
              {availableMaterials.map((material) => (
                <SelectItem key={material.id} value={material.id.toString()}>
                  {material.nom_equipement} - Stock: {material.quantite}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                                          </div>
        <div>
          <Label htmlFor="employe_id">Employé</Label>
          <Select value={formData.employe_id} onValueChange={(value) => setFormData({...formData, employe_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un employé" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.prenom} {emp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                                        </div>
        <div>
          <Label htmlFor="quantite_assignee">Quantité à Assigner</Label>
          <Input
            id="quantite_assignee"
            type="number"
            min="1"
            value={formData.quantite_assignee}
            onChange={(e) => setFormData({...formData, quantite_assignee: e.target.value})}
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="retourne">Retourné</SelectItem>
              <SelectItem value="perdu">Perdu</SelectItem>
            </SelectContent>
          </Select>
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
          {affectation ? "Modifier" : "Assigner"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Multi Affectation Form Component
function MultiAffectationForm({ materials, employees, onSave, onCancel }: { 
  materials: any[], 
  employees: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    employe_id: '',
    affectations: [{ materiel_id: '', quantite_assignee: '', commentaires: '' }]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filtrer les affectations valides
    const validAffectations = formData.affectations.filter(a => 
      a.materiel_id && a.quantite_assignee && parseInt(a.quantite_assignee) > 0
    )
    
    if (validAffectations.length === 0) {
      alert("Veuillez ajouter au moins une affectation valide")
      return
    }
    
    onSave({
      employe_id: formData.employe_id,
      affectations: validAffectations.map(a => ({
        materiel_id: parseInt(a.materiel_id),
        quantite_assignee: parseInt(a.quantite_assignee),
        commentaires: a.commentaires
      }))
    })
  }

  const addAffectation = () => {
    setFormData({
      ...formData,
      affectations: [...formData.affectations, { materiel_id: '', quantite_assignee: '', commentaires: '' }]
    })
  }

  const removeAffectation = (index: number) => {
    if (formData.affectations.length > 1) {
      setFormData({
        ...formData,
        affectations: formData.affectations.filter((_, i) => i !== index)
      })
    }
  }

  const updateAffectation = (index: number, field: string, value: string) => {
    const newAffectations = [...formData.affectations]
    newAffectations[index] = { ...newAffectations[index], [field]: value }
    setFormData({ ...formData, affectations: newAffectations })
  }

  // Filtrer les matériels disponibles (avec stock > 0)
  const availableMaterials = materials.filter(material => material.quantite > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="employe_id">Employé</Label>
        <Select value={formData.employe_id} onValueChange={(value) => setFormData({...formData, employe_id: value})}>
          <SelectTrigger className="glass-card border border-white/20">
            <SelectValue placeholder="Sélectionner un employé" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id.toString()}>
                {emp.prenom} {emp.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Label>Matériels à Assigner</Label>
          <Button
            type="button"
            onClick={addAffectation}
            className="bg-white/90 border border-white/30 hover:bg-white text-gray-900 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter Matériel
          </Button>
        </div>

        <div className="space-y-4">
          {formData.affectations.map((affectation, index) => (
            <div key={index} className="glass-card p-4 rounded-lg border border-white/20">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Matériel {index + 1}</h4>
                {formData.affectations.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeAffectation(index)}
                    className="bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-600"
                    size="sm"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                                      )}
                                    </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Matériel</Label>
                  <Select 
                    value={affectation.materiel_id} 
                    onValueChange={(value) => updateAffectation(index, 'materiel_id', value)}
                  >
                    <SelectTrigger className="glass-card border border-white/20">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.nom_equipement} - Stock: {material.quantite}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={affectation.quantite_assignee}
                    onChange={(e) => updateAffectation(index, 'quantite_assignee', e.target.value)}
                    className="glass-card border border-white/20"
                  />
                </div>
                
                <div>
                  <Label>Commentaires</Label>
                  <Input
                    value={affectation.commentaires}
                    onChange={(e) => updateAffectation(index, 'commentaires', e.target.value)}
                    className="glass-card border border-white/20"
                    placeholder="Optionnel"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
                      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} className="glass-card border border-white/20 text-gray-900 font-medium hover:bg-white/10">
          Annuler
                          </Button>
        <Button type="submit" className="gradient-primary text-white">
          Assigner Matériels
        </Button>
      </DialogFooter>
    </form>
  )
}

// Penalty Form Component
function PenaltyForm({ penalty, employees, interventions, materials, claims, onSave, onCancel }: { 
  penalty: any, 
  employees: any[], 
  interventions: any[], 
  materials: any[], 
  claims: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    employe_id: penalty?.employe_id || '',
    type_penalite: penalty?.type_penalite || '',
    motif: penalty?.motif || '',
    montant: penalty?.montant || '',
    statut: penalty?.statut || 'active',
    date_echeance: penalty?.date_echeance || '',
    commentaires: penalty?.commentaires || '',
    intervention_concernee: penalty?.intervention_concernee || '',
    reclamation_concernee: penalty?.reclamation_concernee || '',
    materiel_concerne: penalty?.materiel_concerne || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employe_id">Employé *</Label>
          <Select value={formData.employe_id} onValueChange={(value) => setFormData({...formData, employe_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un employé" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.prenom} {emp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
                        </div>
        <div>
          <Label htmlFor="type_penalite">Type de Pénalité *</Label>
          <Select value={formData.type_penalite} onValueChange={(value) => setFormData({...formData, type_penalite: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retard">Retard</SelectItem>
              <SelectItem value="absence">Absence</SelectItem>
              <SelectItem value="erreur_technique">Erreur Technique</SelectItem>
              <SelectItem value="comportement">Comportement</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
                    </div>
        <div className="col-span-2">
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
          <Label htmlFor="statut">Statut</Label>
          <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="annulee">Annulée</SelectItem>
              <SelectItem value="remboursee">Remboursée</SelectItem>
            </SelectContent>
          </Select>
    </div>
        <div>
          <Label htmlFor="date_echeance">Date d'Échéance</Label>
          <Input
            id="date_echeance"
            type="date"
            value={formData.date_echeance}
            onChange={(e) => setFormData({...formData, date_echeance: e.target.value})}
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
          {penalty ? "Modifier" : "Ajouter"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// Claim Form Component
function ClaimForm({ claim, employees, interventions, onSave, onCancel }: { 
  claim: any, 
  employees: any[], 
  interventions: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    type_reclamation: claim?.type_reclamation || '',
    priorite: claim?.priorite || 'normale',
    statut: claim?.statut || 'ouverte',
    nom_client: claim?.nom_client || '',
    telephone_client: claim?.telephone_client || '',
    email_client: claim?.email_client || '',
    adresse_client: claim?.adresse_client || '',
    employe_id: claim?.employe_id || '',
    intervention_id: claim?.intervention_id || '',
    description_probleme: claim?.description_probleme || '',
    description_solution: claim?.description_solution || '',
    satisfaction_client: claim?.satisfaction_client || '',
    commentaires_client: claim?.commentaires_client || '',
    commentaires_internes: claim?.commentaires_internes || '',
    cout_reclamation: claim?.cout_reclamation || '',
    indemnisation: claim?.indemnisation || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type_reclamation">Type de Réclamation</Label>
          <Select value={formData.type_reclamation} onValueChange={(value) => setFormData({...formData, type_reclamation: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technique">Technique</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="facturation">Facturation</SelectItem>
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
              <SelectItem value="basse">Basse</SelectItem>
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
              <SelectItem value="annulee">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="nom_client">Nom du Client</Label>
          <Input
            id="nom_client"
            value={formData.nom_client}
            onChange={(e) => setFormData({...formData, nom_client: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="telephone_client">Téléphone Client</Label>
          <Input
            id="telephone_client"
            value={formData.telephone_client}
            onChange={(e) => setFormData({...formData, telephone_client: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="email_client">Email Client</Label>
          <Input
            id="email_client"
            type="email"
            value={formData.email_client}
            onChange={(e) => setFormData({...formData, email_client: e.target.value})}
            className="glass-card border border-white/20"
          />
        </div>
        <div>
          <Label htmlFor="employe_id">Employé Assigné</Label>
          <Select value={formData.employe_id} onValueChange={(value) => setFormData({...formData, employe_id: value})}>
            <SelectTrigger className="glass-card border border-white/20">
              <SelectValue placeholder="Sélectionner un employé" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
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
              {interventions.map((inter) => (
                <SelectItem key={inter.id} value={inter.id.toString()}>
                  {inter.num_inter} - {inter.client}
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
          rows={3}
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
          rows={3}
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
