"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Gauge, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TechVehiculeKilometrageProps {
  employeId: number
}

export function TechVehiculeKilometrage({ employeId }: TechVehiculeKilometrageProps) {
  const [assignation, setAssignation] = useState<any>(null)
  const [kilometrage, setKilometrage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadAssignation()
  }, [employeId])

  const loadAssignation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tech/vehicule-kilometrage?employe_id=${employeId}`)
      const data = await response.json()

      if (data.success && data.assignation) {
        setAssignation(data.assignation)
        // Initialiser avec le kilométrage actuel du véhicule
        setKilometrage(data.assignation.kilometrage_actuel_vehicule?.toString() || '')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'assignation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKilometrage = async () => {
    if (!kilometrage || parseInt(kilometrage) < 0) {
      setMessage({ type: 'error', text: 'Veuillez entrer un kilométrage valide' })
      return
    }

    // Vérifier que le nouveau kilométrage est >= kilometrage_debut si défini
    if (assignation.kilometrage_debut && parseInt(kilometrage) < assignation.kilometrage_debut) {
      setMessage({ 
        type: 'error', 
        text: `Le kilométrage ne peut pas être inférieur au kilométrage de début (${assignation.kilometrage_debut} km)` 
      })
      return
    }

    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/tech/vehicule-kilometrage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignation_id: assignation.id,
          kilometrage: parseInt(kilometrage),
          employe_id: employeId
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Kilométrage mis à jour avec succès!' })
        await loadAssignation() // Recharger pour avoir les données à jour
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    )
  }

  if (!assignation) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucun véhicule assigné</h3>
          <p className="text-muted-foreground">Vous n'avez pas de véhicule assigné actuellement</p>
        </CardContent>
      </Card>
    )
  }

  const kmParcourus = assignation.kilometrage_debut 
    ? parseInt(kilometrage || '0') - assignation.kilometrage_debut 
    : 0

  return (
    <Card className="glass-card border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Car className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <CardTitle>Mon Véhicule</CardTitle>
            <CardDescription>
              {assignation.marque} {assignation.modele} - {assignation.matricule}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informations du véhicule */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Date d'assignation</Label>
            <p className="font-semibold">
              {new Date(assignation.date_assignation).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {assignation.kilometrage_debut && (
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Kilométrage de départ</Label>
              <p className="font-semibold">{assignation.kilometrage_debut.toLocaleString()} km</p>
            </div>
          )}
        </div>

        {/* Badge pour première saisie */}
        {!assignation.kilometrage_debut && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-400">Première saisie requise</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Veuillez entrer le kilométrage actuel du véhicule pour débuter l'assignation
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mise à jour du kilométrage */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kilometrage" className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Kilométrage actuel *
            </Label>
            <div className="flex gap-2">
              <Input
                id="kilometrage"
                type="number"
                min={assignation.kilometrage_debut || 0}
                value={kilometrage}
                onChange={(e) => setKilometrage(e.target.value)}
                placeholder="Ex: 45000"
                className="text-lg font-semibold"
              />
              <span className="flex items-center text-muted-foreground">km</span>
            </div>
          </div>

          {assignation.kilometrage_debut && kmParcourus > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-sm text-blue-400">
                📊 Distance parcourue : <span className="font-semibold">{kmParcourus.toLocaleString()} km</span>
              </p>
            </div>
          )}

          <Button 
            onClick={handleSaveKilometrage} 
            disabled={saving || !kilometrage}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mise à jour...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {assignation.kilometrage_debut ? 'Mettre à jour le kilométrage' : 'Enregistrer le kilométrage initial'}
              </>
            )}
          </Button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`rounded-lg p-4 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <p className={`text-sm font-semibold ${
              message.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Historique rapide */}
        {assignation.kilometrage_debut && (
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-sm font-semibold mb-3">Statistiques</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Début</p>
                <p className="text-lg font-bold">{assignation.kilometrage_debut.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Actuel</p>
                <p className="text-lg font-bold">{parseInt(kilometrage || '0').toLocaleString()}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Parcouru</p>
                <p className="text-lg font-bold text-blue-400">{kmParcourus.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
