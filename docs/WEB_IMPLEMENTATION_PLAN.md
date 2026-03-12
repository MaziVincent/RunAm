# RunAm — Web Implementation Plan

> **Version:** 1.0
> **Date:** March 11, 2026
> **Scope:** Public-facing web (Landing, Shop/Store, User Dashboard, Vendor Dashboard, Rider Dashboard, Cart & Checkout)
> **Stack:** Next.js 14 (App Router) · TypeScript 5.7 · TailwindCSS 3.4 · shadcn/ui · Zustand 5 · TanStack Query 5 · React Hook Form + Zod · Framer Motion · Mapbox GL JS · Recharts · SignalR

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Architecture & Design System](#2-architecture--design-system)
3. [Landing Page](#3-landing-page)
4. [Shop / Store (Marketplace)](#4-shop--store-marketplace)
5. [User Dashboard](#5-user-dashboard)
6. [Vendor Dashboard](#6-vendor-dashboard)
7. [Cart & Checkout](#7-cart--checkout)
8. [Rider Dashboard](#8-rider-dashboard)
9. [Backend Recommendations](#9-backend-recommendations)
10. [Implementation Phases & Timeline](#10-implementation-phases--timeline)

---

## 1. Current State Assessment

### What Exists

| Layer | Status | Notes |
|-------|--------|-------|
| **Backend API** | ✅ Complete | 15 controllers, 47 CQRS handlers, 24 entities, 14+ repository interfaces, 4 SignalR hubs, full auth/payments/notifications/vendor/marketplace pipeline |
| **Web Admin Dashboard** | ✅ Scaffold | 11 pages (users, riders, vendors, errands, finance, reviews, tracking, service-categories). All admin-oriented. Functional but plain — inline Tailwind, no component library, no reusable primitives |
| **Web Public Pages** | ❌ Missing | No landing page, no shop/store, no user/vendor/rider dashboard |
| **Shared Types** | ✅ Complete | `web/src/types/index.ts` (599 lines) mirrors all backend DTOs |
| **API Client** | ✅ Complete | JWT-authenticated fetch wrapper with auto-redirect on 401 |
| **SignalR Client** | ✅ Complete | Singleton hub connections (tracking, chat, notifications, admin) |
| **Auth Store** | ✅ Complete | Zustand store with login/logout/hydrate |
| **Mobile Cart Store** | ✅ Exists in mobile | Full cart logic in `mobile/packages/shared/stores/cart-store.ts` — needs web port |

### Critical Gaps

1. **No design system** — everything is inline Tailwind. Need shadcn/ui component library.
2. **No public-facing pages** — landing, shop, user flows all missing.
3. **No role-based routing** — current dashboard assumes admin; no user/vendor/rider views.
4. **No cart/checkout** — only exists in mobile store.
5. **No map integration** — tracking page has a placeholder div.
6. **No analytics/charts** — Recharts installed but unused.
7. **No image handling** — no upload UI, no optimized image components for product/vendor images.
8. **No SEO/metadata** — no `metadata` exports, no OG images, no structured data.

---

## 2. Architecture & Design System

### 2.1 Route Architecture

```
web/src/app/
├── (marketing)/                    # Public — no auth required
│   ├── page.tsx                    # Landing page
│   ├── about/page.tsx
│   ├── how-it-works/page.tsx
│   ├── contact/page.tsx
│   └── layout.tsx                  # Marketing navbar + footer
│
├── (shop)/                         # Public marketplace — optional auth
│   ├── layout.tsx                  # Shop navbar (categories, search, cart icon)
│   ├── page.tsx                    # Shop home — featured vendors, categories
│   ├── categories/
│   │   └── [slug]/page.tsx         # Vendors in category
│   ├── vendors/
│   │   └── [id]/page.tsx           # Vendor storefront (menu/catalog)
│   ├── cart/page.tsx               # Cart review
│   └── checkout/page.tsx           # Auth-gated checkout
│
├── (auth)/                         # Existing — login, register
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── verify/page.tsx
│
├── (user)/                         # Customer dashboard — requires Customer role
│   ├── layout.tsx
│   ├── page.tsx                    # Dashboard home
│   ├── errands/
│   │   ├── page.tsx                # My errands list
│   │   ├── new/page.tsx            # Create errand wizard
│   │   └── [id]/page.tsx           # Errand detail + live tracking
│   ├── orders/page.tsx             # Marketplace orders
│   ├── wallet/page.tsx             # Wallet + transactions
│   ├── addresses/page.tsx          # Address book
│   ├── reviews/page.tsx            # My reviews
│   ├── notifications/page.tsx      # Notification center
│   ├── support/page.tsx            # Help & tickets
│   └── settings/page.tsx           # Profile, preferences, security
│
├── (vendor)/                       # Merchant dashboard — requires Merchant role
│   ├── layout.tsx
│   ├── page.tsx                    # Vendor dashboard home
│   ├── onboarding/page.tsx         # Vendor registration wizard
│   ├── store/page.tsx              # Store profile editor
│   ├── products/
│   │   ├── page.tsx                # Product catalog manager
│   │   └── [id]/page.tsx           # Product editor
│   ├── categories/page.tsx         # Product category manager
│   ├── orders/
│   │   ├── page.tsx                # Incoming/active orders
│   │   └── [id]/page.tsx           # Order detail
│   ├── analytics/page.tsx          # Revenue, orders, ratings charts
│   ├── reviews/page.tsx            # Customer reviews
│   ├── payouts/page.tsx            # Payout history
│   ├── notifications/page.tsx
│   └── settings/page.tsx           # Business settings, hours, delivery fees
│
├── (rider)/                        # Rider dashboard — requires Rider role
│   ├── layout.tsx
│   ├── page.tsx                    # Rider dashboard home
│   ├── onboarding/page.tsx         # Rider KYC onboarding wizard
│   ├── tasks/
│   │   ├── page.tsx                # Available/active tasks
│   │   └── [id]/page.tsx           # Task detail + navigation
│   ├── earnings/page.tsx           # Earnings + payout history
│   ├── performance/page.tsx        # Stats, ratings, leaderboard
│   ├── wallet/page.tsx             # Wallet
│   ├── notifications/page.tsx
│   └── settings/page.tsx           # Vehicle info, availability, bank details
│
├── (admin)/                        # Existing admin dashboard — refactored
│   └── ...                         # (existing pages, upgraded with shadcn/ui)
│
└── api/                            # Next.js API routes (if needed for BFF patterns)
```

### 2.2 Design System — shadcn/ui Foundation

**Why shadcn/ui:** Unstyled Radix primitives + Tailwind. Copy-paste ownership (not an npm dependency). Already recommended in the IMPLEMENTATION_PLAN.md. Fully customizable, accessible (WAI-ARIA), composable.

**Component Library Plan:**

| Layer | Components |
|-------|-----------|
| **Primitives** | `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Label`, `Badge`, `Separator`, `Skeleton`, `Spinner` |
| **Layout** | `Card`, `Sheet` (mobile drawer), `Dialog`, `Popover`, `Tooltip`, `Tabs`, `Accordion`, `Collapsible` |
| **Data Display** | `Table`, `DataTable` (TanStack Table + pagination + sorting + filtering), `Avatar`, `HoverCard` |
| **Navigation** | `NavigationMenu`, `Breadcrumb`, `Pagination`, `Command` (⌘K search), `DropdownMenu`, `Menubar` |
| **Feedback** | `Toast` (sonner), `Alert`, `AlertDialog`, `Progress`, `EmptyState` |
| **Forms** | `Form` (react-hook-form integration), `FormField`, `FormItem`, `Calendar`, `DatePicker`, `Combobox`, `FileUpload` |
| **Custom** | `PriceTag`, `RatingStars`, `StatusBadge`, `VendorCard`, `ProductCard`, `ErrandTimeline`, `MapView`, `ChatBubble`, `NotificationItem` |

**Design Tokens (CSS Variables):**

```css
/* Already partially in globals.css — extend to: */
--brand-primary: 142 71% 45%;     /* Green — action, CTAs */
--brand-secondary: 221 83% 53%;   /* Blue — info, links */
--brand-accent: 25 95% 53%;       /* Orange — urgency, alerts */
--brand-surface: 0 0% 100%;       /* Card backgrounds */
--radius: 0.75rem;                /* Rounded-xl default */
--shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
```

**Typography Scale:**

```
Display:   text-4xl md:text-5xl lg:text-6xl  — Landing hero
Heading 1: text-3xl md:text-4xl              — Page titles
Heading 2: text-2xl md:text-3xl              — Section titles
Heading 3: text-xl md:text-2xl               — Card titles
Body:      text-base                         — Default
Small:     text-sm                           — Labels, captions
Micro:     text-xs                           — Badges, timestamps
```

### 2.3 State Management Strategy

| Concern | Solution | Why |
|---------|----------|-----|
| Server state (API data) | **TanStack Query 5** | Caching, background refetch, optimistic updates, pagination |
| Auth state | **Zustand** (existing `auth-store`) | Persisted client state, hydrate from localStorage |
| Cart state | **Zustand** (new `cart-store`) | Port from mobile, persist to localStorage |
| Real-time state | **SignalR** + Zustand | Existing hub connections → pipe into Zustand slices |
| Form state | **React Hook Form + Zod** | Already in use — extend with shadcn/ui Form components |
| UI state | **React `useState`/`useReducer`** | Ephemeral — modals, tabs, sidebar toggle |
| URL state | **Next.js `searchParams`** | Filters, pagination, search queries — shareable URLs |

### 2.4 Data Fetching Patterns

```typescript
// hooks/use-vendors.ts — example pattern
export function useVendors(params: VendorQueryParams) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => api.get<PaginatedResponse<VendorDto>>('/vendors', params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useVendorDetail(id: string) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: () => api.get<VendorDetailDto>(`/vendors/${id}`),
    staleTime: 60_000,
  });
}

// Mutations with optimistic updates
export function useConfirmOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmOrderRequest) =>
      api.post(`/vendors/me/orders/${data.orderId}/confirm`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    },
  });
}
```

---

## 3. Landing Page

### 3.1 Design Philosophy

**Approach:** High-conversion, scroll-driven storytelling with micro-interactions. Think Uber × DoorDash × Gojek landing pages — bold typography, real photography/illustrations, social proof, and a single dominant CTA ("Get Started").

**Performance Targets:** Lighthouse 95+ (Performance), <2s LCP, <100ms FID, 0 CLS.

### 3.2 Section Breakdown

| # | Section | Content | UI Pattern |
|---|---------|---------|-----------|
| 1 | **Hero** | Headline ("Errands done. Deliveries made. Life simplified."), subheadline, dual CTA ("Send a Package" + "Order from a Store"), animated illustration or looping video background, floating trust indicators (4.8★, "10K+ deliveries", "500+ vendors") | Full-viewport hero with gradient overlay, `framer-motion` entrance animations, responsive: stacked on mobile, split on desktop |
| 2 | **How It Works** | 3-step flow: (1) Choose service → (2) We match a runner → (3) Track & receive. Each with icon, title, description | Horizontal step cards with connecting lines, animated on scroll via `useInView` |
| 3 | **Service Categories** | Grid of service category cards pulled from `/api/v1/service-categories`. Each with icon, name, short description. Click → shop category page | CSS Grid (2 cols mobile, 3 tablet, 4 desktop), `Image` optimization, staggered reveal |
| 4 | **Featured Vendors** | Carousel of top-rated vendors from `/api/v1/vendors?sort=rating&limit=8`. Vendor card: image, name, category badges, rating, delivery time | `embla-carousel` (lightweight, accessible) with auto-play, drag, snap |
| 5 | **Why RunAm** | Value props: Real-time tracking, Secure payments, Verified riders, 24/7 support. Each with illustration + stat | Alternating left/right layout (image + text), parallax subtle effect |
| 6 | **Stats / Social Proof** | Animated counters: "50K+ deliveries", "2K+ riders", "500+ vendors", "4.8★ avg rating" | `countUp` animation triggered on scroll, large monospace numbers |
| 7 | **Testimonials** | Customer quotes with avatar, name, role, star rating | Masonry or carousel, real photos, subtle card elevation |
| 8 | **Download / CTA** | "Get the App" with App Store + Play Store badges, QR code, phone mockup. Or "Start on Web" CTA for marketplace | Split layout: phone mockup left, download links right |
| 9 | **Footer** | Links (About, How It Works, Become a Rider, Become a Vendor, Help, Privacy, Terms), social icons, newsletter signup | 4-column grid, dark background, `lucide-react` social icons |

### 3.3 Technical Implementation

```
(marketing)/
├── layout.tsx              # Transparent navbar → solid on scroll, mobile hamburger
├── page.tsx                # Landing — composes all sections
├── _components/
│   ├── hero.tsx
│   ├── how-it-works.tsx
│   ├── service-categories.tsx   # Server Component — fetches categories at build
│   ├── featured-vendors.tsx     # Server Component — fetches top vendors
│   ├── value-props.tsx
│   ├── stats-counter.tsx        # Client Component — intersection observer + countUp
│   ├── testimonials.tsx
│   ├── cta-download.tsx
│   └── footer.tsx
```

**Key Decisions:**
- **Server Components** for data-fetching sections (categories, vendors) — zero JS shipped for those.
- **Client Components** only where interactivity is needed (counter animations, carousel, mobile nav).
- **Metadata:** Full SEO with `generateMetadata`, JSON-LD structured data (`LocalBusiness`), OG image via `opengraph-image.tsx`.
- **Images:** Next.js `<Image>` with `priority` on hero, WebP/AVIF format negotiation, blur placeholders.
- **Animations:** `framer-motion` for hero entrance, `useInView` for scroll-triggered reveals. Keep animations subtle — no jank on low-end devices. Use `prefers-reduced-motion` media query.

### 3.4 Navbar Design

```
┌─────────────────────────────────────────────────────────────────┐
│  🏃 RunAm     How It Works    Shop    Become a Rider    About  │
│                                              [Login] [Sign Up] │
└─────────────────────────────────────────────────────────────────┘
```

- Transparent on landing hero, solid `backdrop-blur` background on scroll (via `useScrollPosition` hook).
- Mobile: hamburger → slide-in Sheet (shadcn/ui).
- Authenticated users: replace Login/Sign Up with avatar dropdown → Dashboard, Settings, Logout.

---

## 4. Shop / Store (Marketplace)

### 4.1 Design Philosophy

**Approach:** Browse-first, visual-heavy, mobile-friendly grid. Inspired by Glovo, Uber Eats, and Jumia Food. The marketplace is the **core revenue driver** — every UX decision should reduce friction between "I want something" and "order placed."

**Key UX Principles:**
1. **Category-first navigation** — users start by need, not by vendor name.
2. **Location awareness** — show nearby vendors, delivery time estimates, delivery fees.
3. **Persistent cart** — always visible, one-click access, cross-session persistence.
4. **Progressive disclosure** — show just enough info to decide, detail on demand.
5. **Search as a first-class citizen** — global search across vendors + products.

### 4.2 Page Breakdown

#### 4.2.1 Shop Home (`/shop`)

```
┌───────────────────────────────────────────────────────────┐
│  🔍 Search for restaurants, stores, or items...    🛒 (3) │
├───────────────────────────────────────────────────────────┤
│  📍 Delivering to: Lekki Phase 1  [Change]                │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ── Categories ──────────────────────────────────────     │
│  [🍔 Food]  [🛒 Grocery]  [💊 Pharmacy]  [📦 Package]    │
│  [👕 Laundry]  [📄 Documents]  [🔧 Custom]  [→ More]     │
│                                                           │
│  ── Featured Vendors ────────────────────────────────     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  img     │ │  img     │ │  img     │ │  img     │    │
│  │ Chicken  │ │ FreshMart│ │ QuickRx  │ │ Mama's   │    │
│  │ Republic │ │          │ │ Pharmacy │ │ Kitchen  │    │
│  │ ⭐ 4.8   │ │ ⭐ 4.6   │ │ ⭐ 4.9   │ │ ⭐ 4.7   │    │
│  │ 25-35min │ │ 30-45min │ │ 15-25min │ │ 20-30min │    │
│  │ ₦500 del │ │ ₦800 del │ │ Free del │ │ ₦300 del │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  ── Popular Near You ────────────────────────────────     │
│  (similar grid, sorted by proximity + rating)             │
│                                                           │
│  ── New on RunAm ────────────────────────────────────     │
│  (recently approved vendors)                              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Data Flow:**
- Categories: `GET /service-categories` → cached aggressively (staleTime: 5 min).
- Featured: `GET /vendors?sort=rating&limit=8` with user's lat/lng if available.
- Popular: `GET /vendors?sort=distance&latitude=X&longitude=Y&radius=10&limit=12`.
- New: `GET /vendors?sort=newest&limit=8`.

**UI Components:**
- `<SearchBar>` — Combobox with debounced search hitting `GET /vendors?search=X` and potentially a future product-search endpoint. Show recent searches, trending searches.
- `<LocationPicker>` — Google Places Autocomplete or Mapbox geocoding. Stores lat/lng in Zustand or URL params.
- `<CategoryPill>` — Horizontally scrollable category chips. Active state with underline/fill.
- `<VendorCard>` — Image (16:9 aspect, `object-cover`), vendor name, category badges, rating stars, delivery time estimate, delivery fee, "Open"/"Closed" badge overlay. Hover: subtle scale + shadow.

#### 4.2.2 Category Page (`/shop/categories/[slug]`)

```
┌───────────────────────────────────────────────────────────┐
│  🔍 Search food vendors...                         🛒 (3) │
├───────────────────────────────────────────────────────────┤
│  ← Back    Food Delivery                                  │
│                                                           │
│  [Sort: Recommended ▾]  [Rating: 4+ ★]  [Delivery: Free] │
│  [Open Now]  [Min Order: < ₦2000]                         │
│                                                           │
│  ── 24 vendors ──────────────────────────────────────     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ Vendor   │ │ Vendor   │ │ Vendor   │ ...              │
│  │ Cards    │ │ Cards    │ │ Cards    │                  │
│  │ (same as │ │ (same as │ │ (same as │                  │
│  │  above)  │ │  above)  │ │  above)  │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
│                                                           │
│  [Load More] or infinite scroll                           │
└───────────────────────────────────────────────────────────┘
```

**Filters (URL searchParams for shareability):**
- Sort: Recommended (default), Rating, Delivery Time, Delivery Fee, Distance
- Rating: 4+, 3+, Any
- Delivery Fee: Free, Under ₦500, Under ₦1000
- Open Now toggle
- Minimum Order filter

**Implementation:** Filters map to `GET /vendors?categoryId=X&sort=Y&minRating=Z&...` query params. Use `useSearchParams` + TanStack Query with `keepPreviousData` for smooth filtering.

#### 4.2.3 Vendor Storefront (`/shop/vendors/[id]`)

This is the **most critical conversion page** — user decides to add items here.

```
┌───────────────────────────────────────────────────────────┐
│  ← Back to Food Delivery                           🛒 (3) │
├───────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Hero Banner Image (16:9)                │  │
│  │                                                     │  │
│  │  Chicken Republic                                    │  │
│  │  ⭐ 4.8 (324 reviews) · Food · 25-35 min · ₦500 del│  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  [ℹ Info]  [⭐ Reviews]  [📍 Location]                    │
│                                                           │
│  🔍 Search this menu...                                   │
│                                                           │
│  ── Sticky Category Nav ──────────────────────────────    │
│  [Popular] [Chicken] [Burgers] [Sides] [Drinks] [Combos] │
│                                                           │
│  ── Popular Items ────────────────────────────────────    │
│  ┌────────────────────────────────────────┐ ┌──────────┐ │
│  │ Chicken & Chips Combo                  │ │   img    │ │
│  │ Crispy fried chicken with fries & cole │ │          │ │
│  │ ₦3,500    ₦4,200 (strikethrough)      │ │   [+]    │ │
│  └────────────────────────────────────────┘ └──────────┘ │
│                                                           │
│  ┌────────────────────────────────────────┐ ┌──────────┐ │
│  │ Jollof Rice with Chicken               │ │   img    │ │
│  │ Classic Nigerian jollof rice...         │ │          │ │
│  │ ₦2,800                                │ │   [+]    │ │
│  └────────────────────────────────────────┘ └──────────┘ │
│                                                           │
│  ── Chicken ──────────────────────────────────────────    │
│  (more items...)                                          │
│                                                           │
│  ═══════════════════════════════════════════════════════  │
│  │ 🛒  View Cart · 3 items · ₦9,100     [Checkout →] │  │
│  ═══════════════════════════════════════════════════════  │
└───────────────────────────────────────────────────────────┘
```

**Technical Details:**

- **Sticky category nav:** `IntersectionObserver` tracks which product category section is in view → highlights the corresponding nav tab. Clicking a tab scrolls to that section (`scrollIntoView({ behavior: 'smooth' })`).
- **Product item row:** Horizontal layout: text left, image right. Shows name, description (truncated 2 lines), price, compare-at price (strikethrough), `[+]` button. If product has variants/extras → clicking `[+]` opens a **Product Customization Sheet**.
- **Product Customization Sheet** (Dialog/Sheet):
  ```
  ┌──────────────────────────────────────┐
  │  Chicken & Chips Combo         [×]   │
  │  ┌──────────────────────────────┐    │
  │  │       Product Image          │    │
  │  └──────────────────────────────┘    │
  │                                      │
  │  ── Size (Required) ──────────       │
  │  ○ Regular  ₦3,500                   │
  │  ● Large    ₦4,500  (+₦1,000)       │
  │                                      │
  │  ── Extras ─────────────────────     │
  │  ☐ Extra Coleslaw  +₦500            │
  │  ☑ Plantain        +₦400            │
  │  ☐ Extra Sauce     +₦200            │
  │                                      │
  │  ── Special Instructions ──────      │
  │  [No onions please...            ]   │
  │                                      │
  │  [-]  2  [+]                         │
  │                                      │
  │  [Add to Cart · ₦9,800]             │
  └──────────────────────────────────────┘
  ```
- **Floating cart bar:** Fixed to bottom of viewport when items are in cart. Shows item count, subtotal, "Checkout" CTA. Slides up with animation.
- **Vendor info:** Operating hours, address (with mini map), minimum order amount, delivery fee calculation.
- **Reviews tab:** Paginated vendor reviews from `GET /reviews?vendorId=X`.

**Data:** `GET /vendors/{id}` returns `VendorDetailDto` with product categories + products nested. Single request, render everything.

#### 4.2.4 Search Results

**Global search** (`/shop?q=chicken`):
- Searches vendors by name AND products by name (requires backend enhancement — see [Section 9](#9-backend-recommendations)).
- Tabbed results: "Vendors" | "Products" | "All"
- Product results show vendor name + link to vendor page with product highlighted.

### 4.3 Component Architecture

```
components/
├── ui/                         # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── skeleton.tsx
│   ├── tabs.tsx
│   ├── toast.tsx              # sonner
│   └── ... (30+ components)
│
├── shop/                       # Shop-specific compounds
│   ├── vendor-card.tsx         # Card with image, rating, delivery info
│   ├── product-item.tsx        # Row item in vendor menu
│   ├── product-sheet.tsx       # Customization dialog
│   ├── category-pills.tsx      # Horizontal scrollable categories
│   ├── search-bar.tsx          # Global search combobox
│   ├── location-picker.tsx     # Address autocomplete
│   ├── cart-bar.tsx            # Floating bottom cart summary
│   ├── cart-drawer.tsx         # Full cart sheet (right side)
│   ├── vendor-hero.tsx         # Banner + info header
│   ├── menu-nav.tsx            # Sticky scrollspy category nav
│   ├── filter-bar.tsx          # Sort + filter chips
│   ├── rating-stars.tsx        # ★★★★☆ display
│   └── price-tag.tsx           # ₦ with strikethrough support
│
├── layout/                     # Shared layouts
│   ├── marketing-navbar.tsx
│   ├── shop-navbar.tsx
│   ├── dashboard-sidebar.tsx
│   ├── mobile-nav.tsx
│   └── footer.tsx
│
├── shared/                     # Cross-cutting
│   ├── empty-state.tsx
│   ├── error-boundary.tsx
│   ├── loading-skeleton.tsx
│   ├── status-badge.tsx
│   ├── confirmation-dialog.tsx
│   ├── file-upload.tsx
│   ├── map-view.tsx            # Mapbox GL wrapper
│   └── data-table.tsx          # TanStack Table wrapper
```

---

## 5. User Dashboard

### 5.1 Design Philosophy

Clean, task-oriented dashboard. The user's primary goals: (1) request an errand, (2) track active errands, (3) manage their wallet, (4) reorder from vendors. Everything should be **≤2 clicks** from the dashboard home.

### 5.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  🏃 RunAm       [🔍]  [🔔 3]  [🛒 2]    👤 Chidi ▾         │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│  📊 Home │   Welcome back, Chidi                             │
│          │                                                   │
│  📦 My   │   ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  Errands │   │ Active   │ │ Wallet   │ │ Total    │        │
│          │   │ Errands  │ │ Balance  │ │ Errands  │        │
│  🛒 My   │   │    2     │ │ ₦15,400  │ │    47    │        │
│  Orders  │   └──────────┘ └──────────┘ └──────────┘        │
│          │                                                   │
│  💰 Wallet│  ── Active Errands ─────────────────────         │
│          │  ┌───────────────────────────────────────┐        │
│  📍 My   │  │ 📦 Package → Lekki    [En Route]     │        │
│  Addresses│  │ Rider: Emeka O. · ETA: 12 min       │        │
│          │  │ [Track Live →]                        │        │
│  ⭐ My   │  └───────────────────────────────────────┘        │
│  Reviews │                                                   │
│          │  ── Quick Actions ───────────────────────         │
│  🔔 Notif│  [📦 Send Package] [🍔 Order Food]               │
│          │  [🛒 Go Shopping]  [📄 Send Document]             │
│  🎧 Help │                                                   │
│          │  ── Recent Orders ───────────────────────         │
│  ⚙ Settings│ (last 5 errands with status + reorder)          │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

### 5.3 Feature Breakdown

#### 5.3.1 Dashboard Home (`/dashboard`)

| Widget | Data Source | Behavior |
|--------|-----------|----------|
| **Stats Cards** | `GET /errands/mine?status=active` (count), `GET /wallet` (balance), `GET /errands/mine` (total count) | Click → navigates to respective page |
| **Active Errands** | `GET /errands/mine?status=InProgress,Accepted,EnRouteToPickup,ArrivedAtPickup,Collected,EnRouteToDropoff` | Real-time status via SignalR `errand-{id}` group. Live ETA. "Track" → errand detail |
| **Quick Actions** | Static cards | Each opens `/errands/new?category=X` or `/shop` |
| **Recent Orders** | `GET /errands/mine?limit=5&sort=newest` | Status badge, vendor name (if marketplace), "Reorder" button |

#### 5.3.2 My Errands (`/dashboard/errands`)

- **Tabs:** All, Active, Completed, Cancelled
- **List view** with filters: date range, category, status
- **Errand card:** Status timeline (visual stepper), pickup/dropoff, rider info, price
- **Click → Errand Detail** (`/dashboard/errands/[id]`):
  - Full errand timeline (all status transitions with timestamps)
  - Live map (if active) — Mapbox with rider marker, route polyline, pickup/dropoff pins
  - Chat with rider (SignalR chat hub)
  - Order items (if marketplace errand)
  - Payment breakdown
  - Rate & review (after completion)
  - Cancel button (if cancellable — respects `CanTransitionTo` logic)
  - Proof of delivery photos
  - Reorder button

#### 5.3.3 Create Errand Wizard (`/dashboard/errands/new`)

Multi-step form wizard with progress indicator:

```
Step 1: Service Type
├── Logistics (Package, Document, Custom — no vendor)
│   → Step 2a: Pickup & Dropoff
│   → Step 3a: Package Details (size, weight, description, photos)
│   → Step 4: Priority & Schedule
│   → Step 5: Price Estimate & Payment
│   → Step 6: Review & Confirm
│
└── Marketplace (Food, Grocery, Pharmacy — has vendor)
    → Redirects to /shop (marketplace flow → cart → checkout)
```

**Step 2a (Pickup & Dropoff):**
- Address autocomplete with saved addresses dropdown
- Map preview showing route
- Multi-stop support: "Add another stop" → `ErrandStop[]`
- Contact name + phone for each stop

**Step 3a (Package Details):**
- Package size selector (visual cards: Small/Medium/Large/ExtraLarge with dimension hints)
- Weight input
- Description textarea
- Photo upload (drag & drop, camera capture)
- "Fragile" toggle, "Insurance" toggle

**Step 4 (Priority & Schedule):**
- Standard / Express / Scheduled radio
- If Scheduled: date picker + time picker
- Express: shows surcharge

**Step 5 (Price Estimate):**
- Calls `POST /errands/price-estimate` with all form data
- Shows breakdown: base fare, distance, weight surcharge, priority fee, promo discount
- Promo code input
- Payment method selector (wallet, card, mobile money)

**Step 6 (Review):**
- Summary of all inputs
- Edit links back to each step
- "Place Errand" CTA → `POST /errands`

**Technical:** Use React Hook Form with Zod schema per step. Store form state in a local `useReducer` or Zustand slice so it persists across steps (but not across sessions). Animate step transitions with `framer-motion` `AnimatePresence`.

#### 5.3.4 Wallet (`/dashboard/wallet`)

| Feature | Implementation |
|---------|---------------|
| **Balance card** | Large balance display, "Top Up" + "Withdraw" CTAs |
| **Top Up** | Dialog: amount presets (₦1000, ₦2000, ₦5000, custom), payment method, `POST /payments/wallet/top-up` |
| **Withdraw** | Dialog: amount, bank account selector, `POST /payments/wallet/withdraw` |
| **Transactions** | Paginated table: date, type (credit/debit), source, amount, balance after. Filter by type, date range |
| **Auto top-up** | Toggle + threshold + amount config (future feature) |

#### 5.3.5 Address Book (`/dashboard/addresses`)

- List of saved addresses with labels (Home, Work, Custom)
- Add/Edit dialog with map + autocomplete
- Default address toggle
- Delete with confirmation
- CRUD: `GET/POST/PUT/DELETE /users/addresses`

#### 5.3.6 My Reviews (`/dashboard/reviews`)

- Reviews I've given: list with errand context, rating, comment, date
- Future: reviews of me (if user is also a rider)

#### 5.3.7 Notification Center (`/dashboard/notifications`)

- Real-time via SignalR notification hub
- Grouped by date (Today, Yesterday, This Week, Older)
- Types with icons: errand updates, payment confirmations, promos, system messages
- Mark read (individual + mark all)
- Click → deep link to relevant page (errand detail, wallet, etc.)
- Unread badge count in navbar

#### 5.3.8 Settings (`/dashboard/settings`)

| Section | Fields |
|---------|--------|
| **Profile** | First name, last name, email, phone, avatar upload |
| **Notification Preferences** | Toggle push/email/SMS per category |
| **Security** | Change password, 2FA setup (future), active sessions |
| **Payment Methods** | Saved cards, bank accounts, mobile money |
| **Language** | English (default), future: Pidgin, French, Yoruba |
| **Dark Mode** | Toggle (already supported via CSS variables) |
| **Delete Account** | Destructive action with confirmation |

---

## 6. Vendor Dashboard

### 6.1 Design Philosophy

Operations-first dashboard. Vendors care about: (1) incoming orders, (2) revenue, (3) product management. The dashboard should feel like Shopify meets DoorDash Merchant — **real-time order alerts**, quick order processing, and clear analytics.

### 6.2 Onboarding Flow (`/vendor/onboarding`)

Multi-step registration wizard (requires authenticated user with any role — backend creates/links vendor):

```
Step 1: Business Info
  - Business name, description, category (ServiceCategory multi-select)
  - Business logo upload, cover image upload

Step 2: Location
  - Business address (autocomplete + map pin)
  - Delivery radius setting (slider: 1-20 km)

Step 3: Operations
  - Operating hours (per-day schedule with open/close times)
  - Minimum order amount
  - Delivery fee (flat or dynamic — future)
  - Preparation time range (e.g., 15-30 min)

Step 4: Payment
  - Bank account details for payouts
  - Commission acknowledgment

Step 5: Review & Submit
  - Summary
  - Terms acceptance
  - Submit → POST /vendors → status: Pending
  - "Your application is under review" confirmation page
```

### 6.3 Dashboard Home (`/vendor`)

```
┌──────────┬────────────────────────────────────────────────────┐
│          │                                                    │
│  📊 Home │  🟢 Store is OPEN              [Toggle Off]       │
│          │                                                    │
│  📋 Orders│  ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│          │  │ Today's   │ │ Today's   │ │ Pending   │       │
│  📦 Products│ │ Orders    │ │ Revenue   │ │ Orders    │       │
│          │  │    12     │ │ ₦45,600   │ │     3     │       │
│  📂 Categories│ └───────────┘ └───────────┘ └───────────┘       │
│          │                                                    │
│  📈 Analytics│ ── New Orders (Real-time) ─────────────────     │
│          │  🔔 NEW ORDER #4521                                │
│          │  ┌──────────────────────────────────────────┐      │
│  ⭐ Reviews│ │ 3× Chicken & Chips Combo                │      │
│          │  │ 1× Jollof Rice                           │      │
│          │  │ Total: ₦13,300                           │      │
│  💰 Payouts│ │ Customer: Chidi A.                       │      │
│          │  │ [Accept (15 min)]  [Reject]              │      │
│  🔔 Notif│  └──────────────────────────────────────────┘      │
│          │                                                    │
│  ⚙ Settings│ ── Revenue Chart (7-day) ──────────────────      │
│          │  (Recharts area chart)                             │
│          │                                                    │
└──────────┴────────────────────────────────────────────────────┘
```

### 6.4 Feature Breakdown

#### 6.4.1 Order Management (`/vendor/orders`)

**This is the vendor's most critical page.**

| Tab | Content | Real-time |
|-----|---------|-----------|
| **New** (🔴 badge) | Orders with `VendorOrderStatus.Received`. Each shows items, customer, total, time since received. Actions: Accept (with prep time estimate), Reject (with reason) | SignalR push for new orders — toast + sound |
| **Preparing** | Accepted orders being prepared. Shows elapsed time vs. estimated prep time. Action: "Mark Ready for Pickup" | — |
| **Ready** | Orders waiting for rider pickup. Shows rider assignment status, rider ETA | SignalR updates on rider acceptance/arrival |
| **Completed** | Today's completed orders | — |
| **All** | Searchable, filterable history with date range | — |

**Order Detail** (`/vendor/orders/[id]`):
- Full item list with quantities, variants, extras, notes
- Customer info
- Timeline: received → confirmed → preparing → ready → picked up → delivered
- Issues: "Report Problem" → flags to admin

#### 6.4.2 Product Management (`/vendor/products`)

**List View:**
- Grouped by product category (accordion or tabs)
- Each product: image thumbnail, name, price, availability toggle
- Quick actions: edit, duplicate, toggle availability, delete
- Bulk actions: select multiple → toggle availability / delete
- Search + filter (available/unavailable)

**Product Editor** (`/vendor/products/[id]` or `/vendor/products/new`):

```
┌──────────────────────────────────────────────────────┐
│  Product Details                                      │
│                                                       │
│  Name:        [Chicken & Chips Combo              ]   │
│  Description: [Crispy fried chicken with fries... ]   │
│  Category:    [Chicken ▾]                             │
│  Price:       [₦ 3,500    ]                           │
│  Compare at:  [₦ 4,200    ] (shows strikethrough)    │
│                                                       │
│  Image:  [Upload] [drag & drop zone]                  │
│          ┌──────┐ ┌──────┐                            │
│          │ img1 │ │ img2 │  (sortable, delete)        │
│          └──────┘ └──────┘                            │
│                                                       │
│  ── Variants ─────────────────────────────            │
│  Variant Group: [Size]                                │
│  ┌─────────────────────────────────────┐              │
│  │ Regular  │ +₦0      │ [×]          │              │
│  │ Large    │ +₦1,000  │ [×]          │              │
│  │ [+ Add Option]                      │              │
│  └─────────────────────────────────────┘              │
│                                                       │
│  ── Extras ───────────────────────────────            │
│  ┌─────────────────────────────────────┐              │
│  │ Extra Coleslaw │ ₦500  │ [×]       │              │
│  │ Plantain       │ ₦400  │ [×]       │              │
│  │ [+ Add Extra]                       │              │
│  └─────────────────────────────────────┘              │
│                                                       │
│  Available: [✓ Toggle ON]                             │
│                                                       │
│  [Cancel]                        [Save Product]       │
└──────────────────────────────────────────────────────┘
```

**Technical:** Variants/Extras stored as JSON (`VariantsJson`, `ExtrasJson`). The form should build/parse these objects. Use dynamic form arrays (react-hook-form `useFieldArray`).

#### 6.4.3 Product Categories (`/vendor/categories`)

- Simple CRUD list
- Drag-and-drop reorder (using `@dnd-kit/core`) → updates `SortOrder`
- Each category shows product count

#### 6.4.4 Analytics (`/vendor/analytics`)

| Chart | Type | Data |
|-------|------|------|
| Revenue over time | Area chart | Daily/Weekly/Monthly revenue |
| Orders over time | Bar chart | Order count by day |
| Top products | Horizontal bar | Products by order count |
| Rating trend | Line chart | Average rating by month |
| Order status breakdown | Donut | Completed vs. cancelled vs. in-progress |

**Implementation:** Recharts components. Data from existing endpoints + potential new analytics endpoints (see [Section 9](#9-backend-recommendations)).

#### 6.4.5 Reviews (`/vendor/reviews`)

- Paginated list of customer reviews
- Filter by rating (1-5 stars)
- Average rating + distribution chart (5★: 60%, 4★: 25%, etc.)
- "Reply" to reviews (future feature — requires backend)

#### 6.4.6 Payouts (`/vendor/payouts`)

- Payout history table: period, amount, status, transaction reference
- Pending balance display
- "Request Payout" CTA (if manual payouts)
- Bank account details (editable)

Note: The current backend has rider payouts (`RiderPayout`) but no vendor payout entity. **This needs to be added** (see [Section 9](#9-backend-recommendations)).

#### 6.4.7 Settings (`/vendor/settings`)

| Section | Fields |
|---------|--------|
| **Store Profile** | Business name, description, logo, cover image, categories |
| **Operating Hours** | Per-day schedule, holiday closures |
| **Delivery** | Delivery fee, minimum order, delivery radius, prep time |
| **Notifications** | Order alerts (push, email, SMS), daily summary |
| **Account** | Connected user profile link |

---

## 7. Cart & Checkout

### 7.1 Cart System

**Storage:** Zustand store persisted to `localStorage`. Port logic from `mobile/packages/shared/stores/cart-store.ts`.

**Key Rules:**
1. **Single-vendor cart** — adding from a different vendor shows a confirmation dialog: "Your cart has items from {VendorA}. Clear cart and add from {VendorB}?"
2. **Cart persistence** — survives page reload, tab close. Cleared on successful checkout.
3. **Price validation** — on checkout, re-validate prices against source of truth (API). Show diff if prices changed.

**Cart Store Interface:**

```typescript
interface CartStore {
  vendorId: string | null;
  vendorName: string;
  items: CartItem[];

  addItem(vendorId: string, vendorName: string, product: Product,
          quantity: number, variant?: ProductVariant, extras?: ProductExtra[],
          notes?: string): void;
  updateQuantity(productId: string, variantKey: string, quantity: number): void;
  removeItem(productId: string, variantKey: string): void;
  clearCart(): void;

  // Computed
  itemCount: number;
  subtotal: number;
}
```

### 7.2 Cart Page (`/shop/cart`)

```
┌───────────────────────────────────────────────────────────┐
│  ← Continue Shopping              Your Cart        🗑 Clear│
├───────────────────────────────────────────────────────────┤
│                                                           │
│  from Chicken Republic                                    │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🖼 │ Chicken & Chips (Large)         [-] 2 [+]      │ │
│  │    │ + Plantain                                      │ │
│  │    │ "No onions"                                     │ │
│  │    │                               ₦9,800     [🗑]  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ 🖼 │ Jollof Rice                    [-] 1 [+]      │ │
│  │    │                               ₦2,800     [🗑]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                           │
│  ── Add more from Chicken Republic ─────────             │
│  [Browse Menu →]                                          │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Promo Code: [FIRST50          ] [Apply]             │ │
│  │                                                      │ │
│  │  Subtotal:                           ₦12,600         │ │
│  │  Delivery Fee:                          ₦500         │ │
│  │  Promo Discount:                      -₦1,000        │ │
│  │  ─────────────────────────────────────────           │ │
│  │  Total:                             ₦12,100         │ │
│  │                                                      │ │
│  │  [Proceed to Checkout →]                             │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### 7.3 Checkout Page (`/shop/checkout`)

**Auth-gated.** Unauthenticated users → redirect to `/login?redirect=/shop/checkout`.

```
┌───────────────────────────────────────────────────────────┐
│  ← Back to Cart                  Checkout                 │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ── 1. Delivery Address ─────────────────────────         │
│  ┌──────────────────────────────────────────────┐         │
│  │ 📍 Home — 15 Admiralty Way, Lekki Phase 1    │  [Edit] │
│  │    Caller: Chidi Abubakar · 080XXXXXXXX      │         │
│  └──────────────────────────────────────────────┘         │
│  [Use different address ▾]  (dropdown of saved addresses) │
│  [+ Add new address]                                      │
│                                                           │
│  ── 2. Delivery Schedule ────────────────────────         │
│  ● Now (ASAP)                                             │
│  ○ Schedule for later  [Date] [Time]                      │
│                                                           │
│  ── 3. Special Instructions ─────────────────────         │
│  [Leave at the gate / call when arriving...]              │
│                                                           │
│  ── 4. Payment Method ───────────────────────────         │
│  ● 💰 Wallet (Balance: ₦15,400)                          │
│  ○ 💳 Card ending in 4242                                 │
│  ○ 📱 Mobile Money                                        │
│  ○ 💵 Cash on Delivery                                    │
│  [+ Add payment method]                                   │
│                                                           │
│  ── 5. Order Summary ────────────────────────────         │
│  from Chicken Republic                                    │
│  2× Chicken & Chips (Large) + extras        ₦9,800       │
│  1× Jollof Rice                              ₦2,800       │
│  ──────                                                   │
│  Subtotal:                                 ₦12,600       │
│  Delivery Fee:                                ₦500       │
│  Promo (FIRST50):                           -₦1,000      │
│  ──────                                                   │
│  Total:                                    ₦12,100       │
│                                                           │
│  [Place Order — ₦12,100]                                  │
│                                                           │
│  By placing this order, you agree to our Terms of Service │
└───────────────────────────────────────────────────────────┘
```

**Checkout Flow (Technical):**

```
1. User clicks "Place Order"
2. Frontend validates: address set, payment method selected, cart not empty
3. POST /errands (marketplace errand) with body:
   {
     serviceCategoryId: "...",
     vendorId: "...",
     pickupAddress: vendor.address,      // auto-filled from vendor
     pickupLatitude: vendor.latitude,
     pickupLongitude: vendor.longitude,
     dropoffAddress: user's selected address,
     dropoffLatitude: ...,
     dropoffLongitude: ...,
     priority: "Standard" | "Express",
     scheduledFor: null | ISO date,
     notes: "...",
     paymentMethod: "Wallet" | "Card" | ...,
     promoCode: "FIRST50",
     orderItems: [
       { productId, quantity, unitPrice, notes, selectedVariant, selectedExtras },
       ...
     ]
   }
4. Backend creates Errand + OrderItems + Payment, notifies vendor via SignalR
5. Frontend receives response → clear cart → redirect to /dashboard/errands/[id]
6. Show order confirmation with live tracking
```

**Error Handling:**
- Insufficient wallet balance → show top-up dialog inline
- Vendor closed → "Sorry, this vendor is currently closed"
- Product unavailable → highlight unavailable items, ask to remove
- Price changed → show updated prices with diff

---

## 8. Rider Dashboard

### 8.1 Design Philosophy

Mobile-first (even on web). Riders will primarily use the mobile app, but the web dashboard serves for: reviewing earnings, managing payouts, updating profile/documents, and viewing performance stats. It's a **companion dashboard, not the primary work interface**.

### 8.2 Onboarding Flow (`/rider/onboarding`)

Multi-step KYC wizard:

```
Step 1: Personal Info
  - Full name, date of birth, phone (verified via OTP)
  - Profile photo upload (face must be visible)

Step 2: Vehicle Information
  - Vehicle type: On Foot / Bicycle / Motorcycle / Car (visual cards)
  - If Motorcycle/Car: license plate, vehicle model, year, color
  - Vehicle photo upload

Step 3: Documents
  - Government ID (front + back upload)
  - Driver's license (if motorcycle/car)
  - Vehicle registration (if applicable)
  - Proof of address

Step 4: Bank Details
  - Bank name (select), account number
  - Account name verification (auto-lookup if API available)

Step 5: Agreement
  - Terms of service, code of conduct
  - Background check consent
  - Submit → POST /rider/profile → status: PendingApproval
  - "Application submitted" confirmation + timeline
```

### 8.3 Dashboard Home (`/rider`)

```
┌──────────┬────────────────────────────────────────────────────┐
│          │                                                    │
│  📊 Home │  Status: 🟢 Online              [Go Offline]      │
│          │                                                    │
│  📋 Tasks│  ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│          │  │ Today's   │ │ Today's   │ │ Rating    │       │
│  💰 Earn │  │ Tasks     │ │ Earnings  │ │           │       │
│          │  │    6      │ │ ₦8,400    │ │  ⭐ 4.8   │       │
│  📈 Perf │  └───────────┘ └───────────┘ └───────────┘       │
│          │                                                    │
│  💳 Wallet│  ── Active Task ────────────────────────          │
│          │  ┌──────────────────────────────────────┐          │
│  🔔 Notif│  │ 📦 Package Delivery                  │          │
│          │  │ Pickup: 12 Marina Rd → Drop: Lekki   │          │
│          │  │ Status: En Route to Pickup            │          │
│  ⚙ Settings││ [View Details →]                      │          │
│          │  └──────────────────────────────────────┘          │
│          │                                                    │
│          │  ── Earnings This Week ────────────────            │
│          │  (Recharts bar chart - daily earnings)             │
│          │                                                    │
│          │  ── Recent Tasks ─────────────────────             │
│          │  (Last 5 completed tasks with amounts)             │
│          │                                                    │
└──────────┴────────────────────────────────────────────────────┘
```

### 8.4 Feature Breakdown

#### 8.4.1 Task Management (`/rider/tasks`)

| Tab | Content |
|-----|---------|
| **Available** | Nearby tasks broadcast to this rider. Accept/Decline buttons. Shows pickup/dropoff, distance, estimated payout. Timer countdown for response. |
| **Active** | Currently accepted task(s). Full detail: route, customer info, status update buttons ("Arrived at Pickup", "Collected", "Arrived at Dropoff", "Delivered"), photo proof upload, notes. |
| **History** | Paginated completed tasks. Date, type, route summary, payout amount, rating received. |

**Task Detail** (`/rider/tasks/[id]`):
- Map with route (Mapbox directions API)
- Customer contact (masked phone)
- Order items (if marketplace)
- Status progression buttons: sequential, validates via `CanTransitionTo`
- Photo proof capture (file upload)
- Chat with customer (SignalR)
- Navigation link (opens Google Maps/Waze with coordinates)

#### 8.4.2 Earnings (`/rider/earnings`)

| Section | Details |
|---------|---------|
| **Summary cards** | This week's earnings, this month's, total all-time, pending payout |
| **Earnings chart** | Daily earnings bar chart (Recharts), weekly/monthly toggle |
| **Transaction list** | Per-task breakdown: errand ID, base fare, distance bonus, tip, time bonus, total |
| **Tips** | Total tips received, per-task tip amounts |
| **Bonuses** | Streak bonuses, peak-hour bonuses, quest completions |

#### 8.4.3 Performance (`/rider/performance`)

| Metric | Display |
|--------|---------|
| **Completion rate** | Circular progress gauge, target line |
| **Average rating** | Stars + numeric, trend arrow |
| **Response time** | Average time to accept tasks |
| **On-time delivery rate** | Percentage |
| **Total deliveries** | Counter with monthly trend |
| **Leaderboard** | Rank among riders (if API supports) |
| **Badges** | Achievement badges earned |

#### 8.4.4 Wallet (`/rider/wallet`)

Same as user wallet with rider-specific additions:
- Auto-deposit from task completions
- Withdrawal to bank account
- Payout schedule info
- Pending payouts table

#### 8.4.5 Settings (`/rider/settings`)

| Section | Fields |
|---------|--------|
| **Profile** | Name, photo, phone |
| **Vehicle** | Type, plate, model (editable pending re-approval) |
| **Documents** | Upload/replace documents, status indicators (verified/pending/expired) |
| **Bank Account** | Bank details for payouts |
| **Availability** | Default schedule (future: set working hours) |
| **Notifications** | Task alerts, earnings notifications |

---

## 9. Backend Recommendations

After reviewing the complete backend (15 controllers, 24 entities, 47 CQRS handlers, 14+ repository interfaces), here are recommendations to fully support the web implementation:

### 9.1 Missing Endpoints (Required)

| # | Endpoint | Purpose | Priority |
|---|----------|---------|----------|
| 1 | `GET /vendors?sort=newest` | Shop home "New on RunAm" section | High |
| 2 | `GET /products/search?q=X` | Global product search across vendors | High |
| 3 | `GET /errands/mine/stats` | User dashboard stats (active count, total count, total spent) | High |
| 4 | `GET /vendors/me/stats` | Vendor dashboard stats (today's orders, revenue, pending count) | High |
| 5 | `GET /vendors/me/analytics` | Vendor analytics: daily revenue, order trends, top products | High |
| 6 | `GET /rider/stats` | Rider dashboard home stats | High |
| 7 | `GET /rider/performance` | Rider performance metrics (completion rate, avg rating, on-time %) | Medium |
| 8 | `POST /errands/price-estimate` | Already exists, but ensure it supports `orderItems[]` for marketplace errands | High |
| 9 | `GET /vendors?sort=distance` | Requires proper geo-sorting with PostGIS or Haversine formula | High |
| 10 | `PATCH /vendors/me/operating-hours` | Separate endpoint for updating operating hours | Low |
| 11 | `GET /rider/earnings/chart` | Daily/weekly earnings chart data for Recharts | Medium |
| 12 | `POST /users/addresses/validate` | Geocode validation for address inputs | Low |

### 9.2 Missing Entities / Domain Changes

| # | Change | Details |
|---|--------|---------|
| 1 | **VendorPayout** entity | Mirror `RiderPayout` for vendors. Fields: `VendorId`, `Amount`, `PayoutStatus`, `PeriodStart`, `PeriodEnd`, `OrderCount`, `CommissionAmount`. Add corresponding repository, commands, and queries. |
| 2 | **VendorAnalytics** (query model) | Aggregated view model for vendor dashboard: `TodayOrders`, `TodayRevenue`, `WeeklyRevenue[]`, `TopProducts[]`, `RatingTrend[]`. Can be a read-model/projection rather than a persisted entity. |
| 3 | **ProductImage** entity | Currently `Product` has a single `ImageUrl`. For marketplace, support multiple product images. Add `ProductImage` with `ProductId`, `ImageUrl`, `SortOrder`, `AltText`. |
| 4 | **Vendor.CoverImageUrl** | Add cover image field for storefront banner. |
| 5 | **Vendor.PreparationTimeMinutes** | Add estimated prep time field (range: min/max). |
| 6 | **Vendor.DeliveryRadius** | Add max delivery radius in km for geo-filtering. |
| 7 | **Errand.DeliveryInstructions** | Add field for special delivery instructions from checkout. |
| 8 | **PromoCode** scoping | Add `VendorId` nullable FK to scope promos to specific vendors. |

### 9.3 API Response Enhancements

| # | Enhancement | Reason |
|---|-------------|--------|
| 1 | **Include `isOpen` computed field** in `VendorDto` | Computed from `OperatingHours` JSON + current time. Frontend shouldn't compute this — timezone issues. |
| 2 | **Include `estimatedDeliveryMinutes`** in `VendorDto` when lat/lng provided | Show "25-35 min" on vendor cards. Requires distance calc + vendor's prep time. |
| 3 | **Include `orderItemCount`** in errand list responses | So errand lists can show "5 items from Chicken Republic" without loading order items separately. |
| 4 | **Paginated `WalletTransactions`** | Current `GetWalletTransactionsQuery` should support cursor-based pagination for infinite scroll. Ensure `PaginationMeta` is included. |
| 5 | **Aggregate endpoint for user dashboard** | `GET /users/me/dashboard` returning active errands + wallet balance + unread notifications count + recent orders in one call — reduces waterfall requests. |
| 6 | **Aggregate endpoint for vendor dashboard** | `GET /vendors/me/dashboard` returning today's stats + new orders + recent reviews in one call. |
| 7 | **Aggregate endpoint for rider dashboard** | `GET /rider/dashboard` returning today's stats + active task + weekly earnings in one call. |
| 8 | **Vendor products grouped by category** | `GET /vendors/{id}/menu` returns `ProductCategoryWithProductsDto[]` — already partially exists via `VendorDetailDto` but ensure it's optimized. |

### 9.4 Real-Time (SignalR) Enhancements

| # | Enhancement | Hub | Details |
|---|-------------|-----|---------|
| 1 | **Vendor order notifications** | `/hubs/notifications` | When a marketplace errand is created, broadcast to vendor's SignalR connection. Currently, the notification is created in DB but may not be pushed to the vendor's live session. Ensure the `VendorOrderReceived` event is emitted. |
| 2 | **Vendor order status → customer** | `/hubs/tracking` | When vendor confirms/marks ready, push `VendorOrderStatusChanged` event to customer's errand group. |
| 3 | **Cart price invalidation** | — | Not real-time, but on checkout, validate all prices server-side and return a `priceChanged` error with updated prices if any item price has changed since it was added to cart. |

### 9.5 Infrastructure Recommendations

| # | Item | Details |
|---|------|---------|
| 1 | **Image upload service** | Add a `IFileStorageService` with implementations for local dev (MinIO) and production (Azure Blob / AWS S3). Expose `POST /uploads` endpoint returning a URL. Used for: product images, vendor logos, rider documents, proof-of-delivery photos. Currently no upload infrastructure exists. |
| 2 | **Geocoding service** | Add `IGeocodingService` wrapping Google Maps Geocoding API or Mapbox. Used for: address validation, auto-filling lat/lng from address text, reverse geocoding. |
| 3 | **Search indexing** | For product search across vendors, consider adding a simple full-text search using PostgreSQL `tsvector`/`tsquery` or a lightweight search index. Avoid Elasticsearch complexity at this stage. |
| 4 | **Rate limiting on public endpoints** | The vendor browse and product list endpoints are public. Add rate limiting (ASP.NET `RateLimiter` middleware) to prevent abuse. |
| 5 | **Response caching** | Service categories and featured vendors rarely change. Add `OutputCache` or `ResponseCache` with appropriate durations (5 min for categories, 1 min for vendor listings). |
| 6 | **Bulk operations** | Vendor product management: add bulk import/export (CSV) endpoint for vendors with many products. |

### 9.6 Security Gaps

| # | Issue | Fix |
|---|-------|-----|
| 1 | **No CSRF protection** | Not needed for JWT-only APIs, but if adding cookie-based auth for web SSR, add antiforgery tokens. |
| 2 | **No input sanitization** | Review/chat message content should be sanitized (strip HTML/XSS). Add a sanitization middleware or use a library like `HtmlSanitizer`. |
| 3 | **File upload validation** | When implementing image upload, validate file type (magic bytes, not just extension), file size (max 5MB), and virus scan in production. |
| 4 | **Rate limiting on auth endpoints** | `POST /auth/login` and `POST /auth/register` should have aggressive rate limiting (5/min per IP). |

---

## 10. Implementation Phases & Timeline

### Phase 1: Foundation (Week 1-2)

**Goal:** Design system, component library, routing skeleton, cart store.

| Task | Est. |
|------|------|
| Install & configure shadcn/ui (CLI + 25 components) | 4h |
| Create reusable compound components (`VendorCard`, `ProductItem`, `StatusBadge`, `RatingStars`, `PriceTag`, `EmptyState`, `DataTable`) | 8h |
| Set up route groups with layouts: `(marketing)`, `(shop)`, `(user)`, `(vendor)`, `(rider)` | 4h |
| Implement role-based routing middleware/guards | 4h |
| Port cart store from mobile to web (Zustand + localStorage) | 3h |
| Set up TanStack Query hooks pattern (`/hooks/` directory) | 4h |
| Integrate Mapbox GL JS wrapper component | 4h |
| Set up Framer Motion + animation utilities | 2h |
| Configure Next.js metadata, OG images, sitemap | 3h |

### Phase 2: Landing Page + Marketing (Week 2-3)

| Task | Est. |
|------|------|
| Marketing layout (navbar with scroll effect, footer) | 4h |
| Hero section with animations | 6h |
| How It Works section | 3h |
| Service Categories (server component + API) | 3h |
| Featured Vendors carousel | 4h |
| Value props, stats counter, testimonials | 6h |
| CTA / Download section | 2h |
| SEO: metadata, JSON-LD, OG image generation | 3h |
| Performance optimization (Lighthouse 95+) | 3h |

### Phase 3: Shop / Marketplace (Week 3-5)

| Task | Est. |
|------|------|
| Shop layout (nav with search, cart icon, location) | 4h |
| Shop home page (categories, featured, popular, new) | 8h |
| Category page with filters + pagination | 6h |
| Vendor storefront (hero, scrollspy menu, product list) | 10h |
| Product customization sheet (variants, extras, qty) | 6h |
| Cart bar (floating) + cart drawer | 4h |
| Cart page (full view, promo code, totals) | 6h |
| Search functionality (vendors + products) | 6h |
| Location picker component | 4h |

### Phase 4: Cart & Checkout (Week 5-6)

| Task | Est. |
|------|------|
| Checkout page (address, schedule, payment, summary) | 8h |
| Address selector with saved addresses | 4h |
| Payment method selector | 4h |
| Order submission flow (API call, error handling) | 6h |
| Order confirmation + redirect to tracking | 3h |
| Edge cases (vendor closed, price changed, out of stock) | 4h |

### Phase 5: User Dashboard (Week 6-8)

| Task | Est. |
|------|------|
| User dashboard layout (sidebar, mobile nav, auth guard) | 4h |
| Dashboard home (stats, active errands, quick actions) | 6h |
| My Errands list + filters | 6h |
| Errand detail + live tracking (map, timeline, chat) | 10h |
| Create Errand wizard (logistics flow) | 10h |
| Wallet page (balance, top-up, withdraw, transactions) | 6h |
| Address book CRUD | 4h |
| My Reviews page | 3h |
| Notification center (SignalR integration) | 5h |
| Settings page (profile, preferences, security) | 5h |

### Phase 6: Vendor Dashboard (Week 8-10)

| Task | Est. |
|------|------|
| Vendor onboarding wizard | 8h |
| Vendor dashboard layout + home page | 6h |
| Order management (tabs, real-time, accept/reject/ready) | 10h |
| Product management (list, create/edit, variants/extras) | 10h |
| Product category management | 4h |
| Analytics page (Recharts charts) | 6h |
| Reviews page | 3h |
| Payouts page | 4h |
| Settings page | 4h |

### Phase 7: Rider Dashboard (Week 10-11)

| Task | Est. |
|------|------|
| Rider onboarding wizard (KYC) | 8h |
| Rider dashboard layout + home page | 6h |
| Task management (available, active, history) | 8h |
| Task detail (map, status updates, proof upload, chat) | 8h |
| Earnings page (charts, breakdown) | 5h |
| Performance page | 4h |
| Wallet + payouts | 4h |
| Settings page | 3h |

### Phase 8: Polish & Integration (Week 11-12)

| Task | Est. |
|------|------|
| Upgrade existing admin dashboard with shadcn/ui | 8h |
| Cross-role navigation (user who is also a vendor) | 4h |
| Dark mode review + fixes | 3h |
| Responsive review (all pages on mobile, tablet, desktop) | 6h |
| Loading states (skeletons for all pages) | 4h |
| Error states (error boundaries, empty states, 404) | 4h |
| Toast notifications (success, error, info) | 2h |
| Accessibility audit (keyboard nav, screen reader, ARIA) | 4h |
| Performance audit (bundle analysis, code splitting, lazy loading) | 4h |
| E2E test setup (Playwright — critical paths) | 6h |

### Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| **Phase 1** | Week 1-2 | Design system + skeleton |
| **Phase 2** | Week 2-3 | Landing page live |
| **Phase 3** | Week 3-5 | Shop browsable |
| **Phase 4** | Week 5-6 | Cart & checkout functional |
| **Phase 5** | Week 6-8 | User dashboard complete |
| **Phase 6** | Week 8-10 | Vendor dashboard complete |
| **Phase 7** | Week 10-11 | Rider dashboard complete |
| **Phase 8** | Week 11-12 | Polished, tested, production-ready |

**Total estimated effort: ~12 weeks** (1 frontend developer), or **~6 weeks** with 2 developers working in parallel (Phases 2+3 and 5+6 can be parallelized).

---

> **Next Steps:** Begin Phase 1 — install shadcn/ui, scaffold route groups, and build the component library foundation.
