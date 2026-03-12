"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
	children: React.ReactNode;
	allowedRoles?: UserRole[];
	redirectTo?: string;
}

export function AuthGuard({
	children,
	allowedRoles,
	redirectTo = "/login",
}: AuthGuardProps) {
	const router = useRouter();
	const { user, isAuthenticated, hydrate } = useAuthStore();
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		hydrate();
		setHydrated(true);
	}, [hydrate]);

	useEffect(() => {
		if (!hydrated) return;

		if (!isAuthenticated) {
			const currentPath =
				typeof window !== "undefined" ? window.location.pathname : "";
			router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
			return;
		}

		if (allowedRoles && user && !allowedRoles.includes(user.role)) {
			// Redirect to the appropriate dashboard based on their actual role
			const roleRedirects: Record<number, string> = {
				[UserRole.Customer]: "/dashboard",
				[UserRole.Rider]: "/rider",
				[UserRole.Merchant]: "/vendor",
				[UserRole.Admin]: "/admin",
				[UserRole.SupportAgent]: "/admin",
			};
			router.push(roleRedirects[user.role] ?? "/");
		}
	}, [hydrated, isAuthenticated, user, allowedRoles, router, redirectTo]);

	if (!hydrated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (allowedRoles && user && !allowedRoles.includes(user.role)) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return <>{children}</>;
}
