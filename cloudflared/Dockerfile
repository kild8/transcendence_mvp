FROM alpine:3.23.3

RUN apk add --no-cache curl ca-certificates wget

# Installer cloudflared version fixe
RUN wget -O /usr/local/bin/cloudflared \
    https://github.com/cloudflare/cloudflared/releases/download/2025.1.0/cloudflared-linux-amd64 && \
    chmod +x /usr/local/bin/cloudflared

# Créer dossier
RUN mkdir -p /cloudflared

# Créer group et user avec UID/GID 1000
RUN addgroup -g 1000 -S cloudflared && \
    adduser  -u 1000 -S cloudflared -G cloudflared -h /cloudflared

# Copier entrypoint (⚠ corriger le COPY)
COPY --chmod=+x ./startup_scripts/. /usr/local/bin/.

USER 1000:1000
WORKDIR /cloudflared

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["tunnel", "--no-autoupdate", "--url", "https://nginx-frontend:8443", "--no-tls-verify", "--logfile", "/cloudflared/cloudflared.log"]