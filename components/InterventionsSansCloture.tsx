"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, RefreshCw, CalendarCheck, Search, CheckCircle } from "lucide-react"

interface InterSansCloture {
  id: number
  num_inter: string
  nom_technicien: string
  prenom_technicien: string
  client: string | null
  date_rdv: string | null
  type_intervention: string | null
  articles: string | null
  grille: string | null
  ville: string | null
  recette_technicien: number
}

// Normaliser une date_rdv (YYYY-MM-DD ou DD/MM/YYYY) vers YYYY-MM-DD pour <input type=date>
function toInputDate(raw: string | null): string {
  if (!raw) return ''
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return ''
}

function formatDateFr(raw: string | null): string {
  const d = toInputDate(raw)
  if (!d) return '-'
  const [y, mo, day] = d.split('-')
  return `${day}/${mo}/${y}`
}

// Mois précédent au format 'YYYY-MM'
function getPreviousMonth(): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function InterventionsSansCloture() {
  const [interventions, setInterventions] = useState<InterSansCloture[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [mois, setMois] = useState<string>(getPreviousMonth()) // mois précédent par défaut
  const [technicienFilter, setTechnicienFilter] = useState('all')
  const [dates, setDates] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<number | null>(null)

  // Le fetch ne dépend que du mois ; technicien + recherche sont filtrés côté client
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (mois) params.append('mois', mois)
      const res = await fetch(`/api/interventions-sans-cloture${params.toString() ? `?${params.toString()}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        const list: InterSansCloture[] = data.interventions || []
        setInterventions(list)
        const init: Record<number, string> = {}
        list.forEach(i => { init[i.id] = toInputDate(i.date_rdv) })
        setDates(init)
      }
    } catch (e) {
      console.error('Erreur chargement interventions sans clôture:', e)
    } finally {
      setLoading(false)
    }
  }, [mois])

  useEffect(() => { load() }, [load])

  // Liste unique des techniciens (du mois chargé) pour le filtre
  const uniqueTechniciens = useMemo(() => {
    const set = new Set<string>()
    interventions.forEach(i => set.add(`${i.prenom_technicien} ${i.nom_technicien}`.trim()))
    return Array.from(set).sort()
  }, [interventions])

  // Filtrage client : technicien + recherche
  const filtered = useMemo(() => {
    return interventions.filter(i => {
      if (technicienFilter !== 'all' && `${i.prenom_technicien} ${i.nom_technicien}`.trim() !== technicienFilter) return false
      if (search) {
        const s = search.toLowerCase()
        const hay = `${i.num_inter} ${i.client || ''} ${i.prenom_technicien} ${i.nom_technicien}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [interventions, technicienFilter, search])

  const handleClasser = async (inter: InterSansCloture) => {
    const date = dates[inter.id]
    if (!date) {
      alert('Veuillez choisir une date de classement')
      return
    }
    setSaving(inter.id)
    try {
      const res = await fetch('/api/interventions-sans-cloture', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inter.id, date_cloture: date })
      })
      if (res.ok) {
        setInterventions(prev => prev.filter(i => i.id !== inter.id))
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors du classement')
      }
    } catch (e) {
      console.error('Erreur classement:', e)
      alert('Erreur lors du classement')
    } finally {
      setSaving(null)
    }
  }

  const totalRecette = filtered.reduce((s, i) => s + (Number(i.recette_technicien) || 0), 0)

  return (
    <Card className="glass-card border border-white/20 hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              Interventions clôturées sans date de clôture
            </CardTitle>
            <CardDescription>
              {filtered.length} intervention{filtered.length > 1 ? 's' : ''} à classer • Montant total : {totalRecette.toFixed(2)} €
            </CardDescription>
          </div>
          <Button onClick={load} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Ces interventions sont <strong>clôturées terminées</strong> mais <strong>sans date de clôture</strong>, elles ne sont donc comptées dans aucun mois.
            Choisissez la date de classement (par défaut = date RDV) puis cliquez sur <strong>Classer</strong> pour les inclure dans la recette générée du mois correspondant.
          </span>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Mois (date RDV)</Label>
            <Input type="month" value={mois} onChange={(e) => setMois(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Technicien</Label>
            <Select value={technicienFilter} onValueChange={setTechnicienFilter}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Tous les techniciens" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les techniciens</SelectItem>
                {uniqueTechniciens.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <Input placeholder="N° inter, client..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500" />
            <p>Aucune intervention à classer pour ce mois 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-3">N° Inter</th>
                  <th className="p-3">Technicien</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Date RDV</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Ville</th>
                  <th className="p-3 text-right">Recette</th>
                  <th className="p-3">Classer dans le mois de…</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inter) => (
                  <tr key={inter.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3 font-medium">{inter.num_inter}</td>
                    <td className="p-3">{inter.prenom_technicien} {inter.nom_technicien}</td>
                    <td className="p-3">{inter.client || '-'}</td>
                    <td className="p-3 whitespace-nowrap">{formatDateFr(inter.date_rdv)}</td>
                    <td className="p-3"><Badge variant="outline">{inter.type_intervention || '-'}</Badge></td>
                    <td className="p-3 max-w-[160px] truncate">{inter.ville || '-'}</td>
                    <td className="p-3 text-right font-medium text-green-600">{Number(inter.recette_technicien).toFixed(2)} €</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={dates[inter.id] || ''}
                          onChange={(e) => setDates(prev => ({ ...prev, [inter.id]: e.target.value }))}
                          className="h-8 w-[150px]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-blue-600"
                          title="Réinitialiser sur la date RDV"
                          onClick={() => setDates(prev => ({ ...prev, [inter.id]: toInputDate(inter.date_rdv) }))}
                        >
                          = RDV
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700 text-white"
                        disabled={saving === inter.id || !dates[inter.id]}
                        onClick={() => handleClasser(inter)}
                      >
                        {saving === inter.id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <><CalendarCheck className="w-4 h-4 mr-1" />Classer</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
