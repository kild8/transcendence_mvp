#!/bin/sh
set -e

TARGET="/vault/secrets"
CERTS_DIR="/vault/certs"
CRT=vault-server.crt
KEY=vault-server.key
CA=ca.crt
KEY_BOOL=0
CRT_BOOL=0
CA_BOOL=0

inotifywait -m -e close_write -e moved_to --format '%f' "${TARGET}" | while read -r file
do
    if [[ "${file}" == "vault-server.crt" ]]; then
        CRT_BOOL=1
    elif [[ "${file}" == "vault-server.key" ]]; then
        KEY_BOOL=1
    elif [[ "${file}" == "ca.crt" ]]; then
        CA_BOOL=1
    fi
    if [[ -f "${TARGET}/${CA}" ]]; then
        CA_BOOL=1
    fi
    if [[ "${KEY_BOOL}" -eq 1 && "${CRT_BOOL}" -eq 1 && "${CA_BOOL}" -eq 1 ]]; then
        KEY_BOOL=0
        CRT_BOOL=0
        CA_BOOL=0
        cp ${TARGET}/${CRT} ${CERTS_DIR}/${CRT}
        cp ${TARGET}/${KEY} ${CERTS_DIR}/${KEY}
        cp ${TARGET}/${CA} ${CERTS_DIR}/${CA}

        VAULT_PID=$(pgrep -f "vault server")

        kill -HUP ${VAULT_PID}
        touch /vault/file/.vault_certs_initialized
    fi
done