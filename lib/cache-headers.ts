import { NextResponse } from 'next/server'

/**
 * Ajoute les headers nécessaires pour éviter le cache côté serveur et navigateur
 * @param response - La réponse NextResponse à modifier
 * @returns La réponse avec les headers de cache ajoutés
 */
export function addNoCacheHeaders(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')
  
  return response
}

/**
 * Crée une réponse JSON avec les headers pour éviter le cache
 * @param data - Les données à retourner
 * @param status - Le statut HTTP (optionnel, par défaut 200)
 * @returns Une NextResponse avec les headers de cache appropriés
 */
export function createNoCacheResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status })
  return addNoCacheHeaders(response)
}
