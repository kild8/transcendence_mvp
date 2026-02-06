FROM docker.elastic.co/elasticsearch/elasticsearch-wolfi:9.2.4

COPY config/elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml

USER root

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

USER 1000

ENTRYPOINT ["/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]