FROM hashicorp/vault:1.21.2

RUN apk add jq openssl inotify-tools

COPY config/config.hcl /vault/config/config.hcl

USER root

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

ENTRYPOINT ["entrypoint.sh"]
