#!/bin/bash
set -e

echo "[entrypoint] Starting Frigate backend..."
python3 -m frigate &
BACKEND_PID=$!

echo "[entrypoint] Installing frontend dependencies..."
cd /workspace/frigate/web
npm i

echo "[entrypoint] Starting Frigate frontend..."
npm run dev &
FRONTEND_PID=$!

echo "[entrypoint] Both services started (backend PID=$BACKEND_PID, frontend PID=$FRONTEND_PID)"

# Keep container alive and exit if either process dies
wait -n $BACKEND_PID $FRONTEND_PID
EXIT_CODE=$?

echo "[entrypoint] A process exited with code $EXIT_CODE. Shutting down..."
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
exit $EXIT_CODE
