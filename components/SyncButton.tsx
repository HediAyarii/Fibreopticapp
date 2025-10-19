'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface SyncResult {
  success: boolean
  message: string
  synchronisations?: Array<{
    employe_nom: string
    employe_prenom: string
    mois: number
    annee: number
    ancien_total: number
    nouveau_total: number
    difference: number
  }>
  total_synchronisations?: number
}

export default function SyncButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/sync/benefice-brut-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur lors de la synchronisation'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkInconsistencies = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/sync/benefice-brut-smart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur lors de la vérification'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleSync}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Synchroniser les données
        </Button>
        
        <Button
          onClick={checkInconsistencies}
          disabled={isLoading}
          variant="outline"
        >
          Vérifier les incohérences
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
              {result.success ? 'Synchronisation réussie' : 'Erreur de synchronisation'}
            </span>
          </div>
          
          <p className="text-sm mb-2">{result.message}</p>
          
          {result.synchronisations && result.synchronisations.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">
                Détails des synchronisations ({result.total_synchronisations}):
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.synchronisations.map((sync, index) => (
                  <div key={index} className="text-xs bg-white p-2 rounded border">
                    <div className="font-medium">
                      {sync.employe_nom} {sync.employe_prenom} ({sync.mois}/{sync.annee})
                    </div>
                    <div className="text-gray-600">
                      {sync.ancien_total.toFixed(2)}€ → {sync.nouveau_total.toFixed(2)}€ 
                      ({sync.difference > 0 ? '+' : ''}{sync.difference.toFixed(2)}€)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
