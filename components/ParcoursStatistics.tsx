"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ParcoursStats {
  parcours_type: string
  grille: string
  statut: string
  total: number
}

const COLORS = {
  'AXECOM_cloture': '#3b82f6',
  'AXECOM_echec': '#ef4444',
  'ERT_cloture': '#10b981',
  'ERT_echec': '#f59e0b'
}

// Fonction de formatage des nombres
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// Tooltip personnalisé
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ParcoursStatistics() {
  const [stats, setStats] = useState<ParcoursStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadParcoursStats()
  }, [])

  const loadParcoursStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/statistics/parcours-type')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques de parcours')
      }

      const data = await response.json()
      setStats(data.stats || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  // Transformer les données pour le graphique en barres groupées
  const chartData = () => {
    const grouped: { [key: string]: any } = {}

    stats.forEach(stat => {
      const parcours = stat.parcours_type || 'Non spécifié'
      if (!grouped[parcours]) {
        grouped[parcours] = {
          parcours_type: parcours,
          AXECOM_cloture: 0,
          AXECOM_echec: 0,
          ERT_cloture: 0,
          ERT_echec: 0
        }
      }

      const isAxecom = stat.grille?.includes('AXECOM')
      const isCloture = stat.statut === 'cloture'

      if (isAxecom && isCloture) {
        grouped[parcours].AXECOM_cloture += stat.total
      } else if (isAxecom && !isCloture) {
        grouped[parcours].AXECOM_echec += stat.total
      } else if (!isAxecom && isCloture) {
        grouped[parcours].ERT_cloture += stat.total
      } else {
        grouped[parcours].ERT_echec += stat.total
      }
    })

    return Object.values(grouped)
  }

  // Données pour les camemberts
  const getPieData = (grille: 'AXECOM' | 'ERT') => {
    const filtered = stats.filter(s => 
      grille === 'AXECOM' 
        ? s.grille?.includes('AXECOM')
        : !s.grille?.includes('AXECOM')
    )

    const pieData: { [key: string]: any } = {}
    filtered.forEach(stat => {
      const parcours = stat.parcours_type || 'Non spécifié'
      if (!pieData[parcours]) {
        pieData[parcours] = {
          name: parcours,
          cloture: 0,
          echec: 0,
          total: 0
        }
      }

      if (stat.statut === 'cloture') {
        pieData[parcours].cloture += stat.total
      } else {
        pieData[parcours].echec += stat.total
      }
      pieData[parcours].total += stat.total
    })

    return Object.values(pieData)
  }

  const data = chartData()
  const totalInterventions = stats.reduce((sum, stat) => sum + stat.total, 0)
  const totalClotures = stats.filter(s => s.statut === 'cloture').reduce((sum, stat) => sum + stat.total, 0)
  const totalEchecs = stats.filter(s => s.statut === 'echec').reduce((sum, stat) => sum + stat.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des statistiques de parcours...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-destructive">Erreur: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cartes récapitulatives - MASQUÉES */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Interventions</p>
                <p className="text-2xl font-bold text-primary">{formatNumber(totalInterventions)}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clôturés</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(totalClotures)}</p>
                <p className="text-xs text-muted-foreground">
                  {totalInterventions > 0 ? ((totalClotures / totalInterventions) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(totalEchecs)}</p>
                <p className="text-xs text-muted-foreground">
                  {totalInterventions > 0 ? ((totalEchecs / totalInterventions) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Graphique en barres groupées */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle>Répartition par Type de Parcours</CardTitle>
          <CardDescription>
            Conquête vs Migration - Comparaison AXECOM et ERT (Clôtures et Échecs)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="parcours_type" 
                  className="text-sm"
                />
                <YAxis className="text-sm" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="AXECOM_cloture" 
                  fill="#3b82f6" 
                  name="AXECOM Clôturé"
                  radius={[8, 8, 0, 0]}
                  stackId="AXECOM"
                />
                <Bar 
                  dataKey="AXECOM_echec" 
                  fill="#ef4444" 
                  name="AXECOM Échec"
                  radius={[8, 8, 0, 0]}
                  stackId="AXECOM"
                />
                <Bar 
                  dataKey="ERT_cloture" 
                  fill="#10b981" 
                  name="ERT Clôturé"
                  radius={[8, 8, 0, 0]}
                  stackId="ERT"
                />
                <Bar 
                  dataKey="ERT_echec" 
                  fill="#f59e0b" 
                  name="ERT Échec"
                  radius={[8, 8, 0, 0]}
                  stackId="ERT"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée de parcours disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
