"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3
} from 'lucide-react'

interface KPIData {
  periode: string
  total: number
  succes: number
  echec: number
  annule: number
  en_cours: number
  a_traiter: number
  taux_reussite: number
  taux_conquete: number
  taux_migration: number
  conquete_total: number
  migration_total: number
}

interface Totaux {
  total: number
  succes: number
  echec: number
  annule: number
  en_cours: number
  taux_reussite_global: number
}

export default function KPIProductionSection() {
  const [data, setData] = useState<KPIData[]>([])
  const [totaux, setTotaux] = useState<Totaux | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0])
  const [grille, setGrille] = useState('tout')
  const [typeIntervention, setTypeIntervention] = useState('tout')
  const [technologie, setTechnologie] = useState('tout')
  const [b2b, setB2b] = useState(true)
  const [b2c, setB2c] = useState(true)
  const [groupBy, setGroupBy] = useState('semaine')

  const fetchData = async () => {
    setLoading(true)
    try {
      // Déterminer le périmètre
      let perimetre = 'tout'
      if (b2b && !b2c) perimetre = 'b2b'
      else if (!b2b && b2c) perimetre = 'b2c'

      const params = new URLSearchParams({
        date_debut: dateDebut,
        date_fin: dateFin,
        grille,
        type: typeIntervention,
        technologie,
        perimetre,
        group_by: groupBy
      })

      const response = await fetch(`/api/kpi-production?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        setTotaux(result.totaux)
      }
    } catch (error) {
      console.error('Erreur chargement KPI:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApplyFilters = () => {
    fetchData()
  }

  // Formater les nombres
  const formatNumber = (num: number | null | undefined) => {
    if (num == null) return '0'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Couleurs
  const colors = {
    succes: '#22c55e',
    echec: '#ef4444',
    annule: '#f97316',
    en_cours: '#3b82f6',
    a_traiter: '#8b5cf6',
    conquete: '#3b82f6',  // Bleu pour Conquête
    migration: '#ef4444', // Rouge pour Migration
    global: '#6b7280'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" />
            KPI Production
          </h2>
          <p className="text-muted-foreground">
            Taux de Réalisé sur Planifié - Calculé au RDV
          </p>
        </div>
        <Button onClick={handleApplyFilters} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Date début */}
            <div className="space-y-2">
              <Label>Date début</Label>
              <Input 
                type="date" 
                value={dateDebut} 
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            {/* Date fin */}
            <div className="space-y-2">
              <Label>Date fin</Label>
              <Input 
                type="date" 
                value={dateFin} 
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>

            {/* Grille */}
            <div className="space-y-2">
              <Label>Grille</Label>
              <Select value={grille} onValueChange={setGrille}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tout">Toutes</SelectItem>
                  <SelectItem value="axecom">AXECOM</SelectItem>
                  <SelectItem value="ert">ERT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeIntervention} onValueChange={setTypeIntervention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tout">Tout</SelectItem>
                  <SelectItem value="racc">RACC</SelectItem>
                  <SelectItem value="sav">SAV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Technologie */}
            <div className="space-y-2">
              <Label>Technologie</Label>
              <Select value={technologie} onValueChange={setTechnologie}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tout">Tout</SelectItem>
                  <SelectItem value="ftth">FTTH</SelectItem>
                  <SelectItem value="fttb">FTTB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Périmètre B2B/B2C */}
            <div className="space-y-2">
              <Label>Périmètre</Label>
              <div className="flex items-center gap-4 h-10">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="b2b" 
                    checked={b2b} 
                    onCheckedChange={(checked) => setB2b(!!checked)}
                  />
                  <label htmlFor="b2b" className="text-sm">B2B</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="b2c" 
                    checked={b2c} 
                    onCheckedChange={(checked) => setB2c(!!checked)}
                  />
                  <label htmlFor="b2c" className="text-sm">B2C</label>
                </div>
              </div>
            </div>

            {/* Groupement */}
            <div className="space-y-2">
              <Label>Grouper par</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleApplyFilters}>
              Appliquer les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Summary */}
      {totaux && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{formatNumber(totaux.total)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Succès</p>
                  <p className="text-2xl font-bold text-green-700">{formatNumber(totaux.succes)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Échec</p>
                  <p className="text-2xl font-bold text-red-700">{formatNumber(totaux.echec)}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Annulé</p>
                  <p className="text-2xl font-bold text-orange-700">{formatNumber(totaux.annule)}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Taux Global</p>
                  <p className="text-2xl font-bold text-blue-700">{totaux.taux_reussite_global}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphique Courbes - Taux de réussite */}
      <Card>
        <CardHeader>
          <CardTitle>Taux de Réalisé sur Planifié - Calculé au RDV</CardTitle>
          <CardDescription>
            Évolution du taux de clôture Conquête vs Migration
          </CardDescription>
          <div className="flex gap-4 mt-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              Conquête
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              Migration
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
              <div className="w-3 h-3 rounded-full bg-gray-500 mr-2" />
              Global
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="periode" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const labels: any = {
                      taux_conquete: 'Conquête',
                      taux_migration: 'Migration',
                      taux_reussite: 'Global'
                    }
                    return [`${value}%`, labels[name] || name]
                  }}
                  labelFormatter={(label) => `Période: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="taux_conquete" 
                  name="Conquête"
                  stroke={colors.conquete} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="taux_migration" 
                  name="Migration"
                  stroke={colors.migration} 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="taux_reussite" 
                  name="Global"
                  stroke={colors.global} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Graphique Barres Empilées - Volume par statut */}
      <Card>
        <CardHeader>
          <CardTitle>Volume d'Interventions par Statut</CardTitle>
          <CardDescription>
            Répartition des interventions par période et par statut
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              Succès
            </Badge>
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
              Échec
            </Badge>
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              Annulé
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              En cours
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
              À traiter
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="periode" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const labels: any = {
                      succes: 'Succès',
                      echec: 'Échec',
                      annule: 'Annulé',
                      en_cours: 'En cours',
                      a_traiter: 'À traiter'
                    }
                    return [value, labels[name] || name]
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: any = {
                      succes: 'Succès',
                      echec: 'Échec',
                      annule: 'Annulé',
                      en_cours: 'En cours',
                      a_traiter: 'À traiter'
                    }
                    return labels[value] || value
                  }}
                />
                <Bar dataKey="succes" stackId="a" fill={colors.succes} />
                <Bar dataKey="echec" stackId="a" fill={colors.echec} />
                <Bar dataKey="annule" stackId="a" fill={colors.annule} />
                <Bar dataKey="en_cours" stackId="a" fill={colors.en_cours} />
                <Bar dataKey="a_traiter" stackId="a" fill={colors.a_traiter} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tableau récapitulatif */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par Période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Période</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2 text-green-600">Succès</th>
                  <th className="text-right p-2 text-red-600">Échec</th>
                  <th className="text-right p-2 text-orange-600">Annulé</th>
                  <th className="text-right p-2 text-blue-600">En cours</th>
                  <th className="text-right p-2 font-semibold">Taux</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{row.periode}</td>
                    <td className="text-right p-2">{row.total}</td>
                    <td className="text-right p-2 text-green-600">{row.succes}</td>
                    <td className="text-right p-2 text-red-600">{row.echec}</td>
                    <td className="text-right p-2 text-orange-600">{row.annule}</td>
                    <td className="text-right p-2 text-blue-600">{row.en_cours}</td>
                    <td className="text-right p-2">
                      <Badge variant={row.taux_reussite >= 75 ? 'default' : row.taux_reussite >= 60 ? 'secondary' : 'destructive'}>
                        {row.taux_reussite}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
