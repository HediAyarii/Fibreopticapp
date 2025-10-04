import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Sauvegarder le fichier temporairement
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFilePath = join(process.cwd(), 'temp', `interventions_${Date.now()}.csv`)
    
    // Créer le dossier temp s'il n'existe pas
    const tempDir = join(process.cwd(), 'temp')
    try {
      await execAsync(`mkdir -p "${tempDir}"`)
    } catch (error) {
      // Le dossier existe peut-être déjà
    }
    
    await writeFile(tempFilePath, buffer)
    
    try {
        // Exécuter le script d'import pour toutes les lignes
        const scriptPath = join(process.cwd(), 'scripts', 'smart_import_interventions_all_lines.py')
      const command = `python "${scriptPath}" --file "${tempFilePath}"`
      
      console.log('Exécution de la commande:', command)
      
      const { stdout, stderr } = await execAsync(command)
      
      if (stderr) {
        console.error('Erreur du script:', stderr)
        return NextResponse.json({ 
          error: `Erreur lors de l'import: ${stderr}` 
        }, { status: 500 })
      }
      
      console.log('Sortie du script:', stdout)
      
      // Analyser la sortie pour extraire le nombre d'interventions importées
      const lines = stdout.split('\n')
      const successLine = lines.find(line => line.includes('[SUCCES]'))
      const interventionsCount = successLine ? successLine.match(/(\d+)/)?.[1] : '0'
      
      // Synchronisation automatique des employés après l'import
      console.log('🔄 Déclenchement de la synchronisation automatique des employés...')
      try {
        const syncResponse = await fetch('http://localhost:3000/api/sync/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json()
          console.log(`✅ Synchronisation réussie: ${syncData.data.employes_crees} employés créés`)
        } else {
          console.log('⚠️ Erreur lors de la synchronisation des employés')
        }
      } catch (syncError) {
        console.log('⚠️ Erreur lors de la synchronisation des employés:', syncError)
      }
      
      return NextResponse.json({ 
        message: `${interventionsCount} interventions importées avec succès`,
        count: parseInt(interventionsCount || '0'),
        syncMessage: 'Synchronisation automatique des employés effectuée'
      })
      
    } finally {
      // Nettoyer le fichier temporaire
      try {
        await unlink(tempFilePath)
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier temporaire:', error)
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'import des interventions:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}
