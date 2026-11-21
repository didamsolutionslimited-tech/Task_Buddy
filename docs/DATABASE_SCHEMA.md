# Database Schema Design - Task Buddy

## Entities and Relationships

### 1. Users
Stores all users (Clients and Taskers).
- `id`: UUID (PK)
- `phone_number`: String (Unique, Indexed) - Primary identifier for Africa region.
- `full_name`: String
- `email`: String (Optional)
- `role`: Enum ('client', 'tasker', 'admin')
- `avatar_url`: String
- `is_verified`: Boolean (KYC status)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### 2. TaskerProfiles
Extended information for users who are Taskers.
- `user_id`: UUID (FK -> Users.id, Unique)
- `bio`: Text
- `hourly_rate`: Decimal
- `rating`: Decimal (Average)
- `total_reviews`: Integer
- `location_lat`: Decimal
- `location_lng`: Decimal
- `is_available`: Boolean
- `verified_identity_doc`: String (URL to NIN/BVN verification)

### 3. Categories
Types of tasks (e.g., Plumbing, Electrician, Cleaning).
- `id`: Integer (PK)
- `name`: String (Unique)
- `icon_url`: String
- `description`: Text

### 4. Tasks
The actual job posts created by clients.
- `id`: UUID (PK)
- `client_id`: UUID (FK -> Users.id)
- `category_id`: Integer (FK -> Categories.id)
- `title`: String
- `description`: Text
- `budget`: Decimal
- `location_address`: String
- `location_lat`: Decimal
- `location_lng`: Decimal
- `scheduled_date`: Timestamp
- `status`: Enum ('open', 'assigned', 'in_progress', 'completed', 'cancelled')
- `created_at`: Timestamp

### 5. Bookings / Assignments
The link between a Task and a Tasker.
- `id`: UUID (PK)
- `task_id`: UUID (FK -> Tasks.id)
- `tasker_id`: UUID (FK -> Users.id)
- `status`: Enum ('pending', 'accepted', 'declined', 'confirmed')
- `accepted_at`: Timestamp
- `completed_at`: Timestamp

### 6. Payments
Transaction records via Paystack/Flutterwave.

Billing model: the client pays `amount` = task price + service fee (10%) + VAT (7.5% of the service fee) + urgency fee (≥₦2,000 for urgent jobs). The tasker is paid the full task price.

- `id`: UUID (PK)
- `booking_id`: UUID (FK -> Bookings.id)
- `amount`: Decimal — total charged to the client (task price + all fees)
- `platform_fee`: Decimal — 10% service fee on the task price
- `vat`: Decimal — 7.5% VAT on the platform fee (government tax law)
- `urgency_fee`: Decimal — surcharge for urgent/priority jobs (₦0 if standard)
- `tasker_payout`: Decimal — what the tasker receives (the full task price)
- `transaction_ref`: String (External Gateway Ref)
- `payment_status`: Enum ('pending', 'paid', 'failed', 'refunded')
- `created_at`: Timestamp

### 7. Reviews
Feedback after task completion.
- `id`: UUID (PK)
- `booking_id`: UUID (FK -> Bookings.id)
- `reviewer_id`: UUID (FK -> Users.id)
- `reviewee_id`: UUID (FK -> Users.id)
- `rating`: Integer (1-5)
- `comment`: Text
- `created_at`: Timestamp
