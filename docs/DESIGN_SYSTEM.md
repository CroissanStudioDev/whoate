# WhoAte Design System

> Version 1.0 | March 2026

## Overview

WhoAte uses a modern, friendly design system optimized for mobile-first bill splitting.

**Design Principles:**
- **Flat Design** with subtle depth via shadows
- **Micro-interactions** for engagement
- **High contrast** for accessibility (WCAG AA+)
- **Mobile-first** responsive approach

---

## Typography

### Font Family

**Plus Jakarta Sans** — A friendly, modern sans-serif perfect for SaaS applications.

```css
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
```

### Font Weights

| Weight | Use Case |
|--------|----------|
| 300 (Light) | Large display text |
| 400 (Regular) | Body text |
| 500 (Medium) | Emphasis, labels |
| 600 (Semibold) | Headings, buttons |
| 700 (Bold) | Hero text, important callouts |

### Scale

| Class | Size | Use |
|-------|------|-----|
| `text-xs` | 12px | Captions, metadata |
| `text-sm` | 14px | Secondary text |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Lead paragraphs |
| `text-xl` | 20px | Card titles |
| `text-2xl` | 24px | Section headings |
| `text-4xl` | 36px | Hero headings |

---

## Color Palette

### Light Mode

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| Primary | `#2563EB` | `blue-600` | Buttons, links, focus |
| Primary Foreground | `#FFFFFF` | `white` | Text on primary |
| Secondary | `#EFF6FF` | `blue-50` | Secondary buttons, badges |
| Accent | `#FFF1F2` | `rose-50` | Highlights, notifications |
| Background | `#F8FAFC` | `slate-50` | Page background |
| Card | `#FFFFFF` | `white` | Card backgrounds |
| Border | `#E2E8F0` | `slate-200` | Borders, dividers |
| Text | `#1E293B` | `slate-800` | Primary text |
| Muted Text | `#64748B` | `slate-500` | Secondary text |
| Destructive | `#EF4444` | `red-500` | Errors, delete actions |

### Dark Mode

| Token | Hex | Tailwind | Use |
|-------|-----|----------|-----|
| Primary | `#3B82F6` | `blue-500` | Brighter for dark bg |
| Background | `#0F172A` | `slate-900` | Page background |
| Card | `#1E293B` | `slate-800` | Card backgrounds |
| Border | `#334155` | `slate-700` | Borders |
| Text | `#F8FAFC` | `slate-50` | Primary text |
| Muted Text | `#94A3B8` | `slate-400` | Secondary text |

### Semantic Colors

| State | Light | Dark | Use |
|-------|-------|------|-----|
| Success | `#059669` | `#34D399` | Confirmations |
| Warning | `#D97706` | `#FBBF24` | Cautions |
| Error | `#DC2626` | `#F87171` | Errors |
| Info | `#2563EB` | `#60A5FA` | Information |

### Chart Colors

```css
--chart-1: #2563EB; /* Blue - Primary data */
--chart-2: #10B981; /* Emerald - Positive */
--chart-3: #F59E0B; /* Amber - Warning/Highlight */
--chart-4: #8B5CF6; /* Violet - Secondary data */
--chart-5: #F43F5E; /* Rose - Accent/Alert */
```

---

## Spacing

Using Tailwind's default scale:

| Class | Size | Use |
|-------|------|-----|
| `gap-1` | 4px | Tight grouping |
| `gap-2` | 8px | Related elements |
| `gap-3` | 12px | Card padding (mobile) |
| `gap-4` | 16px | Standard spacing |
| `gap-6` | 24px | Section spacing |
| `gap-8` | 32px | Large sections |

---

## Border Radius

| Token | Size | Use |
|-------|------|-----|
| `rounded-md` | 6px | Inputs, small buttons |
| `rounded-lg` | 8px | Buttons, badges |
| `rounded-xl` | 12px | Cards |
| `rounded-2xl` | 16px | Large cards, modals |
| `rounded-full` | 50% | Avatars, pills |

---

## Shadows

```css
/* Subtle card shadow */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Default card shadow */
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

/* Elevated/hover shadow */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

---

## Animations & Transitions

### Timing Functions

| Easing | Use |
|--------|-----|
| `ease-out` | Elements entering (modals, tooltips) |
| `ease-in` | Elements exiting |
| `ease-in-out` | Hover states, toggles |

### Durations

| Duration | Use |
|----------|-----|
| `150ms` | Micro-interactions (hover, active) |
| `200ms` | Standard transitions |
| `300ms` | Larger animations (modals) |

### Custom Classes

```css
/* Interactive card hover */
.card-interactive {
  @apply transition-all duration-200 ease-out cursor-pointer;
  @apply hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5;
}

/* Button press effect */
.btn-bounce {
  @apply transition-transform duration-150 ease-out;
  @apply active:scale-95;
}
```

### Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Components

### Buttons

| Variant | Use |
|---------|-----|
| Primary | Main actions (Create, Submit) |
| Secondary | Alternative actions |
| Outline | Cancel, Back |
| Ghost | Tertiary actions, links |
| Destructive | Delete, dangerous actions |

```tsx
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
```

### Cards

```tsx
<Card className="card-interactive">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Inputs

```tsx
<Input
  className="h-12 text-base"
  placeholder="Placeholder text"
/>
```

---

## Icons

Using **Lucide React** icons.

| Size | Class | Use |
|------|-------|-----|
| Small | `w-4 h-4` | Inline with text |
| Default | `w-5 h-5` | Buttons, list items |
| Large | `w-6 h-6` | Feature highlights |
| XL | `w-8 h-8` | Hero icons |

**Do:**
- Use consistent sizing within a context
- Match icon color to text color
- Add `aria-hidden="true"` for decorative icons

**Don't:**
- Use emojis as icons
- Mix icon libraries
- Use icons without labels for primary actions

---

## Accessibility

### Contrast Ratios

| Element | Minimum Ratio |
|---------|---------------|
| Body text | 4.5:1 |
| Large text (18px+) | 3:1 |
| UI components | 3:1 |

### Focus States

All interactive elements have visible focus:

```css
:focus-visible {
  @apply outline-2 outline-offset-2 outline-ring;
}
```

### Screen Readers

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Add `aria-label` for icon-only buttons
- Use `sr-only` class for screen reader text

---

## Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| Default | 0px | Mobile phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

**Mobile-first approach:** Start with mobile styles, add complexity at larger breakpoints.

```tsx
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    Responsive Heading
  </h1>
</div>
```

---

## File Structure

```
app/
├── globals.css          # Design tokens, base styles
├── layout.tsx           # Font loading, metadata
└── page.tsx             # Landing page

components/
└── ui/                  # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    └── ...
```

---

## Resources

- [Plus Jakarta Sans on Google Fonts](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
- [Lucide Icons](https://lucide.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
