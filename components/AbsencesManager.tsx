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
  MessageSquare,
  Trash2,
  AlertCircle
} from "lucide-react"

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

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'en_attente': { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
  'approuvee': { label: 'Approuvée', color: 'text-green-700', bg: 'bg-green-100 border-green-300' },
  'refusee': { label: 'Refusée', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  'directe': { label: 'Directe', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' }
}

const MOIS_NOMS = [
  'Septembre', 'Octobre', 'Novembre', 'Décembre',
  'Janvier', 'Février', 'Mars', 'Avril',
  'Mai', 'Juin', 'Juillet', 'Août'
]

const JOURS_SEMAINE = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function AbsencesManager() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState<'calendrier' | 'demandes' | 'liste'>('calendrier')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)
  const [decisionComment, setDecisionComment] = useState('')
  
  // Année scolaire : Sept année N -> Août année N+1
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() // 0-11
  const currentYear = currentDate.getFullYear()
  // Si on est entre sept-dec, l'année de début est l'année courante, sinon c'est l'année précédente
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

  // Charger les données
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [absencesRes, employeesRes] = await Promise.all([
        fetch(`/api/absences?annee=${startYear}`),
        fetch('/api/employees?statut=actif')
      ])
      
      if (absencesRes.ok) {
        const data = await absencesRes.json()
        setAbsences(data.absences || [])
      }
      
      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data.employees || data.data || [])
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

  // Créer une absence directe (par admin)
  const handleCreateAbsence = async () => {
    if (!newAbsence.date_debut || !newAbsence.date_fin) {
      alert('Les dates sont obligatoires')
      return
    }

    // Récupérer nom/prénom depuis l'employé sélectionné
    let nom = newAbsence.nom
    let prenom = newAbsence.prenom
    let employe_id = newAbsence.employe_id ? parseInt(newAbsence.employe_id) : null

    if (employe_id) {
      const emp = employees.find(e => e.id === employe_id)
      if (emp) {
        nom = emp.nom
        prenom = emp.prenom
      }
    }

    if (!nom || !prenom) {
      alert('Veuillez sélectionner un employé ou remplir le nom et prénom')
      return
    }

    try {
      const response = await fetch('/api/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employe_id,
          nom,
          prenom,
          date_debut: newAbsence.date_debut,
          date_fin: newAbsence.date_fin,
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

  // Approuver/Refuser une demande
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
      alert('Erreur')
    }
  }

  // Supprimer une absence
  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette absence ?')) return

    try {
      const response = await fetch(`/api/absences?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  // Compter les demandes en attente
  const demandesEnAttente = absences.filter(a => a.statut === 'en_attente').length

  // Absences visibles dans le calendrier (approuvées + directes)
  const absencesCalendrier = absences.filter(a => a.statut === 'approuvee' || a.statut === 'directe')

  // Obtenir les employés uniques qui ont des absences dans le calendrier
  const employeesAvecAbsences = Array.from(
    new Map(
      absencesCalendrier.map(a => [`${a.nom}_${a.prenom}`, { nom: a.nom, prenom: a.prenom, employe_id: a.employe_id }])
    ).values()
  ).sort((a, b) => a.nom.localeCompare(b.nom))

  // Vérifier si un jour donné est dans une absence pour un employé
  const getAbsenceForDay = (nom: string, prenom: string, date: Date): Absence | null => {
    return absencesCalendrier.find(a => {
      if (a.nom !== nom || a.prenom !== prenom) return false
      const debut = new Date(a.date_debut)
      const fin = new Date(a.date_fin)
      debut.setHours(0, 0, 0, 0)
      fin.setHours(23, 59, 59, 999)
      date.setHours(12, 0, 0, 0)
      return date >= debut && date <= fin
    }) || null
  }

  // Générer les mois du calendrier (Sept -> Août)
  const getCalendrierMois = () => {
    const mois = []
    for (let i = 0; i < 12; i++) {
      const moisIndex = (8 + i) % 12 // Commence à septembre (8)
      const annee = moisIndex >= 8 ? startYear : startYear + 1
      const nbJours = new Date(annee, moisIndex + 1, 0).getDate()
      
      const jours = []
      for (let j = 1; j <= nbJours; j++) {
        const date = new Date(annee, moisIndex, j)
        const jourSemaine = date.getDay() // 0=dim, 1=lun...
        const jourLettre = JOURS_SEMAINE[jourSemaine === 0 ? 6 : jourSemaine - 1]
        const isWeekend = jourSemaine === 0 || jourSemaine === 6
        jours.push({ jour: j, date, jourLettre, isWeekend })
      }
      
      mois.push({
        nom: MOIS_NOMS[i],
        moisIndex,
        annee,
        jours
      })
    }
    return mois
  }

  const calendrierMois = getCalendrierMois()

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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Demandes en attente</p>
              <p className="text-2xl font-bold text-yellow-600">{demandesEnAttente}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Approuvées</p>
              <p className="text-2xl font-bold text-green-600">{absences.filter(a => a.statut === 'approuvee').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <X className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Refusées</p>
              <p className="text-2xl font-bold text-red-600">{absences.filter(a => a.statut === 'refusee').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Directes</p>
              <p className="text-2xl font-bold text-blue-600">{absences.filter(a => a.statut === 'directe').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vue tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeView === 'calendrier' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('calendrier')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Calendrier
        </Button>
        <Button
          variant={activeView === 'demandes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('demandes')}
          className="relative"
        >
          <Clock className="w-4 h-4 mr-2" />
          Demandes
          {demandesEnAttente > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {demandesEnAttente}
            </span>
          )}
        </Button>
        <Button
          variant={activeView === 'liste' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('liste')}
        >
          <Users className="w-4 h-4 mr-2" />
          Toutes les absences
        </Button>
      </div>

      {/* ========== VUE CALENDRIER ========== */}
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
                <span className="font-semibold text-sm">
                  Sept {startYear} — Août {startYear + 1}
                </span>
                <Button variant="outline" size="sm" onClick={() => setStartYear(startYear + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Légende */}
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
          <CardContent>
            {employeesAvecAbsences.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune absence enregistrée pour cette période</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white border p-1 min-w-[140px] text-left font-semibold">
                        Employé
                      </th>
                      {calendrierMois.map((mois, idx) => (
                        <th key={idx} colSpan={mois.jours.length} className="border p-1 text-center font-semibold bg-gray-50">
                          {mois.nom}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white border p-0 min-w-[140px]"></th>
                      {calendrierMois.map((mois) =>
                        mois.jours.map((jour) => (
                          <th
                            key={`${mois.moisIndex}-${jour.jour}`}
                            className={`border p-0 text-center w-[18px] min-w-[18px] ${jour.isWeekend ? 'bg-gray-100' : ''}`}
                          >
                            <div className="text-[9px] text-gray-400">{jour.jour}</div>
                            <div className="text-[8px] text-gray-300">{jour.jourLettre}</div>
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {employeesAvecAbsences.map((emp, empIdx) => (
                      <tr key={empIdx}>
                        <td className="sticky left-0 z-10 bg-white border p-1 font-medium text-xs whitespace-nowrap">
                          {emp.nom} {emp.prenom}
                        </td>
                        {calendrierMois.map((mois) =>
                          mois.jours.map((jour) => {
                            const absence = getAbsenceForDay(emp.nom, emp.prenom, new Date(jour.date))
                            return (
                              <td
                                key={`${mois.moisIndex}-${jour.jour}`}
                                className={`border p-0 w-[18px] min-w-[18px] h-[20px] ${jour.isWeekend && !absence ? 'bg-gray-100' : ''}`}
                                style={absence ? { backgroundColor: absence.couleur } : undefined}
                                title={absence ? `${TYPE_ABSENCE_LABELS[absence.type_absence] || absence.type_absence} - ${absence.motif || 'Pas de motif'}` : `${jour.jour} ${mois.nom}`}
                              >
                              </td>
                            )
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== VUE DEMANDES ========== */}
      {activeView === 'demandes' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Demandes d'absence en attente ({demandesEnAttente})
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
                          <Badge className={STATUT_CONFIG['en_attente'].bg}>
                            {STATUT_CONFIG['en_attente'].label}
                          </Badge>
                          <Badge variant="outline" style={{ borderColor: TYPE_ABSENCE_COLORS[absence.type_absence], color: TYPE_ABSENCE_COLORS[absence.type_absence] }}>
                            {TYPE_ABSENCE_LABELS[absence.type_absence] || absence.type_absence}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Du:</span> {new Date(absence.date_debut).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Au:</span> {new Date(absence.date_fin).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Durée:</span> {Math.ceil((new Date(absence.date_fin).getTime() - new Date(absence.date_debut).getTime()) / (1000 * 60 * 60 * 24)) + 1} jour(s)
                          </div>
                          <div>
                            <span className="font-medium">Demandé le:</span> {new Date(absence.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        {absence.motif && (
                          <div className="text-sm bg-gray-50 p-2 rounded mt-1">
                            <span className="font-medium">Motif:</span> {absence.motif}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedAbsence(absence)
                            setDecisionComment('')
                            setShowDecisionModal(true)
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedAbsence(absence)
                            setDecisionComment('')
                            setShowDecisionModal(true)
                          }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Refuser
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

      {/* ========== VUE LISTE ========== */}
      {activeView === 'liste' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Toutes les absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {absences.length === 0 ? (
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
                      <th className="text-left p-3">Commentaire</th>
                      <th className="text-center p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absences.map((absence) => {
                      const duree = Math.ceil((new Date(absence.date_fin).getTime() - new Date(absence.date_debut).getTime()) / (1000 * 60 * 60 * 24)) + 1
                      const statutConfig = STATUT_CONFIG[absence.statut] || STATUT_CONFIG['en_attente']
                      return (
                        <tr key={absence.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{absence.nom} {absence.prenom}</td>
                          <td className="p-3">
                            <Badge variant="outline" style={{ borderColor: TYPE_ABSENCE_COLORS[absence.type_absence], color: TYPE_ABSENCE_COLORS[absence.type_absence] }}>
                              {TYPE_ABSENCE_LABELS[absence.type_absence] || absence.type_absence}
                            </Badge>
                          </td>
                          <td className="p-3">{new Date(absence.date_debut).toLocaleDateString('fr-FR')}</td>
                          <td className="p-3">{new Date(absence.date_fin).toLocaleDateString('fr-FR')}</td>
                          <td className="p-3 text-center">
                            <Badge variant="outline">{duree}j</Badge>
                          </td>
                          <td className="p-3 max-w-[200px] truncate">{absence.motif || '-'}</td>
                          <td className="p-3 text-center">
                            <Badge className={statutConfig.bg}>
                              {statutConfig.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-gray-500">
                            {absence.demande_par === 'technicien' ? '🔧 Technicien' : '👤 Admin'}
                            {absence.approuve_par && (
                              <div className="text-xs mt-1">par {absence.approuve_par}</div>
                            )}
                          </td>
                          <td className="p-3 max-w-[200px] truncate text-xs text-gray-500">{absence.commentaire_admin || '-'}</td>
                          <td className="p-3 text-center">
                            <div className="flex gap-1 justify-center">
                              {absence.statut === 'en_attente' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
                                    onClick={() => {
                                      setSelectedAbsence(absence)
                                      setDecisionComment('')
                                      setShowDecisionModal(true)
                                    }}
                                    title="Approuver"
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs bg-red-100 hover:bg-red-200 border-red-300 text-red-800"
                                    onClick={() => {
                                      setSelectedAbsence(absence)
                                      setDecisionComment('')
                                      setShowDecisionModal(true)
                                    }}
                                    title="Refuser"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleDelete(absence.id)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
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

      {/* ========== MODAL CRÉATION ========== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nouvelle Absence</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Employé *</Label>
                <Select
                  value={newAbsence.employe_id}
                  onValueChange={(value) => {
                    const emp = employees.find(e => e.id === parseInt(value))
                    setNewAbsence({
                      ...newAbsence,
                      employe_id: value,
                      nom: emp?.nom || '',
                      prenom: emp?.prenom || ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.nom} {emp.prenom} {emp.matricule ? `(${emp.matricule})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date début *</Label>
                  <Input
                    type="date"
                    value={newAbsence.date_debut}
                    onChange={(e) => setNewAbsence({ ...newAbsence, date_debut: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date fin *</Label>
                  <Input
                    type="date"
                    value={newAbsence.date_fin}
                    onChange={(e) => setNewAbsence({ ...newAbsence, date_fin: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Type d'absence</Label>
                <Select
                  value={newAbsence.type_absence}
                  onValueChange={(value) => setNewAbsence({ ...newAbsence, type_absence: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label>Motif</Label>
                <Textarea
                  value={newAbsence.motif}
                  onChange={(e) => setNewAbsence({ ...newAbsence, motif: e.target.value })}
                  placeholder="Motif de l'absence..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Commentaire</Label>
                <Textarea
                  value={newAbsence.commentaire_admin}
                  onChange={(e) => setNewAbsence({ ...newAbsence, commentaire_admin: e.target.value })}
                  placeholder="Commentaire optionnel..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateAbsence}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer l'absence
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL DÉCISION (Approuver/Refuser) ========== */}
      {showDecisionModal && selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Traiter la demande</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDecisionModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold">{selectedAbsence.nom} {selectedAbsence.prenom}</p>
                <p className="text-sm text-gray-600">
                  {TYPE_ABSENCE_LABELS[selectedAbsence.type_absence]} — Du {new Date(selectedAbsence.date_debut).toLocaleDateString('fr-FR')} au {new Date(selectedAbsence.date_fin).toLocaleDateString('fr-FR')}
                </p>
                {selectedAbsence.motif && (
                  <p className="text-sm text-gray-500 mt-1">Motif: {selectedAbsence.motif}</p>
                )}
              </div>

              <div>
                <Label>Commentaire (optionnel)</Label>
                <Textarea
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDecisionModal(false)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDecision('refuser')}
                >
                  <X className="w-4 h-4 mr-2" />
                  Refuser
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleDecision('approuver')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
