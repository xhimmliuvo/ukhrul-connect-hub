
# Comprehensive Enhancement Plan

This plan addresses multiple feature requests across Admin Orders, Agent Profiles, and Business Products management.

---

## Part 1: Enhanced Admin Orders Page

### Current Issues
- Only shows `dropee_orders` table (commerce orders), NOT `delivery_orders` (rider/delivery orders)
- Missing: completed orders with proof images, agent assignment, rider status, estimated times

### Solution

**1.1 Create Unified Admin Delivery Orders Page**

Create a new `AdminDeliveryOrders.tsx` page that displays `delivery_orders` with:

| Feature | Description |
|---------|-------------|
| Tabbed View | New, Active, Completed, Cancelled tabs |
| Order Details | Full delivery info - pickup/delivery addresses, contacts, package details |
| Proof Images | Display `proof_of_delivery_images` for completed orders |
| Agent Info | Show assigned agent with status indicator (online/busy/offline) |
| Estimated Time | Show `estimated_delivery_time` and calculate ETA |

**1.2 Agent Assignment System**

Add to order detail dialog:
- **Auto-assign**: Find first available (online) agent in the service area
- **Manual select**: Dropdown of all agents with their current status
- **User's preferred**: Show if user selected a preferred rider, with status badge

**1.3 UI Components**

```
Order Card:
+------------------------------------------+
| [Pending] Package Delivery    ₹115       |
| Pickup: Kazar Wino, Ukhrul              |
| Delivery: Town Center, Ukhrul           |
|------------------------------------------|
| Agent: [Avatar] Shimray (DRP001)        |
|        [Online] • 2 active deliveries   |
| ETA: ~25 mins                           |
+------------------------------------------+
| [Auto Assign] [Manual Assign] [View]    |
+------------------------------------------+

Completed Order Detail:
+------------------------------------------+
| Delivery Proof Images                    |
| [img1] [img2]                           |
|------------------------------------------|
| Delivered at: Feb 4, 2026, 3:45 PM      |
| Total Fee: ₹115                          |
+------------------------------------------+
```

---

## Part 2: Enhanced Agent Profile Management

### Current State
- `AdminAgents.tsx` shows agent list but limited editing
- Missing: full profile editing, image upload, "Back to site" navigation

### Solution

**2.1 Enhanced Agent Profile Dialog**

Add full edit capability:
- Phone number (editable)
- Full name (editable)
- Avatar/Profile image (upload via ImageUpload component)
- Vehicle type selector
- Service area assignment
- View-only stats: Total deliveries, Total earnings, Rating

**2.2 Agent Profile Card Display**

```
+------------------------------------------+
| [Avatar Upload]  Shimray (DRP001)       |
| Phone: +91 98765 43210                  |
| Vehicle: Motorcycle                      |
| Service Area: Ukhrul                     |
|------------------------------------------|
| Stats:                                   |
| Deliveries: 45  | Earnings: ₹12,500     |
| Rating: 4.8★    | Status: [Online]      |
+------------------------------------------+
| [Save Changes]                          |
+------------------------------------------+
```

**2.3 Back to Site Navigation**

Add a "Back to Site" button in Admin sidebar/header that links to `/`.

---

## Part 3: Business Products & Offers Management

### Current State
- Products exist but no admin UI to manage them
- No offers/deals system

### Solution

**3.1 Database Migration: Business Offers Table**

Create `business_offers` table:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | FK to businesses |
| title | text | Offer headline |
| description | text | Details |
| offer_type | text | 'daily', 'weekly', 'monthly', 'flash' |
| discount_percentage | numeric | Optional discount % |
| discount_amount | numeric | Optional fixed discount |
| image | text | Offer banner image |
| valid_from | timestamptz | Start date |
| valid_until | timestamptz | End date |
| is_active | boolean | Toggle visibility |
| created_at | timestamptz | |

**3.2 Admin Products Page (`AdminProducts.tsx`)**

New page to manage products across all businesses:
- Filter by business
- CRUD operations for products
- Image upload with `ImageUpload` component
- Bulk actions

**3.3 Admin Offers Page (`AdminOffers.tsx`)**

Manage business offers:
- Create daily/weekly/monthly offers
- Set validity periods
- Upload offer images
- Toggle active status

**3.4 Business Detail Enhancement**

Update `BusinessDetail.tsx` to display active offers in a prominent banner/carousel.

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/pages/admin/AdminDeliveryOrders.tsx` | Unified delivery orders management |
| Create | `src/pages/admin/AdminProducts.tsx` | Products management page |
| Create | `src/pages/admin/AdminOffers.tsx` | Business offers management |
| Create | Migration SQL | `business_offers` table |
| Modify | `src/pages/admin/AdminAgents.tsx` | Full profile edit with image upload |
| Modify | `src/components/admin/AdminSidebar.tsx` | Add new menu items + Back to Site |
| Modify | `src/App.tsx` | Register new routes |
| Modify | `src/pages/BusinessDetail.tsx` | Display active offers |

---

## Technical Details

### Agent Assignment Logic

```typescript
// Auto-assign to free agent
async function autoAssignAgent(orderId: string) {
  // Find online agents with no active deliveries
  const { data: freeAgents } = await supabase
    .from('delivery_agents')
    .select(`
      id, full_name,
      agent_availability!inner(status)
    `)
    .eq('is_active', true)
    .eq('is_verified', true)
    .eq('agent_availability.status', 'online');

  // For each agent, check if they have active orders
  for (const agent of freeAgents) {
    const { count } = await supabase
      .from('delivery_orders')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_agent_id', agent.id)
      .in('status', ['agent_assigned', 'picked_up', 'in_transit']);
    
    if (count === 0) {
      // Assign to this agent
      return assignOrderToAgent(orderId, agent.id);
    }
  }
  
  toast.error('No free agents available');
}
```

### Proof Images Display

```typescript
// In order detail dialog
{order.proof_of_delivery_images?.length > 0 && (
  <div className="space-y-2">
    <Label>Delivery Proof</Label>
    <div className="flex gap-2 overflow-x-auto">
      {order.proof_of_delivery_images.map((img, i) => (
        <img 
          key={i} 
          src={img} 
          alt={`Proof ${i+1}`}
          className="h-24 w-24 object-cover rounded-lg cursor-pointer"
          onClick={() => openLightbox(img)}
        />
      ))}
    </div>
  </div>
)}
```

### Estimated Time Calculation

```typescript
// Calculate ETA based on distance and average speed
function calculateETA(distanceKm: number, status: string): string {
  const avgSpeed = 25; // km/h for local delivery
  const baseTime = (distanceKm / avgSpeed) * 60; // minutes
  
  // Add buffer based on status
  const buffers = {
    'pending': 15,
    'agent_assigned': 10,
    'picked_up': 5,
    'in_transit': 0,
  };
  
  const totalMins = Math.ceil(baseTime + (buffers[status] || 0));
  
  if (totalMins < 60) return `~${totalMins} mins`;
  return `~${Math.floor(totalMins/60)}h ${totalMins%60}m`;
}
```

---

## Navigation Updates

### AdminSidebar Changes

```typescript
const menuItems = [
  // ... existing items
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: Percent, label: 'Offers', path: '/admin/offers' },
  { icon: Truck, label: 'Delivery Orders', path: '/admin/delivery-orders' },
];

// Add at bottom of sidebar
<Button variant="ghost" onClick={() => navigate('/')}>
  <Home className="h-4 w-4 mr-2" />
  Back to Site
</Button>
```

---

## Expected Outcome

After implementation:

1. **Admin Orders**: See all delivery orders with full details, proof images for completed ones, and agent assignment options
2. **Agent Management**: Full CRUD with profile image upload, phone editing, stats display
3. **Products**: Manage products for any business with image uploads
4. **Offers**: Create time-limited promotions (daily, monthly) for businesses
5. **Navigation**: Easy "Back to Site" access from admin panel
