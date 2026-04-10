# Production Verification Checklist

This checklist covers the runtime integrations that are not fully proven by local unit and contract tests alone. Use it for staging and production smoke verification after config changes, provider rotation, domain changes, or reverse-proxy updates.

## SMTP / forgot-password / verify-email / reset-password

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/PasswordResetApiContractTests.java`
- `backend/src/test/java/com/devwonder/backend/PasswordResetServiceTests.java`
- `backend/src/test/java/com/devwonder/backend/AdminEmailVerificationContractTests.java`
- `main-fe/src/app/reset-password/page.test.tsx`
- `admin-fe/src/pages/VerifyEmailPage.test.tsx`

Prerequisite config and env:
- Mail host, port, username, password, and sender identity are set for the deployment environment.
- Public links in reset/verify email templates point to the real frontend domain.
- Spam filtering and DMARC/SPF/DKIM are configured for the sender domain.

How to verify:
- Request dealer forgot-password for a known account.
- Request admin email verification resend for an unverified admin.
- Open the received links from a browser outside the admin session.
- Complete reset-password with a new password and sign in with it.

Expected result:
- Request endpoints return generic success responses.
- Email arrives within expected SLA.
- Verify/reset token pages show valid states.
- New password works and previous password is rejected where expected.

Common failure modes:
- SMTP auth failure or blocked sender.
- Wrong public host in email links.
- Token expiry/config mismatch between backend and frontend.
- Mail accepted by provider but quarantined by spam controls.

Logs and metrics to check:
- Backend mail send logs and password reset token creation logs.
- Provider delivery logs, bounce logs, and suppression lists.
- Count of reset/verify requests versus completed resets/verifications.

Manual smoke after deploy:
- Yes, after mail config, domain, or template changes.

## SePay webhook

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/SepayServiceTests.java`
- `backend/src/test/java/com/devwonder/backend/SepayWebhookControllerTests.java`

Prerequisite config and env:
- SePay webhook secret or equivalent auth config is present.
- Public callback URL is reachable from SePay.
- Bank-transfer instructions and order matching rules are enabled for the target environment.

How to verify:
- Trigger a real or provider-simulated webhook with a unique transfer reference.
- Confirm the webhook reaches the public endpoint through the deployed reverse proxy.
- Confirm the target order payment status updates in admin/dealer views.

Expected result:
- Webhook returns success.
- Matching payment record is persisted once.
- Duplicate replay does not double-apply the payment.

Common failure modes:
- Wrong public URL or blocked ingress path.
- Secret mismatch or disabled webhook mode.
- Duplicate webhook fingerprints not matching expected behavior.
- Bank transfer content not matching order lookup rules.

Logs and metrics to check:
- Webhook access logs.
- Payment matching logs and duplicate detection logs.
- Count of unmatched incoming transfers.

Manual smoke after deploy:
- Yes, after payment config, webhook URL, or reverse-proxy changes.

## Upload local / S3 / MinIO

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/UploadAuthorizationTests.java`
- `backend/src/test/java/com/devwonder/backend/UploadAssetPublicS3Tests.java`

Prerequisite config and env:
- Storage mode is correct for the environment.
- Bucket/container, credentials, region, public base URL, and CORS rules are configured.
- For local mode, writable filesystem path exists and is persistent.

How to verify:
- Upload one image and one PDF through the intended frontend flow.
- Fetch the returned asset URL directly from a browser or `curl`.
- For private upload flows, verify access control still holds.

Expected result:
- Upload request succeeds.
- Stored object path matches the configured storage backend.
- Returned URL is reachable when it should be public.
- PDF/image content renders correctly.

Common failure modes:
- Wrong bucket endpoint, region, or signature version.
- MinIO/S3 public URL mismatch.
- Local disk permissions or missing volume mount.
- CORS prevents browser upload or asset preview.

Logs and metrics to check:
- Upload controller logs.
- Storage SDK errors.
- Object creation audit logs or bucket access logs.

Manual smoke after deploy:
- Yes, after storage config, bucket policy, or CDN changes.

## WebSocket realtime

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/WebSocketAuthenticationInterceptorTokenTypeTests.java`
- `backend/src/test/java/com/devwonder/backend/WebSocketAuthorizationInterceptorTests.java`
- `backend/src/test/java/com/devwonder/backend/WebSocketEventPublisherTests.java`

Prerequisite config and env:
- WebSocket endpoint is exposed through the reverse proxy.
- Sticky-session or websocket upgrade support is configured where required.
- Frontend websocket base URL resolves to the deployed backend.

How to verify:
- Sign in as admin and keep the admin UI open.
- Trigger a new order, dealer registration, or support ticket from another client.
- Confirm the UI receives the realtime event without a full page refresh.

Expected result:
- Connection upgrades successfully.
- Protected topics reject anonymous or unauthorized subscriptions.
- Admin receives the expected toast/reload behavior.

Common failure modes:
- Reverse proxy strips upgrade headers.
- Token type or auth header mismatch.
- SockJS/STOMP endpoint path rewritten incorrectly.
- Mixed-content blocking under HTTPS.

Logs and metrics to check:
- WebSocket handshake logs.
- STOMP subscription authorization failures.
- Frontend console errors for reconnect or upgrade failures.

Manual smoke after deploy:
- Yes, after proxy, TLS, or websocket endpoint changes.

## FCM push

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/PushTokenRegistrationContractTests.java`

Additional bootstrap proof added in codebase:
- `backend/src/test/java/com/devwonder/backend/config/FirebaseConfigTests.java`

Prerequisite config and env:
- `app.fcm.enabled=true` only where Firebase credentials are available.
- Service account JSON is supplied by path or base64 config.
- Mobile app is built with the correct Firebase project and platform credentials.

How to verify:
- Register a fresh push token from a real device build.
- Send a test push from the backend or Firebase console to that token.
- Verify foreground and background handling on the dealer app.

Expected result:
- Backend starts with Firebase initialized.
- Push token registration succeeds.
- Device receives the push and opens the expected app route when tapped.

Common failure modes:
- Invalid Firebase credentials or wrong project.
- Token registered against the wrong environment.
- Platform notification permission denied.
- APNs or Android notification channel misconfiguration.

Logs and metrics to check:
- Backend Firebase initialization logs.
- Push token registration logs.
- Firebase delivery reports and error codes.
- Mobile device logs for token refresh and message receipt.

Manual smoke after deploy:
- Yes, for every environment where push is enabled.

## Report export PDF / XLSX

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/AdminReportExportApiContractTests.java`

Prerequisite config and env:
- Report endpoints are exposed to the admin domain.
- Any required object storage or temp-file directory is writable.

How to verify:
- Export PDF and XLSX from the admin reports screen.
- Open the downloaded files with a standard viewer.

Expected result:
- Correct filename, content type, and non-empty content.
- PDF opens without corruption.
- XLSX opens without repair warnings and contains the expected rows.

Common failure modes:
- Proxy buffering or response-size limits.
- Incorrect content-type headers.
- Character encoding or font issues in generated PDF.

Logs and metrics to check:
- Report generation duration.
- Export failures by file type.
- Response-size and timeout logs at proxy and app levels.

Manual smoke after deploy:
- Recommended after report template or proxy changes.

## Refresh-token cookie across domain / subdomain / TLS

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/RefreshTokenRotationTests.java`

Prerequisite config and env:
- Cookie domain, secure flag, same-site mode, and HTTPS termination are correct for the real hostnames.
- Reverse proxy forwards scheme and host headers correctly.

How to verify:
- Sign in through the deployed frontend domain.
- Let the access token expire or force a refresh flow.
- Confirm the refresh cookie is sent and a new access token is issued without logging the user out.
- Repeat across relevant subdomains if admin, main, and dealer run on different hosts.

Expected result:
- Cookie is present with the intended domain and security attributes.
- Refresh succeeds under HTTPS.
- Logout clears the cookie.

Common failure modes:
- Cookie domain does not match deployed host.
- `Secure` cookie blocked because TLS termination is misreported.
- SameSite policy blocks cross-site refresh.
- Proxy strips forwarded headers and backend thinks the request is insecure.

Logs and metrics to check:
- Auth refresh logs.
- Browser devtools cookie inspection.
- Reverse-proxy forwarded-header logs where available.

Manual smoke after deploy:
- Yes, after domain, TLS, proxy, or auth-cookie config changes.

## CORS / SameSite / reverse proxy

Automated proof in repo:
- `backend/src/test/java/com/devwonder/backend/CorsOriginPatternValidatorTests.java`

Prerequisite config and env:
- Allowed origin patterns match the deployed admin/main/dealer domains.
- Reverse proxy forwards `Origin`, `Host`, and scheme headers correctly.
- Credentialed requests are enabled only for explicit trusted origins.

How to verify:
- Perform authenticated API requests from each deployed frontend origin.
- Verify preflight responses for write operations.
- Confirm browser requests carrying cookies succeed from the expected frontend origins and fail from untrusted origins.

Expected result:
- Correct `Access-Control-Allow-Origin` for trusted origins.
- Credentialed requests succeed only from intended origins.
- No wildcard credentialed CORS policy leaks into production.

Common failure modes:
- Missing or mismatched origin pattern.
- Proxy rewriting host/scheme, breaking origin validation.
- SameSite/cookie configuration inconsistent with frontend deployment topology.

Logs and metrics to check:
- Browser network panel for failed preflights.
- Backend CORS rejection logs.
- Reverse-proxy access logs for `OPTIONS` requests.

Manual smoke after deploy:
- Yes, after origin, domain, cookie, or proxy changes.
