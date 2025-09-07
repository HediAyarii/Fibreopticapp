{/* Section Fuel avec affichage groupé */}
{activeTab === "fuel" && (
  <div className="space-y-8">
    {/* Header avec contrôles */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-3 bg-clip-text text-transparent">
          Consommation Carburant
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Vue groupée par période et employé avec totaux de consommation
        </p>
      </div>
      <div className="flex gap-3">
        {/* Boutons de vue */}
        <div className="flex gap-2">
          <Button
            variant={fuelViewMode === 'grouped' ? 'default' : 'outline'}
            onClick={() => setFuelViewMode('grouped')}
            className={fuelViewMode === 'grouped' ? 'gradient-primary text-white' : 'glass-card border border-white/20'}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue Groupée
          </Button>
          <Button
            variant={fuelViewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setFuelViewMode('table')}
            className={fuelViewMode === 'table' ? 'gradient-primary text-white' : 'glass-card border border-white/20'}
          >
            <Eye className="w-4 h-4 mr-2" />
            Vue Tableau
          </Button>
        </div>
        
        {/* Filtres de période */}
        <Select value={fuelPeriod} onValueChange={(value: 'month' | 'week' | 'year') => setFuelPeriod(value)}>
          <SelectTrigger className="glass-card border border-white/20 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Semaine</SelectItem>
            <SelectItem value="month">Mois</SelectItem>
            <SelectItem value="year">Année</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          onClick={loadFuelGroupedData}
          className="glass-card border border-white/20 hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>
    </div>

    {/* Résumé global */}
    {fuelGroupedSummary && Object.keys(fuelGroupedSummary).length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Consommation Totale</p>
                <p className="text-2xl font-bold text-primary">
                  {fuelGroupedSummary.total_consommation?.toFixed(2) || 0} DA
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-chart-1">
                  {fuelGroupedSummary.total_transactions || 0}
                </p>
              </div>
              <Fuel className="w-8 h-8 text-chart-1/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Périodes</p>
                <p className="text-2xl font-bold text-chart-2">
                  {fuelGroupedSummary.nombre_periodes || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-chart-2/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employés Actifs</p>
                <p className="text-2xl font-bold text-chart-3">
                  {fuelGroupedSummary.nombre_employes || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-chart-3/50" />
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Contenu principal */}
    {fuelViewMode === 'grouped' ? (
      <Card className="glass-card border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <BarChart3 className="w-6 h-6 text-primary" />
            Consommation Groupée par Période et Employé
          </CardTitle>
          <CardDescription>
            Vue détaillée de la consommation carburant groupée par {fuelPeriod === 'week' ? 'semaine' : fuelPeriod === 'month' ? 'mois' : 'année'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fuelGroupedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune donnée groupée trouvée</h3>
              <p>Les données apparaîtront ici une fois que vous aurez des transactions carburant assignées.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {fuelGroupedData.map((periode, index) => (
                <div key={index} className="border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary">
                      Période: {periode.periode}
                    </h3>
                    <Badge variant="outline" className="glass-card border border-white/20">
                      {periode.employes.length} employé{periode.employes.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {periode.employes.map((employe: any, empIndex: number) => (
                      <div key={empIndex} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {employe.employe_prenom?.[0]}{employe.employe_nom?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {employe.employe_prenom} {employe.employe_nom}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Matricule: {employe.employe_matricule || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-muted-foreground">Cartes</div>
                            <div className="font-medium">{employe.nombre_cartes}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Transactions</div>
                            <div className="font-medium">{employe.nombre_transactions}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Consommation</div>
                            <div className="font-bold text-primary text-lg">
                              {employe.consommation_totale.toFixed(2)} € 
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Moyenne</div>
                            <div className="font-medium">
                              {employe.consommation_moyenne.toFixed(2)} € 
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ) : (
      <Card className="glass-card border border-white/20 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <Fuel className="w-6 h-6 text-primary" />
            Transactions Carburant Détaillées
          </CardTitle>
          <CardDescription>
            Vue détaillée de toutes les transactions carburant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingFuel ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement des données carburant...</p>
            </div>
          ) : fuelData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Fuel className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Aucune transaction carburant trouvée</h3>
              <p>Importez des données pour commencer à voir vos transactions ici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-semibold">Date Livraison</th>
                    <th className="text-left p-4 font-semibold">Véhicule</th>
                    <th className="text-left p-4 font-semibold">N° Carte</th>
                    <th className="text-left p-4 font-semibold">Employé Assigné</th>
                    <th className="text-left p-4 font-semibold">Station</th>
                    <th className="text-left p-4 font-semibold">Montant TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelData.slice(0, 50).map((transaction, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">{transaction.date_livraison}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-4 h-4 text-chart-3" />
                          {transaction.immat_vehicule}
                        </div>
                      </td>
                      <td className="p-4">{transaction.numero_carte}</td>
                      <td className="p-4">
                        {transaction.employe_assigné ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span>{transaction.employe_assigné.prenom} {transaction.employe_assigné.nom}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Non assigné</span>
                        )}
                      </td>
                      <td className="p-4">{transaction.numero_station}</td>
                      <td className="p-4 font-medium text-primary">
                        {transaction.ca_ttc} DA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    )}
  </div>
)}
