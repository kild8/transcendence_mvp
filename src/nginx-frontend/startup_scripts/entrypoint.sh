#!/bin/sh
set -e

/usr/local/bin/secrets-watcher.sh &

exec "$@"