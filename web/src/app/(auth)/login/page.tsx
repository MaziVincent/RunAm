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
				setError("Cannot connect to server. Please check that the backend is running.");
			} else {
				setError("An unexpected error occurred. Please try again.");
			}
		}
	};

	return (
		<>
			{/* Branding */}
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
					Run<span className="text-blue-600">Am</span>
				</h1>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
					{config.subtitle}
				</p>
			</div>

			{/* Error */}
			{error && (
				<div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
					{error}
				</div>
			)}

			{/* Form */}
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
				<div>
					<label
						htmlFor="email"
						className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Email
					</label>
					<input
						id="email"
						type="email"
						autoComplete="email"
						{...register("email")}
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
						placeholder={config.placeholder}
					/>
					{errors.email && (
						<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="password"
						className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Password
					</label>
					<input
						id="password"
						type="password"
						autoComplete="current-password"
						{...register("password")}
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
						placeholder="••••••••"
					/>
					{errors.password && (
						<p className="mt-1 text-xs text-red-600">
							{errors.password.message}
						</p>
					)}
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60">
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					Sign in
				</button>
			</form>

			<p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
				Don&apos;t have an account?{" "}
				<Link
					href={role ? `/register?role=${role}` : "/register"}
					className="font-medium text-blue-600 hover:text-blue-500">
					Register
				</Link>
			</p>
		</>
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
