'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Download, 
  Edit, 
  Save, 
  X, 
  Filter,
  DollarSign,
  Users,
  Calendar,
  FileText,
  CreditCard,
  History,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react'
import PaymentHistoryModal from './PaymentHistoryModal'

interface CoutParSalaire {
  id: number
  nom: string
  prenom: string
  salaire_net: number
  salaire_brut: number
  cout_total: number
  charge: number
  mois: number
  annee: number
  matricule?: string | null
  taxe?: number
  impot?: number
  penalite?: number
  prime?: number
  total_genere?: number
  rap?: number
  total_paiements?: number
  created_at: string
  updated_at: string
}

interface Paiement {
  id: number
  cout_par_salaire_id: number
  employe_id: number
  montant_verse: number
  date_paiement: string
  methode_paiement: string
  reference_paiement?: string
  commentaires?: string
  statut: string
  employe_nom: string
  employe_prenom: string
  employe_matricule: string
  cout_nom: string
  cout_prenom: string
  mois: number
  annee: number
  total_paiements: number
  rap_actuel: number
  created_at: string
  updated_at: string
}

interface CoutParSalaireManagerProps {
  onClose?: () => void
}

export function CoutParSalaireManager({ onClose }: CoutParSalaireManagerProps) {
  const [couts, setCouts] = useState<CoutParSalaire[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingField, setEditingField] = useState<{id: number, field: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    matched: number,
    unmatched: number,
    total: number
  } | null>(null)
  
  // États pour l'attribution manuelle
  const [showManualAssignment, setShowManualAssignment] = useState(false)
  const [selectedCout, setSelectedCout] = useState<CoutParSalaire | null>(null)
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [syncing, setSyncing] = useState(false)
  
  // États pour les paiements
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)
  const [selectedCoutForPayment, setSelectedCoutForPayment] = useState<CoutParSalaire | null>(null)
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [paymentForm, setPaymentForm] = useState({
    montant_verse: '',
    date_paiement: new Date().toISOString().split('T')[0],
    methode_paiement: 'virement',
    reference_paiement: '',
    commentaires: ''
  })
  const [paymentLoading, setPaymentLoading] = useState(false)
  
  // États pour l'historique des paiements
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false)
  const [selectedEmployeForHistory, setSelectedEmployeForHistory] = useState<{
    id: number
    nom: string
    prenom: string
  } | null>(null)
  
  // États pour l'ajout de prime
  const [showPrimeModal, setShowPrimeModal] = useState(false)
  const [selectedCoutForPrime, setSelectedCoutForPrime] = useState<CoutParSalaire | null>(null)
  const [primeAmount, setPrimeAmount] = useState('')
  const [isEditingPrime, setIsEditingPrime] = useState(false)

  // États pour la synchronisation des noms
  const [syncingNames, setSyncingNames] = useState(false)
  const [nameSyncResult, setNameSyncResult] = useState<any>(null)

  // États pour la synchronisation des techniciens manquants
  const [syncingMissing, setSyncingMissing] = useState(false)
  const [missingSyncResult, setMissingSyncResult] = useState<any>(null)

  // Fonction utilitaire pour afficher "-" si valeur est 0 ou null (techniciens manquants)
  const formatValueOrDash = (value: any): string => {
    const num = parseFloat(value)
    if (!value || isNaN(num) || num === 0) return '-'
    return `${num.toLocaleString('fr-FR')}€`
  }

  // Fonction pour vérifier si c'est un technicien manquant (sans données d'import)
  const isMissingTechnician = (cout: CoutParSalaire): boolean => {
    return (!cout.salaire_net || parseFloat(String(cout.salaire_net)) === 0) &&
           (!cout.salaire_brut || parseFloat(String(cout.salaire_brut)) === 0) &&
           (!cout.cout_total || parseFloat(String(cout.cout_total)) === 0) &&
           (!cout.charge || parseFloat(String(cout.charge)) === 0)
  }

  // Fonction utilitaire pour formater l'impôt
  const formatImpot = (impot: any): string => {
    if (!impot) return '0.00€'
    const num = parseFloat(impot)
    return isNaN(num) ? '0.00€' : `${num.toFixed(2)}€`
  }

  // Fonction utilitaire pour vérifier si l'impôt est > 0
  const hasImpot = (impot: any): boolean => {
    if (!impot) return false
    const num = parseFloat(impot)
    return !isNaN(num) && num > 0
  }

  // Charger les données avec synchronisation automatique
  const loadData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Chargement des données avec synchronisation automatique...')
      
      // 1. D'abord, synchroniser automatiquement les totaux générés
      console.log('🔄 Synchronisation automatique des totaux générés...')
      try {
        const syncResponse = await fetch('/api/sync/total-genere', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json()
          if (syncData.success) {
            console.log(`✅ Synchronisation terminée: ${syncData.updated} employés mis à jour`)
          }
        }
      } catch (syncError) {
        console.warn('⚠️ Erreur synchronisation (non bloquante):', syncError)
      }
      
      // 2. Synchroniser automatiquement les taxes
      console.log('🔄 Synchronisation automatique des taxes...')
      try {
        const taxSyncResponse = await fetch('/api/sync/taxes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (taxSyncResponse.ok) {
          const taxSyncData = await taxSyncResponse.json()
          if (taxSyncData.success) {
            console.log(`✅ Synchronisation taxes terminée: ${taxSyncData.updated} employés mis à jour`)
          }
        }
      } catch (taxSyncError) {
        console.warn('⚠️ Erreur synchronisation taxes (non bloquante):', taxSyncError)
      }
      
      // NOTE: Les techniciens manquants ne sont PAS synchronisés automatiquement
      // L'admin doit d'abord faire l'import du mois, puis cliquer sur "Corriger Noms"
      // La synchro des techniciens manquants se fait après la correction des noms
      
      // 3. Charger les données mises à jour
      console.log('📊 Chargement des données mises à jour...')
      const response = await fetch(`/api/cout-par-salaire?mois=${selectedMonth}&annee=${selectedYear}`)
      const data = await response.json()
      
      if (data.success) {
        setCouts(data.couts || [])
        console.log(`✅ ${data.couts.length} enregistrements chargés avec totaux générés`)
        
        // Afficher les statistiques des totaux générés
        const withRevenue = data.couts.filter((cout: any) => cout.total_genere && cout.total_genere > 0)
        const withoutRevenue = data.couts.filter((cout: any) => !cout.total_genere || cout.total_genere === 0)
        
        console.log(`📊 Statistiques: ${withRevenue.length} avec recettes, ${withoutRevenue.length} sans recettes`)
        
        // Afficher un message si des totaux ont été synchronisés
        if (withRevenue.length > 0) {
          console.log(`🎯 Total Généré synchronisé pour ${withRevenue.length} employés`)
        }
      } else {
        console.error('❌ Erreur chargement données:', data.error)
        alert(`Erreur lors du chargement: ${data.error}`)
      }
    } catch (error) {
      console.error('❌ Erreur chargement:', error)
      alert('Erreur lors du chargement des données. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  // Charger les employés au montage du composant
  useEffect(() => {
    loadEmployees()
  }, [])

  // Fonction pour charger les employés disponibles
  const loadAvailableEmployees = async () => {
    try {
      const response = await fetch('/api/employes')
      const data = await response.json()
      
      if (data.success && data.employes) {
        setAvailableEmployees(data.employes)
        console.log(`✅ ${data.employes.length} employés chargés pour attribution manuelle`)
      }
    } catch (error) {
      console.error('❌ Erreur chargement employés:', error)
    }
  }

  // Fonction pour ouvrir la modal d'attribution manuelle
  const openManualAssignment = (cout: CoutParSalaire) => {
    setSelectedCout(cout)
    setSelectedEmployee(null)
    setShowManualAssignment(true)
    loadAvailableEmployees()
  }

  // Fonction pour attribuer manuellement un employé
  const assignEmployeeManually = async () => {
    if (!selectedCout || !selectedEmployee) return

    setAssigning(true)
    try {
      console.log('🔗 Attribution manuelle:', {
        cout: selectedCout,
        employee: selectedEmployee
      })

      const response = await fetch('/api/cout-par-salaire/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coutId: selectedCout.id,
          employeeId: selectedEmployee.id,
          matricule: selectedEmployee.matricule,
          taxe: selectedEmployee.pourcentage_taxe
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Attribution manuelle réussie:', result)
        alert(`Employé ${selectedEmployee.nom} ${selectedEmployee.prenom} attribué avec succès !`)
        
        // Recharger les données pour refléter les changements
        await loadData()
        setShowManualAssignment(false)
        setSelectedCout(null)
        setSelectedEmployee(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'attribution')
      }
    } catch (error) {
      console.error('❌ Erreur attribution manuelle:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'attribution')
    } finally {
      setAssigning(false)
    }
  }

  // Fonctions pour la gestion des paiements
  const openPaymentModal = (cout: CoutParSalaire) => {
    setSelectedCoutForPayment(cout)
    setPaymentForm({
      montant_verse: '',
      date_paiement: new Date().toISOString().split('T')[0],
      methode_paiement: 'virement',
      reference_paiement: '',
      commentaires: ''
    })
    setShowPaymentModal(true)
  }

  const openPaymentHistory = async (cout: CoutParSalaire) => {
    setSelectedCoutForPayment(cout)
    setPaymentLoading(true)
    
    try {
      const response = await fetch(`/api/paiements-employes?cout_id=${cout.id}`)
      const data = await response.json()
      
      if (data.success) {
        setPaiements(data.paiements)
        setShowPaymentHistory(true)
      } else {
        alert('Erreur lors du chargement de l\'historique des paiements')
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error)
      alert('Erreur lors du chargement de l\'historique des paiements')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!selectedCoutForPayment || !paymentForm.montant_verse) {
      alert('Veuillez remplir le montant versé')
      return
    }

    setPaymentLoading(true)
    try {
      // Debug: Afficher les informations
      console.log('🔍 Debug paiement:')
      console.log('   📊 Coût sélectionné:', selectedCoutForPayment.nom, selectedCoutForPayment.prenom)
      console.log('   📊 Matricule coût:', selectedCoutForPayment.matricule)
      console.log('   📊 Cache employés:', employeesCache.length, 'employés')
      
      // Charger les employés si le cache est vide
      const employes = await loadEmployees(true) // Force le rechargement
      console.log('   📊 Employés chargés:', employes.length)
      
      // Trouver l'employé correspondant
      const employe = employes.find(emp => 
        emp.matricule === selectedCoutForPayment.matricule
      )

      console.log('   📊 Employé trouvé:', employe ? `${employe.nom} ${employe.prenom}` : 'AUCUN')

      if (!employe) {
        console.log('   ❌ Aucun employé trouvé avec le matricule:', selectedCoutForPayment.matricule)
        console.log('   📊 Matricules disponibles:', employes.map(emp => emp.matricule))
        alert('Employé non trouvé pour ce coût')
        return
      }

      const response = await fetch('/api/paiements-employes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cout_par_salaire_id: selectedCoutForPayment.id,
          employe_id: employe.id,
          montant_verse: parseFloat(paymentForm.montant_verse),
          date_paiement: paymentForm.date_paiement,
          methode_paiement: paymentForm.methode_paiement,
          reference_paiement: paymentForm.reference_paiement,
          commentaires: paymentForm.commentaires
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Paiement de ${paymentForm.montant_verse}€ enregistré avec succès !`)
        
        // Recharger les données pour mettre à jour le RAP
        await loadData()
        setShowPaymentModal(false)
        setSelectedCoutForPayment(null)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de l\'enregistrement du paiement')
      }
    } catch (error) {
      console.error('Erreur paiement:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du paiement')
    } finally {
      setPaymentLoading(false)
    }
  }

  const deletePayment = async (paymentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return

    try {
      const response = await fetch(`/api/paiements-employes?id=${paymentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Paiement supprimé avec succès !')
        
        // Recharger les données et l'historique
        await loadData()
        if (selectedCoutForPayment) {
          await openPaymentHistory(selectedCoutForPayment)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression paiement:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression du paiement')
    }
  }

  // Fonction pour ouvrir l'historique des paiements d'un employé
  const openPaymentHistoryForEmployee = async (cout: CoutParSalaire) => {
    console.log('🔍 Debug historique employé:')
    console.log('   📊 Coût:', cout.nom, cout.prenom, cout.matricule)
    console.log('   📊 Cache employés:', employeesCache.length)
    
    // Charger les employés si nécessaire
    const employes = await loadEmployees(true)
    console.log('   📊 Employés chargés:', employes.length)
    
    // Trouver l'employé correspondant
    const employe = employes.find(emp => 
      emp.matricule === cout.matricule
    )
    
    console.log('   📊 Employé trouvé:', employe ? `${employe.nom} ${employe.prenom}` : 'AUCUN')
    
    if (employe) {
      setSelectedEmployeForHistory({
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom
      })
      setShowPaymentHistoryModal(true)
    } else {
      console.log('   ❌ Matricules disponibles:', employes.map(emp => emp.matricule))
      alert('Employé non trouvé pour cet historique')
    }
  }

  // Fonction pour gérer l'ajout de prime
  const handleAddPrime = (cout: CoutParSalaire) => {
    console.log('💰 Ajout de prime pour:', cout.nom, cout.prenom)
    setSelectedCoutForPrime(cout)
    setPrimeAmount('')
    setIsEditingPrime(false)
    setShowPrimeModal(true)
  }

  // Fonction pour gérer la modification de prime
  const handleEditPrime = (cout: CoutParSalaire) => {
    console.log('✏️ Modification de prime pour:', cout.nom, cout.prenom)
    setSelectedCoutForPrime(cout)
    setPrimeAmount(cout.prime ? Number(cout.prime).toString() : '0')
    setIsEditingPrime(true)
    setShowPrimeModal(true)
  }

  // Fonction pour soumettre l'ajout/modification de prime
  const handleSubmitPrime = async () => {
    if (!selectedCoutForPrime || !primeAmount) {
      alert('Veuillez saisir un montant de prime')
      return
    }

    const amount = parseFloat(primeAmount)
    if (isNaN(amount) || amount < 0) {
      alert('Veuillez saisir un montant valide (≥ 0)')
      return
    }

    try {
      setPaymentLoading(true)
      
      let newPrime: number
      let actionText: string
      
      if (isEditingPrime) {
        // Modification : remplacer la prime existante
        newPrime = amount
        actionText = `Prime modifiée: ${amount}€`
      } else {
        // Ajout : ajouter au montant existant
        const currentPrime = parseFloat(selectedCoutForPrime.prime || '0')
        newPrime = currentPrime + amount
        actionText = `Prime ajoutée: ${amount}€ (Total: ${newPrime}€)`
      }
      
      // Mettre à jour la prime dans la base de données
      const response = await fetch('/api/cout-par-salaire', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedCoutForPrime.id,
          prime: newPrime
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la prime')
      }

      const result = await response.json()
      
      if (result.success) {
        // Recharger les données
        await loadData()
        setShowPrimeModal(false)
        setSelectedCoutForPrime(null)
        setPrimeAmount('')
        setIsEditingPrime(false)
        
        console.log(`✅ ${actionText}`)
        alert(`${actionText} avec succès!`)
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur lors de la gestion de la prime:', error)
      alert('Erreur lors de la gestion de la prime')
    } finally {
      setPaymentLoading(false)
    }
  }

  // Fonction pour synchroniser les pénalités
  const syncPenalites = async () => {
    setSyncing(true)
    
    try {
      const response = await fetch('/api/sync/penalites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ Synchronisation terminée !
📊 ${result.data.couts_synchronises} coûts synchronisés
🔧 ${result.data.deductions_creees} déductions créées
🆕 ${result.data.couts_crees} coûts créés`)
        
        // Recharger les données
        loadData()
      } else {
        const error = await response.json()
        alert(`❌ Erreur synchronisation: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error)
      alert('❌ Erreur lors de la synchronisation des pénalités')
    } finally {
      setSyncing(false)
    }
  }

  // Fonction pour synchroniser les noms via matricule
  const syncNames = async () => {
    setSyncingNames(true)
    setNameSyncResult(null)
    
    try {
      console.log('🔄 Synchronisation des noms via matricule...')
      
      const response = await fetch('/api/sync/names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        setNameSyncResult(result)
        
        console.log('✅ Synchronisation réussie:', result)
        
        let message = `✅ Synchronisation terminée !\n\n`
        message += `📊 ${result.corrected} entrées corrigées\n`
        
        if (result.sync_status && result.sync_status.length > 0) {
          message += `\n📈 État de synchronisation:\n`
          result.sync_status.forEach((status: any) => {
            if (status.statut === 'OK') {
              message += `✅ ${status.statut}: ${status.nombre}\n`
            } else {
              message += `⚠️ ${status.statut}: ${status.nombre}\n`
            }
          })
        }
        
        if (result.without_matricule > 0) {
          message += `\n⚠️ ${result.without_matricule} entrées sans matricule (correction manuelle requise)`
        }
        
        alert(message)
        
        // Après correction des noms, synchroniser automatiquement les techniciens manquants
        console.log('🔄 Synchronisation automatique des techniciens manquants après correction des noms...')
        try {
          const missingSyncResponse = await fetch(`/api/sync/techniciens-manquants?mois=${selectedMonth}&annee=${selectedYear}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (missingSyncResponse.ok) {
            const missingResult = await missingSyncResponse.json()
            if (missingResult.success && missingResult.total_created > 0) {
              alert(`✅ ${missingResult.total_created} techniciens manquants ont été ajoutés automatiquement.\n\nCes techniciens ont généré des recettes mais n'étaient pas dans l'import.`)
            }
          }
        } catch (missingError) {
          console.warn('⚠️ Erreur synchronisation techniciens manquants:', missingError)
        }
        
        // Recharger les données
        await loadData()
      } else {
        const error = await response.json()
        alert(`❌ Erreur synchronisation: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur synchronisation noms:', error)
      alert('❌ Erreur lors de la synchronisation des noms')
    } finally {
      setSyncingNames(false)
    }
  }

  // Fonction pour synchroniser les techniciens manquants
  const syncMissingTechnicians = async () => {
    setSyncingMissing(true)
    setMissingSyncResult(null)
    
    try {
      console.log('🔄 Synchronisation des techniciens manquants...')
      
      const response = await fetch(`/api/sync/techniciens-manquants?mois=${selectedMonth}&annee=${selectedYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        setMissingSyncResult(result)
        
        console.log('✅ Synchronisation réussie:', result)
        
        let message = `✅ Synchronisation terminée !\n\n`
        message += `📊 ${result.total_found} techniciens manquants trouvés\n`
        message += `✅ ${result.total_created} techniciens ajoutés\n`
        
        if (result.total_errors > 0) {
          message += `❌ ${result.total_errors} erreurs\n`
        }
        
        if (result.created && result.created.length > 0) {
          message += `\n📋 Techniciens ajoutés:\n`
          result.created.forEach((tech: any) => {
            message += `  • ${tech.nom} ${tech.prenom} - ${tech.total_genere}€ générés\n`
          })
        }
        
        alert(message)
        
        // Recharger les données
        await loadData()
      } else {
        const error = await response.json()
        alert(`❌ Erreur synchronisation: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur synchronisation techniciens manquants:', error)
      alert('❌ Erreur lors de la synchronisation des techniciens manquants')
    } finally {
      setSyncingMissing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear])

  // Gestion de l'édition en double-clic
  const handleDoubleClick = (id: number, field: string, currentValue: any) => {
    setEditingField({ id, field })
    setEditValue(currentValue.toString())
  }

  const handleSaveEdit = async () => {
    if (!editingField) return

    try {
      // Déterminer la valeur à envoyer selon le type de champ
      let valueToSend
      if (editingField.field === 'nom' || editingField.field === 'prenom') {
        // Pour les champs texte, envoyer la valeur telle quelle
        valueToSend = editValue.trim()
      } else {
        // Pour les champs numériques, convertir en nombre
        valueToSend = parseFloat(editValue) || 0
      }

      const response = await fetch('/api/cout-par-salaire', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingField.id,
          [editingField.field]: valueToSend
        })
      })

      if (response.ok) {
        await loadData()
        setEditingField(null)
        setEditValue('')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setEditValue('')
  }

  // Gestion de l'import CSV
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }

  // Fonction de normalisation des noms pour la correspondance intelligente
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z]/g, '') // Supprimer tout sauf lettres
  }

  // Fonction de correspondance avancée
  const findNameMatch = (csvNom: string, csvPrenom: string, dbNom: string, dbPrenom: string): boolean => {
    const csvNomNorm = normalizeName(csvNom)
    const csvPrenomNorm = normalizeName(csvPrenom)
    const dbNomNorm = normalizeName(dbNom)
    const dbPrenomNorm = normalizeName(dbPrenom)
    
    // Correspondance directe
    if (csvNomNorm === dbNomNorm && csvPrenomNorm === dbPrenomNorm) return true
    
    // Correspondance inversée (nom/prénom échangés)
    if (csvNomNorm === dbPrenomNorm && csvPrenomNorm === dbNomNorm) return true
    
    // Correspondance partielle - vérifier si les éléments du CSV sont dans la DB
    const csvElements = [csvNomNorm, csvPrenomNorm]
    const dbElements = [dbNomNorm, dbPrenomNorm]
    
    // Vérifier si tous les éléments du CSV sont présents dans la DB
    const allElementsMatch = csvElements.every(csvEl => 
      dbElements.some(dbEl => dbEl.includes(csvEl) || csvEl.includes(dbEl))
    )
    
    if (allElementsMatch) return true
    
    // Correspondance avec tirets (ex: "Mohamed-Bechir" -> "BECHIR" + "MOHAMED")
    const dbNomParts = dbNomNorm.split('-')
    if (dbNomParts.length > 1) {
      const dbAllParts = [...dbNomParts, dbPrenomNorm]
      const csvAllParts = [csvNomNorm, csvPrenomNorm]
      
      const allPartsMatch = csvAllParts.every(csvPart => 
        dbAllParts.some(dbPart => dbPart.includes(csvPart) || csvPart.includes(dbPart))
      )
      
      if (allPartsMatch) return true
    }
    
    return false
  }

  // Cache des employés pour éviter les appels répétés
  const [employeesCache, setEmployeesCache] = useState<any[]>([])

  // Charger les employés une seule fois
  const loadEmployees = async (forceReload = false) => {
    if (!forceReload && employeesCache.length > 0) {
      console.log(`📊 Cache employés déjà chargé: ${employeesCache.length} employés`)
      return employeesCache
    }
    
    try {
      console.log('🔄 Chargement des employés...')
      const response = await fetch('/api/employes')
      const data = await response.json()
      
      if (data.success && data.employes) {
        setEmployeesCache(data.employes)
        console.log(`✅ ${data.employes.length} employés chargés dans le cache`)
        return data.employes
      }
      console.log('❌ Aucun employé chargé')
      return []
    } catch (error) {
      console.error('❌ Erreur chargement employés:', error)
      return []
    }
  }

  // Fonction de correspondance intelligente avec les employés
  const findEmployeeMatch = async (nom: string, prenom: string) => {
    try {
      const normalizedNom = normalizeName(nom)
      const normalizedPrenom = normalizeName(prenom)
      
      console.log(`🔍 Recherche correspondance: "${nom}" "${prenom}" → "${normalizedNom}" "${normalizedPrenom}"`)
      
      const employees = await loadEmployees()
      
      // Recherche intelligente dans le cache avec la nouvelle logique
      const match = employees.find((emp: any) => {
        return findNameMatch(nom, prenom, emp.nom, emp.prenom)
      })
      
      if (match) {
        console.log(`✅ Correspondance trouvée: ${match.nom} ${match.prenom} (${match.matricule})`)
        return {
          matricule: match.matricule,
          nom: match.nom,
          prenom: match.prenom,
          pourcentage_taxe: match.pourcentage_taxe || 0
        }
      } else {
        console.log(`❌ Aucune correspondance trouvée pour: ${nom} ${prenom}`)
        return null
      }
    } catch (error) {
      console.error('Erreur recherche employé:', error)
      return null
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    setImporting(true)
    try {
      const text = await importFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      // Détecter le séparateur (virgule, point-virgule ou tabulation)
      const firstLine = lines[0]
      let separator = '\t' // Par défaut: tabulation
      
      if (firstLine.includes(';')) {
        separator = ';' // Point-virgule (prioritaire)
      } else if (firstLine.includes(',')) {
        separator = ',' // Virgule
      }
      
      const headers = firstLine.split(separator)
      console.log('Séparateur détecté:', separator === ';' ? 'point-virgule' : separator === ',' ? 'virgule' : 'tabulation')
      console.log('Headers détectés:', headers)
      
      const data = await Promise.all(lines.slice(1).map(async (line, index) => {
        // Parser CSV avec gestion des guillemets
        const parseCSVLine = (line: string, separator: string) => {
          const result = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === separator && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        }
        
        const values = parseCSVLine(line, separator)
        const obj: any = {}
        
        headers.forEach((header, headerIndex) => {
          // Mapping des headers vers les clés de base de données
          const headerMapping: { [key: string]: string } = {
            'nom': 'nom',
            'prénom': 'prenom', 
            'pr_nom': 'prenom',
            'salaire_net': 'salaire_net',
            'salaire_brut': 'salaire_brut',
            'coût_total': 'cout_total',
            'co_t_total': 'cout_total',
            'charge': 'charge',
            'mois': 'mois'
          }
          
          // Nettoyer le header pour le mapping
          let cleanHeader = header.toLowerCase().replace(/[^a-z]/g, '_')
          
          // Gérer les cas spéciaux avec plusieurs underscores
          cleanHeader = cleanHeader.replace(/_+/g, '_').replace(/^_|_$/g, '')
          
          // Mapping spécial pour les headers problématiques
          if (cleanHeader.includes('pr_nom') || cleanHeader.includes('prenom')) cleanHeader = 'prenom'
          if (cleanHeader.includes('salaire_net')) cleanHeader = 'salaire_net'
          if (cleanHeader.includes('salaire_brut')) cleanHeader = 'salaire_brut'
          if (cleanHeader.includes('co_t_total') || cleanHeader.includes('cout_total')) cleanHeader = 'cout_total'
          if (cleanHeader.includes('charge')) cleanHeader = 'charge'
          if (cleanHeader.includes('mois')) cleanHeader = 'mois'
          
          const key = headerMapping[cleanHeader] || cleanHeader
          
          console.log(`Header original: "${header}" → Clean: "${cleanHeader}" → Key: "${key}"`)
          let value = values[headerIndex]?.trim() || ''
          
          // Traitement spécial pour les dates (avant nettoyage)
          if (key === 'mois' && value.includes('/')) {
            const dateParts = value.split('/')
            if (dateParts.length === 2) {
              obj.mois = parseInt(dateParts[0])
              obj.annee = parseInt(dateParts[1])
              console.log(`Date: "${values[headerIndex]}" → Mois: ${obj.mois}, Année: ${obj.annee}`)
            }
          } else {
            // Nettoyage avancé : supprimer tous types d'espaces et guillemets
            value = value.replace(/[\s\u00A0\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]/g, '') // Tous types d'espaces
            value = value.replace(/["""]/g, '') // Guillemets simples et doubles
            
            // Traitement spécial pour les valeurs numériques
            if (['salaire_net', 'salaire_brut', 'cout_total', 'charge'].includes(key)) {
              // Remplacer virgule par point pour les décimales
              value = value.replace(',', '.')
              // Convertir en nombre
              const numericValue = parseFloat(value) || 0
              obj[key] = numericValue
              console.log(`Champ ${key}: "${values[headerIndex]}" → ${numericValue}`)
            }
            // Détection automatique des champs numériques par contenu
            else if (value && !isNaN(parseFloat(value.replace(',', '.')))) {
              const numericValue = parseFloat(value.replace(',', '.')) || 0
              obj[key] = numericValue
              console.log(`Champ numérique détecté ${key}: "${values[headerIndex]}" → ${numericValue}`)
            } else {
              obj[key] = value
            }
          }
        })
        
        console.log(`Ligne ${index + 1} parsée:`, obj)
        
        // Rechercher la correspondance avec un employé
        if (obj.nom && obj.prenom) {
          const employeeMatch = await findEmployeeMatch(obj.nom, obj.prenom)
          if (employeeMatch) {
            obj.matricule = employeeMatch.matricule
            obj.taxe = employeeMatch.pourcentage_taxe
            console.log(`✅ Employé trouvé: ${employeeMatch.matricule} (taxe: ${employeeMatch.pourcentage_taxe}%)`)
          } else {
            console.log(`⚠️ Aucun employé trouvé pour: ${obj.nom} ${obj.prenom}`)
            obj.matricule = null
            obj.taxe = 0
          }
        }
        
        return obj
      }))
      
      // Filtrer les éléments valides
      const validData = data.filter(item => item.nom && item.prenom)
      
      // Calculer les statistiques de correspondance
      const matched = validData.filter(item => item.matricule).length
      const unmatched = validData.filter(item => !item.matricule).length
      const total = validData.length
      
      setImportResults({ matched, unmatched, total })
      
      console.log('Données finales à importer:', validData)
      console.log(`📊 Correspondances: ${matched}/${total} trouvées`)

      const response = await fetch('/api/cout-par-salaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importData: validData })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Import réussi: ${result.inserted} nouveaux, ${result.updated} mis à jour\nCorrespondances: ${matched}/${total} employés trouvés`)
        await loadData()
        setImportFile(null)
      }
    } catch (error) {
      console.error('Erreur import:', error)
      alert('Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  // Export CSV
  const handleExport = () => {
    const csvContent = [
      'Nom\tPrénom\tSalaire net (€)\tSalaire brut (€)\tCoût total (€)\tCharge\tMOIS',
      ...couts.map(cout => 
        `${cout.nom}\t${cout.prenom}\t${cout.salaire_net}\t${cout.salaire_brut}\t${cout.cout_total}\t${cout.charge}\t${cout.mois}/${cout.annee}`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `couts_salaires_${selectedMonth}_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalCout = couts.reduce((sum, cout) => {
    const value = parseFloat(cout.cout_total || 0)
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const totalGenere = couts.reduce((sum, cout) => {
    const value = parseFloat(cout.total_genere || 0)
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const totalSalaireNet = couts.reduce((sum, cout) => {
    const value = parseFloat(cout.salaire_net || 0)
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const totalVerse = couts.reduce((sum, cout) => {
    const value = parseFloat(cout.total_paiements || 0)
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  const totalResteAPayer = couts.reduce((sum, cout) => {
    const rap = parseFloat(cout.rap || 0)
    // Seulement les RAP positifs (reste à payer)
    return sum + (rap > 0 ? rap : 0)
  }, 0)

  const totalImpot = couts.reduce((sum, cout) => {
    const value = parseFloat(cout.impot || 0)
    return sum + (isNaN(value) ? 0 : value)
  }, 0)

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres et actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <h3 className="text-2xl font-bold">Coûts par Salarié</h3>
          
          {/* Filtres mois/année */}
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              {Array.from({length: 5}, (_, i) => {
                const year = new Date().getFullYear() - 2 + i
                return <option key={year} value={year}>{year}</option>
              })}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
          
          {importFile && (
            <Button 
              onClick={handleImport} 
              disabled={importing}
              className="bg-green-600 hover:bg-green-700"
            >
              {importing ? 'Import...' : 'Importer'}
            </Button>
          )}
          
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Button 
            onClick={syncPenalites} 
            variant="outline" 
            disabled={syncing}
            className="bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                Synchronisation...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Pénalités
              </>
            )}
          </Button>

          <Button 
            onClick={syncNames} 
            variant="outline" 
            disabled={syncingNames}
            className="bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800"
            title="Synchroniser les noms et prénoms depuis la table employés via matricule"
          >
            {syncingNames ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Correction...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Corriger Noms
              </>
            )}
          </Button>

          {/* Le bouton Tech. Manquants est désactivé si pas de données d'import
              La synchro se fait automatiquement après "Corriger Noms" */}
          <Button 
            onClick={syncMissingTechnicians} 
            variant="outline" 
            disabled={syncingMissing || couts.length === 0}
            className="bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800 disabled:opacity-50"
            title={couts.length === 0 
              ? "Importez d'abord les données du mois, puis cliquez sur 'Corriger Noms'" 
              : "Ajouter les techniciens qui ont généré de l'argent mais ne sont pas dans l'import (fait automatiquement après 'Corriger Noms')"}
          >
            {syncingMissing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                Recherche...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tech. Manquants
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Résultats de correspondance */}
      {importResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Résultats de correspondance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResults.matched}</div>
                <div className="text-sm text-gray-600">Employés trouvés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResults.unmatched}</div>
                <div className="text-sm text-gray-600">Non trouvés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importResults.matched / importResults.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-2 text-center">
                Taux de correspondance: {Math.round((importResults.matched / importResults.total) * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Salariés</p>
                <p className="text-2xl font-bold">{couts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Coût Total</p>
                <p className="text-2xl font-bold">{totalCout.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Généré</p>
                <p className="text-2xl font-bold">{totalGenere.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Total Salaire Net</p>
                <p className="text-2xl font-bold">{totalSalaireNet.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Impôt</p>
                <p className="text-2xl font-bold text-purple-600">{totalImpot.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Reste à Payer</p>
                <p className="text-2xl font-bold text-red-600">{totalResteAPayer.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des coûts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Coûts pour {new Date(0, selectedMonth - 1).toLocaleString('fr-FR', { month: 'long' })} {selectedYear}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={loadData}
                disabled={loading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Synchroniser Total Généré
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Nom</th>
                    <th className="text-left p-3">Prénom</th>
                    <th className="text-center p-3">Matricule</th>
                <th className="text-right p-3">Taxe (%)</th>
                <th className="text-right p-3">Impôt (€)</th>
                <th className="text-right p-3">Pénalité (€)</th>
                <th className="text-right p-3">Prime (€)</th>
                <th className="text-right p-3">Total Généré (€)</th>
                <th className="text-right p-3">RAP (€)</th>
                <th className="text-right p-3">Paiements (€)</th>
                <th className="text-right p-3">Salaire Net</th>
                <th className="text-right p-3">Salaire Brut</th>
                <th className="text-right p-3">Coût Total</th>
                <th className="text-right p-3">Charge</th>
                <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {couts.map((cout) => (
                    <tr key={cout.id} className={`border-b hover:bg-gray-50 ${
                      cout.rap && Math.abs(Number(cout.rap)) < 0.01 
                        ? 'bg-green-50 border-green-200' 
                        : ''
                    }`}>
                      <td className="p-3 font-medium">
                        {editingField?.id === cout.id && editingField?.field === 'nom' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-32"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onDoubleClick={() => handleDoubleClick(cout.id, 'nom', cout.nom)}
                            title="Double-clic pour modifier"
                          >
                            {cout.nom}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingField?.id === cout.id && editingField?.field === 'prenom' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-32"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onDoubleClick={() => handleDoubleClick(cout.id, 'prenom', cout.prenom)}
                            title="Double-clic pour modifier"
                          >
                            {cout.prenom}
                          </span>
                        )}
                      </td>
                      
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cout.matricule 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cout.matricule || 'Non trouvé'}
                        </span>
                        {cout.matricule && (
                          <div className="text-xs text-green-600 mt-1">✓ Correspondance</div>
                        )}
                        {!cout.matricule && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openManualAssignment(cout)}
                              className="h-6 px-2 text-xs bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800"
                            >
                              Attribuer manuellement
                            </Button>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        <span className={`font-medium ${cout.taxe && cout.taxe > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                          {cout.taxe ? `${cout.taxe}%` : '0%'}
                        </span>
                        {cout.taxe && cout.taxe > 0 && (
                          <div className="text-xs text-blue-600 mt-1">✓ Taxe assignée</div>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        <span className={`font-medium ${hasImpot(cout.impot) && !isMissingTechnician(cout) ? 'text-red-600' : 'text-gray-400 italic'}`}>
                          {isMissingTechnician(cout) ? '-' : formatImpot(cout.impot)}
                        </span>
                        {hasImpot(cout.impot) && !isMissingTechnician(cout) && (
                          <div className="text-xs text-red-600 mt-1">✓ Impôt calculé</div>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        <span className={`font-medium ${cout.penalite && Number(cout.penalite) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {cout.penalite ? `${Number(cout.penalite).toFixed(2)}€` : '0.00€'}
                        </span>
                        {cout.penalite && Number(cout.penalite) > 0 && (
                          <div className="text-xs text-orange-600 mt-1">✓ Pénalités</div>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        <div 
                          className="cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                          onDoubleClick={() => handleAddPrime(cout)}
                          title="Double-clic pour ajouter une prime"
                        >
                          <span className={`font-medium ${cout.prime && Number(cout.prime) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {cout.prime ? `${Number(cout.prime).toFixed(2)}€` : '0.00€'}
                          </span>
                          {cout.prime && Number(cout.prime) > 0 && (
                            <div className="text-xs text-green-600 mt-1">✓ Prime</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">Double-clic pour ajouter</div>
                        </div>
                        {cout.prime && Number(cout.prime) > 0 && (
                          <button
                            onClick={() => handleEditPrime(cout)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                            title="Modifier la prime"
                          >
                            Modifier
                          </button>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        <span className={`font-medium ${cout.total_genere && Number(cout.total_genere) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {cout.total_genere ? `${Number(cout.total_genere).toFixed(2)}€` : '0.00€'}
                        </span>
                        {cout.total_genere && Number(cout.total_genere) > 0 && (
                          <div className="text-xs text-green-600 mt-1">✓ Recettes générées</div>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        <span className={`font-medium ${
                          cout.rap && Number(cout.rap) > 0.01 
                            ? 'text-blue-600' 
                            : cout.rap && Number(cout.rap) < -0.01 
                            ? 'text-red-600' 
                            : cout.rap && Math.abs(Number(cout.rap)) <= 0.01
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`}>
                          {cout.rap ? `${Number(cout.rap).toFixed(2)}€` : '0.00€'}
                        </span>
                        {cout.rap && Number(cout.rap) > 0.01 && (
                          <div className="text-xs text-blue-600 mt-1">✓ Reste à payer</div>
                        )}
                        {cout.rap && Math.abs(Number(cout.rap)) <= 0.01 && (
                          <div className="text-xs text-green-600 mt-1">✓ 100% payé</div>
                        )}
                        {cout.rap && Number(cout.rap) < 0 && (
                          <div className="text-xs text-red-600 mt-1">⚠️ Déficit</div>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        <span className={`font-medium ${cout.total_paiements && Number(cout.total_paiements) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {cout.total_paiements ? `${Number(cout.total_paiements).toFixed(2)}€` : '0.00€'}
                        </span>
                        {cout.total_paiements && Number(cout.total_paiements) > 0 && (
                          <div className="text-xs text-green-600 mt-1">✓ Paiements reçus</div>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        {editingField?.id === cout.id && editingField?.field === 'salaire_net' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded ${isMissingTechnician(cout) ? 'text-gray-400 italic' : ''}`}
                            onDoubleClick={() => handleDoubleClick(cout.id, 'salaire_net', cout.salaire_net)}
                            title="Double-clic pour modifier"
                          >
                            {formatValueOrDash(cout.salaire_net)}
                          </span>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        {editingField?.id === cout.id && editingField?.field === 'salaire_brut' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded ${isMissingTechnician(cout) ? 'text-gray-400 italic' : ''}`}
                            onDoubleClick={() => handleDoubleClick(cout.id, 'salaire_brut', cout.salaire_brut)}
                            title="Double-clic pour modifier"
                          >
                            {formatValueOrDash(cout.salaire_brut)}
                          </span>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        {editingField?.id === cout.id && editingField?.field === 'cout_total' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded ${isMissingTechnician(cout) ? 'text-gray-400 italic' : ''}`}
                            onDoubleClick={() => handleDoubleClick(cout.id, 'cout_total', cout.cout_total)}
                            title="Double-clic pour modifier"
                          >
                            {formatValueOrDash(cout.cout_total)}
                          </span>
                        )}
                      </td>
                      
                      <td className="p-3 text-right">
                        {editingField?.id === cout.id && editingField?.field === 'charge' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded ${isMissingTechnician(cout) ? 'text-gray-400 italic' : ''}`}
                            onDoubleClick={() => handleDoubleClick(cout.id, 'charge', cout.charge)}
                            title="Double-clic pour modifier"
                          >
                            {formatValueOrDash(cout.charge)}
                          </span>
                        )}
                      </td>
                      
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentModal(cout)}
                            className="h-7 px-2 text-xs bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
                            title="Ajouter un paiement"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentHistory(cout)}
                            className="h-7 px-2 text-xs bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-800"
                            title="Voir l'historique des paiements"
                          >
                            <History className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentHistoryForEmployee(cout)}
                            className="h-7 px-2 text-xs bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-800"
                            title="Voir l'historique complet de l'employé"
                          >
                            <Users className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {couts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun coût trouvé pour cette période
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'attribution manuelle */}
      {showManualAssignment && selectedCout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Attribution manuelle d'employé</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowManualAssignment(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Salaire à attribuer :</h4>
              <p className="text-sm text-gray-600">
                <strong>{selectedCout.nom} {selectedCout.prenom}</strong> - 
                Salaire Net: {selectedCout.salaire_net}€ - 
                Mois: {selectedCout.mois}/{selectedCout.annee}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélectionner un employé :
              </label>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {availableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedEmployee?.id === employee.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{employee.nom} {employee.prenom}</p>
                        <p className="text-sm text-gray-600">Matricule: {employee.matricule}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Taxe: {employee.pourcentage_taxe || 0}%</p>
                        <p className="text-sm text-gray-600">Email: {employee.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedEmployee && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Employé sélectionné :</h4>
                <p className="text-sm text-blue-700">
                  <strong>{selectedEmployee.nom} {selectedEmployee.prenom}</strong> 
                  (Matricule: {selectedEmployee.matricule}, Taxe: {selectedEmployee.pourcentage_taxe || 0}%)
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowManualAssignment(false)}
                disabled={assigning}
              >
                Annuler
              </Button>
              <Button
                onClick={assignEmployeeManually}
                disabled={!selectedEmployee || assigning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {assigning ? 'Attribution...' : 'Attribuer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout de paiement */}
      {showPaymentModal && selectedCoutForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter un Paiement</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employé</label>
                <p className="text-sm text-gray-600">
                  {selectedCoutForPayment.nom} {selectedCoutForPayment.prenom}
                  {selectedCoutForPayment.matricule && ` (${selectedCoutForPayment.matricule})`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">RAP Actuel</label>
                <p className="text-sm text-gray-600">
                  {selectedCoutForPayment.rap ? `${Number(selectedCoutForPayment.rap).toFixed(2)}€` : '0.00€'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Montant versé *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentForm.montant_verse}
                  onChange={(e) => setPaymentForm({...paymentForm, montant_verse: e.target.value})}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date de paiement *</label>
                <Input
                  type="date"
                  value={paymentForm.date_paiement}
                  onChange={(e) => setPaymentForm({...paymentForm, date_paiement: e.target.value})}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Méthode de paiement</label>
                <select
                  value={paymentForm.methode_paiement}
                  onChange={(e) => setPaymentForm({...paymentForm, methode_paiement: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="virement">Virement</option>
                  <option value="cheque">Chèque</option>
                  <option value="especes">Espèces</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Référence</label>
                <Input
                  value={paymentForm.reference_paiement}
                  onChange={(e) => setPaymentForm({...paymentForm, reference_paiement: e.target.value})}
                  placeholder="Référence du paiement"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Commentaires</label>
                <textarea
                  value={paymentForm.commentaires}
                  onChange={(e) => setPaymentForm({...paymentForm, commentaires: e.target.value})}
                  placeholder="Commentaires sur le paiement"
                  className="w-full p-2 border border-gray-300 rounded-md h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handlePaymentSubmit}
                disabled={!paymentForm.montant_verse || paymentLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {paymentLoading ? 'Enregistrement...' : 'Enregistrer le paiement'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'historique des paiements */}
      {showPaymentHistory && selectedCoutForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Historique des Paiements</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentHistory(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                {selectedCoutForPayment.nom} {selectedCoutForPayment.prenom}
                {selectedCoutForPayment.matricule && ` (${selectedCoutForPayment.matricule})`}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">RAP Actuel:</span>
                  <p className="font-medium">{selectedCoutForPayment.rap ? `${Number(selectedCoutForPayment.rap).toFixed(2)}€` : '0.00€'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Paiements:</span>
                  <p className="font-medium">{selectedCoutForPayment.total_paiements ? `${Number(selectedCoutForPayment.total_paiements).toFixed(2)}€` : '0.00€'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Total Généré:</span>
                  <p className="font-medium">{selectedCoutForPayment.total_genere ? `${Number(selectedCoutForPayment.total_genere).toFixed(2)}€` : '0.00€'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Période:</span>
                  <p className="font-medium">{selectedCoutForPayment.mois}/{selectedCoutForPayment.annee}</p>
                </div>
              </div>
            </div>

            {paymentLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement de l'historique...</p>
              </div>
            ) : paiements.length > 0 ? (
              <div className="space-y-3">
                {paiements.map((paiement) => (
                  <div key={paiement.id} className={`border rounded-lg p-4 ${paiement.montant_verse < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-medium text-lg ${paiement.montant_verse < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {paiement.montant_verse < 0 ? '-' : '+'}{Math.abs(paiement.montant_verse).toFixed(2)}€
                          </span>
                          {paiement.montant_verse < 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              DÉDUCTION
                            </span>
                          )}
                          {paiement.methode_paiement === 'deduction_penalite' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              PÉNALITÉ
                            </span>
                          )}
                          <Badge variant={paiement.statut === 'confirme' ? 'default' : 'secondary'}>
                            {paiement.statut}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Date:</span> {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Méthode:</span> {paiement.methode_paiement}
                          </div>
                          <div>
                            <span className="font-medium">Référence:</span> {paiement.reference_paiement || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Créé:</span> {new Date(paiement.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {paiement.commentaires && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Commentaires:</span> {paiement.commentaires}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePayment(paiement.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun paiement enregistré pour cet employé
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPaymentHistory(false)}
              >
                Fermer
              </Button>
              <Button
                onClick={() => {
                  setShowPaymentHistory(false)
                  openPaymentModal(selectedCoutForPayment)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un paiement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'historique des paiements pour l'employé */}
      <PaymentHistoryModal
        isOpen={showPaymentHistoryModal}
        onClose={() => {
          setShowPaymentHistoryModal(false)
          setSelectedEmployeForHistory(null)
        }}
        employeId={selectedEmployeForHistory?.id}
        employeNom={selectedEmployeForHistory?.nom}
        employePrenom={selectedEmployeForHistory?.prenom}
      />

      {/* Modal d'ajout/modification de prime */}
      {showPrimeModal && selectedCoutForPrime && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditingPrime ? 'Modifier la Prime' : 'Ajouter une Prime'}
              </h3>
              <button
                onClick={() => {
                  setShowPrimeModal(false)
                  setIsEditingPrime(false)
                  setPrimeAmount('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Employé: {selectedCoutForPrime.nom} {selectedCoutForPrime.prenom}
              </label>
              <label className="block text-sm font-medium mb-2">
                Prime actuelle: {selectedCoutForPrime.prime ? `${Number(selectedCoutForPrime.prime).toFixed(2)}€` : '0.00€'}
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isEditingPrime ? 'Nouveau montant de la prime (€)' : 'Montant de la prime à ajouter (€)'}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={primeAmount}
                onChange={(e) => setPrimeAmount(e.target.value)}
                placeholder={isEditingPrime ? "Nouveau montant" : "0.00"}
                className="w-full"
              />
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> {isEditingPrime 
                  ? 'La prime sera remplacée par le nouveau montant et le RAP sera recalculé.'
                  : 'La prime sera ajoutée au montant existant et augmentera le RAP (Reste à Payer).'
                }
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPrimeModal(false)
                  setIsEditingPrime(false)
                  setPrimeAmount('')
                }}
                disabled={paymentLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitPrime}
                disabled={paymentLoading || !primeAmount}
                className={isEditingPrime ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}
              >
                {paymentLoading 
                  ? (isEditingPrime ? 'Modification...' : 'Ajout...') 
                  : (isEditingPrime ? 'Modifier la Prime' : 'Ajouter la Prime')
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
