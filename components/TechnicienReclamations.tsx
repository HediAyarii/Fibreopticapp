'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, CheckCircle, XCircle, Clock, AlertCircle, Eye, Plus, Package } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface Reclamation {
  id: number;
  intervention_id: number | null;
  num_inter: string;
  type_reclamation: string;
  description: string;
  reponse_admin: string | null;
  statut: string;
  date_creation: string;
  date_resolution: string | null;
  date_intervention: string | null;
}

interface InterventionDetails {
  id: number;
  num_inter: string;
  articles: string;
  client: string;
  date_rdv: string;
  statut: string;
  grille: string;
  type_intervention: string;
}

interface TechnicienReclamationsProps {
  nomTechnicien: string;
  prenomTechnicien: string;
  technicienId?: number;
  dateDebut?: string;
  dateFin?: string;
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

export default function TechnicienReclamations({
  nomTechnicien,
  prenomTechnicien,
  technicienId,
  dateDebut,
  dateFin,
}: TechnicienReclamationsProps) {
  const { socket, isConnected } = useSocket();
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // États pour l'intervention
  const [interventionDetails, setInterventionDetails] = useState<InterventionDetails | null>(null);
  const [showInterventionDialog, setShowInterventionDialog] = useState(false);
  const [loadingIntervention, setLoadingIntervention] = useState(false);
  
  // États pour ajouter des articles
  const [showAddArticlesDialog, setShowAddArticlesDialog] = useState(false);
  const [newArticles, setNewArticles] = useState('');

  const fetchReclamations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        nom_technicien: nomTechnicien,
        prenom_technicien: prenomTechnicien,
      });

      if (technicienId) {
        params.append('technicien_id', technicienId.toString());
      }

      if (dateDebut) params.append('date_debut', dateDebut);
      if (dateFin) params.append('date_fin', dateFin);

      console.log('🔍 TechnicienReclamations: Chargement avec params:', {
        nomTechnicien,
        prenomTechnicien,
        technicienId,
        dateDebut,
        dateFin,
        url: `/api/reclamations-techniques?${params}`
      });

      const response = await fetch(`/api/reclamations-techniques?${params}`);
      const data = await response.json();

      console.log('📊 TechnicienReclamations: Réponse API:', {
        success: data.success,
        count: data.reclamations?.length || 0,
        reclamations: data.reclamations
      });

      if (data.success) {
        setReclamations(data.reclamations || []);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des réclamations:', error);
    } finally {
      setLoading(false);
    }
  }, [nomTechnicien, prenomTechnicien, technicienId, dateDebut, dateFin]);

  // Chargement initial
  useEffect(() => {
    fetchReclamations();
  }, [fetchReclamations]);

  // Écouter les événements personnalisés pour mise à jour instantanée
  useEffect(() => {
    const handleReclamationCreated = () => {
      console.log('🔔 Nouvelle réclamation détectée - Rechargement dans 500ms...')
      // Petit délai pour s'assurer que la DB est à jour
      setTimeout(() => {
        fetchReclamations()
      }, 500)
    }

    window.addEventListener('reclamationCreated', handleReclamationCreated)
    
    return () => {
      window.removeEventListener('reclamationCreated', handleReclamationCreated)
    }
  }, [fetchReclamations])

  // Écouter les événements Socket.IO pour les mises à jour
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket non disponible dans TechnicienReclamations');
      return;
    }

    console.log('🎧 TechnicienReclamations: Écoute des événements Socket.IO, socket connecté:', socket.connected);

    // Écouter la création de nouvelles réclamations
    const handleCreatedReclamation = (newReclamation: Reclamation) => {
      console.log('✨ [Socket.IO] Nouvelle réclamation créée:', newReclamation);
      fetchReclamations();
    };

    // Écouter les mises à jour de réclamations
    const handleUpdatedReclamation = (updatedReclamation: Reclamation) => {
      console.log('🔄 [Socket.IO] Réclamation mise à jour:', updatedReclamation);
      
      // Recharger toutes les réclamations pour recalculer les statistiques
      fetchReclamations();
      
      // Mettre à jour la réclamation sélectionnée si c'est celle-ci
      setSelectedReclamation((current) => 
        current?.id === updatedReclamation.id ? updatedReclamation : current
      );
    };

    // Écouter les notifications personnelles
    const handleNotification = (notification: any) => {
      console.log('📬 [Socket.IO] Notification reçue:', notification);
      if (notification.type === 'reclamation_technique') {
        fetchReclamations();
      }
    };

    socket.on('reclamation_technique_created', handleCreatedReclamation);
    socket.on('reclamation_technique_updated', handleUpdatedReclamation);
    socket.on('notification', handleNotification);

    console.log('✅ TechnicienReclamations: Listeners Socket.IO attachés');

    // Cleanup
    return () => {
      console.log('🧹 TechnicienReclamations: Nettoyage des listeners Socket.IO');
      socket.off('reclamation_technique_created', handleCreatedReclamation);
      socket.off('reclamation_technique_updated', handleUpdatedReclamation);
      socket.off('notification', handleNotification);
    };
  }, [socket, fetchReclamations]);

  // Charger les détails de l'intervention
  const fetchInterventionDetails = async (interventionId: number, numInter: string) => {
    setLoadingIntervention(true);
    try {
      // Enlever le # du num_inter pour la recherche
      const cleanNumInter = numInter.replace('#', '');
      const response = await fetch(`/api/interventions?numInter=${encodeURIComponent(cleanNumInter)}`);
      const data = await response.json();
      
      if (data.success && data.interventions.length > 0) {
        setInterventionDetails(data.interventions[0]);
        setShowInterventionDialog(true);
      } else {
        alert('Intervention non trouvée');
      }
    } catch (error) {
      console.error('Erreur chargement intervention:', error);
      alert('Erreur lors du chargement de l\'intervention');
    } finally {
      setLoadingIntervention(false);
    }
  };

  // Ajouter des articles à l'intervention
  const handleAddArticles = async () => {
    if (!interventionDetails || !newArticles.trim()) {
      alert('Veuillez saisir des articles');
      return;
    }

    try {
      const currentArticles = interventionDetails.articles || '';
      const updatedArticles = currentArticles 
        ? `${currentArticles},${newArticles.trim()}`
        : newArticles.trim();

      const response = await fetch('/api/interventions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: interventionDetails.id,
          articles: updatedArticles
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Articles ajoutés avec succès');
        setNewArticles('');
        setShowAddArticlesDialog(false);
        // Recharger les détails
        await fetchInterventionDetails(interventionDetails.id, interventionDetails.num_inter);
      } else {
        alert('❌ Erreur: ' + (data.error || 'Impossible d\'ajouter les articles'));
      }
    } catch (error) {
      console.error('Erreur ajout articles:', error);
      alert('❌ Erreur lors de l\'ajout des articles');
    }
  };

  const handleOpenDialog = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setDialogOpen(true);
  };

  const stats = {
    total: reclamations.length,
    en_attente: reclamations.filter((r) => r.statut === 'en_attente').length,
    en_cours: reclamations.filter((r) => r.statut === 'en_cours').length,
    resolu: reclamations.filter((r) => r.statut === 'resolu').length,
    rejete: reclamations.filter((r) => r.statut === 'rejete').length,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mes Réclamations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.en_attente}</p>
              <p className="text-xs text-gray-600">En Attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.en_cours}</p>
              <p className="text-xs text-gray-600">En Cours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.resolu}</p>
              <p className="text-xs text-gray-600">Résolus</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.rejete}</p>
              <p className="text-xs text-gray-600">Rejetés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des réclamations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Mes Réclamations ({reclamations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reclamations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune réclamation pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reclamations.map((reclamation) => (
                <div
                  key={reclamation.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleOpenDialog(reclamation)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{reclamation.num_inter}</span>
                        <Badge className={STATUT_COLORS[reclamation.statut]}>
                          <span className="flex items-center gap-1">
                            {STATUT_ICONS[reclamation.statut]}
                            {STATUT_LABELS[reclamation.statut]}
                          </span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[reclamation.type_reclamation]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {reclamation.description}
                      </p>
                      {reclamation.reponse_admin && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-xs font-medium text-blue-800 mb-1">
                            💬 Réponse de l'Admin:
                          </p>
                          <p className="text-sm text-blue-700">
                            {reclamation.reponse_admin}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500">
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
                  <label className="text-sm font-medium text-gray-600">Date Intervention</label>
                  <p>
                    {selectedReclamation.date_intervention 
                      ? new Date(selectedReclamation.date_intervention).toLocaleDateString('fr-FR')
                      : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date Réclamation</label>
                  <p>{new Date(selectedReclamation.date_creation).toLocaleString('fr-FR')}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Ma Description</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedReclamation.description}</p>
                </div>
              </div>

              {selectedReclamation.reponse_admin && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Réponse de l'Administrateur</label>
                  <div className="mt-1 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <p className="whitespace-pre-wrap text-blue-900">
                      {selectedReclamation.reponse_admin}
                    </p>
                  </div>
                </div>
              )}

              {selectedReclamation.statut === 'en_attente' && !selectedReclamation.reponse_admin && (
                <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-800">
                    ⏳ Votre réclamation est en attente de traitement par l'administrateur.
                  </p>
                </div>
              )}

              {selectedReclamation.statut === 'en_cours' && (
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">
                    🔄 Votre réclamation est en cours de traitement.
                  </p>
                </div>
              )}

              {selectedReclamation.statut === 'resolu' && (
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <p className="text-sm text-green-800">
                    ✅ Cette réclamation a été résolue
                    {selectedReclamation.date_resolution && 
                      ` le ${new Date(selectedReclamation.date_resolution).toLocaleDateString('fr-FR')}`
                    }.
                  </p>
                </div>
              )}

              {selectedReclamation.statut === 'rejete' && (
                <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                  <p className="text-sm text-red-800">
                    ❌ Cette réclamation a été rejetée
                    {selectedReclamation.date_resolution && 
                      ` le ${new Date(selectedReclamation.date_resolution).toLocaleDateString('fr-FR')}`
                    }.
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Détails Intervention */}
      <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Détails de l'Intervention
            </DialogTitle>
          </DialogHeader>
          {loadingIntervention ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : interventionDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">N° Intervention</label>
                  <p className="font-semibold">{interventionDetails.num_inter}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Client</label>
                  <p>{interventionDetails.client}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Date RDV</label>
                  <p>
                    {interventionDetails.date_rdv 
                      ? new Date(interventionDetails.date_rdv).toLocaleDateString('fr-FR')
                      : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Statut</label>
                  <p>{interventionDetails.statut}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Grille</label>
                  <p>{interventionDetails.grille || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <p>{interventionDetails.type_intervention || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-2 block">Articles</label>
                {interventionDetails.articles ? (
                  <div className="space-y-2">
                    {interventionDetails.articles.split(',').map((article, index) => {
                      const trimmed = article.trim();
                      // Format: "article_code x quantity" or just "article_code"
                      const match = trimmed.match(/^(.+?)\s*x\s*(\d+)$/);
                      if (match) {
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{match[1]}</span>
                            <span className="text-gray-500">×</span>
                            <span className="text-gray-700">{match[2]}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Package className="w-4 h-4 text-gray-500" />
                          <span>{trimmed}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Aucun article</p>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowInterventionDialog(false);
                    setShowAddArticlesDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter des Articles
                </Button>
                <Button variant="outline" onClick={() => setShowInterventionDialog(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-red-500">
              <p>Impossible de charger les détails de l'intervention</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Ajouter Articles */}
      <Dialog open={showAddArticlesDialog} onOpenChange={setShowAddArticlesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Ajouter des Articles
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newArticles">
                Articles (séparés par des virgules)
              </Label>
              <Input
                id="newArticles"
                placeholder="Ex: PTO x 2, Cable 100m x 1"
                value={newArticles}
                onChange={(e) => setNewArticles(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: article x quantité (ex: PTO x 2)
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddArticlesDialog(false);
                  setNewArticles('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddArticles}
                disabled={!newArticles.trim()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
