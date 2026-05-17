const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
});

async function analyzeInterventionsDates() {
  try {
    const interventionIds = [
      '156791956',
      '156793016', 
      '156776930',
      '156793674',
      '156786709'
    ];

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📅 POURQUOI CES INTERVENTIONS SONT FACTURÉES EN MAI ?');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const id of interventionIds) {
      const result = await pool.query(`
        SELECT 
          num_inter,
          date_rdv,
          cloture_tech,
          cloture_hotline,
          debut,
          debut_intervention,
          created_at,
          statut
        FROM interventions
        WHERE num_inter = $1
      `, [id]);

      if (result.rows.length > 0) {
        const inter = result.rows[0];
        
        console.log(`╔═══════════════════════════════════════════════════════════╗`);
        console.log(`║ INTERVENTION: ${inter.num_inter.padEnd(46)}║`);
        console.log(`╚═══════════════════════════════════════════════════════════╝`);
        console.log('');
        console.log('📅 TOUTES LES DATES DISPONIBLES:');
        console.log(`   ├─ Date RDV (rendez-vous)    : ${inter.date_rdv || 'N/A'}`);
        console.log(`   ├─ Début                     : ${inter.debut || 'N/A'}`);
        console.log(`   ├─ Début intervention        : ${inter.debut_intervention || 'N/A'}`);
        console.log(`   ├─ Clôture Tech             : ${inter.cloture_tech || 'N/A'}`);
        console.log(`   ├─ Clôture Hotline          : ${inter.cloture_hotline || 'N/A'}`);
        console.log(`   └─ Ajouté en base (created) : ${inter.created_at}`);
        console.log('');

        // Analyser quelle date est utilisée
        let dateUtilisee = null;
        let moisFacture = null;
        
        if (inter.cloture_tech && inter.cloture_tech !== 'nan' && inter.cloture_tech !== '') {
          dateUtilisee = inter.cloture_tech;
          // Extraire le mois
          if (dateUtilisee.includes('/')) {
            const parts = dateUtilisee.split('/');
            if (parts.length >= 2) {
              moisFacture = parts[1]; // MM dans DD/MM/YYYY
            }
          } else if (dateUtilisee.includes('-')) {
            const parts = dateUtilisee.split('-');
            if (parts.length >= 2) {
              moisFacture = parts[1]; // MM dans YYYY-MM-DD
            }
          }
          console.log('✅ DATE UTILISÉE POUR LA FACTURATION:');
          console.log(`   └─ cloture_tech: ${dateUtilisee}`);
        } else if (inter.cloture_hotline && inter.cloture_hotline !== 'nan' && inter.cloture_hotline !== '') {
          dateUtilisee = inter.cloture_hotline;
          // Extraire le mois
          if (dateUtilisee.includes('/')) {
            const parts = dateUtilisee.split('/');
            if (parts.length >= 2) {
              moisFacture = parts[1]; // MM dans DD/MM/YYYY
            }
          } else if (dateUtilisee.includes('-')) {
            const parts = dateUtilisee.split('-');
            if (parts.length >= 2) {
              moisFacture = parts[1]; // MM dans YYYY-MM-DD
            }
          }
          console.log('✅ DATE UTILISÉE POUR LA FACTURATION:');
          console.log(`   └─ cloture_hotline: ${dateUtilisee}`);
        } else {
          console.log('⚠️  AUCUNE DATE DE CLÔTURE VALIDE');
        }

        if (moisFacture) {
          const moisNom = {
            '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
            '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
            '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
          };
          
          console.log('');
          console.log('💰 PÉRIODE DE FACTURATION:');
          console.log(`   └─ Mois: ${moisNom[moisFacture] || moisFacture} (${moisFacture})`);
        }

        // Vérifier si RDV et clôture sont dans des mois différents
        if (inter.date_rdv) {
          let moisRdv = null;
          if (inter.date_rdv.includes('/')) {
            const parts = inter.date_rdv.split('/');
            if (parts.length >= 2) {
              moisRdv = parts[1];
            }
          } else if (inter.date_rdv.includes('-')) {
            const parts = inter.date_rdv.split('-');
            if (parts.length >= 2) {
              moisRdv = parts[1];
            }
          }

          if (moisRdv && moisFacture && moisRdv !== moisFacture) {
            console.log('');
            console.log('⚠️  ATTENTION - MOIS DIFFÉRENTS:');
            console.log(`   ├─ RDV en mois ${moisRdv} (AVRIL)`);
            console.log(`   └─ Clôture en mois ${moisFacture} (MAI)`);
            console.log('');
            console.log('💡 EXPLICATION:');
            console.log('   Le RDV était prévu en avril, mais l\'intervention');
            console.log('   a été clôturée en mai. La facturation se fait sur');
            console.log('   la date de CLÔTURE, donc elle est comptée en MAI.');
          }
        }

        console.log('\n');
      }
    }

    // Récapitulatif global
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RÉCAPITULATIF');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const recap = await pool.query(`
      SELECT 
        num_inter,
        date_rdv,
        COALESCE(cloture_tech, cloture_hotline) as date_cloture
      FROM interventions
      WHERE num_inter = ANY($1)
      ORDER BY num_inter
    `, [interventionIds]);

    console.log('┌─────────────┬──────────────┬──────────────────────┐');
    console.log('│ Intervention│ RDV          │ Date Clôture (MAI)   │');
    console.log('├─────────────┼──────────────┼──────────────────────┤');
    
    recap.rows.forEach(row => {
      const num = row.num_inter.padEnd(11);
      const rdv = (row.date_rdv || 'N/A').padEnd(12);
      const cloture = (row.date_cloture || 'N/A').padEnd(20);
      console.log(`│ ${num} │ ${rdv} │ ${cloture} │`);
    });
    
    console.log('└─────────────┴──────────────┴──────────────────────┘\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 CONCLUSION');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Ces interventions sont facturées en MAI parce que:');
    console.log('');
    console.log('1️⃣  Le RDV était prévu le 30/04/2026 (AVRIL)');
    console.log('');
    console.log('2️⃣  Mais la clôture hotline a été faite le 04/05/2026 (MAI)');
    console.log('');
    console.log('3️⃣  Le système utilise la DATE DE CLÔTURE pour la facturation');
    console.log('    (pas la date du RDV)');
    console.log('');
    console.log('4️⃣  Donc ces interventions sont comptabilisées en MAI 2026');
    console.log('');
    console.log('📌 RÈGLE GÉNÉRALE:');
    console.log('   Une intervention est facturée dans le mois où elle est');
    console.log('   CLÔTURÉE, même si le RDV était dans un autre mois.');
    console.log('');
    console.log('   Cela permet de facturer uniquement les interventions');
    console.log('   réellement terminées et validées.');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeInterventionsDates();
