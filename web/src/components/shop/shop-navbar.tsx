"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
	Search,
	ShoppingCart,
	MapPin,
	X,
	ArrowLeft,
	User,
	Menu,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDebounce, useGeolocation } from "@/lib/hooks";
import RunAmLogo from "@/assets/RunAmLogo.png";

function useLocationName(lat?: number, lng?: number) {
	const [name, setName] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!lat || !lng) return;
		let cancelled = false;
		setLoading(true);

		fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
			{ headers: { "Accept-Language": "en" } },
		)
			.then((r) => r.json())
			.then((data) => {
				if (cancelled) return;
				const addr = data?.address;
				const display =
					addr?.neighbourhood ||
					addr?.suburb ||
					addr?.city_district ||
					addr?.city ||
					addr?.town ||
					addr?.state ||
					null;
				setName(display);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [lat, lng]);

	return { name, loading };
}

export function ShopNavbar() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isAuthenticated, user } = useAuthStore();
	const itemCount = useCartStore((s) => s.getItemCount());

	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
	const debouncedQuery = useDebounce(searchQuery, 400);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const { lat, lng, loading: geoLoading } = useGeolocation();
	const { name: locationName, loading: locationLoading } = useLocationName(lat, lng);

	// Navigate on debounced search
	useEffect(() => {
		if (debouncedQuery && debouncedQuery.length >= 2) {
			const params = new URLSearchParams(searchParams.toString());
			params.set("q", debouncedQuery);
			router.push(`/shop?${params.toString()}`);
		}
	}, [debouncedQuery]);

	const isShopHome = pathname === "/shop";
	const isVendorPage = pathname.startsWith("/shop/vendors/");
	
	//const isScrolled = scrollY > 20;
	return (
		<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<nav className="container mx-auto flex h-14 items-center gap-3 px-4 lg:h-16">
				{/* Back / Logo */}
				{isVendorPage ? (
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
						className="shrink-0">
						<ArrowLeft className="h-5 w-5" />
						<span className="sr-only">Back</span>
					</Button>
				) : (
					<Link href="/" className="flex shrink-0 items-center gap-2">
						<Image
												src="/logo.svg"
												alt="RunAm"
												width={120}
												height={36}
												className={cn("h-9 w-auto")}
												priority
											/>
						
					</Link>
				)}

				{/* Search bar — desktop */}
				<div className="relative hidden flex-1 md:block">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						ref={searchInputRef}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search restaurants, stores, or items..."
						className="h-10 w-full max-w-lg pl-10 pr-10"
					/>
					{searchQuery && (
						<button
							onClick={() => {
								setSearchQuery("");
								searchInputRef.current?.focus();
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
							<X className="h-4 w-4" />
						</button>
					)}
				</div>

				{/* Mobile search toggle */}
				<Button
					variant="ghost"
					size="icon"
					className="md:hidden"
					onClick={() => setSearchOpen(!searchOpen)}>
					<Search className="h-5 w-5" />
				</Button>

				{/* Spacer on mobile */}
				<div className="flex-1 md:hidden" />

				{/* Location indicator (compact) */}
				<button className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:flex">
					<MapPin className="h-4 w-4 text-primary" />
					{geoLoading || locationLoading ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						<span className="max-w-[160px] truncate">
							{locationName ?? "Set location"}
						</span>
					)}
				</button>

				{/* Cart button */}
				<Button
					variant="outline"
					size="default"
					asChild
					className="relative gap-2">
					<Link href="/shop/cart">
						<ShoppingCart className="h-4 w-4" />
						<span className="hidden sm:inline">Cart</span>
						{itemCount > 0 && (
							<Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]">
								{itemCount > 99 ? "99+" : itemCount}
							</Badge>
						)}
					</Link>
				</Button>

				{/* User / Auth */}
				{isAuthenticated ? (
					<Button variant="ghost" size="icon" asChild>
						<Link href="/dashboard">
							<User className="h-5 w-5" />
							<span className="sr-only">Dashboard</span>
						</Link>
					</Button>
				) : (
					<>
						<Button variant="ghost" size="icon" asChild className="sm:hidden">
							<Link href="/login">
								<User className="h-5 w-5" />
								<span className="sr-only">Sign In</span>
							</Link>
						</Button>
						<Button size="sm" asChild className="hidden sm:flex">
							<Link href="/login">Sign In</Link>
						</Button>
					</>
				)}
			</nav>

			{/* Mobile search bar (expandable) */}
			{searchOpen && (
				<div className="border-t px-4 py-2 md:hidden">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search..."
							className="pl-10"
							autoFocus
						/>
					</div>
				</div>
			)}
		</header>
	);
}
