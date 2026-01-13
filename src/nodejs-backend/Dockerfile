FROM node:18-bullseye

# Définir le répertoire de travail
WORKDIR /app

# Installer SQLite et build tools si nécessaire
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
	&& rm -rf /var/lib/apt/lists/*

# Créer les dossiers data et uploads avec bons droits
RUN mkdir -p /app/data /app/uploads \
 && chown -R node:node /app/data /app/uploads

# Déclarer volumes
VOLUME ["/app/data", "/app/uploads"]

# Copier seulement package.json / package-lock.json pour utiliser le cache Docker
COPY --chown=node:node ./backend/package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste du projet
COPY --chown=node:node ./backend/. .

# Exposer le port
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
