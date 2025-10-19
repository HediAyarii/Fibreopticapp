import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024',
  ssl: false,
  max: 50,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

async function checkAllRapCalculations() {
  console.log('🔍 Vérification de tous les calculs RAP...');
  
  try {
    // 1. Récupérer tous les enregistrements de cout_par_salaire
    console.log('\n📊 1. Récupération de tous les enregistrements:');
    const allResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        matricule,
        mois,
        annee,
        total_genere,
        salaire_net,
        charge,
        taxe,
        penalite,
        rap
      FROM cout_par_salaire
      WHERE mois = 5 AND annee = 2025
      ORDER BY nom, prenom
    `);
    
    console.log(`   📊 Enregistrements trouvés: ${allResult.rows.length}`);
    
    // 2. Vérifier chaque enregistrement
    console.log('\n📊 2. Vérification des calculs RAP:');
    let incorrectCount = 0;
    let correctCount = 0;
    const incorrectRecords = [];
    
    for (const row of allResult.rows) {
      const totalGenere = parseFloat(row.total_genere) || 0;
      const salaireNet = parseFloat(row.salaire_net) || 0;
      const charge = parseFloat(row.charge) || 0;
      const taxe = parseFloat(row.taxe) || 0;
      const penalite = parseFloat(row.penalite) || 0;
      const rapActuel = parseFloat(row.rap) || 0;
      
      const totalCouts = salaireNet + charge + taxe + penalite;
      const rapCalcule = totalGenere - totalCouts;
      
      const difference = Math.abs(rapActuel - rapCalcule);
      
      if (difference > 0.01) {
        incorrectCount++;
        incorrectRecords.push({
          id: row.id,
          nom: row.nom,
          prenom: row.prenom,
          totalGenere,
          totalCouts,
          rapActuel,
          rapCalcule,
          difference
        });
        
        console.log(`   ❌ ${row.nom} ${row.prenom}:`);
        console.log(`      Total Généré: ${totalGenere}€`);
        console.log(`      Total Coûts: ${totalCouts}€`);
        console.log(`      RAP Actuel: ${rapActuel}€`);
        console.log(`      RAP Calculé: ${rapCalcule}€`);
        console.log(`      Différence: ${difference}€`);
      } else {
        correctCount++;
        console.log(`   ✅ ${row.nom} ${row.prenom}: RAP correct (${rapActuel}€)`);
      }
    }
    
    console.log(`\n📊 3. Résumé des vérifications:`);
    console.log(`   📊 Total enregistrements: ${allResult.rows.length}`);
    console.log(`   📊 RAP corrects: ${correctCount}`);
    console.log(`   📊 RAP incorrects: ${incorrectCount}`);
    
    // 3. Vérifier les paiements existants
    console.log('\n📊 4. Vérification des paiements existants:');
    const paiementsResult = await pool.query(`
      SELECT 
        pe.cout_par_salaire_id,
        SUM(pe.montant_verse) as total_paiements,
        COUNT(*) as nombre_paiements
      FROM paiements_employes pe
      GROUP BY pe.cout_par_salaire_id
    `);
    
    console.log(`   📊 Coûts avec paiements: ${paiementsResult.rows.length}`);
    const paiementsMap = new Map();
    paiementsResult.rows.forEach(row => {
      paiementsMap.set(row.cout_par_salaire_id, {
        total: parseFloat(row.total_paiements),
        count: parseInt(row.nombre_paiements)
      });
    });
    
    // 4. Calculer les RAP corrects avec paiements
    console.log('\n📊 5. Calcul des RAP corrects avec paiements:');
    const corrections = [];
    
    for (const record of incorrectRecords) {
      const paiements = paiementsMap.get(record.id) || { total: 0, count: 0 };
      const rapCorrect = record.totalGenere - record.totalCouts - paiements.total;
      
      corrections.push({
        id: record.id,
        nom: record.nom,
        prenom: record.prenom,
        rapActuel: record.rapActuel,
        rapCorrect: rapCorrect,
        paiements: paiements.total,
        nombrePaiements: paiements.count
      });
      
      console.log(`   🔧 ${record.nom} ${record.prenom}:`);
      console.log(`      RAP Actuel: ${record.rapActuel}€`);
      console.log(`      Paiements: ${paiements.total}€ (${paiements.count} paiements)`);
      console.log(`      RAP Correct: ${rapCorrect}€`);
    }
    
    console.log(`\n📊 6. Corrections nécessaires:`);
    console.log(`   📊 ${corrections.length} enregistrements à corriger`);
    
    return corrections;
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
    return [];
  } finally {
    await pool.end();
  }
}

checkAllRapCalculations().catch(console.error);
