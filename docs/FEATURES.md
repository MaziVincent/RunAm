# RunAm — Errand & Logistics App: Features Document

> **Version:** 1.0  
> **Last Updated:** February 10, 2026

---

## 1. Product Overview

**RunAm** is a full-stack errand and logistics platform that connects users who need tasks done (errands, deliveries, pickups) with riders/runners who fulfill those tasks. The platform consists of four main components:

| Component        | Technology              | Purpose                                            |
| ---------------- | ----------------------- | -------------------------------------------------- |
| Backend API      | C# / .NET 8             | Core business logic, API layer, real-time services |
| Web Dashboard    | Next.js 14 (App Router) | Admin panel, merchant portal, landing page         |
| User Mobile App  | React Native (Expo)     | End-user app for requesting errands & tracking     |
| Rider Mobile App | React Native (Expo)     | Rider/runner app for accepting & fulfilling tasks  |

---

## 2. User Roles

| Role              | Description                                             |
| ----------------- | ------------------------------------------------------- |
| **Customer**      | Requests errands, schedules deliveries, tracks orders   |
| **Rider/Runner**  | Accepts and fulfills errand requests                    |
| **Merchant**      | Business owner who lists products/services for delivery |
| **Admin**         | Platform administrator with full system control         |
| **Support Agent** | Handles disputes, complaints, and customer support      |

---

## 3. Core Features

### 3.1 Authentication & User Management

#### 3.1.1 Registration & Onboarding

- Phone number registration with OTP verification
- Email registration with verification link
- Social login (Google, Apple, Facebook)
- Role-based registration flows (Customer vs Rider)
- Profile completion wizard with progress indicator
- Terms of service & privacy policy acceptance

#### 3.1.2 Rider Onboarding (KYC)

- Government-issued ID upload & verification
- Selfie verification (liveness check)
- Vehicle registration (for motorized riders)
- Background check integration
- Bank account / mobile money setup for payouts
- Training module completion (in-app)
- Approval workflow (pending → approved → active)

#### 3.1.3 Authentication

- JWT-based authentication with refresh tokens
- Biometric login (fingerprint / Face ID)
- PIN-based quick login
- Session management (multi-device support)
- Account lockout after failed attempts
- Password reset via OTP or email

#### 3.1.4 Profile Management

- Profile photo upload & cropping
- Personal information editing
- Address book management (saved addresses)
- Notification preferences
- Language & currency preferences
- Account deactivation / deletion (GDPR compliant)

---

### 3.2 Errand & Task Management

#### 3.2.1 Errand Categories

- **Package Delivery** — Send packages from point A to B
- **Food Delivery** — Order from restaurants & food vendors
- **Grocery Shopping** — Send a rider to buy groceries
- **Document Delivery** — Secure document transport
- **Pharmacy Pickup** — Medication pickup & delivery
- **Laundry Pickup/Delivery** — Laundry service logistics
- **Custom Errands** — Any custom task with description
- **Multi-Stop Delivery** — Multiple pickup/drop-off points
- **Return & Exchange** — Product returns to merchants
- **Bill Payment** — Pay bills on behalf of user

#### 3.2.2 Errand Request Flow

1. Select errand category
2. Enter pickup location (map pin / address / saved address)
3. Enter drop-off location(s)
4. Add errand details (description, special instructions)
5. Upload reference images (optional)
6. Select package size/weight category
7. Choose delivery priority (Standard / Express / Scheduled)
8. View price estimate
9. Select payment method
10. Confirm and submit request

#### 3.2.3 Errand Details

- Real-time price calculation based on distance, weight, category, demand
- Estimated delivery time display
- Package insurance option
- Fragile item handling flag
- Cash-on-delivery collection option
- Recipient details (name, phone number)
- Delivery instructions (leave at door, call on arrival, etc.)
- Photo proof requirement toggle

#### 3.2.4 Scheduling

- **Instant** — Request fulfilled immediately
- **Scheduled** — Pick a future date & time
- **Recurring** — Set up repeating errands (daily, weekly, monthly)
- Calendar view for scheduled errands
- Reminder notifications before scheduled errands
- Reschedule & cancellation with time-based policies

---

### 3.3 Matching & Dispatch System

#### 3.3.1 Auto-Matching Algorithm

- Proximity-based rider matching (nearest available rider)
- Rider skill/vehicle matching (motorcycle vs bicycle vs car)
- Rider rating threshold filtering
- Load balancing (distribute tasks evenly)
- Category specialization matching
- Surge pricing integration
- Configurable matching radius (expanding search)

#### 3.3.2 Manual Selection

- Browse nearby available riders
- View rider profiles, ratings, and completed tasks
- Favorite riders list
- Request specific rider

#### 3.3.3 Dispatch Logic

- Broadcast to multiple riders with acceptance timeout
- Sequential offer (one rider at a time)
- Configurable timeout per offer (e.g., 30 seconds)
- Auto-reassignment on rejection/timeout
- Maximum reassignment attempts before escalation
- Priority queue for premium users

---

### 3.4 Real-Time Tracking

#### 3.4.1 Live Map Tracking

- Real-time rider location on map (WebSocket/SignalR)
- Animated route visualization (pickup → drop-off)
- ETA calculation with traffic consideration
- Geofence notifications (rider approaching / arrived)
- Route deviation alerts

#### 3.4.2 Status Updates

- **Pending** — Waiting for rider acceptance
- **Accepted** — Rider assigned
- **En Route to Pickup** — Rider heading to pickup
- **Arrived at Pickup** — Rider at pickup location
- **Package Collected** — Item picked up (with photo proof)
- **En Route to Drop-off** — Rider heading to destination
- **Arrived at Drop-off** — Rider at destination
- **Delivered** — Completed (with photo/signature proof)
- **Cancelled** — Cancelled by user, rider, or system
- **Failed** — Delivery attempt failed

#### 3.4.3 Communication

- In-app chat between customer and rider
- Voice call (VoIP or masked phone number)
- Pre-defined quick messages
- Chat history retention
- Automated status update messages

---

### 3.5 Payments & Pricing

#### 3.5.1 Pricing Engine

- Base fare + per-km rate + per-minute rate
- Category-based pricing multipliers
- Weight/size surcharges
- Time-based surge pricing (peak hours, holidays)
- Demand-based dynamic pricing
- Promotional discount application
- Multi-stop pricing calculation
- Minimum fare enforcement
- Price estimate before booking (range or fixed)
- Toll/bridge fee inclusion

#### 3.5.2 Payment Methods

- **Wallet** — In-app wallet with top-up
- **Credit/Debit Card** — Stripe/Paystack/Flutterwave integration
- **Mobile Money** — MTN MoMo, Airtel Money, etc.
- **Bank Transfer** — Direct bank transfer
- **Cash** — Cash on delivery (rider collects)
- **Corporate Account** — Business billing
- **Split Payment** — Split cost between multiple users

#### 3.5.3 Wallet System

- Top-up via card, bank transfer, mobile money
- Auto top-up when balance falls below threshold
- Wallet-to-wallet transfer
- Transaction history with filtering
- Refund to wallet
- Withdrawal to bank account
- Promotional credits & bonuses
- Referral bonus credits

#### 3.5.4 Rider Earnings

- Per-task earnings breakdown
- Daily/weekly/monthly earnings dashboard
- Performance bonuses (completed tasks milestones)
- Tips from customers
- Automatic payout schedule (daily/weekly)
- Instant withdrawal option
- Earnings forecast based on activity
- Tax summary reports

#### 3.5.5 Invoicing

- Auto-generated invoices per transaction
- Monthly statement generation
- Corporate invoice consolidation
- PDF download & email delivery
- Tax-compliant invoice formatting

---

### 3.6 Ratings & Reviews

#### 3.6.1 Customer Reviews

- Rate rider (1-5 stars) after delivery
- Category-based ratings (punctuality, handling, communication)
- Written review with optional photo
- Review moderation system
- Response from rider to reviews

#### 3.6.2 Rider Reviews

- Rate customer (1-5 stars) after task
- Report problematic customers
- Feedback on pickup/drop-off location accuracy

#### 3.6.3 Rating Impact

- Rider deactivation threshold (below 3.5 stars)
- Priority matching for high-rated riders
- Badge system (Top Rider, Verified, etc.)
- Rating recovery program

---

### 3.7 Notifications

#### 3.7.1 Push Notifications

- New errand request (rider)
- Errand status updates (customer)
- Payment confirmations
- Promotional offers
- Scheduled errand reminders
- Rating reminders
- Rider approaching/arrived alerts

#### 3.7.2 SMS Notifications

- OTP verification
- Critical status updates
- Payment receipts
- Account security alerts

#### 3.7.3 Email Notifications

- Welcome email
- Account verification
- Weekly summaries
- Invoice/receipt delivery
- Marketing campaigns (opt-in)
- Account activity alerts

#### 3.7.4 In-App Notifications

- Notification center with read/unread status
- Notification grouping by category
- Deep linking to relevant screens
- Notification preferences management

---

### 3.8 Merchant Features

#### 3.8.1 Merchant Portal (Web Dashboard)

- Business registration & verification
- Store profile management (logo, hours, description)
- Product/service catalog management
- Inventory management
- Order management dashboard
- Revenue analytics & reports
- Payout management
- API integration for existing systems (webhook support)

#### 3.8.2 Catalog Management

- Product categories & subcategories
- Product listing (name, description, images, price)
- Variant management (size, color, etc.)
- Stock tracking & low-stock alerts
- Product availability scheduling
- Bulk import/export (CSV)
- Price management & promotional pricing

#### 3.8.3 Order Flow (Merchant)

- Incoming order notifications
- Order acceptance/rejection
- Preparation time estimation
- Ready-for-pickup notification to rider
- Order history & search
- Refund initiation

---

### 3.9 Admin Dashboard (Web)

#### 3.9.1 User Management

- View/search/filter all users (customers, riders, merchants)
- User detail view with activity history
- Account suspension / reactivation
- Manual user verification
- Role assignment & permissions
- Rider approval workflow
- Bulk user operations

#### 3.9.2 Errand Management

- Live errand monitoring (map view)
- Errand detail view with full timeline
- Manual errand assignment/reassignment
- Dispute resolution tools
- Errand cancellation & refund processing
- SLA monitoring & alerts

#### 3.9.3 Financial Management

- Revenue dashboard (daily, weekly, monthly, yearly)
- Transaction history with advanced filtering
- Commission configuration
- Payout management & approval
- Refund management
- Promotional credit management
- Financial reports & exports

#### 3.9.4 Pricing Management

- Base rate configuration per city/zone
- Surge pricing rules configuration
- Category pricing management
- Promotional campaign creation
- Discount code management
- Pricing simulation tool

#### 3.9.5 Analytics & Reporting

- Real-time operations dashboard
- Key metrics: GMV, active users, order volume, completion rate
- Rider utilization & performance reports
- Geographic heat maps (demand zones)
- Revenue breakdown by category/city
- Customer retention & churn analysis
- Rider retention & churn analysis
- Exportable reports (PDF, CSV, Excel)
- Scheduled report delivery via email

#### 3.9.6 System Configuration

- Feature flags management
- App configuration (radius, timeouts, limits)
- Notification template management
- Terms of service / privacy policy management
- City/zone/geofence management
- Vehicle type configuration
- Errand category configuration
- Commission rate configuration

#### 3.9.7 Content Management

- FAQ management
- Help articles & knowledge base
- Banner/promotion management
- In-app announcement management
- Push notification broadcasting

#### 3.9.8 Support Tools

- Customer support ticket system
- Live chat support integration
- Escalation workflows
- Canned responses library
- Support agent performance metrics

---

### 3.10 Safety & Security

#### 3.10.1 Rider Safety

- SOS/Emergency button
- Live location sharing with emergency contacts
- Trip recording (GPS trail)
- Incident reporting
- Safety checklists
- Insurance coverage information

#### 3.10.2 Customer Safety

- Rider identity verification before task
- Share trip details with contacts
- Anonymous communication (masked numbers)
- Delivery photo proof
- Signature capture on delivery
- Tamper-evident packaging guidelines

#### 3.10.3 Platform Security

- End-to-end encryption for sensitive data
- PCI DSS compliance for payment data
- Rate limiting & DDoS protection
- Fraud detection (unusual patterns, velocity checks)
- Two-factor authentication (optional)
- Audit logging for all admin actions
- Data retention & deletion policies
- GDPR / data privacy compliance

---

### 3.11 Promotions & Loyalty

#### 3.11.1 Promotional System

- Percentage-based discounts
- Flat-amount discounts
- First-ride/errand promotions
- Category-specific promotions
- Time-limited flash deals
- Referral codes & bonuses
- Promo code validation rules (usage limits, expiry, user eligibility)
- A/B testing for promotions

#### 3.11.2 Loyalty Program

- Points system (earn per spend)
- Tier levels (Bronze, Silver, Gold, Platinum)
- Tier-based benefits (priority matching, discounts, free deliveries)
- Points redemption for wallet credit
- Streak bonuses (consecutive days of usage)
- Birthday/anniversary rewards
- Partner rewards integration

#### 3.11.3 Referral Program

- Unique referral codes per user
- Reward for both referrer and referee
- Referral tracking dashboard
- Multi-level referral bonuses (optional)
- Social sharing integration

---

### 3.12 Customer Support

- In-app help center with FAQs
- In-app chat support (live agent)
- Chatbot for common queries
- Email support
- Phone support (call center integration)
- Ticket tracking with status updates
- Dispute resolution workflow
- Compensation/refund approval process
- Support rating after resolution

---

### 3.13 Offline & Edge Cases

- Offline mode for riders (queue status updates)
- Poor network handling (retry mechanisms)
- GPS fallback (cell tower triangulation)
- Cash payment reconciliation
- Undeliverable package workflow
- Rider accident/emergency protocol
- System downtime handling & user communication

---

## 4. Non-Functional Requirements

### 4.1 Performance

- API response time < 200ms (p95)
- Real-time tracking latency < 2 seconds
- Support 100,000+ concurrent users
- App cold start < 3 seconds
- Map rendering < 1 second

### 4.2 Scalability

- Horizontal scaling for API services
- Database read replicas for read-heavy operations
- Message queue for async operations
- CDN for static assets
- Auto-scaling based on demand

### 4.3 Availability

- 99.9% uptime SLA
- Multi-region deployment capability
- Graceful degradation under load
- Health checks & auto-recovery
- Blue-green deployments

### 4.4 Observability

- Centralized logging (structured logs)
- Distributed tracing
- Metrics & dashboards
- Alerting on anomalies
- Error tracking & reporting

### 4.5 Internationalization

- Multi-language support (i18n)
- Multi-currency support
- Right-to-left (RTL) layout support
- Local date/time formatting
- Phone number formatting by country

---

## 5. Third-Party Integrations

| Service                 | Provider Options               | Purpose                              |
| ----------------------- | ------------------------------ | ------------------------------------ |
| Maps & Geocoding        | Google Maps, Mapbox            | Map display, geocoding, routing, ETA |
| Payment Gateway         | Stripe, Paystack, Flutterwave  | Card payments, payouts               |
| Mobile Money            | MTN MoMo API, Airtel Money     | Mobile money payments                |
| SMS                     | Twilio, Africa's Talking       | OTP, notifications                   |
| Push Notifications      | Firebase Cloud Messaging, APNs | Push notifications                   |
| Email                   | SendGrid, AWS SES              | Transactional & marketing emails     |
| Identity Verification   | Smile Identity, Onfido         | KYC, ID verification                 |
| Cloud Storage           | AWS S3, Azure Blob             | Image/document storage               |
| Real-time Communication | SignalR, Twilio (VoIP)         | Chat, calls, live tracking           |
| Analytics               | Mixpanel, Amplitude            | User behavior analytics              |
| Crash Reporting         | Sentry, Firebase Crashlytics   | Error monitoring                     |
| CDN                     | CloudFront, Azure CDN          | Static asset delivery                |

---

## 6. Platform-Specific Features

### 6.1 User Mobile App (React Native)

- Bottom tab navigation (Home, Activity, Wallet, Profile)
- Interactive map with drag-to-pin
- Voice input for errand description
- Camera integration (photo proof, document scan)
- Contacts integration (select recipient from contacts)
- Deep linking support
- App widgets (recent errands, quick actions)
- Haptic feedback for key interactions
- Dark mode support
- Accessibility (screen reader, font scaling)

### 6.2 Rider Mobile App (React Native)

- Online/offline toggle
- Incoming request overlay with accept/reject
- Navigation integration (Google Maps, Waze, Apple Maps)
- Batch delivery management
- Earnings tracker (real-time today's earnings)
- Task checklist (pickup verification, delivery confirmation)
- Camera for proof of delivery
- Audio notifications for new tasks
- Battery & data optimization mode
- Heat map for demand zones

### 6.3 Web Dashboard (Next.js)

- Responsive design (desktop, tablet)
- Interactive data tables with sorting/filtering
- Real-time data updates (SignalR)
- Chart visualizations (Chart.js / Recharts)
- Map-based monitoring (Mapbox GL)
- Role-based access control (RBAC)
- Export functionality (CSV, PDF, Excel)
- Keyboard shortcuts for power users
- Multi-tab support without conflicts
- Print-optimized views for reports
