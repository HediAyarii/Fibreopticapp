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
        // Logs réduits pour éviter le spam
        console.log('🔍 Utilisateur chargé:', parsedUser.username)
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error)
      }
    } else {
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
      return false
    }
    
    // Les admins ont accès à tout
    if (user.role === 'admin' || user.role_id === 1) {
      return true
    }
    
    // Pour les employés, vérifier les permissions spécifiques
    if (user.role === 'employee' || user.role_id === 2) {
      return user.permissions?.sections?.includes(section) || false
    }
    
    return false
  }

  const isAdmin = user?.role === 'admin' || user?.role_id === 1 || false

  const getAvailableSections = (): string[] => {
    if (!user) return []
    
    if (isAdmin) {
      // Admin voit toutes les sections
      return [
        'dashboard', 'employees', 'interventions', 'materials', 'fuel',
        'fuel-consumption', 'penalties', 'statistics', 'costs',
        'cout-par-salarie', 'claims', 'documents', 'recap-calcul',
        'tarifs', 'recette-generer', 'technicien-accounts', 'compte-admin',
        'vehicules', 'reclamations-techniques', 'absences', 'recla-free', 'ftto'
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
