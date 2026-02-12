# Tracking API Response Structure

Based on the current UI implementation for the "Active Trip" screen, here is the recommended API response structure for fetching tracking details.

**Endpoint Suggestion:** `GET /api/trucker/tracking/:load_id`

```json
{
  "status": "success",
  "data": {
    "load_id": "LM-34921",
    "origin": "Andheri East, Mumbai",
    "destination": "Connaught Place, Delhi",
    "vehicle_number": "MH12 AB 1234",
    "material_name": "Electronics",
    "material_weight": "10 Tons",
    "payment_amount": "₹15,000",
    "current_status_code": 2, 
    "tracking_agent": {
      "name": "Amit Kumar",
      "phone": "+919876511111"
    },
    "timeline": [
      {
        "status_code": 0,
        "label": "Load Accepted",
        "timestamp": "2025-02-10T09:00:00Z",
        "description": "Your request has been accepted"
      },
      {
        "status_code": 1,
        "label": "Reached Pickup",
        "timestamp": "2025-02-10T14:00:00Z",
        "description": "Truck arrived at location"
      },
      {
        "status_code": 2,
        "label": "Loaded",
        "timestamp": "2025-02-10T16:30:00Z",
        "description": "Goods loaded successfully"
      },
      {
        "status_code": 3,
        "label": "In Transit",
        "timestamp": null,
        "description": "Expected Tomorrow"
      },
      {
        "status_code": 4,
        "label": "Reached Destination",
        "timestamp": null,
        "description": "Arrived at drop location"
      },
      {
        "status_code": 5,
        "label": "Delivered",
        "timestamp": null,
        "description": "Goods delivered & POD uploaded"
      }
    ]
  }
}
```

## Field Descriptions

- **current_status_code**: Integer representing the current state (0-5).
  - 0: Load Accepted
  - 1: Reached Pickup
  - 2: Loaded
  - 3: In Transit
  - 4: Reached Destination
  - 5: Delivered
- **timeline**: Array of status objects.
  - **timestamp**: ISO 8601 string or null if not yet happened.
  - **description**: Short subtitle text.

---

# POST API Documentation

The following API endpoints are required to support the interactive features of the Active Trip screen.

## 1. Update Truck Location
Used when the trucker clicks "Update Location" to share their current coordinates.

**Endpoint:** `POST /api/trucker/update-location`

**Request Body:**
```json
{
  "load_id": "LM-34921",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "timestamp": "2025-02-12T10:30:00Z"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Location updated successfully"
}
```

## 2. Update Load Status
Used when the trucker advances the workflow (e.g., from "Reached Pickup" to "Loaded").

**Endpoint:** `POST /api/trucker/update-status`

**Request Body:**
```json
{
  "load_id": "LM-34921",
  "status_code": 3,
  "timestamp": "2025-02-12T10:35:00Z"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Status updated successfully",
  "data": {
    "current_status_code": 3,
    "updated_timeline_item": {
       "status_code": 3,
       "label": "In Transit",
       "timestamp": "2025-02-12T10:35:00Z",
       "description": "On the way to destination"
    }
  }
}
```

## 3. Upload Proof of Delivery (POD)
Used when the trucker completes the trip by uploading the POD document/image.

**Endpoint:** `POST /api/trucker/upload-pod`

**Request Body:** (Multipart/Form-Data)
- `load_id`: "LM-34921"
- `pod_file`: [Binary File Data]

**Response:**
```json
{
  "status": "success",
  "message": "POD uploaded and trip completed successfully",
  "data": {
    "completion_time": "2025-02-12T14:30:00Z"
  }
}
```
