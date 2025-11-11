'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Calendar } from 'lucide-react';

interface Confirmation {
  id: number;
  employe_id: number;
  matricule: string | null;
  mois: string;
  montant_confirme: number;
  date_confirmation: string;
  details: {
    total_interventions: number;
    montants_par_categorie: Record<string, number>;
    carburant: number;
    penalites: number;
  };
}

interface EmployeWithConfirmation {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  confirmation: Confirmation | null;
}

export default function ConfirmationsMontants() {
  const [employes, setEmployes] = useState<EmployeWithConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMois, setSelectedMois] = useState<string>('');
  const [selectedConfirmation, setSelectedConfirmation] = useState<Confirmation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Initialiser avec le mois précédent
  useEffect(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const moisDefault = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMois(moisDefault);
  }, []);

  // Charger les données
  useEffect(() => {
    if (!selectedMois) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer tous les employés
        const empResponse = await fetch('/api/employes');
        const empData = await empResponse.json();

        // Récupérer toutes les confirmations pour le mois sélectionné
        const confResponse = await fetch(`/api/confirmations-montants?all=true&mois=${selectedMois}`);
        const confData = await confResponse.json();

        const confirmationsMap = new Map<number, Confirmation>();
        if (confData.success) {
          confData.confirmations.forEach((conf: Confirmation) => {
            confirmationsMap.set(conf.employe_id, conf);
          });
        }

        // Combiner les données
        const combined: EmployeWithConfirmation[] = empData.employes.map((emp: any) => ({
          id: emp.id,
          nom: emp.nom,
          prenom: emp.prenom,
          matricule: emp.matricule,
          confirmation: confirmationsMap.get(emp.id) || null,
        }));

        setEmployes(combined);
      } catch (error) {
        console.error('Erreur chargement confirmations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMois]);

  const handleViewDetails = (confirmation: Confirmation) => {
    setSelectedConfirmation(confirmation);
    setDialogOpen(true);
  };

  const statsConfirmations = {
    total: employes.length,
    confirmes: employes.filter(e => e.confirmation !== null).length,
    non_confirmes: employes.filter(e => e.confirmation === null).length,
  };

  // Générer les 12 derniers mois pour le sélecteur
  const derniersMois = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    };
  });

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de mois et statistiques */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <select
            value={selectedMois}
            onChange={(e) => setSelectedMois(e.target.value)}
            className="px-4 py-2 border rounded-lg font-medium"
          >
            {derniersMois.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-sm text-green-700 font-medium">
              ✅ Confirmés: {statsConfirmations.confirmes}
            </span>
          </div>
          <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-sm text-orange-700 font-medium">
              ⏳ Non confirmés: {statsConfirmations.non_confirmes}
            </span>
          </div>
        </div>
      </div>

      {/* Tableau des confirmations */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Confirmations - {selectedMois}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technicien</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Nb Interventions</TableHead>
                  <TableHead className="text-center">Date Confirmation</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employes.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      {emp.prenom} {emp.nom}
                    </TableCell>
                    <TableCell>{emp.matricule || '-'}</TableCell>
                    <TableCell className="text-center">
                      {emp.confirmation ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmé
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Non confirmé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {emp.confirmation
                        ? `${emp.confirmation.montant_confirme.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {emp.confirmation?.details?.total_interventions || '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {emp.confirmation
                        ? new Date(emp.confirmation.date_confirmation).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {emp.confirmation && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(emp.confirmation!)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails confirmation */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Confirmation</DialogTitle>
          </DialogHeader>
          {selectedConfirmation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mois</p>
                  <p className="font-semibold">{selectedConfirmation.mois}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de confirmation</p>
                  <p className="font-semibold">
                    {new Date(selectedConfirmation.date_confirmation).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Montant total confirmé</p>
                  <p className="font-semibold text-green-600 text-xl">
                    {selectedConfirmation.montant_confirme.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total interventions</p>
                  <p className="font-semibold text-xl">
                    {selectedConfirmation.details?.total_interventions || 0}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Montants par catégorie</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedConfirmation.details?.montants_par_categorie &&
                    Object.entries(selectedConfirmation.details.montants_par_categorie).map(([cat, montant]) => (
                      <div key={cat} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{cat}</span>
                        <span className="text-green-600">
                          {Number(montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {(selectedConfirmation.details?.carburant || selectedConfirmation.details?.penalites) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Carburant</p>
                    <p className="font-semibold">
                      {selectedConfirmation.details.carburant?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pénalités</p>
                    <p className="font-semibold text-red-600">
                      {selectedConfirmation.details.penalites?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
