# SkyID design system

SkyID is a camera-first aviation utility. The camera is the canvas; interface chrome stays quiet, compact, and spatial.

## Direction

- Visual language: iOS utility with restrained Liquid Glass surfaces
- Signature detail: a tracked aircraft marker connected to its live information card
- Typography: Apple system stack (`-apple-system`, `BlinkMacSystemFont`, `SF Pro` fallbacks)
- Spacing: 4, 8, 12, 16, 24, 32px
- Touch targets: 44px minimum
- Motion: short spring-like movement only where it explains tracking or sheet state

## Color tokens

- Camera fallback: `#66788A`
- Glass: `rgba(13, 22, 31, 0.54)`
- Glass strong: `rgba(9, 16, 24, 0.72)`
- Primary text: `#F7FAFC`
- Secondary text: `rgba(247, 250, 252, 0.68)`
- Accent: `#8BC7FF`
- Live: `#6EE7A8`
- Warning: `#FFD37A`
- Danger: `#FF8E8E`
- Hairline: `rgba(255, 255, 255, 0.18)`

## Rules

- No gradients, neon glow, giant type, emoji icons, or dashboard chrome.
- One primary glass card at a time; secondary controls remain compact.
- Missing live data is labeled unavailable, never inferred.
- Demo traffic is always identified as DEMO.
- Respect safe areas, reduced motion, keyboard focus, and 200% text zoom.
