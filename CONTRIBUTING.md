# Contributing to MemoryMesh

Thank you for contributing! Please read this before opening a PR.

## Getting Started

```bash
git clone https://github.com/your-org/memory-mesh.git
cd memory-mesh
./scripts/setup.sh
./scripts/start_dev.sh
```

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/short-description` | `feat/add-rate-limiting` |
| Bug fix | `fix/short-description` | `fix/login-query-params` |
| Chore | `chore/short-description` | `chore/update-deps` |
| Docs | `docs/short-description` | `docs/threat-model` |

## Pull Request Rules

- Branch off `develop`, not `main`
- All CI checks must pass (backend tests, frontend build, security scan)
- One approval required from a maintainer
- Squash merge preferred

## Code Standards

**Backend (Python):**
- Format with `ruff format .`
- Lint with `ruff check .`
- No secrets in source — use env vars via `shared/config.py`
- New endpoints must have matching tests in `audit/tests/` or a new `tests/` file

**Frontend (React):**
- No hardcoded `API = 'http://...'` — use `import.meta.env.VITE_API_URL`
- Token sent in `Authorization: Bearer` header only — never in query params
- Lint with `npm run lint`

## Security Requirements

- Never commit `.env`, `*.db`, `*.save`, or generated JSON/CSV files
- Passwords must be hashed (bcrypt) — plaintext storage is a blocking review comment
- New endpoints must have authorization checked (authenticated + role where needed)
