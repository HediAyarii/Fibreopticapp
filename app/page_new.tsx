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
      loadAllCRUDData()
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
          {activeTab === "employees" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">Gestion des Employés</h2>
                  <p className="text-muted-foreground">Gérer les employés et leurs affectations</p>
                </div>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel Employé
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employeesFromInterventions.map((employee) => (
                  <Card key={employee.id} className="glass-card border border-white/20 hover-lift">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{employee.name}</CardTitle>
                          <CardDescription className="text-sm">{employee.status}</CardDescription>
                        </div>
                        <Badge variant={employee.status === "Disponible" ? "default" : "secondary"}>
                          {employee.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Téléphone:</span>
                          <span className="text-sm">{employee.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Localisation:</span>
                          <span className="text-sm">{employee.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Interventions:</span>
                          <span className="font-semibold">{employee.interventions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Revenus:</span>
                          <span className="font-semibold">{employee.revenue?.toLocaleString()} €</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Users className="w-4 h-4 mr-1" />
                          Affecter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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

          {/* Other tabs placeholder */}
          {activeTab !== "dashboard" && activeTab !== "employees" && activeTab !== "fuel-consumption" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">
                    {activeTab === "interventions" && "Interventions"}
                    {activeTab === "fuel" && "Carburant"}
                    {activeTab === "materials" && "Matériel"}
                    {activeTab === "penalties" && "Pénalités"}
                    {activeTab === "claims" && "Réclamations"}
                    {activeTab === "reports" && "Rapports"}
                  </h2>
                  <p className="text-muted-foreground">
                    {activeTab === "interventions" && "Gestion des interventions"}
                    {activeTab === "fuel" && "Gestion du carburant"}
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

              <Card className="glass-card border border-white/20 hover-lift">
                <CardHeader>
                  <CardTitle>Contenu en développement</CardTitle>
                  <CardDescription>
                    Cette section sera bientôt disponible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Le contenu de cette section est en cours de développement.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
