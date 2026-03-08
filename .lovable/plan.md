

# Premium Redesign: "100M Project" Visual Overhaul

This plan transforms the entire UI from a basic card-based layout into a polished, world-class design with premium typography, refined color system, glass-morphism effects, smooth animations, and elevated component design.

---

## 1. Design System Overhaul (`src/index.css`)

Completely rewrite the color palette and add premium utility classes:

- **New palette**: Shift to a deeper, more sophisticated tone -- slate-based neutrals, a vibrant indigo primary, warm amber accent
- **Glass-morphism utilities**: `.glass` class with backdrop-blur and translucent backgrounds
- **Gradient utilities**: `.gradient-primary`, `.gradient-hero` for hero sections
- **Smooth animations**: `@keyframes fadeIn`, `slideUp`, `scaleIn` with utility classes
- **Premium shadows**: Multi-layered shadow system (`shadow-premium`, `shadow-elevated`)
- **Typography**: Inter font import, tighter letter-spacing on headings, larger base sizes
- **Dark mode**: Richer dark palette with subtle blue undertones

## 2. Premium Homepage (`src/pages/Index.tsx`)

Complete redesign:

- **Hero section**: Full-width gradient banner with large typography "Discover the Heart of Ukhrul" and a floating glass-morphism search bar
- **Quick actions**: Redesigned as large rounded pills with subtle gradients and icons, horizontally scrollable
- **Section headers**: Larger, bolder with decorative underline accent
- **Business cards**: Displayed in a horizontal scroll carousel for featured, grid for regular
- **Places section**: Full-bleed image cards with overlay text (like Airbnb's style)
- **Events section**: Timeline-style vertical layout with date pills
- **Promotional banner**: Full-width with gradient overlay
- **Spacing**: Much more generous whitespace between sections

## 3. Elevated Card Components

### `src/components/BusinessCard.tsx`
- Larger image ratio (16:10 instead of current cramped height)
- Subtle gradient overlay on images
- Animated heart button with scale effect
- Premium shadow on hover with slight lift (`translate-y`)
- Rating displayed as gold stars
- Category shown as colored pill badge

### `src/components/PlaceCard.tsx`
- Full image coverage with text overlay at bottom (gradient fade)
- Glassmorphism info bar at bottom of image
- Parallax-like hover zoom effect

### `src/components/EventCard.tsx`
- Date displayed in a bold accent-colored circle/pill
- Horizontal card layout with image on left, content right
- Subtle left border accent line

## 4. Premium Bottom Navigation (`src/components/BottomNav.tsx`)
- Glass-morphism background with backdrop-blur
- Active indicator: small dot under active icon instead of color change
- Slightly rounded top corners
- Animated icon transitions (scale on tap)
- Remove notification bell from nav (move to header)

## 5. Premium Location Banner (`src/components/LocationBanner.tsx`)
- Minimal: single line with subtle background, no border
- Small location pin icon + area name + chevron, left-aligned
- Glass-morphism style

## 6. Upgraded Hamburger Menu (`src/components/HamburgerMenu.tsx`)
- Avatar section with gradient background header
- Menu items with subtle hover animations
- Role badges next to role-specific items
- Rounded corners on items with spacing

## 7. Auth Page (`src/pages/Auth.tsx`)
- Split layout on desktop (left: branded illustration/gradient, right: form)
- On mobile: gradient header with logo, white form card below
- Subtle floating animation on logo

## 8. Businesses Listing (`src/pages/Businesses.tsx`)
- Category pills with icons and counts
- Masonry-like grid for varied card sizes
- Sticky search bar with glass-morphism

## 9. Profile Page (`src/pages/Profile.tsx`)
- Gradient header with avatar overlap
- Stats row (streak, points, reviews) in glass cards
- Menu items as rounded cards with icons

## 10. Global Styles (`src/App.css`)
- Scroll behavior smooth
- Custom scrollbar styling
- Selection color matching primary

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Rewrite | `src/index.css` | New premium design system with glass, gradients, animations |
| Rewrite | `src/App.css` | Global premium styles, scrollbar, selection |
| Rewrite | `src/pages/Index.tsx` | Premium hero, carousel sections, elevated layout |
| Rewrite | `src/components/BusinessCard.tsx` | Elevated card with hover lift, better image ratio |
| Rewrite | `src/components/PlaceCard.tsx` | Full-bleed overlay style cards |
| Rewrite | `src/components/EventCard.tsx` | Timeline-style with accent date pill |
| Rewrite | `src/components/BottomNav.tsx` | Glass-morphism nav with dot indicator |
| Rewrite | `src/components/LocationBanner.tsx` | Minimal glass banner |
| Rewrite | `src/components/HamburgerMenu.tsx` | Premium slide-out with gradient header |
| Modify | `src/pages/Auth.tsx` | Split layout, gradient branding |
| Modify | `src/pages/Businesses.tsx` | Premium listing with sticky glass search |
| Modify | `src/pages/Profile.tsx` | Gradient header, glass stat cards |
| Modify | `src/components/PromotionalBanner.tsx` | Full-width gradient banner style |

