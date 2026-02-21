
#!/bin/bash

set -e

KIBANA_API_USER=$(cat /usr/share/kibana/config/secrets/kibana_api_user)
KIBANA_API_PASSWORD=$(cat /usr/share/kibana/config/secrets/kibana_api_password)

log_indexes=(
    "ls-alertmanager"
    "ls-cadvisor"
    "ls-elasticsearch"
    "ls-filebeat"
    "ls-grafana"
    "ls-kibana"
    "ls-logstash"
    "ls-nginx-frontend-access"
    "ls-nginx-frontend-error"
    "ls-node-exporter"
    "ls-nodejs-backend"
    "ls-prometheus"
    "ls-vault-agent-alertmanager"
    "ls-vault-agent-elasticsearch"
    "ls-vault-agent-filebeat"
    "ls-vault-agent-grafana"
    "ls-vault-agent-kibana"
    "ls-vault-agent-logstash"
    "ls-vault-agent-nginx-frontend"
    "ls-vault-agent-nodejs-backend"
    "ls-vault-agent-vault-server"
    "ls-vault-server"
    "ls-vault-server-audit"
)

for name in "${log_indexes[@]}"; do
until HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -u "${KIBANA_API_USER}:${KIBANA_API_PASSWORD}" \
  -X POST "http://kibana:5601/kibana/api/data_views/data_view" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d @- <<EOF
{
  "data_view": {
    "title": "${name}*",
    "timeFieldName": "@timestamp"
  }
}
EOF
) && [ "$HTTP_CODE" -eq 200 ]; do
    sleep 1
done

done






# until HTTP_CODE=$(curl -X POST "http://kibana:5601/kibana/api/saved_objects/_import" \
#     -H "kbn-xsrf: true" \
#     -u "${KIBANA_API_USER}:${KIBANA_API_PASSWORD}" \
#     --form file=@/usr/share/kibana/dashboards/export.ndjson
# ) && [ "$HTTP_CODE" -eq 200 ]; do
#     sleep 2
# done
