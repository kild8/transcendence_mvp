FROM node:18-bullseye

# Définir le répertoire de travail dans le container
WORKDIR /app

# Creer une database
RUN mkdir -p /app/data && chown -R node:node /app/data

# Creer un dossier pour les avatars
RUN mkdir -p /app/uploads

# Installer Sqlite
RUN apt-get update && apt-get install -y sqlite3

# Copier les fichiers package.json pour installer les dépendances
COPY package*.json ./

# Installer toutes les dépendances (y compris Prisma et better-sqlite3)
RUN npm install

RUN npm install ws

# Copier le reste des fichiers du backend
COPY . .


# Exposer le port
EXPOSE 3000

# Commande pour lancer le serveur
CMD ["node", "server.js"]