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
import { MessageSquare, AlertCircle, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import ConfirmationsMontants from './ConfirmationsMontants';

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

  const handleOpenDialog = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setReponseAdmin(reclamation.reponse_admin || '');
    setDialogOpen(true);
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
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOpenDialog(reclamation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                    <div className="text-right text-sm text-gray-500 ml-4">
                      <p>{new Date(reclamation.date_creation).toLocaleDateString('fr-FR')}</p>
                      <p>{new Date(reclamation.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
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
                  <label className="text-sm font-medium text-gray-600">Statut</label>
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
        </>
      ) : (
        <ConfirmationsMontants />
      )}
    </div>
  );
}
