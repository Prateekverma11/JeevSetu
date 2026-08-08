# Product Requirements Document (PRD) — Animal Rescuer

## 1. Executive Summary
**Animal Rescuer** is a full-stack platform designed to bridge the gap between citizens who find injured animals in their neighborhood and professional animal rescuers. The goal of the application is to ensure rapid response, real-time rescue tracking, and seamless coordination to save animal lives.

---

## 2. User Roles
The system supports two core user roles:

### 2.1 Citizen
*   **Definition**: General public/citizens who encounter an injured animal.
*   **Goal**: Quick registration, report submission, and transparent tracking of the assigned rescuer.

### 2.2 Rescuer
*   **Definition**: Certified individuals or volunteers capable of rescuing animals.
*   **Goal**: Configure rescue parameters, receive localized real-time requests, manage active rescues, and navigate to incident sites.

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization
*   Users must register with name, email, password, and role selection (Citizen vs. Rescuer).
*   Standard Email + Password authentication secured via JWT.
*   Secure token verification to access dashboard pages (Citizen or Rescuer).

### 3.2 Citizen Features
*   **Report Injured Animal Form**: 
    *   Input: Animal type (Dog, Cat, Bird, Cow, Horse, Other).
    *   Input: Detail description.
    *   Input: Severity level selector (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
    *   Input: Animal photograph upload.
    *   Input: Location selection (via clicking an interactive map or clicking a "Use My Location" geolocation detector).
*   **My Reports**: Dashboard listing all reported incidents.
*   **Live Tracking**: Real-time status updates (`PENDING`, `NOTIFIED`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`) visible without manual browser refresh.
*   **RescueAI Chatbot**: Floating assistant explaining how to navigate the dashboard or what next steps to take.

### 3.3 Rescuer Features
*   **Settings Panel**:
    *   Geolocation capability to detect current coordinates and save them to the backend profile.
    *   Rescue Radius configuration slider (adjustable from **1 km to 10 km**).
    *   Availability toggle (`isAvailable` boolean).
*   **Nearby Rescue Requests Dashboard**:
    *   Lists reports matching the status `PENDING` / `NOTIFIED` located strictly within the rescuer's configured location and search radius.
*   **Action Flow**:
    *   **Accept**: Assigns the rescuer to the report, transitions status to `ACCEPTED`.
    *   **Decline**: Declines the report, leaving it open for other eligible nearby rescuers.
    *   **Start**: Transitions status to `IN_PROGRESS`.
    *   **Complete**: Transitions status to `COMPLETED`.

### 3.4 AI Assistant (RescueAI)
*   Provides clear navigation guidance (e.g. *"Where is the report form?"*).
*   Integrates Groq API with Llama-3.1-8b-instant model on the backend.
*   Includes guardrails to prevent medical advice or raw secret exposures.

---

## 4. Non-Functional Requirements
*   **Real-time notifications**: Delivered instantly via Socket.io.
*   **Aesthetics & Usability**: Responsive layouts, dark mode UI, smooth micro-animations.
*   **Privacy & Data Security**: Safe password hashing (bcrypt), environmental secret storage (`.env`).
