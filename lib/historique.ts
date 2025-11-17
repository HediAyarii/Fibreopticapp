import { query } from './database'

export interface HistoriqueData {
  userId?: number
  userName?: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  tableName: string
  recordId?: number
  section: string
  description?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Enregistre une action dans la table historiques
 */
export async function logHistorique(data: HistoriqueData) {
  try {
    const sql = `
      INSERT INTO historiques (
        user_id, user_name, action, table_name, record_id, 
        section, description, old_values, new_values, 
        ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `
    
    const values = [
      data.userId || null,
      data.userName || 'Utilisateur inconnu',
      data.action,
      data.tableName,
      data.recordId || null,
      data.section,
      data.description || null,
      data.oldValues ? JSON.stringify(data.oldValues) : null,
      data.newValues ? JSON.stringify(data.newValues) : null,
      data.ipAddress || null,
      data.userAgent || null
    ]

    const result = await query(sql, values)
    return result.rows[0]
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement de l\'historique:', error)
    // Ne pas bloquer l'opération principale si l'historique échoue
    return null
  }
}

/**
 * Récupère l'adresse IP depuis la requête Next.js
 */
export function getClientIP(request: Request): string | undefined {
  const headers = request.headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    undefined
  )
}

/**
 * Récupère le User Agent depuis la requête Next.js
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}

/**
 * Génère une description formatée de l'action
 */
export function generateDescription(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  section: string,
  details?: string
): string {
  const actionText = {
    CREATE: 'Création',
    UPDATE: 'Modification',
    DELETE: 'Suppression'
  }

  if (details) {
    return `${actionText[action]} dans ${section}: ${details}`
  }
  
  return `${actionText[action]} dans ${section}`
}
