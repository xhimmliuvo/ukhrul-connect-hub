

# Add Agent Panel Access for Agents

## Overview
Create a similar access pathway for agents as admins have. When a user has the 'agent' role, they will see an "Agent Panel" link in both the HamburgerMenu and the Profile page, allowing them to access their agent dashboard at `/agent`.

---

## Current State

**Admin Access (existing pattern to follow):**
- HamburgerMenu shows "Admin Panel" link when `isAdmin` is true
- Uses Shield icon with ChevronRight
- Links to `/admin`

**Agent Pages (already exist):**
- `/agent` - Agent Dashboard
- `/agent/orders` - Order Management  
- `/agent/active` - Active Delivery
- `/agent/earnings` - Earnings

**Missing:**
- No visible entry point for agents to access their panel from the main app

---

## Solution

### 1. Update HamburgerMenu
Add an "Agent Panel" section similar to Admin Panel:
- Show when `isAgent` is true (already available from `useUserRoles`)
- Use Truck icon (consistent with agent/delivery theme)
- Link to `/agent`
- Place above Admin Panel section

### 2. Update Profile Page
Add an "Agent Panel" card/button for agents:
- Import `useUserRoles` hook
- Show a prominent card or menu item when user is an agent
- Use similar styling to other menu items
- Link to `/agent`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/HamburgerMenu.tsx` | Add Agent Panel link for agents |
| `src/pages/Profile.tsx` | Add Agent Panel card/button for agents |

---

## UI Design

### HamburgerMenu (after Menu Items, before Admin Section)
```
─────────────────────────────
  [Truck icon] Agent Panel  >
─────────────────────────────
```

### Profile Page (new card after Stats Cards)
```
+----------------------------------+
|  Agent Dashboard                 |
|  Manage your deliveries          |
|  [Open Agent Panel]              |
+----------------------------------+
```

Or as a menu item in the existing card:
```
+----------------------------------+
|  [Truck] Agent Panel          >  |
+----------------------------------+
|  [ShoppingBag] My Orders      >  |
|  [Heart] Saved Items          >  |
|  ...                             |
+----------------------------------+
```

---

## Implementation Details

### HamburgerMenu Changes
- Already imports `useUserRoles` and destructures `isAdmin`
- Add `isAgent` to the destructuring
- Add new section between menu items and admin section:
  - Separator
  - Link to `/agent` with Truck icon and "Agent Panel" label
  - Only visible when `user && isAgent`

### Profile Page Changes
- Import `useUserRoles` hook
- Add `isAgent` check
- Add prominent card with:
  - Truck icon
  - "Agent Dashboard" title
  - "Manage deliveries, view earnings" description
  - Link/Button to `/agent`
  - Styled with primary color to stand out

---

## Expected Result

After implementation:
1. **Shimray** (agent) logs in
2. Goes to `/profile` or opens hamburger menu
3. Sees "Agent Panel" option prominently displayed
4. Clicks it → Redirects to `/agent` (Agent Dashboard)
5. Can manage orders, track deliveries, view earnings

