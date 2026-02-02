

# Phase 4: Real-time Tracking with WebSocket

## Overview
This phase adds real-time order tracking capabilities, allowing customers to see live updates of their delivery status and agent location, while enabling agents to broadcast their location during active deliveries.

---

## 1. Database Changes

### 1.1 Create `delivery_tracking` Table
Stores real-time location updates from agents during active deliveries.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | uuid | References delivery_orders |
| agent_id | uuid | References delivery_agents |
| lat | numeric | Current latitude |
| lng | numeric | Current longitude |
| heading | numeric | Direction of travel (0-360) |
| speed | numeric | Speed in km/h |
| status | text | 'en_route_pickup', 'at_pickup', 'en_route_delivery', 'at_delivery' |
| timestamp | timestamptz | When this update was recorded |

### 1.2 Enable Realtime for `delivery_tracking`
Add to Supabase Realtime publication for live location streaming.

### 1.3 RLS Policies for `delivery_tracking`
- Order owner can view tracking for their orders
- Assigned agent can insert/update tracking for their orders
- Admins have full access

---

## 2. New Pages

### 2.1 Customer Order Tracking Page (`/track/:orderId`)
A dedicated page where customers can track their delivery in real-time.

**Features:**
- Order status timeline (visual progress indicator)
  - Order Placed -> Agent Assigned -> Picked Up -> In Transit -> Delivered
- Agent information card
  - Photo, name, agent code
  - Vehicle type
  - Rating
  - Phone number (tap to call)
- Live location display (text-based coordinates with Google Maps link)
- Estimated time of arrival
- Real-time status updates via WebSocket subscription

**UI Structure:**
```
+----------------------------------+
|  ← Track Order #DRP-xxx          |
+----------------------------------+
|  Status Timeline                 |
|  [●]--[●]--[○]--[○]--[○]        |
|  Placed  Assigned  Pickup Transit|
+----------------------------------+
|  Your Agent                      |
|  [Avatar] Agent Name  DRP001     |
|  ★4.8 | 🏍 Bike                  |
|  [📞 Call] [💬 Message]          |
+----------------------------------+
|  Current Location                |
|  Last updated: 2 mins ago        |
|  📍 Near Main Street...          |
|  [Open in Maps]                  |
+----------------------------------+
|  Delivery Details                |
|  From: Pickup address            |
|  To: Delivery address            |
|  ETA: ~15 minutes                |
+----------------------------------+
```

### 2.2 Customer Delivery Orders Page (`/orders/delivery`)
Enhanced orders page specifically for delivery orders with tracking links.

**Features:**
- List of customer's delivery orders (from `delivery_orders` table)
- Order status badges with real-time updates
- "Track Order" button for active orders
- Order history with completion details

---

## 3. Agent Location Broadcasting

### 3.1 Update `AgentActiveDelivery.tsx`
Add location broadcasting functionality:
- Request geolocation permission when delivery is active
- Send location updates every 15 seconds while in "in_transit" status
- Update `delivery_tracking` table with current position
- Show location sharing indicator to agent
- Stop broadcasting when delivery is completed

### 3.2 Location Hook (`useAgentLocation.ts`)
Custom hook to manage location tracking:
- Start/stop location watching
- Batch location updates
- Handle permission errors gracefully
- Cleanup on unmount

---

## 4. Real-time Subscriptions

### 4.1 Order Status Updates
Subscribe to `delivery_orders` changes for:
- Status changes (pending -> assigned -> picked_up -> in_transit -> delivered)
- Agent assignment
- Fee adjustments

### 4.2 Location Updates
Subscribe to `delivery_tracking` for:
- New location inserts
- Real-time position updates on tracking page

### 4.3 Agent Availability Updates (Enhancement)
Already enabled in Phase 1 - ensure Services page uses real-time updates.

---

## 5. Enhanced Existing Pages

### 5.1 Update Customer Orders Page (`/orders`)
- Add "Delivery Orders" tab alongside existing orders
- Show delivery order list with:
  - Service type
  - Pickup/delivery addresses (truncated)
  - Status badge
  - "Track" button for active orders
  - Agent info when assigned

### 5.2 Add Tracking Link to Agent Dashboard
- Quick link to see which orders they've completed
- Notification when new orders come in (real-time)

---

## 6. Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | Migration SQL | delivery_tracking table |
| Create | `src/pages/TrackOrder.tsx` | Customer order tracking page |
| Create | `src/hooks/useAgentLocation.ts` | Location broadcasting hook |
| Create | `src/hooks/useOrderTracking.ts` | Real-time order tracking hook |
| Create | `src/components/tracking/OrderStatusTimeline.tsx` | Visual status timeline |
| Create | `src/components/tracking/AgentInfoCard.tsx` | Agent details card |
| Create | `src/components/tracking/LiveLocationCard.tsx` | Location display component |
| Modify | `src/pages/agent/AgentActiveDelivery.tsx` | Add location broadcasting |
| Modify | `src/pages/Orders.tsx` | Add delivery orders section |
| Modify | `src/App.tsx` | Add TrackOrder route |

---

## 7. Implementation Flow

```
Step 1: Database Migration
    Create delivery_tracking table
    Enable realtime
    Add RLS policies

Step 2: Location Broadcasting (Agent Side)
    Create useAgentLocation hook
    Update AgentActiveDelivery to broadcast location
    Insert tracking records every 15 seconds

Step 3: Tracking Components
    OrderStatusTimeline - visual progress
    AgentInfoCard - agent details
    LiveLocationCard - current position

Step 4: Customer Tracking Page
    Build TrackOrder page
    Subscribe to order status changes
    Subscribe to location updates
    Display real-time information

Step 5: Orders Page Enhancement
    Add delivery orders tab
    Show track buttons
    Real-time status updates

Step 6: Routing
    Add /track/:orderId route
    Link from orders page
```

---

## 8. Order Status Flow

```
pending
   ↓
agent_assigned (agent accepts)
   ↓
picked_up (agent picks up package)
   ↓
in_transit (agent starts delivery, location broadcasting begins)
   ↓
delivered (agent completes with photo, broadcasting stops)
```

---

## Technical Notes

### Real-time Subscription Pattern
```typescript
// Subscribe to order status
const channel = supabase
  .channel(`order-${orderId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'delivery_orders',
    filter: `id=eq.${orderId}`,
  }, handleStatusChange)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'delivery_tracking',
    filter: `order_id=eq.${orderId}`,
  }, handleLocationUpdate)
  .subscribe();
```

### Location Broadcasting Pattern
```typescript
// Geolocation watcher
navigator.geolocation.watchPosition(
  (position) => {
    // Insert into delivery_tracking
  },
  (error) => {
    // Handle errors
  },
  { enableHighAccuracy: true, maximumAge: 10000 }
);
```

---

## Summary

This phase implements:
1. **Database**: `delivery_tracking` table for location history
2. **Agent Side**: Location broadcasting during active deliveries
3. **Customer Side**: Real-time tracking page with status timeline and agent info
4. **Enhanced Orders**: Delivery orders with tracking links
5. **Real-time**: WebSocket subscriptions for instant updates

