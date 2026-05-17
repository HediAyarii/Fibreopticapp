const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkTechnicienRevenueDetail() {
  try {
    const nomTech = 'BOUAFFOURA';
    const prenomTech = 'Marouen';

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 ANALYSE RECETTE TECHNICIEN: ${prenomTech} ${nomTech}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Vérifier l'employé dans la base
    console.log('👤 1. VÉRIFICATION EMPLOYÉ:');
    const employeResult = await pool.query(`
      SELECT id, nom, prenom, matricule, statut
      FROM employes
      WHERE LOWER(nom) = LOWER($1) AND LOWER(prenom) = LOWER($2)
    `, [nomTech, prenomTech]);

    if (employeResult.rows.length > 0) {
      const emp = employeResult.rows[0];
      console.log(`   ✅ Employé trouvé dans la base:`);
      console.log(`      - ID: ${emp.id}`);
      console.log(`      - Matricule: ${emp.matricule}`);
      console.log(`      - Statut: ${emp.statut}`);
    } else {
      console.log(`   ⚠️  Employé non trouvé dans la base - sera créé virtuellement`);
    }

    // 2. Compter les interventions CLOTURE TERMINEE
    console.log('\n📋 2. INTERVENTIONS CLOTURE TERMINEE:');
    const interventionsCount = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN articles IS NOT NULL AND articles != '' AND articles != 'nan' THEN 1 END) as avec_articles,
        COUNT(CASE WHEN articles IS NULL OR articles = '' OR articles = 'nan' THEN 1 END) as sans_articles
      FROM interventions
      WHERE LOWER(nom_technicien) = LOWER($1) 
        AND LOWER(prenom_technicien) = LOWER($2)
        AND statut = 'CLOTURE TERMINEE'
    `, [nomTech, prenomTech]);

    const counts = interventionsCount.rows[0];
    console.log(`   📊 Total interventions terminées: ${counts.total}`);
    console.log(`   ✅ Avec articles: ${counts.avec_articles}`);
    console.log(`   ⚠️  Sans articles: ${counts.sans_articles}`);

    // 3. Analyser les 10 dernières interventions en détail
    console.log('\n📦 3. DÉTAIL DES DERNIÈRES INTERVENTIONS:');
    const interventionsDetail = await pool.query(`
      SELECT 
        i.num_inter,
        i.date_rdv,
        i.cloture_tech,
        i.cloture_hotline,
        i.type_intervention,
        i.grille,
        i.articles,
        i.statut
      FROM interventions i
      WHERE LOWER(i.nom_technicien) = LOWER($1) 
        AND LOWER(i.prenom_technicien) = LOWER($2)
        AND i.statut = 'CLOTURE TERMINEE'
      ORDER BY i.created_at DESC
      LIMIT 10
    `, [nomTech, prenomTech]);

    console.log(`\n   Analyse de ${interventionsDetail.rows.length} interventions récentes:\n`);

    for (const intervention of interventionsDetail.rows) {
      console.log(`   ├─ ${intervention.num_inter}`);
      console.log(`   │  • Date RDV: ${intervention.date_rdv}`);
      console.log(`   │  • Clôture Tech: ${intervention.cloture_tech || 'N/A'}`);
      console.log(`   │  • Clôture Hotline: ${intervention.cloture_hotline || 'N/A'}`);
      console.log(`   │  • Type: ${intervention.type_intervention || 'N/A'}`);
      console.log(`   │  • Grille: ${intervention.grille || 'N/A'}`);
      console.log(`   │  • Articles: ${intervention.articles || 'Aucun'}`);

      // Calculer la recette pour cette intervention
      if (intervention.articles && intervention.articles !== 'nan' && intervention.articles !== '') {
        const articles = intervention.articles.split(',').map(a => a.trim());
        const companyName = intervention.grille && intervention.grille.includes('AXECOM') ? 'AXECOM' : 'ERT OUEST';
        const category = ['RACC', 'RECO', 'RECC'].includes(intervention.type_intervention) ? 'RACC' : 'SAV';

        console.log(`   │  • Tarification: ${companyName} - ${category}`);
        
        let totalTech = 0;
        let totalEnt = 0;
        let hasArticles = false;

        for (const articleItem of articles) {
          if (!articleItem || articleItem === 'nan') continue;

          const parts = articleItem.split('x');
          const articleCode = parts[0]?.trim();
          const quantity = parts[1] ? parseInt(parts[1].trim()) : 1;

          if (!articleCode) continue;
          hasArticles = true;

          // Exception DEP_OFFE
          const skipDepOffe = articleCode === 'DEP_OFFE' && intervention.articles.includes('SAV');

          // Chercher le prix
          const pricingResult = await pool.query(`
            SELECT prix_base, prix_tech, service_code
            FROM company_pricing
            WHERE service_code = $1
              AND company_name = $2
              AND category = $3
          `, [articleCode, companyName, category]);

          if (pricingResult.rows.length > 0) {
            const pricing = pricingResult.rows[0];
            const prixTech = skipDepOffe ? 0 : (pricing.prix_tech * quantity);
            const prixEnt = skipDepOffe ? 0 : (pricing.prix_base * quantity);
            
            totalTech += prixTech;
            totalEnt += prixEnt;

            if (skipDepOffe) {
              console.log(`   │     └─ ${articleCode} x${quantity}: IGNORÉ (exception DEP_OFFE + SAV)`);
            } else {
              console.log(`   │     └─ ${articleCode} x${quantity}: Tech ${prixTech}€, Ent ${prixEnt}€`);
            }
          } else {
            console.log(`   │     └─ ⚠️  ${articleCode} x${quantity}: PRIX NON TROUVÉ dans company_pricing`);
          }
        }

        if (hasArticles) {
          console.log(`   │  💰 RECETTE: Tech ${totalTech.toFixed(2)}€ | Ent ${totalEnt.toFixed(2)}€ | Total ${(totalTech + totalEnt).toFixed(2)}€`);
        } else {
          console.log(`   │  ⚠️  Aucun article valide trouvé`);
        }
      } else {
        console.log(`   │  ⚠️  PAS D'ARTICLES - Recette: 0€`);
      }
      console.log(`   │`);
    }

    // 4. Calculer le total via la même logique que l'API
    console.log('\n💰 4. CALCUL TOTAL (logique API revenue-calculation):');
    
    const revenueResult = await pool.query(`
      WITH intervention_revenue AS (
        SELECT 
          i.id as intervention_id,
          i.num_inter,
          i.articles,
          i.type_intervention,
          i.grille,
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    WHEN cp.prix_tech IS NOT NULL THEN 
                      cp.prix_tech * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = CASE 
                    WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                    ELSE 'SAV'
                  END
                WHERE article_item != 'nan' 
                  AND TRIM(article_item) != ''
                ), 0
              )
            ELSE 0
          END as recette_technicien,
          CASE 
            WHEN i.statut = 'CLOTURE TERMINEE' THEN
              COALESCE(
                (SELECT SUM(
                  CASE 
                    WHEN TRIM(SPLIT_PART(article_item, 'x', 1)) = 'DEP_OFFE' 
                         AND i.articles LIKE '%SAV%' THEN 0
                    WHEN cp.prix_base IS NOT NULL THEN 
                      cp.prix_base * COALESCE(NULLIF(TRIM(SPLIT_PART(article_item, 'x', 2)), '')::INTEGER, 1)
                    ELSE 0
                  END
                )
                FROM unnest(string_to_array(i.articles, ',')) as article_item
                LEFT JOIN company_pricing cp ON 
                  TRIM(SPLIT_PART(article_item, 'x', 1)) = cp.service_code
                  AND cp.company_name = CASE 
                    WHEN i.grille LIKE '%AXECOM%' THEN 'AXECOM'
                    ELSE 'ERT OUEST'
                  END
                  AND cp.category = CASE 
                    WHEN i.type_intervention IN ('RACC', 'RECO', 'RECC') THEN 'RACC'
                    ELSE 'SAV'
                  END
                WHERE article_item != 'nan' 
                  AND TRIM(article_item) != ''
                ), 0
              )
            ELSE 0
          END as recette_entreprise
        FROM interventions i
        WHERE LOWER(i.nom_technicien) = LOWER($1) 
          AND LOWER(i.prenom_technicien) = LOWER($2)
          AND i.statut = 'CLOTURE TERMINEE'
      )
      SELECT 
        COUNT(*) as nombre_interventions,
        SUM(recette_technicien) as total_recette_technicien,
        SUM(recette_entreprise) as total_recette_entreprise,
        SUM(recette_technicien + recette_entreprise) as total_recette_generale,
        COUNT(CASE WHEN recette_technicien > 0 THEN 1 END) as interventions_avec_recette,
        COUNT(CASE WHEN recette_technicien = 0 THEN 1 END) as interventions_sans_recette
      FROM intervention_revenue
    `, [nomTech, prenomTech]);

    const revenue = revenueResult.rows[0];
    console.log(`   📊 Nombre d'interventions: ${revenue.nombre_interventions}`);
    console.log(`   ✅ Avec recette: ${revenue.interventions_avec_recette}`);
    console.log(`   ⚠️  Sans recette: ${revenue.interventions_sans_recette}`);
    console.log(`   💰 Recette Technicien: ${parseFloat(revenue.total_recette_technicien || 0).toFixed(2)}€`);
    console.log(`   💰 Recette Entreprise: ${parseFloat(revenue.total_recette_entreprise || 0).toFixed(2)}€`);
    console.log(`   💰 Recette Totale: ${parseFloat(revenue.total_recette_generale || 0).toFixed(2)}€`);

    // 5. Vérifier les réclamations Free confirmées
    console.log('\n🎯 5. RÉCLAMATIONS FREE CONFIRMÉES:');
    if (employeResult.rows.length > 0) {
      const empId = employeResult.rows[0].id;
      const reclaFreeResult = await pool.query(`
        SELECT 
          COUNT(*) as nombre,
          SUM(montant_technicien) as montant_tech,
          SUM(montant_entreprise) as montant_ent
        FROM recla_free
        WHERE employe_id = $1 AND confirmer = TRUE
      `, [empId]);

      if (reclaFreeResult.rows.length > 0 && reclaFreeResult.rows[0].nombre > 0) {
        const recla = reclaFreeResult.rows[0];
        console.log(`   ✅ ${recla.nombre} réclamation(s) confirmée(s)`);
        console.log(`   💰 Montant Technicien: ${parseFloat(recla.montant_tech || 0).toFixed(2)}€`);
        console.log(`   💰 Montant Entreprise: ${parseFloat(recla.montant_ent || 0).toFixed(2)}€`);
        console.log(`   💰 Total Récla Free: ${(parseFloat(recla.montant_tech || 0) + parseFloat(recla.montant_ent || 0)).toFixed(2)}€`);
      } else {
        console.log(`   ℹ️  Aucune réclamation Free confirmée`);
      }
    } else {
      console.log(`   ⚠️  Pas d'ID employé - impossible de vérifier les réclamations`);
    }

    // 6. Résumé final
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 RÉSUMÉ - CE QUI EST PRIS EN COMPTE:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n✅ INCLUS DANS LA RECETTE:');
    console.log('   1. Interventions avec statut "CLOTURE TERMINEE" uniquement');
    console.log('   2. Articles listés dans la colonne "articles"');
    console.log('   3. Prix technicien (prix_tech) de la table company_pricing');
    console.log('   4. Tarification selon la grille (AXECOM ou ERT OUEST)');
    console.log('   5. Tarification selon le type (SAV ou RACC)');
    console.log('   6. Quantités (format: CODE x QUANTITÉ)');
    console.log('   7. Réclamations Free confirmées (si présentes)');
    
    console.log('\n❌ EXCLUS DE LA RECETTE:');
    console.log('   1. Interventions non terminées (autre statut)');
    console.log('   2. Articles = "nan" ou vides');
    console.log('   3. Articles non trouvés dans company_pricing');
    console.log('   4. DEP_OFFE quand il y a SAV dans la même intervention');
    console.log('   5. Réclamations Free non confirmées');

    console.log('\n⚠️  VÉRIFICATIONS À FAIRE:');
    if (parseInt(revenue.interventions_sans_recette) > 0) {
      console.log(`   ⚠️  ${revenue.interventions_sans_recette} intervention(s) sans recette`);
      console.log('       → Vérifier que les articles sont bien renseignés');
      console.log('       → Vérifier que les codes articles existent dans company_pricing');
    }
    if (parseInt(counts.sans_articles) > 0) {
      console.log(`   ⚠️  ${counts.sans_articles} intervention(s) sans articles`);
      console.log('       → Ces interventions génèrent 0€ de recette');
    }
    if (employeResult.rows.length === 0) {
      console.log(`   ⚠️  Technicien non présent dans la table employes`);
      console.log('       → Un employé virtuel sera créé avec ID -1');
    }

    console.log('\n✅ Analyse terminée');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkTechnicienRevenueDetail();
