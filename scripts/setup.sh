#!/usr/bin/env bash
# setup.sh — One-time setup for MemoryMesh development environment
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

info()    { echo -e "${GREEN}[setup]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET}  $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; exit 1; }

echo -e "${BOLD}MemoryMesh — Development Setup${RESET}"
echo "========================================"

# ── Prerequisite checks ───────────────────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || error "Python 3.11+ is required. Install from https://python.org"
command -v node    >/dev/null 2>&1 || error "Node.js 18+ is required. Install from https://nodejs.org"
command -v npm     >/dev/null 2>&1 || error "npm is required (comes with Node.js)."

PYTHON_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
info "Python version: $PYTHON_VER"

# ── Backend .env ──────────────────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        # Auto-generate a random SECRET_KEY
        RAND_KEY=$(python3 -c "import secrets; print(secrets.token_hex(64))")
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^SECRET_KEY=.*/SECRET_KEY=${RAND_KEY}/" backend/.env
        else
            sed -i "s/^SECRET_KEY=.*/SECRET_KEY=${RAND_KEY}/" backend/.env
        fi
        info "Created backend/.env with a generated SECRET_KEY."
    else
        warn "backend/.env.example not found — skipping .env creation."
    fi
else
    info "backend/.env already exists — skipping."
fi

# ── Frontend .env ─────────────────────────────────────────────────────────────
if [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
        info "Created frontend/.env"
    fi
else
    info "frontend/.env already exists — skipping."
fi

# ── Python virtual environment ────────────────────────────────────────────────
if [ ! -d backend/.venv ]; then
    info "Creating Python virtual environment in backend/.venv ..."
    python3 -m venv backend/.venv
fi

info "Activating venv and installing Python dependencies..."
source backend/.venv/bin/activate
pip install --upgrade pip --quiet
pip install -r backend/requirements.txt --quiet
pip install slowapi python-dotenv ruff bandit --quiet
info "Python dependencies installed."

# ── Node dependencies ─────────────────────────────────────────────────────────
info "Installing frontend Node dependencies..."
cd frontend && npm ci --silent && cd ..
info "Node dependencies installed."

echo ""
echo -e "${GREEN}${BOLD}Setup complete!${RESET}"
echo ""
echo "Next step: run ./scripts/start_dev.sh"
echo ""
