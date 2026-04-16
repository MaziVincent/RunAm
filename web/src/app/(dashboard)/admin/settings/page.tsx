"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Settings,
	Bell,
	Megaphone,
	Plus,
	Trash2,
	Send,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { NotificationTemplateDto } from "@/types";
import { toast } from "sonner";

interface CreateTemplateForm {
	name: string;
	subject: string;
	body: string;
	htmlBody: string;
	channel: string;
}

interface BroadcastForm {
	title: string;
	body: string;
	segment: string;
	templateId: string;
	sendEmail: boolean;
	sendSms: boolean;
	sendPush: boolean;
}

const CHANNELS = ["email", "sms", "push", "in-app"];

export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState<"templates" | "broadcast">(
		"templates",
	);

	const tabs = [
		{ id: "templates" as const, label: "Notification Templates", icon: Bell },
		{ id: "broadcast" as const, label: "Broadcast", icon: Megaphone },
	];

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Settings
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Manage notification templates and broadcast messages
				</p>
			</div>

			{/* Tab navigation */}
			<div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={cn(
							"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
							activeTab === tab.id
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
								: "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
						)}>
						<tab.icon className="h-4 w-4" />
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab content */}
			{activeTab === "templates" && <TemplatesSection />}
			{activeTab === "broadcast" && <BroadcastSection />}
		</div>
	);
}

/* ── Notification Templates ─────────────────────────── */

function TemplatesSection() {
	const queryClient = useQueryClient();
	const [showForm, setShowForm] = useState(false);
	const [page, setPage] = useState(1);

	const { data: res, isLoading } = useQuery({
		queryKey: ["notification-templates", page],
		queryFn: () =>
			api.get<NotificationTemplateDto[]>("/admin/notification-templates", {
				page,
				pageSize: 20,
			}),
	});

	const templates = res?.data ?? [];
	const meta = res?.meta;

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			api.delete(`/admin/notification-templates/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
			toast.success("Template deleted");
		},
		onError: () => toast.error("Failed to delete template"),
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
					Notification Templates
				</h2>
				<button
					onClick={() => setShowForm(!showForm)}
					className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
					<Plus className="h-4 w-4" />
					New Template
				</button>
			</div>

			{showForm && <CreateTemplateForm onClose={() => setShowForm(false)} />}

			{/* Templates table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								{["Name", "Subject", "Channel", "Status", "Created", ""].map(
									(h) => (
										<th
											key={h}
											className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
											{h}
										</th>
									),
								)}
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{isLoading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: 6 }).map((_, j) => (
											<td key={j} className="px-6 py-3">
												<div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
											</td>
										))}
									</tr>
								))
							) : templates.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-12 text-center text-slate-500">
										No notification templates yet
									</td>
								</tr>
							) : (
								templates.map((tpl) => (
									<tr
										key={tpl.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">
											{tpl.name}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">
											{tpl.subject}
										</td>
										<td className="whitespace-nowrap px-6 py-4">
											<span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
												{tpl.channel}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-4">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													tpl.isActive
														? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
														: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-400",
												)}>
												{tpl.isActive ? "Active" : "Inactive"}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-slate-500">
											{new Date(tpl.createdAt).toLocaleDateString()}
										</td>
										<td className="whitespace-nowrap px-6 py-4">
											<button
												onClick={() => {
													if (confirm("Delete this template?"))
														deleteMutation.mutate(tpl.id);
												}}
												className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
												<Trash2 className="h-4 w-4" />
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination */}
				{meta && meta.totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-200 px-6 py-3 dark:border-slate-800">
						<span className="text-sm text-slate-500">
							Page {meta.page} of {meta.totalPages}
						</span>
						<div className="flex gap-2">
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page <= 1}
								className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-700">
								<ChevronLeft className="h-4 w-4" />
							</button>
							<button
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= meta.totalPages}
								className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-slate-700">
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

/* ── Create Template Form ───────────────────────────── */

function CreateTemplateForm({ onClose }: { onClose: () => void }) {
	const queryClient = useQueryClient();
	const [form, setForm] = useState<CreateTemplateForm>({
		name: "",
		subject: "",
		body: "",
		htmlBody: "",
		channel: "push",
	});

	const mutation = useMutation({
		mutationFn: () =>
			api.post("/admin/notification-templates", {
				name: form.name,
				subject: form.subject,
				body: form.body,
				htmlBody: form.htmlBody || null,
				channel: form.channel,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notification-templates"] });
			toast.success("Template created");
			onClose();
		},
		onError: () => toast.error("Failed to create template"),
	});

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
			<h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
				New Notification Template
			</h3>
			<div className="grid gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Name
					</label>
					<input
						type="text"
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						placeholder="e.g. Welcome Email"
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Subject
					</label>
					<input
						type="text"
						value={form.subject}
						onChange={(e) => setForm({ ...form, subject: e.target.value })}
						placeholder="Notification subject"
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				</div>
				<div>
					<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Channel
					</label>
					<select
						value={form.channel}
						onChange={(e) => setForm({ ...form, channel: e.target.value })}
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
						{CHANNELS.map((ch) => (
							<option key={ch} value={ch}>
								{ch.charAt(0).toUpperCase() + ch.slice(1)}
							</option>
						))}
					</select>
				</div>
				<div className="sm:col-span-2">
					<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
						Body
					</label>
					<textarea
						value={form.body}
						onChange={(e) => setForm({ ...form, body: e.target.value })}
						rows={3}
						placeholder="Notification body text"
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				</div>
				<div className="sm:col-span-2">
					<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
						HTML Body{" "}
						<span className="text-slate-400">(optional, for email)</span>
					</label>
					<textarea
						value={form.htmlBody}
						onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
						rows={3}
						placeholder="<html>...</html>"
						className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				</div>
			</div>
			<div className="mt-4 flex justify-end gap-3">
				<button
					onClick={onClose}
					className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
					Cancel
				</button>
				<button
					onClick={() => mutation.mutate()}
					disabled={
						!form.name || !form.subject || !form.body || mutation.isPending
					}
					className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
					{mutation.isPending ? "Creating…" : "Create Template"}
				</button>
			</div>
		</div>
	);
}

/* ── Broadcast Notification ─────────────────────────── */

function BroadcastSection() {
	const [form, setForm] = useState<BroadcastForm>({
		title: "",
		body: "",
		segment: "",
		templateId: "",
		sendEmail: false,
		sendSms: false,
		sendPush: true,
	});

	const { data: templatesRes } = useQuery({
		queryKey: ["notification-templates", 1],
		queryFn: () =>
			api.get<NotificationTemplateDto[]>("/admin/notification-templates", {
				page: 1,
				pageSize: 100,
			}),
	});
	const templates = templatesRes?.data ?? [];

	const mutation = useMutation({
		mutationFn: () =>
			api.post("/admin/notifications/broadcast", {
				title: form.title,
				body: form.body,
				segment: form.segment || null,
				templateId: form.templateId || null,
				sendEmail: form.sendEmail,
				sendSms: form.sendSms,
				sendPush: form.sendPush,
			}),
		onSuccess: () => {
			toast.success("Notification broadcast sent");
			setForm({
				title: "",
				body: "",
				segment: "",
				templateId: "",
				sendEmail: false,
				sendSms: false,
				sendPush: true,
			});
		},
		onError: () => toast.error("Failed to send broadcast"),
	});

	return (
		<div className="space-y-6">
			<h2 className="text-lg font-semibold text-slate-900 dark:text-white">
				Broadcast Notification
			</h2>

			<div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
							Title
						</label>
						<input
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Notification title"
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
							Segment <span className="text-slate-400">(optional)</span>
						</label>
						<select
							value={form.segment}
							onChange={(e) => setForm({ ...form, segment: e.target.value })}
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
							<option value="">All Users</option>
							<option value="customers">Customers</option>
							<option value="riders">Riders</option>
							<option value="merchants">Merchants</option>
						</select>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
							Template <span className="text-slate-400">(optional)</span>
						</label>
						<select
							value={form.templateId}
							onChange={(e) => setForm({ ...form, templateId: e.target.value })}
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
							<option value="">None (custom message)</option>
							{templates.map((tpl) => (
								<option key={tpl.id} value={tpl.id}>
									{tpl.name}
								</option>
							))}
						</select>
					</div>
					<div className="sm:col-span-2">
						<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
							Body
						</label>
						<textarea
							value={form.body}
							onChange={(e) => setForm({ ...form, body: e.target.value })}
							rows={4}
							placeholder="Notification message body"
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
						/>
					</div>

					{/* Delivery channels */}
					<div className="sm:col-span-2">
						<label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
							Delivery Channels
						</label>
						<div className="flex flex-wrap gap-4">
							{[
								{ key: "sendPush" as const, label: "Push Notification" },
								{ key: "sendEmail" as const, label: "Email" },
								{ key: "sendSms" as const, label: "SMS" },
							].map((ch) => (
								<label
									key={ch.key}
									className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
									<input
										type="checkbox"
										checked={form[ch.key]}
										onChange={(e) =>
											setForm({ ...form, [ch.key]: e.target.checked })
										}
										className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
									/>
									{ch.label}
								</label>
							))}
						</div>
					</div>
				</div>

				<div className="mt-6 flex justify-end">
					<button
						onClick={() => {
							if (
								confirm(
									"Send this notification to all users in the selected segment?",
								)
							)
								mutation.mutate();
						}}
						disabled={
							!form.title ||
							!form.body ||
							(!form.sendPush && !form.sendEmail && !form.sendSms) ||
							mutation.isPending
						}
						className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
						<Send className="h-4 w-4" />
						{mutation.isPending ? "Sending…" : "Send Broadcast"}
					</button>
				</div>
			</div>
		</div>
	);
}
