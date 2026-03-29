// ── User & Auth ──────────────────────────────────────────────
export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	profilePictureUrl?: string;
	roles: string[];
	emailConfirmed: boolean;
	createdAt: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	refreshToken: string;
	expiresAt: string;
	user: User;
}

// ── Errand ───────────────────────────────────────────────────
export type ErrandStatus =
	| "Draft"
	| "PendingPayment"
	| "Pending"
	| "Matched"
	| "AcceptedByRider"
	| "EnRouteToPickup"
	| "ArrivedAtPickup"
	| "Collected"
	| "InTransit"
	| "ArrivedAtDropoff"
	| "Delivered"
	| "Completed"
	| "Cancelled"
	| "Disputed";

export type ErrandCategory =
	| "PackageDelivery"
	| "FoodDelivery"
	| "GroceryShopping"
	| "DocumentDelivery"
	| "Pharmacy"
	| "Laundry"
	| "Other";

export interface ErrandStop {
	id: string;
	address: string;
	latitude: number;
	longitude: number;
	contactName?: string;
	contactPhone?: string;
	instructions?: string;
	stopOrder: number;
	stopType: "Pickup" | "Dropoff";
}

export interface Errand {
	id: string;
	trackingNumber: string;
	category: ErrandCategory;
	description: string;
	status: ErrandStatus;
	estimatedPrice: number;
	finalPrice?: number;
	currency: string;
	stops: ErrandStop[];
	packageDetails?: PackageDetails;
	riderId?: string;
	riderName?: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
	estimatedDeliveryTime?: string;
}

export interface PackageDetails {
	weight?: number;
	dimensions?: string;
	description: string;
	isFragile: boolean;
	requiresSignature: boolean;
}

export interface CreateErrandRequest {
	category: ErrandCategory;
	description: string;
	stops: Omit<ErrandStop, "id">[];
	packageDetails?: PackageDetails;
}

export interface PriceEstimate {
	estimatedPrice: number;
	currency: string;
	distanceKm: number;
	estimatedDurationMinutes: number;
}

// ── Rider ────────────────────────────────────────────────────
export type VehicleType = "Bicycle" | "Motorcycle" | "Car" | "Van";

export interface RiderProfile {
	id: string;
	userId: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	profilePictureUrl?: string;
	vehicleType: VehicleType;
	licensePlate?: string;
	isOnline: boolean;
	isVerified: boolean;
	rating: number;
	totalCompletedTasks: number;
	currentLatitude?: number;
	currentLongitude?: number;
}

export interface RiderOnboardingRequest {
	vehicleType: VehicleType;
	licensePlate?: string;
	documentUrls: string[];
}

export interface RiderEarnings {
	todayEarnings: number;
	weeklyEarnings: number;
	monthlyEarnings: number;
	totalEarnings: number;
	currency: string;
	recentTransactions: EarningTransaction[];
}

export interface EarningTransaction {
	id: string;
	errandId: string;
	trackingNumber: string;
	amount: number;
	currency: string;
	completedAt: string;
}

// ── Wallet ───────────────────────────────────────────────────
export interface Wallet {
	balance: number;
	currency: string;
}

export interface WalletTransaction {
	id: string;
	type: "TopUp" | "Payment" | "Refund" | "Withdrawal";
	amount: number;
	currency: string;
	description: string;
	createdAt: string;
	reference?: string;
}

// ── Review ───────────────────────────────────────────────────
export interface Review {
	id: string;
	rating: number;
	comment?: string;
	reviewerId: string;
	reviewerName: string;
	revieweeId: string;
	revieweeName: string;
	errandId: string;
	createdAt: string;
}

export interface ReviewSummary {
	averageRating: number;
	totalReviews: number;
	fiveStarCount: number;
	fourStarCount: number;
	threeStarCount: number;
	twoStarCount: number;
	oneStarCount: number;
}

// ── Notification Preferences ─────────────────────────────────
export interface NotificationPreferences {
	pushEnabled: boolean;
	emailEnabled: boolean;
	smsEnabled: boolean;
	errandUpdates: boolean;
	chatMessages: boolean;
	paymentAlerts: boolean;
	promotions: boolean;
	systemAlerts: boolean;
	fcmToken: string | null;
}

// ── Common ───────────────────────────────────────────────────
export interface PaginatedResponse<T> {
	items: T[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface ApiError {
	message: string;
	errors?: Record<string, string[]>;
	statusCode: number;
}

export interface Address {
	id: string;
	label: string;
	address: string;
	latitude: number;
	longitude: number;
	isDefault: boolean;
}

// ── Chat ─────────────────────────────────────────────────────
export interface ChatMessage {
	id: string;
	errandId: string;
	senderId: string;
	senderName: string;
	message: string;
	messageType: number;
	isRead: boolean;
	createdAt: string;
}

// ── Notifications ────────────────────────────────────────────
export interface AppNotification {
	id: string;
	title: string;
	body: string;
	type: number;
	data: string | null;
	isRead: boolean;
	createdAt: string;
}

// ── Tracking ─────────────────────────────────────────────────
export interface TrackingUpdate {
	errandId: string;
	riderId: string;
	latitude: number;
	longitude: number;
	heading: number | null;
	speed: number | null;
	etaSeconds: number | null;
	status: string | null;
	timestamp: string;
}

// ── Payment ──────────────────────────────────────────────────
export interface PaymentResult {
	id: string;
	errandId: string;
	payerId: string;
	amount: number;
	currency: string;
	paymentMethod: number;
	paymentGatewayRef: string | null;
	status: number;
	createdAt: string;
}

// ── Earnings Summary ─────────────────────────────────────────
export interface EarningsSummary {
	todayEarnings: number;
	weekEarnings: number;
	monthEarnings: number;
	totalEarnings: number;
	todayTrips: number;
	weekTrips: number;
	availableBalance: number;
}

// ── Payment Methods ──────────────────────────────────────────
export type PaymentMethodType =
	| "Card"
	| "BankTransfer"
	| "MobileMoney"
	| "Wallet";

export interface PaymentMethod {
	id: string;
	type: PaymentMethodType;
	label: string;
	last4?: string;
	bank?: string;
	isDefault: boolean;
	createdAt: string;
}

export interface TopUpRequest {
	amount: number;
	paymentMethodId?: string;
	paymentMethod: PaymentMethodType;
}

export interface TopUpResponse {
	transactionId: string;
	amount: number;
	currency: string;
	status: string;
	authorizationUrl?: string;
}

// ── Bank Account (Rider) ────────────────────────────────────
export interface BankAccount {
	id: string;
	bankName: string;
	bankCode: string;
	accountNumber: string;
	accountName: string;
	isDefault: boolean;
	createdAt: string;
}

export interface AddBankAccountRequest {
	bankName: string;
	bankCode: string;
	accountNumber: string;
	accountName: string;
}

// ── Promo Code ───────────────────────────────────────────────
export interface PromoCode {
	id: string;
	code: string;
	description: string;
	discountPercent?: number;
	discountAmount?: number;
	currency: string;
	minOrderAmount?: number;
	maxDiscount?: number;
	expiresAt: string;
	isActive: boolean;
}

export interface ApplyPromoResult {
	valid: boolean;
	discount: number;
	message: string;
}

// ── Rider Performance ────────────────────────────────────────
export interface RiderPerformance {
	totalDeliveries: number;
	completionRate: number;
	acceptanceRate: number;
	averageDeliveryTimeMinutes: number;
	averageRating: number;
	onTimeRate: number;
	todayDeliveries: number;
	weekDeliveries: number;
	monthDeliveries: number;
	cancelledCount: number;
	disputedCount: number;
}

// ── Leaderboard ──────────────────────────────────────────────
export interface LeaderboardEntry {
	rank: number;
	riderId: string;
	riderName: string;
	profilePictureUrl?: string;
	score: number;
	deliveries: number;
	rating: number;
	isCurrentUser: boolean;
}

export interface Leaderboard {
	period: "daily" | "weekly" | "monthly";
	entries: LeaderboardEntry[];
	currentUserRank?: number;
}

// ── Rider Bonus ──────────────────────────────────────────────
export interface RiderBonus {
	id: string;
	title: string;
	description: string;
	type: "DeliveryCount" | "Rating" | "Streak" | "Referral" | "Peak";
	target: number;
	current: number;
	rewardAmount: number;
	currency: string;
	expiresAt?: string;
	isCompleted: boolean;
}

// ── Weekly Earnings Chart ────────────────────────────────────
export interface DailyEarning {
	date: string;
	dayOfWeek: string;
	amount: number;
	deliveries: number;
}

export interface WeeklyEarningsChart {
	days: DailyEarning[];
	totalAmount: number;
	totalDeliveries: number;
}

// ── Support Ticket ───────────────────────────────────────────
export interface SupportTicket {
	id: string;
	subject: string;
	message: string;
	status: "Open" | "InProgress" | "Resolved" | "Closed";
	category: string;
	createdAt: string;
	updatedAt: string;
	replies: SupportReply[];
}

export interface SupportReply {
	id: string;
	message: string;
	isStaff: boolean;
	senderName: string;
	createdAt: string;
}

export interface CreateSupportTicketRequest {
	subject: string;
	message: string;
	category: string;
	errandId?: string;
}

// ── Vendor / Marketplace ─────────────────────────────────────

export type VendorStatus = "Pending" | "Active" | "Suspended" | "Closed";
export type OrderItemStatus =
	| "Pending"
	| "Confirmed"
	| "Preparing"
	| "Ready"
	| "Unavailable";
export type VendorOrderStatus =
	| "Received"
	| "Confirmed"
	| "Preparing"
	| "ReadyForPickup"
	| "Cancelled";

export interface ServiceCategory {
	id: string;
	name: string;
	slug: string;
	description?: string;
	iconUrl?: string;
	sortOrder: number;
	isActive: boolean;
	requiresVendor: boolean;
}

export interface Vendor {
	id: string;
	businessName: string;
	description?: string;
	logoUrl?: string;
	bannerUrl?: string;
	phoneNumber?: string;
	address: string;
	latitude: number;
	longitude: number;
	operatingHours?: string;
	isOpen: boolean;
	minimumOrderAmount: number;
	deliveryFee: number;
	estimatedPrepTimeMinutes: number;
	rating: number;
	totalReviews: number;
	totalOrders: number;
	status: VendorStatus;
	serviceCategories: ServiceCategorySlim[];
}

export interface ServiceCategorySlim {
	id: string;
	name: string;
	slug: string;
}

export interface VendorDetail extends Vendor {
	userId: string;
	productCategories: ProductCategoryWithProducts[];
}

export interface ProductCategory {
	id: string;
	vendorId: string;
	name: string;
	description?: string;
	imageUrl?: string;
	sortOrder: number;
	isActive: boolean;
}

export interface ProductCategoryWithProducts extends ProductCategory {
	products: Product[];
}

export interface Product {
	id: string;
	vendorId: string;
	productCategoryId: string;
	name: string;
	description?: string;
	price: number;
	compareAtPrice?: number;
	imageUrl?: string;
	isAvailable: boolean;
	isActive: boolean;
	sortOrder: number;
	variantsJson?: string;
	extrasJson?: string;
}

export interface ProductVariant {
	name: string;
	options: ProductVariantOption[];
}

export interface ProductVariantOption {
	label: string;
	priceAdjustment: number;
}

export interface ProductExtra {
	name: string;
	price: number;
	maxQuantity?: number;
}

export interface OrderItem {
	id: string;
	errandId: string;
	productId: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	notes?: string;
	selectedVariantJson?: string;
	selectedExtrasJson?: string;
	status: OrderItemStatus;
}

export interface CartItem {
	cartItemId: string; // composite key: productId + variant + extras
	product: Product;
	quantity: number;
	selectedVariants?: { name: string; option: ProductVariantOption }[];
	selectedExtras?: { extra: ProductExtra; quantity: number }[];
	notes?: string;
}

export interface CreateOrderItemRequest {
	productId: string;
	quantity: number;
	notes?: string;
	selectedVariantJson?: string;
	selectedExtrasJson?: string;
}

export interface CreateMarketplaceOrderRequest {
	vendorId: string;
	dropoffAddress: string;
	dropoffLatitude: number;
	dropoffLongitude: number;
	recipientName?: string;
	recipientPhone?: string;
	specialInstructions?: string;
	paymentMethod: number;
	promoCode?: string;
	items: CreateOrderItemRequest[];
}
