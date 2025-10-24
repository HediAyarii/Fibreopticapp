import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, Loader2, Calculator, RefreshCw } from 'lucide-react'

interface RapStatus {
  total: number
  cohérents: number
  incohérents: number
  details: Array<{
    id: number
    nom: string
    prenom: string
    rap_actuel: number | null
    rap_calcule: number | null
    difference: number | null
    est_coherent: boolean
  }>
}

const RapAutoCorrectButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<RapStatus | null>(null)
  const [lastAction, setLastAction] = useState<string>('')

  const checkRapCoherence = async () => {
    setChecking(true)
    setLastAction('Vérification en cours...')
    
    try {
      // Utiliser GET pour la vérification
      const response = await fetch('/api/rap/auto-correct', {
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
        setStatus(data)
        setLastAction(`Vérification terminée: ${data.cohérents}/${data.total} RAP cohérents`)
      } else {
        setLastAction('Erreur lors de la vérification')
      }
    } catch (error) {
      console.error('Erreur vérification RAP:', error)
      setLastAction(`Erreur lors de la vérification: ${error.message}`)
    } finally {
      setChecking(false)
    }
  }

  const correctAllRap = async () => {
    setLoading(true)
    setLastAction('Correction en cours...')
    
    try {
      const response = await fetch('/api/rap/auto-correct', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus(prev => prev ? {
          ...prev,
          cohérents: prev.total,
          incohérents: 0,
          details: prev.details.map(detail => ({
            ...detail,
            est_coherent: true,
            rap_actuel: detail.rap_calcule,
            difference: 0
          }))
        } : null)
        
        setLastAction(data.message)
        
        // Recharger la page pour mettre à jour l'affichage
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setLastAction('Erreur lors de la correction')
      }
    } catch (error) {
      console.error('Erreur correction RAP:', error)
      setLastAction('Erreur lors de la correction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Correction automatique des RAP
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Système intelligent de vérification et correction des calculs RAP
          </p>
        </div>
        
        {status && (
          <div className="flex items-center gap-2">
            {status.incohérents === 0 ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Tous cohérents</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{status.incohérents} incohérents</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <Button
          onClick={checkRapCoherence}
          disabled={checking || loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {checking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Vérifier la cohérence
        </Button>

        {status && status.incohérents > 0 && (
          <Button
            onClick={correctAllRap}
            disabled={loading || checking}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Corriger tous les RAP ({status.incohérents})
          </Button>
        )}
      </div>

      {lastAction && (
        <div className="text-sm text-gray-600 mb-4">
          {lastAction}
        </div>
      )}

      {status && status.incohérents > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-800 mb-2">
            RAP incohérents détectés :
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {status.details
              .filter(detail => !detail.est_coherent)
              .map((detail, index) => (
                <div key={index} className="text-sm text-orange-700">
                  <span className="font-medium">{detail.nom} {detail.prenom}</span>
                  <span className="ml-2">
                    : {detail.rap_actuel?.toFixed(2) || '0.00'}€ → {detail.rap_calcule?.toFixed(2) || '0.00'}€
                    <span className="text-orange-600 ml-1">
                      (diff: {detail.difference?.toFixed(2) || '0.00'}€)
                    </span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {status && status.incohérents === 0 && status.total > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">
              Tous les RAP sont cohérents ({status.total} enregistrements)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RapAutoCorrectButton
