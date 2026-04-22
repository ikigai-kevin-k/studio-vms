#!/bin/bash
set -e

echo "[entrypoint] Starting Frigate backend..."
python3 -m frigate &
BACKEND_PID=$!

if command -v npm >/dev/null 2>&1; then
  echo "[entrypoint] npm detected, starting frontend dev server..."
  cd /workspace/frigate/web
  npm i
  npm run dev &
  FRONTEND_PID=$!

  echo "[entrypoint] Both services started (backend PID=$BACKEND_PID, frontend PID=$FRONTEND_PID)"
  # Keep container alive and exit if either process dies.
  wait -n "$BACKEND_PID" "$FRONTEND_PID"
  EXIT_CODE=$?
else
  echo "[entrypoint] npm not found, running backend only (real/runtime mode)."
  wait "$BACKEND_PID"
  EXIT_CODE=$?
fi

echo "[entrypoint] A process exited with code $EXIT_CODE. Shutting down..."
kill "$BACKEND_PID" "${FRONTEND_PID:-}" 2>/dev/null || true
exit $EXIT_CODE
