const { Pool } = require('pg');

// Configuration de la base de données
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔌 Connexion à la base de données...');
    
    // Vérifier si la colonne prix_unitaire existe déjà
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'materiel' AND column_name = 'prix_unitaire'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ La colonne prix_unitaire existe déjà dans la table materiel');
      return;
    }
    
    console.log('📝 Ajout de la colonne prix_unitaire...');
    
    // Ajouter la colonne prix_unitaire
    await pool.query(`
      ALTER TABLE materiel ADD COLUMN prix_unitaire DECIMAL(10,2) DEFAULT 0.00
    `);
    
    console.log('✅ Colonne prix_unitaire ajoutée avec succès');
    
    // Mettre à jour les enregistrements existants
    await pool.query(`
      UPDATE materiel SET prix_unitaire = 0.00 WHERE prix_unitaire IS NULL
    `);
    
    console.log('✅ Enregistrements existants mis à jour');
    
    // Définir la valeur par défaut
    await pool.query(`
      ALTER TABLE materiel ALTER COLUMN prix_unitaire SET DEFAULT 0.00
    `);
    
    console.log('✅ Valeur par défaut définie');
    
    // Ajouter la contrainte NOT NULL
    await pool.query(`
      ALTER TABLE materiel ALTER COLUMN prix_unitaire SET NOT NULL
    `);
    
    console.log('✅ Contrainte NOT NULL ajoutée');
    
    console.log('🎉 Migration terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migration complétée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Échec de la migration:', error);
    process.exit(1);
  });
