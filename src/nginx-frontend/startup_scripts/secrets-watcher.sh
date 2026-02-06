#!/bin/sh
set -e

TARGET="/vault/secrets"
KEY_BOOL=0
CRT_BOOL=0

inotifywait -m -e close_write -e moved_to --format '%f' "${TARGET}" | while read -r file
do
    if [[ "${file}" == "nginx-frontend.crt" ]]; then
        CRT_BOOL=1
    elif [[ "${file}" == "nginx-frontend.key" ]]; then
        KEY_BOOL=1
    fi

    if [[ "${KEY_BOOL}" -eq 1 && "${CRT_BOOL}" -eq 1 ]]; then
        KEY_BOOL=0
        CRT_BOOL=0
        
        nginx -s reload
    fi
done