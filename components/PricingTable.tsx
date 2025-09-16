"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Building2, Euro } from "lucide-react"

interface PricingData {
  company: string
  service: string
  type: string
  price: number
  additional: number
}

const pricingData: PricingData[] = [
  // AXECOM SAV
  { company: "AXECOM", service: "CLEM", type: "SAV", price: 11, additional: 0 },
  { company: "AXECOM", service: "CABLE_PAV_1", type: "SAV", price: 20, additional: 0 },
  { company: "AXECOM", service: "RACPRO_S", type: "SAV", price: 176, additional: 65 },
  { company: "AXECOM", service: "RACPRO_C", type: "SAV", price: 165, additional: 65 },
  { company: "AXECOM", service: "RACIH", type: "SAV", price: 82, additional: 30 },
  { company: "AXECOM", service: "CABLE_PAV_2", type: "SAV", price: 40, additional: 0 },
  { company: "AXECOM", service: "CABLE_PAV_3", type: "SAV", price: 61, additional: 0 },
  { company: "AXECOM", service: "CABLE_PAV_4", type: "SAV", price: 81, additional: 0 },
  { company: "AXECOM", service: "RECOIP", type: "SAV", price: 50, additional: 25 },
  { company: "AXECOM", service: "REFRAC", type: "SAV", price: 85, additional: 30 },
  { company: "AXECOM", service: "REPFOU_ASPHA", type: "SAV", price: 386, additional: 70 },
  { company: "AXECOM", service: "REPFOU_PUB", type: "SAV", price: 170, additional: 50 },
  { company: "AXECOM", service: "REPFOU_PRI", type: "SAV", price: 170, additional: 50 },
  { company: "AXECOM", service: "SAV", type: "SAV", price: 15, additional: 10 },
  { company: "AXECOM", service: "DEP_OFFE", type: "SAV", price: 15, additional: 10 },
  { company: "AXECOM", service: "SWAP_EQT", type: "SAV", price: 15, additional: 10 },
  { company: "AXECOM", service: "DEMO", type: "SAV", price: 15, additional: 10 },
  { company: "AXECOM", service: "DEP_TORT", type: "SAV", price: 0, additional: 0 },
  { company: "AXECOM", service: "REF_DGR", type: "SAV", price: 85, additional: 30 },
  
  // AXECOM RACC
  { company: "AXECOM", service: "RACPAV", type: "RACC", price: 140, additional: 65 },
  { company: "AXECOM", service: "CLEM", type: "RACC", price: 11, additional: 0 },
  { company: "AXECOM", service: "CABLE_PAV_1", type: "RACC", price: 20, additional: 0 },
  { company: "AXECOM", service: "RACPRO_S", type: "RACC", price: 176, additional: 65 },
  { company: "AXECOM", service: "RACPRO_C", type: "RACC", price: 165, additional: 65 },
  { company: "AXECOM", service: "RACIH", type: "RACC", price: 85, additional: 30 },
  { company: "AXECOM", service: "CABLE_PAV_2", type: "RACC", price: 40, additional: 0 },
  { company: "AXECOM", service: "CABLE_PAV_3", type: "RACC", price: 61, additional: 0 },
  { company: "AXECOM", service: "CABLE_PAV_4", type: "RACC", price: 81, additional: 0 },
  { company: "AXECOM", service: "RECOIP", type: "RACC", price: 50, additional: 25 },
  { company: "AXECOM", service: "REFRAC", type: "RACC", price: 85, additional: 30 },
  { company: "AXECOM", service: "REPFOU_ASPHA", type: "RACC", price: 386, additional: 50 },
  { company: "AXECOM", service: "REPFOU_PUB", type: "RACC", price: 170, additional: 70 },
  { company: "AXECOM", service: "REPFOU_PRI", type: "RACC", price: 170, additional: 50 },
  { company: "AXECOM", service: "SAV", type: "RACC", price: 15, additional: 10 },
  { company: "AXECOM", service: "REF_DGR", type: "RACC", price: 85, additional: 30 },
  
  // ERT OUEST SAV
  { company: "ERT OUEST", service: "RACPAV", type: "SAV", price: 140, additional: 60 },
  { company: "ERT OUEST", service: "CLEM", type: "SAV", price: 5, additional: 0 },
  { company: "ERT OUEST", service: "CABLE_PAV_1", type: "SAV", price: 20, additional: 0 },
  { company: "ERT OUEST", service: "RACPRO_S", type: "SAV", price: 195, additional: 60 },
  { company: "ERT OUEST", service: "RACPRO_C", type: "SAV", price: 245, additional: 60 },
  { company: "ERT OUEST", service: "RACIH", type: "SAV", price: 75, additional: 30 },
  { company: "ERT OUEST", service: "CABLE_PAV_2", type: "SAV", price: 40, additional: 0 },
  { company: "ERT OUEST", service: "CABLE_PAV_3", type: "SAV", price: 60, additional: 0 },
  { company: "ERT OUEST", service: "CABLE_PAV_4", type: "SAV", price: 80, additional: 0 },
  { company: "ERT OUEST", service: "RECOIP", type: "SAV", price: 40, additional: 20 },
  { company: "ERT OUEST", service: "REFRAC", type: "SAV", price: 50, additional: 30 },
  { company: "ERT OUEST", service: "REPFOU_ASPHA", type: "SAV", price: 400, additional: 50 },
  { company: "ERT OUEST", service: "REPFOU_PUB", type: "SAV", price: 200, additional: 50 },
  { company: "ERT OUEST", service: "REPFOU_PRI", type: "SAV", price: 200, additional: 50 },
  { company: "ERT OUEST", service: "SAV", type: "SAV", price: 22, additional: 10 },
  { company: "ERT OUEST", service: "DEP_OFFE", type: "SAV", price: 0, additional: 0 },
  { company: "ERT OUEST", service: "SWAP_EQT", type: "SAV", price: 22, additional: 10 },
  { company: "ERT OUEST", service: "DEMO", type: "SAV", price: 22, additional: 10 },
  { company: "ERT OUEST", service: "DEPLPRISE", type: "SAV", price: 85, additional: 30 },
  { company: "ERT OUEST", service: "REF_DGR", type: "SAV", price: 85, additional: 30 },
  { company: "ERT OUEST", service: "DEP_TORT", type: "SAV", price: 0, additional: 0 },
  
  // ERT OUEST RACC
  { company: "ERT OUEST", service: "RACPAV", type: "RACC", price: 140, additional: 60 },
  { company: "ERT OUEST", service: "CLEM", type: "RACC", price: 5, additional: 0 },
  { company: "ERT OUEST", service: "CABLE_PAV_1", type: "RACC", price: 20, additional: 0 },
  { company: "ERT OUEST", service: "RACPRO_S", type: "RACC", price: 195, additional: 60 },
  { company: "ERT OUEST", service: "RACPRO_C", type: "RACC", price: 245, additional: 60 },
  { company: "ERT OUEST", service: "RACIH", type: "RACC", price: 75, additional: 30 },
  { company: "ERT OUEST", service: "CABLE_PAV_2", type: "RACC", price: 40, additional: 0 },
  { company: "ERT OUEST", service: "CABLE_PAV_3", type: "RACC", price: 60, additional: 0 },
  { company: "ERT OUEST", service: "CABLE_PAV_4", type: "RACC", price: 80, additional: 0 },
  { company: "ERT OUEST", service: "RECOIP", type: "RACC", price: 40, additional: 20 },
  { company: "ERT OUEST", service: "REFRAC", type: "RACC", price: 50, additional: 30 },
  { company: "ERT OUEST", service: "REPFOU_ASPHA", type: "RACC", price: 400, additional: 50 },
  { company: "ERT OUEST", service: "REPFOU_PUB", type: "RACC", price: 200, additional: 50 },
  { company: "ERT OUEST", service: "REPFOU_PRI", type: "RACC", price: 200, additional: 50 },
  { company: "ERT OUEST", service: "REF_DGR", type: "RACC", price: 85, additional: 30 },
]

interface PricingTableProps {
  company?: string
}

export function PricingTable({ company }: PricingTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState(company || "all")
  const [selectedType, setSelectedType] = useState("all")

  // Filtrer les données
  const filteredData = pricingData.filter(item => {
    const matchesCompany = selectedCompany === "all" || item.company === selectedCompany
    const matchesType = selectedType === "all" || item.type === selectedType
    const matchesSearch = searchTerm === "" || 
      item.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCompany && matchesType && matchesSearch
  })

  // Obtenir les entreprises uniques
  const companies = Array.from(new Set(pricingData.map(item => item.company)))
  
  // Obtenir les types uniques
  const types = Array.from(new Set(pricingData.map(item => item.type)))

  return (
    <Card className="glass-card border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Tableau des Tarifs
        </CardTitle>
        <CardDescription>
          Tarifs des services pour les entreprises ERT et Axecom
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Rechercher un service</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="company">Entreprise</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entreprises</SelectItem>
                {companies.map(comp => (
                  <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="type">Type de service</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 glass-card border border-white/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
            <div className="text-sm text-gray-600">Services trouvés</div>
          </div>
          <div className="text-center p-3 glass-card border border-white/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {filteredData.reduce((sum, item) => sum + item.price, 0)}€
            </div>
            <div className="text-sm text-gray-600">Total prix de base</div>
          </div>
          <div className="text-center p-3 glass-card border border-white/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {filteredData.reduce((sum, item) => sum + item.additional, 0)}€
            </div>
            <div className="text-sm text-gray-600">Total suppléments</div>
          </div>
        </div>

        {/* Tableau */}
        <div className="border border-white/20 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="glass-card border border-white/20">
                <TableHead className="font-semibold">Entreprise</TableHead>
                <TableHead className="font-semibold">Service</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold text-right">Prix de base</TableHead>
                <TableHead className="font-semibold text-right">Supplément</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index} className="hover:bg-white/5">
                  <TableCell>
                    <Badge 
                      variant={item.company === "AXECOM" ? "default" : "secondary"}
                      className="glass-card border border-white/20"
                    >
                      {item.company}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.service}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.type === "SAV" ? "destructive" : "outline"}
                      className="glass-card border border-white/20"
                    >
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <Euro className="w-3 h-3" />
                      {item.price}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Euro className="w-3 h-3" />
                      {item.additional}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    <div className="flex items-center justify-end gap-1">
                      <Euro className="w-3 h-3" />
                      {item.price + item.additional}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucun service trouvé avec ces critères</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
