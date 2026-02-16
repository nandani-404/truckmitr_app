# Shipper Load & Payment Flow - Mobile UI Guide

This guide describes how to handle the UI for accepted loads and the two-step payment process (90% and 10%) on the mobile application.

---

## Part 1: Fetching Loads
Use this API to populate the "Accepted Loads" or "Payments" screen.

### API: Get Accepted Loads
**Endpoint:** `GET /api/shipper/get-accepted-loads`  
**Headers:** `Authorization: Bearer <token>`

### UI Flow Logic
For each item in the list, use the following logic to drive the UI:

1. **Check `is_payment_completed`**:
   - If `true`: Show a "Payment Successful" badge. Hide any "Pay" buttons.
   - If `false`: Show the "Pay Now" button and display the `payable_amount`.

2. **Handle `payment_stage`**:
   - If `balance_90_percent`: Label the payment as **"Pay 90% Advance"**.
   - If `balance_10_percent`: Label the payment as **"Pay 10% Balance"**.

---

## Part 2: Response Cases

### Case 1: Initial State (No Payment Done)
The user has just had a load accepted and needs to pay the 90% advance.
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "shipper_price": "50000.00",
            "payment_status": "pending",
            "payable_amount": 45000.0,
            "payment_stage": "balance_90_percent",
            "is_payment_completed": false,
            "post_load": { ... }
        }
    ]
}
```
**UI Action:** Show Button **"Pay Advance (₹45,000)"**.

### Case 2: Partial State (90% Paid)
The user has completed the first payment. They now owe the remaining 10%.
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "shipper_price": "50000.00",
            "payment_status": "partial",
            "payable_amount": 5000.0,
            "payment_stage": "balance_10_percent",
            "is_payment_completed": false,
            "post_load": { ... }
        }
    ]
}
```
**UI Action:** Show Button **"Pay Balance (₹5,000)"**.

### Case 3: Completed State (100% Paid)
The load is fully settled.
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "shipper_price": "50000.00",
            "payment_status": "completed",
            "payable_amount": 0,
            "payment_stage": "completed",
            "is_payment_completed": true,
            "post_load": { ... }
        }
    ]
}
```
**UI Action:** Hide Pay Button. Show green checkmark ✅ **"Payment Completed"**.

---

## Part 3: Initiating Payment
When the user clicks the "Pay Now" button, follow this flow.

### Step 1: Create Order ID
**Endpoint:** `POST /api/shipper/create-shipper-order-payment`  
**Body:**
```json
{
    "id": 13 // Primary ID of the load
}
```

### Step 2: Razorpay Modal
Use the `order_id` and `amount` returned by the server to open the Razorpay SDK. 
**Note:** `amount` from server is in Rupees. Multiply by 100 for Razorpay (Paise).

```javascript
// Example Payload for Razorpay SDK
const options = {
    amount: response.amount * 100, // e.g. 4500000
    order_id: response.order_id,
    key: response.razorpay_key,
    description: response.payment_stage === "balance_90_percent" 
                 ? "90% Advance Payment" 
                 : "10% Balance Payment",
    // ... other options
};
```

---

## Mobile UI Checklist

| Feature | Logic / Key to Use |
| :--- | :--- |
| **Visible Price** | Use `shipper_price` for the total settled amount. |
| **Amount to Pay** | Always use `payable_amount`. |
| **Button Label** | Use `payment_stage` to toggle between "Pay Advance" and "Pay Balance". |
| **Disable Button** | If `is_payment_completed` is `true`. |
| **Load ID** | When calling `/create-shipper-order-payment`, use the top-level `id` (integer) from the `get-accepted-loads` response. |

---

## Handling Status Transitions
After a successful payment in the Razorpay SDK, **refresh the `get-accepted-loads` list**. The backend webhook will have updated the status, and the API will automatically provide the next stage (10% or Completed) in the next call.
