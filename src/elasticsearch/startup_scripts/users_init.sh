#!/bin/bash
set -e

ELASTIC_USER="elastic"
ELASTIC_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/elastic_password)
KIBANA_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/kibana_system_password)
LOGSTASH_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/logstash_internal_password)

KIBANA_API_USER=$(cat /usr/share/elasticsearch/config/secrets/kibana_api_user)
KIBANA_API_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/kibana_api_password)

CA="/usr/share/elasticsearch/config/secrets/ca.crt"
CERT="/usr/share/elasticsearch/config/secrets/elasticsearch.crt"
KEY="/usr/share/elasticsearch/config/secrets/elasticsearch.key"

#Waiting elasticsearch to be ready
until curl --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
     -w "%{http_code}" \
     https://elasticsearch:9200 | grep -E "200" > /dev/null; do
    sleep 2
done

#Setting up kibana password
curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
    -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
    -X POST "https://elasticsearch:9200/_security/user/kibana_system/_password" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"${KIBANA_PASSWORD}\"}"

#Setting up logstash user
curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/role/logstash_writer" \
     -H "Content-Type: application/json" \
     -d '{
  "cluster": ["manage_index_templates", "monitor", "manage_ilm"],
  "indices": [
    {
      "names": [ "ls-*" ],
      "privileges": ["write", "create", "create_index", "manage", "manage_ilm"]
    }
  ]
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/user/logstash_internal" \
     -H "Content-Type: application/json" \
     -d "{
  \"password\" : \"${LOGSTASH_PASSWORD}\",
  \"roles\" : [ \"logstash_writer\" ],
  \"full_name\" : \"Internal Logstash User\"
}"

#Setting up kibana api user for kibana to create indexes and add premade dashboards

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
     -X PUT "https://elasticsearch:9200/_security/role/data_view_manager" \
     -H "Content-Type: application/json" \
     -d '{
      "cluster": [],
      "indices": [
        {
          "names": ["your-indices-*"],
          "privileges": ["read", "view_index_metadata"]
        },
        {
          "names": [".kibana*"],
          "privileges": ["read", "write", "manage"]
        }
      ],
      "applications": [
        {
          "application": "kibana-.kibana",
          "privileges": ["all"],
          "resources": ["*"]
        }
      ]
    }'

curl -s --cacert "${CA}" --cert "${CERT}" --key "${KEY}" --key-type PEM \
  -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
  -X PUT "https://elasticsearch:9200/_security/user/${KIBANA_API_USER}" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "password": "${KIBANA_API_PASSWORD}",
  "roles": ["data_view_manager"]
}
EOF

#Role mapping for OICD
curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/role_mapping/vault_admins" \
     -H "Content-Type: application/json" \
     -d '{
  "roles": [ "superuser" ],
  "enabled": true,
  "rules": {
    "all": [
      { "field": { "realm.name": "oidc-vault" } },
      { "field": { "groups": "kibana_admins" } }
    ]
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/role_mapping/vault_viewers" \
     -H "Content-Type: application/json" \
     -d '{
  "roles": [ "viewer" ], 
  "enabled": true,
  "rules": {
    "all": [
      { "field": { "realm.name": "oidc-vault" } },
      { "except": { "field": { "groups": "kibana_admins" } } }
    ]
  }
}'

#Storage policy
curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u elastic:${ELASTIC_PASSWORD} \
     -X PUT "https://elasticsearch:9200/_ilm/policy/logs_3_days" \
     -H 'Content-Type: application/json' \
     -d '{
  "policy": {
    "phases": {
      "hot": { "actions": { "rollover": { "max_age": "1d", "max_size": "1gb" } } },
      "delete": { "min_age": "3d", "actions": { "delete": {} } }
    }
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u elastic:${ELASTIC_PASSWORD} \
     -X PUT "https://elasticsearch:9200/_ilm/policy/logs_7_days" \
     -H 'Content-Type: application/json' \
     -d '{
  "policy": {
    "phases": {
      "hot": { "actions": { "rollover": { "max_age": "1d", "max_size": "1gb" } } },
      "delete": { "min_age": "7d", "actions": { "delete": {} } }
    }
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u elastic:${ELASTIC_PASSWORD} \
     -X PUT "https://elasticsearch:9200/_ilm/policy/logs_30_days" \
     -H 'Content-Type: application/json' \
     -d '{
  "policy": {
    "phases": {
      "hot": { "actions": { "rollover": { "max_age": "1d", "max_size": "1gb" } } },
      "delete": { "min_age": "30d", "actions": { "delete": {} } }
    }
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u elastic:${ELASTIC_PASSWORD} \
     -X PUT "https://elasticsearch:9200/_index_template/template_standard" \
     -H 'Content-Type: application/json' \
     -d '{
  "index_patterns": ["ls-*"],
  "priority": 10,
  "template": {
    "settings": {
      "index.lifecycle.name": "logs_7_days"
    }
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u elastic:${ELASTIC_PASSWORD} \
     -X PUT "https://elasticsearch:9200/_index_template/template_heavy" \
     -H 'Content-Type: application/json' \
     -d '{
  "index_patterns": [
    "ls-elasticsearch*",
    "ls-logstash*",
    "ls-nginx-frontend-error*",
    "ls-nginx-frontend-access",
    "ls-kibana*",
    "ls-filebeat*",
    "ls-vault-agent-elasticsearch*",
    "ls-vault-agent-logstash*",
    "ls-vault-agent-nginx-frontend*",
    "ls-vault-agent-kibana*",
    "ls-vault-agent-filebeat*"
  ],
  "priority": 20,
  "template": {
    "settings": {
      "index.lifecycle.name": "logs_3_days"
    }
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u elastic:${ELASTIC_PASSWORD} \
     -X PUT "https://elasticsearch:9200/_index_template/template_critical" \
     -H 'Content-Type: application/json' \
     -d '{
  "index_patterns": [
    "ls-vault-server*",
    "ls-vault-server-audit*",
    "ls-nodejs-backend*",
    "ls-vault-agent-vault-server*",
    "ls-vault-agent-nodejs-backend*"
  ],
  "priority": 30,
  "template": {
    "settings": {
      "index.lifecycle.name": "logs_30_days"
    }
  }
} '

#Start free trial for OIDC
curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "${ELASTIC_USER}:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_license/start_trial?acknowledge=true"


touch /usr/share/elasticsearch/data/.user_initialized
