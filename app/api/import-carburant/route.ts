import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('Début de l\'import carburant...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('Aucun fichier fourni')
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    console.log('Fichier reçu:', file.name, 'Taille:', file.size)
    
    // Sauvegarder le fichier temporairement
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const tempFilePath = join(process.cwd(), 'temp', `carburant_${Date.now()}.${fileExtension}`)
    
    console.log('Chemin temporaire:', tempFilePath)
    
    // Créer le dossier temp s'il n'existe pas
    const tempDir = join(process.cwd(), 'temp')
    try {
      // Utiliser la commande Windows appropriée
      const mkdirCommand = process.platform === 'win32' 
        ? `if not exist "${tempDir}" mkdir "${tempDir}"`
        : `mkdir -p "${tempDir}"`
      console.log('Commande mkdir:', mkdirCommand)
      await execAsync(mkdirCommand)
    } catch (error) {
      console.log('Erreur mkdir (peut être ignorée):', error)
    }
    
    await writeFile(tempFilePath, buffer)
    console.log('Fichier temporaire créé')
    
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
      console.log('Script path:', scriptPath)
      console.log('Temp file path:', tempFilePath)
      
      const { stdout, stderr } = await execAsync(command, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })
      
      console.log('Sortie stdout:', stdout)
      console.log('Sortie stderr:', stderr)
      
      // Filtrer les warnings d'openpyxl qui ne sont pas critiques
      const filteredStderr = stderr
        .split('\n')
        .filter(line => 
          !line.includes('openpyxl') && 
          !line.includes('Workbook contains no default style') &&
          !line.includes('UserWarning') &&
          line.trim() !== ''
        )
        .join('\n')
      
      if (filteredStderr) {
        console.error('Erreur du script:', filteredStderr)
        return NextResponse.json({ 
          error: `Erreur lors de l'import: ${filteredStderr}` 
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
        console.log('Fichier temporaire supprimé')
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier temporaire:', error)
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'import du carburant:', error)
    return NextResponse.json({ 
      error: `Erreur interne du serveur: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 })
  }
}
