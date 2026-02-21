#!/bin/sh
set -e

exec > /dev/null

export VAULT_ADDR=https://vault-server:8200
export VAULT_CACERT="/vault/certs/ca.crt"

REPORT_FILE="/vault/access/vault-access.txt"

#User random creation
MONITORING_USER_NAME=user-$(tr -dc 'a-z0-9' < /dev/urandom | head -c 8)
MONITORING_USER_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 12)
MONITORING_USER_EMAIL=$(tr -dc 'a-z0-9' < /dev/urandom | head -c 8)@monitoring.local
MONITORING_USER_PHONE=+336$(tr -dc '0-9' < /dev/urandom | head -c 9)

MONITORING_ADMIN_NAME=user-$(tr -dc 'a-z0-9' < /dev/urandom | head -c 8)
MONITORING_ADMIN_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 12)
MONITORING_ADMIN_EMAIL=$(tr -dc 'a-z0-9' < /dev/urandom | head -c 8)@monitoring.local
MONITORING_ADMIN_PHONE=+336$(tr -dc '0-9' < /dev/urandom | head -c 9)

ELASTICSEARCH_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 12)
KIBANA_SYSTEM_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 12)
LOGSTASH_INTERNAL_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 12)

KIBANA_API_USER=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 12)
KIBANA_API_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 12)

KIBANA_ENCRYPTION_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
NODEJS_BACKEND_JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)


#Waiting for the vault program to be ready to execute commands
while true; do
  rc=0
  vault status -address=${VAULT_ADDR} > /dev/null 2>&1 || rc=$?
  if [ $rc -eq 0 ] || [ $rc -eq 2 ]; then
    break
  fi
  sleep 1
done

#Unlocking vault and login as root to be able to execute commands
INIT_OUTPUT=$(vault operator init -address=${VAULT_ADDR} -key-shares=3 -key-threshold=2)
UNSEAL_KEY_1=$(echo "${INIT_OUTPUT}" | grep 'Unseal Key 1:' | awk '{print $4}')
UNSEAL_KEY_2=$(echo "${INIT_OUTPUT}" | grep 'Unseal Key 2:' | awk '{print $4}')
UNSEAL_KEY_3=$(echo "${INIT_OUTPUT}" | grep 'Unseal Key 3:' | awk '{print $4}')
ROOT_TOKEN=$(echo "${INIT_OUTPUT}" | grep 'Initial Root Token:' | awk '{print $4}')

vault operator unseal ${UNSEAL_KEY_1}

vault operator unseal ${UNSEAL_KEY_2}

vault login ${ROOT_TOKEN}

vault audit enable file file_path=/vault/logs/audit.log logrotate_max_files=5 logrotate_max_size=104857600

# POLICIES SETUP
vault policy write oidc-auth-${MONITORING_USER_NAME} - << EOF
path "identity/oidc/provider/my-provider/authorize" {
capabilities = ["read"]
}
EOF

vault policy write oidc-auth-${MONITORING_ADMIN_NAME} - << EOF
path "identity/oidc/provider/my-provider/authorize" {
capabilities = ["read"]
}
EOF

vault policy write nginx-frontend-policy - <<EOF
path "pki/issue/nginx-frontend" {
  capabilities = ["create", "update"]
}
EOF

vault policy write vault-server-policy - <<EOF
path "pki/issue/vault-server" {
  capabilities = ["create", "update"]
}
EOF

vault policy write alertmanager-policy - <<EOF
path "kv-secrets/+/discord_webhook_url" {
  capabilities = ["read"]
}
EOF

vault policy write logstash-policy - <<EOF
path "pki/issue/logstash" {
  capabilities = ["create", "update"]
}
path "kv-secrets/+/elasticsearch_logstash_internal_password" {
  capabilities = ["read"]
}
EOF

vault policy write filebeat-policy - <<EOF
path "pki/issue/filebeat" {
  capabilities = ["create", "update"]
}
EOF

vault policy write nodejs-backend-policy - <<EOF
path "kv-secrets/+/google_auth_client_id" {
  capabilities = ["read"]
}
path "kv-secrets/+/google_auth_secret_id" {
  capabilities = ["read"]
}
path "kv-secrets/+/nodejs_backend_jwt_secret" {
  capabilities = ["read"]
}
EOF

vault policy write elasticsearch-policy - <<EOF
path "pki/issue/elasticsearch" {
  capabilities = ["create", "update"]
}
path "identity/oidc/client/elasticsearch" {
  capabilities = ["read"]
}
path "kv-secrets/+/elasticsearch_elastic_password" {
  capabilities = ["read"]
}
path "kv-secrets/+/elasticsearch_kibana_system_password" {
  capabilities = ["read"]
}
path "kv-secrets/+/elasticsearch_logstash_internal_password" {
  capabilities = ["read"]
}
path "kv-secrets/+/kibana_api_user" {
  capabilities = ["read"]
}
path "kv-secrets/+/kibana_api_password" {
  capabilities = ["read"]
}
EOF

vault policy write kibana-policy - <<EOF
path "pki/issue/kibana" {
  capabilities = ["create", "update"]
}
path "kv-secrets/+/kibana_encryption_key" {
  capabilities = ["read"]
}
path "kv-secrets/+/elasticsearch_kibana_system_password" {
  capabilities = ["read"]
}
path "kv-secrets/+/kibana_api_user" {
  capabilities = ["read"]
}
path "kv-secrets/+/kibana_api_password" {
  capabilities = ["read"]
}
EOF

vault policy write grafana-policy - <<EOF
path "identity/oidc/client/grafana" {
  capabilities = ["read"]
}
EOF

# SERVICE USER SETUP with approle

vault auth enable approle

vault write auth/approle/role/nodejs-backend \
    token_policies="nodejs-backend-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/nginx-frontend \
    token_policies="nginx-frontend-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/kibana \
    token_policies="kibana-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/elasticsearch \
    token_policies="elasticsearch-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/grafana \
    token_policies="grafana-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/logstash \
    token_policies="logstash-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/filebeat \
    token_policies="filebeat-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/vault-server \
    token_policies="vault-server-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

vault write auth/approle/role/alertmanager \
    token_policies="alertmanager-policy" \
    secret_id_ttl=24h \
    token_ttl=1h \
    token_max_ttl=4h

# USER SETUP with userpass
vault auth enable userpass

vault write auth/userpass/users/${MONITORING_USER_NAME} \
    password="${MONITORING_USER_PASSWORD}" \
    token_policies="oidc-auth-${MONITORING_USER_NAME}" \
    token_ttl="1h"

vault write auth/userpass/users/${MONITORING_ADMIN_NAME} \
    password="${MONITORING_ADMIN_PASSWORD}" \
    token_policies="oidc-auth-${MONITORING_ADMIN_NAME}" \
    token_ttl="1h"

vault write identity/entity \
    name="${MONITORING_USER_NAME}" \
    metadata="email=${MONITORING_USER_EMAIL}" \
    metadata="phone_number=${MONITORING_USER_PHONE}" \
    disabled=false

vault write identity/entity \
    name="${MONITORING_ADMIN_NAME}" \
    metadata="email=${MONITORING_ADMIN_EMAIL}" \
    metadata="phone_number=${MONITORING_ADMIN_PHONE}" \
    disabled=false


MONITORING_USER_ENTITY_ID=$(vault read -field=id identity/entity/name/${MONITORING_USER_NAME})
MONITORING_ADMIN_ENTITY_ID=$(vault read -field=id identity/entity/name/${MONITORING_ADMIN_NAME})

USERPASS_ACCESSOR=$(vault auth list -detailed -format json | jq -r '.["userpass/"].accessor')

vault write identity/entity-alias \
    name="${MONITORING_USER_NAME}" \
    canonical_id="${MONITORING_USER_ENTITY_ID}" \
    mount_accessor="${USERPASS_ACCESSOR}"

vault write identity/entity-alias \
    name="${MONITORING_ADMIN_NAME}" \
    canonical_id="${MONITORING_ADMIN_ENTITY_ID}" \
    mount_accessor="${USERPASS_ACCESSOR}"

vault write identity/group \
    name="grafana_admins" \
    member_entity_ids="${MONITORING_ADMIN_ENTITY_ID}"

vault write identity/group \
    name="kibana_admins" \
    member_entity_ids="${MONITORING_ADMIN_ENTITY_ID}"

GRAFANA_GROUP_ID=$(vault read -field=id identity/group/name/grafana_admins)
KIBANA_GROUP_ID=$(vault read -field=id identity/group/name/kibana_admins)

# OIDC SETUP
vault write identity/oidc/assignment/grafana-assignment \
    entity_ids="${MONITORING_USER_ENTITY_ID},${MONITORING_ADMIN_ENTITY_ID}" \
    group_ids="${GRAFANA_GROUP_ID}"

vault write identity/oidc/assignment/kibana-assignment \
    entity_ids="${MONITORING_USER_ENTITY_ID},${MONITORING_ADMIN_ENTITY_ID}" \
    group_ids="${KIBANA_GROUP_ID}"

vault write identity/oidc/key/my-key \
    allowed_client_ids="*" \
    verification_ttl="2h" \
    rotation_period="1h" \
    algorithm="RS256"

vault write identity/oidc/client/grafana \
    redirect_uris="https://localhost/grafana/login/generic_oauth" \
    assignments="grafana-assignment" \
    key="my-key" \
    id_token_ttl="30m" \
    access_token_ttl="1h"

vault write identity/oidc/client/elasticsearch \
    redirect_uris="https://localhost/kibana/api/security/oidc/callback" \
    assignments="kibana-assignment" \
    key="my-key" \
    id_token_ttl="30m" \
    access_token_ttl="1h"

GRAFANA_CLIENT_ID=$(vault read -field=client_id identity/oidc/client/grafana)
ELASTICSEARCH_CLIENT_ID=$(vault read -field=client_id identity/oidc/client/elasticsearch)

USER_SCOPE_TEMPLATE='{
    "username": {{identity.entity.name}},
    "contact": {
        "email": {{identity.entity.metadata.email}},
        "phone_number": {{identity.entity.metadata.phone_number}}
    }
}'

vault write identity/oidc/scope/user \
    description="The user scope provides claims using Vault identity entity metadata" \
    template="$(echo ${USER_SCOPE_TEMPLATE} | base64 -)"

GROUPS_SCOPE_TEMPLATE='{
    "groups": {{identity.entity.groups.names}}
}'

vault write identity/oidc/scope/groups \
    description="The groups scope provides the groups claim using Vault group membership" \
    template="$(echo ${GROUPS_SCOPE_TEMPLATE} | base64 -)"

vault write identity/oidc/provider/my-provider \
    allowed_client_ids="${GRAFANA_CLIENT_ID},${ELASTICSEARCH_CLIENT_ID}" \
    scopes_supported="groups,user"

# AUTOMATIC CERTIFICATES SETUP with pki

vault secrets enable pki
vault secrets tune -max-lease-ttl=8760h pki  # 1 an

vault write pki/root/generate/internal \
    common_name="some_name" \
    ttl=8760h

vault write pki/config/urls \
    issuing_certificates="https://vault-server:8200/v1/pki/ca" \
    crl_distribution_points="https://vault-server:8200/v1/pki/crl"

vault write pki/roles/nginx-frontend \
    allowed_domains="nginx-frontend" \
    allow_bare_domains=true \
    max_ttl="720h"

vault write pki/roles/elasticsearch \
    allowed_domains="elasticsearch" \
    allow_bare_domains=true \
    max_ttl="720h"

vault write pki/roles/kibana \
    allowed_domains="kibana" \
    allow_bare_domains=true \
    max_ttl="720h"

vault write pki/roles/logstash \
    allowed_domains="logstash" \
    allow_bare_domains=true \
    max_ttl="720h"

vault write pki/roles/filebeat \
    allowed_domains="filebeat" \
    allow_bare_domains=true \
    max_ttl="720h"

vault write pki/roles/vault-server \
    allowed_domains="vault-server" \
    allow_bare_domains=true \
    max_ttl="720h"

# STATIC SECRETS with kv
vault secrets enable -path=kv-secrets -version=2 kv

vault kv put /kv-secrets/google_auth_client_id google_auth_client_id=$(cat /run/secrets/google_auth_client_id)
vault kv put /kv-secrets/google_auth_secret_id google_auth_secret_id=$(cat /run/secrets/google_auth_secret_id)
vault kv put /kv-secrets/discord_webhook_url discord_webhook_url=$(cat /run/secrets/discord_webhook_url)
vault kv put /kv-secrets/kibana_encryption_key kibana_encryption_key=${KIBANA_ENCRYPTION_KEY}
vault kv put /kv-secrets/nodejs_backend_jwt_secret jwt_secret=${NODEJS_BACKEND_JWT_SECRET}
vault kv put /kv-secrets/elasticsearch_elastic_password elastic_password=${ELASTICSEARCH_PASSWORD}
vault kv put /kv-secrets/elasticsearch_kibana_system_password kibana_system_password=${KIBANA_SYSTEM_PASSWORD}
vault kv put /kv-secrets/elasticsearch_logstash_internal_password logstash_internal_password=${LOGSTASH_INTERNAL_PASSWORD}
vault kv put /kv-secrets/kibana_api_user kibana_api_user=${KIBANA_API_USER}
vault kv put /kv-secrets/kibana_api_password kibana_api_password=${KIBANA_API_PASSWORD}

#Sending the container/agents ids using shared docker volumes # Should automate for all agent container
mkdir -p /vault_agents_ids
mkdir -p /vault_agents_ids/nginx-frontend
mkdir -p /vault_agents_ids/kibana
mkdir -p /vault_agents_ids/elasticsearch
mkdir -p /vault_agents_ids/nodejs-backend
mkdir -p /vault_agents_ids/grafana
mkdir -p /vault_agents_ids/logstash
mkdir -p /vault_agents_ids/filebeat
mkdir -p /vault_agents_ids/vault-server
mkdir -p /vault_agents_ids/alertmanager

echo $(vault read -field=role_id auth/approle/role/nginx-frontend/role-id) > /vault_agents_ids/nginx-frontend/role-id
echo $(vault read -field=role_id auth/approle/role/kibana/role-id) > /vault_agents_ids/kibana/role-id
echo $(vault read -field=role_id auth/approle/role/elasticsearch/role-id) > /vault_agents_ids/elasticsearch/role-id
echo $(vault read -field=role_id auth/approle/role/nodejs-backend/role-id) > /vault_agents_ids/nodejs-backend/role-id
echo $(vault read -field=role_id auth/approle/role/grafana/role-id) > /vault_agents_ids/grafana/role-id
echo $(vault read -field=role_id auth/approle/role/logstash/role-id) > /vault_agents_ids/logstash/role-id
echo $(vault read -field=role_id auth/approle/role/filebeat/role-id) > /vault_agents_ids/filebeat/role-id
echo $(vault read -field=role_id auth/approle/role/vault-server/role-id) > /vault_agents_ids/vault-server/role-id
echo $(vault read -field=role_id auth/approle/role/alertmanager/role-id) > /vault_agents_ids/alertmanager/role-id

vault write -f auth/approle/role/nginx-frontend/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/nginx-frontend/secret-id
vault write -f auth/approle/role/kibana/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/kibana/secret-id
vault write -f auth/approle/role/elasticsearch/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/elasticsearch/secret-id
vault write -f auth/approle/role/nodejs-backend/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/nodejs-backend/secret-id
vault write -f auth/approle/role/grafana/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/grafana/secret-id
vault write -f auth/approle/role/logstash/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/logstash/secret-id
vault write -f auth/approle/role/filebeat/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/filebeat/secret-id
vault write -f auth/approle/role/vault-server/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/vault-server/secret-id
vault write -f auth/approle/role/alertmanager/secret-id -format=json | jq -r '.data.secret_id' > /vault_agents_ids/alertmanager/secret-id

# chown -R vault:vault /vault_agents_ids

#Disconecting by removing the granted token
# rm /root/.vault-token

#Creating the access file to push outside of the vault container
cat << EOF > "${REPORT_FILE}"
======================================================================
           ACCESS REPORT - MONITORING INFRASTRUCTURE
======================================================================
Generated on    : $(date '+%Y/%m/%d %H:%M:%S')
Environment     : Vault / Grafana OIDC / Kibana OIDC
----------------------------------------------------------------------

1. ADMINISTRATOR ACCESS (Grafana & Kibana Admin)
--------------------------------------------------------
Username      : ${MONITORING_ADMIN_NAME}
Password      : ${MONITORING_ADMIN_PASSWORD}
Linked Email  : ${MONITORING_ADMIN_EMAIL}
Phone Number  : ${MONITORING_ADMIN_PHONE}
Role          : Admin / Engineering (Full Access)

2. STANDARD USER ACCESS (Grafana & Kibana User)
-------------------------------------------------------
Username      : ${MONITORING_USER_NAME}
Password      : ${MONITORING_USER_PASSWORD}
Linked Email  : ${MONITORING_USER_EMAIL}
Phone Number  : ${MONITORING_USER_PHONE}
Role          : Viewer / Standard User

3. VAULT RECOVERY INFORMATION (CRITICAL)
----------------------------------------
Warning: This information allows full unlocking of the Vault.
Store this in a highly secure location (e.g., Password Manager).

Initial Root Token : ${ROOT_TOKEN}

Unseal Keys (Shamir Shares):
  [Key 1] -> ${UNSEAL_KEY_1}
  [Key 2] -> ${UNSEAL_KEY_2}
  [Key 3] -> ${UNSEAL_KEY_3}

----------------------------------------------------------------------
Note: To log in to Grafana or Kibana via OIDC, use the credentials 
listed above at the "Sign in with Vault/OIDC" login prompt.
======================================================================
EOF

# chmod 666 "${REPORT_FILE}"
touch "/vault/file/.initialized"