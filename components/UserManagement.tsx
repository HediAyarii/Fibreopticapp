"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Users,
  Shield,
  Settings
} from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  role_id: number
  role_name: string
  first_name?: string
  last_name?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

interface Section {
  section_key: string
  section_name: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Formulaire de création/modification
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role_id: 2, // 2 = employee par défaut
    first_name: '',
    last_name: '',
    permissions: [] as string[]
  })

  // Charger les utilisateurs et sections
  useEffect(() => {
    loadUsers()
    loadSections()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users)
      } else {
        setMessage({type: 'error', text: 'Erreur lors du chargement des utilisateurs'})
      }
    } catch (error) {
      setMessage({type: 'error', text: 'Erreur lors du chargement des utilisateurs'})
    } finally {
      setLoading(false)
    }
  }

  const loadSections = async () => {
    try {
      const response = await fetch('/api/sections')
      const data = await response.json()
      if (response.ok) {
        setSections(data.sections)
        console.log('Sections chargées:', data.sections)
      } else {
        console.error('Erreur API sections:', data.error)
        // Fallback avec sections hardcodées
        setSections([
          { section_key: 'dashboard', section_name: 'Tableau de Bord' },
          { section_key: 'employees', section_name: 'Employés' },
          { section_key: 'interventions', section_name: 'Interventions' },
          { section_key: 'materials', section_name: 'Matériel' },
          { section_key: 'fuel', section_name: 'Carburant' },
          { section_key: 'fuel-consumption', section_name: 'Consommation Carburant' },
          { section_key: 'penalties', section_name: 'Pénalités' },
          { section_key: 'statistics', section_name: 'Statistiques' },
          { section_key: 'costs', section_name: 'Charges' },
          { section_key: 'cout-par-salaire', section_name: 'Charges par Salarié' },
          { section_key: 'claims', section_name: 'Réclamations' },
          { section_key: 'documents', section_name: 'Documents' },
          { section_key: 'recap-calcul', section_name: 'Récap Calcul' },
          { section_key: 'tarifs', section_name: 'Tarifs' },
          { section_key: 'recette-generer', section_name: 'BENEFICE BRUTE' },
          { section_key: 'technicien-accounts', section_name: 'Comptes Techniciens' },
          { section_key: 'compte-admin', section_name: 'Compte Admin' }
        ])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sections:', error)
      // Fallback avec sections hardcodées
      setSections([
        { section_key: 'dashboard', section_name: 'Tableau de Bord' },
        { section_key: 'employees', section_name: 'Employés' },
        { section_key: 'interventions', section_name: 'Interventions' },
        { section_key: 'materials', section_name: 'Matériel' },
        { section_key: 'fuel', section_name: 'Carburant' },
        { section_key: 'fuel-consumption', section_name: 'Consommation Carburant' },
        { section_key: 'penalties', section_name: 'Pénalités' },
        { section_key: 'statistics', section_name: 'Statistiques' },
        { section_key: 'costs', section_name: 'Charges' },
        { section_key: 'cout-par-salaire', section_name: 'Charges par Salarié' },
        { section_key: 'claims', section_name: 'Réclamations' },
        { section_key: 'documents', section_name: 'Documents' },
        { section_key: 'recap-calcul', section_name: 'Récap Calcul' },
        { section_key: 'tarifs', section_name: 'Tarifs' },
        { section_key: 'recette-generer', section_name: 'BENEFICE BRUTE' },
        { section_key: 'technicien-accounts', section_name: 'Comptes Techniciens' },
        { section_key: 'compte-admin', section_name: 'Compte Admin' }
      ])
    }
  }

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role_id: formData.role_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          permissions: formData.permissions
        })
      })

      const data = await response.json()
      if (response.ok) {
        setMessage({type: 'success', text: 'Utilisateur créé avec succès'})
        setShowCreateDialog(false)
        resetForm()
        loadUsers()
      } else {
        setMessage({type: 'error', text: data.error || 'Erreur lors de la création'})
      }
    } catch (error) {
      setMessage({type: 'error', text: 'Erreur lors de la création'})
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (response.ok) {
        setMessage({type: 'success', text: 'Utilisateur modifié avec succès'})
        setShowEditDialog(false)
        setSelectedUser(null)
        resetForm()
        loadUsers()
      } else {
        setMessage({type: 'error', text: data.error || 'Erreur lors de la modification'})
      }
    } catch (error) {
      setMessage({type: 'error', text: 'Erreur lors de la modification'})
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({type: 'success', text: 'Utilisateur supprimé avec succès'})
        loadUsers()
      } else {
        setMessage({type: 'error', text: 'Erreur lors de la suppression'})
      }
    } catch (error) {
      setMessage({type: 'error', text: 'Erreur lors de la suppression'})
    }
  }

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (response.ok) {
        setMessage({type: 'success', text: `Utilisateur ${!isActive ? 'activé' : 'désactivé'} avec succès`})
        loadUsers()
      } else {
        setMessage({type: 'error', text: 'Erreur lors du changement de statut'})
      }
    } catch (error) {
      setMessage({type: 'error', text: 'Erreur lors du changement de statut'})
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Ne pas pré-remplir le mot de passe
      role_id: user.role_id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      permissions: [] // TODO: Récupérer les permissions depuis la base
    })
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role_id: 2,
      first_name: '',
      last_name: '',
      permissions: []
    })
  }

  const handlePermissionChange = (sectionKey: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, sectionKey]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== sectionKey)
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Gestion des Utilisateurs</h2>
          <p className="text-muted-foreground">Créez et gérez les comptes utilisateurs avec permissions personnalisées</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Créer Utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un Nouvel Utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer un nouveau compte utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                    placeholder="john.doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({...prev, first_name: e.target.value}))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({...prev, last_name: e.target.value}))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                  placeholder="Mot de passe sécurisé"
                />
              </div>
              <div>
                <Label>Rôle</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="role_id"
                      value="2"
                      checked={formData.role_id === 2}
                      onChange={(e) => setFormData(prev => ({...prev, role_id: parseInt(e.target.value)}))}
                    />
                    <span>Employé</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="role_id"
                      value="1"
                      checked={formData.role_id === 1}
                      onChange={(e) => setFormData(prev => ({...prev, role_id: parseInt(e.target.value)}))}
                    />
                    <span>Administrateur</span>
                  </label>
                </div>
              </div>
              {formData.role_id === 2 && (
                <div>
                  <Label>Permissions - Sections accessibles ({sections.length} sections disponibles)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border p-2 rounded">
                    {sections.length > 0 ? (
                      sections.map((section) => (
                        <label key={section.section_key} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.permissions.includes(section.section_key)}
                            onCheckedChange={(checked) => handlePermissionChange(section.section_key, checked as boolean)}
                          />
                          <span className="text-sm">{section.section_name}</span>
                        </label>
                      ))
                    ) : (
                      <div className="col-span-2 text-sm text-muted-foreground">
                        Aucune section disponible. Vérifiez la connexion à la base de données.
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateUser}>
                  Créer Utilisateur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <AlertDescription>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Utilisateurs ({users.length})
          </CardTitle>
          <CardDescription>
            Gestion des comptes utilisateurs et de leurs permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium">{user.username}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.first_name && user.last_name && (
                        <p className="text-xs text-muted-foreground">
                          {user.first_name} {user.last_name}
                        </p>
                      )}
                    </div>
                    <Badge variant={user.role_id === 1 ? 'default' : 'secondary'}>
                      {user.role_name}
                    </Badge>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                  >
                    {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de modification */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'Utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations et permissions de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-username">Nom d'utilisateur</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({...prev, username: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-password">Nouveau mot de passe (laisser vide pour ne pas changer)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                placeholder="Nouveau mot de passe"
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="edit-role"
                    value="employee"
                    checked={formData.role === 'employee'}
                    onChange={(e) => setFormData(prev => ({...prev, role: e.target.value as 'employee'}))}
                  />
                  <span>Employé</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="edit-role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => setFormData(prev => ({...prev, role: e.target.value as 'admin'}))}
                  />
                  <span>Administrateur</span>
                </label>
              </div>
            </div>
            {formData.role === 'employee' && (
              <div>
                <Label>Permissions - Sections accessibles</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {sections.map((section) => (
                    <label key={section.section_key} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.permissions.includes(section.section_key)}
                        onCheckedChange={(checked) => handlePermissionChange(section.section_key, checked as boolean)}
                      />
                      <span className="text-sm">{section.section_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleEditUser}>
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
