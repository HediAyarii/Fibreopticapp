const bcrypt = require('bcryptjs');
const { query } = require('../lib/database');

async function createAutoAccounts() {
  try {
    console.log('🔍 Récupération des employés...');
    
    // Récupérer tous les employés
    const employees = await query(`
      SELECT id, prenom, nom, matricule 
      FROM employes 
      WHERE id IS NOT NULL
      ORDER BY prenom, nom
    `);

    console.log(`📋 ${employees.length} employés trouvés`);

    // Supprimer les comptes existants
    await query('DELETE FROM technicien_accounts');
    console.log('🗑️ Anciens comptes supprimés');

    // Créer un compte pour chaque employé
    for (const employee of employees) {
      const username = `${employee.prenom.toLowerCase()}_${employee.nom.toLowerCase().replace(/\s+/g, '_')}`;
      const password = employee.matricule; // Mot de passe = matricule
      const passwordHash = await bcrypt.hash(password, 10);

      await query(`
        INSERT INTO technicien_accounts (
          technicien_id,
          username,
          password_hash,
          is_active,
          is_locked,
          login_attempts,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        employee.id,
        username,
        passwordHash,
        true,  // is_active
        false, // is_locked
        0,     // login_attempts
        new Date()
      ]);

      console.log(`✅ Compte créé: ${username} (${employee.prenom} ${employee.nom}) - Mot de passe: ${password}`);
    }

    console.log(`🎉 ${employees.length} comptes techniciens créés avec succès!`);
    
    // Afficher un résumé
    const accounts = await query(`
      SELECT 
        ta.username,
        e.prenom,
        e.nom,
        e.matricule,
        ta.is_active
      FROM technicien_accounts ta
      JOIN employes e ON ta.technicien_id = e.id
      ORDER BY e.prenom, e.nom
    `);

    console.log('\n📊 Résumé des comptes créés:');
    console.log('Username | Nom complet | Matricule | Actif');
    console.log('---------|-------------|-----------|------');
    accounts.forEach(acc => {
      console.log(`${acc.username.padEnd(15)} | ${acc.prenom} ${acc.nom} | ${acc.matricule} | ${acc.is_active ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la création des comptes:', error);
  } finally {
    process.exit(0);
  }
}

createAutoAccounts();
