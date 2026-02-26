#!/bin/sh

touch /cloudflared/cloudflared.log
/usr/local/bin/url_getter.sh &

exec /usr/local/bin/cloudflared "$@"