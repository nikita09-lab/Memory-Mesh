# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ Yes    |
| 1.x     | ❌ No     |

## Reporting a Vulnerability

If you discover a security vulnerability in MemoryMesh, please **do not open a public GitHub issue**.

Instead, email the maintainer directly at [security@memorymesh.ai](mailto:security@memorymesh.ai) with:

1. A description of the vulnerability
2. Steps to reproduce
3. The potential impact
4. Any suggested mitigations

You will receive acknowledgment within 48 hours and a resolution timeline within 7 days.

## Security Principles

MemoryMesh is built around privacy by design:

- **No plaintext passwords** — bcrypt hashing via passlib
- **No hardcoded secrets** — all secrets via environment variables
- **No persistent embeddings** — AES-256-GCM encryption in RAM, wiped after response
- **Append-only audit trail** — SQLite with triggers blocking DELETE and UPDATE
- **Merkle proof of deletion** — cryptographic evidence for regulators
- **Machine unlearning** — SISA sharding for selective model forgetting
- **Rate limiting** — brute-force protection on `/login`

## Out of Scope

- Denial of service attacks
- Social engineering
- Physical access
