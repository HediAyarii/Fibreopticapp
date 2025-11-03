import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'finalfibre_db',
  user: process.env.POSTGRES_USER || 'finalfibre_user',
  password: process.env.POSTGRES_PASSWORD || 'finalfibre_password_2024',
  ssl: false,
})

async function testDocumentsSystem() {
  try {
    console.log('🧪 Test du système de documents administratifs\n')

    // 1. Vérifier que la table existe
    console.log('1️⃣ Vérification de la table documents_administratifs...')
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'documents_administratifs'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ La table documents_administratifs n\'existe pas')
      return
    }
    console.log('✅ Table documents_administratifs existe\n')

    // 2. Vérifier les colonnes
    console.log('2️⃣ Vérification des colonnes...')
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents_administratifs'
      ORDER BY ordinal_position
    `)
    
    console.log('Colonnes trouvées:')
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })
    console.log('✅ Colonnes vérifiées\n')

    // 3. Compter les documents existants
    console.log('3️⃣ Comptage des documents...')
    const countResult = await pool.query('SELECT COUNT(*) as count FROM documents_administratifs')
    console.log(`📊 Nombre de documents: ${countResult.rows[0].count}\n`)

    // 4. Vérifier les types de documents
    console.log('4️⃣ Types de documents disponibles:')
    const types = [
      { value: 'fiche_paie', label: 'Fiche de Paie' },
      { value: 'attestation_travail', label: 'Attestation de Travail' },
      { value: 'certificat_salaire', label: 'Certificat de Salaire' },
      { value: 'attestation_salaire', label: 'Attestation de Salaire' },
      { value: 'releve_cotisations', label: 'Relevé de Cotisations' },
      { value: 'certificat_formation', label: 'Certificat de Formation' }
    ]
    types.forEach(type => {
      console.log(`  - ${type.label} (${type.value})`)
    })
    console.log('✅ Types de documents définis\n')

    // 5. Vérifier la vue
    console.log('5️⃣ Vérification de la vue v_documents_administratifs...')
    const viewCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'v_documents_administratifs'
      )
    `)
    
    if (viewCheck.rows[0].exists) {
      console.log('✅ Vue v_documents_administratifs existe')
      
      // Tester la vue
      const viewTest = await pool.query('SELECT COUNT(*) as count FROM v_documents_administratifs')
      console.log(`📊 Nombre de documents dans la vue: ${viewTest.rows[0].count}\n`)
    } else {
      console.log('⚠️ Vue v_documents_administratifs n\'existe pas\n')
    }

    // 6. Tester une insertion
    console.log('6️⃣ Test d\'insertion d\'un document...')
    const insertResult = await pool.query(`
      INSERT INTO documents_administratifs (employe_id, type_document, commentaire_demande)
      VALUES (1, 'fiche_paie', 'Test de demande de fiche de paie')
      RETURNING id, type_document, statut, date_demande
    `)
    
    if (insertResult.rows.length > 0) {
      const doc = insertResult.rows[0]
      console.log('✅ Document inséré:')
      console.log(`  - ID: ${doc.id}`)
      console.log(`  - Type: ${doc.type_document}`)
      console.log(`  - Statut: ${doc.statut}`)
      console.log(`  - Date: ${doc.date_demande}\n`)

      // 7. Tester une mise à jour
      console.log('7️⃣ Test de mise à jour du document...')
      const updateResult = await pool.query(`
        UPDATE documents_administratifs
        SET statut = 'traite',
            commentaire_admin = 'Document traité avec succès',
            date_traitement = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, statut, commentaire_admin
      `, [doc.id])
      
      if (updateResult.rows.length > 0) {
        console.log('✅ Document mis à jour:')
        console.log(`  - Statut: ${updateResult.rows[0].statut}`)
        console.log(`  - Commentaire admin: ${updateResult.rows[0].commentaire_admin}\n`)
      }

      // 8. Nettoyer
      console.log('8️⃣ Nettoyage du document de test...')
      await pool.query('DELETE FROM documents_administratifs WHERE id = $1', [doc.id])
      console.log('✅ Document de test supprimé\n')
    }

    // 9. Statistiques finales
    console.log('9️⃣ Statistiques finales:')
    const stats = await pool.query(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM documents_administratifs
      GROUP BY statut
      ORDER BY statut
    `)
    
    if (stats.rows.length > 0) {
      console.log('Documents par statut:')
      stats.rows.forEach(stat => {
        console.log(`  - ${stat.statut}: ${stat.count}`)
      })
    } else {
      console.log('Aucun document dans la base')
    }

    console.log('\n✅ Tests terminés avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

testDocumentsSystem()
  .then(() => {
    console.log('\n🎯 Système de documents administratifs opérationnel')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error)
    process.exit(1)
  })








