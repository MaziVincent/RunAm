"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contactSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Please enter a valid email"),
	subject: z.string().min(1, "Subject is required"),
	message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const CONTACT_INFO = [
	{
		icon: Mail,
		label: "Email",
		value: "support@runam.ng",
		href: "mailto:support@runam.ng",
	},
	{
		icon: Phone,
		label: "Phone",
		value: "+234 800 RUN AM00",
		href: "tel:+2348007862600",
	},
	{
		icon: MapPin,
		label: "Address",
		value: "Lagos, Nigeria",
		href: null,
	},
];

export default function ContactPage() {
	const [submitted, setSubmitted] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ContactForm>({
		resolver: zodResolver(contactSchema),
	});

	const onSubmit = async (_data: ContactForm) => {
		// Simulate form submission
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setSubmitted(true);
	};

	return (
		<div className="bg-white dark:bg-slate-950">
			{/* Hero */}
			<section className="bg-gradient-to-br from-primary/5 via-white to-primary/10 py-24 dark:from-primary/10 dark:via-slate-950 dark:to-primary/5">
				<div className="mx-auto max-w-4xl px-4 text-center">
					<h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
						Get in <span className="text-primary">Touch</span>
					</h1>
					<p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
						Have a question, suggestion, or need help? We&apos;d love to hear
						from you.
					</p>
				</div>
			</section>

			{/* Contact Content */}
			<section className="py-20">
				<div className="mx-auto max-w-5xl px-4">
					<div className="grid gap-12 lg:grid-cols-5">
						{/* Contact Info */}
						<div className="lg:col-span-2">
							<h2 className="text-2xl font-bold text-slate-900 dark:text-white">
								Contact Information
							</h2>
							<p className="mt-3 text-slate-600 dark:text-slate-400">
								Reach out through any of these channels and we&apos;ll get back
								to you within 24 hours.
							</p>

							<div className="mt-8 space-y-6">
								{CONTACT_INFO.map((item) => (
									<div key={item.label} className="flex items-start gap-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<item.icon className="h-5 w-5" />
										</div>
										<div>
											<p className="text-sm font-medium text-slate-900 dark:text-white">
												{item.label}
											</p>
											{item.href ? (
												<a
													href={item.href}
													className="text-sm text-primary hover:underline">
													{item.value}
												</a>
											) : (
												<p className="text-sm text-slate-600 dark:text-slate-400">
													{item.value}
												</p>
											)}
										</div>
									</div>
								))}
							</div>

							<div className="mt-10">
								<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
									Business Hours
								</h3>
								<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
									Monday – Friday: 8:00 AM – 8:00 PM (WAT)
								</p>
								<p className="text-sm text-slate-600 dark:text-slate-400">
									Saturday: 9:00 AM – 5:00 PM (WAT)
								</p>
								<p className="text-sm text-slate-600 dark:text-slate-400">
									Sunday: Closed
								</p>
							</div>
						</div>

						{/* Contact Form */}
						<div className="lg:col-span-3">
							<div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
								{submitted ? (
									<div className="flex flex-col items-center py-12 text-center">
										<div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
											<CheckCircle2 className="h-7 w-7" />
										</div>
										<h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
											Message Sent!
										</h3>
										<p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
											Thank you for reaching out. We&apos;ll get back to you
											within 24 hours.
										</p>
										<button
											onClick={() => setSubmitted(false)}
											className="mt-6 text-sm font-medium text-primary hover:underline">
											Send another message
										</button>
									</div>
								) : (
									<>
										<h2 className="text-xl font-bold text-slate-900 dark:text-white">
											Send us a Message
										</h2>
										<form
											onSubmit={handleSubmit(onSubmit)}
											className="mt-6 space-y-5">
											<div>
												<label
													htmlFor="name"
													className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
													Full Name
												</label>
												<input
													id="name"
													{...register("name")}
													className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
													placeholder="Your name"
												/>
												{errors.name && (
													<p className="mt-1 text-xs text-red-600">
														{errors.name.message}
													</p>
												)}
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
													{...register("email")}
													className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
													placeholder="you@example.com"
												/>
												{errors.email && (
													<p className="mt-1 text-xs text-red-600">
														{errors.email.message}
													</p>
												)}
											</div>

											<div>
												<label
													htmlFor="subject"
													className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
													Subject
												</label>
												<input
													id="subject"
													{...register("subject")}
													className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
													placeholder="What's this about?"
												/>
												{errors.subject && (
													<p className="mt-1 text-xs text-red-600">
														{errors.subject.message}
													</p>
												)}
											</div>

											<div>
												<label
													htmlFor="message"
													className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
													Message
												</label>
												<textarea
													id="message"
													rows={5}
													{...register("message")}
													className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
													placeholder="Tell us how we can help..."
												/>
												{errors.message && (
													<p className="mt-1 text-xs text-red-600">
														{errors.message.message}
													</p>
												)}
											</div>

											<button
												type="submit"
												disabled={isSubmitting}
												className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60">
												{isSubmitting ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Send className="h-4 w-4" />
												)}
												Send Message
											</button>
										</form>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
