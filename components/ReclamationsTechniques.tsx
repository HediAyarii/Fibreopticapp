'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { MessageSquare, AlertCircle, CheckCircle, XCircle, Clock, DollarSign, Plus, Package, Trash2, RefreshCw, Edit } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import ConfirmationsMontants from './ConfirmationsMontants';
import { ArticlesEditModal } from './PenaltyAndArticlesForms';

interface Reclamation {
  id: number;
  intervention_id: number | null;
  num_inter: string;
  technicien_id: number | null;
  nom_technicien: string;
  prenom_technicien: string;
  type_reclamation: string;
  description: string;
  reponse_admin: string | null;
  statut: string;
  date_creation: string;
  date_resolution: string | null;
  date_intervention: string | null;
  created_at: string;
  updated_at: string;
}

interface InterventionDetails {
  id: number;
  num_inter: string;
  articles: string | null;
  client: string;
  date_rdv: string | null;
  statut: string;
  grille: string | null;
  type_intervention: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  article_manquant: 'Article Manquant',
  probleme_technique: 'Problème Technique',
  erreur_grille: 'Erreur Grille',
  autre: 'Autre',
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  en_cours: 'bg-blue-100 text-blue-800 border-blue-300',
  resolu: 'bg-green-100 text-green-800 border-green-300',
  rejete: 'bg-red-100 text-red-800 border-red-300',
};

const STATUT_ICONS: Record<string, React.ReactNode> = {
  en_attente: <Clock className="w-4 h-4" />,
  en_cours: <MessageSquare className="w-4 h-4" />,
  resolu: <CheckCircle className="w-4 h-4" />,
  rejete: <XCircle className="w-4 h-4" />,
};

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En Attente',
  en_cours: 'En Cours',
  resolu: 'Résolu',
  rejete: 'Rejeté',
};

export default function ReclamationsTechniques() {
  const [activeTab, setActiveTab] = useState<'reclamations' | 'confirmations'>('reclamations');
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reponseAdmin, setReponseAdmin] = useState('');
  const [updating, setUpdating] = useState(false);

  // Montant Confirmé states
  const [showMontantSection, setShowMontantSection] = useState(false);
  const [montantConfirmations, setMontantConfirmations] = useState<any[]>([]);
  const [loadingMontant, setLoadingMontant] = useState(false);

  // Filtres
  const [filtreStatut, setFiltreStatut] = useState('all');
  const [filtreType, setFiltreType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [dateDebutTemp, setDateDebutTemp] = useState("");
  const [dateFinTemp, setDateFinTemp] = useState("");

  // États pour l'ajout d'articles (nouvelle modal simplifiée)
  const [showArticlesModal, setShowArticlesModal] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<any>(null);
  const [articlesText, setArticlesText] = useState('');
  const [savingArticles, setSavingArticles] = useState(false);
  
  // Anciens états pour l'ajout d'articles (conservés pour compatibilité)
  const [interventionDetails, setInterventionDetails] = useState<InterventionDetails | null>(null);
  const [interventionsMap, setInterventionsMap] = useState<Record<string, InterventionDetails>>({});
  const [showAddArticlesDialog, setShowAddArticlesDialog] = useState(false);
  const [articles, setArticles] = useState<{code: string, quantity: number}[]>([]);
  const [newArticleCode, setNewArticleCode] = useState('');
  const [newArticleQuantity, setNewArticleQuantity] = useState(1);
  const [loadingIntervention, setLoadingIntervention] = useState(false);

  const { socket, isConnected } = useSocket();

  // Calculer les réclamations filtrées avec useMemo (évite les re-renders)
  const filteredReclamations = useMemo(() => {
    let filtered = [...reclamations];

    if (filtreStatut !== 'all') {
      filtered = filtered.filter((r) => r.statut === filtreStatut);
    }

    if (filtreType !== 'all') {
      filtered = filtered.filter((r) => r.type_reclamation === filtreType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.num_inter.toLowerCase().includes(term) ||
          r.nom_technicien.toLowerCase().includes(term) ||
          r.prenom_technicien.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [reclamations, filtreStatut, filtreType, searchTerm]);

  // Chargement initial
  useEffect(() => {
    fetchReclamations();
  }, [dateDebut, dateFin]);

  // Écouter les événements Socket.IO en temps réel
  useEffect(() => {
    if (!socket) return;

    console.log('🔌 Écoute des événements réclamations techniques');

    // Nouvelle réclamation créée
    const handleNewReclamation = (newReclamation: Reclamation) => {
      console.log('✨ Nouvelle réclamation reçue:', newReclamation);
      setReclamations((prev) => [newReclamation, ...prev]);
    };

    // Réclamation mise à jour
    const handleUpdatedReclamation = (updatedReclamation: Reclamation) => {
      console.log('🔄 Réclamation mise à jour:', updatedReclamation);
      setReclamations((prev) =>
        prev.map((r) => (r.id === updatedReclamation.id ? updatedReclamation : r))
      );
      
      // Mettre à jour la réclamation sélectionnée si c'est celle-ci
      setSelectedReclamation((current) => 
        current?.id === updatedReclamation.id ? updatedReclamation : current
      );
    };

    socket.on('reclamation_technique_created', handleNewReclamation);
    socket.on('reclamation_technique_updated', handleUpdatedReclamation);

    // Cleanup
    return () => {
      socket.off('reclamation_technique_created', handleNewReclamation);
      socket.off('reclamation_technique_updated', handleUpdatedReclamation);
    };
  }, [socket]); // ← Seulement socket, pas selectedReclamation

  const fetchReclamations = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (dateDebut) params.append('date_debut', dateDebut);
      if (dateFin) params.append('date_fin', dateFin);
      
      const url = params.toString() 
        ? `/api/reclamations-techniques?${params.toString()}`
        : '/api/reclamations-techniques';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setReclamations(data.reclamations || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réclamations:', error);
    } finally {
      setLoading(false);
    }
  }, [dateDebut, dateFin]); // ← Mémorisé avec dateDebut et dateFin

  const handleAppliquerFiltres = () => {
    setDateDebut(dateDebutTemp);
    setDateFin(dateFinTemp);
  };

  const handleResetDates = () => {
    setDateDebutTemp('');
    setDateFinTemp('');
    setDateDebut('');
    setDateFin('');
  };

  // Charger les détails de l'intervention
  const fetchInterventionDetails = async (interventionId: number | null, numInter: string) => {
    setLoadingIntervention(true);
    try {
      // Nettoyer: retirer # et espaces
      const cleanNumInter = numInter.replace(/^#/, '').trim();
      console.log('Recherche intervention:', cleanNumInter, 'intervention_id:', interventionId);
      
      // Chercher par intervention_id si disponible, sinon par num_inter
      const url = interventionId 
        ? `/api/interventions?id=${interventionId}`
        : `/api/interventions?num_inter=${encodeURIComponent(cleanNumInter)}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Résultat API:', data);
      
      if (data.success && data.interventions.length > 0) {
        // Si plusieurs résultats, trouver celui qui correspond à l'intervention_id
        let details = data.interventions[0];
        if (interventionId && data.interventions.length > 1) {
          const match = data.interventions.find((i: any) => i.id === interventionId);
          if (match) details = match;
        }
        setInterventionDetails(details);
        // Stocker dans la map pour affichage dans la liste
        setInterventionsMap(prev => ({
          ...prev,
          [numInter]: details
        }));
        return details;
      } else {
        console.error('Intervention non trouvée:', cleanNumInter);
        // Créer un objet fictif pour permettre l'ajout d'articles quand même
        const fictiveIntervention: InterventionDetails = {
          id: 0,
          num_inter: cleanNumInter,
          articles: null,
          client: 'N/A',
          date_rdv: null,
          statut: 'N/A',
          grille: null,
          type_intervention: null
        };
        setInterventionDetails(fictiveIntervention);
        alert(`⚠️ Intervention ${cleanNumInter} non trouvée dans la base.\nVous pouvez quand même ajouter des articles, mais l'intervention n'existe pas encore dans le système.`);
        return fictiveIntervention;
      }
    } catch (error) {
      console.error('Erreur chargement intervention:', error);
      alert('Erreur lors du chargement de l\'intervention');
      return null;
    } finally {
      setLoadingIntervention(false);
    }
  };

  // Ajouter des articles à l'intervention
  const handleAddArticles = async () => {
    if (!interventionDetails || articles.length === 0) {
      alert('Veuillez ajouter au moins un article');
      return;
    }

    try {
      setSavingArticles(true);
      
      // Si l'intervention n'existe pas (id = 0), on ne peut pas sauvegarder
      if (interventionDetails.id === 0) {
        alert('⚠️ Impossible de sauvegarder les articles.\nL\'intervention n\'existe pas dans la base de données.\nVeuillez d\'abord importer cette intervention.');
        setSavingArticles(false);
        return;
      }
      
      const currentArticles = interventionDetails.articles || '';
      const newArticlesStr = articles.map(a => `${a.code} x${a.quantity}`).join(',');
      const updatedArticles = currentArticles 
        ? `${currentArticles},${newArticlesStr}`
        : newArticlesStr;

      const response = await fetch('/api/interventions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: interventionDetails.id,
          articles: updatedArticles,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setInterventionDetails({ ...interventionDetails, articles: updatedArticles });
        setArticles([]);
        setNewArticleCode('');
        setNewArticleQuantity(1);
        setShowAddArticlesDialog(false);
        alert('Articles ajoutés avec succès');
        // Rafraîchir les réclamations pour mettre à jour l'affichage
        fetchReclamations();
      } else {
        alert('Erreur lors de l\'ajout des articles');
      }
    } catch (error) {
      console.error('Erreur ajout articles:', error);
      alert('Erreur lors de l\'ajout des articles');
    } finally {
      setSavingArticles(false);
    }
  };

  const addArticle = () => {
    if (!newArticleCode.trim()) return;
    
    const existingIndex = articles.findIndex(a => a.code.toUpperCase() === newArticleCode.toUpperCase());
    
    if (existingIndex >= 0) {
      const updated = [...articles];
      updated[existingIndex].quantity += newArticleQuantity;
      setArticles(updated);
    } else {
      setArticles([...articles, {
        code: newArticleCode.toUpperCase(),
        quantity: newArticleQuantity
      }]);
    }
    
    setNewArticleCode('');
    setNewArticleQuantity(1);
  };

  const removeArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...articles];
    updated[index].quantity = Math.max(1, quantity);
    setArticles(updated);
  };

  const handleOpenDialog = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setReponseAdmin(reclamation.reponse_admin || '');
    setDialogOpen(true);
  };

  // Fonction pour ouvrir la modal d'édition des articles
  const handleOpenArticlesModal = async (reclamation: Reclamation) => {
    try {
      const cleanNumInter = reclamation.num_inter.replace(/^#/, '').trim();
      
      // Chercher l'intervention par intervention_id si disponible, sinon par num_inter
      let url: string;
      if (reclamation.intervention_id) {
        url = `/api/interventions?id=${reclamation.intervention_id}`;
      } else {
        url = `/api/interventions?num_inter=${encodeURIComponent(cleanNumInter)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.interventions && data.interventions.length > 0) {
        // Si on a cherché par num_inter et il y a plusieurs résultats,
        // essayer de trouver celle qui correspond au bon intervention_id
        let intervention = data.interventions[0];
        if (reclamation.intervention_id && data.interventions.length > 1) {
          const match = data.interventions.find((i: any) => i.id === reclamation.intervention_id);
          if (match) intervention = match;
        }
        
        setEditingIntervention(intervention);
        
        // Nettoyer les articles pour l'édition
        const cleanArticles = intervention.articles && intervention.articles.toString().toLowerCase() !== 'nan' 
          ? intervention.articles 
          : "";
        setArticlesText(cleanArticles);
        setShowArticlesModal(true);
      } else {
        alert(`⚠️ Intervention ${cleanNumInter} non trouvée dans la base de données.`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'intervention:', error);
      alert('Erreur lors du chargement de l\'intervention');
    }
  };

  // Fonction pour sauvegarder les articles (compatible avec ArticlesEditModal)
  const handleSaveArticles = async (id: number, articles: string) => {
    setSavingArticles(true);
    try {
      const cleanArticles = articles.trim() === '' || articles.toLowerCase() === 'nan' ? '' : articles.trim();
      
      console.log('🔍 Sauvegarde articles:', { id, articles: cleanArticles });
      
      const response = await fetch('/api/interventions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          articles: cleanArticles
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Réponse serveur:', data);
        alert('✅ Articles mis à jour avec succès');
        setShowArticlesModal(false);
        setEditingIntervention(null);
        setArticlesText('');
        
        // Rafraîchir les réclamations pour mettre à jour l'affichage
        await fetchReclamations();
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur serveur:', errorData);
        alert('❌ Erreur lors de la mise à jour des articles');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des articles:', error);
      alert('❌ Erreur lors de la sauvegarde des articles');
    } finally {
      setSavingArticles(false);
    }
  };

  const handleCancelArticles = () => {
    setShowArticlesModal(false);
    setEditingIntervention(null);
    setArticlesText('');
  };

  const handleUpdateStatut = async (nouveauStatut: string) => {
    if (!selectedReclamation) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/reclamations-techniques', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReclamation.id,
          statut: nouveauStatut,
          reponse_admin: reponseAdmin || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Émettre l'événement Socket.IO pour mise à jour en temps réel
        if (socket && data.reclamation) {
          socket.emit('reclamation_technique_updated', data.reclamation)
          console.log('✅ Événement Socket.IO émis depuis le client admin (statut):', data.reclamation)
        }
        
        await fetchReclamations();
        setDialogOpen(false);
        setSelectedReclamation(null);
        setReponseAdmin('');
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveReponse = async () => {
    if (!selectedReclamation) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/reclamations-techniques', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReclamation.id,
          statut: 'en_cours',
          reponse_admin: reponseAdmin,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Émettre l'événement Socket.IO pour mise à jour en temps réel
        if (socket) {
          socket.emit('reclamation_technique_updated', data.reclamation)
          console.log('✅ Événement Socket.IO émis depuis le client (update):', data.reclamation)
        }
        
        await fetchReclamations();
        alert('Réponse enregistrée avec succès');
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setUpdating(false);
    }
  };

  const stats = {
    total: reclamations.length,
    en_attente: reclamations.filter((r) => r.statut === 'en_attente').length,
    en_cours: reclamations.filter((r) => r.statut === 'en_cours').length,
    resolu: reclamations.filter((r) => r.statut === 'resolu').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Chargement des réclamations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Réclamations Techniques</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            Gérez les réclamations des techniciens concernant les interventions
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Mise à jour automatique
            </span>
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('reclamations')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'reclamations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="inline-block h-4 w-4 mr-2" />
          Réclamations
        </button>
        <button
          onClick={() => setActiveTab('confirmations')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'confirmations'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="inline-block h-4 w-4 mr-2" />
          Confirmations Montants
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'reclamations' ? (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.en_attente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              En Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.en_cours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Résolus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.resolu}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Date Début</label>
                <Input
                  type="date"
                  value={dateDebutTemp}
                  onChange={(e) => setDateDebutTemp(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date Fin</label>
                <Input
                  type="date"
                  value={dateFinTemp}
                  onChange={(e) => setDateFinTemp(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_attente">En Attente</SelectItem>
                    <SelectItem value="en_cours">En Cours</SelectItem>
                    <SelectItem value="resolu">Résolu</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={filtreType} onValueChange={setFiltreType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="article_manquant">Article Manquant</SelectItem>
                    <SelectItem value="probleme_technique">Problème Technique</SelectItem>
                    <SelectItem value="erreur_grille">Erreur Grille</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Recherche</label>
                <Input
                  placeholder="N° inter, technicien, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAppliquerFiltres}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Appliquer les Filtres
              </Button>
              {(dateDebutTemp || dateFinTemp) && (
                <Button
                  onClick={handleResetDates}
                  variant="outline"
                  disabled={loading}
                >
                  Réinitialiser les Dates
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des réclamations */}
      <Card>
        <CardHeader>
          <CardTitle>
            Réclamations ({filteredReclamations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReclamations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune réclamation trouvée</p>
          ) : (
            <div className="space-y-4">
              {filteredReclamations.map((reclamation) => (
                <div
                  key={reclamation.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleOpenDialog(reclamation)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg">#{reclamation.num_inter}</span>
                        <Badge className={STATUT_COLORS[reclamation.statut]}>
                          <span className="flex items-center gap-1">
                            {STATUT_ICONS[reclamation.statut]}
                            {STATUT_LABELS[reclamation.statut]}
                          </span>
                        </Badge>
                        <Badge variant="outline">
                          {TYPE_LABELS[reclamation.type_reclamation]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Technicien:</span>{' '}
                        {reclamation.prenom_technicien} {reclamation.nom_technicien}
                      </p>
                      {(reclamation as any).articles && (
                        <div className="mt-2 mb-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">Articles:</p>
                          <div className="flex flex-wrap gap-1">
                            {(reclamation as any).articles.split(',').map((article: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                <Package className="w-3 h-3 mr-1" />
                                {article.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {reclamation.description}
                      </p>
                      {reclamation.reponse_admin && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <span className="font-medium text-blue-800">Réponse Admin:</span>{' '}
                          <span className="text-blue-700">{reclamation.reponse_admin}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className="text-right text-sm text-gray-500">
                        <p>{new Date(reclamation.date_creation).toLocaleDateString('fr-FR')}</p>
                        <p>{new Date(reclamation.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenArticlesModal(reclamation);
                        }}
                        className="h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Articles
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-[90vw] !w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Réclamation</DialogTitle>
          </DialogHeader>
          {selectedReclamation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">N° Intervention</label>
                  <p className="text-lg font-semibold">{selectedReclamation.num_inter}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Statut Réclamation</label>
                  <div className="mt-1">
                    <Badge className={STATUT_COLORS[selectedReclamation.statut]}>
                      <span className="flex items-center gap-1">
                        {STATUT_ICONS[selectedReclamation.statut]}
                        {STATUT_LABELS[selectedReclamation.statut]}
                      </span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p>{TYPE_LABELS[selectedReclamation.type_reclamation]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Technicien</label>
                  <p>
                    {selectedReclamation.prenom_technicien} {selectedReclamation.nom_technicien}
                  </p>
                </div>
                
                {/* Informations de l'intervention */}
                {(selectedReclamation as any).intervention_statut && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Statut Intervention</label>
                    <p className="font-medium text-blue-700">{(selectedReclamation as any).intervention_statut}</p>
                  </div>
                )}
                
                {(selectedReclamation as any).intervention_date_rdv && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date RDV</label>
                    <p>
                      {new Date((selectedReclamation as any).intervention_date_rdv).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Date Intervention</label>
                  <p>
                    {selectedReclamation.date_intervention 
                      ? new Date(selectedReclamation.date_intervention).toLocaleDateString('fr-FR')
                      : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de création</label>
                  <p>
                    {new Date(selectedReclamation.date_creation).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedReclamation.description}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">
                  Réponse de l'Admin
                </label>
                <Textarea
                  value={reponseAdmin}
                  onChange={(e) => setReponseAdmin(e.target.value)}
                  placeholder="Entrez votre réponse..."
                  rows={4}
                  className="w-full"
                />
              </div>

              {selectedReclamation.date_resolution && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Date de résolution</label>
                  <p>
                    {new Date(selectedReclamation.date_resolution).toLocaleString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={updating}
            >
              Annuler
            </Button>
            {selectedReclamation && selectedReclamation.statut !== 'resolu' && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleSaveReponse}
                  disabled={updating || !reponseAdmin}
                >
                  Enregistrer Réponse
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateStatut('rejete')}
                  disabled={updating}
                >
                  Rejeter
                </Button>
                <Button
                  onClick={() => handleUpdateStatut('resolu')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Marquer Résolu
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition des articles (nouvelle version simplifiée) */}
      <ArticlesEditModal
        isOpen={showArticlesModal}
        onClose={handleCancelArticles}
        intervention={editingIntervention}
        onSave={handleSaveArticles}
      />

      {/* Dialog Ajouter Articles */}
      <Dialog open={showAddArticlesDialog} onOpenChange={setShowAddArticlesDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les Articles - {interventionDetails?.num_inter}</DialogTitle>
            <p className="text-sm text-gray-500">Ajoutez des articles utilisés lors de cette intervention</p>
          </DialogHeader>
          {interventionDetails && (
            <div className="space-y-4">
              {/* Informations intervention */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-sm text-blue-900 mb-2">📋 Informations de l'intervention</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Client:</span> <span className="text-gray-900">{interventionDetails.client}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Statut:</span> <span className="text-gray-900">{interventionDetails.statut}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date RDV:</span>{' '}
                    <span className="text-gray-900">
                      {interventionDetails.date_rdv 
                        ? new Date(interventionDetails.date_rdv).toLocaleDateString('fr-FR')
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span> <span className="text-gray-900">{interventionDetails.type_intervention || 'N/A'}</span>
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
                        placeholder="Ex: CLEM, PTO, JARRETIERE..."
                        className="mt-1 uppercase"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addArticle();
                          }
                        }}
                      />
                      <datalist id="article-codes">
                        <option value="CLEM" />
                        <option value="PTO" />
                        <option value="JARRETIERE" />
                        <option value="CABLE_100M" />
                        <option value="CABLE_50M" />
                        <option value="SPLITTER" />
                        <option value="BOITIER" />
                        <option value="RACPAV" />
                        <option value="SAV" />
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
                          e.preventDefault();
                          addArticle();
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
                <h4 className="font-medium text-sm text-gray-700">📦 Articles à ajouter ({articles.length})</h4>
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

              {/* Articles actuels de l'intervention */}
              {interventionDetails.articles && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-xs text-gray-600 mb-2">📦 Articles actuels de l'intervention</h4>
                  <code className="text-xs text-gray-700 break-all">
                    {interventionDetails.articles}
                  </code>
                </div>
              )}

              {/* Aperçu du format final */}
              {articles.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-xs text-green-800 mb-1">✅ Articles qui seront ajoutés</h4>
                  <code className="text-xs text-green-900 break-all">
                    {articles.map(a => `${a.code} x${a.quantity}`).join(',')}
                  </code>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddArticlesDialog(false);
                setArticles([]);
                setNewArticleCode('');
                setNewArticleQuantity(1);
              }}
              disabled={savingArticles}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddArticles}
              disabled={savingArticles || articles.length === 0}
            >
              {savingArticles ? (
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
        </>
      ) : (
        <ConfirmationsMontants />
      )}
    </div>
  );
}
