---
name: Atom — Atlas HXM Product Intelligence
description: Precise internal intelligence dashboard for product and engineering teams
colors:
  page-bg: "#f9fafb"
  surface: "#ffffff"
  border: "#e5e7eb"
  divider: "#f3f4f6"
  section-bg: "#f9fafb"
  ink-primary: "#111827"
  ink-secondary: "#6b7280"
  ink-muted: "#9ca3af"
  ink-brand: "#111827"
  p1-surface: "#fef2f2"
  p1-border: "#fecaca"
  p1-text: "#b91c1c"
  p1-accent: "#ef4444"
  p2-surface: "#fffbeb"
  p2-border: "#fde68a"
  p2-text: "#b45309"
  p2-accent: "#f59e0b"
  p3-surface: "#ffffff"
  p3-border: "#e5e7eb"
  p3-text: "#374151"
  green-surface: "#f0fdf4"
  green-text: "#15803d"
  blue-surface: "#eff6ff"
  blue-text: "#1d4ed8"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.01em"
  score:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1
rounded:
  badge: "4px"
  card-inner: "6px"
  card: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  badge-p1:
    backgroundColor: "{colors.p1-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  badge-p2:
    backgroundColor: "{colors.p2-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  badge-label:
    backgroundColor: "{colors.divider}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.badge}"
    padding: "2px 8px"
  nav-active:
    backgroundColor: "{colors.ink-brand}"
    textColor: "#ffffff"
    rounded: "{rounded.badge}"
    padding: "6px 12px"
---

# Design System: Atom

## 1. Overview

**Creative North Star: "The Analyst's Notebook"**

Atom is built for speed of comprehension, not impressiveness. The interface should feel like reading a well-formatted internal report: dense but structured, with hierarchy you can scan in under five seconds. Every element answers one question: "does this help the reader act faster?"

The system is restrained to a fault today. Gray-50 backgrounds, white cards, gray-200 borders. The risk is not that it's too loud. It's that it's too quiet. A tool called "intelligence layer" needs to feel like it has opinions. The urgency system (P1/P2/P3) is the one place the interface commits to color. Everything else recedes appropriately.

What this system should explicitly reject: the soft editorial roundness of Notion, the dark monitoring-tool heaviness of Datadog, the scaffold-looking admin-panel gray of Retool, and the gradient-accent hero-metric template of SaaS dashboards.

**Key Characteristics:**
- Surface-flat architecture: white cards on gray-50, no decorative shadows
- Urgency-first: P1/P2/P3 expressed through color AND layout position, not color alone
- Dense but legible: text-sm body, text-xs labels, well-controlled line heights
- Brand is typographic: the only "logo" is the ATOM monospace pill in black
- Scores are structural: font-black numerals carry weight without chrome

## 2. Colors

A restrained palette: tinted-gray surfaces with one situational accent per urgency tier.

### Primary
- **Instruction Black** (`#111827`): Navigation active state, brand pill, dark action blocks, recommended-action rows. The heaviest ink in the system — used for emphasis that matters.

### Neutral
- **Page Canvas** (`#f9fafb`): The body background. Barely off-white; prevents visual fatigue on long sessions.
- **Card Surface** (`#ffffff`): Card and panel backgrounds. Deliberate contrast against the canvas.
- **Boundary Gray** (`#e5e7eb`): Borders between cards, horizontal rules, nav dividers.
- **Hairline Gray** (`#f3f4f6`): Inter-row dividers inside tables and card lists.
- **Primary Text** (`#111827`): Main readable content.
- **Secondary Text** (`#6b7280`): Supporting labels, meta information.
- **Muted Text** (`#9ca3af`): Timestamps, tertiary labels, ghost separators. **CAUTION: fails WCAG AA at text-xs on white — do not use below 14px for meaningful content.**

### Urgency Tiers (situational — used only for urgency signaling)
- **P1 Red** (`#ef4444` accent, `#fef2f2` surface): Critical signals. Red accent is the highest-information color in the system; use nowhere else.
- **P2 Amber** (`#f59e0b` accent, `#fffbeb` surface): Watch-list signals.
- **P3 Neutral** (`#e5e7eb` border, `#ffffff` surface): Low-urgency context.

### Named Rules
**The Signal Color Rule.** Red and amber are reserved for urgency. Never use red or amber as decoration, branding, or progress color. A user who sees red should know something needs action — not that we're celebrating a milestone.

**The Muted Text Minimum.** `ink-muted` (`#9ca3af`) may only be used at 14px or above, or for purely decorative separators. Never for meaningful labels at 12px.

## 3. Typography

**Body Font:** System UI stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
**Mono Font:** Native monospace stack (for ATOM pill, code fragments, event names)

**Character:** Neutral and fast. No typographic personality today — the system font stack reads as "functional tool" rather than "designed product." This is a gap, not a feature. The right direction is a single well-chosen geometric sans (Inter, DM Sans, or Geist) that brings precision without the softness of system defaults.

### Hierarchy
- **Display** (700, 30px, 1.2): Weekly Brief headline only. The single biggest typographic moment.
- **Headline** (600, 20px, 1.4): Page-level H1s (Competitive Intelligence, RICE Backlog).
- **Title** (600, 14px, 1.5): Section labels, card headers, table column headers.
- **Body** (400, 14px, 1.6): PR titles, signal descriptions, detail text. Cap at 65ch in single-column contexts.
- **Label** (500, 12px, 1.5, +0.01em): Badges, meta tags, timestamps. Avoid for meaningful content on low-contrast backgrounds.
- **Score** (900, 24px, 1.0): RICE numeric scores. font-black is correct; the weight IS the information.
- **Mono** (400, 12px): Event names as code pills, PR numbers, the ATOM brand pill.

### Named Rules
**The One Scale Rule.** Do not introduce new font sizes. The six steps above cover every current use. Text that doesn't fit into these levels is a layout problem, not a typography problem.

## 4. Elevation

Atom is nearly flat. Depth comes from background contrast (gray-50 vs white) and border presence, not shadow depth.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` — Tailwind `shadow-sm`): Applied to main cards and table containers. Subtle — lifts the surface just enough to distinguish it from page canvas.
- **Flat** (no shadow): Section sub-panels, chips, badges, nav items.

### Named Rules
**The Flat-By-Default Rule.** Shadows appear only on the outermost card container, never on elements inside a card. No nested shadows. A row inside a card is never itself shadowed.

## 5. Components

### Navigation
Clean top bar with sticky positioning. Active tab: Instruction Black background, white text, 4px radius. Inactive: gray-500, hover gray-900/gray-100 tint, matching radius. The ATOM mono pill is the only brand element. SyncButton is a secondary action, always right-aligned.

### Urgency Badges (P1/P2/P3)
- **P1:** `#ef4444` fill, white text, 4px radius, 2px 6px padding. Bold weight.
- **P2:** `#f59e0b` fill, white text, same shape.
- **P3:** `#e5e7eb` fill, `#4b5563` text. Lower contrast intentionally.
- Always paired with section-level layout: P1 signals appear before P2, P2 before P3.

### Signal Cards (PRCard)
Rounded-lg cards with shadow-sm. Currently use `border-l-4` left-stripe for urgency — **this is the primary anti-pattern in the system** and should be replaced. P1 urgency should be communicated via section position, badge, and surface color (red-50 background), not a side stripe.

### Section Panels
Rounded-xl containers with white or gray-50 backgrounds. Header row: px-5 py-3 with gray-50 bg and border-b. Body: divide-y with hairline dividers. This pattern is used consistently across Compete, Cycles, and Brief.

### RICE Score Display
font-black numeral, color-coded by threshold tier, with a label below at text-xs. This is the most distinctive component in the system — weight-as-information. Preserve and extend this pattern to other numeric signals.

### Status Badges (inline labels)
Rounded-4px chips: `bg-{color}-100 text-{color}-700`. Used for status (shipped, active, in-review), outcome type (retention, revenue), type tags. Consistent padding: px-2 py-0.5. The variety of hues (blue, green, amber, red, teal, indigo, purple, violet) is broader than needed — most use cases need only 4-5 distinct roles.

### Code Pills
`<code>` elements with `bg-red-100 text-red-800` or `bg-gray-100 text-gray-800` and mono font. Used for event names and PR numbers. Good pattern.

## 6. Do's and Don'ts

### Do:
- **Do** use font-black (weight 900) for any numeric score or metric that is the primary signal in a cell. Weight IS the information density.
- **Do** express urgency through layout order AND color. P1 sections must precede P2 sections; color alone is insufficient.
- **Do** use gray-50 (`#f9fafb`) for section header backgrounds and white for card bodies. The two-step contrast creates readable visual hierarchy without decoration.
- **Do** use `rounded-xl` (12px) for all outermost card containers. `rounded-lg` (8px) for inner elements. `rounded` (4px) for badges. Never mix these for the same element type.
- **Do** use `shadow-sm` on outermost cards only. No shadow on elements inside cards.
- **Do** keep `ink-muted` (`#9ca3af`) to 14px minimum for any meaningful label. Use `ink-secondary` (`#6b7280`) for 12px content.
- **Do** use monospace font for event names, PR identifiers, and the ATOM brand pill. Mono is reserved for machine-readable identifiers, not general labels.

### Don't:
- **Don't** use `border-l-4` or any thick left/right side-stripe as a colored accent. This is the #1 AI-generated UI tell and is explicitly banned. Rewrite with full borders, background tints, or badge + section structure.
- **Don't** make Atom look like Notion (soft editorial roundness, large pastel backgrounds, generous whitespace padding that makes it feel like a notes app).
- **Don't** make Atom look like Datadog (dark-mode-as-default, neon severity colors, monitoring-tool heaviness).
- **Don't** make Atom look like a Retool admin panel (default table-heavy gray chrome, scaffolded feel).
- **Don't** use gradient text (`background-clip: text`). Ever. Signal information with weight or color, not gradients.
- **Don't** use red or amber for anything other than urgency signaling. A completion percentage that happens to be high should never be green if it means "good" — use plain ink.
- **Don't** add shadows inside cards (shadow on a row, shadow on a badge). Flat-by-default inside containers.
- **Don't** use `ink-muted` (`#9ca3af`) for meaningful text at 12px — it fails WCAG AA contrast (~2.4:1 on white).
- **Don't** rely on color alone for P1/P2/P3 distinction. A colorblind user reading the Signals page must still be able to determine urgency from layout position and label text.
