

# Phase 3: Admin Enhancements, Mobile Layouts, Location-Aware Content, Notifications, and Delivery API

This is a large set of changes. I'll break it into **4 sub-phases**, implementing them step by step.

---

## Sub-Phase 3A: Admin Role Access + Mobile Responsive Admin Layout

### 1. Expand Admin Access to All Roles
**Modify: `src/components/admin/AdminLayout.tsx`**
- Currently only checks for `admin` role. Update to also allow `moderator`, `business_owner`, `agent`, `tourist_guide`, `events_manager` access
- Show role-appropriate sidebar items (e.g., business owners only see their businesses, agents see delivery orders)

### 2. Mobile-Responsive Admin Layout
**Modify: `src/components/admin/AdminLayout.tsx`**
- On mobile: sidebar becomes a slide-out drawer (using Sheet component) instead of fixed sidebar
- Remove the fixed `ml-64` margin on mobile, use full-width content
- Add hamburger menu button in the header for mobile

**Modify: `src/components/admin/AdminSidebar.tsx`**
- Accept a `mobile` prop to render as overlay/sheet instead of fixed sidebar
- Close on navigation on mobile

**Modify: `src/components/admin/AdminDataTable.tsx`**
- Make tables horizontally scrollable on mobile
- Stack action buttons vertically on small screens

---

## Sub-Phase 3B: Show All Locations + Location Labels

### 3. Remove Service Area Filter, Show Location Labels
**Modify: `src/pages/Index.tsx`, `src/pages/Businesses.tsx`, `src/pages/Places.tsx`, `src/pages/Events.tsx`**
- Fetch all items regardless of service area (remove the `service_area_id` filter)
- Join `service_areas` table in queries to get the area name
- Display a location badge on each card (e.g., "Ukhrul", "Gamgjang")
- Optionally allow filtering by area as a dropdown filter (not mandatory)

**Modify: `src/components/BusinessCard.tsx`, `src/components/PlaceCard.tsx`, `src/components/EventCard.tsx`**
- Add `locationName` prop and render a small location badge/tag on each card

---

## Sub-Phase 3C: Admin Notifications + Image Upload Everywhere

### 4. Admin Send Notifications to Users
**Create: `src/pages/admin/AdminNotifications.tsx`**
- New admin page to compose and send notifications to users
- Target: all users, specific user, users with specific role
- Form: title, body, type
- Inserts into `notifications` table

**Modify: `src/components/admin/AdminSidebar.tsx`**
- Add "Notifications" menu item pointing to `/admin/notifications`

**Modify: `src/App.tsx`**
- Add route for `/admin/notifications`

### 5. Replace All Image URL Inputs with ImageUpload Component
**Modify: `src/pages/admin/AdminEvents.tsx`**
- Replace cover_image text input with `ImageUpload` component (already exists and is used in AdminBusinesses)

**Modify: `src/pages/admin/AdminPlaces.tsx`**
- Replace cover_image text input with `ImageUpload` component

**Modify: any other admin pages** still using URL text inputs for images

---

## Sub-Phase 3D: Delivery API (Edge Function)

### 6. Public Delivery API Edge Function
**Create: `supabase/functions/delivery-api/index.ts`**
- RESTful API endpoints for external delivery platforms to:
  - `GET /delivery-api?action=track&order_id=xxx` - Track a delivery order status and location
  - `POST /delivery-api` with `action=webhook_register` - Register a webhook URL to receive order status notifications
  - `GET /delivery-api?action=status&order_id=xxx` - Get order status

**Create DB migration:**
- New `api_webhooks` table to store registered webhook URLs from external platforms
- Columns: `id`, `url`, `secret`, `events` (array of event types), `active`, `created_at`

**Modify: `supabase/config.toml`**
- Add `[functions.delivery-api]` with `verify_jwt = false` (public API, uses API key auth)

**Create: `supabase/functions/notify-webhooks/index.ts`**
- Triggered by database changes (or called from delivery-api)
- Sends POST requests to registered webhook URLs when order status changes

---

## Visual Improvements
- All admin form dialogs will use consistent spacing and the ImageUpload component
- Mobile admin will use bottom sheet modals instead of centered dialogs for better UX

---

## Files Summary

| Sub-Phase | Action | File | Purpose |
|-----------|--------|------|---------|
| 3A | Modify | `src/components/admin/AdminLayout.tsx` | Multi-role access + mobile responsive |
| 3A | Modify | `src/components/admin/AdminSidebar.tsx` | Mobile drawer mode |
| 3A | Modify | `src/components/admin/AdminDataTable.tsx` | Mobile scrollable tables |
| 3B | Modify | `src/pages/Index.tsx` | Show all locations with badges |
| 3B | Modify | `src/pages/Businesses.tsx`, `Places.tsx`, `Events.tsx` | Remove area filter, add location join |
| 3B | Modify | `src/components/BusinessCard.tsx`, `PlaceCard.tsx`, `EventCard.tsx` | Add location badge |
| 3C | Create | `src/pages/admin/AdminNotifications.tsx` | Admin send notifications |
| 3C | Modify | `src/pages/admin/AdminEvents.tsx` | ImageUpload for cover image |
| 3C | Modify | `src/pages/admin/AdminPlaces.tsx` | ImageUpload for cover image |
| 3C | Modify | `src/components/admin/AdminSidebar.tsx`, `src/App.tsx` | Add notifications route |
| 3D | Create | `supabase/functions/delivery-api/index.ts` | Public delivery API |
| 3D | Create | `supabase/functions/notify-webhooks/index.ts` | Webhook notifications |
| 3D | Migration | `api_webhooks` table | Store webhook registrations |

