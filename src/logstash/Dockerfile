FROM docker.elastic.co/logstash/logstash-wolfi:9.2.4

COPY config/logstash.conf /usr/share/logstash/pipeline/logstash.conf
COPY config/logstash.yml /usr/share/logstash/config/logstash.yml


USER root

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

USER 1000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
