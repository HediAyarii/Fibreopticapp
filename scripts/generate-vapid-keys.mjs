// Script pour générer les clés VAPID
import webpush from 'web-push'

console.log('🔑 Génération des clés VAPID pour les notifications push...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('📋 Clés VAPID générées:')
console.log('='.repeat(50))
console.log('Clé publique (VAPID_PUBLIC_KEY):')
console.log(vapidKeys.publicKey)
console.log('\nClé privée (VAPID_PRIVATE_KEY):')
console.log(vapidKeys.privateKey)
console.log('='.repeat(50))

console.log('\n📝 Instructions:')
console.log('1. Ajoutez ces clés à votre fichier .env:')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log('\n2. Utilisez la clé publique dans votre composant NotificationManager')
console.log('\n3. La clé privée doit rester secrète et ne jamais être exposée côté client')
