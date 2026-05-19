'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Edit, Trash2, X, Save, Search, RefreshCw,
  FileText, User, Euro, Hash, MapPin, Calendar, Package
} from 'lucide-react'

interface FttoTicket {
  id: number
  num_ticket: string | null
  date_ticket: string | null
  code_g2r: string | null
  ville: string | null
  code_article: string | null
  designation: string | null
  prix_unitaire: number
  quantite: number
  total_ht: number
  employe_id: number | null
  technicien_nom: string | null
  technicien_prenom: string | null
  technicien_matricule: string | null
  part_technicien: number
  part_entreprise: number
  created_at: string
}

interface FttoTarif {
  id: number
  code_article: string
  designation: string
  bpu: number
}

interface Employe {
  id: number
  nom: string
  prenom: string
  matricule: string
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
]
const now = new Date()

const emptyForm = {
  num_ticket: '',
  date_ticket: '',
  code_g2r: '',
  ville: '',
  code_article: '',
  designation: '',
  prix_unitaire: 0,
  quantite: 1,
  employe_id: '',
}

export default function FttoManager() {
  const [tickets, setTickets] = useState<FttoTicket[]>([])
  const [tarifs, setTarifs] = useState<FttoTarif[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [searchTerm, setSearchTerm] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingTicket, setEditingTicket] = useState<FttoTicket | null>(null)
  const [form, setForm] = useState({ ...emptyForm })

  const [totals, setTotals] = useState({ total_ht: 0, part_technicien: 0, part_entreprise: 0 })

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ftto?mois=${selectedMonth}&annee=${selectedYear}`)
      const data = await res.json()
      if (data.success) {
        setTickets(data.tickets)
        setTotals(data.totals)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  const loadTarifs = useCallback(async () => {
    const res = await fetch('/api/ftto-tarifs')
    const data = await res.json()
    if (data.success) setTarifs(data.tarifs)
  }, [])

  const loadEmployes = useCallback(async () => {
    const res = await fetch('/api/employes')
    const data = await res.json()
    if (data.success) setEmployes(data.employes || [])
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])
  useEffect(() => { loadTarifs(); loadEmployes() }, [loadTarifs, loadEmployes])

  // ── Form helpers ───────────────────────────────────────────────────────────
  const handleArticleChange = (code: string) => {
    const tarif = tarifs.find(t => t.code_article === code)
    setForm(f => ({
      ...f,
      code_article: code,
      designation: tarif?.designation || f.designation,
      prix_unitaire: tarif ? Number(tarif.bpu) : f.prix_unitaire,
    }))
  }

  const totalHt = Number(form.prix_unitaire || 0) * Number(form.quantite || 1)
  const partTech = Math.round(totalHt * 0.35 * 100) / 100
  const partEnt = Math.round(totalHt * 0.65 * 100) / 100

  const openCreate = () => {
    setEditingTicket(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (t: FttoTicket) => {
    setEditingTicket(t)
    setForm({
      num_ticket: t.num_ticket || '',
      date_ticket: t.date_ticket ? t.date_ticket.slice(0, 10) : '',
      code_g2r: t.code_g2r || '',
      ville: t.ville || '',
      code_article: t.code_article || '',
      designation: t.designation || '',
      prix_unitaire: t.prix_unitaire,
      quantite: t.quantite,
      employe_id: t.employe_id ? String(t.employe_id) : '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const emp = employes.find(e => e.id === parseInt(form.employe_id as string))
      const payload = {
        ...form,
        prix_unitaire: parseFloat(String(form.prix_unitaire)) || 0,
        quantite: parseInt(String(form.quantite)) || 1,
        employe_id: emp?.id || null,
        technicien_nom: emp?.nom || null,
        technicien_prenom: emp?.prenom || null,
        technicien_matricule: emp?.matricule || null,
      }

      const method = editingTicket ? 'PUT' : 'POST'
      const body = editingTicket ? { ...payload, id: editingTicket.id } : payload

      const res = await fetch('/api/ftto', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        loadTickets()
      } else {
        alert('Erreur: ' + (data.error || 'Inconnue'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce ticket FTTO ?')) return
    await fetch(`/api/ftto?id=${id}`, { method: 'DELETE' })
    loadTickets()
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = tickets.filter(t => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    return (
      t.num_ticket?.toLowerCase().includes(s) ||
      t.code_g2r?.toLowerCase().includes(s) ||
      t.ville?.toLowerCase().includes(s) ||
      t.code_article?.toLowerCase().includes(s) ||
      t.technicien_nom?.toLowerCase().includes(s) ||
      t.technicien_prenom?.toLowerCase().includes(s)
    )
  })

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">FTTO</h2>
          <p className="text-muted-foreground text-sm">Gestion des tickets FTTO</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month / Year filters */}
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value))}
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={loadTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Nouveau Ticket
          </Button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-500 font-medium mb-1">Total H.T.</p>
          <p className="text-2xl font-bold text-blue-700">{totals.total_ht.toFixed(2)}€</p>
          <p className="text-xs text-blue-400">{filtered.length} ticket(s)</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-xs text-green-500 font-medium mb-1">Part Techniciens (35%)</p>
          <p className="text-2xl font-bold text-green-700">{totals.part_technicien.toFixed(2)}€</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-xs text-purple-500 font-medium mb-1">Part Entreprise (65%)</p>
          <p className="text-2xl font-bold text-purple-700">{totals.part_entreprise.toFixed(2)}€</p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Rechercher par ticket, G2R, ville, article, technicien…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">N° Ticket</th>
              <th className="text-left p-3 font-medium text-gray-500">Date</th>
              <th className="text-left p-3 font-medium text-gray-500">Code G2R</th>
              <th className="text-left p-3 font-medium text-gray-500">Ville</th>
              <th className="text-left p-3 font-medium text-gray-500">Code Article</th>
              <th className="text-left p-3 font-medium text-gray-500">Désignation</th>
              <th className="text-right p-3 font-medium text-gray-500">P.U. H.T.</th>
              <th className="text-right p-3 font-medium text-gray-500">Qté</th>
              <th className="text-right p-3 font-medium text-gray-500">Total H.T.</th>
              <th className="text-left p-3 font-medium text-gray-500">Technicien</th>
              <th className="text-right p-3 font-medium text-gray-500">Part Tech (35%)</th>
              <th className="text-right p-3 font-medium text-gray-500">Part Entr. (65%)</th>
              <th className="text-center p-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={13} className="text-center py-10 text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />Chargement…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-10 text-gray-400">
                  Aucun ticket FTTO pour cette période.
                </td>
              </tr>
            ) : (
              filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono text-blue-700 font-medium">{t.num_ticket || '—'}</td>
                  <td className="p-3 text-gray-600">
                    {t.date_ticket ? new Date(t.date_ticket).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="p-3 font-mono text-gray-700">{t.code_g2r || '—'}</td>
                  <td className="p-3 text-gray-700">{t.ville || '—'}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono">
                      {t.code_article || '—'}
                    </Badge>
                  </td>
                  <td className="p-3 text-gray-600 max-w-[140px] truncate">{t.designation || '—'}</td>
                  <td className="p-3 text-right font-medium">{Number(t.prix_unitaire).toFixed(2)}€</td>
                  <td className="p-3 text-right">{t.quantite}</td>
                  <td className="p-3 text-right font-semibold text-blue-700">{Number(t.total_ht).toFixed(2)}€</td>
                  <td className="p-3 text-gray-700">
                    {t.technicien_nom || t.technicien_prenom
                      ? <span>{t.technicien_nom} {t.technicien_prenom}<br /><span className="text-xs text-gray-400">{t.technicien_matricule}</span></span>
                      : '—'}
                  </td>
                  <td className="p-3 text-right font-semibold text-green-700">{Number(t.part_technicien).toFixed(2)}€</td>
                  <td className="p-3 text-right font-semibold text-purple-700">{Number(t.part_entreprise).toFixed(2)}€</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t font-semibold">
              <tr>
                <td colSpan={8} className="p-3 text-right text-gray-600">Totaux</td>
                <td className="p-3 text-right text-blue-700">
                  {filtered.reduce((s, t) => s + Number(t.total_ht), 0).toFixed(2)}€
                </td>
                <td className="p-3" />
                <td className="p-3 text-right text-green-700">
                  {filtered.reduce((s, t) => s + Number(t.part_technicien), 0).toFixed(2)}€
                </td>
                <td className="p-3 text-right text-purple-700">
                  {filtered.reduce((s, t) => s + Number(t.part_entreprise), 0).toFixed(2)}€
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Create / Edit modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">
                  {editingTicket ? 'Modifier le Ticket FTTO' : 'Nouveau Ticket FTTO'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5" /> N° Ticket
                  </label>
                  <Input
                    placeholder="ex: TK-2026-001"
                    value={form.num_ticket}
                    onChange={e => setForm(f => ({ ...f, num_ticket: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Date Ticket
                  </label>
                  <Input
                    type="date"
                    value={form.date_ticket}
                    onChange={e => setForm(f => ({ ...f, date_ticket: e.target.value }))}
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1">Code G2R</label>
                  <Input
                    placeholder="ex: G2R-12345"
                    value={form.code_g2r}
                    onChange={e => setForm(f => ({ ...f, code_g2r: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Ville
                  </label>
                  <Input
                    placeholder="ex: Paris"
                    value={form.ville}
                    onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                  />
                </div>
              </div>

              {/* Article */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Code Article (depuis tarifs FTTO)
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.code_article}
                  onChange={e => handleArticleChange(e.target.value)}
                >
                  <option value="">-- Sélectionner un article --</option>
                  {tarifs.map(t => (
                    <option key={t.id} value={t.code_article}>
                      {t.code_article} — {t.designation} ({Number(t.bpu).toFixed(2)}€)
                    </option>
                  ))}
                </select>
              </div>

              {/* Désignation */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1">Désignation</label>
                <Input
                  placeholder="Désignation de l'article"
                  value={form.designation}
                  onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                />
              </div>

              {/* Prix / Qté */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Euro className="w-3.5 h-3.5" /> Prix Unit. H.T.
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prix_unitaire}
                    onChange={e => setForm(f => ({ ...f, prix_unitaire: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1">Quantité</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantite}
                    onChange={e => setForm(f => ({ ...f, quantite: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1">Total H.T.</label>
                  <div className="border rounded-lg px-3 py-2 text-sm bg-gray-50 font-semibold text-blue-700">
                    {totalHt.toFixed(2)}€
                  </div>
                </div>
              </div>

              {/* Répartition preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600 font-medium">Part Technicien (35%)</p>
                  <p className="text-xl font-bold text-green-700">{partTech.toFixed(2)}€</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium">Part Entreprise (65%)</p>
                  <p className="text-xl font-bold text-purple-700">{partEnt.toFixed(2)}€</p>
                </div>
              </div>

              {/* Technicien */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Technicien
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={form.employe_id}
                  onChange={e => setForm(f => ({ ...f, employe_id: e.target.value }))}
                >
                  <option value="">-- Sélectionner un technicien --</option>
                  {employes.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nom} {e.prenom} ({e.matricule})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>Annuler</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><RefreshCw className="w-4 h-4 animate-spin mr-1" />Enregistrement…</>
                  : <><Save className="w-4 h-4 mr-1" />{editingTicket ? 'Mettre à jour' : 'Créer'}</>
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
