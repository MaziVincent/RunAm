import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const errandStatusLabel: Record<number, string> = {
	0: "Pending",
	1: "Accepted",
	2: "En Route to Pickup",
	3: "Arrived at Pickup",
	4: "Package Collected",
	5: "En Route to Dropoff",
	6: "Arrived at Dropoff",
	7: "Delivered",
	8: "Cancelled",
	9: "Failed",
};

export const errandStatusColor: Record<number, string> = {
	0: "bg-yellow-100 text-yellow-800",
	1: "bg-blue-100 text-blue-800",
	2: "bg-indigo-100 text-indigo-800",
	3: "bg-indigo-100 text-indigo-800",
	4: "bg-purple-100 text-purple-800",
	5: "bg-indigo-100 text-indigo-800",
	6: "bg-indigo-100 text-indigo-800",
	7: "bg-green-100 text-green-800",
	8: "bg-red-100 text-red-800",
	9: "bg-red-100 text-red-800",
};

export const errandCategoryLabel: Record<number, string> = {
	0: "Package Delivery",
	1: "Food Delivery",
	2: "Grocery Shopping",
	3: "Document Delivery",
	4: "Pharmacy Pickup",
	5: "Laundry Pickup/Delivery",
	6: "Custom Errand",
	7: "Multi-Stop Delivery",
	8: "Return/Exchange",
	9: "Bill Payment",
};

export const userRoleLabel: Record<number, string> = {
	0: "Customer",
	1: "Rider",
	2: "Merchant",
	3: "Admin",
	4: "Support Agent",
};

export const userStatusLabel: Record<number, string> = {
	0: "Active",
	1: "Suspended",
	2: "Deactivated",
	3: "Pending Verification",
};

export const approvalStatusLabel: Record<number, string> = {
	0: "Pending",
	1: "Approved",
	2: "Rejected",
};

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		minimumFractionDigits: 0,
	}).format(amount);
}

export const vendorStatusLabel: Record<string, string> = {
	Pending: "Pending",
	Active: "Active",
	Suspended: "Suspended",
	Closed: "Closed",
};

export const vendorStatusColor: Record<string, string> = {
	Pending: "bg-yellow-100 text-yellow-800",
	Active: "bg-green-100 text-green-800",
	Suspended: "bg-red-100 text-red-800",
	Closed: "bg-slate-100 text-slate-800",
};

export const vendorOrderStatusLabel: Record<number, string> = {
	0: "Received",
	1: "Confirmed",
	2: "Preparing",
	3: "Ready for Pickup",
	4: "Cancelled",
};

export const vendorOrderStatusColor: Record<number, string> = {
	0: "bg-yellow-100 text-yellow-800",
	1: "bg-blue-100 text-blue-800",
	2: "bg-purple-100 text-purple-800",
	3: "bg-green-100 text-green-800",
	4: "bg-red-100 text-red-800",
};
