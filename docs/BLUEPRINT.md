# Task Buddy - Project Blueprint

Task Buddy is a localized TaskRabbit replica designed for the Nigerian and African markets.

## Core Value Proposition
Connecting households and businesses with verified local service providers (Taskers) for manual and professional chores.

## Key Localized Features
- **Payments:** Integrated with Paystack and Flutterwave.
- **Auth:** Phone-first authentication (OTP via SMS/WhatsApp).
- **Identity:** Integration with identity verification services (e.g., NIN/BVN in Nigeria).
- **Connectivity:** Offline-first capabilities for areas with unstable data.

## User Roles
1. **Client:** Posts tasks, manages bookings, makes payments.
2. **Tasker:** Creates profile, sets rates, accepts/completes tasks.
3. **Admin:** Verifies Taskers, handles disputes, manages platform fees.

## Technical Architecture
- **Backend:** Node.js / TypeScript / PostgreSQL / Redis
- **Frontend:** React Native (Cross-platform Mobile)
- **API:** REST / WebSocket (for real-time task updates)
- **Infrastructure:** Dockerized deployment
