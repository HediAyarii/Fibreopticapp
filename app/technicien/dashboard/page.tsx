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
  Car
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
// import { useEmployeeUpdates } from '@/hooks/useEmployeeUpdates' // Désactivé pour éviter les erreurs de build

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
  const [recetteGeneree, setRecetteGeneree] = useState({
    total_recette_technicien: 0,
    nombre_interventions: 0
  })
  
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
      
      // Construire les paramètres de date pour l'API revenue (format différent)
      const revenueDateParams = activeTab === 'overview' && dateDebut && dateFin
        ? `&date_from=${dateDebut}&date_to=${dateFin}`
        : ''
      
      // Charger toutes les données en parallèle pour de meilleures performances
      const [interventionsResponse, reclamationsResponse, penalitesResponse, revenueResponse] = await Promise.all([
        fetchWithAuth(`/api/interventions?employe_id=${user.id}${dateParams}`),
        fetchWithAuth(`/api/reclamations?employe_id=${user.id}${dateParams}`),
        fetchWithAuth(`/api/penalites?employe_id=${user.id}${dateParams}`),
        fetchWithAuth(`/api/revenue-calculation?employe_id=${user.id}${revenueDateParams}`)
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
          nombre_interventions: parseInt(technicienRevenue.nombre_interventions || 0)
        })
      } else {
        setRecetteGeneree({
          total_recette_technicien: 0,
          nombre_interventions: 0
        })
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
          type_reclamation: 'technique',
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
          prochaine_echeance_km: data.assignation.prochaine_echeance_km || null
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
                nombre_interventions: parseInt(technicienRevenue.nombre_interventions || 0)
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
    
    // Délai selon le type de réclamation (7 jours pour client, 14 jours pour technique)
    const deadlineDays = reclamation.type_reclamation === 'client' ? 7 : 14
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
    return <SessionExpired onRetry={checkAuth} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center gap-4">
            {/* Logo et titre - Mobile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Dashboard Technicien</h1>
                <p className="text-sm text-gray-500">FinalFibre</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">FinalFibre</h1>
              </div>
            </div>
            
            {/* Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-6">
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
                {/* Indicateur de connexion SSE */}
                <div className="flex items-center space-x-1 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Temps réel' : 'Hors ligne'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isUpdating && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Mise à jour...</span>
                  </div>
                )}
                <NotificationCenter employeeId={user.id} />
                <MobilePushNotificationManager employeeId={user.id} />
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

            {/* Actions - Mobile */}
            <div className="flex items-center space-x-2 lg:hidden">
              {isUpdating && (
                <div className="flex items-center space-x-1 text-xs text-blue-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                </div>
              )}
              <NotificationCenter employeeId={user.id} />
              <MobilePushNotificationManager employeeId={user.id} />
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
            <div className="lg:hidden border-t bg-white">
              <div className="px-4 py-3 space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="text-gray-500">{user.matricule}</p>
                  {lastUpdate && (
                    <p className="text-xs text-gray-400">
                      Mis à jour: {lastUpdate.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2"
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
      <div className="bg-white border-b mt-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between">
            <nav className="flex space-x-8">
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filtres de date */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Filtres de Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalInterventions}</p>
                    </div>
                    <p className="text-xs font-medium text-gray-600">Total Interventions du Mois</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.interventionsMois}</p>
                    </div>
                    <p className="text-xs font-medium text-gray-600">Intervention Clôturé Terminé</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                      </div>
                      <div className="text-right">
                        <p className="text-lg sm:text-2xl font-bold text-gray-900">
                          {recetteGeneree.total_recette_technicien.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {recetteGeneree.nombre_interventions} inter.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-600">Recette du Mois</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.penalites}</p>
                    </div>
                    <p className="text-xs font-medium text-gray-600">Pénalités du Mois</p>
                  </div>
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
                </CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles (téléphone, RIB)
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
                    Délai de traitement: {deadline.deadlineDays} jours ({reclamation.type_reclamation === 'client' ? 'Réclamation client' : 'Réclamation technique'})
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
                    <span className="text-xs font-medium text-gray-500 uppercase block mb-2">Photos justificatives:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {reclamation.photos.map((photo: any, index: number) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.url}
                            alt={`Photo justificative ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg'
                            }}
                          />
                        </div>
                      ))}
                    </div>
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
