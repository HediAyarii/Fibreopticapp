"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Lock, CheckCircle, XCircle } from "lucide-react"

interface Employe {
  id: number
  prenom: string
  nom: string
  matricule: string
  niveau_acces: string
}

interface TechnicienAccountFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function TechnicienAccountForm({ onSuccess, onCancel }: TechnicienAccountFormProps) {
  const [formData, setFormData] = useState({
    employe_id: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [employes, setEmployes] = useState<Employe[]>([])
  const [loadingEmployes, setLoadingEmployes] = useState(false)

  // Charger la liste des employés au montage du composant
  React.useEffect(() => {
    loadEmployes()
  }, [])

  const loadEmployes = async () => {
    setLoadingEmployes(true)
    try {
      const response = await fetch('/api/employes')
      const data = await response.json()
      
      if (data.employes) {
        // Filtrer les employés qui n'ont pas encore de compte technicien
        const responseAccounts = await fetch('/api/admin/technicien-accounts')
        const accountsData = await responseAccounts.json()
        
        const existingAccountIds = accountsData.accounts?.map((acc: any) => acc.technicien_id) || []
        const availableEmployes = data.employes.filter((emp: Employe) => !existingAccountIds.includes(emp.id))
        
        setEmployes(availableEmployes)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error)
    } finally {
      setLoadingEmployes(false)
    }
  }

  const handleEmployeChange = (employeId: string) => {
    const employe = employes.find(emp => emp.id.toString() === employeId)
    if (employe) {
      const username = `${employe.prenom.toLowerCase()}_${employe.nom.toLowerCase().replace(/\s+/g, '_')}`
      setFormData(prev => ({
        ...prev,
        employe_id: employeId,
        username: username,
        password: employe.matricule // Mot de passe par défaut = matricule
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!formData.employe_id || !formData.username || !formData.password) {
      setError('Tous les champs sont requis')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/technicien-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          technicien_id: parseInt(formData.employe_id),
          username: formData.username,
          password: formData.password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Compte technicien créé avec succès pour ${formData.username}`)
        setFormData({
          employe_id: '',
          username: '',
          password: '',
          confirmPassword: ''
        })
        // Recharger la liste des employés disponibles
        loadEmployes()
        if (onSuccess) onSuccess()
      } else {
        setError(data.error || 'Erreur lors de la création du compte')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Créer un Compte Technicien
        </CardTitle>
        <CardDescription>
          Créez un compte pour un nouvel employé technicien. Il pourra se connecter avec son nom d'utilisateur et son matricule comme mot de passe.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employe_id" className="text-sm font-medium">
              Employé *
            </Label>
            <Select 
              value={formData.employe_id} 
              onValueChange={(value) => handleEmployeChange(value)}
              disabled={loadingEmployes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingEmployes ? "Chargement..." : "Sélectionner un employé"} />
              </SelectTrigger>
              <SelectContent>
                {employes.map((employe) => (
                  <SelectItem key={employe.id} value={employe.id.toString()}>
                    {employe.prenom} {employe.nom} ({employe.matricule})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {employes.length === 0 && !loadingEmployes && (
              <p className="text-sm text-gray-500">Tous les employés ont déjà un compte technicien</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Nom d'utilisateur *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Nom d'utilisateur généré automatiquement"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Généré automatiquement à partir du nom et prénom de l'employé
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Mot de passe *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mot de passe (matricule par défaut)"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Par défaut, le matricule de l'employé est utilisé comme mot de passe
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmer le mot de passe *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirmer le mot de passe"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || employes.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer le Compte'
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Annuler
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Informations importantes :</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Le technicien pourra se connecter avec son nom d'utilisateur et son mot de passe</li>
            <li>• Il ne verra que ses propres données (interventions, réclamations, pénalités, carburant)</li>
            <li>• Le compte est actif par défaut et peut être désactivé par l'administrateur</li>
            <li>• Le mot de passe peut être changé par l'administrateur si nécessaire</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
