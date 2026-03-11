const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://finalfibre_user:finalfibre_password_2024@localhost:5432/finalfibre_db' });

(async () => {
  try {
    // Check reclamations for this num_inter
    const rec = await pool.query(
      "SELECT id, intervention_id, num_inter, nom_technicien, prenom_technicien, type_reclamation, statut, description FROM reclamations_techniques WHERE num_inter = '152806964' ORDER BY id"
    );
    console.log('=== RECLAMATIONS for 152806964 ===');
    rec.rows.forEach(r => {
      console.log(`  Reclamation ID=${r.id}, intervention_id=${r.intervention_id}, statut=${r.statut}, type=${r.type_reclamation}`);
      console.log(`    technicien: ${r.prenom_technicien} ${r.nom_technicien}`);
      console.log(`    description: ${r.description.substring(0, 100)}`);
    });
    
    // Check interventions for this num_inter
    const inter = await pool.query(
      "SELECT id, num_inter, statut, articles, client, date_rdv FROM interventions WHERE num_inter = '152806964' ORDER BY id"
    );
    console.log('\n=== INTERVENTIONS for 152806964 ===');
    inter.rows.forEach(i => {
      console.log(`  Intervention ID=${i.id}, statut=${i.statut}, client=${i.client}, articles=${i.articles}, date_rdv=${i.date_rdv}`);
    });
    
    // Show what the new LEFT JOIN produces (intervention_id)
    const joined = await pool.query(
      "SELECT rt.id as reclamation_id, rt.intervention_id, rt.num_inter, i.id as matched_intervention_id, i.statut as intervention_statut, i.articles FROM reclamations_techniques rt LEFT JOIN interventions i ON rt.intervention_id = i.id WHERE rt.num_inter = '152806964'"
    );
    console.log('\n=== NEW JOIN ON intervention_id ===');
    joined.rows.forEach(r => {
      console.log(`  Rec ID=${r.reclamation_id}, intervention_id=${r.intervention_id}, matched_id=${r.matched_intervention_id}, inter_statut=${r.intervention_statut}, articles=${r.articles}`);
    });
    
    // Show what the old LEFT JOIN produces (num_inter)
    const oldJoined = await pool.query(
      "SELECT rt.id as reclamation_id, rt.intervention_id, rt.num_inter, i.id as matched_intervention_id, i.statut as intervention_statut, i.articles FROM reclamations_techniques rt LEFT JOIN interventions i ON rt.num_inter = i.num_inter WHERE rt.num_inter = '152806964'"
    );
    console.log('\n=== OLD JOIN ON num_inter (cartesian) ===');
    oldJoined.rows.forEach(r => {
      console.log(`  Rec ID=${r.reclamation_id}, intervention_id=${r.intervention_id}, matched_id=${r.matched_intervention_id}, inter_statut=${r.intervention_statut}, articles=${r.articles}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
