"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { 
  User, 
  LogOut, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Home,
  Settings,
  FileText,
  Wrench,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/authManager'
import { NotificationCenter } from '@/components/NotificationCenter'
import { NotificationManager } from '@/components/NotificationManager'
import { SimpleNotificationManager } from '@/components/SimpleNotificationManager'

interface User {
  id: number
  username: string
  prenom: string
  nom: string
  matricule: string
  niveau_acces: string
}

interface Intervention {
  id: number
  num_inter: string
  client: string
  date_rdv: string
  type_intervention: string
  statut: string
  articles?: string
}

interface Reclamation {
  id: number
  numero_reclamation: string
  client: string
  type_reclamation: string
  statut: string
  priorite: string
  date_creation: string
}

interface Penalite {
  id: number
  numero_penalite: string
  montant: number
  statut: string
  motif: string
  date_echeance: string
}

export default function TechnicienDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [penalites, setPenalites] = useState<Penalite[]>([])
  const [stats, setStats] = useState({
    totalInterventions: 0,
    interventionsMois: 0,
    chiffreAffaire: 0,
    penalites: 0,
    reclamations: 0
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const itemsPerPage = 10
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  // Vérification périodique de l'authentification (toutes les 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkAuth()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    if (user) {
      loadData()
      
      // Mise à jour automatique des données toutes les 5 secondes
      const dataInterval = setInterval(() => {
        console.log('🔄 Mise à jour automatique des données...')
        loadData()
      }, 5000) // 5 secondes
      
      return () => clearInterval(dataInterval)
    }
  }, [user])

  const checkAuth = async () => {
    try {
      console.log('Vérification de l\'authentification...')
      const response = await fetchWithAuth('/api/auth/technicien')
      const data = await response.json()
      
      console.log('Réponse auth:', response.status, data)

      if (response.ok) {
        console.log('Utilisateur authentifié:', data.user)
        setUser(data.user)
      }
    } catch (error) {
      console.log('Erreur auth ou session expirée:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    if (!user) return

    try {
      setIsUpdating(true)
      console.log(`📊 Chargement des données pour l'employé ${user.id}...`)
      
      // Charger toutes les données en parallèle pour de meilleures performances
      const [interventionsResponse, reclamationsResponse, penalitesResponse] = await Promise.all([
        fetchWithAuth(`/api/interventions?employe_id=${user.id}`),
        fetchWithAuth(`/api/reclamations?employe_id=${user.id}`),
        fetchWithAuth(`/api/penalites?employe_id=${user.id}`)
      ])

      // Traiter les interventions
      const interventionsData = await interventionsResponse.json()
      if (interventionsData.interventions) {
        const previousCount = interventions.length
        setInterventions(interventionsData.interventions)
        
        if (interventionsData.interventions.length !== previousCount) {
          console.log(`📈 Interventions mises à jour: ${previousCount} → ${interventionsData.interventions.length}`)
        }
        
        // Calculer les statistiques
        const totalInterventions = interventionsData.interventions.length
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        
        const interventionsMois = interventionsData.interventions.filter((inter: Intervention) => {
          const interDate = new Date(inter.date_rdv)
          return interDate.getMonth() === currentMonth && interDate.getFullYear() === currentYear
        }).length

        setStats(prev => ({
          ...prev,
          totalInterventions,
          interventionsMois
        }))
      }

      // Traiter les réclamations
      const reclamationsData = await reclamationsResponse.json()
      if (reclamationsData.reclamations) {
        const previousCount = reclamations.length
        setReclamations(reclamationsData.reclamations)
        
        if (reclamationsData.reclamations.length !== previousCount) {
          console.log(`📨 Réclamations mises à jour: ${previousCount} → ${reclamationsData.reclamations.length}`)
        }
        
        setStats(prev => ({
          ...prev,
          reclamations: reclamationsData.reclamations.length
        }))
      }

      // Traiter les pénalités
      const penalitesData = await penalitesResponse.json()
      if (penalitesData.penalites) {
        const previousCount = penalites.length
        setPenalites(penalitesData.penalites)
        
        if (penalitesData.penalites.length !== previousCount) {
          console.log(`💰 Pénalités mises à jour: ${previousCount} → ${penalitesData.penalites.length}`)
        }
        
        setStats(prev => ({
          ...prev,
          penalites: penalitesData.penalites.length
        }))
      }

      console.log('✅ Données mises à jour avec succès')
      setLastUpdate(new Date())

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/auth/technicien', { method: 'DELETE' })
      setUser(null)
      router.push('/logintech')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, rediriger
      setUser(null)
      router.push('/logintech')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'terminé':
      case 'terminée':
      case 'cloture':
      case 'clôturé':
        return 'bg-green-100 text-green-800'
      case 'en cours':
      case 'en_cours':
        return 'bg-blue-100 text-blue-800'
      case 'en attente':
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800'
      case 'annulé':
      case 'annulee':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critique':
        return 'bg-red-100 text-red-800'
      case 'haute':
        return 'bg-orange-100 text-orange-800'
      case 'moyenne':
        return 'bg-yellow-100 text-yellow-800'
      case 'basse':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredInterventions = interventions.filter(intervention =>
    intervention.num_inter.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intervention.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intervention.type_intervention.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedInterventions = filteredInterventions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Session expirée. Redirection vers la page de connexion...
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dashboard Technicien</h1>
                <p className="text-sm text-gray-500">FinalFibre</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs text-gray-500">{user.matricule}</p>
                {lastUpdate && (
                  <p className="text-xs text-gray-400">
                    Mis à jour: {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isUpdating && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Mise à jour...</span>
                  </div>
                )}
                <NotificationCenter employeeId={user.id} />
                <NotificationManager employeeId={user.id} />
                <SimpleNotificationManager employeeId={user.id} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab('interventions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'interventions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Mes Interventions
              </button>
              <button
                onClick={() => setActiveTab('reclamations')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reclamations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Réclamations
              </button>
              <button
                onClick={() => setActiveTab('penalites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'penalites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Pénalités
              </button>
            </nav>
            
            {/* Indicateur de statut temps réel */}
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-gray-500">
                {isUpdating ? 'Mise à jour...' : 'Temps réel'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Interventions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalInterventions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ce Mois</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.interventionsMois}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.chiffreAffaire}€</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pénalités</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.penalites}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interventions récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Interventions Récentes
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('interventions')}
                  >
                    Voir tout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interventions.slice(0, 5).length > 0 ? (
                  <div className="space-y-3">
                    {interventions.slice(0, 5).map((intervention) => (
                      <div key={intervention.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{intervention.num_inter}</p>
                          <p className="text-sm text-gray-600">{intervention.client}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(intervention.statut)}>
                            {intervention.statut}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{intervention.date_rdv}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune intervention trouvée</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'interventions' && (
          <div className="space-y-6">
            {/* Recherche et filtres */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher par numéro, client ou type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadData}
                    className="flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des interventions */}
            <Card>
              <CardHeader>
                <CardTitle>Mes Interventions ({filteredInterventions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {paginatedInterventions.length > 0 ? (
                  <div className="space-y-4">
                    {paginatedInterventions.map((intervention) => (
                      <div key={intervention.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-lg">{intervention.num_inter}</h3>
                              <Badge className={getStatusColor(intervention.statut)}>
                                {intervention.statut}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mt-1">{intervention.client}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline">{intervention.type_intervention}</Badge>
                              <Badge variant="outline">{intervention.date_rdv}</Badge>
                            </div>
                            {intervention.articles && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500">Articles utilisés:</p>
                                <p className="text-sm">{intervention.articles}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-700">
                          Page {currentPage} sur {totalPages}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune intervention trouvée</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Aucune intervention ne correspond à votre recherche.' : 'Vous n\'avez pas encore d\'interventions assignées.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'reclamations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Mes Réclamations ({reclamations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reclamations.length > 0 ? (
                  <div className="space-y-4">
                    {reclamations.map((reclamation) => (
                      <div key={reclamation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{reclamation.numero_reclamation}</h3>
                          <div className="flex space-x-2">
                            <Badge className={getPriorityColor(reclamation.priorite)}>
                              {reclamation.priorite}
                            </Badge>
                            <Badge className={getStatusColor(reclamation.statut)}>
                              {reclamation.statut}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{reclamation.client}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Type: {reclamation.type_reclamation}</span>
                          <span>Créée le: {reclamation.date_creation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune réclamation</h3>
                    <p className="text-gray-500">Vous n'avez pas de réclamations assignées.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'penalites' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Mes Pénalités ({penalites.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {penalites.length > 0 ? (
                  <div className="space-y-4">
                    {penalites.map((penalite) => (
                      <div key={penalite.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{penalite.numero_penalite}</h3>
                          <Badge className={getStatusColor(penalite.statut)}>
                            {penalite.statut}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Montant</p>
                            <p className="font-semibold text-red-600">{penalite.montant}€</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Motif</p>
                            <p className="text-sm">{penalite.motif}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Échéance</p>
                            <p className="text-sm">{penalite.date_echeance}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune pénalité</h3>
                    <p className="text-gray-500">Vous n'avez pas de pénalités.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 FinalFibre - Espace Technicien</p>
            <p className="mt-1">Connecté en tant que {user.prenom} {user.nom}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
