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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthShell } from "@/components/shared/auth-shell";

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
				router.push(
					`/verify?phone=${encodeURIComponent(res.data.phoneNumber)}`,
				);
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
		<AuthShell
			title="Create your account"
			subtitle={config.subtitle}
			footer={
				<p className="text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link
						href={role ? `/login?role=${role}` : "/login"}
						className="font-semibold text-primary transition-colors hover:text-primary/80">
						Sign in
					</Link>
				</p>
			}>
			{error && (
				<div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<label
							htmlFor="firstName"
							className="block text-sm font-medium text-foreground">
							First Name
						</label>
						<Input
							id="firstName"
							type="text"
							{...register("firstName")}
							placeholder="John"
							className="h-11 rounded-xl border-border/80 bg-background/70"
						/>
						{errors.firstName && (
							<p className="text-xs text-red-600">{errors.firstName.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<label
							htmlFor="lastName"
							className="block text-sm font-medium text-foreground">
							Last Name
						</label>
						<Input
							id="lastName"
							type="text"
							{...register("lastName")}
							placeholder="Doe"
							className="h-11 rounded-xl border-border/80 bg-background/70"
						/>
						{errors.lastName && (
							<p className="text-xs text-red-600">{errors.lastName.message}</p>
						)}
					</div>
				</div>

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
					<label
						htmlFor="phoneNumber"
						className="block text-sm font-medium text-foreground">
						Phone Number
					</label>
					<Input
						id="phoneNumber"
						type="tel"
						{...register("phoneNumber")}
						placeholder="+234 800 000 0000"
						className="h-11 rounded-xl border-border/80 bg-background/70"
					/>
					{errors.phoneNumber && (
						<p className="text-xs text-red-600">{errors.phoneNumber.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label
						htmlFor="password"
						className="block text-sm font-medium text-foreground">
						Password
					</label>
					<PasswordInput
						id="password"
						autoComplete="new-password"
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
					Create account
				</Button>
			</form>
		</AuthShell>
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
