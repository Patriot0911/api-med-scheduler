#!/bin/sh
set -e

typeorm() {
  exec node node_modules/typeorm/cli.js "$@" -d dist/database/data-source.js
}

case "$1" in
  serve)          exec node dist/main.js ;;
  migrate)        typeorm migration:run ;;
  migrate:revert) typeorm migration:revert ;;
  migrate:show)   typeorm migration:show ;;
  seed)           exec node dist/database/seeds/run-seeds.js ;;
  *)              exec "$@" ;;
esac
