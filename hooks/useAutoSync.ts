"use client"

import { useState, useEffect, useCallback } from 'react'

interface UseAutoSyncOptions {
  fetchFunction: () => Promise<any>
  dependencies?: any[]
  syncEvents?: string[]
}

export function useAutoSync<T>({
  fetchFunction,
  dependencies = [],
  syncEvents = ['material-assignment-updated', 'material-updated', 'employee-updated']
}: UseAutoSyncOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFunction()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
      console.error('Erreur lors du chargement des données:', err)
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    // Écouter les événements de synchronisation
    const handleSync = () => {
      console.log('🔄 Synchronisation automatique déclenchée')
      fetchData()
    }

    // Ajouter les écouteurs d'événements
    syncEvents.forEach(eventName => {
      window.addEventListener(eventName, handleSync)
    })

    // Nettoyer les écouteurs
    return () => {
      syncEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleSync)
      })
    }
  }, [fetchData, syncEvents])

  const triggerSync = useCallback(() => {
    fetchData()
  }, [fetchData])

  const triggerGlobalSync = useCallback(() => {
    // Déclencher un événement global pour synchroniser toutes les composants
    syncEvents.forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName))
    })
  }, [syncEvents])

  return {
    data,
    loading,
    error,
    triggerSync,
    triggerGlobalSync
  }
}

// Hook spécialisé pour les affectations de matériel
export function useAffectationsAutoSync() {
  const fetchAffectations = useCallback(async () => {
    const response = await fetch('/api/affectations-materiel')
    if (!response.ok) throw new Error('Erreur lors du chargement des affectations')
    const data = await response.json()
    return data.affectations || []
  }, [])

  return useAutoSync({
    fetchFunction: fetchAffectations,
    syncEvents: ['material-assignment-updated', 'material-updated', 'employee-updated']
  })
}

// Hook spécialisé pour les valeurs par employé
export function useEmployeeMaterialValueAutoSync() {
  const fetchEmployeeValues = useCallback(async () => {
    const response = await fetch('/api/employee-material-value')
    if (!response.ok) throw new Error('Erreur lors du chargement des valeurs employés')
    const data = await response.json()
    return data.employeeValues || []
  }, [])

  return useAutoSync({
    fetchFunction: fetchEmployeeValues,
    syncEvents: ['material-assignment-updated', 'material-updated', 'employee-updated']
  })
}
