// Script pour installer le trigger de pénalités
import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
})

async function installPenaltyTrigger() {
  try {
    console.log('🚀 Installation du trigger de pénalités...')
    
    // Lire le fichier SQL
    const sqlFile = join(__dirname, 'create_penalty_trigger.sql')
    const sqlContent = readFileSync(sqlFile, 'utf8')
    
    // Exécuter le script SQL
    await pool.query(sqlContent)
    
    console.log('✅ Trigger installé avec succès!')
    console.log('   - Fonction update_cout_par_salaire_penalite() créée')
    console.log('   - Trigger trigger_update_cout_par_salaire_penalite créé')
    console.log('   - Le trigger se déclenche automatiquement lors de l\'ajout d\'une pénalité')
    
    // Vérifier que le trigger existe
    const triggerCheck = await pool.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_update_cout_par_salaire_penalite'
    `)
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ Trigger vérifié:', triggerCheck.rows[0])
    } else {
      console.log('⚠️ Trigger non trouvé dans la base de données')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation:', error.message)
  } finally {
    await pool.end()
  }
}

// Exécuter l'installation
installPenaltyTrigger()
