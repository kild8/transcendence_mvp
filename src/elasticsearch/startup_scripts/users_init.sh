#!/bin/bash
set -e

ELASTIC_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/elastic_password)
KIBANA_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/kibana_system_password)
LOGSTASH_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/logstash_internal_password)

CA="/usr/share/elasticsearch/config/secrets/ca.crt"
CERT="/usr/share/elasticsearch/config/secrets/elasticsearch.crt"
KEY="/usr/share/elasticsearch/config/secrets/elasticsearch.key"

until curl --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -w "%{http_code}" \
     https://elasticsearch:9200 | grep -E "200" > /dev/null; do
    sleep 2
done

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -X POST "https://elasticsearch:9200/_security/user/kibana_system/_password" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"${KIBANA_PASSWORD}\"}"

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/role/logstash_writer" \
     -H "Content-Type: application/json" \
     -d '{
  "cluster": ["manage_index_templates", "monitor", "manage_ilm"],
  "indices": [
    {
      "names": [ "docker-logs-*" ],
      "privileges": ["write", "create", "create_index", "manage", "manage_ilm"]
    }
  ]
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/user/logstash_internal" \
     -H "Content-Type: application/json" \
     -d "{
  \"password\" : \"${LOGSTASH_PASSWORD}\",
  \"roles\" : [ \"logstash_writer\" ],
  \"full_name\" : \"Internal Logstash User\"
}"

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "elastic:${ELASTIC_PASSWORD}" \
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
     -u "elastic:${ELASTIC_PASSWORD}" \
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

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u elastic:${ELASTIC_PASSWORD} \
     -X PUT "https://elasticsearch:9200/_ilm/policy/transcendence_logs_policy" \
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
     -X PUT "https://elasticsearch:9200/_index_template/docker_logs_template" \
     -H 'Content-Type: application/json' \
     -d '{
  "index_patterns": ["docker-logs-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "transcendence_logs_policy"
    }
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} --key-type PEM \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_license/start_trial?acknowledge=true"

touch /usr/share/elasticsearch/.healthy
