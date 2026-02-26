#!/bin/sh

LOG="/cloudflared/cloudflared.log"
OUT="/tunnel_url/tunnel_url.txt"

URL=""

while [ -z "$URL" ]; do
  URL=$(grep -o 'https://[a-zA-Z0-9.-]*trycloudflare.com' "$LOG" | head -n 1)
  sleep 1
done

printf "%s" "$URL" > "$OUT"

touch /cloudflared/url_initialized