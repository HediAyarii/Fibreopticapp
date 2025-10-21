"use client"

import { useState, useEffect } from 'react'

interface User {
  id: number
  username: string
  email: string
  role: string
  role_id: number
  name: string
  permissions: {
    sections: string[]
  }
}

export function useUserPermissions() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fonction pour charger l'utilisateur depuis localStorage
  const loadUser = () => {
    const userData = localStorage.getItem('currentUser')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        console.log('🔍 Utilisateur chargé depuis localStorage:', parsedUser.username)
        console.log('📋 Permissions:', parsedUser.permissions)
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error)
      }
    } else {
      console.log('❌ Aucun utilisateur trouvé dans localStorage')
      setUser(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUser()
    
    // Écouter les changements de localStorage
    const handleStorageChange = () => {
      loadUser()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Écouter les événements personnalisés pour les changements d'utilisateur
    const handleUserChange = () => {
      loadUser()
    }
    
    window.addEventListener('userChanged', handleUserChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userChanged', handleUserChange)
    }
  }, [])

  const hasPermission = (section: string): boolean => {
    if (!user) {
      console.log('❌ Aucun utilisateur connecté pour la section:', section)
      return false
    }
    
    console.log(`🔍 Vérification permission pour "${section}":`)
    console.log(`   - Utilisateur: ${user.username}`)
    console.log(`   - Rôle: ${user.role} (ID: ${user.role_id})`)
    console.log(`   - Permissions: ${JSON.stringify(user.permissions)}`)
    
    // Les admins ont accès à tout
    if (user.role === 'admin' || user.role_id === 1) {
      console.log('✅ Admin - accès autorisé pour:', section)
      return true
    }
    
    // Pour les employés, vérifier les permissions spécifiques
    if (user.role === 'employee' || user.role_id === 2) {
      const hasAccess = user.permissions?.sections?.includes(section) || false
      console.log(`   - Employé - accès ${hasAccess ? 'autorisé' : 'refusé'} pour: ${section}`)
      console.log(`   - Sections autorisées: ${JSON.stringify(user.permissions?.sections)}`)
      return hasAccess
    }
    
    console.log('❌ Rôle non reconnu pour:', section)
    return false
  }

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || user?.role_id === 1 || false
  }

  const getAvailableSections = (): string[] => {
    if (!user) return []
    
    if (isAdmin()) {
      // Admin voit toutes les sections
      return [
        'dashboard', 'employees', 'interventions', 'materials', 'fuel',
        'fuel-consumption', 'penalties', 'statistics', 'costs',
        'cout-par-salaire', 'claims', 'documents', 'recap-calcul',
        'tarifs', 'recette-generer', 'technicien-accounts', 'compte-admin'
      ]
    }
    
    // Employé voit seulement ses sections autorisées
    return user.permissions?.sections || []
  }

  return {
    user,
    loading,
    hasPermission,
    isAdmin,
    getAvailableSections
  }
}
