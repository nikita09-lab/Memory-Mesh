#!/usr/bin/env bash
# start_dev.sh — Start backend and frontend dev servers in parallel
set -euo pipefail

GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RESET="\033[0m"

info() { echo -e "${GREEN}[start]${RESET} $*"; }
warn() { echo -e "${YELLOW}[warn]${RESET}  $*"; }

# ── Sanity checks ─────────────────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
    warn "backend/.env not found. Run ./scripts/setup.sh first."
    exit 1
fi

if [ ! -d backend/.venv ]; then
    warn "Python venv not found. Run ./scripts/setup.sh first."
    exit 1
fi

if [ ! -d frontend/node_modules ]; then
    warn "node_modules not found. Run ./scripts/setup.sh first."
    exit 1
fi

# ── Start backend ─────────────────────────────────────────────────────────────
info "Starting backend on http://127.0.0.1:8000 ..."
(
    cd backend
    source .venv/bin/activate
    # Load .env into the shell for uvicorn
    set -a; source .env; set +a
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

# Give backend a moment to start before frontend tries to connect
sleep 2

# ── Start frontend ────────────────────────────────────────────────────────────
info "Starting frontend on http://localhost:5173 ..."
(
    cd frontend
    npm run dev
) &
FRONTEND_PID=$!

info "Both servers running."
info "  Backend:  http://127.0.0.1:8000"
info "  Frontend: http://localhost:5173"
info "  API docs: http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# ── Graceful shutdown ─────────────────────────────────────────────────────────
cleanup() {
    echo ""
    info "Stopping servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    info "Done."
}
trap cleanup INT TERM

wait "$BACKEND_PID" "$FRONTEND_PID"
