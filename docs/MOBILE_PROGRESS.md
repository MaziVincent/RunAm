# RunAm Mobile App — Implementation Progress

## Phase 1: Shared API Layer _(Foundation)_

| #   | Module                     | Status | Notes                                                                                                                                                                                               |
| --- | -------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `api/auth.ts`              | ✅     | Register, verify OTP, resend OTP, login, refresh token                                                                                                                                              |
| 2   | `api/errands.ts`           | ✅     | Create, list (paginated), detail, cancel, price estimate                                                                                                                                            |
| 3   | `api/wallet.ts`            | ✅     | Get wallet, transactions, top-up, withdraw, reserve account (Monnify), verify transaction                                                                                                           |
| 4   | `api/user.ts`              | ✅     | Get current user, update profile                                                                                                                                                                    |
| 5   | `api/addresses.ts`         | ✅     | List addresses, create address                                                                                                                                                                      |
| 6   | `api/rider.ts`             | ✅     | Profile, status toggle, available/active tasks, accept/reject, update status, location, earnings, weekly chart, performance, bonuses, bank accounts, leaderboard, vehicle info, push token, payouts |
| 7   | `api/notifications.ts`     | ✅     | List, unread count, mark read, mark all read, get/update preferences                                                                                                                                |
| 8   | `api/reviews.ts`           | ✅     | Create, my reviews, user reviews, summaries, errand reviews, flag                                                                                                                                   |
| 9   | `api/payments.ts`          | ✅     | Process payment, tip rider, validate promo                                                                                                                                                          |
| 10  | `api/chat.ts`              | ✅     | Get messages, send message, mark read                                                                                                                                                               |
| 11  | `api/support.ts`           | ✅     | Create ticket, list tickets, get ticket, reply                                                                                                                                                      |
| 12  | `api/vendors.ts`           | ✅     | Service categories, vendor list, vendor detail, products _(pre-existing)_                                                                                                                           |
| 13  | `api/vendor-management.ts` | ✅     | Vendor profile CRUD, analytics, categories CRUD, products CRUD, orders, availability toggle                                                                                                         |
| 14  | `api/location.ts`          | ✅     | Autocomplete, geocode                                                                                                                                                                               |
| 15  | `api/tracking.ts`          | ✅     | ETA, geofence check                                                                                                                                                                                 |
| 16  | `api/files.ts`             | ✅     | Upload profile/product/vendor/rider images, delete file                                                                                                                                             |
| 17  | `api/index.ts` barrel      | ✅     | Re-exports all modules                                                                                                                                                                              |
| 18  | `client.ts` FormData fix   | ✅     | Skip JSON.stringify for FormData uploads                                                                                                                                                            |
| 19  | `client.ts` pagination     | ✅     | `getPaginated<T>()` + `PaginatedResult<T>` to properly read response meta                                                                                                                           |
| 20  | Vendor param name fix      | ✅     | `latitude→lat`, `longitude→lng`, `radiusKm→radius` to match backend                                                                                                                                 |
| 21  | Backend pagination meta    | ✅     | 6 controllers + repos + handlers now return PaginationMeta in envelope                                                                                                                              |

---

## Phase 2: User App — Marketplace _(Biggest feature gap)_

| #   | Screen                               | Status | Notes                                                             |
| --- | ------------------------------------ | ------ | ----------------------------------------------------------------- |
| 1   | `vendors/categories.tsx`             | ✅     | Service category grid (pre-built)                                 |
| 2   | `vendors/list.tsx`                   | ✅     | Vendor list with search, fixed PaginatedResult usage              |
| 3   | `vendors/[id].tsx`                   | ✅     | Vendor detail + product grid + cart FAB (pre-built)               |
| 4   | `vendors/product.tsx`                | ✅     | Variant/extra selection, add-to-cart modal (pre-built)            |
| 5   | `cart.tsx`                           | ✅     | Cart items with qty controls, now navigates to checkout           |
| 6   | `checkout.tsx`                       | ✅     | Address selection, recipient, promo, order summary, pay           |
| 7   | `order-confirmation.tsx`             | ✅     | Order success → track or go home                                  |
| 8   | Backend: `POST /errands/marketplace` | ✅     | CreateMarketplaceOrderCommand + endpoint                          |
| 9   | `api/errands.ts` marketplace         | ✅     | `createMarketplaceOrder()` + `CreateMarketplaceOrderRequest` type |
| 10  | Cart store                           | ✅     | Zustand + SecureStore persistence (pre-built)                     |

---

## Phase 3: User App — Wire Existing Screens to Backend

| #   | Screen                 | Status | Notes                                                                                                         |
| --- | ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | Errand creation wizard | ✅     | Uses shared `createErrand()`, `getDeliveryEstimate()`, `validatePromoCode()`, `getPaymentMethods()`           |
| 2   | Activity list          | ✅     | Uses shared `getErrands()` with pagination                                                                    |
| 3   | Wallet                 | ✅     | Uses shared `getWallet()`, `getWalletTransactions()`, `topUpWallet()`                                         |
| 4   | Profile → Addresses    | ✅     | Uses shared `getAddresses()`, settings wired to feature screens                                               |
| 5   | Live tracking          | ✅     | Uses shared `getErrandById()`, `cancelErrand()`, SignalR live updates                                         |
| 6   | Chat                   | ✅     | Uses shared `getMessages()`, `sendMessage()`, `markMessagesAsRead()` + SignalR                                |
| 7   | Rating/review          | ✅     | Uses shared `createReview()`                                                                                  |
| 8   | Notifications          | ✅     | Uses shared `getNotifications()`, `markAsRead()`, `markAllAsRead()`                                           |
| 9   | Notification prefs     | ✅     | Uses shared `getNotificationPreferences()`, `updateNotificationPreferences()`                                 |
| 10  | Payment methods        | ✅     | Uses shared `getPaymentMethods()`, `addPaymentMethod()`, `deletePaymentMethod()`, `setDefaultPaymentMethod()` |
| 11  | Promo codes            | ✅     | Uses shared `getPromoCodes()`, `redeemPromoCode()`                                                            |
| 12  | Support tickets        | ✅     | Uses shared `getSupportTickets()`, `createSupportTicket()`, `replyToTicket()`                                 |

---

## Phase 4: User App — New Feature Screens

| #   | Screen               | Status | Notes                                                       |
| --- | -------------------- | ------ | ----------------------------------------------------------- |
| 1   | Notifications center | ✅     | List + mark read/all-read + type icons + time-ago           |
| 2   | Payment methods      | ✅     | List, add card modal, delete, set default                   |
| 3   | Promo codes          | ✅     | Redeem input + active promos list                           |
| 4   | My reviews           | ✅     | Summary card + paginated review list                        |
| 5   | Change password      | ✅     | Form with validation + backend `POST /auth/change-password` |
| 6   | Support tickets      | ✅     | Create (category picker), list, detail + reply              |

---

## Phase 5: Rider App — Wire Existing Screens to Backend

| #   | Screen             | Status | Notes                                                                                                                |
| --- | ------------------ | ------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Home (task stream) | ✅     | Uses shared `getAvailableTasks()`, `registerPushToken()`, SignalR live updates                                       |
| 2   | Accept/decline     | ✅     | Uses shared `acceptTask()`, `rejectTask()`                                                                           |
| 3   | Active task        | ✅     | Uses shared `getActiveTasks()`, `updateTaskStatus()`                                                                 |
| 4   | Earnings           | ✅     | Uses shared `getRiderEarnings()`, `getRiderWeeklyEarnings()`, `getRiderBankAccounts()`, `getWallet()`                |
| 5   | Withdrawal         | ✅     | Uses shared `withdrawFromWallet()`                                                                                   |
| 6   | Online toggle      | ✅     | Uses shared `updateRiderStatus()` + GPS + SignalR                                                                    |
| 7   | Onboarding         | ✅     | Uses shared `onboardRider()`                                                                                         |
| 8   | Performance        | ✅     | Uses shared `getRiderPerformance()`, `getRiderBonuses()`                                                             |
| 9   | Leaderboard        | ✅     | Uses shared `getLeaderboard()`                                                                                       |
| 10  | My ratings         | ✅     | Uses shared `getMyReviewSummary()`, `getMyReviews()`                                                                 |
| 11  | Notifications      | ✅     | Uses shared `getNotifications()`, `markAsRead()`, `markAllAsRead()`                                                  |
| 12  | Bank accounts      | ✅     | Uses shared `getRiderBankAccounts()`, `addRiderBankAccount()`, `deleteRiderBankAccount()`, `setDefaultBankAccount()` |
| 13  | Errand active      | ✅     | Uses shared `getErrandById()`, `updateTaskStatus()`                                                                  |
| 14  | Errand chat        | ✅     | Uses shared `getMessages()`, `sendMessage()`                                                                         |
| 15  | Login              | ✅     | Uses shared `login()`                                                                                                |
| 16  | Profile            | ✅     | Uses shared `getRiderProfile()`                                                                                      |

---

## Phase 6: Rider App — New Feature Screens

| #   | Screen             | Status | Notes                                                                                        |
| --- | ------------------ | ------ | -------------------------------------------------------------------------------------------- |
| 1   | Bank accounts CRUD | ✅     | Already existed, wired to shared API in Phase 5                                              |
| 2   | Document upload    | ✅     | New `documents.tsx` — camera/gallery picker, per-document upload via `uploadRiderDocument()` |
| 3   | Vehicle info edit  | ✅     | New `vehicle.tsx` — edit type + plate via `updateVehicleInfo()`, shows verification status   |
| 4   | Change password    | ✅     | New `change-password.tsx` — uses shared `changePassword()`                                   |
| 5   | Profile handlers   | ✅     | Vehicle Info, Documents, Change Password now navigate to new screens                         |

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
