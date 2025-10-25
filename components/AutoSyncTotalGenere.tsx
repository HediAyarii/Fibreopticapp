'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface SyncResult {
  success: boolean
  message: string
  total_employees?: number
  updated?: number
  skipped?: number
  updates?: Array<{
    employe: string
    periode: string
    ancien_total: number
    nouveau_total: number
    difference: number
  }>
  incoherences?: Array<{
    employe: string
    periode: string
    total_stocke: number
    total_calcule: number
    difference: number
  }>
}

export default function AutoSyncTotalGenere() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [lastAction, setLastAction] = useState<string>('')

  const checkIncoherences = async () => {
    setChecking(true)
    setLastAction('Vérification des incohérences...')
    
    try {
      const response = await fetch('/api/sync/total-genere', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
        setLastAction(`Vérification terminée: ${data.total_employees} incohérences détectées`)
      } else {
        setLastAction('Erreur lors de la vérification')
      }
    } catch (error) {
      console.error('Erreur vérification incohérences:', error)
      setLastAction(`Erreur lors de la vérification: ${error.message}`)
    } finally {
      setChecking(false)
    }
  }

  const syncAllTotalGenere = async () => {
    setLoading(true)
    setLastAction('Synchronisation automatique en cours...')
    
    try {
      const response = await fetch('/api/sync/total-genere', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data)
        setLastAction(`Synchronisation terminée: ${data.updated} employés mis à jour, ${data.skipped} déjà à jour`)
      } else {
        setLastAction('Erreur lors de la synchronisation')
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error)
      setLastAction(`Erreur lors de la synchronisation: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center gap-3 mb-4">
        <RefreshCw className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Synchronisation Automatique du Total Généré
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Synchronise automatiquement le Total Généré de tous les employés avec les interventions réelles.
        Plus besoin d'appuyer sur le bouton sync manuellement !
      </p>

      <div className="flex gap-3 mb-4">
        <Button
          onClick={checkIncoherences}
          disabled={checking || loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {checking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          Vérifier les incohérences
        </Button>

        <Button
          onClick={syncAllTotalGenere}
          disabled={loading || checking}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Synchroniser automatiquement
        </Button>
      </div>

      {lastAction && (
        <div className="text-sm text-gray-600 mb-4">
          {lastAction}
        </div>
      )}

      {result && result.incoherences && result.incoherences.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {result.total_employees} incohérences détectées
            </span>
          </div>
          <div className="text-sm text-yellow-700">
            Les employés suivants ont des différences entre le Total Généré stocké et calculé :
          </div>
          <div className="mt-2 max-h-40 overflow-y-auto">
            {result.incoherences.slice(0, 10).map((inc, index) => (
              <div key={index} className="text-xs text-yellow-600 py-1">
                • {inc.employe} ({inc.periode}): {inc.total_stocke}€ → {inc.total_calcule}€ (diff: {inc.difference.toFixed(2)}€)
              </div>
            ))}
            {result.incoherences.length > 10 && (
              <div className="text-xs text-yellow-600 py-1">
                ... et {result.incoherences.length - 10} autres
              </div>
            )}
          </div>
        </div>
      )}

      {result && result.success && result.updated !== undefined && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-800">
              Synchronisation réussie !
            </span>
          </div>
          <div className="text-sm text-green-700">
            <div>• Employés traités: {result.total_employees}</div>
            <div>• Mis à jour: {result.updated}</div>
            <div>• Déjà à jour: {result.skipped}</div>
          </div>
          
          {result.updates && result.updates.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-green-800 mb-2">
                Détails des mises à jour :
              </div>
              <div className="max-h-40 overflow-y-auto">
                {result.updates.slice(0, 10).map((update, index) => (
                  <div key={index} className="text-xs text-green-600 py-1">
                    • {update.employe} ({update.periode}): {update.ancien_total}€ → {update.nouveau_total}€ (+{update.difference.toFixed(2)}€)
                  </div>
                ))}
                {result.updates.length > 10 && (
                  <div className="text-xs text-green-600 py-1">
                    ... et {result.updates.length - 10} autres mises à jour
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

