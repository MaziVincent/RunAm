"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { UserRole } from "@/types";
import type { RegisterResponse } from "@/types";

const registerSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Please enter a valid email"),
	phoneNumber: z.string().min(10, "Please enter a valid phone number"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const ROLE_CONFIG: Record<
	string,
	{ subtitle: string; placeholder: string; userRole: UserRole }
> = {
	vendor: {
		subtitle: "Create your vendor account",
		placeholder: "vendor@example.com",
		userRole: UserRole.Merchant,
	},
	rider: {
		subtitle: "Create your rider account",
		placeholder: "rider@example.com",
		userRole: UserRole.Rider,
	},
	default: {
		subtitle: "Create your account",
		placeholder: "you@example.com",
		userRole: UserRole.Customer,
	},
};

function RegisterForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const role = searchParams.get("role") ?? "";
	const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.default;
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterFormData) => {
		setError(null);
		try {
			const res = await api.post<RegisterResponse>("/auth/register", {
				...data,
				role: config.userRole,
			});
			if (res.success && res.data?.requiresVerification) {
				router.push(`/verify?phone=${encodeURIComponent(data.phoneNumber)}`);
			} else {
				setError(
					res.error?.message ?? "Registration failed. Please try again.",
				);
			}
		} catch {
			setError("An unexpected error occurred.");
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
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="firstName"
							className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
							First Name
						</label>
						<input
							id="firstName"
							type="text"
							{...register("firstName")}
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							placeholder="John"
						/>
						{errors.firstName && (
							<p className="mt-1 text-xs text-red-600">
								{errors.firstName.message}
							</p>
						)}
					</div>
					<div>
						<label
							htmlFor="lastName"
							className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
							Last Name
						</label>
						<input
							id="lastName"
							type="text"
							{...register("lastName")}
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							placeholder="Doe"
						/>
						{errors.lastName && (
							<p className="mt-1 text-xs text-red-600">
								{errors.lastName.message}
							</p>
						)}
					</div>
				</div>

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
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
						placeholder={config.placeholder}
					/>
					{errors.email && (
						<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
					)}
				</div>

				<div>
					<label
						htmlFor="phoneNumber"
						className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Phone Number
					</label>
					<input
						id="phoneNumber"
						type="tel"
						{...register("phoneNumber")}
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
						placeholder="+234 800 000 0000"
					/>
					{errors.phoneNumber && (
						<p className="mt-1 text-xs text-red-600">
							{errors.phoneNumber.message}
						</p>
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
						autoComplete="new-password"
						{...register("password")}
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
					Create account
				</button>
			</form>

			<p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
				Already have an account?{" "}
				<Link
					href={role ? `/login?role=${role}` : "/login"}
					className="font-medium text-blue-600 hover:text-blue-500">
					Sign in
				</Link>
			</p>
		</>
	);
}

export default function RegisterPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			}>
			<RegisterForm />
		</Suspense>
	);
}
