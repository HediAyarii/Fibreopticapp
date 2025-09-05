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
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const tempFilePath = join(process.cwd(), 'temp', `carburant_${Date.now()}.${fileExtension}`)
    
    // Créer le dossier temp s'il n'existe pas
    const tempDir = join(process.cwd(), 'temp')
    try {
      await execAsync(`mkdir -p "${tempDir}"`)
    } catch (error) {
      // Le dossier existe peut-être déjà
    }
    
    await writeFile(tempFilePath, buffer)
    
    try {
      // Déterminer le script à utiliser selon l'extension
      let scriptPath: string
      if (fileExtension === 'xlsx') {
        scriptPath = join(process.cwd(), 'scripts', 'import_carburant_excel.py')
      } else {
        scriptPath = join(process.cwd(), 'scripts', 'import_carburant_universal.py')
      }
      
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
      
      // Analyser la sortie pour extraire le nombre d'enregistrements importés
      const lines = stdout.split('\n')
      const successLine = lines.find(line => line.includes('[SUCCES]') || line.includes('SUCCES:'))
      const countMatch = successLine?.match(/(\d+)/)
      const recordsCount = countMatch ? countMatch[1] : '0'
      
      return NextResponse.json({ 
        message: `${recordsCount} enregistrements carburant importés avec succès`,
        count: parseInt(recordsCount)
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
    console.error('Erreur lors de l\'import du carburant:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur' 
    }, { status: 500 })
  }
}
