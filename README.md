# KeyX — Onboarding & Learning Platform

An aesthetic, interactive, mobile-first web platform that helps units understand
**KeyX** — the digital keypress for units without EKMS — and onboard onto it.

KeyX replaces the physical keypress book with a SingPass-verified digital ledger:
every issue, return, and Handover/Takeover (HOTO) is logged automatically, giving
real-time visibility, frictionless scalability, and an unbreakable audit trail.

## What's inside

A single-page app (hash-routed, no build step) with five views:

| View | What it does |
|------|--------------|
| **Overview** | What KeyX is, the essentials, and the three core functionalities, with a live keypress-console mock. |
| **How it works** | An interactive **Secure Transfer Protocol** demo — generate a QR handover code, watch the 55-second window, and transfer custody between two devices. Plus the system roles (UA, Issuers & Key Holders, SingPass). |
| **Live demo** | A working model of the **Quickglance dashboard** — tap any bunch to sign a key in/out, watch the status LEDs and counters update, and see events written to an audit ledger (exportable to CSV). Includes a "Simulate duty day" auto-runner. |
| **Benefits** | The five pillars: accountability, real-time visibility, frictionless scalability, dynamic access control, and unbreakable audit trails. |
| **Onboard** | A guided **two-step checklist** (progress saved on-device) with copyable formats, a live **format checker** for account names & NRIC, downloadable mass-upload CSV templates, and an admin playbook covering keypresses, adding keys, whitelisting issuers, and deleting keys — with the critical rules called out. |

### Highlights

- **Mobile-first** — desktop top nav collapses to an app-style bottom tab bar; every view is verified for zero horizontal overflow down to 360px.
- **Light & dark themes** — follows the OS preference, with a manual toggle (remembered on the device).
- **Interactive & accessible** — keyboard-operable controls, `aria` states, visible focus, and full `prefers-reduced-motion` support.
- **Self-contained** — IBM Plex + Chakra Petch typefaces are embedded as base64 (no CDN calls); all icons are inline SVG. Works offline and hosts anywhere static.

## Run it

It's plain static files — no dependencies, no build.

```bash
# any static server, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` in a browser.

## Deploy (GitHub Pages)

Push to your branch and enable Pages (Settings → Pages → deploy from branch).
The included `.nojekyll` keeps the `assets/` folder served as-is.

## Structure

```
index.html              # all markup + the five views + inline icon sprite
assets/css/style.css    # design system: "Digital Keypress Console"
assets/css/fonts.css    # embedded woff2 (IBM Plex Sans/Mono, Chakra Petch)
assets/js/app.js        # routing, theme, QR handover, dashboard, onboarding wizard
assets/img/favicon.svg  # KeyX crossed-key emblem
```

## Notes on data & privacy

This is an **unofficial onboarding & learning companion**. It uses **demonstration
data only** — no live keys, rolls, or NRICs are stored or transmitted; the checklist
state lives in your browser's `localStorage`. When preparing real onboarding lists,
handle personal data (names, NRIC, ORD dates) per your unit's security policy.

Onboarding contact: **WhatsApp Ranee · +65 8782 0742**.
