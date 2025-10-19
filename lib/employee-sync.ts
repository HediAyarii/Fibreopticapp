import { query } from '@/lib/database'

export async function syncEmployees() {
  try {
    console.log('🔄 Début de la synchronisation automatique des employés')
    
    // 1. Récupérer tous les techniciens uniques via l'API revenue-calculation
    console.log('📋 Étape 1: Récupération des techniciens via revenue-calculation...')
    
    // Utiliser l'API revenue-calculation existante pour récupérer tous les techniciens
    const revenueResponse = await fetch(`http://localhost:3000/api/revenue-calculation?date_from=2020-01-01&date_to=2030-12-31`)
    const revenueData = await revenueResponse.json()
    
    if (!revenueData.success || !revenueData.revenue_data) {
      throw new Error('Impossible de récupérer les données des techniciens')
    }
    
    const techniciensInterventions = revenueData.revenue_data.map((emp: any) => ({
      employe_nom: emp.employe_nom,
      employe_prenom: emp.employe_prenom,
      matricule: emp.matricule,
      nombre_interventions: parseInt(emp.nombre_interventions) || 0,
      total_recette_technicien: parseFloat(emp.total_recette_technicien) || 0,
      premiere_intervention: emp.interventions_detail?.[0]?.date_rdv || null,
      derniere_intervention: emp.interventions_detail?.[emp.interventions_detail.length - 1]?.date_rdv || null
    }))
    
    console.log(`✅ ${techniciensInterventions.length} techniciens trouvés dans les interventions`)
    
    // 2. Récupérer tous les employés existants
    console.log('📋 Étape 2: Récupération des employés existants...')
    const employesResult = await query(`
      SELECT id, nom, prenom, matricule, statut
      FROM employes 
      WHERE statut = 'actif'
    `)
    
    const employesExistants = employesResult.rows
    console.log(`✅ ${employesExistants.length} employés existants trouvés`)
    
    // 3. Fonction de normalisation des noms
    const normalizeName = (name: string) => {
      return name?.toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n')
        .replace(/[^a-z0-9]/g, '')
        .trim()
    }
    
    // 4. Fonction de correspondance intelligente
    const findEmployeeMatch = (technicien: any, employes: any[]) => {
      const techNom = normalizeName(technicien.employe_nom)
      const techPrenom = normalizeName(technicien.employe_prenom)
      
      // Correspondance exacte par matricule
      if (technicien.matricule) {
        const matchByMatricule = employes.find(emp => emp.matricule === technicien.matricule)
        if (matchByMatricule) return matchByMatricule
      }
      
      // Correspondance par nom et prénom
      const matchByNames = employes.find(emp => {
        const empNom = normalizeName(emp.nom)
        const empPrenom = normalizeName(emp.prenom)
        
        // Correspondance exacte
        if (empNom === techNom && empPrenom === techPrenom) return true
        
        // Correspondance inversée
        if (empNom === techPrenom && empPrenom === techNom) return true
        
        // Correspondance partielle
        if ((empNom.includes(techNom) || techNom.includes(empNom)) &&
            (empPrenom.includes(techPrenom) || techPrenom.includes(empPrenom))) return true
        
        return false
      })
      
      return matchByNames
    }
    
    // 5. Analyser les techniciens manquants
    console.log('📋 Étape 3: Analyse des techniciens manquants...')
    const techniciensManquants = []
    const techniciensExistants = []
    
    for (const technicien of techniciensInterventions) {
      const employeExistant = findEmployeeMatch(technicien, employesExistants)
      
      if (employeExistant) {
        techniciensExistants.push({
          technicien,
          employe: employeExistant,
          statut: 'existe'
        })
      } else {
        techniciensManquants.push({
          technicien,
          statut: 'manquant'
        })
      }
    }
    
    console.log(`✅ ${techniciensExistants.length} techniciens existants`)
    console.log(`⚠️ ${techniciensManquants.length} techniciens manquants`)
    
    // 6. Créer les employés manquants
    console.log('📋 Étape 4: Création des employés manquants...')
    const employesCrees = []
    const erreurs = []
    
    for (const { technicien } of techniciensManquants) {
      try {
        // Générer un matricule unique si pas fourni
        let matricule = technicien.matricule
        if (!matricule) {
          const nomCode = technicien.employe_nom.substring(0, 3).toUpperCase()
          const prenomCode = technicien.employe_prenom.substring(0, 3).toUpperCase()
          matricule = `TECH_${nomCode}${prenomCode}`
        }
        
        // Créer l'employé
        const nouvelEmploye = {
          nom: technicien.employe_nom,
          prenom: technicien.employe_prenom,
          matricule: matricule,
          niveau_acces: 'technicien',
          statut: 'actif',
          email: `${technicien.employe_prenom.toLowerCase()}.${technicien.employe_nom.toLowerCase()}@finalfibre.com`,
          telephone: '0000000000',
          date_embauche: technicien.premiere_intervention || new Date().toISOString().split('T')[0],
          salaire_base: 0,
          taux_horaire: 0,
          pourcentage_taxe: 50, // Taxe par défaut
        }
        
        const result = await query(`
          INSERT INTO employes (
            nom, prenom, matricule, niveau_acces, statut, email, telephone,
            date_embauche, salaire_base, taux_horaire, pourcentage_taxe,
            heures_travaillees, heures_supplementaires, prime_performance, penalites_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING *
        `, [
          nouvelEmploye.nom,
          nouvelEmploye.prenom,
          nouvelEmploye.matricule,
          nouvelEmploye.niveau_acces,
          nouvelEmploye.statut,
          nouvelEmploye.email,
          nouvelEmploye.telephone,
          nouvelEmploye.date_embauche,
          nouvelEmploye.salaire_base,
          nouvelEmploye.taux_horaire,
          nouvelEmploye.pourcentage_taxe,
          0, 0, 0, 0
        ])
        
        employesCrees.push({
          technicien,
          employe: result.rows[0],
          statut: 'cree'
        })
        
        console.log(`✅ Employé créé: ${nouvelEmploye.nom} ${nouvelEmploye.prenom} (${matricule})`)
        
      } catch (error) {
        console.error(`❌ Erreur création ${technicien.employe_nom} ${technicien.employe_prenom}:`, error)
        erreurs.push({
          technicien,
          error: error.message,
          statut: 'erreur'
        })
      }
    }
    
    // 7. Résumé de la synchronisation
    const resume = {
      total_techniciens: techniciensInterventions.length,
      techniciens_existants: techniciensExistants.length,
      techniciens_manquants: techniciensManquants.length,
      employes_crees: employesCrees.length,
      erreurs: erreurs.length,
      details: {
        existants: techniciensExistants.map(t => ({
          nom: t.technicien.employe_nom,
          prenom: t.technicien.employe_prenom,
          matricule: t.technicien.matricule,
          interventions: t.technicien.nombre_interventions,
          recette: t.technicien.total_recette_technicien
        })),
        crees: employesCrees.map(t => ({
          nom: t.technicien.employe_nom,
          prenom: t.technicien.employe_prenom,
          matricule: t.employe.matricule,
          interventions: t.technicien.nombre_interventions,
          recette: t.technicien.total_recette_technicien
        })),
        erreurs: erreurs.map(t => ({
          nom: t.technicien.employe_nom,
          prenom: t.technicien.employe_prenom,
          erreur: t.error
        }))
      }
    }
    
    console.log('🎯 Synchronisation terminée:', resume)
    
    return {
      success: true,
      message: `Synchronisation terminée: ${employesCrees.length} employés créés, ${erreurs.length} erreurs`,
      data: resume
    }
    
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error)
    return {
      success: false,
      error: `Erreur synchronisation: ${error.message}`
    }
  }
}






