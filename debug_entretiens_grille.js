const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db'
});

async function test() {
  try {
    // Vérifier les entretiens de décembre 2025
    const entretiens = await pool.query(`
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
      LEFT JOIN assignations_vehicules av ON v.id = av.vehicule_id AND av.statut = 'active'
      LEFT JOIN employes e ON av.employe_id = e.id
      WHERE ev.date_entretien >= '2025-12-01' AND ev.date_entretien <= '2025-12-31'
      ORDER BY ev.date_entretien DESC
    `);
    
    console.log('=== ENTRETIENS DECEMBRE 2025 ===');
    console.log('Nombre:', entretiens.rows.length);
    
    let total = 0;
    for (const e of entretiens.rows) {
      const cout = parseFloat(e.cout_entretien) || parseFloat(e.cout) || 0;
      total += cout;
      console.log(`- Véhicule: ${e.vehicule_matricule}, Employé: ${e.employe_nom || 'N/A'} ${e.employe_prenom || ''} (${e.employe_matricule || 'N/A'}), Coût: ${cout}€`);
    }
    console.log('Total:', total, '€');
    
    // Vérifier l'appartenance grille de chaque employé
    console.log('\n=== APPARTENANCE GRILLE DES EMPLOYES ===');
    
    const employesAvecEntretiens = entretiens.rows.filter(e => e.employe_matricule);
    const matriculesUniques = [...new Set(employesAvecEntretiens.map(e => e.employe_matricule))];
    
    for (const matricule of matriculesUniques) {
      const grilleResult = await pool.query(`
        SELECT 
          COUNT(CASE WHEN i.grille IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE') THEN 1 END) as count_axecom,
          COUNT(CASE WHEN i.grille NOT IN ('AXECOM MANCHE', 'B2B : AXECOM MANCHE') AND i.grille IS NOT NULL AND i.grille != '' THEN 1 END) as count_ert
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
            (i.date_rdv ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') >= '2025-12-01' AND TO_DATE(i.date_rdv, 'DD/MM/YYYY') <= '2025-12-31') OR
            (i.date_rdv ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND i.date_rdv::date >= '2025-12-01' AND i.date_rdv::date <= '2025-12-31')
          )
      `, [matricule]);
      
      const countAxecom = parseInt(grilleResult.rows[0]?.count_axecom) || 0;
      const countErt = parseInt(grilleResult.rows[0]?.count_ert) || 0;
      
      let appartenance = 'aucune';
      if (countAxecom > 0 && countErt > 0) {
        appartenance = 'BOTH (ERT + AXECOM)';
      } else if (countAxecom > 0) {
        appartenance = 'AXECOM';
      } else if (countErt > 0) {
        appartenance = 'ERT';
      }
      
      const emp = employesAvecEntretiens.find(e => e.employe_matricule === matricule);
      console.log(`- ${emp?.employe_nom} ${emp?.employe_prenom} (${matricule}): ${appartenance} (ERT: ${countErt}, AXECOM: ${countAxecom})`);
    }
    
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await pool.end();
  }
}

test();
