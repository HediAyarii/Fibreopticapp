"use client"

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: number
  username: string
  prenom: string
  nom: string
  matricule: string
  niveau_acces: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/technicien')
      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/technicien', {
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
      await fetch('/api/auth/technicien', { method: 'DELETE' })
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      setUser(null)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
