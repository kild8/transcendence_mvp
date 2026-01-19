FROM prom/prometheus:v3.8.1

WORKDIR /etc/prometheus

COPY prometheus.yml prometheus.yml

COPY alerts.yml alerts.yml

COPY container_rules.yml container_rules.yml
