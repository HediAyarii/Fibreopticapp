"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Package, Home, RefreshCw, Wrench, MapPin, Clock, ChevronRight, AlertCircle, CheckCircle, FileText } from "lucide-react"
import { useSocket } from "@/contexts/SocketContext"

interface CategorieIntervention {
  categorie: string
  nombre: number
  f8: number
  t8: number
  montant_total?: number
}

interface Intervention {
  id: number
  num_inter: string
  client: string
  date_rdv: string
  type_intervention: string
  statut: string
  articles?: string
  grille?: string
  recette_technicien?: number
}

interface InterventionCategorieTableProps {
  nomTechnicien: string
  prenomTechnicien: string
  employeId?: number
  dateDebut?: string
  dateFin?: string
}

const getCategorieIcon = (categorie: string) => {
  switch (categorie) {
    case 'Pavillon':
      return <Home className="h-4 w-4 text-blue-600" />
    case 'Intérieur':
      return <Package className="h-4 w-4 text-green-600" />
    case 'Refrac':
      return <RefreshCw className="h-4 w-4 text-purple-600" />
    case 'SAV':
      return <Wrench className="h-4 w-4 text-orange-600" />
    case 'Reco':
      return <MapPin className="h-4 w-4 text-red-600" />
    case 'En cours':
      return <Clock className="h-4 w-4 text-yellow-600" />
    default:
      return null
  }
}

const getCategorieColor = (categorie: string) => {
  switch (categorie) {
    case 'Pavillon':
      return 'bg-blue-50 border-blue-200'
    case 'Intérieur':
      return 'bg-green-50 border-green-200'
    case 'Refrac':
      return 'bg-purple-50 border-purple-200'
    case 'SAV':
      return 'bg-orange-50 border-orange-200'
    case 'Reco':
      return 'bg-red-50 border-red-200'
    case 'En cours':
      return 'bg-yellow-50 border-yellow-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

export function InterventionCategorieTable({
  nomTechnicien,
  prenomTechnicien,
  employeId,
  dateDebut,
  dateFin
}: InterventionCategorieTableProps) {
  const [categories, setCategories] = useState<CategorieIntervention[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(null)
  const [interventionsDetail, setInterventionsDetail] = useState<Intervention[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // États pour la réclamation
  const [reclamationDialogOpen, setReclamationDialogOpen] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [typeReclamation, setTypeReclamation] = useState<string>('article_manquant')
  const [descriptionReclamation, setDescriptionReclamation] = useState('')
  const [submittingReclamation, setSubmittingReclamation] = useState(false)

  // États pour la confirmation de montant
  const [confirmationStatus, setConfirmationStatus] = useState<{
    isConfirmed: boolean;
    confirmationDate: string | null;
  }>({ isConfirmed: false, confirmationDate: null })
  const [submittingConfirmation, setSubmittingConfirmation] = useState(false)
  const [canConfirm, setCanConfirm] = useState(false)

  // ReclaFree
  const [reclaFreeData, setReclaFreeData] = useState<any[]>([])
  const [showReclaFreeDialog, setShowReclaFreeDialog] = useState(false)

  // FTTO
  const [fttoData, setFttoData] = useState<any[]>([])
  const [showFttoDialog, setShowFttoDialog] = useState(false)

  // Socket.IO pour notifications temps réel
  const socket = useSocket()

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          nom_technicien: nomTechnicien,
          prenom_technicien: prenomTechnicien,
        })

        if (dateDebut) params.append('date_debut', dateDebut)
        if (dateFin) params.append('date_fin', dateFin)

        const response = await fetch(`/api/interventions-categorie?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }

        const data = await response.json()
        
        // Convertir les valeurs en nombres pour éviter les problèmes de concaténation
        const normalizedData = data.map((cat: any) => ({
          ...cat,
          nombre: Number(cat.nombre) || 0,
          f8: Number(cat.f8) || 0,
          t8: Number(cat.t8) || 0,
          montant_total: Number(cat.montant_total) || 0
        }))
        
        setCategories(normalizedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setLoading(false)
      }
    }

    if (nomTechnicien && prenomTechnicien) {
      fetchCategories()
    }
  }, [nomTechnicien, prenomTechnicien, dateDebut, dateFin])

  // Charger les recla free confirmées du technicien
  useEffect(() => {
    const fetchReclaFree = async () => {
      if (!employeId) return
      try {
        const params = new URLSearchParams({ employe_id: String(employeId), confirmer: 'true' })
        if (dateDebut) params.append('date_debut', dateDebut)
        if (dateFin) params.append('date_fin', dateFin)
        const res = await fetch(`/api/recla-free?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setReclaFreeData(data.reclaFree || [])
        }
      } catch (e) {
        console.warn('recla_free fetch error:', e)
      }
    }
    fetchReclaFree()
  }, [employeId, dateDebut, dateFin])

  // Charger les tickets FTTO confirmés du technicien
  useEffect(() => {
    const fetchFtto = async () => {
      if (!employeId) return
      try {
        const params = new URLSearchParams({ employe_id: String(employeId) })
        if (dateDebut) params.append('date_debut', dateDebut)
        if (dateFin) params.append('date_fin', dateFin)
        const res = await fetch(`/api/ftto?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setFttoData(data.tickets || [])
        }
      } catch (e) {
        console.warn('ftto fetch error:', e)
      }
    }
    fetchFtto()
  }, [employeId, dateDebut, dateFin])

  // Vérifier le statut de confirmation et si le bouton peut être activé
  useEffect(() => {
    const checkConfirmationStatus = async () => {
      if (!employeId || !dateDebut) return

      // Extraire le mois au format YYYY-MM
      const mois = dateDebut.substring(0, 7) // Ex: "2025-10-01" -> "2025-10"

      try {
        // Vérifier si déjà confirmé
        const response = await fetch(`/api/confirmations-montants?employe_id=${employeId}&mois=${mois}`)
        const data = await response.json()

        if (data.success && data.confirmations.length > 0) {
          setConfirmationStatus({
            isConfirmed: true,
            confirmationDate: data.confirmations[0].date_confirmation
          })
          setCanConfirm(false)
        } else {
          setConfirmationStatus({
            isConfirmed: false,
            confirmationDate: null
          })

          // Vérifier si on est dans le mois suivant
          const [year, month] = mois.split('-').map(Number)
          const now = new Date()
          const currentYear = now.getFullYear()
          const currentMonth = now.getMonth() + 1

          // Le bouton est activé si on est dans le mois suivant ou après
          const isNextMonthOrLater = 
            currentYear > year || 
            (currentYear === year && currentMonth > month)

          setCanConfirm(isNextMonthOrLater)
        }
      } catch (error) {
        console.error('Erreur vérification confirmation:', error)
      }
    }

    checkConfirmationStatus()
  }, [employeId, dateDebut])

  const totalInterventions = categories.reduce((sum, cat) => sum + cat.nombre, 0)

  const handleCategorieClick = async (categorie: string) => {
    setSelectedCategorie(categorie)
    setLoadingDetail(true)
    
    try {
      // Construire les paramètres pour filtrer les interventions
      const params = new URLSearchParams({
        nom_technicien: nomTechnicien,
        prenom_technicien: prenomTechnicien,
        statut: 'CLOTURE TERMINEE',
      })

      if (dateDebut) params.append('date_debut', dateDebut)
      if (dateFin) params.append('date_fin', dateFin)

      const response = await fetch(`/api/interventions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des interventions')
      }

      const data = await response.json()
      
      // Récupérer aussi les données de revenue pour avoir les prix
      const revenueParams = new URLSearchParams()
      if (employeId) revenueParams.append('employe_id', employeId.toString())
      if (dateDebut) revenueParams.append('date_from', dateDebut)
      if (dateFin) revenueParams.append('date_to', dateFin)
      
      const revenueResponse = await fetch(`/api/revenue-calculation?${revenueParams.toString()}`)
      const revenueData = await revenueResponse.json()
      
      // Créer un map des prix par num_inter
      const priceMap = new Map()
      if (revenueData.revenue_data) {
        const techData = revenueData.revenue_data.find((tech: any) => 
          tech.employe_nom === nomTechnicien && tech.employe_prenom === prenomTechnicien
        )
        
        if (techData && techData.interventions_detail) {
          techData.interventions_detail.forEach((inter: any) => {
            priceMap.set(inter.num_inter, inter.recette_technicien)
          })
        }
      }
      
      // Filtrer les interventions selon la catégorie et ajouter les prix
      const filtered = data.interventions
        .filter((inter: Intervention) => {
          const articles = inter.articles || ''
          
          switch (categorie) {
            case 'Pavillon':
              return articles.includes('RACPAV') || articles.includes('RACPRO_S') || articles.includes('RAC_PBO_AERIEN') || articles.includes('RAC_PBO_FACADE') || articles.includes('RAC_PBO_SOUT')
            case 'Intérieur':
              return articles.includes('RACIH')
            case 'Refrac':
              return articles.includes('REFRAC')
            case 'SAV':
              return articles.includes('DEP_OFFE') || articles.includes('SAV')
            case 'Reco':
              return articles.includes('RECOIP')
            case 'En cours':
              return articles === 'nan' || articles === '' || !articles
            default:
              // Autre = tout ce qui ne correspond à aucune autre catégorie
              return !(
                articles.includes('RACPAV') ||
                articles.includes('RACPRO_S') ||
                articles.includes('RAC_PBO_AERIEN') ||
                articles.includes('RAC_PBO_FACADE') ||
                articles.includes('RAC_PBO_SOUT') ||
                articles.includes('RACIH') ||
                articles.includes('REFRAC') ||
                articles.includes('DEP_OFFE') ||
                articles.includes('SAV') ||
                articles.includes('RECOIP') ||
                articles === 'nan' ||
                articles === '' ||
                !articles
              )
          }
        })
        .map((inter: Intervention) => ({
          ...inter,
          recette_technicien: priceMap.get(inter.num_inter) || 0
        }))
      
      setInterventionsDetail(filtered)
      
      // Calculer le montant total de cette catégorie
      const montantTotal = filtered.reduce((sum: number, inter: Intervention) => sum + (inter.recette_technicien || 0), 0)
      
      // Mettre à jour le montant dans la catégorie
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.categorie === categorie 
            ? { ...cat, montant_total: montantTotal }
            : cat
        )
      )
      
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
    } finally {
      setLoadingDetail(false)
    }
  }
  
  const handleOpenReclamation = (intervention: Intervention, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIntervention(intervention)
    setTypeReclamation('article_manquant')
    setDescriptionReclamation('')
    setReclamationDialogOpen(true)
  }

  const handleConfirmerMontants = async () => {
    if (!employeId || !dateDebut) {
      alert('Informations manquantes')
      return
    }

    const mois = dateDebut.substring(0, 7) // Format: YYYY-MM

    // Calculer le montant total et les détails
    const montantTotal = categories.reduce((sum, cat) => sum + (cat.montant_total || 0), 0)
    
    const montantsParCategorie: Record<string, number> = {}
    categories.forEach(cat => {
      montantsParCategorie[cat.categorie] = cat.montant_total || 0
    })

    const details = {
      total_interventions: totalInterventions,
      montants_par_categorie: montantsParCategorie,
      carburant: 0, // TODO: Ajouter les données de carburant si disponibles
      penalites: 0  // TODO: Ajouter les données de pénalités si disponibles
    }

    try {
      setSubmittingConfirmation(true)

      const response = await fetch('/api/confirmations-montants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employe_id: employeId,
          matricule: null, // TODO: Ajouter le matricule si disponible
          mois,
          montant_confirme: montantTotal,
          details
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Montants confirmés avec succès !')
        setConfirmationStatus({
          isConfirmed: true,
          confirmationDate: data.confirmation.date_confirmation
        })
        setCanConfirm(false)
      } else {
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error)
      alert('❌ Erreur lors de la confirmation')
    } finally {
      setSubmittingConfirmation(false)
    }
  }
  
  const handleSubmitReclamation = async () => {
    if (!selectedIntervention || !descriptionReclamation.trim()) {
      alert('Veuillez remplir tous les champs')
      return
    }
    
    try {
      setSubmittingReclamation(true)
      
      const response = await fetch('/api/reclamations-techniques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intervention_id: selectedIntervention.id,
          num_inter: selectedIntervention.num_inter,
          technicien_id: employeId,
          nom_technicien: nomTechnicien,
          prenom_technicien: prenomTechnicien,
          type_reclamation: typeReclamation,
          description: descriptionReclamation,
          date_intervention: selectedIntervention.date_rdv,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Réclamation envoyée avec succès !')
        
        // Émettre l'événement Socket.IO pour mise à jour en temps réel
        if (socket?.socket) {
          socket.socket.emit('reclamation_technique_created', data.reclamation)
          console.log('✅ Événement Socket.IO émis depuis le client:', data.reclamation)
        }
        
        setReclamationDialogOpen(false)
        setSelectedIntervention(null)
        setDescriptionReclamation('')
      } else {
        alert('Erreur lors de l\'envoi de la réclamation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi de la réclamation')
    } finally {
      setSubmittingReclamation(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Interventions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Interventions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Résumé des Interventions</span>
          <span className="text-sm font-normal text-gray-500">
            Total: {totalInterventions} interventions
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Catégorie</TableHead>
                <TableHead className="text-right">Nombre</TableHead>
                <TableHead className="text-right">F8</TableHead>
                <TableHead className="text-right">T8</TableHead>
                <TableHead className="text-right">Montant Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 && reclaFreeData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Aucune intervention trouvée
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {categories.map((cat) => (
                    <TableRow 
                      key={cat.categorie} 
                      className={`${getCategorieColor(cat.categorie)} cursor-pointer hover:opacity-80 transition-opacity`}
                      onClick={() => handleCategorieClick(cat.categorie)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getCategorieIcon(cat.categorie)}
                          <span>{cat.categorie}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {cat.nombre}
                      </TableCell>
                      <TableCell className="text-right">
                        {cat.f8 > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            {cat.f8}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {cat.t8 > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                            {cat.t8}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          {(cat.montant_total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reclaFreeData.length > 0 && (
                    <TableRow
                      className="bg-orange-50 border-t-2 border-orange-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowReclaFreeDialog(true)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-800 font-semibold">ReclaFree</span>
                          <ChevronRight className="h-4 w-4 text-orange-400 ml-auto" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-orange-700">{reclaFreeData.length}</TableCell>
                      <TableCell className="text-right"><span className="text-gray-400">-</span></TableCell>
                      <TableCell className="text-right"><span className="text-gray-400">-</span></TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-orange-600">
                          +{reclaFreeData.reduce((s, rf) => s + parseFloat(rf.montant_technicien || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                  {fttoData.length > 0 && (
                    <TableRow
                      className="bg-blue-50 border-t-2 border-blue-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setShowFttoDialog(true)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800 font-semibold">FTTO</span>
                          <ChevronRight className="h-4 w-4 text-blue-400 ml-auto" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-700">{fttoData.length}</TableCell>
                      <TableCell className="text-right"><span className="text-gray-400">-</span></TableCell>
                      <TableCell className="text-right"><span className="text-gray-400">-</span></TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-blue-600">
                          +{fttoData.reduce((s: number, ft: any) => s + parseFloat(ft.part_technicien || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bouton de confirmation des montants */}
        <div className="mt-6 flex justify-end">
          {confirmationStatus.isConfirmed ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                ✅ Confirmé le {new Date(confirmationStatus.confirmationDate!).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ) : (
            <Button
              onClick={handleConfirmerMontants}
              disabled={!canConfirm || submittingConfirmation}
              className={`${
                canConfirm 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              title={
                !canConfirm 
                  ? `Ce bouton sera activé à partir du ${dateDebut ? new Date(new Date(dateDebut).setMonth(new Date(dateDebut).getMonth() + 1)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}`
                  : 'Confirmer les montants de ce mois'
              }
            >
              {submittingConfirmation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmation en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmer les montants
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Dialog pour afficher les interventions d'une catégorie */}
      <Dialog open={selectedCategorie !== null} onOpenChange={() => setSelectedCategorie(null)}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCategorie && getCategorieIcon(selectedCategorie)}
              Interventions - {selectedCategorie}
              <Badge variant="secondary" className="ml-auto">
                {interventionsDetail.length} intervention{interventionsDetail.length > 1 ? 's' : ''}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : interventionsDetail.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune intervention trouvée pour cette catégorie
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
              {interventionsDetail.map((inter) => (
                <div 
                  key={inter.id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-lg">{inter.num_inter}</span>
                        <Badge variant="outline">{inter.client}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date RDV:</span> {inter.date_rdv}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {inter.type_intervention}
                        </div>
                        {inter.articles && inter.articles !== 'nan' && (
                          <div className="col-span-2">
                            <span className="font-medium">Articles:</span> {inter.articles}
                          </div>
                        )}
                        {inter.recette_technicien !== undefined && (
                          <div className="col-span-2">
                            <span className="font-medium">Prix Technicien:</span>{' '}
                            <span className="text-green-600 font-semibold">
                              {inter.recette_technicien.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        className={
                          inter.statut === 'CLOTURE TERMINEE' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                        }
                      >
                        {inter.statut}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleOpenReclamation(inter, e)}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Signaler un problème
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog ReclaFree */}
      <Dialog open={showReclaFreeDialog} onOpenChange={setShowReclaFreeDialog}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Recla Free confirmées
              <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
                {reclaFreeData.length} entrée{reclaFreeData.length !== 1 ? 's' : ''} — votre part: +{reclaFreeData.reduce((s, rf) => s + parseFloat(rf.montant_technicien || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-3 pr-2">
            {reclaFreeData.map((rf) => (
              <div key={rf.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
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
                    <div className="text-lg font-bold text-orange-600 whitespace-nowrap">
                      +{parseFloat(rf.montant_technicien || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ <span className="text-xs font-normal text-gray-500">votre part</span>
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
                {rf.nature_travaux_detail && (
                  <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Détail:</span> {rf.nature_travaux_detail}</p>
                )}
                {rf.commentaire && (
                  <p className="text-xs text-gray-500 italic border-t border-orange-200 pt-1 mt-1">{rf.commentaire}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReclaFreeDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog FTTO */}
      <Dialog open={showFttoDialog} onOpenChange={setShowFttoDialog}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              FTTO
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
                {fttoData.length} ticket{fttoData.length !== 1 ? 's' : ''} — part tech: +{fttoData.reduce((s: number, ft: any) => s + parseFloat(ft.part_technicien || 0), 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-3 pr-2">
            {fttoData.map((ft: any) => (
              <div key={ft.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold font-mono">
                      {ft.num_ticket || '—'}
                    </span>
                    {ft.code_article && (
                      <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">{ft.code_article}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-blue-600 whitespace-nowrap">
                      +{parseFloat(ft.part_technicien || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                      <span className="text-xs font-normal text-gray-500 ml-1">35%</span>
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
                  <p className="text-xs text-gray-500 italic border-t border-blue-200 pt-1 mt-1">{ft.designation}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFttoDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer une réclamation */}
      <Dialog open={reclamationDialogOpen} onOpenChange={setReclamationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Signaler un Problème
            </DialogTitle>
          </DialogHeader>
          {selectedIntervention && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Intervention</p>
                <p className="font-semibold text-lg">{selectedIntervention.num_inter}</p>
                <p className="text-sm text-gray-500">{selectedIntervention.client}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Type de Problème</label>
                <Select value={typeReclamation} onValueChange={setTypeReclamation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article_manquant">Article Manquant</SelectItem>
                    <SelectItem value="probleme_technique">Problème Technique</SelectItem>
                    <SelectItem value="erreur_grille">Erreur de Grille Tarifaire</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description du Problème <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={descriptionReclamation}
                  onChange={(e) => setDescriptionReclamation(e.target.value)}
                  placeholder="Décrivez le problème en détail..."
                  rows={6}
                  className="w-full"
                />
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-medium">Note:</p>
                <p>Votre réclamation sera envoyée à l'administrateur qui vous répondra dans les plus brefs délais.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReclamationDialogOpen(false)}
              disabled={submittingReclamation}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitReclamation}
              disabled={submittingReclamation || !descriptionReclamation.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submittingReclamation ? 'Envoi en cours...' : 'Envoyer la Réclamation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
