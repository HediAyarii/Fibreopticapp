"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, Upload, CheckCircle, Clock, AlertTriangle, Car } from "lucide-react"
import Image from "next/image"

interface Vehicule {
  id: number
  matricule: string
  marque: string
  modele: string
  annee: number
  km_actuel: number
  prochaine_echeance_km: string
}

interface Assignation {
  id: number
  vehicule_id: number
  date_assignation: string
  statut_km: string
  km_debut: number | null
  km_actuel: number | null
  date_derniere_maj: string | null
}

interface MonVehiculeProps {
  vehicule: Vehicule | null
  assignation: Assignation | null
  technicienId: number
  onSubmitKm: (data: FormData) => Promise<void>
}

export function MonVehicule({ vehicule, assignation, technicienId, onSubmitKm }: MonVehiculeProps) {
  const [showModal, setShowModal] = useState(false)
  const [kmValue, setKmValue] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculer les jours restants jusqu'à l'échéance
  const getDaysUntilDeadline = () => {
    if (!vehicule?.prochaine_echeance_km) return null
    const deadline = new Date(vehicule.prochaine_echeance_km)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDeadline = getDaysUntilDeadline()

  if (!vehicule || !assignation) {
    return (
      <Card className="glass-card border border-white/20">
        <CardContent className="p-12 text-center">
          <Car className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Aucun véhicule assigné</h3>
          <p className="text-muted-foreground">Vous n'avez pas de véhicule assigné actuellement</p>
        </CardContent>
      </Card>
    )
  }

  const getStatutBadge = () => {
    const statut = assignation.statut_km
    
    if (statut === 'initial_attente') {
      return (
        <Badge className="bg-red-500/20 text-red-400">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Action requise
        </Badge>
      )
    } else if (statut === 'en_attente_validation') {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400">
          <Clock className="w-4 h-4 mr-1" />
          Validation en cours
        </Badge>
      )
    } else if (statut === 'a_jour') {
      return (
        <Badge className="bg-green-500/20 text-green-400">
          <CheckCircle className="w-4 h-4 mr-1" />
          À jour
        </Badge>
      )
    } else if (statut?.startsWith('retard_')) {
      const jour = statut.replace('retard_j', '')
      return (
        <Badge className="bg-orange-500/20 text-orange-400">
          <AlertTriangle className="w-4 h-4 mr-1" />
          En retard (J+{jour})
        </Badge>
      )
    } else if (statut === 'bloque') {
      return (
        <Badge className="bg-red-500/20 text-red-400">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Bloqué
        </Badge>
      )
    }
    
    return null
  }

  const getActionButton = () => {
    if (assignation.statut_km === 'initial_attente') {
      return (
        <Button onClick={() => setShowModal(true)} size="lg" className="w-full md:w-auto">
          <Camera className="w-5 h-5 mr-2" />
          Enregistrer KM Initial
        </Button>
      )
    } else if (assignation.statut_km === 'en_attente_validation') {
      return (
        <Button disabled size="lg" className="w-full md:w-auto">
          <Clock className="w-5 h-5 mr-2" />
          En attente de validation
        </Button>
      )
    } else {
      return (
        <Button onClick={() => setShowModal(true)} size="lg" className="w-full md:w-auto">
          <Camera className="w-5 h-5 mr-2" />
          Mettre à jour le KM
        </Button>
      )
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!photoFile || !kmValue) {
      alert("Veuillez remplir tous les champs")
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('vehicule_id', vehicule.id.toString())
    formData.append('assignation_id', assignation.id.toString())
    formData.append('technicien_id', technicienId.toString())
    formData.append('km_declare', kmValue)
    formData.append('photo', photoFile)
    formData.append('type_update', assignation.statut_km === 'initial_attente' ? 'initial' : 'mensuel')

    try {
      await onSubmitKm(formData)
      setShowModal(false)
      setKmValue("")
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch (error) {
      console.error('Erreur soumission KM:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isBlocked = assignation.statut_km === 'bloque'
  const isInitialRequired = assignation.statut_km === 'initial_attente'

  // Déterminer le type d'alerte à afficher
  const getAlertBanner = () => {
    // Blocage
    if (isBlocked) {
      return (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <h3 className="font-semibold text-red-400">🔒 ACCÈS SUSPENDU</h3>
              <p className="text-sm text-red-300">
                Vous avez dépassé la période de grâce (J+3). Votre accès est bloqué.
                <br />
                Mettez à jour le kilométrage immédiatement pour retrouver l'accès complet.
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Kilométrage initial requis
    if (isInitialRequired) {
      return (
        <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <div>
              <h3 className="font-semibold text-orange-400">⚡ ACTION REQUISE</h3>
              <p className="text-sm text-orange-300">
                Enregistrez le kilométrage initial de votre véhicule dans les 24h
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Alertes selon les jours restants
    if (daysUntilDeadline !== null) {
      if (daysUntilDeadline === 0) {
        return (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="font-semibold text-red-400">🚨 AUJOURD'HUI - DERNIER JOUR</h3>
                <p className="text-sm text-red-300">
                  C'est le dernier jour du mois ! Vous devez mettre à jour le kilométrage aujourd'hui.
                  <br />
                  <strong>Après minuit, période de grâce de 3 jours avant blocage.</strong>
                </p>
              </div>
            </div>
          </div>
        )
      } else if (daysUntilDeadline === 1) {
        return (
          <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-400">⚠️ ALERTE J-1</h3>
                <p className="text-sm text-orange-300">
                  Plus qu'<strong>1 jour</strong> pour mettre à jour le kilométrage (demain = dernier jour du mois)
                </p>
              </div>
            </div>
          </div>
        )
      } else if (daysUntilDeadline === 2) {
        return (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-400">⚠️ ALERTE J-2</h3>
                <p className="text-sm text-yellow-300">
                  Plus que <strong>2 jours</strong> pour mettre à jour le kilométrage
                </p>
              </div>
            </div>
          </div>
        )
      } else if (daysUntilDeadline === 3) {
        return (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-400">📅 ALERTE J-3</h3>
                <p className="text-sm text-yellow-300">
                  Plus que <strong>3 jours</strong> pour mettre à jour le kilométrage du mois
                </p>
              </div>
            </div>
          </div>
        )
      } else if (daysUntilDeadline < 0) {
        // Retard (J+1, J+2, J+3)
        const daysLate = Math.abs(daysUntilDeadline)
        if (daysLate <= 3) {
          return (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="font-semibold text-red-400">
                    🚨 RETARD J+{daysLate} - Période de grâce ({daysLate}/3)
                  </h3>
                  <p className="text-sm text-red-300">
                    Vous êtes en retard ! Mettez à jour le kilométrage MAINTENANT.
                    <br />
                    {daysLate === 3 ? (
                      <strong className="text-red-200">⚠️ DERNIER JOUR avant blocage automatique demain !</strong>
                    ) : (
                      <span>Encore {3 - daysLate} jour(s) avant blocage automatique</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )
        }
      }
    }

    return null
  }

  return (
    <>
      {/* Banner d'alerte dynamique */}
      {getAlertBanner()}

      {/* Carte du véhicule */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Car className="w-6 h-6" />
                Mon Véhicule
              </CardTitle>
              <CardDescription>
                Assigné le {new Date(assignation.date_assignation).toLocaleDateString('fr-FR')}
              </CardDescription>
            </div>
            {getStatutBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Infos véhicule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-muted-foreground">Matricule</Label>
              <div className="font-mono font-bold text-xl">{vehicule.matricule}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Véhicule</Label>
              <div className="font-semibold text-xl">
                {vehicule.marque} {vehicule.modele}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Année</Label>
              <div className="font-semibold text-xl">{vehicule.annee}</div>
            </div>
          </div>

          <div className="h-px bg-white/10"></div>

          {/* Kilométrage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <Label className="text-muted-foreground text-sm">Kilométrage Actuel</Label>
              <div className="text-3xl font-bold text-primary">
                {(assignation.km_actuel || vehicule.km_actuel || 0).toLocaleString()} km
              </div>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <Label className="text-muted-foreground text-sm">Prochaine MAJ</Label>
              <div className="text-xl font-semibold text-blue-400">
                {vehicule.prochaine_echeance_km 
                  ? new Date(vehicule.prochaine_echeance_km).toLocaleDateString('fr-FR')
                  : 'À définir'
                }
              </div>
            </div>
          </div>

          {assignation.date_derniere_maj && (
            <div className="text-sm text-muted-foreground">
              Dernière mise à jour : {new Date(assignation.date_derniere_maj).toLocaleDateString('fr-FR')}
            </div>
          )}

          <div className="h-px bg-white/10"></div>

          {/* Bouton d'action */}
          <div className="flex justify-center">
            {getActionButton()}
          </div>
        </CardContent>
      </Card>

      {/* Modal de mise à jour KM */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {assignation.statut_km === 'initial_attente' 
                ? '📸 Kilométrage Initial'
                : '📸 Mise à Jour Kilométrage'
              }
            </DialogTitle>
            <DialogDescription>
              Véhicule {vehicule.matricule} - {vehicule.marque} {vehicule.modele}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Upload photo */}
            <div>
              <Label htmlFor="photo">Photo du compteur *</Label>
              <div className="mt-2">
                {photoPreview ? (
                  <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
                    <Image src={photoPreview} alt="Preview" fill className="object-contain" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour choisir une photo
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                  required
                />
              </div>
            </div>

            {/* Kilométrage */}
            <div>
              <Label htmlFor="km">Kilométrage actuel *</Label>
              <Input
                id="km"
                type="number"
                min="0"
                value={kmValue}
                onChange={(e) => setKmValue(e.target.value)}
                placeholder="Ex: 45230"
                required
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Date : {new Date().toLocaleDateString('fr-FR')}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Envoi...' : '📤 Envoyer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
