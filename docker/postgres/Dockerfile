FROM postgres:16-alpine

COPY import-from-mounted-file.sh /docker-entrypoint-initdb.d/010-import-from-mounted-file.sh
RUN chmod +x /docker-entrypoint-initdb.d/010-import-from-mounted-file.sh

