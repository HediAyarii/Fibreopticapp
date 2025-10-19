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

async function checkTriggers() {
  console.log('🔍 Vérification des triggers sur la table cout_par_salaire...');
  
  try {
    // 1. Vérifier les triggers
    console.log('\n📊 1. Triggers sur la table cout_par_salaire:');
    const triggersResult = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'cout_par_salaire'
    `);
    
    console.log(`   📊 Triggers trouvés: ${triggersResult.rows.length}`);
    triggersResult.rows.forEach(trigger => {
      console.log(`      ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
      console.log(`         ${trigger.action_statement}`);
    });
    
    // 2. Vérifier les contraintes
    console.log('\n📊 2. Contraintes sur la table cout_par_salaire:');
    const constraintsResult = await pool.query(`
      SELECT 
        constraint_name,
        constraint_type,
        column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'cout_par_salaire'
    `);
    
    console.log(`   📊 Contraintes trouvées: ${constraintsResult.rows.length}`);
    constraintsResult.rows.forEach(constraint => {
      console.log(`      ${constraint.constraint_name}: ${constraint.constraint_type} sur ${constraint.column_name}`);
    });
    
    // 3. Vérifier les fonctions qui pourraient affecter le RAP
    console.log('\n📊 3. Fonctions qui pourraient affecter le RAP:');
    const functionsResult = await pool.query(`
      SELECT 
        routine_name,
        routine_type,
        routine_definition
      FROM information_schema.routines
      WHERE routine_definition LIKE '%cout_par_salaire%'
         OR routine_definition LIKE '%rap%'
    `);
    
    console.log(`   📊 Fonctions trouvées: ${functionsResult.rows.length}`);
    functionsResult.rows.forEach(func => {
      console.log(`      ${func.routine_name} (${func.routine_type})`);
    });
    
    // 4. Essayer de désactiver temporairement les triggers
    console.log('\n📊 4. Test de désactivation des triggers:');
    try {
      await pool.query('SET session_replication_role = replica;');
      console.log('   ✅ Triggers désactivés temporairement');
      
      // Essayer de mettre à jour le RAP
      const testResult = await pool.query(`
        UPDATE cout_par_salaire
        SET rap = 999.99
        WHERE id = 1
        RETURNING rap
      `);
      
      if (testResult.rows.length > 0) {
        console.log(`   ✅ RAP mis à jour avec triggers désactivés: ${testResult.rows[0].rap}€`);
      }
      
      // Réactiver les triggers
      await pool.query('SET session_replication_role = DEFAULT;');
      console.log('   ✅ Triggers réactivés');
      
    } catch (error) {
      console.log(`   ❌ Erreur lors de la désactivation des triggers: ${error.message}`);
    }
    
    // 5. Vérifier les permissions
    console.log('\n📊 5. Vérification des permissions:');
    const permissionsResult = await pool.query(`
      SELECT 
        grantee,
        privilege_type,
        is_grantable
      FROM information_schema.table_privileges
      WHERE table_name = 'cout_par_salaire'
        AND grantee = 'finalfibre_user'
    `);
    
    console.log(`   📊 Permissions trouvées: ${permissionsResult.rows.length}`);
    permissionsResult.rows.forEach(perm => {
      console.log(`      ${perm.privilege_type} (grantable: ${perm.is_grantable})`);
    });
    
    console.log('\n🎯 Vérification terminée !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Détails:', error);
  } finally {
    await pool.end();
  }
}

checkTriggers().catch(console.error);
