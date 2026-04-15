"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { UserRole } from "@/types";
import type { AuthResponse } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthShell } from "@/components/shared/auth-shell";

function getDashboardPath(role: UserRole): string {
	switch (role) {
		case UserRole.Merchant:
			return "/vendor";
		case UserRole.Rider:
			return "/rider";
		case UserRole.Admin:
		case UserRole.SupportAgent:
			return "/admin";
		default:
			return "/dashboard";
	}
}

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const ROLE_CONFIG: Record<string, { subtitle: string; placeholder: string }> = {
	vendor: {
		subtitle: "Sign in to your vendor dashboard",
		placeholder: "vendor@example.com",
	},
	rider: {
		subtitle: "Sign in to your rider account",
		placeholder: "rider@example.com",
	},
	default: {
		subtitle: "Sign in to your account",
		placeholder: "you@example.com",
	},
};

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const role = searchParams.get("role") ?? "";
	const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.default;
	const loginUser = useAuthStore((s) => s.login);
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginForm) => {
		setError(null);
		try {
			const res = await api.post<AuthResponse>("/auth/login", data);
			if (res.success && res.data) {
				loginUser(res.data.accessToken, res.data.user);
				const redirect = searchParams.get("redirect");
				router.push(redirect ?? getDashboardPath(res.data.user.role));
			} else {
				setError(res.error?.message ?? "Login failed. Please try again.");
			}
		} catch (err) {
			if (err instanceof TypeError && err.message.includes("fetch")) {
				setError(
					"Cannot connect to server. Please check that the backend is running.",
				);
			} else {
				setError("An unexpected error occurred. Please try again.");
			}
		}
	};

	return (
		<AuthShell
			title="Welcome back"
			subtitle={config.subtitle}
			footer={
				<p className="text-center text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link
						href={role ? `/register?role=${role}` : "/register"}
						className="font-semibold text-primary transition-colors hover:text-primary/80">
						Create one
					</Link>
				</p>
			}>
			{error && (
				<div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div className="space-y-2">
					<label
						htmlFor="email"
						className="block text-sm font-medium text-foreground">
						Email
					</label>
					<Input
						id="email"
						type="email"
						autoComplete="email"
						{...register("email")}
						placeholder={config.placeholder}
						className="h-11 rounded-xl border-border/80 bg-background/70"
					/>
					{errors.email && (
						<p className="text-xs text-red-600">{errors.email.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between gap-3">
						<label
							htmlFor="password"
							className="block text-sm font-medium text-foreground">
							Password
						</label>
						<Link
							href="/forgot-password"
							className="text-xs font-medium text-primary hover:text-primary/80">
							Forgot password?
						</Link>
					</div>
					<PasswordInput
						id="password"
						autoComplete="current-password"
						{...register("password")}
						placeholder="••••••••"
						className="h-11 rounded-xl border-border/80 bg-background/70"
					/>
					{errors.password && (
						<p className="text-xs text-red-600">{errors.password.message}</p>
					)}
				</div>

				<Button
					type="submit"
					disabled={isSubmitting}
					className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm shadow-primary/20">
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					Sign in
				</Button>
			</form>
		</AuthShell>
	);
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			}>
			<LoginForm />
		</Suspense>
	);
}
