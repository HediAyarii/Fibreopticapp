'use client'

import { useState, useEffect } from 'react'
import { X, Edit, Trash2, Plus, Download, Filter } from 'lucide-react'

interface Paiement {
  id: number
  montant_verse: number
  date_paiement: string
  methode_paiement: string
  reference_paiement: string
  commentaires: string
  statut: string
  created_at: string
  updated_at: string
  employe_nom: string
  employe_prenom: string
  employe_matricule: string
  cout_nom: string
  cout_prenom: string
  mois: number
  annee: number
}

interface PaymentHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  employeId?: number
  coutId?: number
  employeNom?: string
  employePrenom?: string
}

export default function PaymentHistoryModal({
  isOpen,
  onClose,
  employeId,
  coutId,
  employeNom,
  employePrenom
}: PaymentHistoryModalProps) {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [loading, setLoading] = useState(false)
  const [statistiques, setStatistiques] = useState<any>(null)
  const [filteredPaiements, setFilteredPaiements] = useState<Paiement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMethode, setFilterMethode] = useState('')
  const [editingPaiement, setEditingPaiement] = useState<Paiement | null>(null)
  const [editForm, setEditForm] = useState({
    montant_verse: '',
    date_paiement: '',
    methode_paiement: 'virement',
    reference_paiement: '',
    commentaires: ''
  })

  // Charger l'historique des paiements
  const loadPaymentHistory = async () => {
    setLoading(true)
    try {
      let url = '/api/paiements-employes?'
      if (employeId) url += `employe_id=${employeId}`
      if (coutId) url += `cout_id=${coutId}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setPaiements(data.paiements)
        setFilteredPaiements(data.paiements)
        setStatistiques(data.statistiques)
        console.log(`✅ ${data.paiements.length} paiements chargés`)
      } else {
        console.error('❌ Erreur chargement historique:', data.error)
        alert('Erreur lors du chargement de l\'historique')
      }
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error)
      alert('Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les paiements
  const filterPaiements = () => {
    let filtered = paiements

    if (searchTerm) {
      filtered = filtered.filter(paiement =>
        paiement.reference_paiement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paiement.commentaires.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paiement.methode_paiement.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterMethode) {
      filtered = filtered.filter(paiement =>
        paiement.methode_paiement === filterMethode
      )
    }

    setFilteredPaiements(filtered)
  }

  // Modifier un paiement
  const handleEditPaiement = (paiement: Paiement) => {
    setEditingPaiement(paiement)
    setEditForm({
      montant_verse: paiement.montant_verse.toString(),
      date_paiement: paiement.date_paiement,
      methode_paiement: paiement.methode_paiement,
      reference_paiement: paiement.reference_paiement,
      commentaires: paiement.commentaires
    })
  }

  // Sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editingPaiement) return

    try {
      const response = await fetch('/api/paiements-employes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paiement_id: editingPaiement.id,
          ...editForm
        })
      })

      if (response.ok) {
        alert('Paiement modifié avec succès !')
        setEditingPaiement(null)
        await loadPaymentHistory()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('❌ Erreur modification paiement:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la modification')
    }
  }

  // Supprimer un paiement
  const handleDeletePaiement = async (paiementId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return

    try {
      const response = await fetch(`/api/paiements-employes?paiement_id=${paiementId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Paiement supprimé avec succès !')
        await loadPaymentHistory()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('❌ Erreur suppression paiement:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  // Exporter l'historique
  const handleExport = () => {
    const csvContent = [
      ['Date', 'Montant', 'Méthode', 'Référence', 'Commentaires', 'Statut'],
      ...filteredPaiements.map(p => [
        p.date_paiement,
        p.montant_verse.toString(),
        p.methode_paiement,
        p.reference_paiement,
        p.commentaires,
        p.statut
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historique_paiements_${employeNom}_${employePrenom}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (isOpen) {
      loadPaymentHistory()
    }
  }, [isOpen, employeId, coutId])

  useEffect(() => {
    filterPaiements()
  }, [searchTerm, filterMethode, paiements])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">
              Historique des Paiements
            </h2>
            {(employeNom || employePrenom) && (
              <p className="text-sm text-gray-600 mt-1">
                {employeNom} {employePrenom}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Statistiques */}
        {statistiques && (
          <div className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">Total Paiements</h3>
                <p className="text-2xl font-bold text-blue-600">{statistiques.totalPaiements}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">Montant Total</h3>
                <p className="text-2xl font-bold text-green-600">{statistiques.totalMontant.toFixed(2)}€</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">Montant Moyen</h3>
                <p className="text-2xl font-bold text-purple-600">{statistiques.montantMoyen.toFixed(2)}€</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-sm font-medium text-gray-500">Dernier Paiement</h3>
                <p className="text-sm font-bold text-gray-600">
                  {statistiques.dernierPaiement ? new Date(statistiques.dernierPaiement).toLocaleDateString() : 'Aucun'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtres et Actions */}
        <div className="p-6 border-b">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Rechercher par référence ou commentaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterMethode}
                onChange={(e) => setFilterMethode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les méthodes</option>
                <option value="virement">Virement</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>
        </div>

        {/* Liste des Paiements */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPaiements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun paiement trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPaiements.map((paiement) => (
                <div key={paiement.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-semibold text-green-600">
                          {paiement.montant_verse.toFixed(2)}€
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(paiement.date_paiement).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {paiement.methode_paiement}
                        </div>
                        {paiement.reference_paiement && (
                          <div className="text-sm text-gray-600">
                            Ref: {paiement.reference_paiement}
                          </div>
                        )}
                      </div>
                      {paiement.commentaires && (
                        <div className="text-sm text-gray-500 mt-1">
                          {paiement.commentaires}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPaiement(paiement)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePaiement(paiement.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal d'édition */}
        {editingPaiement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Modifier le Paiement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Montant</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.montant_verse}
                      onChange={(e) => setEditForm({...editForm, montant_verse: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={editForm.date_paiement}
                      onChange={(e) => setEditForm({...editForm, date_paiement: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Méthode</label>
                    <select
                      value={editForm.methode_paiement}
                      onChange={(e) => setEditForm({...editForm, methode_paiement: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="virement">Virement</option>
                      <option value="especes">Espèces</option>
                      <option value="cheque">Chèque</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Référence</label>
                    <input
                      type="text"
                      value={editForm.reference_paiement}
                      onChange={(e) => setEditForm({...editForm, reference_paiement: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Commentaires</label>
                    <textarea
                      value={editForm.commentaires}
                      onChange={(e) => setEditForm({...editForm, commentaires: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setEditingPaiement(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
