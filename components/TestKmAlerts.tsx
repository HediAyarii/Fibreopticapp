"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface TestKmAlertsProps {
  assignationId: number
  vehiculeId: number
}

export function TestKmAlerts({ assignationId, vehiculeId }: TestKmAlertsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<string>("")

  // Calculer la date de test selon le scénario
  const getTestDate = (scenario: string): Date => {
    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Dernier jour du mois actuel
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    
    switch(scenario) {
      case 'J-3':
        return new Date(currentYear, currentMonth, lastDayOfMonth - 3)
      case 'J-2':
        return new Date(currentYear, currentMonth, lastDayOfMonth - 2)
      case 'J-1':
        return new Date(currentYear, currentMonth, lastDayOfMonth - 1)
      case 'JOUR_J':
        return new Date(currentYear, currentMonth, lastDayOfMonth)
      case 'J+1':
        return new Date(currentYear, currentMonth + 1, 1) // 1er du mois suivant
      case 'J+2':
        return new Date(currentYear, currentMonth + 1, 2)
      case 'J+3':
        return new Date(currentYear, currentMonth + 1, 3)
      case 'J+4':
        return new Date(currentYear, currentMonth + 1, 4) // Devrait bloquer
      default:
        return now
    }
  }

  const testScenario = async (scenario: string) => {
    setLoading(true)
    setTestResult("")
    
    try {
      const testDate = getTestDate(scenario)
      const response = await fetch('/api/test-km-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignationId,
          vehiculeId,
          testDate: testDate.toISOString(),
          scenario
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setTestResult(`✅ ${scenario}: ${data.message} - Statut: ${data.statut_km}`)
      } else {
        setTestResult(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      setTestResult(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const scenarios = [
    { key: 'J-3', label: 'J-3', description: '3 jours avant fin mois', color: 'bg-yellow-500/20 text-yellow-400' },
    { key: 'J-2', label: 'J-2', description: '2 jours avant fin mois', color: 'bg-yellow-500/20 text-yellow-400' },
    { key: 'J-1', label: 'J-1', description: '1 jour avant fin mois', color: 'bg-orange-500/20 text-orange-400' },
    { key: 'JOUR_J', label: 'Jour J', description: 'Dernier jour du mois', color: 'bg-red-500/20 text-red-400' },
    { key: 'J+1', label: 'J+1', description: '1er jour de grâce', color: 'bg-orange-500/20 text-orange-400' },
    { key: 'J+2', label: 'J+2', description: '2ème jour de grâce', color: 'bg-orange-500/20 text-orange-400' },
    { key: 'J+3', label: 'J+3', description: 'Dernier jour de grâce', color: 'bg-red-500/20 text-red-400' },
    { key: 'J+4', label: 'J+4 (BLOCAGE)', description: 'Blocage automatique', color: 'bg-red-500/30 text-red-300' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Tester Alertes KM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test des Alertes de Kilométrage</DialogTitle>
        </DialogHeader>
        
        <Card className="bg-muted/50 border-0">
          <CardHeader>
            <CardDescription>
              Simule différents scénarios de dates pour tester les alertes de mise à jour de kilométrage.
              <br />
              <strong>Important:</strong> Le technicien doit mettre à jour le KM uniquement le dernier jour de l'assignation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Légende */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
              <div className="font-semibold text-blue-400 mb-2">📅 Calendrier des Alertes</div>
              <ul className="space-y-1 text-xs text-blue-300">
                <li>• <strong>J-3 à J-1:</strong> Alertes préventives (rappels)</li>
                <li>• <strong>Jour J:</strong> Dernier jour pour mise à jour (alerte critique)</li>
                <li>• <strong>J+1 à J+3:</strong> Période de grâce (alertes intensifiées)</li>
                <li>• <strong>J+4:</strong> Blocage automatique du technicien</li>
              </ul>
            </div>

            {/* Grid de scénarios */}
            <div className="grid grid-cols-2 gap-3">
              {scenarios.map((scenario) => (
                <div key={scenario.key} className={`p-3 rounded-lg ${scenario.color} border border-current/20`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {scenario.label}
                    </Badge>
                    {scenario.key.includes('+') && (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    {scenario.key === 'JOUR_J' && (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-xs mb-2">{scenario.description}</div>
                  <div className="text-xs font-mono mb-2 opacity-70">
                    {getTestDate(scenario.key).toLocaleDateString('fr-FR')}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => testScenario(scenario.key)}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Test...' : 'Tester'}
                  </Button>
                </div>
              ))}
            </div>

            {/* Résultat du test */}
            {testResult && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="text-sm font-mono whitespace-pre-wrap">{testResult}</div>
              </div>
            )}

            {/* Info importante */}
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                <div className="text-orange-300">
                  <strong>Note:</strong> En production, ces alertes seront envoyées automatiquement par un cron job quotidien.
                  Ce bouton sert uniquement pour tester les différents scénarios.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
