'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Tablet, Monitor, CheckCircle } from 'lucide-react'

export function ResponsiveTest() {
  const [screenSize, setScreenSize] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      setScreenSize(`${width}px`)
      
      setIsMobile(width < 640)
      setIsTablet(width >= 640 && width < 1024)
      setIsDesktop(width >= 1024)
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return (
    <Card className="glass-card border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Test de Responsivité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Taille d'écran actuelle:</p>
          <Badge variant="outline" className="text-lg font-mono">
            {screenSize}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-3 rounded-lg border ${isMobile ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4" />
              <span className="font-medium">Mobile</span>
              {isMobile && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
            <p className="text-xs text-gray-600">&lt; 640px</p>
          </div>

          <div className={`p-3 rounded-lg border ${isTablet ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Tablet className="w-4 h-4" />
              <span className="font-medium">Tablette</span>
              {isTablet && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
            <p className="text-xs text-gray-600">640px - 1024px</p>
          </div>

          <div className={`p-3 rounded-lg border ${isDesktop ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4" />
              <span className="font-medium">Desktop</span>
              {isDesktop && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
            <p className="text-xs text-gray-600">&gt; 1024px</p>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Redimensionnez votre fenêtre pour tester</p>
          <p>• Utilisez les outils de développement</p>
          <p>• Testez sur différents appareils</p>
        </div>
      </CardContent>
    </Card>
  )
}





