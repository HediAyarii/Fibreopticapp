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

async function addPrimeField() {
  console.log('🔧 Ajout du champ "prime" à la table cout_par_salaire...');
  
  try {
    // 1. Vérifier la structure actuelle
    console.log('\n📊 1. Vérification de la structure actuelle:');
    const structureResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'cout_par_salaire'
      ORDER BY ordinal_position
    `);
    
    console.log(`   📊 Colonnes actuelles: ${structureResult.rows.length}`);
    structureResult.rows.forEach(row => {
      console.log(`      ${row.column_name}: ${row.data_type}(${row.numeric_precision || 'N/A'},${row.numeric_scale || 'N/A'}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 2. Vérifier si le champ "prime" existe déjà
    console.log('\n📊 2. Vérification de l\'existence du champ "prime":');
    const primeExists = structureResult.rows.some(row => row.column_name === 'prime');
    
    if (primeExists) {
      console.log('   ✅ Le champ "prime" existe déjà');
    } else {
      console.log('   ❌ Le champ "prime" n\'existe pas, ajout en cours...');
      
      // 3. Ajouter le champ "prime"
      console.log('\n📊 3. Ajout du champ "prime":');
      await pool.query(`
        ALTER TABLE cout_par_salaire
        ADD COLUMN prime NUMERIC(10,2) DEFAULT 0.00
      `);
      
      console.log('   ✅ Champ "prime" ajouté avec succès');
    }
    
    // 4. Vérifier la nouvelle structure
    console.log('\n📊 4. Vérification de la nouvelle structure:');
    const newStructureResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'cout_par_salaire'
      ORDER BY ordinal_position
    `);
    
    console.log(`   📊 Colonnes après modification: ${newStructureResult.rows.length}`);
    newStructureResult.rows.forEach(row => {
      console.log(`      ${row.column_name}: ${row.data_type}(${row.numeric_precision || 'N/A'},${row.numeric_scale || 'N/A'}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${row.column_default || 'N/A'}`);
    });
    
    // 5. Mettre à jour les enregistrements existants avec prime = 0
    console.log('\n📊 5. Mise à jour des enregistrements existants:');
    const updateResult = await pool.query(`
      UPDATE cout_par_salaire
      SET prime = 0.00
      WHERE prime IS NULL
    `);
    
    console.log(`   ✅ ${updateResult.rowCount} enregistrements mis à jour`);
    
    // 6. Vérifier les données
    console.log('\n📊 6. Vérification des données:');
    const dataResult = await pool.query(`
      SELECT 
        id,
        nom,
        prenom,
        prime,
        total_genere,
        salaire_net,
        charge,
        taxe,
        rap
      FROM cout_par_salaire
      ORDER BY nom, prenom
      LIMIT 5
    `);
    
    console.log(`   📊 Échantillon de données: ${dataResult.rows.length} enregistrements`);
    dataResult.rows.forEach(row => {
      console.log(`      ${row.nom} ${row.prenom}:`);
      console.log(`         Prime: ${row.prime}€`);
      console.log(`         Total Généré: ${row.total_genere}€`);
      console.log(`         Salaire Net: ${row.salaire_net}€`);
      console.log(`         RAP: ${row.rap}€`);
    });
    
    console.log('\n🎯 Champ "prime" ajouté avec succès !');
    console.log('✅ Modifications apportées:');
    console.log('   - Champ "prime" ajouté à la table cout_par_salaire');
    console.log('   - Type: NUMERIC(10,2)');
    console.log('   - Valeur par défaut: 0.00€');
    console.log('   - Tous les enregistrements existants initialisés à 0.00€');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

addPrimeField().catch(console.error);
