# MemoryMesh — Compliance Checklist

## GDPR (EU General Data Protection Regulation)

| Article | Requirement | Status |
|---------|------------|--------|
| Art. 5 | Data minimisation — only store what's needed | ✅ Embeddings in RAM only, wiped after response |
| Art. 17 | Right to erasure ("right to be forgotten") | ✅ /forget endpoint + SISA unlearning |
| Art. 25 | Privacy by design | ✅ Encryption at embedding layer, no disk persistence |
| Art. 30 | Records of processing activities | ✅ Merkle audit trail with timestamps |
| Art. 32 | Security of processing | ✅ AES-256-GCM, bcrypt, JWT |
| Art. 33 | Breach notification (72h) | ⚠️ Process not documented — add incident response runbook |

---

## EU AI Act (Articles 10 & 17)

| Article | Requirement | Status |
|---------|------------|--------|
| Art. 10 | Training data governance | ✅ SISA provenance tracking — know which shard trained on which user |
| Art. 17 | Quality management system | ⚠️ Partial — benchmark CSV exists; formal QMS not documented |
| Art. 13 | Transparency | ✅ /audit-proof endpoint provides cryptographic evidence |

---

## India DPDP Act (Digital Personal Data Protection Act 2023)

| Section | Requirement | Status |
|---------|------------|--------|
| S. 6 | Consent before processing | ⚠️ Registration flow should include explicit consent checkbox |
| S. 8 | Data fiduciary obligations | ✅ Deletion supported; audit trail maintained |
| S. 12 | Right to erasure | ✅ /forget + /delete-user |
| S. 17 | Data localisation | ⚠️ Not enforced at infrastructure level — deployment must use India-region cloud |

---

## Legend

- ✅ Implemented in current codebase
- ⚠️ Partially implemented or requires operational process (not just code)
- ❌ Not implemented
