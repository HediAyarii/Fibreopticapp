"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  EyeOff,
  KeyRound,
  X as XIcon,
  ShieldAlert
} from "lucide-react"
import TechnicienAccountForm from '@/components/TechnicienAccountForm'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const router = useRouter()
  const [accounts, setAccounts] = useState<TechnicienAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<TechnicienAccount | null>(null)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordAccountId, setResetPasswordAccountId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Vérifier l'authentification admin au chargement
  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        const userStr = localStorage.getItem('currentUser')
        if (!userStr) {
          setIsAuthorized(false)
          setCheckingAuth(false)
          return
        }

        const user = JSON.parse(userStr)
        // Vérifier si l'utilisateur est admin (superadmin ou a les permissions)
        const isAdmin = user.role === 'superadmin' || user.role === 'admin' || user.is_superuser === true
        
        if (!isAdmin) {
          setIsAuthorized(false)
          setCheckingAuth(false)
          return
        }

        setIsAuthorized(true)
        setCheckingAuth(false)
      } catch (error) {
        setIsAuthorized(false)
        setCheckingAuth(false)
      }
    }

    checkAdminAuth()
  }, [])

  useEffect(() => {
    if (isAuthorized) {
      loadAccounts()
    }
  }, [isAuthorized])

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

  const handleResetLoginAttempts = async (accountId: number) => {
    try {
      const response = await fetch('/api/admin/technicien-accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: accountId,
          reset_login_attempts: true
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAccounts(prev => 
          prev.map(acc => 
            acc.id === accountId 
              ? { ...acc, login_attempts: 0, is_locked: false }
              : acc
          )
        )
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    }
  }

  const handleOpenResetPasswordModal = (accountId: number) => {
    setResetPasswordAccountId(accountId)
    setNewPassword('')
    setConfirmPassword('')
    setShowResetPasswordModal(true)
  }

  const handleResetPassword = async () => {
    if (!resetPasswordAccountId) return

    if (!newPassword || newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setResettingPassword(true)
    setError('')

    try {
      const response = await fetch('/api/admin/technicien-accounts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: resetPasswordAccountId,
          reset_password: true,
          password: newPassword
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowResetPasswordModal(false)
        setResetPasswordAccountId(null)
        setNewPassword('')
        setConfirmPassword('')
        alert('Mot de passe réinitialisé avec succès')
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation du mot de passe')
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
    } finally {
      setResettingPassword(false)
    }
  }

  const getStatusBadge = (account: TechnicienAccount) => {
    if (!account.is_active) {
      return <Badge variant="secondary">Inactif</Badge>
    }
    if (account.is_locked) {
      return <Badge variant="destructive" className="bg-red-500 text-white">🔒 Verrouillé</Badge>
    }
    if (account.login_attempts >= 2) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">⚠️ Alerte</Badge>
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

  // Afficher le loader pendant la vérification d'auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Vérification des autorisations...</p>
        </div>
      </div>
    )
  }

  // Afficher une erreur si non autorisé
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-red-100 rounded-full w-fit">
              <ShieldAlert className="w-12 h-12 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-base">
              Cette page est réservée aux administrateurs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Vous devez être connecté en tant qu'administrateur pour accéder à cette section.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
              >
                Retour à l'accueil
              </Button>
              <Button 
                onClick={() => {
                  localStorage.removeItem('currentUser')
                  router.push('/')
                }}
              >
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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

                    {account.is_locked && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-800">
                          <Lock className="w-4 h-4" />
                          <span className="font-medium text-sm">
                            Compte verrouillé après {account.login_attempts} tentatives échouées
                          </span>
                        </div>
                        <p className="text-xs text-red-700 mt-1">
                          Cliquez sur "Réinitialiser" pour débloquer le compte
                        </p>
                      </div>
                    )}

                    {account.login_attempts > 0 && !account.is_locked && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          {account.login_attempts} tentative(s) échouée(s)
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetLoginAttempts(account.id)}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Réinitialiser
                        </Button>
                      </div>
                    )}

                    {account.is_locked && (
                      <div className="mt-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleResetLoginAttempts(account.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Débloquer et Réinitialiser
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        // Ouvrir l'interface technicien dans un nouvel onglet avec le username pré-rempli
                        window.open(`/technicien/login?username=${account.username}&admin_view=true`, '_blank')
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      title="Voir comme ce technicien"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir comme
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(account.id, 'is_active')}
                      className={account.is_active ? 'text-green-600' : 'text-gray-600'}
                    >
                      {account.is_active ? (
                        <><CheckCircle className="w-4 h-4 mr-1" /> Actif</>
                      ) : (
                        <><XCircle className="w-4 h-4 mr-1" /> Inactif</>
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
                      onClick={() => handleOpenResetPasswordModal(account.id)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound className="w-4 h-4" />
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
          <li>• <strong>Verrouillé/Déverrouillé :</strong> Verrouille le compte après 3 tentatives de connexion échouées</li>
          <li>• <strong>Réinitialiser :</strong> Remet les tentatives à zéro et déverrouille automatiquement le compte</li>
          <li>• <strong>🔑 Réinitialiser mot de passe :</strong> Permet de définir un nouveau mot de passe pour le technicien</li>
          <li>• <strong>Suppression :</strong> Supprime définitivement le compte (irréversible)</li>
          <li>• Chaque technicien ne peut voir que ses propres données (interventions, réclamations, pénalités, carburant)</li>
          <li>• <span className="text-orange-700">⚠️ Un compte avec 2+ tentatives montre une alerte orange</span></li>
          <li>• <span className="text-red-700">🔒 Un compte verrouillé (3 tentatives) est bloqué jusqu'à réinitialisation</span></li>
        </ul>
      </div>

      {/* Modal de réinitialisation de mot de passe */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                Réinitialiser le mot de passe
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setError('')
                }}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retaper le mot de passe"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPasswordModal(false)
                    setNewPassword('')
                    setConfirmPassword('')
                    setError('')
                  }}
                  disabled={resettingPassword}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resettingPassword || !newPassword || !confirmPassword}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {resettingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
