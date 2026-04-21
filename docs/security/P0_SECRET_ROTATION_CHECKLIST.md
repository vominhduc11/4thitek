# P0 Secret Rotation Checklist

## 1) Files Previously Tracked In Git
- `.env.save`
- `link.txt`
- `link_auth.txt`
- `dealer/upload-keystore.jks`

## 2) Secret Types Potentially Impacted
- Environment/application secrets from `.env.save` (API keys, database credentials, third-party tokens).
- Auth bootstrap/recovery links and one-time auth artifacts from `link.txt` and `link_auth.txt`.
- Android upload signing material from `dealer/upload-keystore.jks`.

## 3) Rotation Actions Required
1. Rotate every credential that appeared in `.env.save`:
   - Database users/passwords
   - JWT/HMAC secrets
   - Third-party API keys/tokens
   - SMTP/service integration credentials
2. Invalidate and regenerate any auth/reset/verification links/tokens that may have been exposed via link dump files.
3. Replace Android upload signing key if compromise risk is unacceptable:
   - Generate a new upload keystore.
   - Update Play Console upload key process (if applicable).
   - Update CI/CD secure secret storage.

## 4) Verify Repository Is Clean
Run from repo root:

```bash
git ls-files | grep -Ei '(^|/)(\.env($|\..+$)|.*\.save$|.*\.jks$|.*\.keystore$|key\.properties$|service_account.*\.json$|google-services\.json$|link(_auth)?\.txt$)' || true
```

Expected result: no dangerous secret/artifact files listed (excluding explicit safe allowlist such as `.env.example`).

## 5) Git History Purge Requirement
- If any secret file was ever pushed to a remote, removing it in current commit is not enough.
- Purge history using `git filter-repo` or BFG Repo-Cleaner.
- Validate purge locally and on remote mirrors/forks.

## 6) Controlled Force Push After Purge
- Coordinate with team before rewrite.
- Force-push rewritten branches/tags in a controlled maintenance window.
- Protect default branch policy and audit who can force-push.

## 7) Collaborator Recovery Steps
- All collaborators must re-clone the repository, or hard-reset/rebase onto rewritten history.
- Invalidate stale local clones containing old secret objects.

## 8) Current PR Scope Note
- This PR removes dangerous files from git tracking and hardens ignore/CI guardrails.
- Secret value rotation must be executed in secret stores and external providers by authorized owners.
