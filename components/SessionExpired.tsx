'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface SessionExpiredProps {
  onRetry?: () => void
}

export function SessionExpired({ onRetry }: SessionExpiredProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirection automatique après 3 secondes
    const timer = setTimeout(() => {
      router.push('/logintech')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Session expirée</p>
              <p className="text-sm">
                Votre session a expiré pour des raisons de sécurité. 
                Vous allez être redirigé vers la page de connexion dans quelques secondes.
              </p>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Redirection en cours...</span>
          </div>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Réessayer maintenant
            </button>
          )}
          
          <button
            onClick={() => router.push('/logintech')}
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Aller à la page de connexion
          </button>
        </div>
      </div>
    </div>
  )
}













