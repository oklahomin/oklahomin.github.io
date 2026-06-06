---
name: Oklahomin Retro-Futurism
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1b1b1e'
  surface-container: '#1f1f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e4e1e6'
  on-surface-variant: '#cfc2d6'
  inverse-surface: '#e4e1e6'
  inverse-on-surface: '#303033'
  outline: '#988d9f'
  outline-variant: '#4d4354'
  surface-tint: '#ddb7ff'
  primary: '#ddb7ff'
  on-primary: '#490080'
  primary-container: '#b76dff'
  on-primary-container: '#400071'
  inverse-primary: '#842bd2'
  secondary: '#c3c0ff'
  on-secondary: '#272377'
  secondary-container: '#3e3c8f'
  on-secondary-container: '#afadff'
  tertiary: '#c4c1fb'
  on-tertiary: '#2d2a5b'
  tertiary-container: '#8e8bc2'
  on-tertiary-container: '#262354'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f0dbff'
  primary-fixed-dim: '#ddb7ff'
  on-primary-fixed: '#2c0051'
  on-primary-fixed-variant: '#6900b3'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#100563'
  on-secondary-fixed-variant: '#3e3c8f'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c4c1fb'
  on-tertiary-fixed: '#181445'
  on-tertiary-fixed-variant: '#444173'
  background: '#131316'
  on-background: '#e4e1e6'
  surface-variant: '#353438'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  body-fixed:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.15em
  data-num:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.02em
spacing:
  unit: 4px
  container-padding: 24px
  window-gap: 12px
  element-margin: 8px
  border-width-thin: 1px
  border-width-thick: 2px
---

## Brand & Style
The design system is built for a premium, cinematic game menu experience that blends 80s analog hardware aesthetics with futuristic technical precision. The brand personality is mysterious, industrial, and high-fidelity, evoking the feeling of a cold, high-tech terminal operating in deep space.

The style is a hybrid of **Technological Brutalism** and **Cyber-Noir**. It moves away from soft SaaS interfaces in favor of rigid structures, "luminous interface edges," and heavy, moody layering. The interface should feel like a physical console—weighty, tactile, and emitting a dangerous, electronic energy through deep violet luminescence.

## Colors
The palette is rooted in a "charcoal and graphite" foundation to provide a non-distracting, immersive backdrop. 

- **Base Layer:** The deepest `#0A0A0B` black-gray for maximum contrast.
- **Surface Layer:** Graphite `#1A1A1E` for windows and containers, creating a subtle distinction from the void.
- **Luminous Accents:** Deep violet and neon purple are used exclusively for interactive elements and "power-on" states. 
- **Functional Glow:** High-value lavender (`#D8B4FE`) is reserved for critical data points and active cursor focuses to ensure legibility against the dark void.

## Typography
The typography strategy utilizes technical sans-serifs for headers to maintain a modern "futuristic" edge, while utilizing monospaced fonts for all functional data and body text to reinforce the terminal aesthetic.

- **Display:** Large, tight-kerning Space Grotesk for section titles.
- **Interface Text:** JetBrains Mono for all body content to ensure perfect alignment in technical lists.
- **Labels:** Space Mono in all-caps for "system tags" and "metadata" (e.g., [LATENCY: 24MS]).
- **Mobile Scaling:** Headlines scale down by 20% on mobile, but monospaced data maintains its size to preserve legibility in dense technical layouts.

## Layout & Spacing
The layout follows a **Rigid Grid** model, resembling an industrial control panel. Every element is aligned to a 4px baseline grid.

- **Compact Windows:** Content is organized into modular "sub-containers" rather than a single flowing page. These windows use tight internal padding (12px–16px) to feel dense and data-rich.
- **Safe Areas:** A 48px global margin creates a "letterboxed" cinematic feel on desktop.
- **Gutters:** Small 12px gaps between windows to allow "ambient glow" from the background to seep through the cracks.
- **Responsive:** On mobile, windows stack vertically and expand to full-width, removing the cinematic margins to maximize touch targets for monospaced buttons.

## Elevation & Depth
This design system rejects shadows in favor of **Luminous Edges** and **Tonal Layering**.

- **Level 0 (Background):** Solid `#0A0A0B`.
- **Level 1 (Window):** `#1A1A1E` with a 1px solid border of `#312E81` (Deep Indigo).
- **Active State (Glow):** Interactive elements do not rise "closer" to the user; instead, they "power up." This is achieved via an inner glow (box-shadow: inset) and an outer 2px border of `#A855F7`.
- **Luminous Edges:** A subtle, 1px top-highlight on windows using a 30% opacity Violet creates the illusion of an overhead technical light source.

## Shapes
The shape language is strictly **Sharp (0px)**. All containers, buttons, and inputs must have hard 90-degree corners to maintain the brutalist, military-hardware aesthetic. 

Small decorative "corner notches" (45-degree angled cuts) are permitted for primary action buttons to distinguish them from standard data containers.

## Components

- **Buttons:** Sharp-edged boxes with a "Ghost" default state (1px Indigo border). On hover/focus, the background fills with a Deep Indigo gradient and the border switches to Luminous Violet with a 5px outer blur.
- **Lists:** Technical rows separated by 1px dimmed lines. The selected item is indicated by a vertical "power bar" (2px wide) on the left edge in bright Violet.
- **Input Fields:** Darker than the container (`#000000`). Text is always monospaced. The cursor is a solid, blinking Violet block.
- **Chips / Tags:** Small, monospaced labels enclosed in brackets: `[ ACTIVE ]`. No background color, just dimmed text.
- **Compact Windows:** Feature a "Header Bar" with a pixel-thin horizontal line and small technical metadata (e.g., `SYS_VER // 1.0.4`) in the top-right corner.
- **Ambient Glows:** Use large, low-opacity (10-15%) purple radial gradients placed behind the main "Compact Windows" to create atmospheric depth without sacrificing text clarity.