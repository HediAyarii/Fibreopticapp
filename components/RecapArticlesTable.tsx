"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Package, 
  Calendar, 
  RefreshCw, 
  Filter, 
  Download,
  BarChart3,
  TrendingUp,
  X,
  Eye,
  User,
  MapPin
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ArticleData {
  code_article: string
  nb_interventions: number
  quantite_totale: number
}

interface InterventionDetail {
  id: number
  nd: string
  date: string
  technicien: string
  adresse: string
  type_intervention: string
  quantite: number
  statut: string
}

interface RecapArticlesData {
  articlesByGrille: {
    AXECOM: ArticleData[]
    ERT: ArticleData[]
  }
  totals: {
    AXECOM: { quantite: number; interventions: number }
    ERT: { quantite: number; interventions: number }
  }
  filters: {
    startDate: string
    endDate: string
    grille: string
  }
}

export default function RecapArticlesTable() {
  // Dates par défaut : mois courant
  const getDefaultDates = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const defaultDates = getDefaultDates()
  const [startDate, setStartDate] = useState(defaultDates.start)
  const [endDate, setEndDate] = useState(defaultDates.end)
  const [selectedGrille, setSelectedGrille] = useState('tout')
  const [data, setData] = useState<RecapArticlesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // État pour le modal détails
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<{ code: string; grille: string } | null>(null)
  const [interventionDetails, setInterventionDetails] = useState<InterventionDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        grille: selectedGrille
      })

      const response = await fetch(`/api/recap-articles?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erreur lors du chargement des données')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedGrille])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchArticleDetails = async (codeArticle: string, grille: string) => {
    setLoadingDetails(true)
    setSelectedArticle({ code: codeArticle, grille })
    setDetailsModalOpen(true)
    
    try {
      const params = new URLSearchParams({
        codeArticle,
        startDate,
        endDate,
        grille
      })

      const response = await fetch(`/api/recap-articles/details?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setInterventionDetails(result.data)
      } else {
        setInterventionDetails([])
      }
    } catch (err) {
      setInterventionDetails([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const clearFilters = () => {
    const defaultDates = getDefaultDates()
    setStartDate(defaultDates.start)
    setEndDate(defaultDates.end)
    setSelectedGrille('tout')
  }

  const exportToCSV = () => {
    if (!data) return

    let csvContent = "Grille,Code Article,Nb Interventions,Quantité Totale\n"

    // AXECOM
    data.articlesByGrille.AXECOM.forEach(article => {
      csvContent += `AXECOM,${article.code_article},${article.nb_interventions},${article.quantite_totale}\n`
    })

    // ERT
    data.articlesByGrille.ERT.forEach(article => {
      csvContent += `ERT,${article.code_article},${article.nb_interventions},${article.quantite_totale}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `recap_articles_${startDate}_${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTotalArticles = () => {
    if (!data) return { axecom: 0, ert: 0, total: 0 }
    return {
      axecom: data.totals.AXECOM.quantite,
      ert: data.totals.ERT.quantite,
      total: data.totals.AXECOM.quantite + data.totals.ERT.quantite
    }
  }

  const getTotalInterventions = () => {
    if (!data) return { axecom: 0, ert: 0, total: 0 }
    return {
      axecom: data.totals.AXECOM.interventions,
      ert: data.totals.ERT.interventions,
      total: data.totals.AXECOM.interventions + data.totals.ERT.interventions
    }
  }

  const renderArticleTable = (articles: ArticleData[], grille: 'AXECOM' | 'ERT') => {
    const colorClass = grille === 'AXECOM' ? 'blue' : 'green'
    const total = articles.reduce((sum, a) => sum + a.quantite_totale, 0)

    return (
      <Card className="glass-card border border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`bg-${colorClass}-500/20 text-${colorClass}-400`}>
                {grille}
              </Badge>
              <span className="text-lg">{articles.length} articles différents</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: <span className={`font-bold text-${colorClass}-500`}>{total}</span> unités
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun article pour cette période
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 font-semibold">Code Article</th>
                    <th className="text-right p-3 font-semibold">Interventions</th>
                    <th className="text-right p-3 font-semibold">Quantité</th>
                    <th className="text-right p-3 font-semibold">% du Total</th>
                    <th className="text-center p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article, index) => {
                    const percentage = total > 0 ? ((article.quantite_totale / total) * 100).toFixed(1) : '0'
                    return (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Package className={`w-4 h-4 text-${colorClass}-500`} />
                            <span className="font-mono font-semibold">{article.code_article}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-sm text-muted-foreground">
                            {article.nb_interventions}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={`font-bold text-${colorClass}-500`}>
                            {article.quantite_totale}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 bg-white/10 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full bg-${colorClass}-500 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchArticleDetails(article.code_article, grille)}
                            className={`hover:bg-${colorClass}-500/20`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Détails
                          </Button>
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
    )
  }

  return (
    <Card className="glass-card border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          Récap Articles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtres */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Date début</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label>Date fin</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label>Grille</Label>
            <Select value={selectedGrille} onValueChange={setSelectedGrille}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Toutes les grilles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tout">Toutes</SelectItem>
                <SelectItem value="axecom">AXECOM</SelectItem>
                <SelectItem value="ert">ERT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={clearFilters} variant="ghost" size="sm">
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
          <Button onClick={exportToCSV} disabled={!data} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        {/* Badges de filtre actifs */}
        {(startDate || endDate || selectedGrille !== 'tout') && (
          <div className="flex flex-wrap gap-2">
            {startDate && endDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {startDate} au {endDate}
              </Badge>
            )}
            {selectedGrille !== 'tout' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Grille: {selectedGrille.toUpperCase()}
              </Badge>
            )}
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {/* Stats Cards */}
        {data && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="glass-card border border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Package className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Articles</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {getTotalArticles().total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">AXECOM</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {getTotalArticles().axecom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTotalInterventions().axecom} interventions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ERT</p>
                      <p className="text-2xl font-bold text-green-500">
                        {getTotalArticles().ert}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTotalInterventions().ert} interventions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Interventions</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {getTotalInterventions().total}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tables par grille */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(selectedGrille === 'tout' || selectedGrille === 'axecom') && 
                renderArticleTable(data.articlesByGrille.AXECOM, 'AXECOM')
              }
              {(selectedGrille === 'tout' || selectedGrille === 'ert') && 
                renderArticleTable(data.articlesByGrille.ERT, 'ERT')
              }
            </div>
          </>
        )}

        {/* Modal Détails Interventions */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="!max-w-[95vw] w-[95vw] max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <Package className="w-5 h-5 text-purple-500" />
                <span>Détails de l'article:</span>
                <span className="font-mono text-purple-500">{selectedArticle?.code}</span>
                <Badge className={selectedArticle?.grille === 'AXECOM' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}>
                  {selectedArticle?.grille}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : !interventionDetails || interventionDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune intervention trouvée pour cet article
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {interventionDetails.length} intervention(s) trouvée(s) entre le {startDate} et le {endDate}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b border-white/10">
                          <th className="text-left p-2 font-semibold">Num Inter</th>
                          <th className="text-left p-2 font-semibold">Date</th>
                          <th className="text-left p-2 font-semibold">ND</th>
                          <th className="text-left p-2 font-semibold">Technicien</th>
                          <th className="text-left p-2 font-semibold">Statut</th>
                          <th className="text-left p-2 font-semibold">Type</th>
                          <th className="text-left p-2 font-semibold">Adresse</th>
                          <th className="text-right p-2 font-semibold">Qté</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interventionDetails.map((intervention, index) => (
                          <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-2 font-mono text-xs text-blue-400">{intervention.id}</td>
                            <td className="p-2 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span>{intervention.date}</span>
                              </div>
                            </td>
                            <td className="p-2 font-mono text-xs">{intervention.nd}</td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate max-w-[120px]" title={intervention.technicien}>{intervention.technicien}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <Badge className={intervention.statut === 'CLOTURE TERMINEE' ? 'bg-green-500/20 text-green-400 text-xs' : 'bg-yellow-500/20 text-yellow-400 text-xs'}>
                                {intervention.statut}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline" className="text-xs">{intervention.type_intervention}</Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1 max-w-[200px]">
                                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate" title={intervention.adresse}>{intervention.adresse}</span>
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <span className="font-bold text-purple-500">{intervention.quantite}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
