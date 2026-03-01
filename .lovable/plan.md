

# Phased Development Plan

This is a large request. I'll break it into three clear phases, with **Phase 1 (Current)** being implemented now.

---

## Phase 1 (Current) - Product Details, Ordering Options, CSS Modernization, Day Streak Fix, Search Enhancement

### 1. Product Detail Modal with Ordering Options
**New file: `src/components/business/ProductDetailModal.tsx`**

When a product card is clicked, show a modal with:
- Full product image, name, description, price
- Two action buttons: **"Direct to Vendor"** (opens WhatsApp/call to the business) and **"Order via Dropee"** (opens existing DropeeOrderModal)

**Modify: `src/components/business/ProductsSection.tsx`**
- Add click handler on product cards to open the detail modal
- Pass business contact info (phone/whatsapp) as props for the "Direct to Vendor" option

**Modify: `src/pages/BusinessDetail.tsx`**
- Pass business phone/whatsapp to ProductsSection
- Wire up ProductDetailModal with both ordering paths

### 2. Booking/Reservation with Direct or Dropee Option
**Modify: `src/components/business/BookingSection.tsx`**
- Add two submit buttons: "Book Direct" (contacts vendor via WhatsApp/call with booking details) and "Book via Dropee" (submits through DropeeOrderModal)
- Pass business contact props through from BusinessDetail

### 3. Fix Day Streak Logic
**Modify: `src/pages/Profile.tsx`**
- The current streak logic looks correct but runs on every render since it lacks proper guarding. Add a ref guard to prevent double-execution in React strict mode
- Ensure streak only updates once per session using a `useRef` flag

### 4. Modern Minimalistic CSS Update
**Modify: `src/index.css`**
- Update the color palette to a cleaner, more modern look:
  - Softer backgrounds, refined card shadows
  - Primary color shifted to a modern blue-green or clean blue
  - Better spacing and typography defaults
  - Subtle border radius increase for a friendlier feel
- Add smooth transition defaults and modern font stack

**Modify: `src/App.css`**
- Remove legacy Vite boilerplate styles (the logo spin animation, etc.)

### 5. Enhanced Search
**Modify: `src/pages/Search.tsx`**
- Add product search (search across `products` table too)
- Add search ranking: exact name matches first, then description matches
- Add recent searches (stored in localStorage)
- Add search suggestions/categories as quick filters

**Modify: `src/pages/Index.tsx`**
- Make the homepage search bar functional (navigate to `/search` with query)

---

## Phase 2 (Future) - New User Roles & Notifications
- **Tourist Guide / Events Manager roles**: New role types in `app_role` enum, dedicated dashboards
- **Push notifications**: Service worker registration, notification permission request, backend function for sending via Web Push API
- **Realtime updates**: Chrome notification API for order status changes using existing Supabase Realtime

*Will plan in detail when Phase 1 is complete.*

---

## Phase 3 (Future) - Advanced Admin Controls
- More granular admin dashboard with analytics charts
- User management with role assignment UI
- Content moderation queue
- Site configuration panel (colors, banners, feature toggles)

*Will plan in detail when Phase 2 is complete.*

---

## Files Summary (Phase 1)

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/components/business/ProductDetailModal.tsx` | Product detail view with Direct/Dropee ordering |
| Modify | `src/components/business/ProductsSection.tsx` | Add click-to-detail on product cards |
| Modify | `src/components/business/BookingSection.tsx` | Add Direct/Dropee booking options |
| Modify | `src/pages/BusinessDetail.tsx` | Wire up new modals, pass contact info |
| Modify | `src/pages/Profile.tsx` | Fix streak double-execution bug |
| Modify | `src/pages/Search.tsx` | Add product search, ranking, recent searches |
| Modify | `src/pages/Index.tsx` | Make search bar navigate to /search |
| Modify | `src/index.css` | Modern minimalistic color palette |
| Modify | `src/App.css` | Remove legacy Vite styles |

