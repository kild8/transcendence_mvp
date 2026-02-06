FROM grafana/grafana:12.3.1

COPY config/grafana.ini /etc/grafana/grafana.ini
COPY config/dashboards.yml /etc/grafana/provisioning/dashboards/dashboards.yml
COPY config/datasources.yml /etc/grafana/provisioning/datasources/datasources.yml

COPY dashboards/dashboard.json /etc/dashboards/dashboard.json
