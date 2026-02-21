FROM prom/node-exporter:v1.10.2

USER root

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

USER 65534

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]