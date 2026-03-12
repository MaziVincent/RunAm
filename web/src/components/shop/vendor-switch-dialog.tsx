"use client";

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

interface VendorSwitchDialogProps {
	open: boolean;
	currentVendor: string;
	newVendor: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function VendorSwitchDialog({
	open,
	currentVendor,
	newVendor,
	onConfirm,
	onCancel,
}: VendorSwitchDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Switch Vendor?</AlertDialogTitle>
					<AlertDialogDescription>
						You already have items from{" "}
						<span className="font-semibold text-foreground">
							{currentVendor}
						</span>{" "}
						in your cart. Adding items from{" "}
						<span className="font-semibold text-foreground">{newVendor}</span>{" "}
						will replace your current cart.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>Keep Current</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						Switch &amp; Replace Cart
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
