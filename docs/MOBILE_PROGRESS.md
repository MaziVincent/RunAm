# RunAm Mobile App — Implementation Progress

## Phase 1: Shared API Layer _(Foundation)_

| #   | Module                     | Status | Notes                                                                                             |
| --- | -------------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| 1   | `api/auth.ts`              | ✅     | Register, verify OTP, resend OTP, login, refresh token                                            |
| 2   | `api/errands.ts`           | ✅     | Create, list (paginated), detail, cancel, price estimate                                          |
| 3   | `api/wallet.ts`            | ✅     | Get wallet, transactions, top-up, withdraw, reserve account (Monnify), verify transaction         |
| 4   | `api/user.ts`              | ✅     | Get current user, update profile                                                                  |
| 5   | `api/addresses.ts`         | ✅     | List addresses, create address                                                                    |
| 6   | `api/rider.ts`             | ✅     | Create profile, status toggle, accept task, update task status, batch location, earnings, payouts |
| 7   | `api/notifications.ts`     | ✅     | List, unread count, mark read, mark all read, get/update preferences                              |
| 8   | `api/reviews.ts`           | ✅     | Create, my reviews, user reviews, summaries, errand reviews, flag                                 |
| 9   | `api/payments.ts`          | ✅     | Process payment, tip rider, validate promo                                                        |
| 10  | `api/chat.ts`              | ✅     | Get messages, send message, mark read                                                             |
| 11  | `api/support.ts`           | ✅     | Create ticket, list tickets, get ticket, reply                                                    |
| 12  | `api/vendors.ts`           | ✅     | Service categories, vendor list, vendor detail, products _(pre-existing)_                         |
| 13  | `api/vendor-management.ts` | ✅     | Vendor profile CRUD, analytics, categories CRUD, products CRUD, orders, availability toggle       |
| 14  | `api/location.ts`          | ✅     | Autocomplete, geocode                                                                             |
| 15  | `api/tracking.ts`          | ✅     | ETA, geofence check                                                                               |
| 16  | `api/files.ts`             | ✅     | Upload profile/product/vendor/rider images, delete file                                           |
| 17  | `api/index.ts` barrel      | ✅     | Re-exports all modules                                                                            |
| 18  | `client.ts` FormData fix   | ✅     | Skip JSON.stringify for FormData uploads                                                          |

---

## Phase 2: User App — Marketplace _(Biggest feature gap)_

| #   | Screen                         | Status | Notes                                   |
| --- | ------------------------------ | ------ | --------------------------------------- |
| 1   | `marketplace/index.tsx`        | ⬜     | Service category grid + search          |
| 2   | `marketplace/[category].tsx`   | ⬜     | Vendor list with filters                |
| 3   | `marketplace/vendor/[id].tsx`  | ⬜     | Vendor detail + products                |
| 4   | Product bottom sheet           | ⬜     | Variant/extra selection, add to cart    |
| 5   | `marketplace/cart.tsx`         | ⬜     | Cart items, delivery estimate, checkout |
| 6   | `marketplace/checkout.tsx`     | ⬜     | Address, payment, promo, place order    |
| 7   | `marketplace/confirmation.tsx` | ⬜     | Order success → track                   |

---

## Phase 3: User App — Wire Existing Screens to Backend

| #   | Screen                 | Status | Notes                                      |
| --- | ---------------------- | ------ | ------------------------------------------ |
| 1   | Errand creation wizard | ⬜     | Wire to errands.create + estimatePrice     |
| 2   | Activity list          | ⬜     | Wire to errands.list with real filtering   |
| 3   | Wallet                 | ⬜     | Wire to wallet.get + transactions + topUp  |
| 4   | Profile → Addresses    | ⬜     | Add create/edit/delete address screens     |
| 5   | Live tracking          | ⬜     | Verify with real errand data               |
| 6   | Chat                   | ⬜     | Wire to chat.getMessages + SignalR history |
| 7   | Rating/review          | ⬜     | Wire to reviews.submit                     |

---

## Phase 4: User App — New Feature Screens

| #   | Screen               | Status | Notes                          |
| --- | -------------------- | ------ | ------------------------------ |
| 1   | Notifications center | ⬜     | List + mark read + navigate    |
| 2   | Payment methods      | ⬜     | List, add, delete, set default |
| 3   | Promo codes          | ⬜     | Input, validate, show discount |
| 4   | My reviews           | ⬜     | List submitted reviews         |
| 5   | Change password      | ⬜     | Current + new password form    |
| 6   | Support tickets      | ⬜     | Create, list, reply            |

---

## Phase 5: Rider App — Wire Existing Screens to Backend

| #   | Screen             | Status | Notes                              |
| --- | ------------------ | ------ | ---------------------------------- |
| 1   | Home (task stream) | ⬜     | Wire to rider.getAvailableTasks    |
| 2   | Accept/decline     | ⬜     | Wire to rider.acceptTask           |
| 3   | Active task        | ⬜     | Wire to rider.updateTaskStatus     |
| 4   | Earnings           | ⬜     | Wire to rider.getEarnings + wallet |
| 5   | Withdrawal         | ⬜     | Wire to wallet.withdraw (Monnify)  |
| 6   | Online toggle      | ⬜     | Wire to rider.updateStatus + GPS   |
| 7   | Onboarding         | ⬜     | Wire to rider.createProfile        |
| 8   | Performance        | ⬜     | Wire to rider.getPerformance       |
| 9   | Leaderboard        | ⬜     | Wire to leaderboard API            |
| 10  | My ratings         | ⬜     | Wire to reviews API                |

---

## Phase 6: Rider App — New Feature Screens

| #   | Screen               | Status | Notes                          |
| --- | -------------------- | ------ | ------------------------------ |
| 1   | Bank accounts CRUD   | ⬜     | List, add, delete, set default |
| 2   | Document upload      | ⬜     | Camera/gallery → Cloudinary    |
| 3   | Vehicle info edit    | ⬜     | Edit type, plate, re-verify    |
| 4   | Notifications center | ⬜     | Same as user app pattern       |

---

## Phase 7: Vendor App _(New app)_

| #   | Screen             | Status | Notes                                 |
| --- | ------------------ | ------ | ------------------------------------- |
| 1   | Vendor onboarding  | ⬜     | Business name, category, address      |
| 2   | Dashboard          | ⬜     | Today's orders, revenue, pending      |
| 3   | Orders list        | ⬜     | Tabs: incoming/active/completed       |
| 4   | Order detail       | ⬜     | Items, customer info, actions         |
| 5   | Products list      | ⬜     | Grid, toggle availability, CRUD       |
| 6   | Product form       | ⬜     | Name, price, images, variants, extras |
| 7   | Product categories | ⬜     | CRUD for organizing products          |
| 8   | Store settings     | ⬜     | Open/close, hours, delivery fee       |
| 9   | Analytics          | ⬜     | Revenue, orders, top products         |
| 10  | Payouts            | ⬜     | Earnings history, request payout      |
| 11  | Reviews            | ⬜     | Customer reviews list                 |
| 12  | Profile/settings   | ⬜     | Store info, bank details              |

---

_Legend: ✅ Done | 🔄 In Progress | ⬜ Not Started_
