#!/bin/bash
set -e

TARGET="/vault/secrets"
KEY_BOOL=0
CRT_BOOL=0

# Fonction pour logger au format Nginx sur STDERR
log_notice() {
    # On utilise >&2 pour rediriger l'écho vers la sortie d'erreur
    echo "$(date +'%Y/%m/%d %H:%M:%S') [notice] 0#0: $1" >&2
}

log_notice "Starting certificate monitor on ${TARGET}"

# On cache le "Setting up watches" de inotifywait pour ne garder que nos logs
inotifywait -m -e close_write -e moved_to --format '%f' "${TARGET}" 2>/dev/null | while read -r file
do
    if [[ "${file}" == "nginx-frontend.crt" ]]; then
        CRT_BOOL=1
    elif [[ "${file}" == "nginx-frontend.key" ]]; then
        KEY_BOOL=1
    fi

    if [[ "${KEY_BOOL}" -eq 1 && "${CRT_BOOL}" -eq 1 ]]; then
        log_notice "Both certificate and key updated. Triggering Nginx reload..."
        KEY_BOOL=0
        CRT_BOOL=0
        
        # Le reload de Nginx enverra aussi ses propres logs sur stderr
        nginx -s reload
    fi
done