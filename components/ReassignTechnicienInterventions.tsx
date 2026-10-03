"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { UserCog, RefreshCw, Search, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

// Technicien regroupé côté API (toutes orthographes confondues) ; nom/prénom = orthographe la plus fréquente
interface Technicien {
  key: string
  nom_technicien: string
  prenom_technicien: string | null
  nb_interventions: number
  variantes: string[]
}

interface InterTech {
  id: number
  num_inter: string
  nom_technicien: string
  prenom_technicien: string | null
  statut: string | null
  client: string | null
  date_rdv: string | null
  cloture_tech: string | null
  cloture_hotline: string | null
  type_intervention: string | null
  articles: string | null
  ville: string | null
  grille: string | null
}

const techLabel = (t: { nom_technicien: string, prenom_technicien: string | null }) =>
  `${t.prenom_technicien || ''} ${t.nom_technicien}`.trim()

// Normaliser une date (YYYY-MM-DD ou DD/MM/YYYY) vers YYYY-MM-DD
function toIsoDate(raw: string | null): string {
  if (!raw) return ''
  const s = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10)
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return ''
}

function formatDateFr(raw: string | null): string {
  const d = toIsoDate(raw)
  if (!d) return '-'
  const [y, mo, day] = d.split('-')
  return `${day}/${mo}/${y}`
}

// Extraire les numéros d'intervention d'un texte collé (séparés par espaces, virgules, retours à la ligne...)
const parseNums = (text: string) => Array.from(new Set(text.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)))

export function ReassignTechnicienInterventions() {
  const [techniciens, setTechniciens] = useState<Technicien[]>([])
  const [sourceKey, setSourceKey] = useState('')
  const [targetKey, setTargetKey] = useState('')
  const [interventions, setInterventions] = useState<InterTech[]>([])
  const [loading, setLoading] = useState(false)
  const [statutFilter, setStatutFilter] = useState('CLOTURE TERMINEE')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [numsText, setNumsText] = useState('')
  const [numsNotFound, setNumsNotFound] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const source = techniciens.find(t => t.key === sourceKey) || null
  const target = techniciens.find(t => t.key === targetKey) || null

  const loadTechniciens = useCallback(async () => {
    try {
      const res = await fetch('/api/interventions/reassign-technicien')
      const data = await res.json()
      if (res.ok) {
        setTechniciens(data.techniciens || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement des techniciens' })
      }
    } catch (e) {
      console.error('Erreur chargement techniciens:', e)
    }
  }, [])

  const loadInterventions = useCallback(async () => {
    if (!sourceKey) {
      setInterventions([])
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ key: sourceKey })
      const res = await fetch(`/api/interventions/reassign-technicien?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setInterventions(data.interventions || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement des interventions' })
      }
    } catch (e) {
      console.error('Erreur chargement interventions technicien:', e)
    } finally {
      setLoading(false)
    }
  }, [sourceKey])

  useEffect(() => { loadTechniciens() }, [loadTechniciens])

  useEffect(() => {
    setSelected(new Set())
    setNumsNotFound([])
    loadInterventions()
  }, [loadInterventions])

  const uniqueStatuts = useMemo(() => {
    const set = new Set<string>()
    interventions.forEach(i => { if (i.statut) set.add(i.statut) })
    return Array.from(set).sort()
  }, [interventions])

  const filtered = useMemo(() => {
    return interventions.filter(i => {
      if (statutFilter !== 'all' && (i.statut || '').toUpperCase() !== statutFilter.toUpperCase()) return false
      if (dateStart || dateEnd) {
        const d = toIsoDate(i.date_rdv)
        if (!d) return false
        if (dateStart && d < dateStart) return false
        if (dateEnd && d > dateEnd) return false
      }
      if (search) {
        const s = search.toLowerCase()
        const hay = `${i.num_inter} ${i.client || ''} ${i.ville || ''}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [interventions, statutFilter, dateStart, dateEnd, search])

  // La sélection reste toujours limitée aux interventions visibles
  useEffect(() => {
    const visible = new Set(filtered.map(i => i.id))
    setSelected(prev => {
      const next = new Set(Array.from(prev).filter(id => visible.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filtered])

  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id))

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map(i => i.id)) : new Set())
  }

  const toggleOne = (id: number, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  // mode 'only' : sélectionner uniquement ces N° ; mode 'exclude' : retirer ces N° de la sélection
  const applyNums = (mode: 'only' | 'exclude') => {
    const nums = parseNums(numsText)
    if (nums.length === 0) return
    const byNum = new Map(filtered.map(i => [String(i.num_inter).trim(), i.id]))
    setNumsNotFound(nums.filter(n => !byNum.has(n)))
    const ids = nums.map(n => byNum.get(n)).filter((id): id is number => id !== undefined)
    if (mode === 'only') {
      setSelected(new Set(ids))
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        ids.forEach(id => next.delete(id))
        return next
      })
    }
  }

  const handleReassign = async () => {
    if (!source || !target || selected.size === 0) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/interventions/reassign-technicien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selected),
          sourceKey,
          target: { nom: target.nom_technicien, prenom: target.prenom_technicien || '' }
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `${data.updated} intervention(s) réattribuée(s) de ${techLabel(source)} à ${techLabel(target)}`
            + (data.skipped > 0 ? ` • ${data.skipped} ignorée(s) (déjà modifiées entre-temps)` : '')
        })
        setSelected(new Set())
        setNumsText('')
        setNumsNotFound([])
        await Promise.all([loadTechniciens(), loadInterventions()])
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la réattribution' })
      }
    } catch (e) {
      console.error('Erreur réattribution:', e)
      setMessage({ type: 'error', text: 'Erreur lors de la réattribution' })
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  return (
    <Card className="glass-card border border-white/20 hover-lift">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <UserCog className="w-6 h-6 text-primary" />
              Réattribuer des interventions à un autre technicien
            </CardTitle>
            <CardDescription>
              Réservé aux administrateurs • Corrige le technicien noté sur les interventions sélectionnées
            </CardDescription>
          </div>
          <Button onClick={() => { loadTechniciens(); loadInterventions() }} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm border ${message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message.type === 'success'
              ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Technicien actuel → nouveau technicien */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end p-4 bg-white/5 rounded-lg border border-white/10">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Technicien actuellement noté</Label>
            <Select value={sourceKey} onValueChange={(v) => { setSourceKey(v); setMessage(null) }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Choisir le technicien…" /></SelectTrigger>
              <SelectContent>
                {techniciens.filter(t => t.nb_interventions > 0).map(t => (
                  <SelectItem key={t.key} value={t.key}>
                    {techLabel(t)} ({t.nb_interventions})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight className="hidden md:block w-5 h-5 mb-2 text-muted-foreground" />
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Nouveau technicien (celui qui a réellement travaillé)</Label>
            <Select value={targetKey} onValueChange={setTargetKey}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Choisir le technicien…" /></SelectTrigger>
              <SelectContent>
                {techniciens.filter(t => t.key !== sourceKey).map(t => (
                  <SelectItem key={t.key} value={t.key}>
                    {techLabel(t)}{t.nb_interventions > 0 ? ` (${t.nb_interventions})` : ' (aucune intervention)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {source && (
          <>
            {source.variantes.length > 1 && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Ce technicien est écrit de {source.variantes.length} façons différentes dans les interventions, toutes regroupées ici : {source.variantes.join(' • ')}
                </span>
              </div>
            )}

            {/* Filtres */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Statut</Label>
                <Select value={statutFilter} onValueChange={setStatutFilter}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {uniqueStatuts.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Date RDV - Début</Label>
                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Date RDV - Fin</Label>
                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="h-9" />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Recherche</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                  <Input placeholder="N° inter, client, ville..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
                </div>
              </div>
            </div>

            {/* Sélection par liste de N° d'intervention */}
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
              <Label className="text-xs text-gray-500 block">
                Coller des N° d'intervention (un par ligne, ou séparés par des virgules/espaces)
              </Label>
              <Textarea
                value={numsText}
                onChange={(e) => setNumsText(e.target.value)}
                placeholder={"164034823\n164024025"}
                rows={3}
                className="font-mono text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => applyNums('only')} disabled={!numsText.trim()}>
                  Sélectionner uniquement ces N°
                </Button>
                <Button size="sm" variant="outline" onClick={() => applyNums('exclude')} disabled={!numsText.trim()}>
                  Retirer ces N° de la sélection
                </Button>
              </div>
              {numsNotFound.length > 0 && (
                <p className="text-xs text-orange-700">
                  Introuvables dans la liste affichée : {numsNotFound.join(', ')}
                </p>
              )}
            </div>

            {/* Barre d'action */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{selected.size}</strong> sélectionnée(s) sur {filtered.length} affichée(s)
                {filtered.length !== interventions.length && ` (${interventions.length} au total pour ce technicien)`}
              </span>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={selected.size === 0 || !target || saving}
                onClick={() => setConfirmOpen(true)}
              >
                <UserCog className="w-4 h-4 mr-2" />
                Réattribuer {selected.size} intervention(s){target ? ` à ${techLabel(target)}` : ''}
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
                <p>Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucune intervention pour ces filtres</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b border-white/10 text-left">
                      <th className="p-3 w-10">
                        <Checkbox checked={allSelected} onCheckedChange={(c) => toggleAll(!!c)} aria-label="Tout sélectionner" />
                      </th>
                      <th className="p-3">N° Inter</th>
                      <th className="p-3">Noté comme</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Date RDV</th>
                      <th className="p-3">Clôture</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Ville</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(inter => (
                      <tr
                        key={inter.id}
                        className={`border-b border-white/5 hover:bg-white/5 cursor-pointer ${selected.has(inter.id) ? 'bg-blue-50/50' : ''}`}
                        onClick={() => toggleOne(inter.id, !selected.has(inter.id))}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selected.has(inter.id)} onCheckedChange={(c) => toggleOne(inter.id, !!c)} />
                        </td>
                        <td className="p-3 font-medium">{inter.num_inter}</td>
                        <td className="p-3 whitespace-nowrap">{techLabel(inter)}</td>
                        <td className="p-3"><Badge variant="outline">{inter.statut || '-'}</Badge></td>
                        <td className="p-3">{inter.client || '-'}</td>
                        <td className="p-3 whitespace-nowrap">{formatDateFr(inter.date_rdv)}</td>
                        <td className="p-3 whitespace-nowrap">{formatDateFr(inter.cloture_tech) !== '-' ? formatDateFr(inter.cloture_tech) : formatDateFr(inter.cloture_hotline)}</td>
                        <td className="p-3">{inter.type_intervention || '-'}</td>
                        <td className="p-3 max-w-[160px] truncate">{inter.ville || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!saving) setConfirmOpen(open) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la réattribution</AlertDialogTitle>
              <AlertDialogDescription>
                {selected.size} intervention(s) vont passer de <strong>{source ? techLabel(source) : ''}</strong> à <strong>{target ? techLabel(target) : ''}</strong>.
                La recette et les calculs de ces interventions seront comptés pour le nouveau technicien.
                L'opération est enregistrée dans l'historique.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleReassign() }}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirmer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
