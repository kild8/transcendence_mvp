FROM hashicorp/vault:1.21.2

RUN apk add jq openssl inotify-tools

COPY --chown=vault:vault config/config.hcl /vault/config/config.hcl

USER root

RUN mkdir /vault_agents_ids \
    && chown vault:vault /vault_agents_ids

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

USER vault

ENTRYPOINT ["entrypoint.sh"]

