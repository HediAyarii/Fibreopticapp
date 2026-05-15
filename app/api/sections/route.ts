import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

// Mettre à jour la fonction si recla-free manque
async function ensureReclaFreeSection() {
  try {
    const check = await query(`SELECT section_key FROM get_available_sections() WHERE section_key = 'recla-free'`)
    if (check.rows.length === 0) {
      await query(`
        CREATE OR REPLACE FUNCTION get_available_sections() 
        RETURNS TABLE(section_key VARCHAR(50), section_name VARCHAR(100)) AS $$
        BEGIN
          RETURN QUERY
          SELECT 'dashboard'::VARCHAR(50), 'Tableau de Bord'::VARCHAR(100)
          UNION ALL SELECT 'employees'::VARCHAR(50), 'Employés'::VARCHAR(100)
          UNION ALL SELECT 'interventions'::VARCHAR(50), 'Interventions'::VARCHAR(100)
          UNION ALL SELECT 'materials'::VARCHAR(50), 'Matériel'::VARCHAR(100)
          UNION ALL SELECT 'fuel'::VARCHAR(50), 'Carburant'::VARCHAR(100)
          UNION ALL SELECT 'fuel-consumption'::VARCHAR(50), 'Consommation Carburant'::VARCHAR(100)
          UNION ALL SELECT 'penalties'::VARCHAR(50), 'Pénalités'::VARCHAR(100)
          UNION ALL SELECT 'statistics'::VARCHAR(50), 'Statistiques'::VARCHAR(100)
          UNION ALL SELECT 'costs'::VARCHAR(50), 'Charges'::VARCHAR(100)
          UNION ALL SELECT 'cout-par-salaire'::VARCHAR(50), 'Charges par Salarié'::VARCHAR(100)
          UNION ALL SELECT 'claims'::VARCHAR(50), 'Réclamations'::VARCHAR(100)
          UNION ALL SELECT 'documents'::VARCHAR(50), 'Documents'::VARCHAR(100)
          UNION ALL SELECT 'recap-calcul'::VARCHAR(50), 'Récap Calcul'::VARCHAR(100)
          UNION ALL SELECT 'recla-free'::VARCHAR(50), 'Recla Free'::VARCHAR(100)
          UNION ALL SELECT 'tarifs'::VARCHAR(50), 'Tarifs'::VARCHAR(100)
          UNION ALL SELECT 'recap-articles'::VARCHAR(50), 'Recap Articles'::VARCHAR(100)
          UNION ALL SELECT 'recette-generer'::VARCHAR(50), 'BENEFICE BRUTE'::VARCHAR(100)
          UNION ALL SELECT 'technicien-accounts'::VARCHAR(50), 'Comptes Techniciens'::VARCHAR(100)
          UNION ALL SELECT 'vehicules'::VARCHAR(50), 'Véhicules'::VARCHAR(100)
          UNION ALL SELECT 'reclamations-techniques'::VARCHAR(50), 'Réclamations Techniques'::VARCHAR(100)
          UNION ALL SELECT 'absences'::VARCHAR(50), 'Absences'::VARCHAR(100)
          UNION ALL SELECT 'historique'::VARCHAR(50), 'Historique'::VARCHAR(100)
          UNION ALL SELECT 'compte-admin'::VARCHAR(50), 'Compte Admin'::VARCHAR(100);
        END;
        $$ LANGUAGE plpgsql;
      `)
    }
  } catch (e) {
    // ignore
  }
}

export async function GET() {
  try {
    await ensureReclaFreeSection()
    const result = await query('SELECT * FROM get_available_sections()')
    return NextResponse.json({ sections: result.rows })
  } catch (error) {
    console.error('Erreur lors de la récupération des sections:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
