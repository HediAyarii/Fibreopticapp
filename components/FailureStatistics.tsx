'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingDown, Users, Calendar, BarChart3, PieChart } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface FailureStatisticsProps {
  className?: string
}

interface FailureStats {
  byStatus: Array<{
    statut: string
    count: number
    percentage: number
  }>
  byReason: Array<{
    motif_echec: string
    count: number
    percentage: number
  }>
  byTechnician: Array<{
    nom_technicien: string
    prenom_technicien: string
    total_failures: number
    echec_terminer: number
    with_reason: number
    percentage: number
  }>
  motifsByTechnician: Array<{
    nom_technicien: string
    prenom_technicien: string
    motif_echec: string
    count: number
    percentage_technicien: number
    percentage_total: number
  }>
  byLevel: Array<{
    echec_niveau_1: string
    echec_niveau_2: string
    count: number
    percentage: number
  }>
  temporalEvolution: Array<{
    week: string
    total_failures: number
    echec_terminer: number
    with_reason: number
  }>
  total: number
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280']

export default function FailureStatistics({ className }: FailureStatisticsProps) {
  const [statistics, setStatistics] = useState<FailureStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 3)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [selectedTechnician, setSelectedTechnician] = useState('all')

  const loadStatistics = async () => {
    setLoading(true)
    try {
      console.log('🔄 Chargement des statistiques d\'échec pour la période:', { startDate, endDate, selectedTechnician })
      const response = await fetch(`/api/statistics/failures?startDate=${startDate}&endDate=${endDate}&technicien=${selectedTechnician}`)
      const data = await response.json()
      console.log('📊 Données d\'échec reçues:', data)
      if (data.success) {
        setStatistics(data.statistics.failures)
        console.log('✅ Statistiques d\'échec mises à jour:', data.statistics.failures)
      } else {
        console.error('❌ Erreur API:', data.error)
      }
    } catch (error) {
      console.error('❌ Erreur chargement statistiques d\'échec:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatistics()
  }, [startDate, endDate, selectedTechnician])

  if (!statistics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Chargement des statistiques d'échec...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Contrôles de période et filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Statistiques des Interventions Échouées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="technician">Technicien</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les techniciens</SelectItem>
                  {statistics.byTechnician.map((tech, index) => (
                    <SelectItem key={index} value={`${tech.nom_technicien} ${tech.prenom_technicien}`}>
                      {tech.nom_technicien} {tech.prenom_technicien}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadStatistics} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résumé des échecs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Échecs</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Échec Terminé</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.byStatus.find(s => s.statut === 'ECHEC TERMINER')?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Techniciens</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.byTechnician.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avec Motif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.byTechnician.reduce((sum, tech) => sum + tech.with_reason, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Échecs par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Échecs par Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statistics.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ statut, percentage }) => `${statut}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statistics.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Motifs d'échec */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Motifs d'Échec
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.byReason.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="motif_echec" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des motifs par technicien */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Motifs d'Échec par Technicien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={statistics.motifsByTechnician.slice(0, 20)} 
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="motif_echec" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.nom_technicien} ${data.prenom_technicien} - ${data.motif_echec}`;
                    }
                    return value;
                  }}
                  formatter={(value, name, props) => [
                    value, 
                    'Nombre',
                    `% Technicien: ${props.payload.percentage_technicien}%`
                  ]}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Évolution temporelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Évolution Temporelle des Échecs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statistics.temporalEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_failures" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Total Échecs"
                />
                <Line 
                  type="monotone" 
                  dataKey="echec_terminer" 
                  stroke="#F97316" 
                  strokeWidth={2}
                  name="Échec Terminé"
                />
                <Line 
                  type="monotone" 
                  dataKey="with_reason" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  name="Avec Motif"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des techniciens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Échecs par Technicien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Technicien</th>
                  <th className="text-left p-3">Total Échecs</th>
                  <th className="text-left p-3">Échec Terminé</th>
                  <th className="text-left p-3">Avec Motif</th>
                  <th className="text-left p-3">Pourcentage</th>
                </tr>
              </thead>
              <tbody>
                {statistics.byTechnician.map((tech, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      {tech.nom_technicien} {tech.prenom_technicien}
                    </td>
                    <td className="p-3">
                      <Badge variant="destructive">{tech.total_failures}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{tech.echec_terminer}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{tech.with_reason}</Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-600">{tech.percentage}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tableau détaillé des motifs par technicien */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Motifs d'Échec par Technicien
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Technicien</th>
                  <th className="text-left p-3">Motif d'Échec</th>
                  <th className="text-left p-3">Nombre</th>
                  <th className="text-left p-3">% Technicien</th>
                  <th className="text-left p-3">% Total</th>
                </tr>
              </thead>
              <tbody>
                {statistics.motifsByTechnician.map((motif, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      {motif.nom_technicien} {motif.prenom_technicien}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {motif.motif_echec}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant="destructive">{motif.count}</Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-blue-600 font-medium">{motif.percentage_technicien}%</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-600">{motif.percentage_total}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Niveaux d'échec */}
      {statistics.byLevel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Échecs par Niveau
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statistics.byLevel.map((level, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      Niveau 1: {level.echec_niveau_1 || 'N/A'}
                    </span>
                    <Badge variant="outline">{level.count}</Badge>
                  </div>
                  {level.echec_niveau_2 && (
                    <div className="text-sm text-gray-600">
                      Niveau 2: {level.echec_niveau_2}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {level.percentage}% du total
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
