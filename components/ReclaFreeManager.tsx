"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Search,
  Euro,
} from "lucide-react"

interface ReclaFree {
  id: number
  type_litige: string
  reference_client: string | null
  agence: string | null
  date: string | null
  region: string | null
  code_postal: string | null
  nature_travaux: string
  nature_travaux_detail: string | null
  commentaire: string | null
  status_ticket: string
  date_retour: string | null
  date_confirmation: string | null
  montant: number
  montant_technicien: number
  montant_entreprise: number
  employe_id: number | null
  employe_nom: string | null
  employe_prenom: string | null
  employe_matricule: string | null
  confirmer: boolean
}

interface Employe {
  id: number
  nom: string
  prenom: string
  matricule: string
}

const NATURE_TRAVAUX_OPTIONS = ["ELEC", "FIBRE", "ADSL", "AUTRE"]
const TYPE_LITIGE_OPTIONS = ["client", "controleur"]
const STATUS_TICKET_OPTIONS = ["clos", "pas_clos"]

const emptyForm = {
  type_litige: "client",
  reference_client: "",
  agence: "",
  date: "",
  region: "",
  code_postal: "",
  nature_travaux: "FIBRE",
  nature_travaux_detail: "",
  commentaire: "",
  status_ticket: "pas_clos",
  date_retour: "",
  montant: "",
  employe_id: "",
  confirmer: false,
}

export function ReclaFreeManager() {
  const [reclaFree, setReclaFree] = useState<ReclaFree[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ReclaFree | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterEmploye, setFilterEmploye] = useState("all")
  const [filterConfirmer, setFilterConfirmer] = useState("all")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rfRes, empRes] = await Promise.all([
        fetch("/api/recla-free"),
        fetch("/api/employes"),
      ])
      const rfData = await rfRes.json()
      const empData = await empRes.json()
      if (rfData.success) setReclaFree(rfData.reclaFree || [])
      if (empData.employes) setEmployes(empData.employes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (rf: ReclaFree) => {
    setEditing(rf)
    setForm({
      type_litige: rf.type_litige || "client",
      reference_client: rf.reference_client || "",
      agence: rf.agence || "",
      date: rf.date ? rf.date.substring(0, 10) : "",
      region: rf.region || "",
      code_postal: rf.code_postal || "",
      nature_travaux: rf.nature_travaux || "FIBRE",
      nature_travaux_detail: rf.nature_travaux_detail || "",
      commentaire: rf.commentaire || "",
      status_ticket: rf.status_ticket || "pas_clos",
      date_retour: rf.date_retour ? rf.date_retour.substring(0, 10) : "",
      montant: rf.montant?.toString() || "",
      employe_id: rf.employe_id?.toString() || "",
      confirmer: rf.confirmer || false,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        montant: parseFloat(form.montant) || 0,
        employe_id: form.employe_id ? parseInt(form.employe_id) : null,
        date: form.date || null,
        date_retour: form.date_retour || null,
      }

      const url = "/api/recla-free"
      const method = editing ? "PUT" : "POST"
      const body = editing ? { id: editing.id, ...payload } : payload

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        fetchData()
      } else {
        alert(data.error || "Erreur lors de la sauvegarde")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recla free ?")) return
    try {
      const res = await fetch(`/api/recla-free?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleConfirmer = async (rf: ReclaFree) => {
    try {
      const res = await fetch("/api/recla-free", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rf.id, confirmer: !rf.confirmer }),
      })
      const data = await res.json()
      if (data.success) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  // Filtrage
  const filtered = reclaFree.filter((rf) => {
    const search = searchTerm.toLowerCase()
    const matchSearch =
      !search ||
      rf.reference_client?.toLowerCase().includes(search) ||
      rf.agence?.toLowerCase().includes(search) ||
      rf.region?.toLowerCase().includes(search) ||
      `${rf.employe_prenom} ${rf.employe_nom}`.toLowerCase().includes(search)
    const matchEmploye =
      filterEmploye === "all" || rf.employe_id?.toString() === filterEmploye
    const matchConfirmer =
      filterConfirmer === "all" ||
      (filterConfirmer === "confirme" && rf.confirmer) ||
      (filterConfirmer === "non_confirme" && !rf.confirmer)
    return matchSearch && matchEmploye && matchConfirmer
  })

  // Totaux
  const totalMontant = filtered.reduce((s, rf) => s + (Number(rf.montant) || 0), 0)
  const totalConfirme = filtered
    .filter((rf) => rf.confirmer)
    .reduce((s, rf) => s + (Number(rf.montant) || 0), 0)
  const totalTechnicien = filtered.filter((rf) => rf.confirmer).reduce((s, rf) => s + (Number(rf.montant_technicien) || 0), 0)
  const totalEntreprise = filtered.filter((rf) => rf.confirmer).reduce((s, rf) => s + (Number(rf.montant_entreprise) || 0), 0)

  const formatMontant = (v: number) =>
    v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"

  const formatDate = (d: string | null) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("fr-FR")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Recla Free</h2>
          <p className="text-muted-foreground">
            Gestion des réclamations facturées aux techniciens
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total recla free</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Euro className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold">{formatMontant(totalMontant)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant confirmé (total)</p>
                <p className="text-2xl font-bold text-green-500">{formatMontant(totalConfirme)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Euro className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Part techniciens (confirmé)</p>
                <p className="text-2xl font-bold text-blue-500">{formatMontant(totalTechnicien)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border border-white/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Euro className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Part entreprise (confirmé)</p>
                <p className="text-2xl font-bold text-purple-500">{formatMontant(totalEntreprise)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="glass-card border border-white/20">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (réf, agence, région, technicien...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-card border border-white/20"
              />
            </div>
            <Select value={filterEmploye} onValueChange={setFilterEmploye}>
              <SelectTrigger className="glass-card border border-white/20">
                <SelectValue placeholder="Tous les techniciens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les techniciens</SelectItem>
                {employes.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.prenom} {e.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterConfirmer} onValueChange={setFilterConfirmer}>
              <SelectTrigger className="glass-card border border-white/20">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="confirme">Confirmés</SelectItem>
                <SelectItem value="non_confirme">Non confirmés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Liste des Recla Free ({filtered.length})
          </CardTitle>
          <CardDescription>
            Les recla free confirmées sont déduites du montant généré du technicien
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucune recla free trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 font-medium text-muted-foreground">Litige</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Réf. Client</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Agence</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Région</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Nature</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Ticket</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Date retour</th>
                    <th className="text-left p-3 font-medium text-green-400">Confirmé le</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Montant total</th>
                    <th className="text-right p-3 font-medium text-blue-400">Part tech.</th>
                    <th className="text-right p-3 font-medium text-purple-400">Part entrep.</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Technicien</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Confirmé</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rf) => (
                    <tr
                      key={rf.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            rf.type_litige === "client"
                              ? "border-blue-500/50 text-blue-400"
                              : "border-orange-500/50 text-orange-400"
                          }
                        >
                          {rf.type_litige === "client" ? "Client" : "Contrôleur"}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-xs">{rf.reference_client || "-"}</td>
                      <td className="p-3">{rf.agence || "-"}</td>
                      <td className="p-3 whitespace-nowrap">{formatDate(rf.date)}</td>
                      <td className="p-3">{rf.region || "-"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {rf.nature_travaux}
                          {rf.nature_travaux === "AUTRE" && rf.nature_travaux_detail
                            ? ` (${rf.nature_travaux_detail})`
                            : ""}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            rf.status_ticket === "clos"
                              ? "border-green-500/50 text-green-400"
                              : "border-yellow-500/50 text-yellow-400"
                          }
                        >
                          {rf.status_ticket === "clos" ? "Clos" : "Pas clos"}
                        </Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap">{formatDate(rf.date_retour)}</td>
                      <td className="p-3 whitespace-nowrap">
                        {rf.date_confirmation
                          ? <span className="text-green-400 font-medium">{formatDate(rf.date_confirmation)}</span>
                          : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatMontant(Number(rf.montant) || 0)}
                      </td>
                      <td className="p-3 text-right font-semibold text-blue-400">
                        {formatMontant(Number(rf.montant_technicien) || 0)}
                      </td>
                      <td className="p-3 text-right font-semibold text-purple-400">
                        {formatMontant(Number(rf.montant_entreprise) || 0)}
                      </td>
                      <td className="p-3">
                        {rf.employe_prenom && rf.employe_nom
                          ? `${rf.employe_prenom} ${rf.employe_nom}`
                          : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleConfirmer(rf)}
                          className="focus:outline-none"
                          title={rf.confirmer ? "Cliquer pour désactiver" : "Cliquer pour confirmer"}
                        >
                          {rf.confirmer ? (
                            <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400/60 mx-auto" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(rf)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(rf.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Formulaire */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier une Recla Free" : "Ajouter une Recla Free"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Type de litige */}
            <div className="space-y-2">
              <Label>Type de litige *</Label>
              <Select
                value={form.type_litige}
                onValueChange={(v) => setForm((f) => ({ ...f, type_litige: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="controleur">Contrôleur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Référence client */}
            <div className="space-y-2">
              <Label>Référence client</Label>
              <Input
                placeholder="Ex: 120038249"
                value={form.reference_client}
                onChange={(e) => setForm((f) => ({ ...f, reference_client: e.target.value }))}
              />
            </div>

            {/* Agence */}
            <div className="space-y-2">
              <Label>Agence</Label>
              <Input
                placeholder="Nom de l'agence"
                value={form.agence}
                onChange={(e) => setForm((f) => ({ ...f, agence: e.target.value }))}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            {/* Région */}
            <div className="space-y-2">
              <Label>Région</Label>
              <Input
                placeholder="Région"
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              />
            </div>

            {/* Code postal */}
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input
                placeholder="Ex: 75001"
                value={form.code_postal}
                onChange={(e) => setForm((f) => ({ ...f, code_postal: e.target.value }))}
              />
            </div>

            {/* Nature des travaux */}
            <div className="space-y-2">
              <Label>Nature des travaux *</Label>
              <Select
                value={form.nature_travaux}
                onValueChange={(v) => setForm((f) => ({ ...f, nature_travaux: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NATURE_TRAVAUX_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Précision si AUTRE */}
            {form.nature_travaux === "AUTRE" && (
              <div className="space-y-2">
                <Label>Précision (nature autre)</Label>
                <Input
                  placeholder="Préciser..."
                  value={form.nature_travaux_detail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nature_travaux_detail: e.target.value }))
                  }
                />
              </div>
            )}

            {/* Status ticket */}
            <div className="space-y-2">
              <Label>Status ticket</Label>
              <Select
                value={form.status_ticket}
                onValueChange={(v) => setForm((f) => ({ ...f, status_ticket: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clos">Clos</SelectItem>
                  <SelectItem value="pas_clos">Pas clos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de retour */}
            <div className="space-y-2">
              <Label>Date de retour</Label>
              <Input
                type="date"
                value={form.date_retour}
                onChange={(e) => setForm((f) => ({ ...f, date_retour: e.target.value }))}
              />
            </div>

            {/* Montant */}
            <div className="space-y-2">
              <Label>Montant (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.montant}
                onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
              />
            </div>

            {/* Technicien */}
            <div className="space-y-2">
              <Label>Technicien</Label>
              <Select
                value={form.employe_id || "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, employe_id: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un technicien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Aucun —</SelectItem>
                  {employes.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.prenom} {e.nom} ({e.matricule})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Commentaire (full width) */}
            <div className="space-y-2 md:col-span-2">
              <Label>Commentaire</Label>
              <Textarea
                placeholder="Commentaire..."
                value={form.commentaire}
                onChange={(e) => setForm((f) => ({ ...f, commentaire: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Confirmé */}
            <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-lg border border-white/20 bg-white/5">
              <Checkbox
                id="confirmer"
                checked={form.confirmer as boolean}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, confirmer: checked === true }))
                }
              />
              <div>
                <Label htmlFor="confirmer" className="cursor-pointer font-semibold">
                  Confirmer cette recla free
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si confirmé, le montant sera déduit du total généré du technicien dans Récap Calcul,
                  Bénéfice Brute, Charges par Salarié et son interface personnelle.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {editing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReclaFreeManager
