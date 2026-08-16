#!/usr/bin/env bash
#
# Container smoke test: build the image, run it without a GitHub token, and
# check that the process serves health, the homepage and a content route
# before either poller has necessarily succeeded.
#
# Usage: scripts/smoke-container.sh [port]

set -euo pipefail

PORT="${1:-3931}"
IMAGE="xpdustry-website:smoke"
NAME="xpdustry-website-smoke"

runtime=""
for candidate in podman docker; do
  if command -v "$candidate" >/dev/null 2>&1; then
    runtime="$candidate"
    break
  fi
done
if [ -z "$runtime" ]; then
  echo "smoke: neither podman nor docker is installed" >&2
  exit 1
fi

cleanup() { "$runtime" rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

echo "smoke: building $IMAGE with $runtime"
"$runtime" build -t "$IMAGE" -f Containerfile .

echo "smoke: starting on port $PORT"
"$runtime" run -d --name "$NAME" -p "$PORT:3000" "$IMAGE" >/dev/null

# The pollers fire on startup; the server must accept requests without waiting
# for them, so this only waits for the listener.
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1; then break; fi
  sleep 1
done

failed=0
check() {
  local path="$1" expected="$2"
  local actual
  actual="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$path")"
  if [ "$actual" = "$expected" ]; then
    printf '  ok    %-28s %s\n' "$path" "$actual"
  else
    printf '  FAIL  %-28s %s (expected %s)\n' "$path" "$actual" "$expected"
    failed=1
  fi
}

check /healthz 200
check / 200
check /docs/nohorny/install 200
check /blog/nohorny-4-beta-8 200
# Development-only, and a production image must not carry it.
check /styleguide 404

uid="$("$runtime" exec "$NAME" id -u)"
if [ "$uid" = "1001" ]; then
  printf '  ok    %-28s %s\n' "runs as uid" "$uid"
else
  printf '  FAIL  %-28s %s (expected 1001)\n' "runs as uid" "$uid"
  failed=1
fi

if [ "$failed" -eq 0 ]; then
  echo "smoke: passed"
else
  echo "smoke: failed" >&2
fi
exit "$failed"
