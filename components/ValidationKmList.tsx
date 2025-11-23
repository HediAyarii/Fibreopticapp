"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Eye, Clock, User, Car } from "lucide-react"
import Image from "next/image"

interface KmUpdate {
  id: number
  vehicule_id: number
  technicien_id: number
  matricule: string
  marque: string
  modele: string
  technicien_nom: string
  technicien_prenom: string
  km_declare: number
  photo_compteur: string
  date_soumission: string
  type_update: string
  statut: string
}

interface ValidationKmListProps {
  updates: KmUpdate[]
  onValidate: (id: number) => void
  onReject: (id: number, commentaire: string) => void
  loading?: boolean
}

export function ValidationKmList({ updates, onValidate, onReject, loading }: ValidationKmListProps) {
  const [selectedUpdate, setSelectedUpdate] = useState<KmUpdate | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState("")
  const [processingId, setProcessingId] = useState<number | null>(null)

  const handleValidate = async (update: KmUpdate) => {
    setProcessingId(update.id)
    await onValidate(update.id)
    setProcessingId(null)
  }

  const handleRejectSubmit = async () => {
    if (selectedUpdate && rejectComment.trim()) {
      setProcessingId(selectedUpdate.id)
      await onReject(selectedUpdate.id, rejectComment)
      setShowRejectModal(false)
      setRejectComment("")
      setSelectedUpdate(null)
      setProcessingId(null)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'initial': return 'Initial'
      case 'mensuel': return 'Mensuel'
      case 'fin_assignation': return 'Fin assignation'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-green-500" />
        <h3 className="text-lg font-semibold mb-2">Aucune validation en attente</h3>
        <p>Toutes les mises à jour de kilométrage sont traitées</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {updates.map((update) => (
          <Card key={update.id} className="glass-card border border-white/20 hover-lift">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Info Véhicule */}
                <div className="md:col-span-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Car className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-mono font-semibold">{update.matricule}</div>
                      <div className="text-sm text-muted-foreground">
                        {update.marque} {update.modele}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Technicien */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {update.technicien_prenom} {update.technicien_nom}
                    </span>
                  </div>
                </div>

                {/* KM Déclaré */}
                <div className="md:col-span-2">
                  <div className="text-center p-3 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {update.km_declare.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">km déclaré</div>
                  </div>
                </div>

                {/* Type & Date */}
                <div className="md:col-span-2">
                  <Badge variant="outline" className="mb-2">
                    {getTypeLabel(update.type_update)}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(update.date_soumission).toLocaleString('fr-FR')}
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-3 flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUpdate(update)
                      setShowPhotoModal(true)
                    }}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Photo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleValidate(update)}
                    disabled={processingId === update.id}
                    className="flex items-center gap-1 text-green-400 hover:text-green-300 hover:border-green-400"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Valider
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUpdate(update)
                      setShowRejectModal(true)
                    }}
                    disabled={processingId === update.id}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:border-red-400"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Photo */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo du Compteur Kilométrique</DialogTitle>
            <DialogDescription>
              {selectedUpdate && (
                <>
                  Véhicule {selectedUpdate.matricule} - {selectedUpdate.km_declare.toLocaleString()} km déclaré
                  <br />
                  Soumis par {selectedUpdate.technicien_prenom} {selectedUpdate.technicien_nom} le{' '}
                  {new Date(selectedUpdate.date_soumission).toLocaleDateString('fr-FR')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedUpdate && (
            <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden">
              <Image
                src={selectedUpdate.photo_compteur}
                alt="Photo compteur"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Rejet */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la Mise à Jour</DialogTitle>
            <DialogDescription>
              Indiquez la raison du rejet pour que le technicien puisse corriger
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Ex: Photo floue, kilométrage incohérent, mauvais angle..."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectComment("")
                  setSelectedUpdate(null)
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={!rejectComment.trim() || processingId !== null}
                className="bg-red-500 hover:bg-red-600"
              >
                Confirmer le Rejet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
