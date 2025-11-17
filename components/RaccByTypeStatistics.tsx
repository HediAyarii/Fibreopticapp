"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Building, Home, Loader2 } from "lucide-react"

interface RaccStats {
  type_logement: string
  grille: string
  total: number
}

export default function RaccByTypeStatistics() {
  const [stats, setStats] = useState<RaccStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadRaccStats()
  }, [])

  const loadRaccStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/statistics/racc-by-type')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des statistiques RACC')
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

  // Éviter l'hydratation mismatch
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  // Transformer les données pour le graphique
  const chartData = () => {
    const grouped: { [key: string]: any } = {}

    stats.forEach(stat => {
      const type = stat.type_logement || 'Non spécifié'
      if (!grouped[type]) {
        grouped[type] = {
          type_logement: type,
          AXECOM: 0,
          ERT: 0,
          total: 0
        }
      }

      if (stat.grille?.includes('AXECOM')) {
        grouped[type].AXECOM += stat.total
      } else if (stat.grille?.includes('ERT')) {
        grouped[type].ERT += stat.total
      }
      
      grouped[type].total += stat.total
    })

    return Object.values(grouped)
  }

  const data = chartData()
  const totalRacc = stats.reduce((sum, stat) => sum + stat.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Chargement des statistiques RACC...</span>
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
                <p className="text-sm text-muted-foreground">Total RACC Clôturés</p>
                <p className="text-2xl font-bold text-primary">{totalRacc}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pavillons</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.find(d => d.type_logement.toLowerCase().includes('pavillon'))?.total || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Home className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Immeubles</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.find(d => d.type_logement.toLowerCase().includes('immeuble'))?.total || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Graphique en barres - MASQUÉ */}
      {/* <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle>Répartition RACC par Type de Logement</CardTitle>
          <CardDescription>
            Comparaison AXECOM vs ERT OUEST pour les RACC clôturés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="type_logement" 
                  className="text-sm"
                />
                <YAxis className="text-sm" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="AXECOM" 
                  fill="#3b82f6" 
                  name="AXECOM MANCHE"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="ERT" 
                  fill="#10b981" 
                  name="ERT OUEST"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée RACC disponible
            </div>
          )}
        </CardContent>
      </Card> */}

      {/* Tableau détaillé - MASQUÉ */}
      {/* <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle>Détails par Type et Grille</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 font-semibold">Type de Logement</th>
                  <th className="text-left p-3 font-semibold">Grille</th>
                  <th className="text-right p-3 font-semibold">Nombre RACC</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {stat.type_logement?.toLowerCase().includes('pavillon') ? (
                          <Home className="w-4 h-4 text-green-600" />
                        ) : (
                          <Building className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="font-medium">{stat.type_logement || 'Non spécifié'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stat.grille?.includes('AXECOM') 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {stat.grille || 'Non spécifié'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-lg">{stat.total}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-primary/5">
                  <td colSpan={2} className="p-3 font-bold">Total</td>
                  <td className="p-3 text-right font-bold text-lg text-primary">{totalRacc}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
