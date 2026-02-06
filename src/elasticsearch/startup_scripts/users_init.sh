#!/bin/bash
set -e

ELASTIC_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/elastic_password)
KIBANA_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/kibana_system_password)
LOGSTASH_PASSWORD=$(cat /usr/share/elasticsearch/config/secrets/logstash_system_password)

CA="/usr/share/elasticsearch/config/secrets/ca.crt"
CERT="/usr/share/elasticsearch/config/secrets/elasticsearch.crt"
KEY="/usr/share/elasticsearch/config/secrets/elasticsearch.key"

until curl --cacert ${CA} --cert ${CERT} --key ${KEY} \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -w "%{http_code}" \
     https://elasticsearch:9200 | grep -E "200" > /dev/null; do
    sleep 2
done

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -X POST "https://elasticsearch:9200/_security/user/kibana_system/_password" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"${KIBANA_PASSWORD}\"}"

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} \
    -u "elastic:${ELASTIC_PASSWORD}" \
    -X POST "https://elasticsearch:9200/_security/user/logstash_system/_password" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"${LOGSTASH_PASSWORD}\"}"

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/role_mapping/vault_admins" \
     -H "Content-Type: application/json" \
     -d '{
  "roles": [ "superuser" ],
  "enabled": true,
  "rules": {
    "all": [
      { "field": { "realm.name": "oidc-vault" } },
      { "field": { "groups": "kibana-admins" } }
    ]
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_security/role_mapping/vault_viewers" \
     -H "Content-Type: application/json" \
     -d '{
  "roles": [ "viewer" ], 
  "enabled": true,
  "rules": {
    "all": [
      { "field": { "realm.name": "oidc-vault" } },
      { "except": { "field": { "groups": "kibana-admins" } } }
    ]
  }
}'

curl -s --cacert ${CA} --cert ${CERT} --key ${KEY} \
     -u "elastic:${ELASTIC_PASSWORD}" \
     -X POST "https://elasticsearch:9200/_license/start_trial?acknowledge=true"

touch /usr/share/elasticsearch/.healthy
