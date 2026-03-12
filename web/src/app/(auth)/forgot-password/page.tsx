"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/client";

const forgotPasswordSchema = z.object({
	email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
	const [error, setError] = useState<string | null>(null);
	const [submitted, setSubmitted] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		getValues,
	} = useForm<ForgotPasswordForm>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const onSubmit = async (data: ForgotPasswordForm) => {
		setError(null);
		try {
			const res = await api.post("/auth/forgot-password", data);
			if (res.success) {
				setSubmitted(true);
			} else {
				setError(
					res.error?.message ?? "Failed to send reset link. Please try again.",
				);
			}
		} catch {
			setError("An unexpected error occurred.");
		}
	};

	if (submitted) {
		return (
			<div className="text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
					<CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
				</div>
				<h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
					Check your Email
				</h2>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
					We&apos;ve sent a password reset link to{" "}
					<span className="font-medium text-slate-700 dark:text-slate-300">
						{getValues("email")}
					</span>
				</p>
				<p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
					Didn&apos;t receive the email? Check your spam folder or{" "}
					<button
						onClick={() => setSubmitted(false)}
						className="font-medium text-blue-600 hover:text-blue-500"
					>
						try again
					</button>
				</p>
				<Link
					href="/login"
					className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Back to login
				</Link>
			</div>
		);
	}

	return (
		<>
			{/* Branding */}
			<div className="mb-8 text-center">
				<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
					Run<span className="text-blue-600">Am</span>
				</h1>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
					Reset your password
				</p>
			</div>

			<p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
				Enter the email address associated with your account and we&apos;ll send
				you a link to reset your password.
			</p>

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
						className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
					>
						Email
					</label>
					<input
						id="email"
						type="email"
						autoComplete="email"
						{...register("email")}
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
						placeholder="you@example.com"
					/>
					{errors.email && (
						<p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
					)}
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
				>
					{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
					Send Reset Link
				</button>
			</form>

			<p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
				Remember your password?{" "}
				<Link
					href="/login"
					className="font-medium text-blue-600 hover:text-blue-500"
				>
					Sign in
				</Link>
			</p>
		</>
	);
}
