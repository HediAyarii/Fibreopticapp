"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, CheckCircle, Plus, Edit, Trash2 } from "lucide-react"

// PenaltyForm component
export function PenaltyForm({ penalty, employees, interventions, onSave, onCancel }: { 
  penalty: any, 
  employees: any[], 
  interventions: any[], 
  onSave: (data: any) => void, 
  onCancel: () => void 
}) {
  const [formData, setFormData] = useState({
    numero_penalite: penalty?.numero_penalite || '',
    employe_id: penalty?.employe_id || '',
    motif: penalty?.motif || '',
    montant: penalty?.montant || '',
    date_attribution: penalty?.date_attribution || new Date().toISOString().split('T')[0],
    manager_approbateur: penalty?.manager_approbateur || '',
    commentaires: penalty?.commentaires || '',
    reclamation_concernee: penalty?.reclamation_concernee || '',
    materiel_concerne: penalty?.materiel_concerne || '',
    num_inter: penalty?.num_inter || '',
    auto_calculate: penalty?.auto_calculate || false,
    j_plus_1: penalty?.j_plus_1 || false,
    j_plus_n: penalty?.j_plus_n || false
  })

  const [selectedIntervention, setSelectedIntervention] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const submitData = {
      ...formData,
      type_penalite: 'dossier_non_cloture', // Always dossier non clôturé
      intervention_concernee: selectedIntervention?.id || null
    }
    onSave(submitData)
  }

  const handleChange = (field: string, value: any) => {
    let newFormData = { ...formData, [field]: value }
    
    // Auto-calculate penalty based on checkboxes
    if (field === 'j_plus_1' && value) {
      newFormData.j_plus_n = false
      newFormData.montant = '60'
      newFormData.motif = 'Dossier clôturé à J+1'
    } else if (field === 'j_plus_n' && value) {
      newFormData.j_plus_1 = false
      newFormData.montant = '140'
      newFormData.motif = 'Dossier clôturé à J+n'
    } else if (field === 'j_plus_1' && !value && field === 'j_plus_n' && !value) {
      newFormData.montant = ''
      newFormData.motif = ''
    }
    
    setFormData(newFormData)
  }

  const handleInterventionSelect = (intervention: any) => {
    setSelectedIntervention(intervention)
    setFormData(prev => ({
      ...prev,
      num_inter: intervention.num_inter,
      employe_id: intervention.employe_id || ''
    }))
    setShowDropdown(false)
  }

  const searchInterventions = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/interventions/search?q=${encodeURIComponent(searchTerm)}&limit=10`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.interventions)
        setShowDropdown(data.interventions.length > 0)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    } catch (error) {
      console.error('Erreur lors de la recherche d\'interventions:', error)
      setSearchResults([])
      setShowDropdown(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInterventionInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, num_inter: value }))
    
    // Si on efface le champ, réinitialiser la sélection
    if (!value) {
      setSelectedIntervention(null)
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    // Rechercher les interventions avec un délai pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      searchInterventions(value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  // Fermer la liste déroulante quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {penalty ? 'Modifier la Pénalité' : 'Nouvelle Pénalité'}
        </DialogTitle>
        <DialogDescription>
          {penalty ? 'Modifiez les informations de la pénalité' : 'Créez une nouvelle pénalité'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="numero_penalite">Numéro de Pénalité</Label>
            <Input
              id="numero_penalite"
              value={formData.numero_penalite}
              onChange={(e) => handleChange('numero_penalite', e.target.value)}
              placeholder="Laissé vide pour génération automatique"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laissez vide pour génération automatique (PEN-YYYY-NNNN)
            </p>
          </div>
          <div>
            <Label>Type de Pénalité</Label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-sm font-medium text-gray-800">
                Dossier Non Clôturé
              </div>
              <div className="text-xs text-gray-600">
                Type fixe pour les pénalités
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="num_inter">Recherche par Numéro d'Intervention</Label>
          <div className="space-y-2 relative" ref={dropdownRef}>
            <div className="relative">
              <Input
                value={formData.num_inter}
                onChange={(e) => handleInterventionInputChange(e.target.value)}
                placeholder="Entrez le numéro d'intervention..."
                className="pr-8"
              />
              {isSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {/* Liste déroulante des résultats */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((intervention) => (
                  <div
                    key={intervention.id}
                    onClick={() => handleInterventionSelect(intervention)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {intervention.num_inter}
                        </div>
                        <div className="text-xs text-gray-600">
                          Client: {intervention.client}
                        </div>
                        <div className="text-xs text-gray-500">
                          Technicien: {intervention.prenom_technicien} {intervention.nom_technicien}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        <div>{new Date(intervention.date_rdv).toLocaleDateString('fr-FR')}</div>
                        <div className="capitalize">{intervention.statut}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Message si aucune intervention trouvée */}
            {showDropdown && searchResults.length === 0 && !isSearching && formData.num_inter.length >= 2 && (
              <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg p-3">
                <div className="text-sm text-gray-500 text-center">
                  Aucune intervention trouvée pour "{formData.num_inter}"
                </div>
              </div>
            )}
          </div>
          
          {/* Intervention sélectionnée */}
          {selectedIntervention && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-2">
              <div className="text-sm font-medium text-blue-800">
                Intervention sélectionnée: {selectedIntervention.num_inter}
              </div>
              <div className="text-xs text-blue-600">
                Client: {selectedIntervention.client} | Technicien: {selectedIntervention.prenom_technicien} {selectedIntervention.nom_technicien}
              </div>
              <div className="text-xs text-blue-500">
                Date RDV: {new Date(selectedIntervention.date_rdv).toLocaleDateString('fr-FR')} | Statut: {selectedIntervention.statut}
              </div>
            </div>
          )}
        </div>

        <div>
          <Label>Calcul Automatique de la Pénalité</Label>
          <div className="space-y-3 p-4 border border-gray-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="j_plus_1"
                checked={formData.j_plus_1}
                onCheckedChange={(checked) => handleChange('j_plus_1', checked)}
              />
              <Label htmlFor="j_plus_1" className="text-sm font-medium">
                J+1 (60€)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="j_plus_n"
                checked={formData.j_plus_n}
                onCheckedChange={(checked) => handleChange('j_plus_n', checked)}
              />
              <Label htmlFor="j_plus_n" className="text-sm font-medium">
                J+n (140€)
              </Label>
            </div>
            {(formData.j_plus_1 || formData.j_plus_n) && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-sm font-medium text-green-800">
                  Montant: {formData.montant}€
                </div>
                <div className="text-xs text-green-600">
                  Motif: {formData.motif}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="employe_id">Employé Concerné</Label>
            <Select value={formData.employe_id} onValueChange={(value) => handleChange('employe_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.prenom} {emp.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date_attribution">Date d'Attribution *</Label>
            <Input
              id="date_attribution"
              type="date"
              value={formData.date_attribution}
              onChange={(e) => handleChange('date_attribution', e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Date à laquelle la pénalité a été attribuée
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="manager_approbateur">Manager Approbateur</Label>
          <Input
            id="manager_approbateur"
            value={formData.manager_approbateur}
            onChange={(e) => handleChange('manager_approbateur', e.target.value)}
            placeholder="Nom du manager approbateur"
          />
        </div>

        <div>
          <Label htmlFor="commentaires">Commentaires</Label>
          <Textarea
            id="commentaires"
            value={formData.commentaires}
            onChange={(e) => handleChange('commentaires', e.target.value)}
            placeholder="Commentaires supplémentaires..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit">
            {penalty ? 'Modifier' : 'Créer'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

// ArticlesEditModal component
interface ArticleItem {
  code: string
  quantity: number
}

export function ArticlesEditModal({
  isOpen,
  onClose,
  intervention,
  onSave
}: {
  isOpen: boolean
  onClose: () => void
  intervention: any
  onSave: (id: number, articles: string) => Promise<void>
}) {
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [newArticleCode, setNewArticleCode] = useState('')
  const [newArticleQuantity, setNewArticleQuantity] = useState(1)
  const [saving, setSaving] = useState(false)

  // Liste des codes d'articles courants (basée sur votre base de données)
  const commonArticleCodes = [
    'CLEM',
    'RACPAV',
    'RECOIP',
    'RACIH',
    'SAV',
    'DEP_OFFE',
    'CABLE_PAV_1',
    'CABLE_PAV_2',
    'CABLE_PAV_3',
    'CABLE_PAV_4',
    'CABLE_PAV_SL',
    'DE_JAR1',
    'RACPRO_S',
    'RACPRO_C',
    'REPFOU_PRI',
    'REPFOU_ASPHA',
    'REPFOU_PUB',
    'REFRAC',
    'REF_DGR',
    'DEMO',
    'DEP_TORT',
    'SWAP_EQT'
  ]

  useEffect(() => {
    if (intervention?.articles && intervention.articles.toLowerCase() !== 'nan') {
      // Parser les articles existants (format: "CODE x QUANTITÉ,CODE x QUANTITÉ")
      const parsed = intervention.articles.split(',').map((item: string) => {
        const parts = item.trim().split(' x ')
        return {
          code: parts[0]?.trim() || '',
          quantity: parseInt(parts[1]) || 1
        }
      }).filter((item: ArticleItem) => item.code && item.code !== '')
      setArticles(parsed)
    } else {
      setArticles([])
    }
  }, [intervention])

  const addArticle = () => {
    if (!newArticleCode.trim()) return
    
    // Vérifier si l'article existe déjà
    const existingIndex = articles.findIndex(a => a.code.toUpperCase() === newArticleCode.toUpperCase())
    
    if (existingIndex >= 0) {
      // Si existe, augmenter la quantité
      const updated = [...articles]
      updated[existingIndex].quantity += newArticleQuantity
      setArticles(updated)
    } else {
      // Sinon, ajouter un nouvel article
      setArticles([...articles, {
        code: newArticleCode.toUpperCase(),
        quantity: newArticleQuantity
      }])
    }
    
    // Réinitialiser le formulaire
    setNewArticleCode('')
    setNewArticleQuantity(1)
  }

  const removeArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return
    const updated = [...articles]
    updated[index].quantity = quantity
    setArticles(updated)
  }

  const handleSave = async () => {
    if (!intervention?.id) return
    
    setSaving(true)
    try {
      // Convertir les articles au format "CODE x QUANTITÉ,CODE x QUANTITÉ"
      const articlesString = articles.map(a => `${a.code} x${a.quantity}`).join(',')
      await onSave(intervention.id, articlesString)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les Articles - {intervention?.num_inter}</DialogTitle>
          <DialogDescription>
            Ajoutez ou modifiez les articles utilisés lors de cette intervention
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations intervention */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-sm text-blue-900 mb-2">📋 Informations de l'intervention</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Client:</span> <span className="text-gray-900">{intervention?.client}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Technicien:</span> <span className="text-gray-900">{intervention?.prenom_technicien} {intervention?.nom_technicien}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date RDV:</span> <span className="text-gray-900">{intervention?.date_rdv}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Statut:</span> <span className="text-gray-900">{intervention?.statut}</span>
              </div>
            </div>
          </div>

          {/* Formulaire d'ajout d'article */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-sm text-gray-700 mb-3">➕ Ajouter un article</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="article-code" className="text-xs">Code Article</Label>
                <div className="relative">
                  <Input
                    id="article-code"
                    list="article-codes"
                    value={newArticleCode}
                    onChange={(e) => setNewArticleCode(e.target.value.toUpperCase())}
                    placeholder="Ex: CLEM, RACPAV, SAV..."
                    className="mt-1 uppercase"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addArticle()
                      }
                    }}
                  />
                  <datalist id="article-codes">
                    {commonArticleCodes.map(code => (
                      <option key={code} value={code} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="w-32">
                <Label htmlFor="article-quantity" className="text-xs">Quantité</Label>
                <Input
                  id="article-quantity"
                  type="number"
                  min="1"
                  value={newArticleQuantity}
                  onChange={(e) => setNewArticleQuantity(parseInt(e.target.value) || 1)}
                  className="mt-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addArticle()
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={addArticle}
                  disabled={!newArticleCode.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tapez le code de l'article ou sélectionnez-le dans la liste déroulante
            </p>
          </div>

          {/* Liste des articles ajoutés */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">📦 Articles ajoutés ({articles.length})</h4>
            {articles.length === 0 ? (
              <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">Aucun article ajouté</p>
                <p className="text-xs mt-1">Utilisez le formulaire ci-dessus pour ajouter des articles</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {articles.map((article, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex-1 font-mono font-medium text-gray-900">
                      {article.code}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">x</Label>
                      <Input
                        type="number"
                        min="1"
                        value={article.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeArticle(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aperçu du format final */}
          {articles.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-xs text-green-800 mb-1">✅ Aperçu final (format base de données)</h4>
              <code className="text-xs text-green-900 break-all">
                {articles.map(a => `${a.code} x${a.quantity}`).join(',')}
              </code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving || articles.length === 0}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sauvegarder ({articles.length} article{articles.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
