# Low-Level Design (LLD) — Animal Rescuer

## 1. Database Schemas (Mongoose)

### 1.1 User Schema (`server/models/User.js`)
Stores user settings, credentials, role permissions, and geospatial coordinates.
```javascript
{
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    role: { type: String, enum: ["CITIZEN", "RESCUER", "ADMIN"], default: "CITIZEN" },
    profileImage: String,
    location: {
        type: { type: String, enum: ["Point"] },
        coordinates: [Number] // [longitude, latitude]
    },
    rescueRadius: { type: Number, min: 1, max: 10, default: 5 },
    isAvailable: { type: Boolean, default: false }
}
// Indexes: { location: "2dsphere" }
```

### 1.2 RescueReport Schema (`server/models/RescueReport.js`)
Tracks the animal type, location, severity, and workflow state.
```javascript
{
    citizenId: { type: ObjectId, ref: "User", required: true },
    animalType: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
    imageUrl: String,
    location: {
        type: { type: String, enum: ["Point"], required: true },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    status: { 
        type: String, 
        enum: ["PENDING", "NOTIFIED", "ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], 
        default: "PENDING" 
    },
    assignedRescuerId: { type: ObjectId, ref: "User", default: null },
    acceptedAt: Date,
    completedAt: Date
}
// Indexes: { location: "2dsphere" }
```

---

## 2. API Endpoints

### 2.1 Auth Routes (`/api/auth`)
*   `POST /register`: Registers local email/password users. Password hashed via bcryptjs pre-save middleware.
*   `POST /login`: Validates password and generates JWT token.
*   `GET /me`: Fetches active user details using JWT verification middleware.

### 2.2 Report Routes (`/api/reports`)
*   `GET /`: Fetches citizen reports (filtered to current user if role is Citizen).
*   `POST /`: Creates report, triggers Multer upload to save image, performs `$near` geospatial lookup, and notifies matching rescuers via Socket.IO.
*   `GET /:id`: Detailed information.

### 2.3 Rescuer Settings (`/api/rescuers`)
*   `PATCH /location`: Updates Rescuer coordinates.
*   `PATCH /radius`: Updates rescue query boundary (1-10km).
*   `PATCH /availability`: Toggles available state.
*   `GET /nearby`: Queries matching reports within rescuer's radius.

---

## 3. Real-Time Socket.IO Protocol
*   **Event**: `join`
    *   *Direction*: Client -> Server
    *   *Action*: Places user socket session into a private channel matching their User ID.
*   **Event**: `new_rescue_request`
    *   *Direction*: Server -> Client (Rescuer)
    *   *Action*: Broadcasts new pending animal report payload to eligible rescuers.
*   **Event**: `rescue_status_update`
    *   *Direction*: Server -> Client (Citizen)
    *   *Action*: Updates reporting citizen with status changes (`ACCEPTED`, `IN_PROGRESS`, `COMPLETED`).
