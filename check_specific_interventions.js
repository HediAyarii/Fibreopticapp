const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function checkInterventions() {
  try {
    const interventionIds = [
      '156776930',
      '156793016',
      '156791956',
      '156793674',
      '156786709'
    ];

    console.log('🔍 Recherche des interventions...\n');
    
    for (const id of interventionIds) {
      console.log(`════════════════════════════════════════════════════════`);
      console.log(`📋 INTERVENTION: ${id}`);
      console.log(`════════════════════════════════════════════════════════`);
      
      const result = await pool.query(`
        SELECT 
          num_inter,
          statut,
          date_rdv,
          cloture_tech,
          cloture_hotline,
          type_intervention,
          nom_technicien,
          prenom_technicien,
          mobile,
          num_abonne,
          nom_abonne,
          ville,
          rue,
          numero,
          code_postal,
          grille,
          articles,
          commentaires_technicien,
          commentaires_cloture,
          client,
          societe,
          region,
          plaque,
          debut,
          duree,
          debut_intervention,
          motif_echec,
          garantie,
          created_at
        FROM interventions
        WHERE num_inter = $1
      `, [id]);

      if (result.rows.length === 0) {
        console.log(`❌ Intervention ${id} non trouvée dans la base de données\n`);
      } else {
        const intervention = result.rows[0];
        
        console.log(`📊 Informations générales:`);
        console.log(`   • Numéro: ${intervention.num_inter}`);
        console.log(`   • Statut: ${intervention.statut || 'N/A'}`);
        console.log(`   • Type: ${intervention.type_intervention || 'N/A'}`);
        console.log(`   • Grille: ${intervention.grille || 'N/A'}`);
        console.log(`   • Société: ${intervention.societe || 'N/A'}`);
        console.log(`   • Région: ${intervention.region || 'N/A'}`);
        
        console.log(`\n📅 Dates:`);
        console.log(`   • Date RDV: ${intervention.date_rdv || 'N/A'}`);
        console.log(`   • Début: ${intervention.debut || 'N/A'}`);
        console.log(`   • Durée: ${intervention.duree || 'N/A'}`);
        console.log(`   • Début intervention: ${intervention.debut_intervention || 'N/A'}`);
        console.log(`   • Clôture Tech: ${intervention.cloture_tech || 'N/A'}`);
        console.log(`   • Clôture Hotline: ${intervention.cloture_hotline || 'N/A'}`);
        console.log(`   • Créé le: ${intervention.created_at || 'N/A'}`);
        
        console.log(`\n👤 Technicien:`);
        console.log(`   • Nom: ${intervention.nom_technicien || 'N/A'}`);
        console.log(`   • Prénom: ${intervention.prenom_technicien || 'N/A'}`);
        console.log(`   • Mobile: ${intervention.mobile || 'N/A'}`);
        console.log(`   • Plaque: ${intervention.plaque || 'N/A'}`);
        
        console.log(`\n👥 Client:`);
        console.log(`   • Nom client: ${intervention.client || 'N/A'}`);
        console.log(`   • Nom abonné: ${intervention.nom_abonne || 'N/A'}`);
        console.log(`   • Num abonné: ${intervention.num_abonne || 'N/A'}`);
        
        console.log(`\n📍 Localisation:`);
        console.log(`   • Ville: ${intervention.ville || 'N/A'}`);
        console.log(`   • Code postal: ${intervention.code_postal || 'N/A'}`);
        console.log(`   • Rue: ${intervention.rue || 'N/A'}`);
        console.log(`   • Numéro: ${intervention.numero || 'N/A'}`);
        
        console.log(`\n📦 Articles:`);
        console.log(`   ${intervention.articles || 'Aucun article'}`);
        
        console.log(`\n💬 Commentaires:`);
        console.log(`   • Tech: ${intervention.commentaires_technicien || 'Aucun'}`);
        console.log(`   • Clôture: ${intervention.commentaires_cloture || 'Aucun'}`);
        
        console.log(`\n📋 Autres infos:`);
        console.log(`   • Garantie: ${intervention.garantie || 'N/A'}`);
        console.log(`   • Motif échec: ${intervention.motif_echec || 'N/A'}`);
        
        console.log('');
      }
    }
    
    // Résumé
    console.log(`════════════════════════════════════════════════════════`);
    console.log(`📊 RÉSUMÉ`);
    console.log(`════════════════════════════════════════════════════════`);
    
    const summaryResult = await pool.query(`
      SELECT 
        num_inter,
        statut,
        date_rdv,
        COALESCE(cloture_tech, cloture_hotline) as date_cloture
      FROM interventions
      WHERE num_inter = ANY($1)
      ORDER BY num_inter
    `, [interventionIds]);
    
    console.log('\n| Numéro      | Statut            | Date RDV   | Date Clôture |');
    console.log('|-------------|-------------------|------------|--------------|');
    
    summaryResult.rows.forEach(row => {
      const numero = row.num_inter || 'N/A';
      const statut = (row.statut || 'N/A').padEnd(17);
      const dateRdv = (row.date_rdv || 'N/A').padEnd(10);
      const dateCloture = (row.date_cloture || 'N/A').padEnd(12);
      console.log(`| ${numero} | ${statut} | ${dateRdv} | ${dateCloture} |`);
    });
    
    console.log('\n✅ Recherche terminée');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkInterventions();
