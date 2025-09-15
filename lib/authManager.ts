"use client"

// Utilitaire pour gérer les sessions expirées
export class AuthManager {
  private static instance: AuthManager
  private isRedirecting = false

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  // Vérifier si une réponse indique une session expirée
  isSessionExpired(response: Response): boolean {
    return response.status === 401
  }

  // Gérer une session expirée
  handleSessionExpired(): void {
    if (this.isRedirecting) return
    
    this.isRedirecting = true
    console.log('Session expirée détectée, redirection vers /logintech')
    
    // Supprimer le cookie côté client
    document.cookie = 'technicien_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    // Rediriger vers la page de login
    window.location.href = '/logintech'
  }

  // Wrapper pour fetch qui gère automatiquement les sessions expirées
  async fetchWithAuthHandling(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const response = await fetch(url, options)
      
      if (this.isSessionExpired(response)) {
        this.handleSessionExpired()
        throw new Error('Session expirée')
      }
      
      return response
    } catch (error) {
      // Si c'est une erreur réseau et qu'on est sur une route protégée, vérifier l'auth
      if (url.includes('/api/') && !url.includes('/api/auth/technicien')) {
        try {
          const authResponse = await fetch('/api/auth/technicien')
          if (this.isSessionExpired(authResponse)) {
            this.handleSessionExpired()
          }
        } catch (authError) {
          // Ignorer les erreurs d'auth lors de la vérification
        }
      }
      throw error
    }
  }

  // Réinitialiser le flag de redirection
  resetRedirecting(): void {
    this.isRedirecting = false
  }
}

// Hook pour utiliser l'AuthManager
export function useAuthManager() {
  return AuthManager.getInstance()
}

// Fonction utilitaire pour les requêtes avec gestion d'auth
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authManager = AuthManager.getInstance()
  return authManager.fetchWithAuthHandling(url, options)
}
