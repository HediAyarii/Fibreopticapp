import { useEffect, useRef, useState } from 'react'

interface RealtimeOptions {
  interval?: number
  enabled?: boolean
  onUpdate?: () => void
}

export function useSmartRealtime({ 
  interval = 30000, // 30 secondes par défaut
  enabled = true,
  onUpdate 
}: RealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const onUpdateRef = useRef(onUpdate)

  // Mettre à jour la référence de la fonction
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!enabled) return

    const updateData = async () => {
      const now = Date.now()
      
      // Éviter les mises à jour trop fréquentes
      if (now - lastUpdateRef.current < 5000) {
        return
      }
      
      lastUpdateRef.current = now
      
      try {
        console.log('🔄 Mise à jour intelligente des données...')
        
        // Vérifier seulement les données critiques
        const [penaltiesResponse, claimsResponse] = await Promise.allSettled([
          fetch('/api/penalites'),
          fetch('/api/reclamations')
        ])
        
        // Si les requêtes échouent, on est déconnecté
        const isOnline = penaltiesResponse.status === 'fulfilled' && 
                        claimsResponse.status === 'fulfilled'
        
        setIsConnected(isOnline)
        
        if (isOnline && onUpdateRef.current) {
          onUpdateRef.current()
        }
        
      } catch (error) {
        console.error('Erreur mise à jour temps réel:', error)
        setIsConnected(false)
      }
    }

    // Mise à jour initiale
    updateData()

    // Mise à jour périodique
    intervalRef.current = setInterval(updateData, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval])

  return { isConnected }
}
