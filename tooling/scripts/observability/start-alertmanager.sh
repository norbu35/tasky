#!/usr/bin/env sh
set -eu

: "${ALERT_WEBHOOK_URL:?ALERT_WEBHOOK_URL must be set}"

escaped_webhook_url=$(printf '%s\n' "$ALERT_WEBHOOK_URL" | sed 's/[&|]/\\&/g')

sed "s|__ALERT_WEBHOOK_URL__|${escaped_webhook_url}|g" \
  /etc/alertmanager/alertmanager.yml.template > /tmp/alertmanager.yml

exec /bin/alertmanager \
  --config.file=/tmp/alertmanager.yml \
  --storage.path=/alertmanager
