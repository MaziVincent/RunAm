"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
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

const CODE_LENGTH = 6;

function VerifyForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const phone = searchParams.get("phone") ?? "";
	const loginUser = useAuthStore((s) => s.login);

	const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [verified, setVerified] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);

	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	useEffect(() => {
		inputRefs.current[0]?.focus();
	}, []);

	useEffect(() => {
		if (resendCooldown <= 0) return;
		const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [resendCooldown]);

	function handleChange(index: number, value: string) {
		if (!/^\d*$/.test(value)) return;
		const newCode = [...code];
		newCode[index] = value.slice(-1);
		setCode(newCode);

		if (value && index < CODE_LENGTH - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	}

	function handleKeyDown(index: number, e: React.KeyboardEvent) {
		if (e.key === "Backspace" && !code[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	}

	function handlePaste(e: React.ClipboardEvent) {
		e.preventDefault();
		const pasted = e.clipboardData
			.getData("text")
			.replace(/\D/g, "")
			.slice(0, CODE_LENGTH);
		const newCode = [...code];
		for (let i = 0; i < pasted.length; i++) {
			newCode[i] = pasted[i];
		}
		setCode(newCode);
		const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
		inputRefs.current[nextIndex]?.focus();
	}

	async function handleVerify() {
		const otp = code.join("");
		if (otp.length !== CODE_LENGTH) {
			setError("Please enter the complete verification code");
			return;
		}

		setError(null);
		setIsSubmitting(true);
		try {
			const res = await api.post<AuthResponse>("/auth/verify-otp", {
				phoneNumber: phone,
				code: otp,
			});
			if (res.success && res.data) {
				setVerified(true);
				loginUser(res.data.accessToken, res.data.refreshToken, res.data.user);
				const dest = getDashboardPath(res.data.user.role);
				setTimeout(() => router.push(dest), 2000);
			} else {
				setError(res.error?.message ?? "Invalid code. Please try again.");
			}
		} catch {
			setError("An unexpected error occurred.");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleResend() {
		if (resendCooldown > 0) return;
		try {
			await api.post("/auth/resend-otp", { phoneNumber: phone });
			setResendCooldown(60);
		} catch {
			setError("Failed to resend code.");
		}
	}

	if (verified) {
		return (
			<div className="text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
					<CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
				</div>
				<h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
					Verified!
				</h2>
				<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
					Your account has been verified. Redirecting to dashboard...
				</p>
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
					Verify your account
				</p>
			</div>

			<p className="mb-6 text-center text-sm text-slate-600 dark:text-slate-400">
				{phone ? (
					<>
						We&apos;ve sent a {CODE_LENGTH}-digit code to{" "}
						<span className="font-medium text-slate-700 dark:text-slate-300">
							{phone}
						</span>
					</>
				) : (
					<>
						Enter the {CODE_LENGTH}-digit verification code sent to your phone
					</>
				)}
			</p>

			{/* Error */}
			{error && (
				<div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
					{error}
				</div>
			)}

			{/* OTP Input */}
			<div className="flex justify-center gap-2" onPaste={handlePaste}>
				{code.map((digit, index) => (
					<input
						key={index}
						ref={(el) => {
							inputRefs.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={digit}
						onChange={(e) => handleChange(index, e.target.value)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						className="h-12 w-12 rounded-lg border border-slate-300 bg-white text-center text-lg font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				))}
			</div>

			{/* Verify Button */}
			<button
				onClick={handleVerify}
				disabled={isSubmitting || code.join("").length !== CODE_LENGTH}
				className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60">
				{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
				Verify
			</button>

			{/* Resend */}
			<p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
				Didn&apos;t receive the code?{" "}
				{resendCooldown > 0 ? (
					<span className="text-slate-400">Resend in {resendCooldown}s</span>
				) : (
					<button
						onClick={handleResend}
						className="font-medium text-blue-600 hover:text-blue-500">
						Resend Code
					</button>
				)}
			</p>

			<div className="mt-6 text-center">
				<Link
					href="/login"
					className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500">
					<ArrowLeft className="h-3.5 w-3.5" />
					Back to login
				</Link>
			</div>
		</>
	);
}

export default function VerifyPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			}>
			<VerifyForm />
		</Suspense>
	);
}
