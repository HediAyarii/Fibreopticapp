import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 API attribution manuelle appelée')
    
    const { coutId, employeeId, matricule, taxe } = await request.json()
    console.log('📋 Paramètres reçus:', { coutId, employeeId, matricule, taxe })

    if (!coutId || !employeeId || !matricule) {
      console.log('❌ Paramètres manquants')
      return NextResponse.json({ 
        success: false, 
        error: 'Paramètres manquants (coutId, employeeId, matricule requis)' 
      }, { status: 400 })
    }

    console.log('✅ Paramètres validés, test de connexion DB...')

    // Test simple de connexion à la base de données
    try {
      const testQuery = await query('SELECT 1 as test')
      console.log('✅ Connexion DB OK:', testQuery.rows[0])
    } catch (dbError) {
      console.error('❌ Erreur connexion DB:', dbError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur de connexion à la base de données' 
      }, { status: 500 })
    }

    // Vérifier que l'enregistrement cout-par-salaire existe
    console.log('🔍 Vérification enregistrement cout-par-salaire...')
    const coutCheck = await query(`
      SELECT id, nom, prenom, mois, annee 
      FROM cout_par_salaire 
      WHERE id = $1
    `, [coutId])

    if (coutCheck.rows.length === 0) {
      console.log('❌ Enregistrement cout-par-salaire non trouvé')
      return NextResponse.json({ 
        success: false, 
        error: 'Enregistrement cout-par-salaire non trouvé' 
      }, { status: 404 })
    }

    const cout = coutCheck.rows[0]
    console.log(`✅ Enregistrement trouvé: ${cout.nom} ${cout.prenom} (${cout.mois}/${cout.annee})`)

    // Vérifier que l'employé existe
    console.log('🔍 Vérification employé...')
    const employeeCheck = await query(`
      SELECT id, nom, prenom, matricule, pourcentage_taxe 
      FROM employes 
      WHERE id = $1 AND statut = 'actif'
    `, [employeeId])

    if (employeeCheck.rows.length === 0) {
      console.log('❌ Employé non trouvé ou inactif')
      return NextResponse.json({ 
        success: false, 
        error: 'Employé non trouvé ou inactif' 
      }, { status: 404 })
    }

    const employee = employeeCheck.rows[0]
    console.log(`✅ Employé trouvé: ${employee.nom} ${employee.prenom} (${employee.matricule})`)

    // Mettre à jour l'enregistrement cout-par-salaire avec les informations de l'employé
    console.log('🔄 Mise à jour enregistrement...')
    const updateResult = await query(`
      UPDATE cout_par_salaire 
      SET 
        matricule = $1,
        taxe = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [matricule, taxe || employee.pourcentage_taxe || 0, coutId])

    if (updateResult.rows.length === 0) {
      console.log('❌ Erreur lors de la mise à jour')
      return NextResponse.json({ 
        success: false, 
        error: 'Erreur lors de la mise à jour' 
      }, { status: 500 })
    }

    const updatedCout = updateResult.rows[0]
    console.log(`✅ Attribution réussie: ${updatedCout.nom} ${updatedCout.prenom} → ${employee.nom} ${employee.prenom} (${matricule})`)

    return NextResponse.json({
      success: true,
      message: `Employé ${employee.nom} ${employee.prenom} attribué avec succès`,
      data: {
        cout: updatedCout,
        employee: employee
      }
    })

  } catch (error) {
    console.error('❌ Erreur attribution manuelle:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Erreur serveur: ${error.message}` 
    }, { status: 500 })
  }
}
