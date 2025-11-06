"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, ArrowRightLeft, Building2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TransferMaterielDialogProps {
  materiel: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransferSuccess: () => void
}

export function TransferMaterielDialog({ 
  materiel, 
  open, 
  onOpenChange,
  onTransferSuccess 
}: TransferMaterielDialogProps) {
  const [depot_destination, setDepotDestination] = useState<string>('')
  const [motif, setMotif] = useState<string>('')
  const [commentaires, setCommentaires] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!depot_destination) {
      setError('Veuillez sélectionner un dépôt de destination')
      return
    }

    if (depot_destination === materiel.depot) {
      setError(`Le matériel est déjà dans le dépôt ${materiel.depot}`)
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/materiel/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materiel_id: materiel.id,
          depot_destination,
          motif: motif || `Transfert de ${materiel.depot} vers ${depot_destination}`,
          commentaires,
          utilisateur_nom: 'Utilisateur' // TODO: Récupérer depuis la session
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du transfert')
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onTransferSuccess()
        onOpenChange(false)
        // Réinitialiser le formulaire
        setDepotDestination('')
        setMotif('')
        setCommentaires('')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Erreur lors du transfert')
    } finally {
      setLoading(false)
    }
  }

  if (!materiel) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Transférer le Matériel
          </DialogTitle>
          <DialogDescription>
            Déplacer {materiel.nom_equipement} vers un autre dépôt
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-green-600">
              Transfert réussi !
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Le matériel a été transféré vers {depot_destination}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dépôt Actuel */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Dépôt Actuel
                </Label>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {materiel.depot || 'Non défini'}
              </div>
            </div>

            {/* Flèche de transfert */}
            <div className="flex justify-center">
              <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />
            </div>

            {/* Sélection Dépôt de Destination */}
            <div>
              <Label htmlFor="depot_destination">Dépôt de Destination *</Label>
              <Select value={depot_destination} onValueChange={setDepotDestination}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le dépôt de destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AXECOM" disabled={materiel.depot === 'AXECOM'}>
                    AXECOM
                  </SelectItem>
                  <SelectItem value="ERT" disabled={materiel.depot === 'ERT'}>
                    ERT
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motif du Transfert */}
            <div>
              <Label htmlFor="motif">Motif du Transfert</Label>
              <Input
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Réorganisation du stock, Besoin sur site..."
              />
            </div>

            {/* Commentaires */}
            <div>
              <Label htmlFor="commentaires">Commentaires</Label>
              <Textarea
                id="commentaires"
                value={commentaires}
                onChange={(e) => setCommentaires(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>

            {/* Erreur */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !depot_destination}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Transfert en cours...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Transférer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
