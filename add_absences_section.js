const { Pool } = require('pg')
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'finalfibre_db',
  user: 'finalfibre_user',
  password: 'finalfibre_password_2024'
})

async function main() {
  try {
    await pool.query(
      "INSERT INTO sections (name, display_name, description, route, icon, is_active) VALUES ('absences', 'Absences', 'Gestion des absences et demandes des techniciens', '/absences', 'Calendar', true) ON CONFLICT DO NOTHING"
    )
    console.log('Section absences ajoutée')
  } catch (e) {
    console.error(e.message)
  } finally {
    await pool.end()
  }
}
main()
