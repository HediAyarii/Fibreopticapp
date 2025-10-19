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

async function testAddPrime() {
  console.log('🧪 Test d\'ajout de prime à un employé...');
  
  try {
    // 1. Ajouter une prime à BECHIRMOULAHI MOHAMED
    console.log('\n📊 1. Ajout d\'une prime à BECHIRMOULAHI MOHAMED:');
    const updateResult = await pool.query(`
      UPDATE cout_par_salaire
      SET prime = 150.00,
          updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(nom) LIKE '%moulahi%' AND LOWER(prenom) LIKE '%mohamed%'
      RETURNING id, nom, prenom, prime
    `);
    
    if (updateResult.rows.length > 0) {
      const updatedRow = updateResult.rows[0];
      console.log(`   ✅ Prime ajoutée: ${updatedRow.nom} ${updatedRow.prenom} - Prime: ${updatedRow.prime}€`);
    } else {
      console.log(`   ❌ Aucun employé trouvé pour la mise à jour`);
    }
    
    // 2. Ajouter une prime à BENKHALIFA AYMEN
    console.log('\n📊 2. Ajout d\'une prime à BENKHALIFA AYMEN:');
    const updateResult2 = await pool.query(`
      UPDATE cout_par_salaire
      SET prime = 200.00,
          updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(nom) LIKE '%benkhalifa%' AND LOWER(prenom) LIKE '%aymen%'
      RETURNING id, nom, prenom, prime
    `);
    
    if (updateResult2.rows.length > 0) {
      const updatedRow2 = updateResult2.rows[0];
      console.log(`   ✅ Prime ajoutée: ${updatedRow2.nom} ${updatedRow2.prenom} - Prime: ${updatedRow2.prime}€`);
    } else {
      console.log(`   ❌ Aucun employé trouvé pour la mise à jour`);
    }
    
    // 3. Vérifier les primes dans la base de données
    console.log('\n📊 3. Vérification des primes dans la base de données:');
    const primesResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        prime,
        total_genere,
        salaire_net,
        rap
      FROM cout_par_salaire
      WHERE prime > 0
      ORDER BY prime DESC
    `);
    
    console.log(`   📊 Employés avec primes > 0€: ${primesResult.rows.length}`);
    primesResult.rows.forEach(row => {
      console.log(`      ${row.nom} ${row.prenom}: Prime = ${row.prime}€`);
    });
    
    // 4. Vérifier tous les employés
    console.log('\n📊 4. Vérification de tous les employés:');
    const allResult = await pool.query(`
      SELECT 
        nom,
        prenom,
        prime,
        total_genere,
        rap
      FROM cout_par_salaire
      ORDER BY nom, prenom
    `);
    
    let primesCount = 0;
    let zeroPrimesCount = 0;
    
    allResult.rows.forEach(row => {
      if (row.prime && Number(row.prime) > 0) {
        primesCount++;
        console.log(`   🟢 ${row.nom} ${row.prenom}: Prime = ${row.prime}€ (devrait être en vert)`);
      } else {
        zeroPrimesCount++;
        console.log(`   📊 ${row.nom} ${row.prenom}: Prime = ${row.prime}€`);
      }
    });
    
    console.log(`\n📊 5. Résumé:`);
    console.log(`   📊 Employés avec primes: ${primesCount}`);
    console.log(`   📊 Employés sans primes: ${zeroPrimesCount}`);
    console.log(`   📊 Total: ${primesCount + zeroPrimesCount}`);
    
    console.log('\n🎯 Test terminé !');
    console.log('✅ Primes ajoutées avec succès:');
    console.log('   - BECHIRMOULAHI MOHAMED: 150.00€');
    console.log('   - BENKHALIFA AYMEN: 200.00€');
    console.log('   - Ces employés devraient maintenant avoir des lignes en vert pour la colonne Prime');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

testAddPrime().catch(console.error);
