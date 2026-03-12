import { Suspense } from "react";
import { ShopNavbar } from "@/components/shop/shop-navbar";
import { CartBar } from "@/components/shop/cart-bar";

export const metadata = {
	title: "Shop | RunAm",
	description:
		"Browse restaurants, stores, and services near you. Order for delivery or pickup on RunAm.",
};

export default function ShopLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col bg-muted/30">
			<Suspense>
				<ShopNavbar />
			</Suspense>
			<main className="flex-1 pb-20 md:pb-0">{children}</main>
			<CartBar />
		</div>
	);
}
