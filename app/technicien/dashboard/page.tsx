"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ChevronRight,
  Menu,
  X,
  Camera,
  Upload,
  Check,
  X as XIcon,
  Plus,
  Car,
  KeyRound
} from "lucide-react"
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/lib/authManager'
import { NotificationCenter } from '@/components/NotificationCenter'
import { SessionExpired } from '@/components/SessionExpired'
import { MobileNotificationButton } from '@/components/MobileNotificationButton'
import { MobilePushNotificationManager } from '@/components/MobilePushNotificationManager'
import { DocumentsAdministratifs } from '@/components/DocumentsAdministratifs'
import { NewDocumentModal } from '@/components/NewDocumentModal'
import { InterventionCategorieTable } from '@/components/InterventionCategorieTable'
import TechnicienReclamations from '@/components/TechnicienReclamations'
import { MonVehicule } from '@/components/MonVehicule'
import { MesAmendes } from '@/components/MesAmendes'
import { CalendarOff } from 'lucide-react'
// import { useEmployeeUpdates } from '@/hooks/useEmployeeUpdates' // Désactivé pour éviter les erreurs de build

interface User {
  id: number
  account_id?: number
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
  cloture_tech?: string
  cloture_hotline?: string
}

interface Reclamation {
  id: number
  numero_reclamation: string
  nom_client: string
  client?: string
  type_reclamation: string
  statut: string
  priorite: string
  date_creation: string
  date_reclamation: string
  description_probleme: string
  description?: string
  telephone_client?: string
  email_client?: string
  adresse_client?: string
  commentaires_internes?: string
  numero_intervention?: string
  intervention_num?: string
  intervention_client?: string
  date_intervention?: string
  intervention_statut?: string
  created_at?: string
  updated_at?: string
  photos?: Array<{
    id: number
    name: string
    type: string
    size: number
    uploadedAt: string
    url: string
  }>
  commentaire_resolution?: string
  date_resolution?: string
}

interface Penalite {
  id: number
  numero_penalite: string
  montant: number
  statut: string
  motif: string
  date_echeance: string
}

interface TechAbsence {
  id: number
  employe_id: number | null
  nom: string
  prenom: string
  date_debut: string
  date_fin: string
  type_absence: string
  motif: string | null
  statut: string
  commentaire_admin: string | null
  demande_par: string
  created_at: string
}

const TYPE_ABS_LABELS: Record<string, string> = {
  'conge': 'Congé',
  'maladie': 'Maladie',
  'sans_solde': 'Sans solde',
  'formation': 'Formation',
  'autre': 'Autre'
}

const TYPE_ABS_COLORS: Record<string, string> = {
  'conge': 'bg-blue-100 text-blue-700 border-blue-300',
  'maladie': 'bg-red-100 text-red-700 border-red-300',
  'sans_solde': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'formation': 'bg-purple-100 text-purple-700 border-purple-300',
  'autre': 'bg-gray-100 text-gray-700 border-gray-300'
}

const STATUT_ABS_CONFIG: Record<string, { label: string; className: string }> = {
  'en_attente': { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  'approuvee': { label: 'Approuvée', className: 'bg-green-100 text-green-700' },
  'refusee': { label: 'Refusée', className: 'bg-red-100 text-red-700' },
  'directe': { label: 'Directe', className: 'bg-blue-100 text-blue-700' }
}

function TechnicienAbsences({ user, fetchWithAuth }: { user: any, fetchWithAuth: (url: string, options?: any) => Promise<Response> }) {
  const [absences, setAbsences] = useState<TechAbsence[]>([])
  const [loadingAbs, setLoadingAbs] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newDemande, setNewDemande] = useState({
    date_debut: '',
    date_fin: '',
    type_absence: 'conge',
    motif: ''
  })

  const loadAbsences = useCallback(async () => {
    if (!user?.id) return
    setLoadingAbs(true)
    try {
      const res = await fetch(`/api/absences?employe_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAbsences(data.absences || [])
      }
    } catch (err) {
      console.error('Erreur chargement absences:', err)
    } finally {
      setLoadingAbs(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadAbsences()
  }, [loadAbsences])

  const handleSubmitDemande = async () => {
    if (!newDemande.date_debut || !newDemande.date_fin) {
      alert('Veuillez remplir les dates de début et de fin')
      return
    }
    if (new Date(newDemande.date_fin) < new Date(newDemande.date_debut)) {
      alert('La date de fin doit être après la date de début')
      return
    }
    try {
      const res = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employe_id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          date_debut: newDemande.date_debut,
          date_fin: newDemande.date_fin,
          type_absence: newDemande.type_absence,
          motif: newDemande.motif || null,
          demande_par: 'technicien'
        })
      })
      if (res.ok) {
        alert('Demande d\'absence envoyée avec succès !')
        setShowForm(false)
        setNewDemande({ date_debut: '', date_fin: '', type_absence: 'conge', motif: '' })
        loadAbsences()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de l\'envoi')
      }
    } catch (err) {
      console.error('Erreur envoi demande:', err)
      alert('Erreur lors de l\'envoi de la demande')
    }
  }

  const enAttente = absences.filter(a => a.statut === 'en_attente').length
  const approuvees = absences.filter(a => a.statut === 'approuvee' || a.statut === 'directe').length

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{enAttente}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{approuvees}</p>
            <p className="text-xs text-gray-500">Approuvées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{absences.filter(a => a.statut === 'refusee').length}</p>
            <p className="text-xs text-gray-500">Refusées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{absences.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Bouton nouvelle demande */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle demande d'absence
        </Button>
      </div>

      {/* Formulaire de demande */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarOff className="w-5 h-5 text-blue-600" />
              Nouvelle demande d'absence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Date début *</Label>
                <Input
                  type="date"
                  value={newDemande.date_debut}
                  onChange={(e) => setNewDemande({ ...newDemande, date_debut: e.target.value })}
                />
              </div>
              <div>
                <Label>Date fin *</Label>
                <Input
                  type="date"
                  value={newDemande.date_fin}
                  onChange={(e) => setNewDemande({ ...newDemande, date_fin: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Type d'absence</Label>
              <select
                value={newDemande.type_absence}
                onChange={(e) => setNewDemande({ ...newDemande, type_absence: e.target.value })}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="conge">Congé</option>
                <option value="maladie">Maladie</option>
                <option value="sans_solde">Sans solde</option>
                <option value="formation">Formation</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <Label>Motif (optionnel)</Label>
              <textarea
                value={newDemande.motif}
                onChange={(e) => setNewDemande({ ...newDemande, motif: e.target.value })}
                placeholder="Décrivez le motif de votre absence..."
                rows={3}
                className="w-full mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmitDemande}>
                Envoyer la demande
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des absences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Mes absences
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAbs ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : absences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucune absence enregistrée</p>
              <p className="text-sm">Cliquez sur "Nouvelle demande" pour demander une absence</p>
            </div>
          ) : (
            <div className="space-y-3">
              {absences.map((absence) => {
                const duree = Math.ceil((new Date(absence.date_fin).getTime() - new Date(absence.date_debut).getTime()) / (1000 * 60 * 60 * 24)) + 1
                const statutConf = STATUT_ABS_CONFIG[absence.statut] || STATUT_ABS_CONFIG['en_attente']
                const typeColor = TYPE_ABS_COLORS[absence.type_absence] || TYPE_ABS_COLORS['autre']
                return (
                  <div key={absence.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={typeColor}>
                        {TYPE_ABS_LABELS[absence.type_absence] || absence.type_absence}
                      </Badge>
                      <Badge className={statutConf.className}>
                        {statutConf.label}
                      </Badge>
                      <span className="text-sm text-gray-500 ml-auto">
                        {duree} jour{duree > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div><span className="font-medium">Du:</span> {new Date(absence.date_debut).toLocaleDateString('fr-FR')}</div>
                      <div><span className="font-medium">Au:</span> {new Date(absence.date_fin).toLocaleDateString('fr-FR')}</div>
                    </div>
                    {absence.motif && (
                      <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Motif:</span> {absence.motif}
                      </p>
                    )}
                    {absence.commentaire_admin && (
                      <p className="text-sm mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                        <span className="font-medium text-blue-700">💬 Commentaire admin:</span> {absence.commentaire_admin}
                      </p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      Demandé le {new Date(absence.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
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
  const [recetteGeneree, setRecetteGeneree] = useState({
    total_recette_technicien: 0,
    nombre_interventions: 0,
    total_recla_free_confirmee: 0,
    total_ftto_technicien: 0
  })
  
  // État pour les amendes du mois
  const [amendesData, setAmendesData] = useState({
    total_amendes: 0,
    nombre_amendes: 0
  })
  
  // État pour le total des pénalités en montant
  const [totalPenalites, setTotalPenalites] = useState(0)
  
  // État pour les primes du mois
  const [primesData, setPrimesData] = useState({
    total_primes: 0,
    primes: [] as any[]
  })
  const [showPrimesModal, setShowPrimesModal] = useState(false)
  const [reclaFreeData, setReclaFreeData] = useState<any[]>([])
  const [showReclaFreeModal, setShowReclaFreeModal] = useState(false)
  const [fttoData, setFttoData] = useState<any[]>([])
  const [showFttoModal, setShowFttoModal] = useState(false)
  
  // États pour le véhicule
  const [vehiculeData, setVehiculeData] = useState<any>(null)
  const [assignationVehicule, setAssignationVehicule] = useState<any>(null)
  
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

  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateDebut, setDateDebut] = useState(defaultDates.start)
  const [dateFin, setDateFin] = useState(defaultDates.end)
  const [currentPage, setCurrentPage] = useState(1)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedReclamation, setSelectedReclamation] = useState<any>(null)
  const [showReclamationModal, setShowReclamationModal] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [isResolving, setIsResolving] = useState(false)
  
  // États pour signaler un problème
  const [showSignalModal, setShowSignalModal] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [isSignaling, setIsSignaling] = useState(false)
  const [reclamationsKey, setReclamationsKey] = useState(0) // Pour forcer le re-render
  
  // États pour les données personnelles
  const [personalData, setPersonalData] = useState({
    telephone: '',
    rib_salaire: '',
    rib2: ''
  })
  const [isEditingPersonalData, setIsEditingPersonalData] = useState(false)
  const [isSavingPersonalData, setIsSavingPersonalData] = useState(false)
  
  // États pour le changement de mot de passe
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  
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
      loadPersonalData()
      loadDocuments()
      loadVehiculeData() // Charger les données du véhicule
    }
  }, [user, dateDebut, dateFin, activeTab])

  // Mise à jour automatique des données toutes les 30 secondes (optimisé pour performance)
  // Cette mise à jour doit respecter les filtres de date actuels
  useEffect(() => {
    if (!user) return
    
    const dataInterval = setInterval(() => {
      // Seulement si l'onglet est actif pour économiser les ressources
      if (!document.hidden) {
        console.log('🔄 Mise à jour automatique des données...')
        loadData()
        loadDocuments()
      }
    }, 30000) // 30 secondes au lieu de 2 secondes
    
    return () => clearInterval(dataInterval)
  }, [user, dateDebut, dateFin, activeTab])

  // Écouter l'événement pour ouvrir le modal de résolution
  useEffect(() => {
    const handleOpenResolveModal = (event: CustomEvent) => {
      setSelectedReclamation(event.detail)
      setShowReclamationModal(true)
    }

    window.addEventListener('openResolveModal', handleOpenResolveModal as EventListener)
    
    return () => {
      window.removeEventListener('openResolveModal', handleOpenResolveModal as EventListener)
    }
  }, [])

  // Écouter les événements personnalisés pour mise à jour instantanée
  useEffect(() => {
    const handleReclamationCreated = () => {
      console.log('🔔 Nouvelle réclamation créée - Rechargement des données...')
      loadData() // Recharger pour mettre à jour les compteurs
      setReclamationsKey(prev => prev + 1) // Forcer le re-render du composant TechnicienReclamations
    }

    window.addEventListener('reclamationCreated', handleReclamationCreated)
    
    return () => {
      window.removeEventListener('reclamationCreated', handleReclamationCreated)
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
      } else {
        console.log('Session expirée, redirection vers logintech')
        setUser(null)
        router.push('/logintech')
      }
    } catch (error) {
      console.log('Erreur auth ou session expirée:', error)
      setUser(null)
      router.push('/logintech')
    } finally {
      setLoading(false)
    }
  }

  const loadData = useCallback(async () => {
    if (!user) return

    try {
      setIsUpdating(true)
      console.log(`📊 Chargement des données pour l'employé ${user.id}... (Dates: ${dateDebut} - ${dateFin})`)
      
      // Construire les paramètres de date pour les APIs
      const dateParams = activeTab === 'overview' && dateDebut && dateFin
        ? `&date_debut=${dateDebut}&date_fin=${dateFin}`
        : ''
      
      // Paramètres de date pour les réclamations (toujours appliqués si disponibles)
      const reclamationsDateParams = dateDebut && dateFin
        ? `&date_debut=${dateDebut}&date_fin=${dateFin}`
        : ''

      // Construire les paramètres de date pour l'API revenue (format différent)
      const revenueDateParams = activeTab === 'overview' && dateDebut && dateFin
        ? `&date_from=${dateDebut}&date_to=${dateFin}`
        : ''
      
      // Charger toutes les données en parallèle pour de meilleures performances
      const [interventionsResponse, reclamationsResponse, penalitesResponse, revenueResponse, amendesResponse] = await Promise.all([
        fetchWithAuth(`/api/interventions?employe_id=${user.id}${dateParams}`),
        fetchWithAuth(`/api/reclamations?employe_id=${user.id}${reclamationsDateParams}`),
        fetchWithAuth(`/api/penalites?employe_id=${user.id}${dateParams}`),
        fetchWithAuth(`/api/revenue-calculation?employe_id=${user.id}${revenueDateParams}`),
        fetchWithAuth(`/api/amendes-vehicules?employe_id=${user.id}`)
      ])

      // Vérifier si l'une des réponses indique une session expirée
      if (!interventionsResponse.ok || !reclamationsResponse.ok || !penalitesResponse.ok || !revenueResponse.ok) {
        console.log('Session expirée détectée lors du chargement des données')
        setUser(null)
        router.push('/logintech')
        return
      }

      // Traiter les interventions (déjà filtrées par l'API si dates fournies)
      const interventionsData = await interventionsResponse.json()
      if (interventionsData.interventions) {
        const previousCount = interventions.length
        setInterventions(interventionsData.interventions)
        
        if (interventionsData.interventions.length !== previousCount) {
          console.log(`📈 Interventions mises à jour: ${previousCount} → ${interventionsData.interventions.length}`)
        }
        
        // Les statistiques utilisent directement les données de l'API (déjà filtrées)
        const totalInterventions = interventionsData.interventions.length
        
        // Compter uniquement les interventions "CLOTURE TERMINEE" pour la carte spécifique
        const interventionsCloturees = interventionsData.interventions.filter(
          (inter: Intervention) => inter.statut?.toUpperCase() === 'CLOTURE TERMINEE'
        ).length

        setStats(prev => ({
          ...prev,
          totalInterventions,
          interventionsMois: interventionsCloturees // Nombre d'interventions clôturées terminées
        }))
      }

      // Traiter les réclamations (déjà filtrées par l'API si dates fournies)
      const reclamationsData = await reclamationsResponse.json()
      if (reclamationsData.reclamations) {
        const previousCount = reclamations.length
        
        // Vérifier et fermer automatiquement les réclamations en retard
        const updatedReclamations = reclamationsData.reclamations.map((reclamation: Reclamation) => {
          const deadline = calculateDeadline(reclamation)
          if (deadline.isOverdue && reclamation.statut === 'ouverte') {
            console.log(`⚠️ Réclamation ${reclamation.numero_reclamation} en retard de ${Math.abs(deadline.daysRemaining)} jours`)
            // Ici on pourrait appeler une API pour fermer automatiquement la réclamation
            // Pour l'instant, on garde le statut mais on affiche l'alerte
          }
          return reclamation
        })
        
        setReclamations(updatedReclamations)
        
        if (updatedReclamations.length !== previousCount) {
          console.log(`📨 Réclamations mises à jour: ${previousCount} → ${updatedReclamations.length}`)
        }
        
        setStats(prev => ({
          ...prev,
          reclamations: updatedReclamations.length
        }))
      }

      // Traiter les pénalités (déjà filtrées par l'API si dates fournies)
      const penalitesData = await penalitesResponse.json()
      if (penalitesData.penalites) {
        const previousCount = penalites.length
        setPenalites(penalitesData.penalites)
        
        if (penalitesData.penalites.length !== previousCount) {
          console.log(`💰 Pénalités mises à jour: ${previousCount} → ${penalitesData.penalites.length}`)
        }
        
        // Calculer le total des pénalités en montant
        const totalPenalitesMontant = penalitesData.penalites.reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.montant) || 0)
        }, 0)
        setTotalPenalites(totalPenalitesMontant)
        
        setStats(prev => ({
          ...prev,
          penalites: penalitesData.penalites.length
        }))
      }

      // Traiter les recettes générées
      const revenueData = await revenueResponse.json()
      if (revenueData.success && revenueData.revenue_data && revenueData.revenue_data.length > 0) {
        // Trouver les données pour le technicien connecté
        const technicienRevenue = revenueData.revenue_data.find((rev: any) => rev.employe_id === user.id) || revenueData.revenue_data[0]
        
        setRecetteGeneree({
          total_recette_technicien: parseFloat(technicienRevenue.total_recette_technicien || 0),
          nombre_interventions: parseInt(technicienRevenue.nombre_interventions || 0),
          total_recla_free_confirmee: parseFloat(technicienRevenue.total_recla_free_confirmee || 0),
          total_ftto_technicien: parseFloat(technicienRevenue.total_ftto_technicien || 0)
        })
      } else {
        setRecetteGeneree({
          total_recette_technicien: 0,
          nombre_interventions: 0,
          total_recla_free_confirmee: 0,
          total_ftto_technicien: 0
        })
      }

      // Traiter les amendes
      if (amendesResponse.ok) {
        const amendesDataResponse = await amendesResponse.json()
        if (amendesDataResponse.success && amendesDataResponse.amendes) {
          // Filtrer les amendes par la période sélectionnée
          const amendesFiltrees = amendesDataResponse.amendes.filter((amende: any) => {
            if (!dateDebut || !dateFin || !amende.date_amende) return true
            const dateAmende = new Date(amende.date_amende)
            const debut = new Date(dateDebut)
            const fin = new Date(dateFin)
            return dateAmende >= debut && dateAmende <= fin
          })
          
          const totalAmendesMontant = amendesFiltrees.reduce((sum: number, a: any) => {
            return sum + (parseFloat(a.montant) || 0)
          }, 0)
          
          setAmendesData({
            total_amendes: totalAmendesMontant,
            nombre_amendes: amendesFiltrees.length
          })
        }
      }

      // Charger les recla free du technicien (confirmées + en cours)
      if (user?.id) {
        try {
          // Recla free confirmées (filtrées par date_confirmation)
          const rfConfParams = new URLSearchParams({ employe_id: String(user.id), confirmer: 'true' })
          if (dateDebut) rfConfParams.append('date_debut', dateDebut)
          if (dateFin) rfConfParams.append('date_fin', dateFin)
          // Recla free non confirmées (filtrées par date de la recla free)
          const rfPendParams = new URLSearchParams({ employe_id: String(user.id), confirmer: 'false', use_date_field: 'true' })
          if (dateDebut) rfPendParams.append('date_debut', dateDebut)
          if (dateFin) rfPendParams.append('date_fin', dateFin)

          const [rfConfRes, rfPendRes] = await Promise.all([
            fetchWithAuth(`/api/recla-free?${rfConfParams.toString()}`),
            fetchWithAuth(`/api/recla-free?${rfPendParams.toString()}`),
          ])
          const confirmed = rfConfRes.ok ? ((await rfConfRes.json()).reclaFree || []) : []
          const pending = rfPendRes.ok ? ((await rfPendRes.json()).reclaFree || []) : []
          setReclaFreeData([...confirmed, ...pending])
        } catch (e) {
          console.warn('recla_free load error:', e)
          setReclaFreeData([])
        }
      }

      // Charger les tickets FTTO du technicien pour la période
      if (user?.id) {
        try {
          const ftParams = new URLSearchParams({ employe_id: String(user.id) })
          if (dateDebut) ftParams.append('date_debut', dateDebut)
          if (dateFin) ftParams.append('date_fin', dateFin)
          const ftRes = await fetchWithAuth(`/api/ftto?${ftParams.toString()}`)
          const ftJson = ftRes.ok ? await ftRes.json() : {}
          setFttoData(ftJson.tickets || [])
        } catch (e) {
          console.warn('ftto load error:', e)
          setFttoData([])
        }
      }

      // Charger les primes du technicien pour la période
      if (user?.matricule && dateDebut) {
        try {
          // Extraire mois et année de dateDebut
          const dateDebutObj = new Date(dateDebut)
          const mois = dateDebutObj.getMonth() + 1
          const annee = dateDebutObj.getFullYear()
          
          const primesResponse = await fetchWithAuth(
            `/api/primes-employes?matricule=${user.matricule}&mois=${mois}&annee=${annee}`
          )
          
          if (primesResponse.ok) {
            const primesDataResponse = await primesResponse.json()
            if (primesDataResponse.success) {
              setPrimesData({
                total_primes: primesDataResponse.totaux?.total || 0,
                primes: primesDataResponse.primes || []
              })
            }
          }
        } catch (primesError) {
          console.warn('⚠️ Erreur chargement primes:', primesError)
          setPrimesData({ total_primes: 0, primes: [] })
        }
      }

      console.log('✅ Données mises à jour avec succès')
      setLastUpdate(new Date())

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error)
      // Si c'est une erreur d'authentification, rediriger vers logintech
      if (error instanceof Error && error.message.includes('401')) {
        console.log('Erreur 401 détectée, redirection vers logintech')
        setUser(null)
        router.push('/logintech')
      }
    } finally {
      setIsUpdating(false)
    }
  }, [user, dateDebut, dateFin, activeTab])

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/api/auth/technicien', { method: 'DELETE' })
      setUser(null)
      router.push('/logintech')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, rediriger vers logintech
      setUser(null)
      router.push('/logintech')
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false) // Fermer le menu mobile
  }

  const handleReclamationResolve = async (reclamationId: number, photos: File[], comment: string) => {
    if (!user) return

    setIsResolving(true)
    try {
      const formData = new FormData()
      formData.append('reclamation_id', reclamationId.toString())
      formData.append('comment', comment)
      formData.append('resolved_by', user.id.toString())
      
      // Ajouter les photos
      photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo)
      })

      const response = await fetchWithAuth('/api/reclamations/resolve', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        console.log('✅ Réclamation marquée comme résolue')
        // Recharger les données
        loadData()
        setShowReclamationModal(false)
        setSelectedReclamation(null)
        setUploadedPhotos([])
      } else {
        console.error('❌ Erreur lors de la résolution de la réclamation')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la résolution:', error)
    } finally {
      setIsResolving(false)
    }
  }

  // Signaler un problème sur une intervention
  const handleSignalProblem = async (description: string) => {
    if (!user || !selectedIntervention) return

    setIsSignaling(true)
    try {
      const response = await fetchWithAuth('/api/reclamations/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intervention_num: selectedIntervention.num_inter,
          intervention_id: selectedIntervention.id,
          technicien_id: user.id,
          description_probleme: description,
          type_reclamation: 'probleme_technique',  // Valeur correcte: article_manquant, probleme_technique, erreur_grille, autre
          priorite: 'moyenne'
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Afficher notification de succès
        alert(`✅ Réclamation #${data.numero_reclamation} créée avec succès! Vous serez notifié une fois qu'elle sera traitée.`)
        
        console.log('🔔 Déclenchement événement reclamationCreated')
        // Déclencher un événement pour mise à jour instantanée
        window.dispatchEvent(new Event('reclamationCreated'))
        
        // Recharger les données immédiatement pour mettre à jour le compteur
        await loadData()
        
        // Fermer le modal
        setShowSignalModal(false)
        setSelectedIntervention(null)
      } else {
        alert(`❌ Erreur: ${data.error || 'Impossible de créer la réclamation'}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors du signalement:', error)
      alert('❌ Erreur lors du signalement du problème')
    } finally {
      setIsSignaling(false)
    }
  }

  // Charger les données du véhicule assigné
  const loadVehiculeData = async () => {
    if (!user) return

    try {
      const response = await fetchWithAuth(`/api/tech/vehicule-kilometrage?employe_id=${user.id}`)
      const data = await response.json()

      if (data.success && data.assignation) {
        // Mapper vers le format attendu par MonVehicule
        setVehiculeData({
          id: data.assignation.vehicule_id,
          matricule: data.assignation.matricule,
          marque: data.assignation.marque,
          modele: data.assignation.modele,
          annee: data.assignation.annee || new Date().getFullYear(),
          km_actuel: data.assignation.kilometrage_actuel_vehicule || 0,
          prochaine_echeance_km: data.assignation.prochaine_echeance_km || null,
          assurance_pdf_url: data.assignation.assurance_pdf_url || null,
          assurance_pdf_filename: data.assignation.assurance_pdf_filename || null,
          carte_grise_pdf_url: data.assignation.carte_grise_pdf_url || null,
          carte_grise_pdf_filename: data.assignation.carte_grise_pdf_filename || null
        })
        
        setAssignationVehicule({
          id: data.assignation.id,
          vehicule_id: data.assignation.vehicule_id,
          date_assignation: data.assignation.date_assignation,
          statut_km: data.assignation.statut_km || 'initial_attente',
          km_debut: data.assignation.kilometrage_debut,
          km_actuel: data.assignation.kilometrage_actuel_vehicule,
          date_derniere_maj: data.assignation.date_derniere_maj
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement du véhicule:', error)
    }
  }

  // Soumettre la mise à jour de kilométrage avec photo
  const handleSubmitKm = async (formData: FormData) => {
    try {
      const response = await fetchWithAuth('/api/vehicules-km-updates', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Mise à jour KM soumise avec succès')
        // Recharger les données du véhicule
        await loadVehiculeData()
        return Promise.resolve()
      } else {
        console.error('❌ Erreur:', data.error)
        return Promise.reject(new Error(data.error))
      }
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error)
      return Promise.reject(error)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedPhotos(prev => [...prev, ...files])
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Fonctions pour gérer les données personnelles
  const loadPersonalData = async () => {
    if (!user) return
    
    try {
      const response = await fetchWithAuth(`/api/employes/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setPersonalData({
          telephone: data.employe?.telephone || '',
          rib_salaire: data.employe?.rib_salaire || '',
          rib2: data.employe?.rib2 || ''
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données personnelles:', error)
    }
  }

  const handlePersonalDataChange = (field: string, value: string) => {
    setPersonalData(prev => ({ ...prev, [field]: value }))
  }

  const handleSavePersonalData = async () => {
    if (!user) return
    
    setIsSavingPersonalData(true)
    try {
      const response = await fetchWithAuth('/api/employes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: user.id,
          telephone: personalData.telephone,
          rib_salaire: personalData.rib_salaire,
          rib2: personalData.rib2
        })
      })

      if (response.ok) {
        console.log('✅ Données personnelles mises à jour')
        setIsEditingPersonalData(false)
        // Recharger les données pour s'assurer que tout est synchronisé
        loadData()
      } else {
        console.error('❌ Erreur lors de la mise à jour des données personnelles')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error)
    } finally {
      setIsSavingPersonalData(false)
    }
  }

  // Fonctions de gestion des mises à jour SSE
  const handleEmployeeUpdate = (update: any) => {
    console.log('📡 Mise à jour employé reçue dans l\'espace technicien:', update)
    // Ici on pourrait mettre à jour les données si nécessaire
  }

  const handlePersonalDataUpdate = (update: any) => {
    console.log('📡 Mise à jour données personnelles reçue dans l\'espace technicien:', update)
    // Ici on pourrait mettre à jour les données si nécessaire
  }

  // Fonction pour changer le mot de passe
  const handleChangePassword = async () => {
    setPasswordError('')

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Tous les champs sont requis')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    setChangingPassword(true)

    try {
      const response = await fetchWithAuth('/api/technicien/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Mot de passe changé avec succès')
        setShowChangePasswordModal(false)
        setOldPassword('')
        setNewPassword('')
        setConfirmNewPassword('')
      } else {
        setPasswordError(data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (error) {
      console.error('❌ Erreur lors du changement de mot de passe:', error)
      setPasswordError('Erreur de connexion au serveur')
    } finally {
      setChangingPassword(false)
    }
  }

  // Fonctions pour les documents administratifs
  const loadDocuments = async () => {
    if (!user) return

    setLoadingDocuments(true)
    try {
      const response = await fetchWithAuth(`/api/documents-administratifs?employe_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
        setDocumentTypes(data.types || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error)
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleCreateDocument = async () => {
    if (!user || !newDocument.type_document) return

    try {
      const response = await fetchWithAuth('/api/documents-administratifs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employe_id: user.id,
          type_document: newDocument.type_document,
          commentaire_demande: newDocument.commentaire_demande
        })
      })

      if (response.ok) {
        console.log('✅ Demande de document créée')
        setShowDocumentModal(false)
        setNewDocument({ type_document: '', commentaire_demande: '', precision_autre: '' })
        loadDocuments()
      } else {
        console.error('❌ Erreur lors de la création de la demande')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error)
    }
  }

  // Hook pour les mises à jour en temps réel via polling optimisé
  useEffect(() => {
    if (!user) return

    console.log('🔄 Activation du polling intelligent pour le technicien', user.id)
    setIsConnected(true)

    // Polling toutes les 10 secondes UNIQUEMENT pour les interventions et pénalités
    // Les réclamations sont gérées par le composant TechnicienReclamations
    const pollingInterval = setInterval(async () => {
      if (!document.hidden && activeTab !== 'reclamations') { // Seulement si la page est visible ET qu'on n'est pas sur l'onglet réclamations
        console.log('🔄 Polling: Vérification des mises à jour...')
        try {
          // Charger seulement interventions, pénalités et revenue - PAS les réclamations
          if (!user) return
          
          const dateParams = activeTab === 'overview' && dateDebut && dateFin
            ? `&date_debut=${dateDebut}&date_fin=${dateFin}`
            : ''
          
          const revenueDateParams = activeTab === 'overview' && dateDebut && dateFin
            ? `&date_from=${dateDebut}&date_to=${dateFin}`
            : ''
          
          const [interventionsResponse, penalitesResponse, revenueResponse] = await Promise.all([
            fetchWithAuth(`/api/interventions?employe_id=${user.id}${dateParams}`),
            fetchWithAuth(`/api/penalites?employe_id=${user.id}${dateParams}`),
            fetchWithAuth(`/api/revenue-calculation?employe_id=${user.id}${revenueDateParams}`)
          ])

          if (interventionsResponse.ok) {
            const interventionsData = await interventionsResponse.json()
            if (interventionsData.interventions) {
              setInterventions(interventionsData.interventions)
              const totalInterventions = interventionsData.interventions.length
              const interventionsCloturees = interventionsData.interventions.filter(
                (inter: Intervention) => inter.statut?.toUpperCase() === 'CLOTURE TERMINEE'
              ).length
              setStats(prev => ({
                ...prev,
                totalInterventions,
                interventionsMois: interventionsCloturees
              }))
            }
          }

          if (penalitesResponse.ok) {
            const penalitesData = await penalitesResponse.json()
            if (penalitesData.penalites) {
              setPenalites(penalitesData.penalites)
              setStats(prev => ({
                ...prev,
                penalites: penalitesData.penalites.length
              }))
            }
          }

          if (revenueResponse.ok) {
            const revenueData = await revenueResponse.json()
            if (revenueData.success && revenueData.revenue_data && revenueData.revenue_data.length > 0) {
              const technicienRevenue = revenueData.revenue_data.find((rev: any) => rev.employe_id === user.id) || revenueData.revenue_data[0]
              setRecetteGeneree({
                total_recette_technicien: parseFloat(technicienRevenue.total_recette_technicien || 0),
                nombre_interventions: parseInt(technicienRevenue.nombre_interventions || 0),
                total_recla_free_confirmee: parseFloat(technicienRevenue.total_recla_free_confirmee || 0)
              })
            }
          }

          console.log('✅ Polling: Données mises à jour')
        } catch (error) {
          console.error('Erreur polling:', error)
        }
      }
    }, 10000) // 10 secondes

    return () => {
      console.log('🔌 Arrêt du polling')
      clearInterval(pollingInterval)
      setIsConnected(false)
    }
  }, [user, activeTab, dateDebut, dateFin])

  const [isConnected, setIsConnected] = useState(false)

  // États pour les documents administratifs
  const [documents, setDocuments] = useState<any[]>([])
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [newDocument, setNewDocument] = useState({
    type_document: '',
    commentaire_demande: '',
    precision_autre: ''
  })
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Fonction pour calculer les jours restants et l'échéance
  const calculateDeadline = (reclamation: Reclamation) => {
    const creationDateStr = reclamation.date_creation || reclamation.date_reclamation || reclamation.created_at
    if (!creationDateStr) {
      return {
        deadlineDate: 'Date inconnue',
        daysRemaining: 0,
        isOverdue: false,
        isUrgent: false,
        deadlineDays: 0
      }
    }
    
    const creationDate = new Date(creationDateStr)
    const now = new Date()
    
    // Délai selon le type de réclamation: 7j client, 10j contrôleur, 14j technique
    const deadlineDays = reclamation.type_reclamation === 'client' ? 7 : reclamation.type_reclamation === 'controleur' ? 10 : 14
    const deadlineDate = new Date(creationDate)
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays)
    
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isOverdue = daysRemaining < 0
    const isUrgent = daysRemaining <= 2 && daysRemaining >= 0
    
    return {
      deadlineDate: deadlineDate.toLocaleDateString('fr-FR'),
      daysRemaining,
      isOverdue,
      isUrgent,
      deadlineDays
    }
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    switch (status.toLowerCase()) {
      case 'terminé':
      case 'terminée':
      case 'cloture':
      case 'clôturé':
      case 'résolu':
      case 'resolue':
        return 'bg-green-100 text-green-800'
      case 'en cours':
      case 'en_cours':
        return 'bg-blue-100 text-blue-800'
      case 'en attente':
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800'
      case 'ouverte':
        return 'bg-orange-100 text-orange-800'
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

  const filteredInterventions = interventions
    .filter(intervention => {
      const search = searchTerm.toLowerCase()
      const numInter = (intervention.num_inter || '').toLowerCase()
      const client = (intervention.client || '').toLowerCase()
      const typeInter = (intervention.type_intervention || '').toLowerCase()
      return numInter.includes(search) || client.includes(search) || typeInter.includes(search)
    })
    .sort((a, b) => {
      // Trier par date_rdv décroissante (plus récente en premier)
      const dateA = a.date_rdv || ''
      const dateB = b.date_rdv || ''
      const dateComparison = new Date(dateB).getTime() - new Date(dateA).getTime()
      
      // Si même date, trier par num_inter décroissant
      if (dateComparison === 0) {
        return (b.num_inter || '').localeCompare(a.num_inter || '')
      }
      return dateComparison
    });

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
    return <SessionExpired onRetry={checkAuth} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo et titre */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">FinalFibre</h1>
                <p className="text-xs sm:text-sm text-gray-500">Espace Technicien</p>
              </div>
            </div>
            
            {/* Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-semibold text-gray-900">
                  {user.prenom} {user.nom}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <p className="text-xs text-gray-500">{user.matricule}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationCenter employeeId={user.id} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            </div>

            {/* Actions - Mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              <NotificationCenter employeeId={user.id} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t bg-white shadow-lg">
              <div className="px-4 py-4 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-gray-500">{user.matricule}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>État de connexion</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isConnected ? 'Connecté' : 'Hors ligne'}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between">
            <nav className="flex space-x-6">
              <button
                onClick={() => handleTabChange('overview')}
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
                onClick={() => handleTabChange('interventions')}
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
                onClick={() => handleTabChange('reclamations')}
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
                onClick={() => handleTabChange('penalites')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'penalites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Pénalités
              </button>
              <button
                onClick={() => handleTabChange('vehicule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vehicule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Car className="w-4 h-4 inline mr-2" />
                Mon Véhicule
              </button>
        <button
          onClick={() => handleTabChange('donnees-personnelles')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'donnees-personnelles'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Données Personnelles
        </button>
        <button
          onClick={() => handleTabChange('documents-administratifs')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'documents-administratifs'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Documents Administratifs
        </button>
        <button
          onClick={() => handleTabChange('absences')}
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'absences'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <CalendarOff className="w-4 h-4 inline mr-2" />
          Absences
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

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-between py-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeTab === 'overview' && 'Vue d\'ensemble'}
                {activeTab === 'interventions' && 'Mes Interventions'}
                {activeTab === 'reclamations' && 'Réclamations'}
                {activeTab === 'penalites' && 'Pénalités'}
                {activeTab === 'vehicule' && 'Mon Véhicule'}
                {activeTab === 'donnees-personnelles' && 'Données Personnelles'}
            {activeTab === 'documents-administratifs' && 'Documents Administratifs'}
                {activeTab === 'absences' && 'Absences'}
              </h2>
              <div className="flex items-center space-x-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-gray-500">
                  {isUpdating ? 'Mise à jour...' : 'Temps réel'}
                </span>
              </div>
            </div>
            
            {/* Navigation mobile avec scroll horizontal */}
            <div className="flex space-x-1 overflow-x-auto pb-2">
              <button
                onClick={() => handleTabChange('overview')}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Home className="w-4 h-4 inline mr-1" />
                Vue d'ensemble
              </button>
              <button
                onClick={() => handleTabChange('interventions')}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'interventions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Interventions
              </button>
              <button
                onClick={() => handleTabChange('reclamations')}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'reclamations'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1" />
                Réclamations
              </button>
              <button
                onClick={() => handleTabChange('penalites')}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'penalites'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Pénalités
              </button>
              <button
                onClick={() => handleTabChange('vehicule')}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'vehicule'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Car className="w-4 h-4 inline mr-1" />
                Véhicule
              </button>
        <button
          onClick={() => handleTabChange('donnees-personnelles')}
          className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'donnees-personnelles'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <User className="w-4 h-4 inline mr-1" />
          Données
        </button>
        <button
          onClick={() => handleTabChange('documents-administratifs')}
          className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'documents-administratifs'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Documents
        </button>
        <button
          onClick={() => handleTabChange('absences')}
          className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'absences'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <CalendarOff className="w-4 h-4 inline mr-1" />
          Absences
        </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filtres de date */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Période d'analyse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <Label htmlFor="dateDebut" className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                      Date début
                    </Label>
                    <Input
                      id="dateDebut"
                      type="date"
                      value={dateDebut}
                      onChange={(e) => {
                        setDateDebut(e.target.value)
                      }}
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label htmlFor="dateFin" className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                      Date fin
                    </Label>
                    <Input
                      id="dateFin"
                      type="date"
                      value={dateFin}
                      onChange={(e) => {
                        setDateFin(e.target.value)
                      }}
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const dates = getDefaultDates()
                        setDateDebut(dates.start)
                        setDateFin(dates.end)
                      }}
                      className="w-full text-sm"
                      size="sm"
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{stats.totalInterventions}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Total Interventions</p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{stats.interventionsMois}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Clôturées</p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {recetteGeneree.total_recette_technicien.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {recetteGeneree.nombre_interventions} interventions
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Total Généré</p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {totalPenalites.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.penalites} pénalité(s)
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Pénalités</p>
                </CardContent>
              </Card>
            </div>

            {/* Deuxième ligne de statistiques financières */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {amendesData.total_amendes.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {amendesData.nombre_amendes} amende(s)
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Amendes</p>
                </CardContent>
              </Card>

              {/* Carte des Primes */}
              <Card 
                className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500 cursor-pointer"
                onClick={() => primesData.primes.length > 0 && setShowPrimesModal(true)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        +{primesData.total_primes.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {primesData.primes.length} prime(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">Primes</p>
                    {primesData.primes.length > 0 && (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Carte Recla Free */}
              {reclaFreeData.length > 0 && (
                <Card
                  className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-orange-500 cursor-pointer"
                  onClick={() => setShowReclaFreeModal(true)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        {recetteGeneree.total_recla_free_confirmee > 0 && (
                          <p className="text-xl font-bold text-orange-600">
                            +{recetteGeneree.total_recla_free_confirmee.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€ <span className="text-xs font-normal">confirmé</span>
                          </p>
                        )}
                        {reclaFreeData.filter((rf: any) => !rf.confirmer).reduce((s: number, rf: any) => s + (parseFloat(rf.montant_technicien) || 0), 0) > 0 && (
                          <p className="text-xl font-bold text-yellow-600">
                            +{reclaFreeData.filter((rf: any) => !rf.confirmer).reduce((s: number, rf: any) => s + (parseFloat(rf.montant_technicien) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€ <span className="text-xs font-normal">en cours</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {reclaFreeData.filter((rf: any) => rf.confirmer).length > 0 && (
                            <span className="text-orange-600 font-medium">{reclaFreeData.filter((rf: any) => rf.confirmer).length} confirmée{reclaFreeData.filter((rf: any) => rf.confirmer).length > 1 ? 's' : ''}</span>
                          )}
                          {reclaFreeData.filter((rf: any) => rf.confirmer).length > 0 && reclaFreeData.filter((rf: any) => !rf.confirmer).length > 0 && ' · '}
                          {reclaFreeData.filter((rf: any) => !rf.confirmer).length > 0 && (
                            <span className="text-yellow-600 font-medium">{reclaFreeData.filter((rf: any) => !rf.confirmer).length} en cours</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">Recla Free</p>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Carte FTTO */}
              {fttoData.length > 0 && (
                <Card
                  className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 cursor-pointer"
                  onClick={() => setShowFttoModal(true)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        {recetteGeneree.total_ftto_technicien > 0 && (
                          <p className="text-xl font-bold text-blue-600">
                            +{recetteGeneree.total_ftto_technicien.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€ <span className="text-xs font-normal">part tech</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="text-blue-600 font-medium">{fttoData.length} ticket{fttoData.length > 1 ? 's' : ''}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">FTTO</p>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-500 lg:col-span-2">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        (recetteGeneree.total_recette_technicien + primesData.total_primes - totalPenalites - amendesData.total_amendes) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(recetteGeneree.total_recette_technicien + primesData.total_primes - totalPenalites - amendesData.total_amendes).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        = {recetteGeneree.total_recette_technicien.toLocaleString('fr-FR')}€ + {primesData.total_primes.toLocaleString('fr-FR')}€ - {totalPenalites.toLocaleString('fr-FR')}€ - {amendesData.total_amendes.toLocaleString('fr-FR')}€{recetteGeneree.total_recla_free_confirmee > 0 ? ` (incl. +${recetteGeneree.total_recla_free_confirmee.toLocaleString('fr-FR')}€ recla free)` : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">Total Net (Total Généré + Primes - Pénalités - Amendes)</p>
                </CardContent>
              </Card>
            </div>

            {/* Tableau résumé des interventions par catégorie */}
            <InterventionCategorieTable 
              nomTechnicien={user?.nom || ''}
              prenomTechnicien={user?.prenom || ''}
              employeId={user?.id}
              dateDebut={dateDebut}
              dateFin={dateFin}
            />

            {/* Mes Réclamations */}
            <TechnicienReclamations
              key={reclamationsKey}
              nomTechnicien={user?.nom || ''}
              prenomTechnicien={user?.prenom || ''}
              technicienId={user?.id}
              dateDebut={undefined}
              dateFin={undefined}
            />

            {/* Interventions récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Interventions Récentes
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTabChange('interventions')}
                    className="w-full sm:w-auto"
                  >
                    Voir tout
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interventions.slice(0, 5).length > 0 ? (
                  <div className="space-y-3">
                    {interventions.slice(0, 5).map((intervention) => (
                      <div key={intervention.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{intervention.num_inter}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{intervention.client}</p>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1">
                          <Badge className={getStatusColor(intervention.statut)}>
                            {intervention.statut}
                          </Badge>
                          <p className="text-xs text-gray-500">{intervention.date_rdv}</p>
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
          <div className="space-y-4 sm:space-y-6">
            {/* Recherche et filtres */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher par numéro, client ou type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadData}
                    className="flex items-center justify-center w-full sm:w-auto"
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
                  <div className="space-y-3 sm:space-y-4">
                    {paginatedInterventions.map((intervention) => (
                      <div key={intervention.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <h3 className="font-semibold text-base sm:text-lg">{intervention.num_inter}</h3>
                              <Badge className={getStatusColor(intervention.statut)}>
                                {intervention.statut}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIntervention(intervention)
                                setShowSignalModal(true)
                              }}
                              className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50 w-full sm:w-auto"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              Signaler un problème
                            </Button>
                          </div>
                          <p className="text-sm sm:text-base text-gray-600">{intervention.client}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">{intervention.type_intervention}</Badge>
                            <Badge variant="outline" className="text-xs">{intervention.date_rdv}</Badge>
                          </div>
                          {intervention.articles && (
                            <div className="mt-2">
                              <p className="text-xs sm:text-sm text-gray-500">Articles utilisés:</p>
                              <p className="text-xs sm:text-sm">{intervention.articles}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 gap-3">
                        <p className="text-xs sm:text-sm text-gray-700">
                          Page {currentPage} sur {totalPages}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3"
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
          <div className="space-y-4 sm:space-y-6">
            {/* Filtre de période */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor="reclDateDebut" className="text-xs font-medium text-gray-700 mb-1 block">Date début</Label>
                    <Input
                      id="reclDateDebut"
                      type="date"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reclDateFin" className="text-xs font-medium text-gray-700 mb-1 block">Date fin</Label>
                    <Input
                      id="reclDateFin"
                      type="date"
                      value={dateFin}
                      onChange={(e) => setDateFin(e.target.value)}
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm"
                      onClick={() => { const d = getDefaultDates(); setDateDebut(d.start); setDateFin(d.end) }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Mois en cours
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Mes Réclamations ({reclamations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reclamations.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {reclamations.map((reclamation) => (
                      <ReclamationCard 
                        key={reclamation.id} 
                        reclamation={reclamation} 
                        onResolve={handleReclamationResolve}
                        calculateDeadline={calculateDeadline}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucune réclamation</h3>
                    <p className="text-sm sm:text-base text-gray-500">Vous n'avez pas de réclamations assignées.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'penalites' && (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Mes Pénalités ({penalites.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {penalites.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {penalites.map((penalite) => (
                      <div key={penalite.id} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                          <h3 className="font-semibold text-sm sm:text-base">{penalite.numero_penalite}</h3>
                          <Badge className={getStatusColor(penalite.statut)}>
                            {penalite.statut}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">Montant</p>
                            <p className="font-semibold text-red-600 text-sm sm:text-base">{penalite.montant}€</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">Motif</p>
                            <p className="text-xs sm:text-sm">{penalite.motif}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600">Date d'Attribution</p>
                            <p className="text-xs sm:text-sm">{new Date(penalite.date_echeance).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Aucune pénalité</h3>
                    <p className="text-sm sm:text-base text-gray-500">Vous n'avez pas de pénalités.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'vehicule' && (
          <div className="space-y-4 sm:space-y-6">
            <MonVehicule 
              vehicule={vehiculeData}
              assignation={assignationVehicule}
              technicienId={user?.id || 0}
              onSubmitKm={handleSubmitKm}
            />
            
            {/* Section Amendes */}
            <MesAmendes employeId={user?.id || 0} />
          </div>
        )}

        {activeTab === 'donnees-personnelles' && (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Données Personnelles
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChangePasswordModal(true)}
                      className="flex items-center space-x-2 text-blue-600"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span className="hidden sm:inline">Changer mot de passe</span>
                      <span className="sm:hidden">Mot de passe</span>
                    </Button>
                    {!isEditingPersonalData && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPersonalData(true)}
                        className="flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Modifier</span>
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles (téléphone, RIB) et votre mot de passe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingPersonalData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telephone">Numéro de Téléphone</Label>
                        <Input
                          id="telephone"
                          value={personalData.telephone}
                          onChange={(e) => handlePersonalDataChange('telephone', e.target.value)}
                          placeholder="+33 1 23 45 67 89"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="rib_salaire">RIB Salaire</Label>
                        <Input
                          id="rib_salaire"
                          value={personalData.rib_salaire}
                          onChange={(e) => handlePersonalDataChange('rib_salaire', e.target.value)}
                          placeholder="FR76 1234 5678 9012 3456 7890 123"
                          className="mt-1 font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          RIB principal pour les salaires
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="rib2">RIB Secondaire (optionnel)</Label>
                      <Input
                        id="rib2"
                        value={personalData.rib2}
                        onChange={(e) => handlePersonalDataChange('rib2', e.target.value)}
                        placeholder="FR76 9876 5432 1098 7654 3210 987"
                        className="mt-1 font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        RIB alternatif si nécessaire
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingPersonalData(false)
                          // Recharger les données pour annuler les modifications
                          loadPersonalData()
                        }}
                        disabled={isSavingPersonalData}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSavePersonalData}
                        disabled={isSavingPersonalData}
                        className="flex items-center space-x-2"
                      >
                        {isSavingPersonalData ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Sauvegarde...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Sauvegarder</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Numéro de Téléphone</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {personalData.telephone || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">RIB Salaire</Label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">
                          {personalData.rib_salaire || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">RIB Secondaire</Label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {personalData.rib2 || 'Non renseigné'}
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Informations importantes
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Vos informations sont synchronisées avec la section employé de l'administration</li>
                              <li>Le RIB principal est utilisé pour les paiements de salaires</li>
                              <li>Le RIB secondaire est optionnel et peut être utilisé pour des paiements spécifiques</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section Documents Administratifs */}
        {activeTab === 'documents-administratifs' && (
          <>
            <DocumentsAdministratifs
              documents={documents}
              loading={loadingDocuments}
              onNewRequest={() => setShowDocumentModal(true)}
              technicienAccountId={user?.account_id}
            />
            <NewDocumentModal
              show={showDocumentModal}
              onClose={() => setShowDocumentModal(false)}
              onSubmit={handleCreateDocument}
              documentTypes={documentTypes}
              formData={newDocument}
              onChange={(field, value) => setNewDocument({...newDocument, [field]: value})}
            />
          </>
        )}

        {/* Section Absences */}
        {activeTab === 'absences' && (
          <TechnicienAbsences user={user} fetchWithAuth={fetchWithAuth} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-gray-500">
            <p>© 2025 FinalFibre - Espace Technicien</p>
            <p className="mt-1">Connecté en tant que {user.prenom} {user.nom}</p>
          </div>
        </div>
      </footer>

      {/* Modal de résolution de réclamation */}
      {showReclamationModal && selectedReclamation && (
        <ReclamationResolveModal
          reclamation={selectedReclamation}
          onClose={() => {
            setShowReclamationModal(false)
            setSelectedReclamation(null)
            setUploadedPhotos([])
          }}
          onResolve={handleReclamationResolve}
          uploadedPhotos={uploadedPhotos}
          onPhotoUpload={handlePhotoUpload}
          onRemovePhoto={removePhoto}
          isResolving={isResolving}
        />
      )}

      {/* Modal de signalement de problème */}
      {showSignalModal && selectedIntervention && (
        <SignalProblemModal
          intervention={selectedIntervention}
          onClose={() => {
            setShowSignalModal(false)
            setSelectedIntervention(null)
          }}
          onSignal={handleSignalProblem}
          isSignaling={isSignaling}
        />
      )}

      {/* Modal des détails des primes */}
      {showPrimesModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-green-500 to-green-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  🎁 Détails des Primes
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPrimesModal(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-green-100 text-sm mt-1">
                Total: {primesData.total_primes.toLocaleString('fr-FR')}€
              </p>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {primesData.primes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Aucune prime pour cette période</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {primesData.primes.map((prime: any) => (
                    <div 
                      key={prime.id} 
                      className="p-4 rounded-lg border bg-green-50 border-green-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xl text-green-700">
                              +{parseFloat(prime.montant).toLocaleString('fr-FR')}€
                            </span>
                          </div>
                          {prime.note && (
                            <div className="mt-2 p-2 bg-white rounded border border-green-100">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-gray-500">📝 Note:</span> {prime.note}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Ajoutée le {new Date(prime.date_prime || prime.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setShowPrimesModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal des recla free */}
      {showReclaFreeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowReclaFreeModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recla Free</h3>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {recetteGeneree.total_recla_free_confirmee > 0 && (
                      <span className="text-sm font-semibold text-orange-600">✓ +{recetteGeneree.total_recla_free_confirmee.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ confirmé</span>
                    )}
                    {reclaFreeData.filter((rf: any) => !rf.confirmer).reduce((s: number, rf: any) => s + (parseFloat(rf.montant_technicien) || 0), 0) > 0 && (
                      <span className="text-sm font-semibold text-yellow-600">⏳ +{reclaFreeData.filter((rf: any) => !rf.confirmer).reduce((s: number, rf: any) => s + (parseFloat(rf.montant_technicien) || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ en cours</span>
                    )}
                    {recetteGeneree.total_recla_free_confirmee === 0 && reclaFreeData.filter((rf: any) => !rf.confirmer).length === 0 && (
                      <span className="text-sm text-gray-500">{reclaFreeData.length} entrée{reclaFreeData.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowReclaFreeModal(false)}>
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {reclaFreeData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune recla free pour cette période</p>
              ) : (
                reclaFreeData.map((rf: any) => (
                  <div key={rf.id} className={`border rounded-lg p-4 ${rf.confirmer ? 'border-orange-200 bg-orange-50' : 'border-yellow-200 bg-yellow-50'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Statut confirmation */}
                        {rf.confirmer ? (
                          <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs font-bold">Confirmée</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">En cours</span>
                        )}
                        {rf.type_litige && (
                          <span className="px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full text-xs font-semibold">
                            {rf.type_litige === 'controleur' ? 'Contrôleur' : 'Client'}
                          </span>
                        )}
                        {rf.status_ticket && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">{rf.status_ticket}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold whitespace-nowrap ${rf.confirmer ? 'text-orange-600' : 'text-yellow-700'}`}>
                          +{parseFloat(rf.montant_technicien || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 mb-2">
                      {rf.reference_client && <div><span className="font-medium text-gray-500">Réf. client:</span> {rf.reference_client}</div>}
                      {rf.agence && <div><span className="font-medium text-gray-500">Agence:</span> {rf.agence}</div>}
                      {rf.region && <div><span className="font-medium text-gray-500">Région:</span> {rf.region}</div>}
                      {rf.code_postal && <div><span className="font-medium text-gray-500">CP:</span> {rf.code_postal}</div>}
                      {(rf.date || rf.created_at) && <div><span className="font-medium text-gray-500">Date:</span> {new Date(rf.date || rf.created_at).toLocaleDateString('fr-FR')}</div>}
                      {rf.nature_travaux && <div><span className="font-medium text-gray-500">Nature:</span> {rf.nature_travaux}</div>}
                    </div>
                    {rf.nature_travaux_detail && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Détail:</span> {rf.nature_travaux_detail}</p>}
                    {rf.commentaire && <p className={`text-xs italic border-t pt-1 mt-1 ${rf.confirmer ? 'text-gray-500 border-orange-200' : 'text-gray-500 border-yellow-200'}`}>{rf.commentaire}</p>}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <Button className="w-full" variant="outline" onClick={() => setShowReclaFreeModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal FTTO */}
      {showFttoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowFttoModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">FTTO</h3>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {recetteGeneree.total_ftto_technicien > 0 && (
                      <span className="text-sm font-semibold text-blue-600">
                        Tech (40%): +{recetteGeneree.total_ftto_technicien.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{fttoData.length} ticket{fttoData.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowFttoModal(false)}>
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {fttoData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun ticket FTTO pour cette période</p>
              ) : (
                fttoData.map((ft: any) => (
                  <div key={ft.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold font-mono">
                          {ft.num_ticket || '—'}
                        </span>
                        {ft.code_article && (
                          <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                            {ft.code_article}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-blue-600 whitespace-nowrap">
                          +{parseFloat(ft.part_technicien || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                          <span className="text-xs font-normal text-gray-500 ml-1">40%</span>
                        </div>
                        <div className="text-xs text-gray-500">H.T.: {parseFloat(ft.total_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 mb-2">
                      {ft.date_ticket && <div><span className="font-medium text-gray-500">Date:</span> {new Date(ft.date_ticket).toLocaleDateString('fr-FR')}</div>}
                      {ft.ville && <div><span className="font-medium text-gray-500">Ville:</span> {ft.ville}</div>}
                      {ft.code_g2r && <div><span className="font-medium text-gray-500">Code G2R:</span> {ft.code_g2r}</div>}
                      {ft.quantite && <div><span className="font-medium text-gray-500">Quantité:</span> {ft.quantite}</div>}
                    </div>
                    {ft.designation && (
                      <p className="text-xs text-gray-600 border-t border-blue-200 pt-1 mt-1 italic">{ft.designation}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <Button className="w-full" variant="outline" onClick={() => setShowFttoModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                Changer le mot de passe
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowChangePasswordModal(false)
                  setOldPassword('')
                  setNewPassword('')
                  setConfirmNewPassword('')
                  setPasswordError('')
                }}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            {passwordError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="oldPassword">Ancien mot de passe</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Entrez votre ancien mot de passe"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Retaper le nouveau mot de passe"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowChangePasswordModal(false)
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmNewPassword('')
                    setPasswordError('')
                  }}
                  disabled={changingPassword}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !oldPassword || !newPassword || !confirmNewPassword}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {changingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Changement...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Changer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour afficher une réclamation
function ReclamationCard({ reclamation, onResolve, calculateDeadline }: { reclamation: any, onResolve: (id: number, photos: File[], comment: string) => void, calculateDeadline: (reclamation: Reclamation) => any }) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'résolu':
      case 'resolue':
        return 'bg-green-100 text-green-800'
      case 'en cours':
      case 'en_cours':
        return 'bg-blue-100 text-blue-800'
      case 'en attente':
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800'
      case 'ouverte':
        return 'bg-orange-100 text-orange-800'
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

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="flex-1">
                <div className="flex flex-col gap-2 mb-2">
                  <h3 className="font-semibold text-base sm:text-lg break-words">{reclamation.numero_reclamation}</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Badge className={`${getPriorityColor(reclamation.priorite)} text-xs`}>
                      {reclamation.priorite}
                    </Badge>
                    <Badge className={`${getStatusColor(reclamation.statut)} text-xs`}>
                      {reclamation.statut === 'en_cours' ? 'En cours' : 
                       reclamation.statut === 'résolu' || reclamation.statut === 'resolu' ? 'Résolu' :
                       reclamation.statut}
                    </Badge>
                    {/* Indicateur de message admin */}
                    {reclamation.commentaires_internes && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                        📝 Message admin
                      </Badge>
                    )}
                  </div>
                </div>
            
            <p className="text-sm sm:text-base text-gray-600 mb-2 font-medium break-words">{reclamation.nom_client || reclamation.client}</p>
            
            {/* Informations de contact du client */}
            {(reclamation.telephone_client || reclamation.email_client || reclamation.adresse_client) && (
              <div className="mb-3 p-2 sm:p-3 bg-gray-50 rounded border">
                <span className="text-xs font-medium text-gray-500 uppercase block mb-2">Informations de contact:</span>
                <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                  {reclamation.telephone_client && (
                    <div>
                      <span className="font-medium text-gray-600">Téléphone:</span>
                      <p className="text-gray-800 break-all">{reclamation.telephone_client}</p>
                    </div>
                  )}
                  {reclamation.email_client && (
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-800 break-all text-xs">{reclamation.email_client}</p>
                    </div>
                  )}
                  {reclamation.adresse_client && (
                    <div>
                      <span className="font-medium text-gray-600">Adresse:</span>
                      <p className="text-gray-800 break-words">{reclamation.adresse_client}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Alerte pour réclamations rejetées */}
            {reclamation.statut === 'ouverte' && reclamation.commentaires_internes && (
              <div className="mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-medium text-red-800">Réclamation rejetée</h4>
                    <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">
                      Cette réclamation a été rejetée par l'administration. Veuillez consulter les détails pour plus d'informations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Alerte pour réclamations en retard - seulement pour les réclamations ouvertes */}
            {reclamation.statut === 'ouverte' && (() => {
              const deadline = calculateDeadline(reclamation)
              if (deadline.isOverdue) {
                return (
                  <div className="mb-3 p-2 sm:p-3 bg-red-100 border border-red-300 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-red-800">⚠️ RÉCLAMATION EN RETARD</h4>
                        <p className="text-xs sm:text-sm text-red-700 mt-1 break-words">
                          Cette réclamation est en retard de {Math.abs(deadline.daysRemaining)} jours. 
                          Elle sera automatiquement fermée si non traitée rapidement.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
            
            {/* Informations de base */}
            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-gray-500 mb-3">
              <div className="flex justify-between">
                <span className="font-medium">Type:</span> 
                <span className="text-right break-words">{reclamation.type_reclamation}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Créée le:</span> 
                <span className="text-right">{reclamation.date_creation || reclamation.date_reclamation}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Priorité:</span> 
                <span className="text-right">{reclamation.priorite}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Statut:</span> 
                <span className="text-right">{reclamation.statut}</span>
              </div>
            </div>

            {/* Calcul de l'échéance - seulement pour les réclamations non résolues */}
            {reclamation.statut !== 'resolue' && reclamation.statut !== 'résolu' && reclamation.statut !== 'fermee' && reclamation.statut !== 'fermée' && (() => {
              const deadline = calculateDeadline(reclamation)
              return (
                <div className="mb-3 p-2 sm:p-3 rounded-lg border">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Échéance de traitement</span>
                    <span className={`text-xs px-2 py-1 rounded w-fit ${
                      deadline.isOverdue ? 'bg-red-100 text-red-800' :
                      deadline.isUrgent ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {deadline.isOverdue ? 'EN RETARD' : 
                       deadline.isUrgent ? 'URGENT' : 'EN COURS'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Date d'échéance:</span>
                      <p className="text-gray-800 font-mono text-right">{deadline.deadlineDate}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Jours restants:</span>
                      <p className={`font-bold text-right ${
                        deadline.isOverdue ? 'text-red-600' :
                        deadline.isUrgent ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {deadline.daysRemaining < 0 ? `${Math.abs(deadline.daysRemaining)} jours de retard` :
                         deadline.daysRemaining === 0 ? 'Dernier jour' :
                         `${deadline.daysRemaining} jours restants`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 break-words">
                    Délai de traitement: {deadline.deadlineDays} jours ({reclamation.type_reclamation === 'client' ? 'Réclamation client' : reclamation.type_reclamation === 'controleur' ? 'Réclamation contrôleur' : 'Réclamation technique'})
                  </div>
                </div>
              )
            })()}

            {/* Section spéciale pour les réclamations résolues */}
            {(reclamation.statut === 'resolue' || reclamation.statut === 'résolu') && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-800">✅ Réclamation résolue</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    TERMINÉE
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {reclamation.date_resolution && (
                    <div>
                      <span className="font-medium text-green-700">Date de résolution:</span>
                      <p className="text-green-800 font-mono">{new Date(reclamation.date_resolution).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                  {reclamation.description_solution && (
                    <div className="sm:col-span-2">
                      <span className="font-medium text-green-700">Solution appliquée:</span>
                      <p className="text-green-800 text-sm mt-1">{reclamation.description_solution}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section spéciale pour les réclamations en cours de traitement */}
            {(reclamation.statut === 'en_cours' || reclamation.statut === 'en cours') && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">🔄 En cours de traitement</span>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                    EN ATTENTE
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  <p className="mb-2">
                    Cette réclamation a été marquée comme résolue et est en attente de validation par l'administration.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Photos envoyées - En attente de validation admin</span>
                  </div>
                </div>
              </div>
            )}

            {/* Informations d'intervention */}
            {(reclamation.numero_intervention || reclamation.intervention_num) && (
              <div className="mb-3">
                <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Intervention associée:</span>
                <div className="bg-blue-50 p-3 rounded border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Numéro:</span>
                      <p className="font-mono text-blue-900">{reclamation.numero_intervention || reclamation.intervention_num}</p>
                    </div>
                    {reclamation.intervention_client && (
                      <div>
                        <span className="font-medium text-blue-800">Client:</span>
                        <p className="text-blue-900">{reclamation.intervention_client}</p>
                      </div>
                    )}
                    {reclamation.date_intervention && (
                      <div>
                        <span className="font-medium text-blue-800">Date:</span>
                        <p className="text-blue-900">{reclamation.date_intervention}</p>
                      </div>
                    )}
                    {reclamation.intervention_statut && (
                      <div>
                        <span className="font-medium text-blue-800">Statut:</span>
                        <p className="text-blue-900">{reclamation.intervention_statut}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showDetails && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-3 text-gray-900">Détails de la réclamation</h4>
                
                {/* Informations principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">Numéro d'intervention:</span>
                    </div>
                    <p className="text-sm font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {reclamation.numero_intervention || reclamation.intervention_num || 'Non spécifié'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">Client:</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{reclamation.client}</p>
                  </div>
                </div>

                {/* Description du problème */}
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Description du problème:</span>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {reclamation.description_probleme || reclamation.description || 'Aucune description disponible'}
                  </p>
                </div>

                {/* Commentaires internes (messages de l'admin) */}
                {reclamation.commentaires_internes && (
                  <div className="mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Messages de l'administration:</span>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                            {reclamation.commentaires_internes}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations techniques */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {reclamation.intervention_client && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Intervention Client:</span>
                      <p className="text-sm text-gray-700">{reclamation.intervention_client}</p>
                    </div>
                  )}
                  
                  {reclamation.delai_resolution && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Délai de résolution:</span>
                      <p className="text-sm text-gray-700">{reclamation.delai_resolution} jours</p>
                    </div>
                  )}
                </div>

                {/* Informations de suivi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Date de création:</span>
                    <p className="text-sm text-gray-700">{reclamation.date_creation}</p>
                  </div>
                  
                  {reclamation.date_resolution && (
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase block mb-1">Date de résolution:</span>
                      <p className="text-sm text-gray-700">{reclamation.date_resolution}</p>
                    </div>
                  )}
                </div>

                {/* Commentaire de résolution si disponible */}
                {reclamation.commentaire_resolution && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <span className="text-xs font-medium text-green-700 uppercase block mb-1">Commentaire de résolution:</span>
                    <p className="text-sm text-green-800">{reclamation.commentaire_resolution}</p>
                  </div>
                )}

                {/* Photos justificatives si disponibles */}
                {reclamation.photos && reclamation.photos.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-2">
                      📷 Photos justificatives ({reclamation.photos.length}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {reclamation.photos.map((photo: any, index: number) => (
                        <div key={photo.id} className="relative group cursor-pointer">
                          <a 
                            href={photo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={photo.url}
                              alt={photo.name || `Photo justificative ${index + 1}`}
                              className="w-full h-24 object-cover rounded border border-gray-200 transition-transform group-hover:scale-105 group-hover:shadow-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.jpg'
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                Voir
                              </span>
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Cliquez sur une photo pour l'agrandir
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                {showDetails ? 'Masquer' : 'Détails'}
              </Button>
              
              {/* Bouton Résolu - seulement pour les réclamations ouvertes */}
              {reclamation.statut === 'ouverte' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // Déclencher l'ouverture du modal depuis le composant parent
                    window.dispatchEvent(new CustomEvent('openResolveModal', { detail: reclamation }))
                  }}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Résolu
                </Button>
              )}

              {/* Bouton désactivé pour les réclamations en cours */}
              {(reclamation.statut === 'en_cours' || reclamation.statut === 'en cours') && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={true}
                  className="flex items-center gap-1 bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50"
                >
                  <Check className="w-4 h-4" />
                  En cours de traitement
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Modal pour résoudre une réclamation
function ReclamationResolveModal({ 
  reclamation, 
  onClose, 
  onResolve, 
  uploadedPhotos, 
  onPhotoUpload, 
  onRemovePhoto, 
  isResolving 
}: {
  reclamation: any
  onClose: () => void
  onResolve: (id: number, photos: File[], comment: string) => void
  uploadedPhotos: File[]
  onPhotoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: (index: number) => void
  isResolving: boolean
}) {
  const [comment, setComment] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadedPhotos.length === 0) {
      alert('Veuillez ajouter au moins une photo justificative')
      return
    }
    onResolve(reclamation.id, uploadedPhotos, comment)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Résoudre la réclamation
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XIcon className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Marquer la réclamation {reclamation.numero_reclamation} comme résolue
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations de la réclamation */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Réclamation</h4>
              <p className="text-sm text-gray-600">{reclamation.client} - {reclamation.type_reclamation}</p>
            </div>

            {/* Photos justificatives */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Photos justificatives <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onPhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Cliquez pour ajouter des photos</span>
                </label>
              </div>
              
              {/* Aperçu des photos */}
              {uploadedPhotos.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium mb-2">Photos ajoutées ({uploadedPhotos.length})</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => onRemovePhoto(index)}
                        >
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Commentaire de résolution
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Décrivez comment la réclamation a été résolue..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isResolving || uploadedPhotos.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isResolving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Résolution en cours...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Marquer comme résolu
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Modal pour signaler un problème sur une intervention
function SignalProblemModal({
  intervention,
  onClose,
  onSignal,
  isSignaling
}: {
  intervention: Intervention | null
  onClose: () => void
  onSignal: (description: string) => void
  isSignaling: boolean
}) {
  const [description, setDescription] = useState('')

  if (!intervention) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      alert('Veuillez décrire le problème')
      return
    }
    onSignal(description)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Signaler un problème
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XIcon className="w-4 h-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Intervention {intervention.num_inter} - {intervention.client}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations de l'intervention */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-2 text-blue-900">Intervention</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-800">
                <div>
                  <span className="font-medium">Numéro:</span> {intervention.num_inter}
                </div>
                <div>
                  <span className="font-medium">Client:</span> {intervention.client}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {intervention.type_intervention}
                </div>
                <div>
                  <span className="font-medium">Date RDV:</span> {intervention.date_rdv}
                </div>
              </div>
            </div>

            {/* Description du problème */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description du problème <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le problème rencontré (article manquant, difficulté technique, problème client, etc.)..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={5}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Une réclamation technique sera créée et vous recevrez une notification une fois qu'elle sera traitée par l'administration.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSignaling}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSignaling || !description.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSignaling ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Envoyer le signalement
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
