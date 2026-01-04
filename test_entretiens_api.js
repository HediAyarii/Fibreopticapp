const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function simulateAPI(startDate, endDate, grille) {
  console.log(`\n=== TEST API: grille=${grille} ===`);
  
  try {
    // Récupérer les entretiens avec assignations
    const entretiensResult = await pool.query(`
      SELECT 
        ev.id,
        ev.vehicule_id,
        ev.date_entretien,
        ev.cout_entretien,
        ev.cout,
        v.matricule as vehicule_matricule,
        av.employe_id,
        e.nom as employe_nom,
        e.prenom as employe_prenom,
        e.matricule as employe_matricule
      FROM entretiens_vehicules ev
      LEFT JOIN vehicules v ON ev.vehicule_id = v.id
      LEFT JOIN assignations_vehicules av ON v.id = av.vehicule_id 
        AND av.statut = 'active'
        AND av.date_assignation <= $2::date
        AND (av.date_fin IS NULL OR av.date_fin >= $1::date)
      LEFT JOIN employes e ON av.employe_id = e.id
      WHERE ev.date_entretien >= $1::date 
        AND ev.date_entretien <= $2::date
      ORDER BY ev.date_entretien DESC
    `, [startDate, endDate]);

    const entretiens = entretiensResult.rows;
    console.log('Entretiens trouvés:', entretiens.length);

    let totalBase = 0;
    let totalFiltre = 0;

    for (const entretien of entretiens) {
      let grilleEmploye = 'aucune';
      let coefficient = 1;

      if (entretien.employe_matricule) {
        // Vérifier l'appartenance grille
        const grilleResult = await pool.query(`
          SELECT 
            CASE WHEN COUNT(CASE WHEN i.grille IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE') THEN 1 END) > 0 THEN true ELSE false END as has_axecom,
            CASE WHEN COUNT(CASE WHEN i.grille NOT IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE') AND i.grille IS NOT NULL AND i.grille != '' THEN 1 END) > 0 THEN true ELSE false END as has_ert
          FROM interventions i
          JOIN employes e ON (
            (LOWER(TRIM(i.nom_technicien)) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(SPLIT_PART(i.prenom_technicien, ',', 1))) = LOWER(TRIM(e.prenom)))
            OR
            (LOWER(TRIM(SPLIT_PART(i.nom_technicien, ' ', 1))) = LOWER(TRIM(e.nom)) AND LOWER(TRIM(SPLIT_PART(i.prenom_technicien, ',', 1))) = LOWER(TRIM(e.prenom)))
          )
          WHERE e.matricule = $1
            AND i.date_rdv IS NOT NULL 
            AND i.date_rdv != '' 
            AND i.date_rdv != 'nan'
            AND i.date_rdv ~ '^[0-9]'
            AND (
              (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= $2::date AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= $3::date) OR
              (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.date_rdv::date >= $2::date AND i.date_rdv::date <= $3::date)
            )
        `, [entretien.employe_matricule, startDate, endDate]);

        const hasAxecom = grilleResult.rows[0]?.has_axecom || false;
        const hasErt = grilleResult.rows[0]?.has_ert || false;

        if (hasAxecom && hasErt) {
          grilleEmploye = 'both';
        } else if (hasAxecom) {
          grilleEmploye = 'axecom';
        } else if (hasErt) {
          grilleEmploye = 'ert';
        }
      }

      // Déterminer le coefficient selon le filtre
      if (grille && grille !== 'tout') {
        if (grilleEmploye === 'both' || grilleEmploye === 'aucune') {
          coefficient = 0.5;
        } else if (grille === 'ert' && grilleEmploye === 'axecom') {
          coefficient = 0;
        } else if (grille === 'axecom' && grilleEmploye === 'ert') {
          coefficient = 0;
        }
      }

      const coutBase = parseFloat(entretien.cout_entretien) || parseFloat(entretien.cout) || 0;
      const coutFiltre = coutBase * coefficient;
      
      totalBase += coutBase;
      totalFiltre += coutFiltre;

      console.log(`  - ${entretien.employe_nom || 'N/A'} ${entretien.employe_prenom || ''}: ${coutBase}€ x ${coefficient} = ${coutFiltre}€ (grille: ${grilleEmploye})`);
    }

    console.log(`\nTotal base: ${totalBase}€`);
    console.log(`Total filtré (${grille}): ${totalFiltre}€`);
    
    return { totalBase, totalFiltre };
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

async function main() {
  await simulateAPI('2025-12-01', '2025-12-31', 'tout');
  await simulateAPI('2025-12-01', '2025-12-31', 'ert');
  await simulateAPI('2025-12-01', '2025-12-31', 'axecom');
  
  await pool.end();
}

main();
