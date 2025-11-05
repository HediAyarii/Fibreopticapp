// Augmenter la limite des Event Listeners pour éviter les warnings
// Ceci est nécessaire car Next.js et ses modules ajoutent de nombreux listeners

import { EventEmitter } from 'events'

// Augmenter la limite par défaut de 10 à 20
EventEmitter.defaultMaxListeners = 20

// Alternative : Augmenter pour le processus Node.js
process.setMaxListeners(20)

export {}
