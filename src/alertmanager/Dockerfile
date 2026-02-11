FROM prom/alertmanager:v0.30.0

COPY config/alertmanager.yml.tmpl /etc/alertmanager/alertmanager.yml.tmpl

USER root

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

RUN mkdir /vault && chmod 750 /vault && chown 65534:65534 /vault

USER 65534

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]