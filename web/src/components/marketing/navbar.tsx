"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useScrollPosition } from "@/lib/hooks";
import { useAuthStore } from "@/lib/stores/auth-store";

const navLinks = [
	{ label: "How It Works", href: "/#how-it-works" },
	{ label: "Services", href: "/#services" },
	{ label: "For Vendors", href: "/#vendors" },
	{ label: "Shop", href: "/shop" },
];

export function Navbar() {
	const pathname = usePathname();
	const scrollY = useScrollPosition();
	const { isAuthenticated, user } = useAuthStore();
	const [mobileOpen, setMobileOpen] = useState(false);

	const isHome = pathname === "/";
	const isScrolled = scrollY > 20;

	// On the home page, the navbar starts transparent and becomes solid on scroll
	// On other pages, it's always solid
	const isTransparent = isHome && !isScrolled;

	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-50 transition-all duration-300",
				isTransparent
					? "bg-transparent"
					: "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
			)}>
			<nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:h-18">
				{/* Logo */}
				<Link href="/" className="flex items-center gap-2">
					<Image
						src="/logo.svg"
						alt="RunAm"
						width={120}
						height={36}
						className={cn(
							"h-9 w-auto",
							isTransparent && "brightness-0 invert",
						)}
						priority
					/>
				</Link>

				{/* Desktop nav links */}
				<div className="hidden items-center gap-1 md:flex">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={cn(
								"rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isTransparent
									? "text-white/80 hover:text-white hover:bg-white/10"
									: "text-muted-foreground hover:text-foreground hover:bg-accent",
								pathname === link.href &&
									!isTransparent &&
									"text-foreground bg-accent",
							)}>
							{link.label}
						</Link>
					))}
				</div>

				{/* Desktop actions */}
				<div className="hidden items-center gap-3 md:flex">
					{isAuthenticated && user ? (
						<Button
							variant={isTransparent ? "secondary" : "default"}
							size="sm"
							asChild>
							<Link
								href={
									user.role === 2
										? "/vendor"
										: user.role === 1
											? "/rider"
											: user.role === 3
												? "/admin"
												: "/dashboard"
								}>
								<User className="mr-2 h-4 w-4" />
								Dashboard
							</Link>
						</Button>
					) : (
						<>
							<Button
								variant="ghost"
								size="sm"
								asChild
								className={cn(isTransparent && "text-white hover:bg-white/10")}>
								<Link href="/login">Sign In</Link>
							</Button>
							<Button
								size="sm"
								asChild
								className={cn(
									isTransparent && "bg-white text-primary hover:bg-white/90",
								)}>
								<Link href="/register">Get Started</Link>
							</Button>
						</>
					)}
				</div>

				{/* Mobile menu */}
				<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
					<SheetTrigger asChild className="md:hidden">
						<Button
							variant="ghost"
							size="icon"
							className={cn(isTransparent && "text-white hover:bg-white/10")}>
							<Menu className="h-5 w-5" />
							<span className="sr-only">Menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-72">
						<div className="flex flex-col gap-6 pt-8">
							<Link
								href="/"
								className="flex items-center gap-2"
								onClick={() => setMobileOpen(false)}>
								<Image
									src="/logo.svg"
									alt="RunAm"
									width={120}
									height={36}
									className="h-9 w-auto"
								/>
							</Link>

							<div className="flex flex-col gap-1">
								{navLinks.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										onClick={() => setMobileOpen(false)}
										className={cn(
											"rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
											pathname === link.href
												? "bg-accent text-foreground"
												: "text-muted-foreground",
										)}>
										{link.label}
									</Link>
								))}
							</div>

							<div className="flex flex-col gap-2 border-t pt-4">
								{isAuthenticated ? (
									<Button asChild>
										<Link
											href={
												user?.role === 2
													? "/vendor"
													: user?.role === 1
														? "/rider"
														: user?.role === 3
															? "/admin"
															: "/dashboard"
											}
											onClick={() => setMobileOpen(false)}>
											Dashboard
										</Link>
									</Button>
								) : (
									<>
										<Button variant="outline" asChild>
											<Link href="/login" onClick={() => setMobileOpen(false)}>
												Sign In
											</Link>
										</Button>
										<Button asChild>
											<Link
												href="/register"
												onClick={() => setMobileOpen(false)}>
												Get Started
											</Link>
										</Button>
									</>
								)}
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</nav>
		</header>
	);
}
