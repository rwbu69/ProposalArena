# Proposal Arena Design System

This document outlines the core design language, component structures, and styling conventions for **Proposal Arena**. Our goal is to maintain a sleek, academic, yet modern interface that feels highly responsive and premium, without bogging developers down in rigid rules. 

Use this guide to ensure new features seamlessly blend into the existing UI, while feeling free to innovate where it makes sense!

---

## Color Palette

We utilize Tailwind CSS defaults, heavily favoring the **Slate** and **Blue** spectrums to create a clean, trustworthy, and academic atmosphere.

### Foundation
- **Backgrounds:** `bg-slate-50` (Primary app background) and `bg-white` (Cards, panels, modules).
- **Text:** `text-slate-900` (Main Headings), `text-slate-800` (Body Text), `text-slate-500` (Subtitles/Muted text).
- **Borders:** `border-slate-200` (Subtle dividers) and `border-slate-300` (Inputs).

### Primary Actions
- **Buttons (Primary):** `bg-blue-600` hovering to `bg-blue-700`. Text is always `text-white`.
- **Buttons (Secondary):** `bg-slate-100` or `bg-slate-200` hovering to `bg-slate-300`. Text is `text-slate-700`.

### Semantic Highlights
Use semantic colors specifically for the **Defense Report** or state warnings:
- **Success / Strengths:** `bg-green-50`, `border-green-100`, `text-green-900`
- **Danger / Weaknesses:** `bg-red-50`, `border-red-100`, `text-red-900`
- **Warnings / Practice:** `bg-amber-50`, `border-amber-100`, `text-amber-900`
- **AI Feedback / Notes:** `bg-purple-50`, `border-purple-100`, `text-purple-900`
- **Info / Recommendations:** `bg-blue-50`, `border-blue-100`, `text-blue-900`

---

## Shapes & Elevation

Our UI relies on soft corners and subtle depth to feel approachable and modern.

- **Cards & Modals:** `rounded-xl` with `shadow-sm` and a `border border-slate-200`.
- **Buttons & Inputs:** `rounded-lg` or `rounded-xl` depending on size. 
- **Focus States:** All interactive inputs must have a focus ring: `focus:ring-2 focus:ring-blue-500 focus:outline-none`.

---

## Core Layouts

### 1. The Landing Page
- Centered, maximum width container (`max-w-7xl mx-auto`).
- Uses a grid layout for dividing sections (e.g., Settings on the left, Upload on the right).
- High impact typography for the hero section (`text-4xl sm:text-5xl font-extrabold`).

### 2. The Split Layout (Defense Arena)
- A strict 50/50 vertical split (`flex h-screen w-full`).
- **Left Pane:** Dedicated to the source material (Native PDF `<embed>` or raw text fallback).
- **Right Pane:** Dedicated to the active interaction (Chat window and controls).
- Do not let content bleed across this barrier during the active defense.

### 3. The Report View
- A standalone, full-screen scrolling view (`min-h-screen bg-slate-50 p-8`).
- Centered container (`max-w-5xl mx-auto`) to ensure comfortable reading of dense analytical text.

---

## Developer Freedom & Creativity

While the above guidelines establish the baseline, you are encouraged to push boundaries:

- **Micro-animations:** Feel free to introduce subtle transition states (e.g., `transition-all duration-200`, slight `scale-95` on clicks, or pulsing effects for recording states).
- **Empty States:** Be creative with empty states! If a list is empty or waiting for AI, use illustrations, pulsing skeleton loaders, or clever copy instead of blank space.
- **Accessibility:** If you find a color combination that improves contrast or an ARIA label that improves screen reader support, prioritize accessibility over rigid adherence to the color palette.

---

## Component Checklist

When creating a new Svelte component, ask yourself:
1. Does it use `slate` for neutral elements?
2. Are the corners appropriately rounded (`rounded-lg` or `rounded-xl`)?
3. Is it responsive? (Use Tailwind's `md:` and `lg:` breakpoints).
4. Does it handle loading/processing states gracefully?
5. Does it look premium, or does it feel like a generic prototype? (If generic, refine the padding, margins, and typography).
