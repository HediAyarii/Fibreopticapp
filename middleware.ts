import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log(`🔍 Middleware: ${pathname}`)

  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'finalfibre-super-secret-jwt-key-2025-technicien-auth')

  // Routes protégées pour les techniciens
  if (pathname.startsWith('/technicien/')) {
    const token = request.cookies.get('technicien_token')?.value
    console.log(`🔐 Token trouvé: ${token ? 'OUI' : 'NON'}`)

    if (!token) {
      console.log('❌ Pas de token, redirection vers /logintech')
      return NextResponse.redirect(new URL('/logintech', request.url))
    }

    try {
      await jwtVerify(token, secret)
      console.log('✅ Token valide, accès autorisé')
      return NextResponse.next()
    } catch (error) {
      console.log('❌ Token invalide:', error)
      return NextResponse.redirect(new URL('/logintech', request.url))
    }
  }

  // Redirection depuis /logintech si déjà connecté
  if (pathname === '/logintech') {
    const token = request.cookies.get('technicien_token')?.value
    console.log(`🔍 Vérification token sur /logintech: ${token ? 'OUI' : 'NON'}`)

    if (token) {
      try {
        await jwtVerify(token, secret)
        console.log('✅ Token valide sur /logintech, redirection vers dashboard')
        return NextResponse.redirect(new URL('/technicien/dashboard', request.url))
      } catch (error) {
        console.log('❌ Token invalide sur /logintech:', error)
        // Token invalide, continuer vers la page de login
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/technicien/:path*',
    '/logintech'
  ]
}
