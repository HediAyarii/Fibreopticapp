"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Plus, 
  RefreshCw,
  Calendar,
  User,
  FileText,
  AlertCircle
} from 'lucide-react'

interface HistoriqueEntry {
  id: number
  user_id: number | null
  user_name: string | null
  action: string
  table_name: string
  record_id: number | null
  section: string | null
  description: string | null
  old_values: any
  new_values: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export function HistoriqueManager() {
  const [historiques, setHistoriques] = useState<HistoriqueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterSection, setFilterSection] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadHistoriques()
  }, [filterAction, filterSection, startDate, endDate])

  const loadHistoriques = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filterAction !== 'all') params.append('action', filterAction)
      if (filterSection !== 'all') params.append('section', filterSection)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('limit', '200')

      const response = await fetch(`/api/historiques?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setHistoriques(data.historiques || [])
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      'CREATE': { label: 'Création', className: 'bg-green-500/20 text-green-400 border-green-500/50' },
      'UPDATE': { label: 'Modification', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      'DELETE': { label: 'Suppression', className: 'bg-red-500/20 text-red-400 border-red-500/50' },
      'LOGIN': { label: 'Connexion', className: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      'LOGOUT': { label: 'Déconnexion', className: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
    }
    const badge = badges[action] || { label: action, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' }
    return (
      <Badge variant="outline" className={`${badge.className} font-medium`}>
        {badge.label}
      </Badge>
    )
  }

  const getActionIcon = (action: string) => {
    const icons: Record<string, React.ReactNode> = {
      'CREATE': <Plus className="w-4 h-4 text-green-400" />,
      'UPDATE': <Edit className="w-4 h-4 text-blue-400" />,
      'DELETE': <Trash2 className="w-4 h-4 text-red-400" />,
    }
    return icons[action] || <FileText className="w-4 h-4 text-gray-400" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const filteredHistoriques = historiques.filter(h => {
    const searchLower = searchTerm.toLowerCase()
    return (
      h.description?.toLowerCase().includes(searchLower) ||
      h.user_name?.toLowerCase().includes(searchLower) ||
      h.section?.toLowerCase().includes(searchLower) ||
      h.table_name.toLowerCase().includes(searchLower)
    )
  })

  const getSections = () => {
    const sections = new Set(historiques.map(h => h.section).filter(Boolean))
    return Array.from(sections).sort()
  }

  const clearFilters = () => {
    setFilterAction('all')
    setFilterSection('all')
    setStartDate('')
    setEndDate('')
    setSearchTerm('')
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Filter className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Filtres</CardTitle>
              <CardDescription>Affiner la recherche dans l'historique</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre Action */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les actions</SelectItem>
                  <SelectItem value="CREATE">Création</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Suppression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sections</SelectItem>
                  {getSections().map(section => (
                    <SelectItem key={section} value={section!}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Début */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="glass-card"
            >
              Réinitialiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadHistoriques}
              className="glass-card"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste de l'historique */}
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Historique des Actions</CardTitle>
                <CardDescription>
                  {filteredHistoriques.length} entrée(s) trouvée(s)
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement de l'historique...</p>
            </div>
          ) : filteredHistoriques.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune entrée trouvée</h3>
              <p>Aucun historique ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredHistoriques.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-white/5 rounded-lg">
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getActionBadge(entry.action)}
                          {entry.section && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              {entry.section}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {entry.table_name}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium">{entry.description || 'Action sans description'}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{entry.user_name || 'Utilisateur inconnu'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(entry.created_at)}</span>
                          </div>
                          {entry.ip_address && (
                            <span className="font-mono">{entry.ip_address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
