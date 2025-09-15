"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import TechnicienAccountForm from '@/components/TechnicienAccountForm'

interface TechnicienAccount {
  id: number
  username: string
  is_active: boolean
  is_locked: boolean
  login_attempts: number
  created_at: string
  last_login: string | null
  technicien_id: number
  prenom: string
  nom: string
  matricule: string
  niveau_acces: string
}

export default function AdminTechnicienAccounts() {
  const [accounts, setAccounts] = useState<TechnicienAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<TechnicienAccount | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/admin/technicien-accounts')
      const data = await response.json()
      
      if (data.success) {
        setAccounts(data.accounts)
      } else {
        setError(data.error || 'Erreur lors du chargement des comptes')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (accountId: number, field: 'is_active' | 'is_locked') => {
    try {
      const account = accounts.find(acc => acc.id === accountId)
      if (!account) return

      const newValue = !account[field]
      
      const response = await fetch('/api/admin/technicien-accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: accountId,
          [field]: newValue
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAccounts(prev => 
          prev.map(acc => 
            acc.id === accountId 
              ? { ...acc, [field]: newValue }
              : acc
          )
        )
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    }
  }

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte technicien ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/technicien-accounts?id=${accountId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setAccounts(prev => prev.filter(acc => acc.id !== accountId))
      } else {
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    }
  }

  const getStatusBadge = (account: TechnicienAccount) => {
    if (!account.is_active) {
      return <Badge variant="secondary">Inactif</Badge>
    }
    if (account.is_locked) {
      return <Badge variant="destructive">Verrouillé</Badge>
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Chargement des comptes techniciens...
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Créer un Compte Technicien</h1>
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
          >
            Retour à la liste
          </Button>
        </div>
        
        <TechnicienAccountForm 
          onSuccess={() => {
            setShowCreateForm(false)
            loadAccounts()
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Comptes Techniciens</h1>
          <p className="text-gray-600 mt-1">
            Gérez les comptes d'accès des techniciens à leur espace personnel
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Compte
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun compte technicien
              </h3>
              <p className="text-gray-600 mb-4">
                Créez le premier compte technicien pour permettre l'accès à l'espace personnel.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                Créer le premier compte
              </Button>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium">
                        {account.prenom} {account.nom}
                      </h3>
                      {getStatusBadge(account)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Nom d'utilisateur:</span>
                        <p className="font-mono">{account.username}</p>
                      </div>
                      <div>
                        <span className="font-medium">Matricule:</span>
                        <p>{account.matricule}</p>
                      </div>
                      <div>
                        <span className="font-medium">Créé le:</span>
                        <p>{formatDate(account.created_at)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Dernière connexion:</span>
                        <p>{formatDate(account.last_login)}</p>
                      </div>
                    </div>

                    {account.login_attempts > 0 && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          {account.login_attempts} tentative(s) échouée(s)
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(account.id, 'is_active')}
                      className={account.is_active ? 'text-green-600' : 'text-gray-600'}
                    >
                      {account.is_active ? (
                        <><Eye className="w-4 h-4 mr-1" /> Activer</>
                      ) : (
                        <><EyeOff className="w-4 h-4 mr-1" /> Désactiver</>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(account.id, 'is_locked')}
                      className={account.is_locked ? 'text-red-600' : 'text-gray-600'}
                    >
                      {account.is_locked ? (
                        <><Unlock className="w-4 h-4 mr-1" /> Déverrouiller</>
                      ) : (
                        <><Lock className="w-4 h-4 mr-1" /> Verrouiller</>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Informations sur les comptes techniciens :</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Actif/Désactif :</strong> Contrôle si le technicien peut se connecter</li>
          <li>• <strong>Verrouillé/Déverrouillé :</strong> Verrouille le compte après plusieurs tentatives de connexion échouées</li>
          <li>• <strong>Suppression :</strong> Supprime définitivement le compte (irréversible)</li>
          <li>• Chaque technicien ne peut voir que ses propres données (interventions, réclamations, pénalités, carburant)</li>
        </ul>
      </div>
    </div>
  )
}
