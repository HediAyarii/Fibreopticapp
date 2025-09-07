{/* Contenu principal avec vue par employé */}
{fuelViewMode === 'employees' ? (
  <Card className="glass-card border border-white/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-3 text-xl font-bold">
        <Users className="w-6 h-6 text-primary" />
        Consommation Carburant par Employé
      </CardTitle>
      <CardDescription>
        Vue détaillée de la consommation carburant TTC pour chaque employé
      </CardDescription>
    </CardHeader>
    <CardContent>
      {/* Résumé de la consommation par employé */}
      {fuelEmployeesSummary && Object.keys(fuelEmployeesSummary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total TTC</p>
                  <p className="text-xl font-bold text-primary">
                    {fuelEmployeesSummary.total_consommation_ttc?.toFixed(2) || 0} €
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-xl font-bold text-chart-1">
                    {fuelEmployeesSummary.total_transactions || 0}
                  </p>
                </div>
                <Fuel className="w-6 h-6 text-chart-1/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Employés Actifs</p>
                  <p className="text-xl font-bold text-chart-2">
                    {fuelEmployeesSummary.nombre_employes || 0}
                  </p>
                </div>
                <Users className="w-6 h-6 text-chart-2/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne/Employé</p>
                  <p className="text-xl font-bold text-chart-3">
                    {fuelEmployeesSummary.consommation_moyenne_par_employe?.toFixed(2) || 0} €
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 text-chart-3/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des employés avec leur consommation */}
      {fuelEmployeesData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Aucune consommation trouvée</h3>
          <p>Les consommations carburant par employé apparaîtront ici une fois que vous aurez assigné des cartes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fuelEmployeesData.map((employe, index) => (
            <Card key={index} className="glass-card border border-white/10 hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Informations employé */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-chart-3 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {employe.employe_prenom?.[0]}{employe.employe_nom?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {employe.employe_prenom} {employe.employe_nom}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Matricule: {employe.employe_matricule || 'N/A'}</span>
                        <span>Tél: {employe.employe_telephone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques de consommation */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Cartes Utilisées</div>
                      <div className="text-lg font-semibold text-chart-1">
                        {employe.nombre_cartes_utilisees}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Transactions</div>
                      <div className="text-lg font-semibold text-chart-2">
                        {employe.nombre_transactions}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Consommation TTC</div>
                      <div className="text-2xl font-bold text-primary">
                        {employe.consommation_totale_ttc.toFixed(2)} DA
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Moyenne/Transaction</div>
                      <div className="text-lg font-semibold text-chart-3">
                        {employe.consommation_moyenne_ttc.toFixed(2)} DA
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Détails supplémentaires */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cartes: </span>
                      <span className="font-medium">
                        {employe.cartes_utilisees.join(', ') || 'Aucune'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Véhicules: </span>
                      <span className="font-medium">
                        {employe.vehicules_utilises.slice(0, 2).join(', ')}
                        {employe.vehicules_utilises.length > 2 && ` (+${employe.vehicules_utilises.length - 2})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Période: </span>
                      <span className="font-medium">
                        {employe.premiere_transaction ? new Date(employe.premiere_transaction).toLocaleDateString() : 'N/A'} - 
                        {employe.derniere_transaction ? new Date(employe.derniere_transaction).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton pour voir les détails */}
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployeeFuel(employe)
                      setShowEmployeeFuelModal(true)
                    }}
                    className="glass-card border border-white/20 hover:bg-white/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
) : fuelViewMode === 'grouped' ? (
  {/* Code existant pour la vue groupée */}
) : (
  {/* Code existant pour la vue tableau */}
)}

{/* Modal pour les détails de consommation d'un employé */}
{showEmployeeFuelModal && selectedEmployeeFuel && (
  <Dialog open={showEmployeeFuelModal} onOpenChange={setShowEmployeeFuelModal}>
    <DialogContent className="glass-card border border-white/20 max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          Détails Consommation - {selectedEmployeeFuel.employe_prenom} {selectedEmployeeFuel.employe_nom}
        </DialogTitle>
        <DialogDescription>
          Détails complets de la consommation carburant TTC pour cet employé
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Statistiques détaillées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {selectedEmployeeFuel.consommation_totale_ttc.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">€ TTC Total</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-chart-1">
              {selectedEmployeeFuel.nombre_transactions}
            </div>
            <div className="text-sm text-muted-foreground">Transactions</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-chart-2">
              {selectedEmployeeFuel.nombre_cartes_utilisees}
            </div>
            <div className="text-sm text-muted-foreground">Cartes</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-chart-3">
              {selectedEmployeeFuel.consommation_moyenne_ttc.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">€ Moyenne</div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Informations Employé</h4>
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div><span className="text-muted-foreground">Nom complet:</span> {selectedEmployeeFuel.employe_prenom} {selectedEmployeeFuel.employe_nom}</div>
              <div><span className="text-muted-foreground">Matricule:</span> {selectedEmployeeFuel.employe_matricule || 'N/A'}</div>
              <div><span className="text-muted-foreground">Téléphone:</span> {selectedEmployeeFuel.employe_telephone || 'N/A'}</div>
              <div><span className="text-muted-foreground">Email:</span> {selectedEmployeeFuel.employe_email || 'N/A'}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Cartes Utilisées</h4>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {selectedEmployeeFuel.cartes_utilisees.map((carte: string, index: number) => (
                  <Badge key={index} variant="outline" className="glass-card border border-white/20">
                    Carte {carte}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Véhicules Utilisés</h4>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {selectedEmployeeFuel.vehicules_utilises.map((vehicule: string, index: number) => (
                  <Badge key={index} variant="outline" className="glass-card border border-white/20">
                    {vehicule}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Stations Utilisées</h4>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {selectedEmployeeFuel.stations_utilisees.map((station: string, index: number) => (
                  <Badge key={index} variant="outline" className="glass-card border border-white/20">
                    Station {station}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Période d'Activité</h4>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-muted-foreground">Première transaction:</span>
                  <div className="font-medium">
                    {selectedEmployeeFuel.premiere_transaction ? 
                      new Date(selectedEmployeeFuel.premiere_transaction).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Dernière transaction:</span>
                  <div className="font-medium">
                    {selectedEmployeeFuel.derniere_transaction ? 
                      new Date(selectedEmployeeFuel.derniere_transaction).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => setShowEmployeeFuelModal(false)}
          className="glass-card border border-white/20"
        >
          Fermer
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
