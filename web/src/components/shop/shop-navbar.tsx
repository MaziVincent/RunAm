"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
	Search,
	ShoppingCart,
	MapPin,
	X,
	ArrowLeft,
	User,
	Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDebounce } from "@/lib/hooks";

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
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white text-sm">
							R
						</div>
						<span className="hidden text-lg font-bold sm:inline">RunAm</span>
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
					<span className="max-w-[120px] truncate">Lekki Phase 1</span>
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
