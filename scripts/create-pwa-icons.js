const fs = require('fs')
const path = require('path')

// Créer des icônes PWA de test (SVG simple)
const createIcon = (size, filename) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#3b82f6"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="${size/3}">FF</text>
  </svg>`
  
  fs.writeFileSync(path.join(__dirname, '..', 'public', filename), svg)
  console.log(`✅ Icône créée: ${filename} (${size}x${size})`)
}

// Créer les icônes nécessaires
createIcon(192, 'icon-192.png')
createIcon(512, 'icon-512.png')

console.log('🎨 Icônes PWA créées avec succès!')
console.log('📝 Note: Remplacez par de vraies icônes PNG pour la production')
