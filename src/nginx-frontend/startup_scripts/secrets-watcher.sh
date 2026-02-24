#!/bin/sh
set -e

TARGET="/vault/secrets"
KEY_BOOL=0
CRT_BOOL=0

log_notice() {
    echo "$(date +'%Y/%m/%d %H:%M:%S') [notice] 0#0: $1" >&2
}

log_notice "Starting certificate monitor on ${TARGET}"

inotifywait -m -e close_write -e moved_to --format '%f' "${TARGET}" 2>/dev/null | while read -r file
do
    if [ "$file" = "nginx-frontend.crt" ]; then
        CRT_BOOL=1
    elif [ "$file" = "nginx-frontend.key" ]; then
        KEY_BOOL=1
    fi

    if [ "$KEY_BOOL" -eq 1 ] && [ "$CRT_BOOL" -eq 1 ]; then
        log_notice "Both certificate and key updated. Triggering Nginx reload..."
        KEY_BOOL=0
        CRT_BOOL=0
        
        nginx -s reload
    fi
done