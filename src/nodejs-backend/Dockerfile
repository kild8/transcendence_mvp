FROM node:18-bullseye


RUN useradd -m -u 1001 appuser \
    && mkdir /app \
    && chown -R appuser:appuser /app

RUN mkdir /vault \
    && chown appuser:appuser /vault
# Définir le répertoire de travail
WORKDIR /app

# Installer SQLite et build tools si nécessaire
RUN apt-get update && apt-get install -y --no-install-recommends \
    sqlite3 \
	&& rm -rf /var/lib/apt/lists/*

# Créer les dossiers data et uploads avec bons droits
RUN mkdir -p /app/data /app/uploads /vault \
 && chown -R appuser:appuser /app/data /app/uploads /vault

# Déclarer volumes
VOLUME ["/app/data", "/app/uploads"]

# Copier seulement package.json / package-lock.json pour utiliser le cache Docker
COPY --chown=appuser:appuser backend_files/package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste du projet
COPY --chown=appuser:appuser ./backend_files/. .

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Exposer le port
EXPOSE 3000

USER appuser

# Lancer le serveur
CMD ["server.js"]


