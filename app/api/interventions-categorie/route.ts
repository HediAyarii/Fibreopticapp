import { type NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nomTechnicien = searchParams.get('nom_technicien');
    const prenomTechnicien = searchParams.get('prenom_technicien');
    const dateDebut = searchParams.get('date_debut');
    const dateFin = searchParams.get('date_fin');

    if (!nomTechnicien || !prenomTechnicien) {
      return NextResponse.json(
        { error: 'nom_technicien et prenom_technicien sont requis' },
        { status: 400 }
      );
    }

    // Construire la requête SQL avec calcul des montants
    let sqlQuery = `
      WITH intervention_prices AS (
        SELECT 
          i.id,
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
          END as recette_technicien
        FROM interventions i
        WHERE i.statut = 'CLOTURE TERMINEE'
          AND i.nom_technicien = $1
          AND i.prenom_technicien = $2
    `;

    const params: any[] = [nomTechnicien, prenomTechnicien];

    if (dateDebut && dateFin) {
      sqlQuery += ` AND i.date_rdv::date BETWEEN $3::date AND $4::date`;
      params.push(dateDebut, dateFin);
    }

    sqlQuery += `
      )
      SELECT 
        CASE 
          WHEN articles LIKE '%RACPAV%' OR articles LIKE '%RACPRO_S%' OR articles LIKE '%RAC_PBO_AERIEN%' OR articles LIKE '%RAC_PBO_FACADE%' OR articles LIKE '%RAC_PBO_SOUT%' THEN 'Pavillon'
          WHEN articles LIKE '%RACIH%' THEN 'Intérieur'
          WHEN articles LIKE '%REFRAC%' THEN 'Refrac'
          WHEN articles LIKE '%DEP_OFFE%' OR articles LIKE '%SAV%' THEN 'SAV'
          WHEN articles LIKE '%RECOIP%' THEN 'Reco'
          WHEN articles = 'nan' OR articles = '' OR articles IS NULL THEN 'En cours'
          ELSE 'Autre'
        END as categorie,
        COUNT(*) as nombre,
        SUM(CASE WHEN articles LIKE '%REPFOU_PRI%' OR articles LIKE '%REPFOU_PUB%' OR articles LIKE '%FOURREAU_CASSE_PRIVE%' THEN 1 ELSE 0 END) as f8,
        SUM(CASE WHEN articles LIKE '%REPFOU_ASPHA%' OR articles LIKE '%FOURREAU_CASSE_BETON%' THEN 1 ELSE 0 END) as t8,
        COALESCE(SUM(recette_technicien), 0) as montant_total
      FROM intervention_prices
      GROUP BY categorie
      ORDER BY nombre DESC
    `;

    const result = await query(sqlQuery, params);

    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error('Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
