'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, UserPlus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface SyncResult {
  total_techniciens: number
  techniciens_existants: number
  techniciens_manquants: number
  employes_crees: number
  erreurs: number
  details: {
    existants: Array<{
      nom: string
      prenom: string
      matricule: string
      interventions: number
      recette: number
    }>
    crees: Array<{
      nom: string
      prenom: string
      matricule: string
      interventions: number
      recette: number
    }>
    erreurs: Array<{
      nom: string
      prenom: string
      erreur: string
    }>
  }
}

export default function EmployeeSyncManager() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    setSyncResult(null)

    try {
      console.log('🔄 Début de la synchronisation...')
      
      const response = await fetch('/api/sync/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        setSyncResult(data.data)
        console.log('✅ Synchronisation réussie:', data.data)
      } else {
        setError(data.error || 'Erreur lors de la synchronisation')
        console.error('❌ Erreur synchronisation:', data.error)
      }
    } catch (err) {
      setError('Erreur de connexion lors de la synchronisation')
      console.error('❌ Erreur générale:', err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Synchronisation Automatique des Employés
          </CardTitle>
          <CardDescription>
            Détecte automatiquement les techniciens dans les interventions et crée les employés manquants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {syncing ? 'Synchronisation en cours...' : 'Synchroniser les Employés'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {syncResult && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Synchronisation terminée avec succès !
                </AlertDescription>
              </Alert>

              {/* Résumé */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {syncResult.total_techniciens}
                  </div>
                  <div className="text-sm text-blue-800">Total Techniciens</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {syncResult.techniciens_existants}
                  </div>
                  <div className="text-sm text-green-800">Déjà Existants</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {syncResult.employes_crees}
                  </div>
                  <div className="text-sm text-orange-800">Employés Créés</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {syncResult.erreurs}
                  </div>
                  <div className="text-sm text-red-800">Erreurs</div>
                </div>
              </div>

              {/* Détails des employés créés */}
              {syncResult.details.crees.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Employés Créés ({syncResult.details.crees.length})
                  </h4>
                  <div className="space-y-2">
                    {syncResult.details.crees.map((employe, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {employe.matricule}
                          </Badge>
                          <span className="font-medium">
                            {employe.nom} {employe.prenom}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {employe.interventions} interventions • {employe.recette.toFixed(2)}€
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Détails des employés existants */}
              {syncResult.details.existants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Employés Existants ({syncResult.details.existants.length})
                  </h4>
                  <div className="space-y-2">
                    {syncResult.details.existants.map((employe, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {employe.matricule}
                          </Badge>
                          <span className="font-medium">
                            {employe.nom} {employe.prenom}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {employe.interventions} interventions • {employe.recette.toFixed(2)}€
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Erreurs */}
              {syncResult.details.erreurs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Erreurs ({syncResult.details.erreurs.length})
                  </h4>
                  <div className="space-y-2">
                    {syncResult.details.erreurs.map((erreur, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {erreur.nom} {erreur.prenom}
                          </span>
                        </div>
                        <div className="text-sm text-red-600">
                          {erreur.erreur}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}






