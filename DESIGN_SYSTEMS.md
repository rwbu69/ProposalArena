# Proposal Arena Design System — Academic Editorial Direction

## Core Philosophy
ProposalArena is an academic thesis proposal defense simulator. The interface is designed to feel like a quiet examination hall or a well-typeset academic publication: serious, confident, restrained, and free of decoration.

Every element on screen must serve the student's preparation and focus. Do not add decorative cards, illustrations, icons, shadows, glowing badges, or marketing copy.

---

## 1. Color Palette

The interface uses a warm, paper-inspired palette with high text contrast and a single, restrained accent color.

### Foundation
- **Paper Background (`paper`):** `#FBFBF9` (Light) / `#141413` (Dark).
- **Secondary Surface (`paper-surface`):** `#F4F3EE` (Light) / `#1B1B19` (Dark).
- **Ink Primary (`ink`):** `#181816` (Light) / `#ECEBE6` (Dark).
- **Ink Muted (`ink-muted`):** `#5A5955` (Light) / `#9E9C94` (Dark).
- **Ink Faint (`ink-faint`):** `#8C8A82` (Light) / `#6B6963` (Dark).
- **Hairline Divider (`hairline`):** `#E6E4DD` (Light) / `#282725` (Dark).

### Single Accent Color
- **Accent Ink (`accent`):** `#1C2B39` (Deep Academic Navy) in light mode, `#7D98B3` (Soft Slate) in dark mode.
- Used strictly for the primary action button and key state indicators. Never use random blues, purples, or greens across panels.

### Semantic Marks in Reports
- Do not use large colored card panels.
- Strengths and growth points are distinguished typographically or with a delicate, single-color text indicator or subtle bullet marker.

---

## 2. Typography

We establish typographic hierarchy through font pairing, scale, and whitespace, not box containers.

- **Headings & Document Text (`font-serif`):** `Lora`, serif. Used for page titles, section headers, and the formal text of the proposal. Normal to medium weights (400–500), never heavy or extra-bold.
- **Interface & Chat Text (`font-sans`):** `Inter` or clean system sans-serif. Used for transcript dialogue, buttons, and form controls for crisp readability.
- **Metadata & Indicators (`font-mono`):** `ui-monospace, monospace`. Used for status indicators, timestamps, and language codes.

### Typographic Hierarchy
- **Page Titles:** `text-2xl sm:text-3xl font-serif font-normal tracking-tight`
- **Section Titles:** `text-lg sm:text-xl font-serif font-normal`
- **Body & Dialogue:** `text-sm sm:text-base font-sans font-normal leading-relaxed`
- **Labels & Status:** `text-xs font-mono tracking-wider uppercase text-ink-muted`

---

## 3. Structural Rules & Layout

1. **Whitespace over Boxes:** Remove unnecessary card containers. Divide distinct regions with whitespace and 1px hairline dividers (`border-hairline`).
2. **Left-Alignment:** Left-align headlines, forms, and transcripts. Avoid centering content unless functionally required.
3. **No Drop Shadows:** Resting cards, dialogs, and panels must have `shadow-none`.
4. **Modest Corners:** Use `rounded-none` or `rounded-xs` (1–2px). No large rounded corners (`rounded-xl` or `rounded-2xl`).
5. **Icon Restraint:** Icons are functional tools (e.g. Mute, Settings gear), not illustrations next to text headings.

---

## 4. Voice, Copy & Motion

- **Plain Copy:** Cut marketing jargon and hyperbole. Write plainly, as an academic examiner or faculty administrator would.
- **Quiet Transitions:** Limit motion to brief functional opacity fades (150ms–200ms).
- **No Pulsing or Bouncing:** Except for a calm recording dot while the microphone is open, elements do not bounce, pulse, or scale.
