"use client"

import type React from "react"

import { useState } from "react"
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
  Trash2,
  Package,
  CreditCard,
  AlertTriangle,
  BarChart3,
  PieChartIcon,
  Activity,
  DollarSign,
  Fuel,
  Calendar,
} from "lucide-react"

// Dummy user data
const users = {
  superadmin: { email: "admin@fibertech.com", password: "admin123", role: "superadmin", name: "Admin Principal" },
  teamlead: { email: "chef@fibertech.com", password: "chef123", role: "teamlead", name: "Chef Équipe" },
  activity: { email: "activite@fibertech.com", password: "activite123", role: "activity", name: "Conduite Activité" },
}

// Dummy data for dashboard
const employeeData = [
  {
    id: 1,
    name: "Jean Dupont",
    phone: "06 12 34 56 78",
    revenue: 15420,
    operations: 28,
    efficiency: 92,
    fuelCost: 340,
    paymentTax: 15,
  },
  {
    id: 2,
    name: "Marie Martin",
    phone: "06 23 45 67 89",
    revenue: 18750,
    operations: 35,
    efficiency: 88,
    fuelCost: 420,
    paymentTax: 18,
  },
  {
    id: 3,
    name: "Pierre Durand",
    phone: "06 34 56 78 90",
    revenue: 12300,
    operations: 22,
    efficiency: 85,
    fuelCost: 280,
    paymentTax: 12,
  },
  {
    id: 4,
    name: "Sophie Bernard",
    phone: "06 45 67 89 01",
    revenue: 21200,
    operations: 42,
    efficiency: 95,
    fuelCost: 380,
    paymentTax: 20,
  },
]

const recentOperations = [
  { id: 1, employee: "Jean Dupont", client: "Client A", type: "Installation", status: "Terminé", revenue: 450 },
  { id: 2, employee: "Marie Martin", client: "Client B", type: "SAV", status: "En cours", revenue: 280 },
  { id: 3, employee: "Pierre Durand", client: "Client C", type: "Installation", status: "Terminé", revenue: 520 },
]

// Dummy data for team lead features
const materialsData = [
  { id: 1, name: "Câble Fibre Optique 100m", category: "Câblage", stock: 45, minStock: 10, price: 120 },
  { id: 2, name: "Boîtier de Raccordement", category: "Équipement", stock: 23, minStock: 5, price: 85 },
  { id: 3, name: "Connecteur SC/APC", category: "Connectique", stock: 156, minStock: 50, price: 12 },
  { id: 4, name: "Soudeuse Optique", category: "Outillage", stock: 3, minStock: 2, price: 2500 },
]

const fuelCardsData = [
  { id: 1, cardNumber: "1234-5678-9012", employee: "Jean Dupont", balance: 450, status: "active" },
  { id: 2, cardNumber: "2345-6789-0123", employee: "Marie Martin", balance: 320, status: "active" },
  { id: 3, cardNumber: "3456-7890-1234", employee: null, balance: 500, status: "available" },
  { id: 4, cardNumber: "4567-8901-2345", employee: "Pierre Durand", balance: 180, status: "blocked" },
]

const claimsData = [
  {
    id: 1,
    employee: "Jean Dupont",
    type: "Réclamation",
    description: "Retard sur intervention",
    amount: 50,
    date: "2025-01-15",
    createdBy: "admin",
    createdByRole: "superadmin",
    status: "pending",
  },
  {
    id: 2,
    employee: "Marie Martin",
    type: "Pénalité",
    description: "Matériel endommagé",
    amount: 100,
    date: "2025-01-14",
    createdBy: "chef@fibertech.com",
    createdByRole: "teamlead",
    status: "approved",
  },
]

const penaltiesData = [
  {
    id: 1,
    employee: "Pierre Durand",
    type: "Retard livraison",
    description: "Client mécontent - 2h de retard",
    amount: 50,
    date: "2024-01-12",
    status: "active",
  },
  {
    id: 2,
    employee: "Jean Dupont",
    type: "Matériel endommagé",
    description: "Câble coupé par négligence",
    amount: 75,
    date: "2024-01-10",
    status: "paid",
  },
]

const monthlyRevenueData = [
  { month: "Jan", revenue: 45000, operations: 85, fuel: 3200 },
  { month: "Fév", revenue: 52000, operations: 92, fuel: 3800 },
  { month: "Mar", revenue: 48000, operations: 88, fuel: 3500 },
  { month: "Avr", revenue: 61000, operations: 105, fuel: 4200 },
  { month: "Mai", revenue: 67670, operations: 127, fuel: 4800 },
]

const employeePerformanceData = [
  { name: "Jean Martin", revenue: 18500, efficiency: 92 },
  { name: "Marie Dubois", revenue: 22100, efficiency: 88 },
  { name: "Pierre Leroy", revenue: 15200, efficiency: 85 },
  { name: "Sophie Bernard", revenue: 11870, efficiency: 94 },
]

const operationTypeData = [
  { name: "Installation", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Maintenance", value: 30, color: "hsl(var(--chart-2))" },
  { name: "Réparation", value: 20, color: "hsl(var(--chart-3))" },
  { name: "Diagnostic", value: 5, color: "hsl(var(--chart-4))" },
]

const fuelConsumptionData = [
  { day: "Lun", consumption: 45 },
  { day: "Mar", consumption: 52 },
  { day: "Mer", consumption: 38 },
  { day: "Jeu", consumption: 61 },
  { day: "Ven", consumption: 48 },
  { day: "Sam", consumption: 35 },
  { day: "Dim", consumption: 28 },
]

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
    console.log(
      "[v0] Données carburant sauvegardées:",
      result.saved,
      "nouvelles,",
      result.duplicates,
      "doublons ignorés",
    )
    return result
  } catch (error) {
    console.error("[v0] Erreur sauvegarde carburant:", error)
    throw error
  }
}

let setImportedInterventions: React.Dispatch<React.SetStateAction<any[]>>
let setImportedFuelData: React.Dispatch<React.SetStateAction<any[]>>

const loadInterventionsFromDatabase = async () => {
  try {
    const response = await fetch("/api/interventions")
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des interventions")
    }
    const data = await response.json()
    setImportedInterventions(data.interventions || [])
    console.log("[v0] Interventions chargées depuis la base:", data.interventions?.length || 0)
  } catch (error) {
    console.error("[v0] Erreur chargement interventions:", error)
  }
}

const loadFuelDataFromDatabase = async () => {
  try {
    const response = await fetch("/api/carburant")
    if (!response.ok) {
      throw new Error("Erreur lors du chargement des données carburant")
    }
    const data = await response.json()
    setImportedFuelData(data.carburant || [])
    console.log("[v0] Données carburant chargées depuis la base:", data.carburant?.length || 0)
  } catch (error) {
    console.error("[v0] Erreur chargement carburant:", error)
  }
}

export default function EmployeeTracker() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")

  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false)
  const [isAddClaimOpen, setIsAddClaimOpen] = useState(false)
  const [isAddPenaltyOpen, setIsAddPenaltyOpen] = useState(false)
  const [isAssignMaterialOpen, setIsAssignMaterialOpen] = useState(false)
  const [isAssignFuelCardOpen, setIsAssignFuelCardOpen] = useState(false)
  const [isAddFuelCardOpen, setIsAddFuelCardOpen] = useState(false)
  const [isEditFuelCardOpen, setIsEditFuelCardOpen] = useState(false)
  const [selectedFuelCard, setSelectedFuelCard] = useState<any>(null)

  const [_importedInterventions, _setImportedInterventions] = useState<any[]>([])
  const [_importedFuelData, _setImportedFuelData] = useState<any[]>([])
  setImportedInterventions = _setImportedInterventions
  setImportedFuelData = _setImportedFuelData
  const [showInterventions, setShowInterventions] = useState(false)
  const [showFuelData, setShowFuelData] = useState(false)

  const [employees, setEmployees] = useState([
    {
      id: 1,
      firstName: "Jean",
      lastName: "Dupont",
      phone: "0612345678",
      taxPayment: 15,
      fuelCardNumber: "1234-5678-9012",
    },
    {
      id: 2,
      firstName: "Marie",
      lastName: "Martin",
      phone: "0623456789",
      taxPayment: 18,
      fuelCardNumber: "2345-6789-0123",
    },
    { id: 3, firstName: "Pierre", lastName: "Durand", phone: "0634567890", taxPayment: 12, fuelCardNumber: null },
    {
      id: 4,
      firstName: "Sophie",
      lastName: "Bernard",
      phone: "0645678901",
      taxPayment: 20,
      fuelCardNumber: "4567-8901-2345",
    },
  ])
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [newClaim, setNewClaim] = useState({ employee: "", type: "Réclamation", description: "", amount: 0 })
  const [claims, setClaims] = useState(claimsData)

  const handleImportInterventions = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split("\n")
          const headers = lines[0].split(",")
          const data = lines
            .slice(1)
            .map((line) => {
              const values = line.split(",")
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim() || ""
              })
              return obj
            })
            .filter((row) => Object.values(row).some((val) => val !== ""))

          console.log("[v0] Interventions parsées:", data.length, "lignes")

          // Save to database with duplicate checking
          const result = await saveInterventionsToDatabase(data)

          // Reload from database to get updated data
          await loadInterventionsFromDatabase()

          alert(
            `Import terminé: ${result.saved} nouvelles interventions ajoutées, ${result.duplicates} doublons ignorés`,
          )
        } catch (error) {
          console.error("[v0] Erreur import interventions:", error)
          alert("Erreur lors de l'import des interventions")
        }
      }
      reader.readAsText(file)
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
          const headers = lines[0]?.split("\t") || []
          const rows = lines
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
          resolve(rows)
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
        let data: any[] = []

        if (file.name.endsWith(".xlsx")) {
          data = await parseXLSX(file)
          console.log("[v0] Données carburant XLSX parsées:", data.length, "lignes")
        } else {
          // CSV fallback
          const reader = new FileReader()
          reader.onload = async (e) => {
            try {
              const text = e.target?.result as string
              const lines = text.split("\n")
              const headers = lines[0].split(",")
              data = lines
                .slice(1)
                .map((line) => {
                  const values = line.split(",")
                  const obj: any = {}
                  headers.forEach((header, index) => {
                    obj[header.trim()] = values[index]?.trim() || ""
                  })
                  return obj
                })
                .filter((row) => Object.values(row).some((val) => val !== ""))

              console.log("[v0] Données carburant CSV parsées:", data.length, "lignes")

              // Save to database
              const result = await saveFuelDataToDatabase(data)

              // Reload from database
              await loadFuelDataFromDatabase()

              alert(
                `Import terminé: ${result.saved} nouvelles données carburant ajoutées, ${result.duplicates} doublons ignorés`,
              )
            } catch (error) {
              console.error("[v0] Erreur import carburant:", error)
              alert("Erreur lors de l'import des données carburant")
            }
          }
          reader.readAsText(file)
          return
        }

        // For XLSX files
        if (data.length > 0) {
          const result = await saveFuelDataToDatabase(data)
          await loadFuelDataFromDatabase()
          alert(
            `Import terminé: ${result.saved} nouvelles données carburant ajoutées, ${result.duplicates} doublons ignorés`,
          )
        }
      } catch (error) {
        console.error("[v0] Erreur import carburant:", error)
        alert("Erreur lors de l'import des données carburant")
      }
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    const user = Object.values(users).find((u) => u.email === email && u.password === password)

    if (user) {
      setCurrentUser(user)
      setIsLoggedIn(true)
    } else {
      setLoginError("Email ou mot de passe incorrect")
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setEmail("")
    setPassword("")
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-accent text-accent-foreground"
      case "teamlead":
        return "bg-chart-2 text-white"
      case "activity":
        return "bg-chart-1 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin"
      case "teamlead":
        return "Chef d'Équipe"
      case "activity":
        return "Conduite d'Activité"
      default:
        return role
    }
  }

  const renderEmployeesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Gestion des Employés</h2>
          <p className="text-muted-foreground">Gérer les employés et leurs affectations</p>
        </div>
        <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter Employé
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel Employé</DialogTitle>
              <DialogDescription>Ajouter un nouvel employé à l'équipe</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input id="firstName" placeholder="Jean" />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input id="lastName" placeholder="Dupont" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Numéro de Téléphone *</Label>
                <Input id="phone" placeholder="06 12 34 56 78" />
              </div>
              <div>
                <Label htmlFor="taxPayment">Pourcentage Tax-Payment *</Label>
                <div className="relative">
                  <Input id="taxPayment" type="number" placeholder="15" min="0" max="100" />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="position">Poste</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un poste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Technicien</SelectItem>
                    <SelectItem value="installer">Installateur</SelectItem>
                    <SelectItem value="supervisor">Superviseur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => setIsAddEmployeeOpen(false)}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {employeeData.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{employee.name}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>📞 {employee.phone}</span>
                    <span>Tax: {employee.paymentTax}%</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Revenus: {employee.revenue.toLocaleString()} €</span>
                    <span>Opérations: {employee.operations}</span>
                    <span>Efficacité: {employee.efficiency}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderMaterialsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Gestion des Matériels</h2>
          <p className="text-muted-foreground">Stock et inventaire des équipements</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAssignMaterialOpen} onOpenChange={setIsAssignMaterialOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Assigner Matériel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner Matériel</DialogTitle>
                <DialogDescription>Assigner des matériaux à un employé</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employé</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeData.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Matériaux (sélection multiple)</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {materialsData.map((material) => (
                      <div key={material.id} className="flex items-center space-x-2">
                        <Checkbox id={`material-${material.id}`} />
                        <Label htmlFor={`material-${material.id}`} className="text-sm">
                          {material.name} (Stock: {material.stock})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input id="quantity" type="number" placeholder="1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignMaterialOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAssignMaterialOpen(false)}>Assigner</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Matériel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau Matériel</DialogTitle>
                <DialogDescription>Ajouter un nouveau matériel au stock</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="materialName">Nom du matériel</Label>
                  <Input id="materialName" placeholder="Câble Fibre Optique" />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cabling">Câblage</SelectItem>
                      <SelectItem value="equipment">Équipement</SelectItem>
                      <SelectItem value="connectivity">Connectique</SelectItem>
                      <SelectItem value="tools">Outillage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Stock initial</Label>
                    <Input id="stock" type="number" placeholder="10" />
                  </div>
                  <div>
                    <Label htmlFor="minStock">Stock minimum</Label>
                    <Input id="minStock" type="number" placeholder="5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="price">Prix unitaire (€)</Label>
                  <Input id="price" type="number" placeholder="50" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMaterialOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAddMaterialOpen(false)}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {materialsData.map((material) => (
          <Card key={material.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{material.name}</h3>
                    <Badge variant="outline">{material.category}</Badge>
                    {material.stock <= material.minStock && <Badge variant="destructive">Stock faible</Badge>}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Stock: {material.stock}</span>
                    <span>Min: {material.minStock}</span>
                    <span>Prix: {material.price} €</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderClaimsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Réclamations & Pénalités</h2>
          <p className="text-muted-foreground">Gestion des réclamations et pénalités</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddPenaltyOpen} onOpenChange={setIsAddPenaltyOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Ajouter Pénalité
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Pénalité</DialogTitle>
                <DialogDescription>Ajouter une pénalité à un employé</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employé</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeData.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="penaltyType">Type de pénalité</Label>
                  <Input id="penaltyType" placeholder="Retard livraison" />
                </div>
                <div>
                  <Label htmlFor="penaltyDescription">Description</Label>
                  <Textarea id="penaltyDescription" placeholder="Détails de la pénalité..." />
                </div>
                <div>
                  <Label htmlFor="penaltyAmount">Montant (€)</Label>
                  <Input id="penaltyAmount" type="number" placeholder="50" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPenaltyOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAddPenaltyOpen(false)}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddClaimOpen} onOpenChange={setIsAddClaimOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Réclamation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Réclamation</DialogTitle>
                <DialogDescription>Ajouter une réclamation d'employé</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employé</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeData.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="claimType">Type de réclamation</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Matériel défectueux</SelectItem>
                      <SelectItem value="travel">Frais de déplacement</SelectItem>
                      <SelectItem value="overtime">Heures supplémentaires</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="claimDescription">Description</Label>
                  <Textarea id="claimDescription" placeholder="Détails de la réclamation..." />
                </div>
                <div>
                  <Label htmlFor="claimAmount">Montant (€)</Label>
                  <Input id="claimAmount" type="number" placeholder="100" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddClaimOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAddClaimOpen(false)}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Réclamations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claimsData.map((claim) => (
                <div key={claim.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{claim.employee}</p>
                    <p className="text-sm text-muted-foreground">{claim.type}</p>
                    <p className="text-xs text-muted-foreground">{claim.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        claim.status === "approved"
                          ? "default"
                          : claim.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {claim.status === "approved"
                        ? "Approuvée"
                        : claim.status === "rejected"
                          ? "Rejetée"
                          : "En attente"}
                    </Badge>
                    <p className="text-sm font-medium mt-1">{claim.amount} €</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pénalités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {penaltiesData.map((penalty) => (
                <div key={penalty.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{penalty.employee}</p>
                    <p className="text-sm text-muted-foreground">{penalty.type}</p>
                    <p className="text-xs text-muted-foreground">{penalty.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={penalty.status === "paid" ? "default" : "destructive"}>
                      {penalty.status === "paid" ? "Payée" : "Active"}
                    </Badge>
                    <p className="text-sm font-medium mt-1">{penalty.amount} €</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderFuelCardsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Cartes Carburant</h2>
          <p className="text-muted-foreground">Gestion des cartes carburant des employés</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddFuelCardOpen} onOpenChange={setIsAddFuelCardOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Carte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle Carte Carburant</DialogTitle>
                <DialogDescription>Créer une nouvelle carte carburant</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Numéro de Carte</Label>
                  <Input id="cardNumber" placeholder="1234-5678-9012-3456" />
                </div>
                <div>
                  <Label htmlFor="initialBalance">Solde Initial</Label>
                  <div className="relative">
                    <Input id="initialBalance" type="number" placeholder="500" />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddFuelCardOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAddFuelCardOpen(false)}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAssignFuelCardOpen} onOpenChange={setIsAssignFuelCardOpen}>
            <DialogTrigger asChild>
              <Button>
                <CreditCard className="w-4 h-4 mr-2" />
                Assigner Carte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assigner Carte Carburant</DialogTitle>
                <DialogDescription>Assigner une carte carburant à un employé</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Carte disponible</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une carte" />
                    </SelectTrigger>
                    <SelectContent>
                      {fuelCardsData
                        .filter((card) => card.status === "available")
                        .map((card) => (
                          <SelectItem key={card.id} value={card.id.toString()}>
                            {card.cardNumber} (Solde: {card.balance} €)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Employé</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeData.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignFuelCardOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setIsAssignFuelCardOpen(false)}>Assigner</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {fuelCardsData.map((card) => (
          <Card key={card.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{card.cardNumber}</h3>
                    <Badge
                      variant={
                        card.status === "active" ? "default" : card.status === "blocked" ? "destructive" : "secondary"
                      }
                    >
                      {card.status === "active" ? "Active" : card.status === "blocked" ? "Bloquée" : "Disponible"}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Employé: {card.employee || "Non assignée"}</span>
                    <span>Solde: {card.balance} €</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFuelCard(card)
                      setIsEditFuelCardOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {card.status === "active" && (
                    <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                      Bloquer
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-destructive bg-transparent">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditFuelCardOpen} onOpenChange={setIsEditFuelCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier Carte Carburant</DialogTitle>
            <DialogDescription>Modifier les informations de la carte carburant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCardNumber">Numéro de Carte</Label>
              <Input
                id="editCardNumber"
                defaultValue={selectedFuelCard?.cardNumber}
                placeholder="1234-5678-9012-3456"
              />
            </div>
            <div>
              <Label htmlFor="editBalance">Solde</Label>
              <div className="relative">
                <Input id="editBalance" type="number" defaultValue={selectedFuelCard?.balance} placeholder="500" />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>
            <div>
              <Label>Statut</Label>
              <Select defaultValue={selectedFuelCard?.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Bloquée</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditFuelCardOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setIsEditFuelCardOpen(false)}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-balance">FiberTech Manager</CardTitle>
              <CardDescription className="text-pretty">Système de suivi des performances des employés</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {loginError && <p className="text-sm text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>

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
            <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                FiberTech Manager
              </h1>
              <p className="text-sm text-muted-foreground">Performance Intelligence Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="glass-card px-4 py-2 rounded-full border border-white/20">
              <Badge className={`${getRoleColor(currentUser.role)} border-0 shadow-sm`}>
                {getRoleLabel(currentUser.role)}
              </Badge>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">Connecté</p>
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
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Navigation</h2>
            </div>

            {currentUser.role !== "activity" && (
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                  activeTab === "dashboard"
                    ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                    : "glass-card border border-white/20 hover:bg-primary/5"
                }`}
                onClick={() => setActiveTab("dashboard")}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Tableau de bord</span>
              </Button>
            )}

            {(currentUser.role === "superadmin" || currentUser.role === "teamlead") && (
              <Button
                variant={activeTab === "employees" ? "default" : "ghost"}
                className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                  activeTab === "employees"
                    ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                    : "glass-card border border-white/20 hover:bg-primary/5"
                }`}
                onClick={() => setActiveTab("employees")}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Employés</span>
              </Button>
            )}

            {(currentUser.role === "superadmin" || currentUser.role === "teamlead") && (
              <>
                <div className="pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Gestion</h3>
                </div>

                <Button
                  variant={activeTab === "claims" ? "default" : "ghost"}
                  className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                    activeTab === "claims"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
                  onClick={() => setActiveTab("claims")}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Réclamations</span>
                </Button>

                <Button
                  variant={activeTab === "materials" ? "default" : "ghost"}
                  className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                    activeTab === "materials"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
                  onClick={() => setActiveTab("materials")}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Matériels</span>
                </Button>

                <Button
                  variant={activeTab === "fuelcards" ? "default" : "ghost"}
                  className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                    activeTab === "fuelcards"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
                  onClick={() => setActiveTab("fuelcards")}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">Cartes Carburant</span>
                </Button>
              </>
            )}

            {currentUser.role === "activity" && (
              <>
                <Button
                  variant={activeTab === "employees-view" ? "default" : "ghost"}
                  className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                    activeTab === "employees-view"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
                  onClick={() => setActiveTab("employees-view")}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Employés</span>
                </Button>

                <Button
                  variant={activeTab === "claims-activity" ? "default" : "ghost"}
                  className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                    activeTab === "claims-activity"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
                  onClick={() => setActiveTab("claims-activity")}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Réclamations & Pénalités</span>
                </Button>
              </>
            )}

            {currentUser.role === "superadmin" && (
              <>
                <div className="pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Administration
                  </h3>
                </div>

                <Button
                  variant={activeTab === "import" ? "default" : "ghost"}
                  className={`w-full justify-start gap-4 h-12 rounded-xl transition-all duration-300 hover-lift ${
                    activeTab === "import"
                      ? "gradient-primary text-white shadow-lg animate-pulse-glow"
                      : "glass-card border border-white/20 hover:bg-primary/5"
                  }`}
                  onClick={() => setActiveTab("import")}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Import Données</span>
                </Button>
              </>
            )}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "dashboard" && currentUser.role !== "activity" && (
            <div className="space-y-10 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent text-balance">
                      Tableau de Bord
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2 text-pretty">
                      Intelligence des performances et métriques en temps réel
                    </p>
                  </div>
                  <div className="animate-float">
                    <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-2xl">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 via-chart-1/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Revenus Total
                    </CardTitle>
                    <div className="p-3 bg-chart-1/20 rounded-2xl group-hover:bg-chart-1/30 transition-colors">
                      <DollarSign className="h-6 w-6 text-chart-1" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-foreground mb-3">67 670 €</div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full px-3 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12%
                      </Badge>
                      <span className="text-sm text-muted-foreground">ce mois</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-2/20 via-chart-2/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Opérations
                    </CardTitle>
                    <div className="p-3 bg-chart-2/20 rounded-2xl group-hover:bg-chart-2/30 transition-colors">
                      <Activity className="h-6 w-6 text-chart-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-foreground mb-3">127</div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-full px-3 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +8%
                      </Badge>
                      <span className="text-sm text-muted-foreground">ce mois</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-3/20 via-chart-3/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Employés Actifs
                    </CardTitle>
                    <div className="p-3 bg-chart-3/20 rounded-2xl group-hover:bg-chart-3/30 transition-colors">
                      <Users className="h-6 w-6 text-chart-3" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-foreground mb-3">4</div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full px-3 py-1">
                        100%
                      </Badge>
                      <span className="text-sm text-muted-foreground">actifs</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-chart-4/20 via-chart-4/10 to-transparent" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Efficacité Moy.
                    </CardTitle>
                    <div className="p-3 bg-chart-4/20 rounded-2xl group-hover:bg-chart-4/30 transition-colors">
                      <BarChart3 className="h-6 w-6 text-chart-4" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-4xl font-bold text-foreground mb-3">90%</div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 rounded-full px-3 py-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +2%
                      </Badge>
                      <span className="text-sm text-muted-foreground">ce mois</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                      <div className="p-2 bg-chart-1/20 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-chart-1" />
                      </div>
                      Évolution des Revenus
                    </CardTitle>
                    <CardDescription className="text-base">Revenus mensuels et nombre d'opérations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Revenus (€)",
                          color: "hsl(var(--chart-1))",
                        },
                        operations: {
                          label: "Opérations",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[350px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyRevenueData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis dataKey="month" className="text-sm" />
                          <YAxis className="text-sm" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            fill="var(--color-revenue)"
                            fillOpacity={0.3}
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Employee Performance Chart */}
                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                      <div className="p-2 bg-chart-2/20 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-chart-2" />
                      </div>
                      Performance Employés
                    </CardTitle>
                    <CardDescription className="text-base">Revenus par employé ce mois</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: {
                          label: "Revenus (€)",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[350px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={employeePerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis dataKey="name" className="text-sm" />
                          <YAxis className="text-sm" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Operation Types Distribution */}
                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                      <div className="p-2 bg-chart-3/20 rounded-xl">
                        <PieChartIcon className="w-6 h-6 text-chart-3" />
                      </div>
                      Types d'Opérations
                    </CardTitle>
                    <CardDescription className="text-base">Répartition des interventions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        installation: { label: "Installation", color: "hsl(var(--chart-1))" },
                        maintenance: { label: "Maintenance", color: "hsl(var(--chart-2))" },
                        reparation: { label: "Réparation", color: "hsl(var(--chart-3))" },
                        diagnostic: { label: "Diagnostic", color: "hsl(var(--chart-4))" },
                      }}
                      className="h-[350px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={operationTypeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {operationTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Fuel Consumption Chart */}
                <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold">
                      <div className="p-2 bg-chart-4/20 rounded-xl">
                        <Fuel className="w-6 h-6 text-chart-4" />
                      </div>
                      Consommation Carburant
                    </CardTitle>
                    <CardDescription className="text-base">Consommation hebdomadaire (litres)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        consumption: {
                          label: "Consommation (L)",
                          color: "hsl(var(--chart-4))",
                        },
                      }}
                      className="h-[350px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={fuelConsumptionData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis dataKey="day" className="text-sm" />
                          <YAxis className="text-sm" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="consumption"
                            stroke="var(--color-consumption)"
                            strokeWidth={3}
                            dot={{ fill: "var(--color-consumption)", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced employee performance table with glassmorphism */}
              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-chart-2/20 rounded-xl">
                      <Users className="w-6 h-6 text-chart-2" />
                    </div>
                    Performance des Employés
                  </CardTitle>
                  <CardDescription className="text-base">
                    Revenus et statistiques détaillées par employé ce mois
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="[&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-muted-foreground border-b border-white/20">
                          <th>Employé</th>
                          <th>Revenus</th>
                          <th>Opérations</th>
                          <th>Efficacité</th>
                          <th>Carburant</th>
                          <th>Tax %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeData.map((employee, index) => (
                          <tr
                            key={employee.id}
                            className={`hover:bg-white/5 transition-colors ${index % 2 === 0 ? "" : "bg-white/3"}`}
                          >
                            <td className="p-4">
                              <div className="font-semibold text-foreground">{employee.name}</div>
                              <div className="text-sm text-muted-foreground">{employee.phone}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-lg text-foreground">
                                {employee.revenue.toLocaleString()} €
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="font-medium border-white/20 text-foreground">
                                {employee.operations}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={employee.efficiency >= 90 ? "default" : "secondary"}
                                className={`font-medium border-white/20 text-foreground ${
                                  employee.efficiency >= 90 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""
                                }`}
                              >
                                {employee.efficiency}%
                              </Badge>
                            </td>
                            <td className="p-4 font-medium text-foreground">{employee.fuelCost} €</td>
                            <td className="p-4">
                              <Badge variant="outline" className="font-medium border-white/20 text-foreground">
                                {employee.paymentTax}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Modern recent operations list with glassmorphism */}
              <Card className="glass-card border border-white/20 rounded-3xl overflow-hidden hover-lift">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-chart-3/20 rounded-xl">
                      <Calendar className="w-6 h-6 text-chart-3" />
                    </div>
                    Opérations Récentes
                  </CardTitle>
                  <CardDescription className="text-base">
                    Dernières interventions effectuées par l'équipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {recentOperations.map((operation) => (
                      <div
                        key={operation.id}
                        className="flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{operation.employee}</p>
                            <p className="text-sm text-muted-foreground">
                              {operation.client} • {operation.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <Badge
                            className={`font-medium border-white/20 text-foreground ${
                              operation.status === "Terminé" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""
                            }`}
                          >
                            {operation.status}
                          </Badge>
                          <div className="font-bold text-lg text-foreground">{operation.revenue} €</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === "employees-view" && currentUser.role === "activity" && (
            <div className="space-y-6 animate-slide-in-right">
              <div className="glass-card p-8 rounded-3xl border border-white/20 hover-lift">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                    Liste des Employés
                  </h2>
                  <p className="text-muted-foreground mt-2">Consultation des employés (lecture seule)</p>
                </div>
              </div>

              <div className="glass-card rounded-3xl border border-white/20 overflow-hidden hover-lift">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-primary/10 to-chart-2/10 border-b border-white/20">
                      <tr>
                        <th className="text-left p-6 font-semibold">Nom</th>
                        <th className="text-left p-6 font-semibold">Téléphone</th>
                        <th className="text-left p-6 font-semibold">Tax-Payment</th>
                        <th className="text-left p-6 font-semibold">Revenus</th>
                        <th className="text-left p-6 font-semibold">Opérations</th>
                        <th className="text-left p-6 font-semibold">Efficacité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeData.map((employee, index) => (
                        <tr key={employee.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-white font-semibold">
                                {employee.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <span className="font-medium">{employee.name}</span>
                            </div>
                          </td>
                          <td className="p-6 text-muted-foreground">{employee.phone}</td>
                          <td className="p-6">
                            <span className="px-3 py-1 rounded-full bg-chart-1/20 text-chart-1 text-sm font-medium">
                              {employee.paymentTax}%
                            </span>
                          </td>
                          <td className="p-6 font-semibold text-green-600">{employee.revenue.toLocaleString()}€</td>
                          <td className="p-6">{employee.operations}</td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                                  style={{ width: `${employee.efficiency}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{employee.efficiency}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === "employees" && renderEmployeesTab()}
          {activeTab === "materials" && renderMaterialsTab()}
          {activeTab === "claims" && renderClaimsTab()}
          {activeTab === "fuelcards" && renderFuelCardsTab()}

          {activeTab === "employees-view" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold gradient-text">Liste des Employés</h2>
                  <p className="text-muted-foreground mt-2">Consultation des employés (lecture seule)</p>
                </div>
              </div>

              <Card className="glass-card border-white/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Employés Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 font-semibold">Nom</th>
                          <th className="text-left p-4 font-semibold">Prénom</th>
                          <th className="text-left p-4 font-semibold">Téléphone</th>
                          <th className="text-left p-4 font-semibold">Tax Payment</th>
                          <th className="text-left p-4 font-semibold">Carte Carburant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => (
                          <tr key={employee.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">{employee.lastName}</td>
                            <td className="p-4">{employee.firstName}</td>
                            <td className="p-4">{employee.phone}</td>
                            <td className="p-4">{employee.taxPayment}%</td>
                            <td className="p-4">
                              {employee.fuelCardNumber ? (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                                  {employee.fuelCardNumber}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-lg text-sm">
                                  Non assignée
                                </span>
                              )}
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

          {activeTab === "claims-activity" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold gradient-text">Réclamations & Pénalités</h2>
                  <p className="text-muted-foreground mt-2">Saisie et gestion des réclamations et pénalités</p>
                </div>
                <Button
                  onClick={() => setShowClaimModal(true)}
                  className="gradient-primary hover:opacity-90 transition-opacity shadow-lg hover-lift"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Saisie
                </Button>
              </div>

              <Card className="glass-card border-white/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Liste des Réclamations & Pénalités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 font-semibold">Employé</th>
                          <th className="text-left p-4 font-semibold">Type</th>
                          <th className="text-left p-4 font-semibold">Description</th>
                          <th className="text-left p-4 font-semibold">Montant</th>
                          <th className="text-left p-4 font-semibold">Date</th>
                          <th className="text-left p-4 font-semibold">Créé par</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims.map((claim) => (
                          <tr key={claim.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">{claim.employee}</td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-lg text-sm ${
                                  claim.type === "Réclamation"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {claim.type}
                              </span>
                            </td>
                            <td className="p-4">{claim.description}</td>
                            <td className="p-4 font-semibold">{claim.amount}€</td>
                            <td className="p-4">{claim.date}</td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-sm">{claim.createdBy}</span>
                                <span className="text-xs text-muted-foreground">
                                  {claim.createdByRole === "superadmin"
                                    ? "Super Admin"
                                    : claim.createdByRole === "teamlead"
                                      ? "Chef d'Équipe"
                                      : "Conduite d'Activité"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {showClaimModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                  <Card className="glass-card border-white/20 backdrop-blur-xl w-full max-w-md mx-4">
                    <CardHeader>
                      <CardTitle>Nouvelle Réclamation/Pénalité</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Employé</label>
                        <select
                          value={newClaim.employee}
                          onChange={(e) => setNewClaim({ ...newClaim, employee: e.target.value })}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:border-primary/50 focus:outline-none"
                        >
                          <option value="">Sélectionner un employé</option>
                          {employees.map((emp) => (
                            <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>
                              {emp.firstName} {emp.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                          value={newClaim.type}
                          onChange={(e) => setNewClaim({ ...newClaim, type: e.target.value })}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:border-primary/50 focus:outline-none"
                        >
                          <option value="Réclamation">Réclamation</option>
                          <option value="Pénalité">Pénalité</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                          value={newClaim.description}
                          onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:border-primary/50 focus:outline-none"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Montant (€)</label>
                        <input
                          type="number"
                          value={newClaim.amount}
                          onChange={(e) => setNewClaim({ ...newClaim, amount: Number(e.target.value) })}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/20 focus:border-primary/50 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => {
                            const claim = {
                              ...newClaim,
                              id: claims.length + 1,
                              date: new Date().toISOString().split("T")[0],
                              createdBy: currentUser.email,
                              createdByRole: currentUser.role,
                            }
                            setClaims([...claims, claim])
                            setNewClaim({ employee: "", type: "Réclamation", description: "", amount: 0 })
                            setShowClaimModal(false)
                          }}
                          className="flex-1 gradient-primary hover:opacity-90"
                        >
                          Enregistrer
                        </Button>
                        <Button variant="outline" onClick={() => setShowClaimModal(false)} className="flex-1">
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {activeTab === "import" && currentUser.role === "superadmin" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Import de Données</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Import Interventions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Import Interventions
                    </CardTitle>
                    <CardDescription>Importer les données d'interventions depuis un fichier CSV</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="import-inter">Fichier CSV Interventions</Label>
                      <Input
                        id="import-inter"
                        type="file"
                        accept=".csv"
                        onChange={handleImportInterventions}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        if (_importedInterventions.length === 0) {
                          await loadInterventionsFromDatabase()
                        }
                        setShowInterventions(!showInterventions)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Afficher Données Importées ({_importedInterventions.length})
                    </Button>
                  </CardContent>
                </Card>

                {/* Import Fuel Consumption */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Import Carburant Consommation
                    </CardTitle>
                    <CardDescription>
                      Importer les données de consommation carburant depuis un fichier CSV
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="import-fuel">Fichier XLSX/CSV Carburant</Label>
                      <Input
                        id="import-fuel"
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={handleImportFuelConsumption}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        if (_importedFuelData.length === 0) {
                          await loadFuelDataFromDatabase()
                        }
                        setShowFuelData(!showFuelData)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Afficher Données Importées ({_importedFuelData.length})
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {showInterventions && _importedInterventions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Données Interventions Importées
                    </CardTitle>
                    <CardDescription>{_importedInterventions.length} lignes importées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{_importedInterventions.length}</div>
                          <div className="text-sm text-muted-foreground">Total Interventions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {_importedInterventions[0] ? Object.keys(_importedInterventions[0]).length : 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Colonnes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {
                              new Set(_importedInterventions.map((row) => row.Technicien || row.technicien || "N/A"))
                                .size
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">Techniciens Uniques</div>
                        </div>
                      </div>

                      {/* Structured Data Display */}
                      <div className="overflow-x-auto max-h-96 border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              {_importedInterventions[0] &&
                                Object.keys(_importedInterventions[0]).map((key) => (
                                  <th key={key} className="text-left p-3 font-semibold border-r last:border-r-0">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{key}</span>
                                      <span className="text-xs text-muted-foreground font-normal">
                                        {typeof _importedInterventions[0][key]}
                                      </span>
                                    </div>
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {_importedInterventions.slice(0, 20).map((row, index) => (
                              <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                                {Object.entries(row).map(([key, value]: [string, any], i) => (
                                  <td key={i} className="p-3 border-r last:border-r-0 align-top">
                                    <div className="max-w-xs">
                                      {value && value.toString().length > 50 ? (
                                        <div className="group relative">
                                          <span className="truncate block">{value.toString().substring(0, 50)}...</span>
                                          <div className="absolute z-10 invisible group-hover:visible bg-popover border rounded p-2 shadow-lg max-w-sm">
                                            {value.toString()}
                                          </div>
                                        </div>
                                      ) : (
                                        <span
                                          className={`${!value || value === "" ? "text-muted-foreground italic" : ""}`}
                                        >
                                          {value || "Vide"}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {_importedInterventions.length > 20 && (
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Affichage des 20 premières lignes sur {_importedInterventions.length} total
                          </p>
                          <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                            Voir plus de données
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {showFuelData && _importedFuelData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Données Carburant Importées
                    </CardTitle>
                    <CardDescription>{_importedFuelData.length} lignes importées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{_importedFuelData.length}</div>
                          <div className="text-sm text-muted-foreground">Total Transactions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {_importedFuelData[0] ? Object.keys(_importedFuelData[0]).length : 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Colonnes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {new Set(_importedFuelData.map((row) => row.Carte || row.carte || "N/A")).size}
                          </div>
                          <div className="text-sm text-muted-foreground">Cartes Uniques</div>
                        </div>
                      </div>

                      {/* Structured Data Display */}
                      <div className="overflow-x-auto max-h-96 border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 sticky top-0">
                            <tr>
                              {_importedFuelData[0] &&
                                Object.keys(_importedFuelData[0]).map((key) => (
                                  <th key={key} className="text-left p-3 font-semibold border-r last:border-r-0">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{key}</span>
                                      <span className="text-xs text-muted-foreground font-normal">
                                        {typeof _importedFuelData[0][key]}
                                      </span>
                                    </div>
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {_importedFuelData.slice(0, 20).map((row, index) => (
                              <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                                {Object.entries(row).map(([key, value]: [string, any], i) => (
                                  <td key={i} className="p-3 border-r last:border-r-0 align-top">
                                    <div className="max-w-xs">
                                      {value && value.toString().length > 50 ? (
                                        <div className="group relative">
                                          <span className="truncate block">{value.toString().substring(0, 50)}...</span>
                                          <div className="absolute z-10 invisible group-hover:visible bg-popover border rounded p-2 shadow-lg max-w-sm">
                                            {value.toString()}
                                          </div>
                                        </div>
                                      ) : (
                                        <span
                                          className={`${!value || value === "" ? "text-muted-foreground italic" : ""}`}
                                        >
                                          {value || "Vide"}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {_importedFuelData.length > 20 && (
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Affichage des 20 premières lignes sur {_importedFuelData.length} total
                          </p>
                          <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                            Voir plus de données
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
