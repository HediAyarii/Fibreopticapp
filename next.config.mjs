import { EventEmitter } from 'events'

// Augmenter la limite des Event Listeners pour Next.js
EventEmitter.defaultMaxListeners = 20
process.setMaxListeners(20)

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuration pour les gros uploads
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
  // Augmenter la limite de taille des requêtes
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default nextConfig
