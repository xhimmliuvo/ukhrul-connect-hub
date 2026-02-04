

# Add Promo/Coupon Field and Fee Estimation Message

## Overview
Update the order confirmation step in ServiceRequestModal to add an optional promo/coupon code field and communicate that the displayed fee is an estimate - the final fee will be provided by admin/agent upon completion.

---

## Changes Required

### 1. Database Migration
Add a `promo_code` column to the `delivery_orders` table to store any coupon/promo code the customer provides.

| Column | Type | Description |
|--------|------|-------------|
| promo_code | text (nullable) | Optional promo/coupon code entered by customer |

---

### 2. Update ServiceRequestModal (Confirm Step)

**Current Flow:**
- Shows fee breakdown with calculated total
- Displays "* Final fee may vary based on actual distance and conditions"
- Place Order button requires `pricingBreakdown` to be set

**New Flow:**
- Add optional promo/coupon code input field
- Change fee display to show as "Estimated Total"
- Add clear message: "Admin/Agent will confirm your final fee upon completion"
- Allow order placement without requiring exact fee calculation
- Store promo code with order

---

### 3. UI Changes on Confirm Step (Step 5)

**Add to Fee Breakdown Card:**
```
+----------------------------------+
| Fee Breakdown (Estimate)         |
|----------------------------------|
| Base Fee              ₹30        |
| Distance (3 km)       ₹30        |
|----------------------------------|
| Estimated Total       ₹60        |
+----------------------------------+

+----------------------------------+
| 🎟 Promo/Coupon Code (Optional) |
| [Enter code...                 ] |
+----------------------------------+

⚠ This is an estimate only.
Admin/Agent will provide your final
fee total upon completion.
```

---

## Files to Modify

| File | Changes |
|------|---------|
| Migration SQL | Add `promo_code` column to `delivery_orders` |
| `src/components/dropee/ServiceRequestModal.tsx` | Add promo code input, update messaging, adjust validation |

---

## Implementation Details

### ServiceRequestModal Changes

1. **Add State Variable:**
   ```typescript
   const [promoCode, setPromoCode] = useState('');
   ```

2. **Update Confirm Step UI (case 5):**
   - Change "Fee Breakdown" to "Fee Breakdown (Estimate)"
   - Change "Total" to "Estimated Total"
   - Add promo/coupon input field with Ticket icon
   - Replace disclaimer text with:
     - "This is an estimate only."
     - "Admin/Agent will confirm your final fee upon completion."
   - Style the notice prominently (warning/info style)

3. **Update `handleSubmit` Function:**
   - Include `promo_code: promoCode || null` in the insert

4. **Update `canProceed` Validation:**
   - Make fee calculation optional for placing order (allow if pricingBreakdown is null)
   - Users should be able to place orders even if fee calculation failed

---

## Expected Result

After implementation:
1. User reaches Confirm step
2. Sees fee breakdown labeled as "Estimate"
3. Can optionally enter a promo/coupon code
4. Sees clear message that final fee will be given by admin/agent
5. Can place order knowing fee is an estimate
6. Promo code is saved with the order for admin/agent to apply

