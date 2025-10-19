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

async function checkTableStructure() {
  console.log('🔍 Vérification de la structure de la table cout_par_salaire...');
  
  try {
    // 1. Vérifier la structure de la table
    console.log('\n📊 1. Structure de la table:');
    const structureResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cout_par_salaire'
      AND column_name IN ('taxe', 'rap', 'total_genere', 'salaire_net', 'charge')
      ORDER BY column_name
    `);
    
    console.log(`   📊 Colonnes numériques: ${structureResult.rows.length}`);
    structureResult.rows.forEach(row => {
      console.log(`      ${row.column_name}: ${row.data_type}(${row.numeric_precision},${row.numeric_scale})`);
    });
    
    // 2. Vérifier les valeurs actuelles
    console.log('\n📊 2. Valeurs actuelles:');
    const valuesResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        taxe,
        rap
      FROM cout_par_salaire
      ORDER BY nom, prenom
      LIMIT 5
    `);
    
    console.log(`   📊 Échantillon de données: ${valuesResult.rows.length} enregistrements`);
    valuesResult.rows.forEach(row => {
      console.log(`      ${row.nom} ${row.prenom}:`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         Salaire Net: ${row.salaire_net}€`);
      console.log(`         Charge: ${row.charge}€`);
      console.log(`         Taxe: ${row.taxe}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    // 3. Vérifier les valeurs problématiques
    console.log('\n📊 3. Vérification des valeurs problématiques:');
    const problematicResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        total_genere,
        salaire_net,
        charge,
        taxe,
        rap,
        (charge * 0.5) as impot_calcule,
        (total_genere - salaire_net - (charge * 0.5)) as rap_calcule
      FROM cout_par_salaire
      WHERE ABS(charge * 0.5) > 999.99
         OR ABS(total_genere - salaire_net - (charge * 0.5)) > 999.99
      ORDER BY ABS(charge * 0.5) DESC
    `);
    
    console.log(`   📊 Valeurs problématiques: ${problematicResult.rows.length} enregistrements`);
    problematicResult.rows.forEach(row => {
      console.log(`      ${row.nom} ${row.prenom}:`);
      console.log(`         Charge: ${row.charge}€`);
      console.log(`         Impôt calculé: ${row.impot_calcule}€`);
      console.log(`         RAP calculé: ${row.rap_calcule}€`);
    });
    
    // 4. Proposer une solution
    console.log('\n📊 4. Solution proposée:');
    if (problematicResult.rows.length > 0) {
      console.log('   ❌ Des valeurs dépassent la capacité des colonnes NUMERIC(5,2)');
      console.log('   🔧 Solution: Modifier la structure de la table pour accepter des valeurs plus grandes');
      
      console.log('\n📊 5. Modification de la structure:');
      try {
        await pool.query(`
          ALTER TABLE cout_par_salaire
          ALTER COLUMN taxe TYPE NUMERIC(10,2),
          ALTER COLUMN rap TYPE NUMERIC(10,2)
        `);
        
        console.log('   ✅ Structure modifiée: taxe et rap sont maintenant NUMERIC(10,2)');
      } catch (error) {
        console.log(`   ❌ Erreur lors de la modification: ${error.message}`);
      }
    } else {
      console.log('   ✅ Aucune valeur problématique détectée');
    }
    
    console.log('\n🎯 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

checkTableStructure().catch(console.error);
