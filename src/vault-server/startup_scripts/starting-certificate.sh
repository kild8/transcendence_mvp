#!/bin/sh
set -e

CERT_DIR="/vault/certs"

if [ $(ls -1A "${CERT_DIR}" | wc -l) -eq 0 ]; then
CA_KEY="$CERT_DIR/ca.key"
CA_CRT="$CERT_DIR/ca.crt"
CA_SRL="$CERT_DIR/ca.srl"
SERVER_KEY="$CERT_DIR/vault-server.key"
SERVER_CRT="$CERT_DIR/vault-server.crt"
SERVER_CSR="$CERT_DIR/vault-server.csr"

if [ ! -f "${CA_CRT}" ]; then
    openssl genrsa -out "${CA_KEY}" 4096
    openssl req -x509 -new -nodes -key "${CA_KEY}" -sha256 -days 3650 \
        -out "${CA_CRT}" -subj "/CN=Vault-Internal-CA"
fi

if [ ! -f "${SERVER_CRT}" ]; then
    openssl genrsa -out "${SERVER_KEY}" 2048
    cat > "${CERT_DIR}/extfile.cnf" <<EOF
subjectAltName = DNS:vault-server,DNS:localhost,IP:127.0.0.1
EOF
    openssl req -new -key "${SERVER_KEY}" -out "${SERVER_CSR}" \
        -subj "/CN=vault-server"
    openssl x509 -req -in "${SERVER_CSR}" -CA "${CA_CRT}" -CAkey "${CA_KEY}" \
        -CAcreateserial -out "${SERVER_CRT}" -days 365 -sha256 \
        -extfile "${CERT_DIR}/extfile.cnf"
    rm "${SERVER_CSR}" "${CERT_DIR}/extfile.cnf" "${CA_SRL}" "${CA_KEY}" 
fi
chown -R 100:1000 "${CERT_DIR}"
fi