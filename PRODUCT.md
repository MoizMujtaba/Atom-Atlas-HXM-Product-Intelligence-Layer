# Product

## Register

product

## Users

Product managers, pod leads, engineers, and CTO at Atlas HXM. Used daily — engineers checking cycle state and PR signals, PMs reviewing regressions and opportunities, CTO scanning the weekly brief before stand-ups. Context: internal tool, desktop-first, used in a focused work session (not glanced at on mobile).

## Product Purpose

Atom is an internal product intelligence layer. It correlates GitHub PRs, PostHog behavioral events, and Linear cycle data into actionable weekly signals — surfacing regressions, instrumentation gaps, roadmap drift, and delivery risk before they compound. Success: a PM or CTO can open Atom on Monday morning and know exactly what needs a decision today.

## Brand Personality

Precise, direct, signal-dense. Earns trust through specificity, not decoration. Every pixel should feel like it has a reason. The interface should feel like it was built by someone who actually reads the data.

## Anti-references

- **Not Notion-lite**: no soft editorial roundness, no large pastel-tinted backgrounds, no gentle spacing that makes it feel like a personal notes app
- **Not Datadog**: no dark-mode-as-default, no neon severity colors, no monitoring-tool heaviness that implies SRE rather than PM
- **Not Retool/admin-panel generic**: no default table-heavy layouts, no corporate-gray chrome, no "this was scaffolded" feel
- **Not SaaS marketing dashboard**: no hero metrics with gradient accents, no big-number cards with supporting stats, no "look at our growth"

## Design Principles

1. **Signal before chrome** — the data should arrive before the interface. Navigation, headers, and containers should recede; the actual signal (urgency, score, trend) should lead.
2. **Earn density** — this is a high-information tool. Whitespace is a choice, not a default. Use it where it improves scanning, not to pad emptiness.
3. **Urgency is structural, not cosmetic** — P1/P2/P3 priority should be expressed through layout and hierarchy, not only through color. A colorblind user should read the same urgency from position and weight.
4. **Precision over warmth** — labels, values, and copy should be specific and terse. No softening language, no round numbers, no "approximately". If the number is 2,332, show 2,332.
5. **Trustworthy, not impressive** — Atom competes with someone's intuition. The interface should feel like a reliable colleague, not a product demo.

## Accessibility & Inclusion

WCAG AA. Urgency tiers (P1/P2/P3) must not rely on color alone — weight, position, or iconography must also carry the signal. Desktop-first; mobile is not a primary use case but should not be broken.
