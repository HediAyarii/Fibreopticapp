import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import './glassmorphism.css'

export const metadata: Metadata = {
  title: 'FinalFibre - Espace Technicien',
  description: 'Application de gestion des techniciens FinalFibre',
  generator: 'Next.js',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinalFibre'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FinalFibre" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ Service Worker enregistré:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('❌ Erreur Service Worker:', error);
                    });
                });
              }
              
              // Test du support des notifications
              console.log('🔍 Test du support des notifications push...');
              const checks = {
                'Notification API': 'Notification' in window,
                'Service Worker': 'serviceWorker' in navigator,
                'Push Manager': 'PushManager' in window,
                'Secure Context': window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost'
              };
              
              console.log('📋 Résultats des vérifications:');
              Object.entries(checks).forEach(([name, supported]) => {
                const status = supported ? '✅ Supporté' : '❌ Non supporté';
                console.log(name + ': ' + status);
              });
              
              if ('Notification' in window) {
                console.log('🔔 Permission actuelle: ' + Notification.permission);
              }
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
