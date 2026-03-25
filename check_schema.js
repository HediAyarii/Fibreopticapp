const { Client } = require('pg')
const c = new Client({ host: 'localhost', port: 5432, database: 'finalfibre_db', user: 'finalfibre_user', password: 'finalfibre_password_2024' })

async function run() {
  await c.connect()
  
  const r = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position")
  console.log('=== USERS columns ===')
  r.rows.forEach(row => console.log(' ', row.column_name, '-', row.data_type))

  const r2 = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='roles' ORDER BY ordinal_position")
  console.log('=== ROLES columns ===')
  r2.rows.forEach(row => console.log(' ', row.column_name, '-', row.data_type))

  // Check a sample user with permissions
  const r3 = await c.query("SELECT u.id, u.username, u.role_id, r.name, r.permissions FROM users u LEFT JOIN roles r ON u.role_id = r.id LIMIT 3")
  console.log('=== Sample users with role permissions ===')
  r3.rows.forEach(row => console.log(' ', row.username, '- role:', row.name, '- permissions:', JSON.stringify(row.permissions)))

  await c.end()
}
run().catch(e => { console.error(e.message); process.exit(1) })
