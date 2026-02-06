
# Build Agent Profile Page and Enhance Business Profile Images

## Overview
This plan addresses two related enhancements:
1. **Agent Profile Page**: Create a dedicated profile page for agents to view and edit their personal information, including profile image upload
2. **Business Profile Images**: Enhance the AdminBusinesses page to use proper image upload components instead of URL text inputs

---

## Current State Analysis

### Agent Profile
- AgentDashboard.tsx has a "Profile" button that navigates to `/agent/profile`
- This route does NOT exist yet (404)
- AdminAgents.tsx already has full profile editing with ImageUpload - can reuse patterns

### Business Profile Images
- AdminBusinesses.tsx uses a text input for `cover_image` URL (line 492-498)
- No proper image upload component is used
- ImageUpload component already exists and is used in AdminAgents.tsx

---

## Part 1: Agent Profile Page

### New File: `src/pages/agent/AgentProfile.tsx`

Create a dedicated page where agents can:
- View their profile details and stats
- Upload/change their profile image
- Edit name, phone, email
- View read-only stats (deliveries, earnings, rating)
- Navigate back to dashboard

| Feature | Description |
|---------|-------------|
| Profile Image | Upload via ImageUpload component to `agents` folder |
| Editable Fields | Full name, Phone, Email |
| Read-only Stats | Total deliveries, Earnings, Rating, Agent code |
| Vehicle Type | Select (Bike/Car/On Foot) |
| Actions | Save changes, Back to Dashboard |

### UI Layout
```
+------------------------------------------+
|  [Back] Agent Profile                    |
+------------------------------------------+
|  +------+  Agent Code: DRP001           |
|  | PHOTO|  Rating: 4.8 ★                 |
|  | UPLOAD  Deliveries: 45               |
|  +------+  Earnings: ₹12,500            |
+------------------------------------------+
|  Full Name: [___________________]        |
|  Phone:     [___________________]        |
|  Email:     [___________________]        |
|  Vehicle:   [Motorcycle        v]        |
+------------------------------------------+
|  [Save Changes]                          |
+------------------------------------------+
```

---

## Part 2: Business Profile Images

### Update: `src/pages/admin/AdminBusinesses.tsx`

Replace the text input for cover_image with the ImageUpload component.

**Changes:**
1. Import `ImageUpload` from `@/components/admin/ImageUpload`
2. Replace the cover_image text input (lines 492-498) with:
   ```tsx
   <div className="space-y-2">
     <Label>Cover Image</Label>
     <ImageUpload
       value={formData.cover_image}
       onChange={(url) => setFormData({ ...formData, cover_image: url })}
       folder="businesses"
     />
   </div>
   ```

This enables drag-and-drop image upload with preview for business cover images.

---

## Files to Create/Modify

| Action | File | Description |
|--------|------|-------------|
| Create | `src/pages/agent/AgentProfile.tsx` | Agent self-service profile page |
| Modify | `src/App.tsx` | Add route `/agent/profile` |
| Modify | `src/pages/admin/AdminBusinesses.tsx` | Replace cover_image text input with ImageUpload |

---

## Implementation Details

### AgentProfile.tsx Key Features

1. **Fetch agent profile on load**
   - Use user_id from auth context
   - Get current values for all editable fields

2. **Profile image upload**
   - Use existing ImageUpload component
   - Store in `agents` folder in storage bucket
   - Update `avatar_url` in delivery_agents table

3. **Form validation**
   - Full name is required
   - Phone format validation (optional)
   - Email format validation (optional)

4. **Save functionality**
   - Update delivery_agents table
   - Show success/error toast
   - Refresh profile data

5. **Navigation**
   - Back button to `/agent`
   - Header with profile title

### AdminBusinesses.tsx Changes

Replace lines 492-498 (the cover_image text input):
```tsx
// Before (text input)
<div className="space-y-2">
  <Label htmlFor="cover_image">Cover Image URL</Label>
  <Input
    id="cover_image"
    value={formData.cover_image}
    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
  />
</div>

// After (ImageUpload component)
<div className="space-y-2">
  <Label>Cover Image</Label>
  <ImageUpload
    value={formData.cover_image}
    onChange={(url) => setFormData({ ...formData, cover_image: url })}
    folder="businesses"
  />
</div>
```

---

## Route Registration

Add to App.tsx:
```tsx
import AgentProfile from "./pages/agent/AgentProfile";

// In Routes:
<Route path="/agent/profile" element={<AgentProfile />} />
```

---

## Expected Results

After implementation:

1. **Agents** can navigate to `/agent/profile` from their dashboard
2. **Agents** can upload/change their profile photo
3. **Agents** can edit their name, phone, email, and vehicle type
4. **Agents** see their read-only stats (deliveries, earnings, rating)
5. **Admins** can upload business cover images via drag-and-drop in the businesses admin page
6. Both use consistent ImageUpload component with preview and remove functionality
