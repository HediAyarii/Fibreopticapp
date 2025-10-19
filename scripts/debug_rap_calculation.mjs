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

async function debugRapCalculation() {
  console.log('🔍 Diagnostic du calcul du RAP...');
  
  try {
    // 1. Récupérer les données de BECHIRMOULAHI MOHAMED
    console.log('\n📊 1. Données de BECHIRMOULAHI MOHAMED:');
    const result = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        total_genere,
        salaire_net,
        salaire_brut,
        charge,
        taxe,
        impot,
        prime,
        rap,
        created_at,
        updated_at
      FROM cout_par_salaire
      WHERE LOWER(nom) LIKE '%moulahi%' AND LOWER(prenom) LIKE '%mohamed%'
    `);
    
    if (result.rows.length === 0) {
      console.log('   ❌ Aucun enregistrement trouvé');
      return;
    }
    
    const row = result.rows[0];
    console.log(`   📊 Enregistrement: ${row.nom} ${row.prenom}`);
    console.log(`      ID: ${row.id}`);
    console.log(`      Total Généré: ${row.total_genere}€`);
    console.log(`      Salaire Net: ${row.salaire_net}€`);
    console.log(`      Salaire Brut: ${row.salaire_brut}€`);
    console.log(`      Charge: ${row.charge}€`);
    console.log(`      Taxe: ${row.taxe}€`);
    console.log(`      Impôt: ${row.impot}€`);
    console.log(`      Prime: ${row.prime}€`);
    console.log(`      RAP: ${row.rap}€`);
    console.log(`      Updated: ${row.updated_at}`);
    
    // 2. Calculer le RAP manuellement
    console.log('\n📊 2. Calcul manuel du RAP:');
    const totalGenere = parseFloat(row.total_genere);
    const salaireNet = parseFloat(row.salaire_net);
    const charge = parseFloat(row.charge);
    const prime = parseFloat(row.prime || '0');
    
    const impot = charge * 0.5; // 50% de la charge
    const rapCalcule = totalGenere - salaireNet - impot + prime;
    
    console.log(`   📊 Formule: RAP = Total Généré - Salaire Net - Impôt + Prime`);
    console.log(`   📊 Calcul: ${totalGenere}€ - ${salaireNet}€ - ${impot}€ + ${prime}€ = ${rapCalcule}€`);
    console.log(`   📊 Impôt: ${impot}€ (50% de ${charge}€)`);
    console.log(`   📊 RAP Calculé: ${rapCalcule}€`);
    console.log(`   📊 RAP Base de données: ${row.rap}€`);
    
    const difference = Math.abs(parseFloat(row.rap) - rapCalcule);
    if (difference < 0.01) {
      console.log(`   ✅ RAP correct`);
    } else {
      console.log(`   ❌ RAP incorrect (diff: ${difference}€)`);
    }
    
    // 3. Mettre à jour le RAP manuellement
    console.log('\n📊 3. Mise à jour manuelle du RAP:');
    try {
      await pool.query(`
        UPDATE cout_par_salaire
        SET rap = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [rapCalcule, row.id]);
      
      console.log(`   ✅ RAP mis à jour: ${row.rap}€ → ${rapCalcule}€`);
    } catch (error) {
      console.log(`   ❌ Erreur lors de la mise à jour: ${error.message}`);
    }
    
    // 4. Vérification finale
    console.log('\n📊 4. Vérification finale:');
    const finalResult = await pool.query(`
      SELECT rap FROM cout_par_salaire WHERE id = $1
    `, [row.id]);
    
    if (finalResult.rows.length > 0) {
      const finalRap = finalResult.rows[0].rap;
      console.log(`   📊 RAP final: ${finalRap}€`);
      
      if (Math.abs(parseFloat(finalRap) - rapCalcule) < 0.01) {
        console.log(`   ✅ RAP correctement mis à jour`);
      } else {
        console.log(`   ❌ RAP non mis à jour`);
      }
    }
    
    console.log('\n🎯 Diagnostic terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

debugRapCalculation().catch(console.error);