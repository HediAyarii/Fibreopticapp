"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Fuel, 
  Users, 
  CreditCard, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Play
} from "lucide-react"

export default function CarburantTestPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [fixResults, setFixResults] = useState<any>(null)

  const runTest = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/carburant-test-example')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Erreur lors du test:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeAssignments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/carburant-fix-assignments')
      const data = await response.json()
      setAnalysisResults(data)
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error)
    } finally {
      setLoading(false)
    }
  }

  const fixAssignments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/carburant-fix-assignments', {
        method: 'POST'
      })
      const data = await response.json()
      setFixResults(data)
    } catch (error) {
      console.error('Erreur lors de la correction:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConsumptionByEmployee = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/carburant-consumption-by-employee')
      const data = await response.json()
      setTestResults(data)
    } catch (error) {
      console.error('Erreur lors de la récupération:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="glass-card border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="w-6 h-6" />
              Test du Système de Carburant
            </CardTitle>
            <CardDescription>
              Démonstration du système de traçabilité des cartes carburant avec l'exemple concret
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Exemple Concret */}
        <Card className="glass-card border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Exemple Concret
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 glass-card border border-white/20 rounded-lg">
                <h4 className="font-semibold mb-2">📅 Scénario de Test :</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>01/05/2025 :</strong> Aymen BEN KHALIFA assigné à la carte "12"</div>
                  <div><strong>01/05/2025 :</strong> Transaction de 50€ (Aymen)</div>
                  <div><strong>02/05/2025 :</strong> Transaction de 50€ (Aymen)</div>
                  <div><strong>02/05/2025 midi :</strong> Transfert vers BEN CHEDLI HAMDI</div>
                  <div><strong>02/05/2025 16:14 :</strong> Transaction de 40€ (HAMDI)</div>
                </div>
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <strong>Résultat attendu :</strong> Aymen = 100€, HAMDI = 40€, Total = 140€
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boutons de Test */}
        <Card className="glass-card border border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Tests Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={runTest}
                disabled={loading}
                className="glass-card border border-white/20 hover:bg-white/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Lancer Test
              </Button>
              
              <Button
                onClick={analyzeAssignments}
                disabled={loading}
                className="glass-card border border-white/20 hover:bg-white/10"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyser
              </Button>
              
              <Button
                onClick={fixAssignments}
                disabled={loading}
                className="glass-card border border-white/20 hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Corriger
              </Button>
              
              <Button
                onClick={getConsumptionByEmployee}
                disabled={loading}
                className="glass-card border border-white/20 hover:bg-white/10"
              >
                <Users className="w-4 h-4 mr-2" />
                Consommation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultats du Test */}
        {testResults && (
          <Card className="glass-card border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Résultats du Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                
                {/* Résumé */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{testResults.exemple_concret?.total_transactions || 0}</div>
                    <div className="text-sm text-gray-600">Transactions</div>
                  </div>
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{testResults.exemple_concret?.total_consommation || 0}€</div>
                    <div className="text-sm text-gray-600">Total Consommé</div>
                  </div>
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{testResults.resume?.nombre_employes_impliques || 0}</div>
                    <div className="text-sm text-gray-600">Employés</div>
                  </div>
                </div>

                {/* Vérification */}
                {testResults.resume?.verification && (
                  <div className={`p-4 rounded-lg ${testResults.resume.verification.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {testResults.resume.verification.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-semibold">Vérification du Calcul</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div>Total calculé: <strong>{testResults.resume.verification.total_calcule}€</strong></div>
                      <div>Total attendu: <strong>{testResults.resume.verification.attendu}€</strong></div>
                      <div>Statut: <Badge variant={testResults.resume.verification.correct ? 'default' : 'destructive'}>
                        {testResults.resume.verification.correct ? 'Correct' : 'Incorrect'}
                      </Badge></div>
                    </div>
                  </div>
                )}

                {/* Consommation par Employé */}
                {testResults.consommation_par_employe && testResults.consommation_par_employe.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Consommation par Employé</h4>
                    <div className="space-y-4">
                      {testResults.consommation_par_employe.map((emp: any, index: number) => (
                        <Card key={index} className="glass-card border border-white/20">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-semibold">{emp.employe_prenom} {emp.employe_nom}</div>
                                <div className="text-sm text-gray-600">Matricule: {emp.matricule}</div>
                              </div>
                              <Badge variant="outline" className="glass-card border border-white/20">
                                {emp.total_consomme}€
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-gray-600">Période d'assignation</div>
                                <div className="font-semibold">{emp.periode_assignation}</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Durée</div>
                                <div className="font-semibold">{emp.duree_assignation_jours} jours</div>
                              </div>
                              <div>
                                <div className="text-gray-600">Transactions</div>
                                <div className="font-semibold">{emp.nombre_transactions}</div>
                              </div>
                            </div>

                            {/* Transactions détaillées */}
                            {emp.transactions_detaillees && emp.transactions_detaillees.length > 0 && (
                              <div className="mt-4">
                                <div className="text-sm font-medium mb-2">Transactions détaillées:</div>
                                <div className="space-y-2">
                                  {emp.transactions_detaillees.map((txn: any, txnIndex: number) => (
                                    <div key={txnIndex} className="flex items-center justify-between p-2 glass-card border border-white/20 rounded text-xs">
                                      <div>
                                        <div>{txn.date_livraison} {txn.heure_livraison}</div>
                                        <div className="text-gray-500">{txn.point_acceptation}</div>
                                      </div>
                                      <div className="font-semibold">{txn.montant}€</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historique détaillé */}
                {testResults.historique_detaille && testResults.historique_detaille.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Historique Détaillé</h4>
                    <div className="space-y-2">
                      {testResults.historique_detaille.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 glass-card border border-white/20 rounded">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="glass-card border border-white/20">
                              {item.numero_carte}
                            </Badge>
                            <div>
                              <div className="font-semibold">{item.employe_responsable}</div>
                              <div className="text-sm text-gray-600">{item.date_livraison} {item.heure_livraison}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{item.montant}€</div>
                            <div className="text-xs text-gray-500">{item.point_acceptation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultats de l'Analyse */}
        {analysisResults && (
          <Card className="glass-card border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Analyse des Assignations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysisResults.analysis?.total_transactions || 0}</div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analysisResults.analysis?.correct_assignments || 0}</div>
                    <div className="text-sm text-gray-600">Correctes</div>
                  </div>
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analysisResults.analysis?.incorrect_assignments || 0}</div>
                    <div className="text-sm text-gray-600">Incorrectes</div>
                  </div>
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analysisResults.resume?.pourcentage_correct || 0}%</div>
                    <div className="text-sm text-gray-600">Précision</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultats de la Correction */}
        {fixResults && (
          <Card className="glass-card border border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-600" />
                Correction des Assignations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{fixResults.summary?.transactions_mises_a_jour || 0}</div>
                    <div className="text-sm text-gray-600">Transactions Corrigées</div>
                  </div>
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{fixResults.summary?.total_cartes_affectees || 0}</div>
                    <div className="text-sm text-gray-600">Cartes Affectées</div>
                  </div>
                  <div className="text-center p-4 glass-card border border-white/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{fixResults.summary?.duree_execution_ms || 0}ms</div>
                    <div className="text-sm text-gray-600">Durée</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="glass-card border border-white/20">
            <CardContent className="p-6 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <div>Chargement en cours...</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
