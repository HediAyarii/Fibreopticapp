"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
} from "lucide-react"
import { useUserPermissions } from "@/hooks/useUserPermissions"

interface Absence {
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
  approuve_par: string | null
  date_decision: string | null
  couleur: string
  created_at: string
  matricule?: string
  poste?: string
  departement?: string
}

interface Employee {
  id: number
  nom: string
  prenom: string
  matricule: string
  poste: string
}

const TYPE_ABSENCE_LABELS: Record<string, string> = {
  'conge': 'Congé',
  'maladie': 'Maladie',
  'sans_solde': 'Sans solde',
  'formation': 'Formation',
  'autre': 'Autre'
}

const TYPE_ABSENCE_COLORS: Record<string, string> = {
  'conge': '#3B82F6',
  'maladie': '#EF4444',
  'sans_solde': '#F59E0B',
  'formation': '#8B5CF6',
  'autre': '#6B7280'
}

const STATUT_CONFIG: Record<string, { label: string; bg: string }> = {
  'en_attente': { label: 'En attente', bg: 'bg-yellow-100 border-yellow-300' },
  'approuvee': { label: 'Approuvée', bg: 'bg-green-100 border-green-300' },
  'refusee': { label: 'Refusée', bg: 'bg-red-100 border-red-300' },
  'directe': { label: 'Directe', bg: 'bg-blue-100 border-blue-300' }
}

const MOIS_NOMS = [
  'Septembre', 'Octobre', 'Novembre', 'Décembre',
  'Janvier', 'Février', 'Mars', 'Avril',
  'Mai', 'Juin', 'Juillet', 'Août'
]

const JOURS_SEMAINE_LETTRES = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export function AbsencesManager() {
  const { isAdmin } = useUserPermissions()
  const [absences, setAbsences] = useState<Absence[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState<'calendrier' | 'demandes' | 'liste'>('calendrier')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editAbsence, setEditAbsence] = useState<Absence | null>(null)
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)
  const [decisionComment, setDecisionComment] = useState('')

  // Filtres pour la liste "Toutes les absences"
  const [filterDateDebut, setFilterDateDebut] = useState('')
  const [filterDateFin, setFilterDateFin] = useState('')
  const [filterStatut, setFilterStatut] = useState('tous')
  const [filterType, setFilterType] = useState('tous')
  const [filterSearch, setFilterSearch] = useState('')

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const [startYear, setStartYear] = useState(currentMonth >= 8 ? currentYear : currentYear - 1)

  const [newAbsence, setNewAbsence] = useState({
    employe_id: '',
    nom: '',
    prenom: '',
    date_debut: '',
    date_fin: '',
    type_absence: 'conge',
    motif: '',
    commentaire_admin: ''
  })

  // Charger les données - fetch BOTH years for Sept-Aug range
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [absRes1, absRes2, employeesRes] = await Promise.all([
        fetch(`/api/absences?annee=${startYear}`),
        fetch(`/api/absences?annee=${startYear + 1}`),
        fetch('/api/employes')
      ])

      let allAbsences: Absence[] = []
      if (absRes1.ok) {
        const data = await absRes1.json()
        allAbsences = [...(data.absences || [])]
      }
      if (absRes2.ok) {
        const data = await absRes2.json()
        const existing = new Set(allAbsences.map(a => a.id))
        const newOnes = (data.absences || []).filter((a: Absence) => !existing.has(a.id))
        allAbsences = [...allAbsences, ...newOnes]
      }
      setAbsences(allAbsences)

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data.employes || data.employees || data.data || [])
      }
    } catch (error) {
      console.error('Erreur chargement absences:', error)
    } finally {
      setLoading(false)
    }
  }, [startYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateAbsence = async () => {
    if (!newAbsence.date_debut || !newAbsence.date_fin) {
      alert('Les dates sont obligatoires')
      return
    }

    let nom = newAbsence.nom
    let prenom = newAbsence.prenom
    let employe_id = newAbsence.employe_id ? parseInt(newAbsence.employe_id) : null

    if (employe_id) {
      const emp = employees.find(e => e.id === employe_id)
      if (emp) { nom = emp.nom; prenom = emp.prenom }
    }

    if (!nom || !prenom) {
      alert('Veuillez sélectionner un employé')
      return
    }

    try {
      const response = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employe_id, nom, prenom,
          date_debut: newAbsence.date_debut, date_fin: newAbsence.date_fin,
          type_absence: newAbsence.type_absence,
          motif: newAbsence.motif || null,
          demande_par: 'admin',
          commentaire_admin: newAbsence.commentaire_admin || null
        })
      })

      if (response.ok) {
        alert('Absence créée avec succès !')
        setShowCreateModal(false)
        setNewAbsence({ employe_id: '', nom: '', prenom: '', date_debut: '', date_fin: '', type_absence: 'conge', motif: '', commentaire_admin: '' })
        loadData()
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur création absence:', error)
      alert('Erreur lors de la création')
    }
  }

  const handleDecision = async (action: 'approuver' | 'refuser') => {
    if (!selectedAbsence) return
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const response = await fetch('/api/absences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAbsence.id,
          action,
          commentaire_admin: decisionComment || null,
          approuve_par: currentUser.email || currentUser.name || 'Admin'
        })
      })
      if (response.ok) {
        alert(action === 'approuver' ? 'Demande approuvée !' : 'Demande refusée.')
        setShowDecisionModal(false)
        setSelectedAbsence(null)
        setDecisionComment('')
        loadData()
      } else {
        const err = await response.json()
        alert(err.error || 'Erreur')
      }
    } catch (error) {
      console.error('Erreur décision:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) return
    try {
      const response = await fetch(`/api/absences?id=${id}`, { method: 'DELETE' })
      if (response.ok) loadData()
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  const demandesEnAttente = absences.filter(a => a.statut === 'en_attente').length
  const absencesCalendrier = absences.filter(a => a.statut === 'approuvee' || a.statut === 'directe')

  // Vérifier les absences pour un employé à une date donnée (SANS muter la date)
  const getAbsencesForDay = (nom: string, prenom: string, year: number, month: number, day: number): Absence[] => {
    const dateTs = new Date(year, month, day, 12, 0, 0).getTime()
    return absencesCalendrier.filter(a => {
      if (a.nom !== nom || a.prenom !== prenom) return false
      const debut = new Date(a.date_debut)
      debut.setHours(0, 0, 0, 0)
      const fin = new Date(a.date_fin)
      fin.setHours(23, 59, 59, 999)
      return dateTs >= debut.getTime() && dateTs <= fin.getTime()
    })
  }

  // Tous les employés pour le calendrier
  const allEmployeesForCalendar = employees
    .map(e => ({ nom: e.nom, prenom: e.prenom, employe_id: e.id }))
    .sort((a, b) => a.nom.localeCompare(b.nom))

  // Générer les données des 12 mois (Sept -> Août)
  const getMoisData = () => {
    const result = []
    for (let i = 0; i < 12; i++) {
      const moisIndex = (8 + i) % 12
      const annee = moisIndex >= 8 ? startYear : startYear + 1
      const nbJours = new Date(annee, moisIndex + 1, 0).getDate()
      result.push({ nom: MOIS_NOMS[i], moisIndex, annee, nbJours })
    }
    return result
  }

  const moisData = getMoisData()

  // Filtrer les absences pour l'onglet "Toutes les absences"
  const filteredAbsences = absences.filter(a => {
    // Filtre par intervalle de dates (chevauchement)
    if (filterDateDebut) {
      const fd = new Date(filterDateDebut)
      fd.setHours(0, 0, 0, 0)
      const absEnd = new Date(a.date_fin)
      absEnd.setHours(23, 59, 59, 999)
      if (absEnd < fd) return false
    }
    if (filterDateFin) {
      const ff = new Date(filterDateFin)
      ff.setHours(23, 59, 59, 999)
      const absStart = new Date(a.date_debut)
      absStart.setHours(0, 0, 0, 0)
      if (absStart > ff) return false
    }
    // Filtre par statut
    if (filterStatut !== 'tous' && a.statut !== filterStatut) return false
    // Filtre par type
    if (filterType !== 'tous' && a.type_absence !== filterType) return false
    // Filtre par recherche (nom/prenom)
    if (filterSearch) {
      const s = filterSearch.toLowerCase()
      if (!(`${a.nom} ${a.prenom}`.toLowerCase().includes(s) || `${a.prenom} ${a.nom}`.toLowerCase().includes(s))) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Absences</h2>
          <p className="text-gray-500">Gestion des absences et demandes des techniciens</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Absence
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div><p className="text-sm text-gray-500">Demandes en attente</p><p className="text-2xl font-bold text-yellow-600">{demandesEnAttente}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Check className="w-8 h-8 text-green-500" />
          <div><p className="text-sm text-gray-500">Approuvées</p><p className="text-2xl font-bold text-green-600">{absences.filter(a => a.statut === 'approuvee').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <X className="w-8 h-8 text-red-500" />
          <div><p className="text-sm text-gray-500">Refusées</p><p className="text-2xl font-bold text-red-600">{absences.filter(a => a.statut === 'refusee').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-500" />
          <div><p className="text-sm text-gray-500">Directes</p><p className="text-2xl font-bold text-blue-600">{absences.filter(a => a.statut === 'directe').length}</p></div>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant={activeView === 'calendrier' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('calendrier')}>
          <Calendar className="w-4 h-4 mr-2" />Calendrier
        </Button>
        <Button variant={activeView === 'demandes' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('demandes')} className="relative">
          <Clock className="w-4 h-4 mr-2" />Demandes
          {demandesEnAttente > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{demandesEnAttente}</span>
          )}
        </Button>
        <Button variant={activeView === 'liste' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('liste')}>
          <Users className="w-4 h-4 mr-2" />Toutes les absences
        </Button>
      </div>

      {/* ===== CALENDRIER COMPACT - Mois en colonnes, Jours 1-31 en lignes ===== */}
      {activeView === 'calendrier' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendrier des Absences
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setStartYear(startYear - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-sm">Sept {startYear}  Août {startYear + 1}</span>
                <Button variant="outline" size="sm" onClick={() => setStartYear(startYear + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(TYPE_ABSENCE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: TYPE_ABSENCE_COLORS[key] }}></div>
                  <span>{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded bg-gray-200"></div>
                <span>Weekend</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="overflow-x-auto">
              <table className="border-collapse text-[11px] w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    {moisData.map((mois, idx) => (
                      <th key={idx} colSpan={2} className="border border-gray-300 p-1 text-center font-bold bg-gray-50 text-xs">
                        {mois.nom.substring(0, 4)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 31 }, (_, dayIdx) => {
                    const dayNum = dayIdx + 1
                    return (
                      <tr key={dayNum} className="h-[22px]">
                        {moisData.map((mois, moisIdx) => {
                          if (dayNum > mois.nbJours) {
                            return (
                              <td key={`${moisIdx}-n`} colSpan={2} className="border border-gray-200 bg-gray-50"></td>
                            )
                          }
                          const date = new Date(mois.annee, mois.moisIndex, dayNum)
                          const jourSemaine = date.getDay()
                          const jourLettre = JOURS_SEMAINE_LETTRES[jourSemaine]
                          const isWeekend = jourSemaine === 0 || jourSemaine === 6

                          // Trouver toutes les absences de tous les employés pour ce jour
                          const absencesDuJour: { absence: Absence; empName: string }[] = []
                          for (const emp of allEmployeesForCalendar) {
                            const abs = getAbsencesForDay(emp.nom, emp.prenom, mois.annee, mois.moisIndex, dayNum)
                            abs.forEach(a => absencesDuJour.push({ absence: a, empName: `${emp.nom} ${emp.prenom}` }))
                          }

                          const bgColor = isWeekend ? '#E5E7EB' : '#FFFFFF'
                          const hasAbsences = absencesDuJour.length > 0

                          return (
                            <React.Fragment key={`${moisIdx}-d`}>
                              <td
                                className="border-l border-t border-b border-gray-300 p-0 text-center"
                                style={{ backgroundColor: bgColor, width: '28px' }}
                              >
                                <span className="text-[10px] font-medium text-gray-600">{dayNum}</span>
                                <span className="text-[9px] text-gray-400 ml-[1px]">{jourLettre}</span>
                              </td>
                              <td
                                className="border-r border-t border-b border-gray-300 p-0 relative"
                                style={{ backgroundColor: bgColor, width: '22px' }}
                                title={hasAbsences ? absencesDuJour.map(a => `${a.empName}: ${TYPE_ABSENCE_LABELS[a.absence.type_absence] || a.absence.type_absence}`).join('\n') : ''}
                              >
                                {hasAbsences && (
                                  <div className="flex h-full gap-[1px] items-stretch" style={{ minHeight: '18px' }}>
                                    {absencesDuJour.map((item, i) => (
                                      <div
                                        key={i}
                                        className="flex-1 rounded-sm"
                                        style={{
                                          backgroundColor: item.absence.couleur || TYPE_ABSENCE_COLORS[item.absence.type_absence] || '#3B82F6',
                                          minWidth: '3px',
                                          maxWidth: '8px'
                                        }}
                                      ></div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </React.Fragment>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== DEMANDES ===== */}
      {activeView === 'demandes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Demandes en attente ({demandesEnAttente})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {absences.filter(a => a.statut === 'en_attente').length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Check className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune demande en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {absences.filter(a => a.statut === 'en_attente').map((absence) => (
                  <div key={absence.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">{absence.nom} {absence.prenom}</span>
                          <Badge className={STATUT_CONFIG['en_attente'].bg}>{STATUT_CONFIG['en_attente'].label}</Badge>
                          <Badge variant="outline" style={{ borderColor: TYPE_ABSENCE_COLORS[absence.type_absence], color: TYPE_ABSENCE_COLORS[absence.type_absence] }}>
                            {TYPE_ABSENCE_LABELS[absence.type_absence] || absence.type_absence}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                          <div><span className="font-medium">Du:</span> {new Date(absence.date_debut).toLocaleDateString('fr-FR')}</div>
                          <div><span className="font-medium">Au:</span> {new Date(absence.date_fin).toLocaleDateString('fr-FR')}</div>
                          <div><span className="font-medium">Durée:</span> {Math.ceil((new Date(absence.date_fin).getTime() - new Date(absence.date_debut).getTime()) / (1000 * 60 * 60 * 24)) + 1} jour(s)</div>
                          <div><span className="font-medium">Demandé le:</span> {new Date(absence.created_at).toLocaleDateString('fr-FR')}</div>
                        </div>
                        {absence.motif && (
                          <div className="text-sm bg-gray-50 p-2 rounded mt-1"><span className="font-medium">Motif:</span> {absence.motif}</div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedAbsence(absence); setDecisionComment(''); setShowDecisionModal(true) }}>
                          <Check className="w-4 h-4 mr-1" />Approuver
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setSelectedAbsence(absence); setDecisionComment(''); setShowDecisionModal(true) }}>
                          <X className="w-4 h-4 mr-1" />Refuser
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== LISTE ===== */}
      {activeView === 'liste' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Toutes les absences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg border">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Date début</Label>
                <Input type="date" value={filterDateDebut} onChange={(e) => setFilterDateDebut(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Date fin</Label>
                <Input type="date" value={filterDateFin} onChange={(e) => setFilterDateFin(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Statut</Label>
                <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="w-full h-9 rounded-md border border-gray-300 px-2 text-sm">
                  <option value="tous">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="approuvee">Approuvée</option>
                  <option value="refusee">Refusée</option>
                  <option value="directe">Directe</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Type</Label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full h-9 rounded-md border border-gray-300 px-2 text-sm">
                  <option value="tous">Tous les types</option>
                  <option value="conge">Congé</option>
                  <option value="maladie">Maladie</option>
                  <option value="sans_solde">Sans solde</option>
                  <option value="formation">Formation</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Recherche</Label>
                <Input placeholder="Nom ou prénom..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="h-9" />
              </div>
            </div>
            {/* Bouton reset + compteur */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{filteredAbsences.length} absence{filteredAbsences.length > 1 ? 's' : ''} trouvée{filteredAbsences.length > 1 ? 's' : ''}</p>
              {(filterDateDebut || filterDateFin || filterStatut !== 'tous' || filterType !== 'tous' || filterSearch) && (
                <Button variant="outline" size="sm" onClick={() => { setFilterDateDebut(''); setFilterDateFin(''); setFilterStatut('tous'); setFilterType('tous'); setFilterSearch('') }}>
                  <X className="w-3 h-3 mr-1" />Réinitialiser les filtres
                </Button>
              )}
            </div>

            {filteredAbsences.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune absence enregistrée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3">Employé</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Du</th>
                      <th className="text-left p-3">Au</th>
                      <th className="text-center p-3">Durée</th>
                      <th className="text-left p-3">Motif</th>
                      <th className="text-center p-3">Statut</th>
                      <th className="text-left p-3">Origine</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAbsences.map((absence) => {
                      const duree = Math.ceil((new Date(absence.date_fin).getTime() - new Date(absence.date_debut).getTime()) / (1000 * 60 * 60 * 24)) + 1
                      const statutConfig = STATUT_CONFIG[absence.statut] || STATUT_CONFIG['en_attente']
                      return (
                        <tr key={absence.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{absence.nom} {absence.prenom}</td>
                          <td className="p-3"><Badge variant="outline" style={{ borderColor: TYPE_ABSENCE_COLORS[absence.type_absence], color: TYPE_ABSENCE_COLORS[absence.type_absence] }}>{TYPE_ABSENCE_LABELS[absence.type_absence] || absence.type_absence}</Badge></td>
                          <td className="p-3">{new Date(absence.date_debut).toLocaleDateString('fr-FR')}</td>
                          <td className="p-3">{new Date(absence.date_fin).toLocaleDateString('fr-FR')}</td>
                          <td className="p-3 text-center"><Badge variant="outline">{duree}j</Badge></td>
                          <td className="p-3 max-w-[200px] truncate">{absence.motif || '-'}</td>
                          <td className="p-3 text-center"><Badge className={statutConfig.bg}>{statutConfig.label}</Badge></td>
                          <td className="p-3 text-xs text-gray-500">
                            {absence.demande_par === 'technicien' ? 'Technicien' : 'Admin'}
                            {absence.approuve_par && <div className="text-xs mt-1">par {absence.approuve_par}</div>}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {absence.statut === 'en_attente' && (
                                <>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
                                    onClick={() => { setSelectedAbsence(absence); setDecisionComment(''); setShowDecisionModal(true) }} title="Approuver"><Check className="w-3 h-3" /></Button>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs bg-red-100 hover:bg-red-200 border-red-300 text-red-800"
                                    onClick={() => { setSelectedAbsence(absence); setDecisionComment(''); setShowDecisionModal(true) }} title="Refuser"><X className="w-3 h-3" /></Button>
                                </>
                              )}
                              {isAdmin && (
                                <>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                                    onClick={() => { setEditAbsence(absence); setShowEditModal(true) }} title="Modifier"><Pencil className="w-3 h-3" /></Button>
                                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                                    onClick={() => handleDelete(absence.id)} title="Supprimer"><Trash2 className="w-3 h-3" /></Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ===== MODAL CRÉATION ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nouvelle Absence</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Employé *</Label>
                <Select value={newAbsence.employe_id} onValueChange={(value) => {
                  const emp = employees.find(e => e.id === parseInt(value))
                  setNewAbsence({ ...newAbsence, employe_id: value, nom: emp?.nom || '', prenom: emp?.prenom || '' })
                }}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>{emp.nom} {emp.prenom} {emp.matricule ? `(${emp.matricule})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date début *</Label><Input type="date" value={newAbsence.date_debut} onChange={(e) => setNewAbsence({ ...newAbsence, date_debut: e.target.value })} /></div>
                <div><Label>Date fin *</Label><Input type="date" value={newAbsence.date_fin} onChange={(e) => setNewAbsence({ ...newAbsence, date_fin: e.target.value })} /></div>
              </div>
              <div>
                <Label>Type d&apos;absence</Label>
                <Select value={newAbsence.type_absence} onValueChange={(value) => setNewAbsence({ ...newAbsence, type_absence: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conge">Congé</SelectItem>
                    <SelectItem value="maladie">Maladie</SelectItem>
                    <SelectItem value="sans_solde">Sans solde</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Motif</Label><Textarea value={newAbsence.motif} onChange={(e) => setNewAbsence({ ...newAbsence, motif: e.target.value })} placeholder="Motif de l'absence..." rows={2} /></div>
              <div><Label>Commentaire</Label><Textarea value={newAbsence.commentaire_admin} onChange={(e) => setNewAbsence({ ...newAbsence, commentaire_admin: e.target.value })} placeholder="Commentaire optionnel..." rows={2} /></div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateAbsence}><Plus className="w-4 h-4 mr-2" />Créer</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL MODIFICATION (Admin) ===== */}
      {showEditModal && editAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Modifier l&apos;absence</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowEditModal(false); setEditAbsence(null) }}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold">{editAbsence.nom} {editAbsence.prenom}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date début *</Label>
                  <Input type="date" value={editAbsence.date_debut?.split('T')[0]} onChange={(e) => setEditAbsence({ ...editAbsence, date_debut: e.target.value })} />
                </div>
                <div>
                  <Label>Date fin *</Label>
                  <Input type="date" value={editAbsence.date_fin?.split('T')[0]} onChange={(e) => setEditAbsence({ ...editAbsence, date_fin: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Type d&apos;absence</Label>
                <Select value={editAbsence.type_absence} onValueChange={(value) => setEditAbsence({ ...editAbsence, type_absence: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conge">Congé</SelectItem>
                    <SelectItem value="maladie">Maladie</SelectItem>
                    <SelectItem value="sans_solde">Sans solde</SelectItem>
                    <SelectItem value="formation">Formation</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Statut</Label>
                <Select value={editAbsence.statut} onValueChange={(value) => setEditAbsence({ ...editAbsence, statut: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="approuvee">Approuvée</SelectItem>
                    <SelectItem value="refusee">Refusée</SelectItem>
                    <SelectItem value="directe">Directe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motif</Label>
                <Textarea value={editAbsence.motif || ''} onChange={(e) => setEditAbsence({ ...editAbsence, motif: e.target.value })} placeholder="Motif..." rows={2} />
              </div>
              <div>
                <Label>Commentaire admin</Label>
                <Textarea value={editAbsence.commentaire_admin || ''} onChange={(e) => setEditAbsence({ ...editAbsence, commentaire_admin: e.target.value })} placeholder="Commentaire..." rows={2} />
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => { setShowEditModal(false); setEditAbsence(null) }}>Annuler</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={async () => {
                  try {
                    const response = await fetch('/api/absences', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: editAbsence.id,
                        date_debut: editAbsence.date_debut?.split('T')[0],
                        date_fin: editAbsence.date_fin?.split('T')[0],
                        type_absence: editAbsence.type_absence,
                        statut: editAbsence.statut,
                        motif: editAbsence.motif || null,
                        commentaire_admin: editAbsence.commentaire_admin || null
                      })
                    })
                    if (response.ok) {
                      alert('Absence modifiée avec succès !')
                      setShowEditModal(false)
                      setEditAbsence(null)
                      loadData()
                    } else {
                      const err = await response.json()
                      alert(err.error || 'Erreur lors de la modification')
                    }
                  } catch (error) {
                    console.error('Erreur modification absence:', error)
                    alert('Erreur lors de la modification')
                  }
                }}>
                  <Pencil className="w-4 h-4 mr-2" />Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DÉCISION ===== */}
      {showDecisionModal && selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Traiter la demande</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDecisionModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold">{selectedAbsence.nom} {selectedAbsence.prenom}</p>
                <p className="text-sm text-gray-600">
                  {TYPE_ABSENCE_LABELS[selectedAbsence.type_absence]}  Du {new Date(selectedAbsence.date_debut).toLocaleDateString('fr-FR')} au {new Date(selectedAbsence.date_fin).toLocaleDateString('fr-FR')}
                </p>
                {selectedAbsence.motif && <p className="text-sm text-gray-500 mt-1">Motif: {selectedAbsence.motif}</p>}
              </div>
              <div><Label>Commentaire (optionnel)</Label><Textarea value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} placeholder="Ajouter un commentaire..." rows={3} /></div>
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDecisionModal(false)}>Annuler</Button>
                <Button variant="destructive" onClick={() => handleDecision('refuser')}><X className="w-4 h-4 mr-2" />Refuser</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleDecision('approuver')}><Check className="w-4 h-4 mr-2" />Approuver</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
