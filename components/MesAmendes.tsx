"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText, Calendar, MapPin, Euro, ExternalLink } from "lucide-react"
import { fetchWithAuth } from "@/lib/authManager"

interface Amende {
  id: number
  vehicule_id: number
  matricule: string
  marque: string
  modele: string
  date_amende: string
  date_infraction: string
  numero_amende: string
  type_infraction: string
  lieu_infraction: string
  montant: number
  pdf_url: string
  pdf_filename: string
  description: string
}

interface MesAmendesProps {
  employeId: number
}

export function MesAmendes({ employeId }: MesAmendesProps) {
  const [amendes, setAmendes] = useState<Amende[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAmendes = async () => {
      try {
        setLoading(true)
        const response = await fetchWithAuth(`/api/amendes-vehicules?employe_id=${employeId}`)
        if (!response.ok) throw new Error('Erreur lors du chargement')
        const data = await response.json()
        setAmendes(data.amendes || [])
      } catch (err) {
        console.error('Erreur chargement amendes:', err)
        setError('Impossible de charger les amendes')
      } finally {
        setLoading(false)
      }
    }

    if (employeId) {
      loadAmendes()
    }
  }, [employeId])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-3 text-gray-500">Chargement des amendes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Mes Amendes
        </CardTitle>
        <CardDescription>
          {amendes.length === 0 
            ? "Vous n'avez aucune amende enregistrée" 
            : `${amendes.length} amende(s) enregistrée(s)`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {amendes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucune amende à afficher</p>
          </div>
        ) : (
          <div className="space-y-4">
            {amendes.map((amende) => (
              <div
                key={amende.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* En-tête avec type */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {amende.type_infraction}
                      </span>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {amende.date_amende 
                            ? new Date(amende.date_amende).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </span>
                      </div>
                      
                      {amende.lieu_infraction && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{amende.lieu_infraction}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Euro className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-red-600">
                          {amende.montant ? parseFloat(String(amende.montant)).toFixed(2) : '0.00'} €
                        </span>
                      </div>

                      {amende.matricule && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {amende.matricule}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {amende.description && (
                      <p className="text-sm text-gray-500 mt-2 border-l-2 border-gray-200 pl-2">
                        {amende.description}
                      </p>
                    )}
                  </div>

                  {/* Bouton PDF */}
                  {amende.pdf_url && (
                    <div className="flex-shrink-0">
                      <a
                        href={amende.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Voir le PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Numéro d'amende */}
                {amende.numero_amende && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      N° {amende.numero_amende}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
