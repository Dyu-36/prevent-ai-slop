# Parity matrix — the original checker vs this skill

**Target:** `https://ai-slop-checker.vercel.app/` as deployed at run time. The live website may change at any time.

## Official mode (`--mode official`)

- Uses Playwright to operate the real deployed checker, exactly as a human would: fill Link or set screenshot file, press Check, wait for `#rcTotal` and parse actual score, receipt, credit and evidence.
- The score is **exactly what the original website rendered on that same run**. The tool does not calculate it or reproduce the checker implementation.
- Original network fetches, screenshots, bundled JS fallbacks and AI text generation are controlled by the original site.
- Limits: the public site must be accessible; remote providers must accept the URL; requests can fail/rate-limit; original API changes can break selectors. For public URLs only.
- The report's finding IDs use `official-N` rather than original internal IDs because the website exposes titles, points and evidence but not all private rule keys through its UI. The original app's *score* remains unchanged.

## Canonical mode (`--mode canonical`)

- Downloads the current HTML page, validates the exported `window.__slopcheck` API, executes that page in a separate Playwright tab with all outbound requests blocked.
- Passes captured `html`, `raw`, `css`, optional `bundle`, `host` and browser-decoded screenshot `img` to the original exposed `analyze()` function; feeds the resulting analysis directly into the original `score()` function.
- **The rule implementation, thresholds, category caps, deductibles and scoring function are exactly the original deployed JavaScript for that fetch** (not approximated).
- **Input acquisition is not identical**: local Playwright navigates directly to the target and captures its hydrated DOM/CSS/screenshot. The original checker instead uses remote Microlink (1280×860 rendered screenshot/HTML) and Jina Reader fallbacks, which can differ due to animation timing, cookies, authorization, proxies, CORS, user agent, server variation and remote network restrictions.
- Canonical screenshot-only input passes the same image through the original `analyzePixels`; differences should be minimal for identical image bytes.
- `--wait-ms` defaults to 3000ms to reduce false detections from transient enter-animations. This is not a way to make all dynamic sites deterministic.
- Source fingerprint (`capture.sha256`) is recorded; a subsequent run can use a different live version.

## Parity regression

For a public URL **or an identical screenshot file**, run `--mode canonical --compare-official`. It separately performs both complete scans, then checks:

1. Same **numeric score**.
2. Same **sequence of category + points + original roast** for every detected rule (including those omitted from the short receipt; the Evidence section is used).
3. Same **sequence of positive-credit names and values**.

Failure returns process exit code 3 and includes `onlyOfficial` and `onlyLocal` signatures. This distinguishes capture differences from true engine discrepancies. If rules and credits differ, check animation timing, screenshot pixels, HTML hydration, fetched CSS, JS bundle fallback, protected content or network proxies. Do not claim 100% end-to-end equivalence when there are differences.

## Example baseline (provided by user)

User screenshot from the original site checking Aizen:

- `em dash`: +2
- `chosen typeface`: −6 in receipt (ordinary credits capped at 5 in scoring)
- Baseline offset: +6
- `effective = max(0, 2 + 6 − 5) = 3`
- `round(100 × (1 − exp(−3/32))) = 9%`

The browser contract-test fixtures simulate that shape to prevent another 17% mapping error. **Mocks are not a live parity verification**; only a scan using the deployed original website can validate the live source and acquisition path.
