#!/bin/sh

DISCORD_WEBHOOK_URL=$(cat /vault/secrets/discord_webhook_url)

sed "s|DISCORD_URL_PLACEHOLDER|$DISCORD_WEBHOOK_URL|g" /etc/alertmanager/alertmanager.yml.tmpl > /etc/alertmanager/alertmanager.yml
rm /etc/alertmanager/alertmanager.yml.tmpl

exec /bin/alertmanager "$@"