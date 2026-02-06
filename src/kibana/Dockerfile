FROM docker.elastic.co/kibana/kibana-wolfi:9.2.4

COPY config/kibana.yml /usr/share/kibana/config/kibana.yml

USER root

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

USER 1000

CMD ["/usr/local/bin/entrypoint.sh"]
