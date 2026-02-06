FROM  docker.elastic.co/beats/filebeat-wolfi:9.2.4

COPY --chown=root:filebeat config/filebeat.yml /usr/share/filebeat/filebeat.yml

USER root

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

USER 1000

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
