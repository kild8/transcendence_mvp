FROM prom/prometheus:v3.8.1

COPY config/prometheus.yml /etc/prometheus/prometheus.yml

COPY config/alerts.yml /etc/prometheus/alerts.yml

COPY config/container_rules.yml /etc/prometheus/container_rules.yml
