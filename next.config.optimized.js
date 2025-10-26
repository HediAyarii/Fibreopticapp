/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration optimisée pour éviter les fuites de connexions
  experimental: {
    // Optimiser le hot reload
    esmExternals: true,
    // Réduire les rechargements inutiles
    optimizeCss: false,
  },
  
  // Configuration webpack pour optimiser le développement
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Optimiser le hot reload pour réduire les rechargements
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/.next/**',
        ],
      };
      
      // Réduire la fréquence des rechargements
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Configuration pour le développement
  ...(process.env.NODE_ENV === 'development' && {
    // Réduire les rechargements
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  
  // Configuration des headers pour optimiser les connexions
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'Keep-Alive',
            value: 'timeout=5, max=1000',
          },
        ],
      },
    ];
  },
  
  // Configuration pour éviter les fuites de mémoire
  ...(process.env.NODE_ENV === 'development' && {
    webpack: (config, { dev }) => {
      if (dev) {
        // Optimiser la gestion de la mémoire
        config.optimization = {
          ...config.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: false,
        };
      }
      return config;
    },
  }),
};

module.exports = nextConfig;
