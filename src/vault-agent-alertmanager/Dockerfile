FROM hashicorp/vault:1.21.2

RUN apk add jq

COPY config/agent.hcl /vault/config/agent.hcl

WORKDIR /vault/templates

COPY config/templates/. .

RUN mkdir -p /vault/auth_token \
    && chown vault:vault /vault/auth_token \
    && chmod 700 /vault/auth_token \
    && mkdir -p /vault/approle \
    && chown vault:vault /vault/approle \
    && chmod 700 /vault/approle \
    && mkdir -p /vault/secrets \
    && chown vault:65534 /vault/secrets \
    && chmod 750 /vault/secrets