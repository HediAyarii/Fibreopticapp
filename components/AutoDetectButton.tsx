'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle, Brain, Eye } from 'lucide-react'

interface AutoDetectResult {
  success: boolean
  message: string
  correspondances?: Array<{
    cout_nom: string
    cout_prenom: string
    int_nom: string
    int_prenom: string
    match_score: number
    match_type: string
  }>
  monitoring?: Array<{
    cout_nom: string
    cout_prenom: string
    int_nom: string
    int_prenom: string
    match_score: number
    match_type: string
    status: string
  }>
  synchronisations?: Array<{
    employe_nom: string
    employe_prenom: string
    ancien_total: number
    nouveau_total: number
    difference: number
    match_type: string
  }>
  total_correspondances?: number
  total_synchronisations?: number
}

export default function AutoDetectButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<AutoDetectResult | null>(null)
  const [activeTab, setActiveTab] = useState<'detect' | 'sync'>('detect')

  const handleAutoDetect = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/sync/auto-detect', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
      setActiveTab('detect')
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur lors de la détection automatique'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoSync = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/sync/auto-detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
      setActiveTab('sync')
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur lors de la synchronisation automatique'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MATCHED': return 'text-green-600 bg-green-50'
      case 'NO_INTERVENTIONS': return 'text-yellow-600 bg-yellow-50'
      case 'NO_COUT_RECORD': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'text-green-600'
      case 'inverse': return 'text-blue-600'
      case 'partial_nom': return 'text-orange-600'
      case 'partial_prenom': return 'text-yellow-600'
      case 'spaces_removed': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleAutoDetect}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          Détecter automatiquement
        </Button>
        
        <Button
          onClick={handleAutoSync}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Synchroniser automatiquement
        </Button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">
              {result.success ? 'Détection automatique réussie' : 'Erreur de détection'}
            </span>
          </div>
          
          <p className="text-sm mb-4">{result.message}</p>
          
          {/* Onglets pour afficher les résultats */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeTab === 'detect' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('detect')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Correspondances ({result.total_correspondances || 0})
            </Button>
            {result.synchronisations && result.synchronisations.length > 0 && (
              <Button
                variant={activeTab === 'sync' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('sync')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Synchronisations ({result.total_synchronisations || 0})
              </Button>
            )}
          </div>
          
          {/* Affichage des correspondances */}
          {activeTab === 'detect' && result.correspondances && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="font-medium text-sm">Correspondances détectées :</h4>
              {result.correspondances.map((corr, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{corr.cout_nom} {corr.cout_prenom}</span>
                      <span className="mx-2">↔</span>
                      <span className="font-medium">{corr.int_nom} {corr.int_prenom}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(corr.match_type)}`}>
                        {corr.match_type}
                      </span>
                      <span className="font-medium">{corr.match_score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Affichage des synchronisations */}
          {activeTab === 'sync' && result.synchronisations && result.synchronisations.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="font-medium text-sm">Synchronisations effectuées :</h4>
              {result.synchronisations.map((sync, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border">
                  <div className="font-medium">
                    {sync.employe_nom} {sync.employe_prenom}
                  </div>
                  <div className="text-gray-600">
                    {sync.ancien_total.toFixed(2)}€ → {sync.nouveau_total.toFixed(2)}€ 
                    ({sync.difference > 0 ? '+' : ''}{sync.difference.toFixed(2)}€)
                  </div>
                  <div className="text-xs text-gray-500">
                    Type: {sync.match_type}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Affichage du monitoring */}
          {result.monitoring && result.monitoring.length > 0 && (
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              <h4 className="font-medium text-sm">Statut des correspondances :</h4>
              {result.monitoring.map((monitor, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{monitor.cout_nom} {monitor.cout_prenom}</span>
                      <span className="mx-2">↔</span>
                      <span className="font-medium">{monitor.int_nom} {monitor.int_prenom}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(monitor.status)}`}>
                        {monitor.status}
                      </span>
                      <span className="font-medium">{monitor.match_score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

