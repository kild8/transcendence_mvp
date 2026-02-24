#!/bin/sh

mkdir -p /home/textfile_collector

OUTPUT_FILE="/home/textfile_collector/expected_containers.prom"

CONTAINERS="alertmanager cadvisor grafana \
nginx-frontend node-exporter nodejs-backend prometheus \
vault-agent-alertmanager vault-agent-grafana vault-agent-nginx-frontend \
vault-agent-nodejs-backend vault-agent-vault-server vault-server"

echo "# HELP container_should_exist Containers that are expected to exist" > "$OUTPUT_FILE"
echo "# TYPE container_should_exist gauge" >> "$OUTPUT_FILE"

for name in ${CONTAINERS}; do
    echo "container_should_exist{name=\"${name}\"} 1" >> "$OUTPUT_FILE"
done

exec /bin/node_exporter "$@"