"use client"

import { useState, useEffect, createContext, useContext } from 'react'

interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'employee'
  permissions: {
    sections: string[]
  }
  is_active: boolean
}

interface PermissionContextType {
  user: User | null
  loading: boolean
  hasPermission: (section: string) => boolean
  isAdmin: () => boolean
  checkAuth: () => Promise<void>
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user')
      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
      } else {
        setUser(null)
        // Si la session est expirée, rediriger vers la page de login
        if (response.status === 401) {
          console.log('Session expirée, redirection vers /login')
          window.location.href = '/login'
        }
      }
    } catch (error) {
      setUser(null)
      console.error('Erreur lors de la vérification de l\'authentification:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/user', { method: 'DELETE' })
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      setUser(null)
    }
  }

  const hasPermission = (section: string): boolean => {
    if (!user) return false
    
    // Les admins ont accès à tout
    if (user.role === 'admin') return true
    
    // Pour les employés, vérifier les permissions spécifiques
    if (user.role === 'employee') {
      return user.permissions?.sections?.includes(section) || false
    }
    
    return false
  }

  const isAdmin = (): boolean => {
    return user?.role === 'admin' || false
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <PermissionContext.Provider value={{ 
      user, 
      loading, 
      hasPermission, 
      isAdmin, 
      checkAuth, 
      login, 
      logout 
    }}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider')
  }
  return context
}

// Hook pour vérifier une permission spécifique
export function useHasPermission(section: string) {
  const { hasPermission } = usePermissions()
  return hasPermission(section)
}

// Hook pour vérifier si l'utilisateur est admin
export function useIsAdmin() {
  const { isAdmin } = usePermissions()
  return isAdmin()
}
