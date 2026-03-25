// ── Enums ──────────────────────────────────────────────

export enum UserRole {
	Customer = 0,
	Rider = 1,
	Merchant = 2,
	Admin = 3,
	SupportAgent = 4,
}

export enum UserStatus {
	Active = 0,
	Suspended = 1,
	Deactivated = 2,
	PendingVerification = 3,
}

export enum ErrandStatus {
	Pending = 0,
	Accepted = 1,
	EnRouteToPickup = 2,
	ArrivedAtPickup = 3,
	PackageCollected = 4,
	EnRouteToDropoff = 5,
	ArrivedAtDropoff = 6,
	Delivered = 7,
	Cancelled = 8,
	Failed = 9,
}

export enum ErrandCategory {
	PackageDelivery = 0,
	FoodDelivery = 1,
	GroceryShopping = 2,
	DocumentDelivery = 3,
	PharmacyPickup = 4,
	LaundryPickupDelivery = 5,
	CustomErrand = 6,
	MultiStopDelivery = 7,
	ReturnExchange = 8,
	BillPayment = 9,
}

export enum ErrandPriority {
	Standard = 0,
	Express = 1,
	Scheduled = 2,
}

export enum ApprovalStatus {
	Pending = 0,
	Approved = 1,
	Rejected = 2,
}

export enum VehicleType {
	OnFoot = 0,
	Bicycle = 1,
	Motorcycle = 2,
	Car = 3,
}

export enum PackageSize {
	Small = 0,
	Medium = 1,
	Large = 2,
	ExtraLarge = 3,
}

export enum PaymentMethod {
	Wallet = 0,
	Card = 1,
	MobileMoney = 2,
	BankTransfer = 3,
	Cash = 4,
}

export enum PaymentStatus {
	Pending = 0,
	Completed = 1,
	Failed = 2,
	Refunded = 3,
}

export enum ErrandStopStatus {
	Pending = 0,
	InProgress = 1,
	Completed = 2,
	Skipped = 3,
}

// ── DTOs ───────────────────────────────────────────────

export interface UserDto {
	id: string;
	email: string;
	phoneNumber: string;
	firstName: string;
	lastName: string;
	profileImageUrl: string | null;
	role: UserRole;
	status: UserStatus;
	isPhoneVerified: boolean;
	isEmailVerified: boolean;
	createdAt: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	expiresAt: string;
	user: UserDto;
}

export interface RegisterResponse {
	message: string;
	phoneNumber: string;
	requiresVerification: boolean;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	phoneNumber: string;
	password: string;
	firstName: string;
	lastName: string;
	role?: UserRole;
}

export interface ErrandDto {
	id: string;
	customerId: string;
	customerName: string;
	riderId: string | null;
	riderName: string | null;
	category: ErrandCategory;
	status: ErrandStatus;
	description: string | null;
	specialInstructions: string | null;
	priority: ErrandPriority;
	scheduledAt: string | null;
	pickupAddress: string;
	pickupLatitude: number;
	pickupLongitude: number;
	dropoffAddress: string;
	dropoffLatitude: number;
	dropoffLongitude: number;
	estimatedDistance: number | null;
	estimatedDuration: number | null;
	packageSize: PackageSize | null;
	packageWeight: number | null;
	isFragile: boolean;
	requiresPhotoProof: boolean;
	recipientName: string | null;
	recipientPhone: string | null;
	totalAmount: number;
	acceptedAt: string | null;
	pickedUpAt: string | null;
	deliveredAt: string | null;
	cancelledAt: string | null;
	cancellationReason: string | null;
	createdAt: string;
	statusHistory: ErrandStatusHistoryDto[] | null;
	stops: ErrandStopDto[] | null;
	vendorId: string | null;
	vendorName: string | null;
	vendorOrderStatus: number | null;
}

export interface ErrandStatusHistoryDto {
	id: string;
	status: ErrandStatus;
	latitude: number | null;
	longitude: number | null;
	notes: string | null;
	imageUrl: string | null;
	createdAt: string;
}

export interface ErrandStopDto {
	id: string;
	stopOrder: number;
	address: string;
	latitude: number;
	longitude: number;
	contactName: string | null;
	contactPhone: string | null;
	instructions: string | null;
	status: ErrandStopStatus;
	arrivedAt: string | null;
	completedAt: string | null;
}

export interface RiderProfileDto {
	id: string;
	userId: string;
	riderName: string;
	vehicleType: VehicleType;
	licensePlate: string | null;
	approvalStatus: ApprovalStatus;
	rating: number;
	totalCompletedTasks: number;
	isOnline: boolean;
	currentLatitude: number | null;
	currentLongitude: number | null;
	lastLocationUpdate: string | null;
	createdAt: string;
}

export interface ApproveRiderRequest {
	status: ApprovalStatus;
	reason?: string;
}

export interface UserAddressDto {
	id: string;
	label: string;
	address: string;
	latitude: number;
	longitude: number;
	isDefault: boolean;
}

// ── API Response Wrappers ──────────────────────────────

export interface ApiError {
	code: string;
	message: string;
	details?: Record<string, string[]>;
}

export interface PaginationMeta {
	page: number;
	pageSize: number;
	totalCount: number;
	totalPages: number;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: ApiError;
	meta?: PaginationMeta;
}

// ── Dashboard Stats ────────────────────────────────────

export interface DashboardStats {
	totalUsers: number;
	activeRiders: number;
	todaysErrands: number;
	revenue: number;
	totalVendors: number;
	pendingVendors: number;
}

// ── Chat ───────────────────────────────────────────────

export enum MessageType {
	Text = 0,
	Image = 1,
	Location = 2,
	System = 3,
}

export interface ChatMessageDto {
	id: string;
	errandId: string;
	senderId: string;
	senderName: string;
	message: string;
	messageType: MessageType;
	isRead: boolean;
	createdAt: string;
}

// ── Notifications ──────────────────────────────────────

export enum NotificationType {
	ErrandCreated = 0,
	ErrandAccepted = 1,
	ErrandPickedUp = 2,
	ErrandDelivered = 3,
	ErrandCancelled = 4,
	PaymentReceived = 5,
	PaymentFailed = 6,
	WalletCredited = 7,
	WalletDebited = 8,
	NewMessage = 9,
	RatingReceived = 10,
	PromoCodeApplied = 11,
	RiderApproved = 12,
	RiderRejected = 13,
	TipReceived = 14,
	System = 15,
}

export interface NotificationDto {
	id: string;
	title: string;
	body: string;
	type: NotificationType;
	data: string | null;
	isRead: boolean;
	createdAt: string;
}

// ── Wallet & Payments ──────────────────────────────────

export enum TransactionType {
	Credit = 0,
	Debit = 1,
}

export enum TransactionSource {
	TopUp = 0,
	ErrandPayment = 1,
	ErrandEarning = 2,
	Refund = 3,
	Tip = 4,
	Bonus = 5,
	Withdrawal = 6,
	Commission = 7,
}

export enum DiscountType {
	Percentage = 0,
	FlatAmount = 1,
}

export enum PayoutStatus {
	Pending = 0,
	Processing = 1,
	Completed = 2,
	Failed = 3,
}

export interface WalletDto {
	id: string;
	balance: number;
	currency: string;
}

export interface WalletTransactionDto {
	id: string;
	type: TransactionType;
	amount: number;
	balanceAfter: number;
	source: TransactionSource;
	referenceId: string | null;
	description: string | null;
	createdAt: string;
}

export interface PromoCodeDto {
	id: string;
	code: string;
	discountType: DiscountType;
	discountValue: number;
	maxDiscount: number | null;
	minOrderAmount: number | null;
	usageLimit: number;
	usedCount: number;
	expiresAt: string | null;
	isActive: boolean;
	createdAt: string;
}

export interface RiderPayoutDto {
	id: string;
	amount: number;
	currency: string;
	status: PayoutStatus;
	paymentReference: string | null;
	failureReason: string | null;
	processedAt: string | null;
	periodStart: string;
	periodEnd: string;
	errandCount: number;
	createdAt: string;
}

export interface FinanceOverviewDto {
	totalRevenue: number;
	totalCommission: number;
	totalPayouts: number;
	pendingPayouts: number;
	totalTransactions: number;
	todayTransactions: number;
	revenueChart: DailyRevenueDto[];
}

export interface DailyRevenueDto {
	date: string;
	revenue: number;
	commission: number;
	errandCount: number;
}

// ── Tracking ───────────────────────────────────────────

export interface TrackingUpdateDto {
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

// ── Reviews ────────────────────────────────────────────

export interface ReviewDto {
	id: string;
	errandId: string;
	reviewerId: string;
	reviewerName: string;
	revieweeId: string;
	revieweeName: string;
	rating: number;
	comment: string | null;
	isApproved: boolean;
	isFlagged: boolean;
	flagReason: string | null;
	createdAt: string;
}

export interface ReviewSummaryDto {
	averageRating: number;
	totalReviews: number;
	fiveStarCount: number;
	fourStarCount: number;
	threeStarCount: number;
	twoStarCount: number;
	oneStarCount: number;
}

export interface NotificationPreferenceDto {
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

export interface NotificationTemplateDto {
	id: string;
	name: string;
	subject: string;
	body: string;
	htmlBody: string | null;
	channel: string;
	isActive: boolean;
	createdAt: string;
}

// ── Vendor / Marketplace ───────────────────────────────

export enum VendorStatus {
	Pending = "Pending",
	Active = "Active",
	Suspended = "Suspended",
	Closed = "Closed",
}

export enum OrderItemStatus {
	Pending = 0,
	Confirmed = 1,
	Preparing = 2,
	Ready = 3,
	Unavailable = 4,
}

export enum VendorOrderStatus {
	Received = 0,
	Confirmed = 1,
	Preparing = 2,
	ReadyForPickup = 3,
	Cancelled = 4,
}

export interface ServiceCategoryDto {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	iconUrl: string | null;
	sortOrder: number;
	isActive: boolean;
	requiresVendor: boolean;
}

export interface CreateServiceCategoryRequest {
	name: string;
	description?: string;
	iconUrl?: string;
	sortOrder?: number;
	isActive?: boolean;
	requiresVendor?: boolean;
}

export interface UpdateServiceCategoryRequest {
	name?: string;
	description?: string;
	iconUrl?: string;
	sortOrder?: number;
	isActive?: boolean;
	requiresVendor?: boolean;
}

export interface VendorDto {
	id: string;
	businessName: string;
	description: string | null;
	logoUrl: string | null;
	bannerUrl: string | null;
	phoneNumber: string | null;
	address: string;
	latitude: number;
	longitude: number;
	operatingHours: string | null;
	isOpen: boolean;
	minimumOrderAmount: number;
	deliveryFee: number;
	estimatedPrepTimeMinutes: number;
	rating: number;
	totalReviews: number;
	totalOrders: number;
	status: VendorStatus;
	serviceCategories: ServiceCategorySlimDto[];
	createdAt: string;
}

export interface VendorDetailDto extends VendorDto {
	userId: string;
	productCategories: ProductCategoryWithProductsDto[];
}

export interface ServiceCategorySlimDto {
	id: string;
	name: string;
	slug: string;
}

export interface ProductCategoryDto {
	id: string;
	vendorId: string;
	name: string;
	description: string | null;
	imageUrl: string | null;
	sortOrder: number;
	isActive: boolean;
}

export interface ProductCategoryWithProductsDto extends ProductCategoryDto {
	products: ProductDto[];
}

export interface ProductDto {
	id: string;
	vendorId: string;
	productCategoryId: string;
	name: string;
	description: string | null;
	price: number;
	compareAtPrice: number | null;
	imageUrl: string | null;
	isAvailable: boolean;
	isActive: boolean;
	sortOrder: number;
	variantsJson: string | null;
	extrasJson: string | null;
}

export interface OrderItemDto {
	id: string;
	errandId: string;
	productId: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	notes: string | null;
	selectedVariantJson: string | null;
	selectedExtrasJson: string | null;
	status: OrderItemStatus;
}

export interface UpdateVendorStatusRequest {
	status: VendorStatus;
	reason?: string;
}
