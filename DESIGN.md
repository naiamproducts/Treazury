# Treazury — Design System Source of Truth

This document is the design-system source of truth for Treazury. Code and
comments default to ENGLISH. When this document and code disagree, this
document wins; fix the code (alignment only — no redesigns).

## 0. Language Rule

- **Code, comments, identifiers: ENGLISH.** Component names, props,
  localStorage keys, console prefixes, env vars, SDK classes stay in English.
- **All USER-FACING copy: SPANISH (rioplatense voseo).** Every surface —
  including the marketing landing — renders Spanish strings only: "Elegí",
  "operás", "Recibirás", "Cerrar sesión". Warm, direct, no slang overload.
- **Proper nouns and technical terms stay as-is:** Treazury, USDC, WhatsApp,
  B2B, TRC20/Polygon/Arbitrum, country names/flags, numbers.
- `index.html` follows the same rule: `<html lang="es">` plus a Spanish
  `<title>`.

## 1. Tokens

Owned by `tailwind.config.js` (`theme.extend`). Values below MUST match it
exactly.

### Colors

| Token      | Hex       | Tailwind class prefix |
|------------|-----------|-----------------------|
| onyx       | `#07080a` | `bg-onyx`, `text-onyx`, … |
| graphite   | `#0e1015` | `bg-graphite`, … |
| platinum   | `#f3f4f6` | `bg-platinum`, `text-platinum`, … |
| silver     | `#9ca3af` | `text-silver`, … |
| icyCyan    | `#a5f3fc` | `text-icyCyan`, `bg-icyCyan`, … |
| luxeCyan   | `#38bdf8` | `border-luxeCyan`, … |

Mirror vars live in `src/index.css` (`:root`: `--onyx`, `--graphite`,
`--platinum`, `--silver`, `--icy-cyan`, `--luxe-cyan`) so plain CSS rules can
reference tokens without hardcoding hex.

### Fonts

| Role  | Family              | Tailwind class |
|-------|---------------------|----------------|
| sans  | "Plus Jakarta Sans" | `font-sans` |
| serif | "Cormorant Garamond"| `font-serif` |
| mono  | "Space Grotesk"     | `font-mono` |

Loaded via Google Fonts in `index.html`. `index.html` additionally loads
"DM Sans" and "JetBrains Mono" as legacy fallbacks (see Open Questions).

### Light dashboard theme vars

Owned by `src/index.css` (`:root`): `--bg`, `--bg-gradient`, `--surface`,
`--surface-strong`, `--surface-muted`, `--ink`, `--ink-2`, `--muted`,
`--subtle`, `--border`, `--border-strong`, `--accent`, `--accent-hover`,
`--focus`, `--success` (`#1a8047`), `--danger` (`#ba2b4c`). Components use
`var(--…)` references, never the raw hex.

## 2. CSS File Map

| File | Owns | Must NOT own |
|------|------|--------------|
| `tailwind.config.js` | Token values (colors, font families) | No CSS rules, no components |
| `src/index.css` | Global reset/body, `:root` theme vars, `.luxe-*` utilities (`.luxe-landing`, `.luxe-glass`, `.luxe-glass-pill`, `.passport-stamp`, `.platinum-glow`, `.luxe-dotgrid`), `.treazury-strip` (rainbow divider), range-slider styling scoped to `.luxe-landing input[type='range']`, legacy `.display` / `.mono` helpers | No per-view layout, no component logic styles |
| Component files (`*.tsx`) | Component-scoped inline `style={…}` using `var(--…)` or Tailwind token classes | No new global utilities, no hardcoded hex where a token/var exists, no duplicate definitions of a utility that already lives in `index.css` |
| `index.html` | Font loading (`<link>` to Google Fonts) | No theme values |

Rules:

- No hardcoded hex in components where a token or theme var exists. Use the
  Tailwind token class (`bg-graphite`, `text-icyCyan`) or `var(--…)`.
- No duplicate definitions of the same utility in two files. Shared visuals
  (e.g. `.treazury-strip`) live once in `src/index.css` and are referenced by
  class name.
- Exceptions (documented, not violations): `#25D366` (WhatsApp brand green),
  status amber/indigo tints (`#b45309`, `#92400e`, `#4f46e5` with alpha
  backgrounds), `#fff` for pure-white text on dark/accent surfaces, printed
  invoice HTML in `venezuela.ts`, third-party watermark styles in `main.tsx`.

## 3. Surface Rules

- **Marketing landing + auth = luxe dark**, scoped to `.luxe-landing`.
  Landing (`LandingPage`), auth (`AuthPage`), the approval gate
  (`PendingApproval`, both steps: country select + approval wait), and the
  first-run country gate (`CountrySetupModal`) are luxe dark (decisions
  2026-10-16, see Open Questions). They MUST use only luxe classes/tokens
  and MUST NOT reference light-theme vars. `CountrySetupModal` renders as an
  overlay above the light dashboard, so its dark styling lives on the
  modal's own classes (`luxe-glass` card, dark option rows/buttons) instead
  of a `.luxe-landing` wrapper — nothing leaks into the dashboard beneath.
- **Dashboard app = current light theme, unchanged.** `Shell` plus all views
  in `src/components/dashboard/` (`OrdersView`, `CatalogView`, `CustomersView`,
  `ChargesView`, `SettingsView`), in-dashboard dialogs (`SendFundsDialog`,
  delete-confirm modal), and all loading/error/empty states use the light
  theme vars. Do NOT introduce `.luxe-*` classes or dark backgrounds there.
- **Buyer payment links (`PaymentPage`, `PayWithWallet`) = luxe dark**,
  scoped to `.luxe-landing` (decision 2026-10-16, see Open Questions).
  They MUST use only luxe classes/tokens and MUST NOT reference
  light-theme vars.
- No dark/luxe styling may leak outside `.luxe-landing` into the light
  dashboard, and no light-theme overrides may leak into `.luxe-landing`.

## 4. Usage Rules

- `.luxe-glass` — frosted dark card for hero content inside `.luxe-landing`
  (e.g. the LandingPage access-request card, the AuthPage form card,
  the PaymentPage charge card and invalid-link/paid receipts, the
  PendingApproval card) and for the self-scoped `CountrySetupModal` card.
- `.luxe-glass-pill` — frosted dark pill for floating banners inside
  `.luxe-landing` (e.g. the terms/cookie banner). Pill shape comes from
  `rounded-full` at the use site.
- `.passport-stamp` — dashed-border stamp label for region/status chips inside
  `.luxe-landing` (e.g. ARGENTINA / LIVE badges). Letter-spacing and uppercase
  are part of the utility.
- `.platinum-glow` — soft white/cyan outer glow for emphasised dark cards
  (pairs with `.luxe-glass` on the showcase card).
- `.luxe-dotgrid` — subtle dot pattern overlay for ambient dark backgrounds
  (LandingPage fixed background layer). Only valid inside `.luxe-landing`.
- `.treazury-strip` — 3px rainbow top divider for cards/dialogs
  (light-theme dashboard cards, `SendFundsDialog`, charge cards, AND the
  luxe-dark PaymentPage charge/paid cards). Replaces all inline
  `linear-gradient(90deg,#6366f1,…)` strip definitions.
- Range-slider styling is owned by `src/index.css` under the
  `.luxe-landing input[type='range']` scope (webkit + moz track/thumb). No other
  file may define slider styles. No landing surface currently renders a
  slider (the fee calculator was removed 2026-10-16); a future slider must
  reuse this scope.
- Fonts: use Tailwind classes (`font-sans`, `font-serif`, `font-mono`) so the
  resolved family always follows `tailwind.config.js`. Legacy `.display`
  (Space Grotesk) and `.mono` (JetBrains Mono) helpers in `index.css` are
  grandfathered for existing light-theme components (see Open Questions).

## 5. Open Questions (product decisions — do NOT implement unilaterally)

1. **Payment-link theme: DECIDED 2026-10-16 → luxe dark.** `PaymentPage` +
   `PayWithWallet` are luxe dark, scoped to `.luxe-landing`.
2. **AuthPage light vs. luxe dark: DECIDED 2026-10-16 → luxe dark.**
   `AuthPage` is luxe dark, scoped to `.luxe-landing`.
3. **Auth gates light vs. luxe dark: DECIDED 2026-10-16 → luxe dark.**
   `PendingApproval` (country select + approval wait, scoped to
   `.luxe-landing`) and `CountrySetupModal` (self-scoped dark modal over
   the light dashboard) are luxe dark. `SendFundsDialog` and the
   delete-confirm modal stay light — they are in-dashboard flows.
4. **UI copy language: DECIDED 2026-10-16 → Spanish everywhere.**
   All user-facing strings are rioplatense Spanish, including the landing
   page (see §0). Code, comments and identifiers stay in English.
3. **Body/legacy fonts.** `body` uses DM Sans and `.display`/`.mono` use
   Space Grotesk / JetBrains Mono, while tokens say Plus Jakarta Sans /
   Cormorant Garamond / Space Grotesk. Switching the dashboard to token fonts
   is a visible restyle — needs a decision.
