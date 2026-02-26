# RunAm — Vendor / Product Marketplace Architecture Proposal

> **Date:** February 2026  
> **Status:** Proposal — pending approval before implementation

---

## 1. Executive Summary

The current RunAm domain models errands as **customer → rider** tasks with a hardcoded `ErrandCategory` enum. The new requirement introduces **vendors** (merchants) who belong to errand categories (now called **services**), list **products** with prices, and organise those products into **product categories**. Pickup-and-delivery remains a first-class errand type with its existing structure.

This document explains **what we already have**, **what needs to change**, and **exactly which new entities, enums, configurations, and migrations** to create.

---

## 2. Current State (What We Have)

### 2.1 Domain Entities (18)

| Entity                                                             | Role                                                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `ApplicationUser`                                                  | Identity user with `UserRole` (Customer, Rider, **Merchant**, Admin, SupportAgent) |
| `Errand`                                                           | Core task: pickup/dropoff addresses, `ErrandCategory` enum, state machine, pricing |
| `ErrandStop`                                                       | Multi-stop support                                                                 |
| `ErrandStatusHistory`                                              | Audit trail of status changes                                                      |
| `RiderProfile`                                                     | Vehicle, rating, online status, documents                                          |
| `RiderLocation`                                                    | GPS tracking                                                                       |
| `RiderPayout`                                                      | Earnings payouts                                                                   |
| `Wallet` / `WalletTransaction`                                     | Balance management                                                                 |
| `Payment`                                                          | Errand-level payment records                                                       |
| `PromoCode`                                                        | Discount codes                                                                     |
| `Review`                                                           | Rating & comments (errand-scoped)                                                  |
| `ChatMessage`                                                      | In-errand messaging                                                                |
| `Notification` / `NotificationPreference` / `NotificationTemplate` | Push/email/SMS                                                                     |
| `UserAddress`                                                      | Saved addresses                                                                    |

### 2.2 ErrandCategory Enum (Current)

```csharp
public enum ErrandCategory
{
    PackageDelivery = 0,
    FoodDelivery = 1,
    GroceryShopping = 2,
    DocumentDelivery = 3,
    PharmacyPickup = 4,
    LaundryPickupDelivery = 5,
    CustomErrand = 6,
    MultiStopDelivery = 7,
    ReturnExchange = 8,
    BillPayment = 9
}
```

### 2.3 Key Observations

1. **`UserRole.Merchant` already exists** — no Identity changes needed.
2. The `ErrandCategory` enum is **hardcoded** — adding/removing categories requires a code change + migration.
3. There is **no concept of Vendor profile, Products, or Product Categories** in the domain.
4. Errands are currently **pure logistics tasks** — there's no link to "what is being bought."

---

## 3. Proposed Architecture

### 3.1 Core Concept Map

```
ServiceCategory (DB-driven, replaces ErrandCategory enum)
  ├── "Food Delivery"
  │     └── Vendors: "Mama Put Kitchen", "Chicken Republic" …
  │           └── ProductCategories: "Rice Dishes", "Drinks", "Sides"
  │                 └── Products: "Jollof Rice ₦2,500", "Chapman ₦1,000" …
  ├── "Grocery Shopping"
  │     └── Vendors: "ShopRite", "Market Runner" …
  │           └── ProductCategories: "Fruits", "Beverages", "Household"
  │                 └── Products …
  ├── "Pharmacy Pickup"
  │     └── Vendors: "HealthPlus", "MedPlus" …
  ├── "Package Delivery"  ← NO vendors; pure logistics
  ├── "Document Delivery" ← NO vendors; pure logistics
  └── …
```

### 3.2 Two Errand Archetypes

| Type                   | Description                                                            | Has Vendor? | Has Order Items? |
| ---------------------- | ---------------------------------------------------------------------- | ----------- | ---------------- |
| **Logistics Errand**   | Customer sends something from A → B (package, document, laundry, etc.) | No          | No               |
| **Marketplace Errand** | Customer orders products from a vendor; rider picks up & delivers      | Yes         | Yes              |

Both types still flow through the **same `Errand` entity and state machine**. The difference is that marketplace errands carry a `VendorId` and linked `OrderItem` records.

---

## 4. New & Modified Entities

### 4.1 `ServiceCategory` (NEW — replaces enum)

```csharp
public class ServiceCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;         // "Food Delivery"
    public string Slug { get; set; } = string.Empty;         // "food-delivery"
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool RequiresVendor { get; set; }                 // true = marketplace, false = logistics

    // Navigation
    public ICollection<Vendor> Vendors { get; set; } = new List<Vendor>();
}
```

**Why DB-driven instead of enum?** Admins can add/rename/reorder categories from the dashboard without code changes.

### 4.2 `Vendor` (NEW)

```csharp
public class Vendor : BaseEntity
{
    public Guid UserId { get; set; }                          // → ApplicationUser (Merchant role)
    public string BusinessName { get; set; } = string.Empty;
    public string? BusinessDescription { get; set; }
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }

    // Location
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    // Operations
    public string? OperatingHours { get; set; }              // JSON: {"mon":"09:00-21:00", ...}
    public bool IsOpen { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal MinimumOrderAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public int EstimatedPrepTimeMinutes { get; set; }

    // Rating
    public double Rating { get; set; }
    public int TotalReviews { get; set; }
    public int TotalOrders { get; set; }

    // Approval
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public Guid ServiceCategoryId { get; set; }
    public ServiceCategory ServiceCategory { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<ProductCategory> ProductCategories { get; set; } = new List<ProductCategory>();
}
```

### 4.3 `ProductCategory` (NEW)

```csharp
public class ProductCategory : BaseEntity
{
    public Guid VendorId { get; set; }
    public string Name { get; set; } = string.Empty;         // "Rice Dishes", "Drinks"
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Vendor Vendor { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
```

### 4.4 `Product` (NEW)

```csharp
public class Product : BaseEntity
{
    public Guid VendorId { get; set; }
    public Guid ProductCategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }             // strikethrough / original price
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    // Variants (e.g., size: small/medium/large) — JSON for MVP, own table later
    public string? VariantsJson { get; set; }

    // Extras / Add-ons (e.g., extra meat, extra cheese) — JSON for MVP
    public string? ExtrasJson { get; set; }

    // Navigation
    public Vendor Vendor { get; set; } = null!;
    public ProductCategory ProductCategory { get; set; } = null!;
}
```

### 4.5 `OrderItem` (NEW)

Links products to an errand (the marketplace "cart").

```csharp
public class OrderItem : BaseEntity
{
    public Guid ErrandId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }                   // snapshot at order time
    public decimal TotalPrice { get; set; }                  // UnitPrice × Quantity
    public string? Notes { get; set; }                       // "no onions", "extra spicy"
    public string? SelectedVariantJson { get; set; }         // chosen variant
    public string? SelectedExtrasJson { get; set; }          // chosen extras

    // Navigation
    public Errand Errand { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
```

### 4.6 Modified: `Errand` (add marketplace fields)

```csharp
// Add these properties to the existing Errand entity:

public Guid? VendorId { get; set; }                          // null = logistics errand
public Guid? ServiceCategoryId { get; set; }                 // replaces ErrandCategory enum

// Navigation additions:
public Vendor? Vendor { get; set; }
public ServiceCategory? ServiceCategory { get; set; }
public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
```

> **Migration strategy for `ErrandCategory` enum → `ServiceCategoryId`:**
>
> 1. Add `ServiceCategoryId` as nullable.
> 2. Seed `ServiceCategory` rows matching the 10 current enum values.
> 3. Data migration: set `ServiceCategoryId` for existing errands based on `Category` enum value.
> 4. Keep the `Category` enum column temporarily for backward compatibility.
> 5. Mark `Category` as `[Obsolete]` and remove in a future release.

### 4.7 Modified: `Review` (support vendor reviews)

```csharp
// Add:
public Guid? VendorId { get; set; }
public Vendor? Vendor { get; set; }
```

This lets customers review vendors independently of errands.

---

## 5. New Enums

### 5.1 `VendorStatus`

```csharp
public enum VendorStatus
{
    Pending = 0,
    Active = 1,
    Suspended = 2,
    Closed = 3
}
```

### 5.2 `OrderItemStatus`

```csharp
public enum OrderItemStatus
{
    Pending = 0,
    Confirmed = 1,
    Preparing = 2,
    Ready = 3,
    Unavailable = 4
}
```

---

## 6. Database Schema (ER Diagram)

```
┌─────────────────┐       ┌──────────────────┐
│ ServiceCategory  │1────*│     Vendor        │
│─────────────────│       │──────────────────│
│ Name             │       │ BusinessName      │
│ Slug             │       │ UserId → User     │
│ RequiresVendor   │       │ ServiceCategoryId │
│ IconUrl          │       │ Address/Lat/Lng   │
│ SortOrder        │       │ Rating            │
│ IsActive         │       │ ApprovalStatus    │
└─────────────────┘       └────────┬─────────┘
                                   │ 1
                          ┌────────┴─────────┐
                          │                  │
                    ┌─────┴──────┐    ┌──────┴──────────┐
                    │ Product    │    │ ProductCategory  │
                    │ Category   │    │                  │
                    │            │    │ Name             │
                    │ Name       │    │ SortOrder        │
                    │ SortOrder  │    └──────────────────┘
                    └─────┬──────┘
                          │ 1
                    ┌─────┴──────┐
                    │  Product   │
                    │────────────│
                    │ Name       │
                    │ Price      │
                    │ ImageUrl   │
                    │ VariantsJson│
                    │ ExtrasJson │
                    └─────┬──────┘
                          │ *
                    ┌─────┴──────┐        ┌─────────────┐
                    │ OrderItem  │*─────1│   Errand     │
                    │────────────│        │─────────────│
                    │ Quantity   │        │ VendorId?    │
                    │ UnitPrice  │        │ ServiceCatId?│
                    │ TotalPrice │        │ … (existing) │
                    │ Notes      │        └─────────────┘
                    └────────────┘
```

---

## 7. API Endpoints (New)

### 7.1 Service Categories (Public)

```
GET    /api/service-categories                    → List all active categories
GET    /api/service-categories/{slug}             → Category detail + vendors
```

### 7.2 Vendors (Public + Merchant)

```
GET    /api/vendors?categoryId=&lat=&lng=&radius= → Browse vendors (with distance)
GET    /api/vendors/{id}                           → Vendor detail + product categories
GET    /api/vendors/{id}/products                  → All products grouped by category
GET    /api/vendors/{id}/reviews                   → Vendor reviews

POST   /api/vendors/me                             → Create vendor profile (Merchant)
PUT    /api/vendors/me                             → Update vendor profile
PUT    /api/vendors/me/status                      → Toggle open/closed
```

### 7.3 Products (Merchant)

```
POST   /api/vendors/me/categories                  → Create product category
PUT    /api/vendors/me/categories/{id}             → Update product category
DELETE /api/vendors/me/categories/{id}             → Delete product category

POST   /api/vendors/me/products                    → Create product
PUT    /api/vendors/me/products/{id}               → Update product
DELETE /api/vendors/me/products/{id}               → Delete product
PUT    /api/vendors/me/products/{id}/availability  → Toggle availability
```

### 7.4 Marketplace Errands (Customer)

```
POST   /api/errands                                → Create errand (extended with orderItems[])
```

The existing errand create endpoint is extended: when `vendorId` is provided, the request body includes `orderItems[]` with `{ productId, quantity, notes, selectedVariant, selectedExtras }`.

### 7.5 Vendor Order Management (Merchant)

```
GET    /api/vendors/me/orders                      → List incoming orders (errands with this vendor)
PUT    /api/vendors/me/orders/{errandId}/confirm   → Confirm order
PUT    /api/vendors/me/orders/{errandId}/ready      → Mark as ready for pickup
```

### 7.6 Admin

```
GET    /api/admin/service-categories               → CRUD categories
POST   /api/admin/service-categories
PUT    /api/admin/service-categories/{id}
DELETE /api/admin/service-categories/{id}

GET    /api/admin/vendors                           → List all vendors
PUT    /api/admin/vendors/{id}/approve             → Approve/reject vendor
```

---

## 8. Updated Errand Flow (Marketplace)

```
Customer                    Vendor                     Rider
   │                          │                          │
   ├── Browse vendors ───────►│                          │
   ├── Add products to cart   │                          │
   ├── Submit errand ────────►│                          │
   │                          ├── Receive notification   │
   │                          ├── Confirm order          │
   │                          ├── Prepare items          │
   │                          ├── Mark "Ready" ─────────►│
   │                          │                          ├── Accept & En Route to Vendor
   │       ◄── Live Tracking ─┤                          ├── Arrived at Vendor
   │                          │                          ├── Package Collected
   │       ◄── Live Tracking ─┤                          ├── En Route to Customer
   │                          │                          ├── Arrived / Delivered
   ├── Rate vendor            │                          │
   ├── Rate rider             │                          │
   └──────────────────────────┴──────────────────────────┘
```

### Status Machine Extension

For marketplace errands, there's a **vendor-side sub-status** (handled via `OrderItemStatus` or a new `VendorOrderStatus` on the errand):

```
OrderReceived → Confirmed → Preparing → ReadyForPickup
```

The existing `ErrandStatus` state machine remains unchanged. The vendor sub-status runs in parallel:

- When vendor marks "ReadyForPickup" → system dispatches a rider
- Rider flow proceeds as normal: `Accepted → EnRouteToPickup → ArrivedAtPickup → …`

---

## 9. Pickup & Delivery (Logistics) — No Change Needed

The existing `Errand` entity already handles pure pickup-and-delivery perfectly:

| Field                                                     | Usage              |
| --------------------------------------------------------- | ------------------ |
| `PickupAddress` / `PickupLatitude` / `PickupLongitude`    | Sender location    |
| `DropoffAddress` / `DropoffLatitude` / `DropoffLongitude` | Receiver location  |
| `PackageSize` / `PackageWeight` / `IsFragile`             | Package details    |
| `RecipientName` / `RecipientPhone`                        | Receiver details   |
| `Stops[]`                                                 | Multi-stop support |

No structural changes required for logistics errands. They simply have `VendorId = null` and `ServiceCategoryId` pointing to a logistics category like "Package Delivery."

---

## 10. Implementation Plan

### Phase 1: Foundation (Entities + Migration)

1. Create new entities: `ServiceCategory`, `Vendor`, `ProductCategory`, `Product`, `OrderItem`
2. Create new enums: `VendorStatus`, `OrderItemStatus`
3. Add `VendorId?`, `ServiceCategoryId?`, `OrderItems` to `Errand`
4. Add `VendorId?` to `Review`
5. Create EF configurations for all new entities
6. Register new `DbSet<>` entries in `AppDbContext`
7. Seed `ServiceCategory` rows matching current `ErrandCategory` enum values
8. Generate & apply migration

### Phase 2: Repositories + CQRS

1. Create `IVendorRepository`, `IProductRepository`, `IServiceCategoryRepository`
2. Create MediatR commands/queries:
   - `CreateVendorCommand`, `UpdateVendorCommand`
   - `CreateProductCommand`, `UpdateProductCommand`, `ToggleProductAvailabilityCommand`
   - `CreateProductCategoryCommand`
   - `GetVendorsQuery` (with geo-filtering), `GetVendorByIdQuery`
   - `GetServiceCategoriesQuery`
3. Add FluentValidation validators

### Phase 3: API Controllers

1. `ServiceCategoriesController`
2. `VendorsController` (public + merchant endpoints)
3. `VendorProductsController` (merchant CRUD)
4. `VendorOrdersController` (merchant order management)
5. Extend existing `ErrandsController` for marketplace errand creation
6. Admin endpoints for category and vendor management

### Phase 4: Real-Time + Notifications

1. Extend `NotificationHub` for vendor order notifications
2. Add `NotificationType.NewVendorOrder`, `OrderReady`, etc.
3. Vendor receives push notification on new order
4. Customer receives notification when order is confirmed / ready

### Phase 5: Mobile + Web

1. User app: vendor browsing, product listing, cart, marketplace errand creation
2. Rider app: no changes (they just see errands with vendor pickup addresses)
3. Web dashboard: vendor management, product CRUD, order management portal

---

## 11. Files to Create / Modify

### New Files

| Path                                                                        | Purpose                                |
| --------------------------------------------------------------------------- | -------------------------------------- |
| `Domain/Entities/ServiceCategory.cs`                                        | Service category entity                |
| `Domain/Entities/Vendor.cs`                                                 | Vendor entity                          |
| `Domain/Entities/ProductCategory.cs`                                        | Product category entity                |
| `Domain/Entities/Product.cs`                                                | Product entity                         |
| `Domain/Entities/OrderItem.cs`                                              | Order item linking products to errands |
| `Domain/Enums/VendorStatus.cs`                                              | Vendor lifecycle states                |
| `Domain/Enums/OrderItemStatus.cs`                                           | Order item states                      |
| `Domain/Interfaces/IVendorRepository.cs`                                    | Vendor data access                     |
| `Domain/Interfaces/IProductRepository.cs`                                   | Product data access                    |
| `Domain/Interfaces/IServiceCategoryRepository.cs`                           | Category data access                   |
| `Infrastructure/Persistence/Configurations/ServiceCategoryConfiguration.cs` | EF config                              |
| `Infrastructure/Persistence/Configurations/VendorConfiguration.cs`          | EF config                              |
| `Infrastructure/Persistence/Configurations/ProductCategoryConfiguration.cs` | EF config                              |
| `Infrastructure/Persistence/Configurations/ProductConfiguration.cs`         | EF config                              |
| `Infrastructure/Persistence/Configurations/OrderItemConfiguration.cs`       | EF config                              |
| `Infrastructure/Persistence/Repositories/VendorRepository.cs`               | Implementation                         |
| `Infrastructure/Persistence/Repositories/ProductRepository.cs`              | Implementation                         |
| `Api/Controllers/ServiceCategoriesController.cs`                            | Public API                             |
| `Api/Controllers/VendorsController.cs`                                      | Vendor API                             |
| `Api/Controllers/VendorProductsController.cs`                               | Product CRUD                           |
| `Api/Controllers/VendorOrdersController.cs`                                 | Vendor order management                |

### Modified Files

| Path                                                               | Change                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `Domain/Entities/Errand.cs`                                        | Add `VendorId?`, `ServiceCategoryId?`, `OrderItems` nav      |
| `Domain/Entities/Review.cs`                                        | Add `VendorId?`, `Vendor?` nav                               |
| `Infrastructure/Persistence/AppDbContext.cs`                       | Add 5 new `DbSet<>` entries                                  |
| `Infrastructure/Persistence/Configurations/ErrandConfiguration.cs` | Add FK relationships for Vendor, ServiceCategory, OrderItems |
| `Infrastructure/Persistence/Configurations/ReviewConfiguration.cs` | Add FK for Vendor                                            |
| `Api/DataSeeder.cs`                                                | Seed ServiceCategory rows                                    |

---

## 12. Migration Strategy (ErrandCategory Enum → ServiceCategory Table)

```
Step 1: Add ServiceCategory table + seed rows
Step 2: Add nullable ServiceCategoryId FK to Errand
Step 3: SQL data migration:
        UPDATE "Errands"
        SET "ServiceCategoryId" = (
            SELECT "Id" FROM "ServiceCategories"
            WHERE "SortOrder" = "Errands"."Category"
        )
Step 4: Keep ErrandCategory enum column (backward compat)
Step 5: Later: mark [Obsolete], eventually drop column
```

---

## 13. Questions / Decisions Needed

1. **Can a vendor belong to multiple service categories?** (e.g., a supermarket doing both Grocery + Pharmacy) — If yes, we need a many-to-many `VendorServiceCategory` join table instead of a single FK.

2. **Should product variants/extras be JSON blobs (MVP) or separate tables?** — JSON is faster to ship; separate tables allow admin-level variant management.

3. **Commission model**: Flat % per category? Per vendor? Tiered? — This affects the `Vendor` and `ServiceCategory` entities (need `CommissionPercentage` fields).

4. **Vendor payout**: Use the existing `Wallet` system or a separate `VendorPayout` entity like `RiderPayout`?

5. **Inventory tracking**: Should products have stock quantities, or is everything assumed available unless toggled off?
