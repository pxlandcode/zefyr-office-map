#!/bin/sh
set -eu

import_file="${POSTGRES_IMPORT_FILE:-}"
seed_file="${POSTGRES_SEED_FILE:-}"
pin_pepper="${POSTGRES_PIN_PEPPER:-}"

run_sql_file() {
  file="$1"

  if [ ! -f "$file" ]; then
    echo "SQL import file does not exist: $file" >&2
    exit 1
  fi

  case "$file" in
    *.sql)
      psql \
        -v ON_ERROR_STOP=1 \
        -v pin_pepper="$pin_pepper" \
        --username "$POSTGRES_USER" \
        --dbname "$POSTGRES_DB" \
        -f "$file"
      ;;
    *.sql.gz)
      gunzip -c "$file" | psql \
        -v ON_ERROR_STOP=1 \
        -v pin_pepper="$pin_pepper" \
        --username "$POSTGRES_USER" \
        --dbname "$POSTGRES_DB"
      ;;
    *)
      echo "Unsupported import file format: $file" >&2
      exit 1
      ;;
  esac
}

if [ -n "$import_file" ]; then
  run_sql_file "$import_file"
fi

if [ -n "$seed_file" ]; then
  run_sql_file "$seed_file"
fi
