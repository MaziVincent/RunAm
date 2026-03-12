"use client";

import { useState } from "react";
import {
	MapPin,
	Plus,
	Pencil,
	Trash2,
	Star,
	Home,
	Briefcase,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAddresses, useCreateAddress } from "@/lib/hooks";
import { UserAddressDto } from "@/types";
import { toast } from "sonner";

type AddressType = "Home" | "Work" | "Other";

const ADDRESS_ICONS: Record<AddressType, React.ReactNode> = {
	Home: <Home className="h-4 w-4" />,
	Work: <Briefcase className="h-4 w-4" />,
	Other: <MapPin className="h-4 w-4" />,
};

interface AddressFormData {
	label: string;
	type: AddressType;
	address: string;
	city: string;
	state: string;
	isDefault: boolean;
}

const emptyForm: AddressFormData = {
	label: "",
	type: "Home",
	address: "",
	city: "",
	state: "",
	isDefault: false,
};

function AddressFormDialog({
	open,
	onOpenChange,
	initial,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initial?: AddressFormData;
}) {
	const [form, setForm] = useState<AddressFormData>(initial ?? emptyForm);
	const createAddress = useCreateAddress();

	const isEdit = !!initial;

	function update(key: keyof AddressFormData, value: string | boolean) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	async function handleSave() {
		if (!form.label || !form.address || !form.city || !form.state) {
			toast.error("Please fill all fields");
			return;
		}
		try {
			await createAddress.mutateAsync({
				label: form.label,
				address: `${form.address}, ${form.city}, ${form.state}`,
				latitude: 0,
				longitude: 0,
				isDefault: form.isDefault,
			});
			toast.success(isEdit ? "Address updated" : "Address added");
			onOpenChange(false);
			setForm(emptyForm);
		} catch {
			toast.error("Failed to save address");
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Edit" : "Add"} Address</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>Label</Label>
							<Input
								value={form.label}
								onChange={(e) => update("label", e.target.value)}
								placeholder="e.g. My Home"
							/>
						</div>
						<div className="space-y-2">
							<Label>Type</Label>
							<Select
								value={form.type}
								onValueChange={(v) => update("type", v)}>
								<SelectTrigger className="h-10">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Home">Home</SelectItem>
									<SelectItem value="Work">Work</SelectItem>
									<SelectItem value="Other">Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Street Address</Label>
						<Input
							value={form.address}
							onChange={(e) => update("address", e.target.value)}
							placeholder="Enter street address"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>City</Label>
							<Input
								value={form.city}
								onChange={(e) => update("city", e.target.value)}
								placeholder="City"
							/>
						</div>
						<div className="space-y-2">
							<Label>State</Label>
							<Input
								value={form.state}
								onChange={(e) => update("state", e.target.value)}
								placeholder="State"
							/>
						</div>
					</div>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={form.isDefault}
							onChange={(e) => update("isDefault", e.target.checked)}
							className="h-4 w-4 rounded border-border"
						/>
						Set as default address
					</label>
					<Button
						className="w-full"
						onClick={handleSave}
						disabled={createAddress.isPending}>
						{createAddress.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{isEdit ? "Update Address" : "Add Address"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function AddressCard({ address }: { address: UserAddressDto }) {
	// Derive type from label heuristic
	const labelLower = address.label.toLowerCase();
	const typeKey: AddressType = labelLower.includes("home")
		? "Home"
		: labelLower.includes("work") || labelLower.includes("office")
			? "Work"
			: "Other";
	return (
		<Card>
			<CardContent className="flex items-start gap-3 p-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
					{ADDRESS_ICONS[typeKey] ?? <MapPin className="h-4 w-4" />}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="font-medium">{address.label}</p>
						{address.isDefault && (
							<Badge variant="secondary" className="text-[10px]">
								<Star className="mr-1 h-3 w-3 fill-current" />
								Default
							</Badge>
						)}
					</div>
					<p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
						{address.address}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

export default function AddressesPage() {
	const [dialogOpen, setDialogOpen] = useState(false);
	const { data, isLoading } = useAddresses();
	const addresses = data?.data ?? [];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Addresses</h1>
					<p className="text-sm text-muted-foreground">
						Manage your saved addresses
					</p>
				</div>
				<Button className="gap-2" onClick={() => setDialogOpen(true)}>
					<Plus className="h-4 w-4" />
					<span className="hidden sm:inline">Add Address</span>
					<span className="sm:hidden">Add</span>
				</Button>
			</div>

			{/* Address List */}
			{isLoading ? (
				<div className="grid gap-3 sm:grid-cols-2">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
			) : addresses.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<MapPin className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-3 font-medium">No saved addresses</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Add your frequently used addresses for faster checkout
						</p>
						<Button className="mt-4 gap-2" onClick={() => setDialogOpen(true)}>
							<Plus className="h-4 w-4" />
							Add Your First Address
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-3 sm:grid-cols-2">
					{addresses.map((address) => (
						<AddressCard key={address.id} address={address} />
					))}
				</div>
			)}

			{/* Add/Edit Dialog */}
			<AddressFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
		</div>
	);
}
