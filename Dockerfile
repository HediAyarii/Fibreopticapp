# Utiliser une image de base avec Node.js et Python
FROM node:20-alpine

# Installer Python et les dépendances système
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    build-base \
    postgresql-client \
    curl

# Créer un lien symbolique pour python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Installer pip et les packages Python nécessaires
RUN pip3 install --upgrade pip

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Changer la propriété des fichiers
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port 3000
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Script de démarrage
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Point d'entrée
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Commande par défaut
CMD ["npm", "start"]
