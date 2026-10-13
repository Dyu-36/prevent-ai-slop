# Security policy

## Reporting a vulnerability

Open a private security advisory at
<https://github.com/Dyu-36/prevent-ai-slop/security/advisories/new>, or email the maintainer listed
in `package.json`. Please do not open a public issue for anything exploitable. Expect an initial
response within a week.

## Trust boundaries you should understand before running the audit

The `slopcheck-audit` skill executes code and sends data in ways that matter:

1. **`official` mode sends the target URL to a third-party service.** The live checker at
   `https://ai-slop-checker.vercel.app/` fetches the page through external extraction providers
   and may send its text to a model provider. Consequences:
   - use it on public URLs only;
   - never pass URLs containing credentials, tokens or query-string secrets;
   - never pass internal hostnames, intranet addresses or unpublished customer content;
   - `isPublicUrl()` rejects localhost, RFC1918, `.internal`/`.local`/`.test` hosts and
     credentialed URLs, but it cannot judge whether a *public* URL is sensitive. That decision is
     yours.

2. **`canonical` mode downloads and executes third-party JavaScript.** The checker's page HTML is
   fetched, its `window.__slopcheck.analyze()`/`score()` functions are executed in an isolated
   browser page, and that page's outbound requests are blocked with Playwright routing. The
   target's markup and screenshot stay local. The downloaded code is still untrusted
   third-party code running in your browser process; audit only on a machine and network you
   trust, and pin or mirror the engine URL (`--original-url`) if you need reproducibility.

3. **Chromium sandbox.** `SLOP_AUDIT_NO_SANDBOX=1` launches Chromium with `--no-sandbox` for
   containers and CI. It weakens process isolation; use it only where that tradeoff is
   acceptable.

4. **Screenshots are data.** A screenshot can contain personal data, session tokens rendered in
   the UI, or internal dashboards. Treat the generated `PREFIX.png` with the same care as the
   page itself, and do not attach it to public issues.

## Supported versions

Security fixes target the latest release on `main`. This project ships no runtime dependencies to
the audited project: the skills run with the user's own Node and Playwright.
