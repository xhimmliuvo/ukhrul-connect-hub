

## Hub Integration Plan (Alongside Existing Delivery System)

### Overview
Add hub integration with placeholder URL so delivery orders are also forwarded to an external hub. The hub manages its own agents/routing. Customers see a live tracker with hub status updates via WebSocket + polling fallback.

### 1. Database Migration
Add `hub_order_id` and `hub_status` columns to `delivery_orders`:
```sql
ALTER TABLE delivery_orders ADD COLUMN hub_order_id text;
ALTER TABLE delivery_orders ADD COLUMN hub_status text DEFAULT 'pending';
```

### 2. Secrets
- Store `HUB_URL` (placeholder: `https://hub.example.com`) and `HUB_API_KEY` (user provides) as backend secrets
- Source name `ukhrul` hardcoded in edge function

### 3. Edge Function: `hub-forward-order`
New edge function that:
- Receives a delivery order ID from the client
- Fetches the order from DB
- POSTs to `{HUB_URL}/api/orders` with `x-api-key` header, body containing: `source: "ukhrul"`, internal order ID, customer name/phone, delivery address, items, total, notes
- Saves returned `hub_order_id` back to `delivery_orders`
- Returns hub_order_id to client

### 4. Edge Function: `hub-check-status`
Polling fallback endpoint:
- Takes `hub_order_id` param
- Calls `GET {HUB_URL}/api/orders/{hub_order_id}` with API key
- Returns current hub status

### 5. Client Integration

**After order creation** (in the order placement flow): Call `hub-forward-order` edge function to send order to hub.

**New hook: `useHubTracking(hubOrderId)`**:
- Attempts WebSocket connection to `{HUB_URL}?source=ukhrul&api_key=...`
- Listens for status messages matching the hub_order_id
- On WS close/error, falls back to polling `hub-check-status` every 15 seconds
- Returns current hub status

**Hub status stages**: Pending → Confirmed → Preparing → Picked Up → On The Way → Delivered

### 6. UI Changes

**TrackOrder page**: Add a "Hub Delivery Status" section below the existing timeline when `hub_order_id` exists. Show a separate timeline with the 6 hub stages, updated in real-time via the hook.

**Orders page**: Show hub status badge alongside existing status when hub_order_id is present.

### Technical Details

- Hub URL stored as secret with placeholder `https://hub.example.com` — user updates later
- WebSocket URL derived from HUB_URL (wss:// version)
- The existing local agent tracking system remains fully functional
- Hub integration is additive — if hub forwarding fails, the order still works locally
- config.toml updated with `verify_jwt = false` for both new edge functions

