const bcrypt = require('bcryptjs');

// Fonction pour générer un hash bcrypt
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Liste des employés avec leurs matricules
const employees = [
  { id: 1, username: 'ben_chedli_hamdi', matricule: 'EMPHAMBE' },
  { id: 2, username: 'aymen_ben_khalifa', matricule: 'EMPBENAY' },
  { id: 3, username: 'marouen_bouaffoura', matricule: 'EMPBOUMA' },
  { id: 4, username: 'wahid_lotfi', matricule: 'EMPLOTWA' },
  { id: 5, username: 'ramzi_hakiri', matricule: 'EMPHAKRA' },
  { id: 6, username: 'mohamed-bechir_moulahi', matricule: 'EMPMOUMO' },
  { id: 7, username: 'fares_ben_trad', matricule: 'EMPBENFA' },
  { id: 8, username: 'salmen_houimdi', matricule: 'EMPHOUSA' },
  { id: 9, username: 'karim_ben_rabeh', matricule: 'EMPBENKA' },
  { id: 10, username: 'hamza_ben_salah', matricule: 'EMPBENHA' }
];

async function updatePasswords() {
  console.log('🔐 Génération des mots de passe avec les matricules...\n');
  
  for (const employee of employees) {
    const passwordHash = await hashPassword(employee.matricule);
    console.log(`UPDATE technicien_accounts SET password_hash = '${passwordHash}' WHERE username = '${employee.username}';`);
  }
  
  console.log('\n✅ Scripts SQL générés !');
  console.log('📋 Résumé des comptes:');
  console.log('Username | Matricule (mot de passe)');
  console.log('---------|-------------------------');
  employees.forEach(emp => {
    console.log(`${emp.username.padEnd(20)} | ${emp.matricule}`);
  });
}

updatePasswords();
