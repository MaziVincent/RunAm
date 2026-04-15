"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function CartBar() {
	const [hasMounted, setHasMounted] = useState(false);
	const { getItemCount, getSubtotal, getVendorCount } = useCartStore();

	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (!hasMounted) return null;

	const itemCount = getItemCount();
	const subtotal = getSubtotal();
	const vendorCount = getVendorCount();

	if (itemCount === 0) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ y: 80, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 80, opacity: 0 }}
				transition={{ type: "spring", stiffness: 300, damping: 26 }}
				className="fixed bottom-0 left-0 right-0 z-50 p-3 md:hidden">
				<Button
					asChild
					className="flex h-14 w-full items-center justify-between rounded-2xl px-5 shadow-lg">
					<Link href="/shop/cart">
						<div className="flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
								{itemCount}
							</div>
							<div className="text-left">
								<p className="text-sm font-semibold">View Cart</p>
								<p className="text-xs opacity-80">
									{vendorCount === 1 ? "1 vendor" : `${vendorCount} vendors`}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-1">
							<span className="font-bold">{formatCurrency(subtotal)}</span>
							<ChevronRight className="h-4 w-4" />
						</div>
					</Link>
				</Button>
			</motion.div>
		</AnimatePresence>
	);
}
