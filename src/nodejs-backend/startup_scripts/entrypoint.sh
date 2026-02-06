#!/bin/sh
set -e

export JWT_SECRET=$(cat /vault/secrets/jwt_secret)
export GOOGLE_CLIENT_ID=$(cat /vault/secrets/google_auth_client_id)
export GOOGLE_CLIENT_SECRET=$(cat /vault/secrets/google_auth_secret_id)

# Run command with node if the first argument contains a "-" or is not a system command. The last
# part inside the "{}" is a workaround for the following bug in ash/dash:
# https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=874264
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ] || { [ -f "${1}" ] && ! [ -x "${1}" ]; }; then
  set -- node "$@"
fi

exec "$@"
