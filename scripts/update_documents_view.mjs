import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finalfibre',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
})

async function updateDocumentsView() {
  try {
    console.log('🔄 Mise à jour de la vue documents_administratifs...')
    
    // Mettre à jour la vue pour gérer les types "autre"
    await pool.query(`
      CREATE OR REPLACE VIEW v_documents_administratifs AS
      SELECT
          da.id,
          da.employe_id,
          e.prenom,
          e.nom,
          e.matricule,
          da.type_document,
          da.statut,
          da.date_demande,
          da.date_traitement,
          da.commentaire_demande,
          da.commentaire_admin,
          da.fichier_jointe,
          da.chemin_fichier,
          da.taille_fichier,
          da.type_fichier,
          da.created_at,
          da.updated_at,
          CASE
              WHEN da.statut = 'en_attente' THEN 'En attente'
              WHEN da.statut = 'traite' THEN 'Traité'
              WHEN da.statut = 'rejete' THEN 'Rejeté'
              ELSE da.statut
          END as statut_libelle,
          CASE
              WHEN da.type_document = 'fiche_paie' THEN 'Fiche de Paie'
              WHEN da.type_document = 'attestation_travail' THEN 'Attestation de Travail'
              WHEN da.type_document LIKE 'autre:%' THEN 'Autre: ' || SUBSTRING(da.type_document FROM 7)
              WHEN da.type_document = 'autre' THEN 'Autre'
              ELSE da.type_document
          END as type_document_libelle
      FROM documents_administratifs da
      JOIN employes e ON da.employe_id = e.id
      ORDER BY da.date_demande DESC;
    `)
    
    console.log('✅ Vue documents_administratifs mise à jour avec succès')
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de la vue:', error)
    throw error
  } finally {
    await pool.end()
  }
}

updateDocumentsView()
  .then(() => {
    console.log('🎉 Mise à jour terminée avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })




