"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ReviewDto, ApiResponse, NotificationTemplateDto } from "@/types";
import {
	Star,
	Flag,
	CheckCircle,
	XCircle,
	MessageSquare,
	Plus,
	Trash2,
	Send,
	Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Star Rating Display ─────────────────────────
function StarRating({ rating }: { rating: number }) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={cn(
						"h-4 w-4",
						star <= rating
							? "fill-yellow-400 text-yellow-400"
							: "text-slate-300",
					)}
				/>
			))}
		</div>
	);
}

// ── Notification Templates Section ──────────────

function NotificationTemplatesSection() {
	const queryClient = useQueryClient();
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [channel, setChannel] = useState("All");

	const { data: templates } = useQuery({
		queryKey: ["admin", "notification-templates"],
		queryFn: () =>
			api.get<NotificationTemplateDto[]>("/admin/notification-templates"),
	});

	const createMutation = useMutation({
		mutationFn: () =>
			api.post<NotificationTemplateDto>("/admin/notification-templates", {
				body: { name, subject, body, channel },
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["admin", "notification-templates"],
			});
			setShowForm(false);
			setName("");
			setSubject("");
			setBody("");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) =>
			api.delete(`/admin/notification-templates/${id}`),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["admin", "notification-templates"],
			}),
	});

	const templateList = templates?.data ?? [];

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-6">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-slate-900">
					Notification Templates
				</h2>
				<button
					onClick={() => setShowForm(!showForm)}
					className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
					<Plus className="h-4 w-4" />
					New Template
				</button>
			</div>

			{showForm && (
				<div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Template name"
						className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					/>
					<input
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						placeholder="Subject"
						className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					/>
					<textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						placeholder="Body text"
						rows={3}
						className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
					/>
					<div className="flex items-center gap-3">
						<select
							value={channel}
							onChange={(e) => setChannel(e.target.value)}
							className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
							<option>All</option>
							<option>InApp</option>
							<option>Email</option>
							<option>Sms</option>
							<option>Push</option>
						</select>
						<button
							onClick={() => createMutation.mutate()}
							disabled={!name || !subject || !body}
							className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
							Save
						</button>
						<button
							onClick={() => setShowForm(false)}
							className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
							Cancel
						</button>
					</div>
				</div>
			)}

			<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead>
						<tr className="border-b border-slate-200 text-slate-500">
							<th className="pb-3 font-medium">Name</th>
							<th className="pb-3 font-medium">Subject</th>
							<th className="pb-3 font-medium">Channel</th>
							<th className="pb-3 font-medium">Created</th>
							<th className="pb-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{templateList.map((t) => (
							<tr
								key={t.id}
								className="border-b border-slate-100 last:border-0">
								<td className="py-3 font-medium text-slate-900">{t.name}</td>
								<td className="py-3 text-slate-600">{t.subject}</td>
								<td className="py-3">
									<span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
										{t.channel}
									</span>
								</td>
								<td className="py-3 text-slate-500">
									{new Date(t.createdAt).toLocaleDateString()}
								</td>
								<td className="py-3">
									<button
										onClick={() => deleteMutation.mutate(t.id)}
										className="rounded p-1 text-red-500 hover:bg-red-50">
										<Trash2 className="h-4 w-4" />
									</button>
								</td>
							</tr>
						))}
						{templateList.length === 0 && (
							<tr>
								<td colSpan={5} className="py-6 text-center text-slate-400">
									No templates yet
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}

// ── Broadcast Section ───────────────────────────

function BroadcastSection() {
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [segment, setSegment] = useState("all");
	const [sendEmail, setSendEmail] = useState(false);
	const [sendSms, setSendSms] = useState(false);
	const [sendPush, setSendPush] = useState(true);
	const [sent, setSent] = useState(false);

	const broadcastMutation = useMutation({
		mutationFn: () =>
			api.post("/admin/notifications/broadcast", {
				body: { title, body, segment, sendEmail, sendSms, sendPush },
			}),
		onSuccess: () => {
			setSent(true);
			setTimeout(() => setSent(false), 3000);
			setTitle("");
			setBody("");
		},
	});

	return (
		<div className="rounded-xl border border-slate-200 bg-white p-6">
			<h2 className="mb-4 text-lg font-semibold text-slate-900">
				Broadcast Notification
			</h2>

			<div className="space-y-3">
				<input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Notification title"
					className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				/>
				<textarea
					value={body}
					onChange={(e) => setBody(e.target.value)}
					placeholder="Notification body"
					rows={3}
					className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
				/>

				<div className="flex flex-wrap items-center gap-4">
					<div>
						<label className="text-xs font-medium text-slate-500">
							Segment
						</label>
						<select
							value={segment}
							onChange={(e) => setSegment(e.target.value)}
							className="ml-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm">
							<option value="all">All Users</option>
							<option value="customers">Customers</option>
							<option value="riders">Riders</option>
						</select>
					</div>

					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={sendPush}
							onChange={(e) => setSendPush(e.target.checked)}
							className="rounded"
						/>
						Push
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={sendEmail}
							onChange={(e) => setSendEmail(e.target.checked)}
							className="rounded"
						/>
						Email
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							checked={sendSms}
							onChange={(e) => setSendSms(e.target.checked)}
							className="rounded"
						/>
						SMS
					</label>
				</div>

				<button
					onClick={() => broadcastMutation.mutate()}
					disabled={!title || !body || broadcastMutation.isPending}
					className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
					<Send className="h-4 w-4" />
					{broadcastMutation.isPending ? "Sending..." : "Send Broadcast"}
				</button>

				{sent && (
					<p className="text-sm font-medium text-green-600">
						Broadcast sent successfully!
					</p>
				)}
			</div>
		</div>
	);
}

// ── Main Page ───────────────────────────────────

export default function ReviewsPage() {
	const queryClient = useQueryClient();

	const { data: flaggedRes, isLoading } = useQuery({
		queryKey: ["admin", "reviews", "flagged"],
		queryFn: () => api.get<ReviewDto[]>("/admin/reviews/flagged"),
	});

	const moderateMutation = useMutation({
		mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
			api.post<ReviewDto>(`/admin/reviews/${id}/moderate?approve=${approve}`),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ["admin", "reviews", "flagged"],
			}),
	});

	const flaggedReviews = flaggedRes?.data ?? [];

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-slate-900">
					Reviews & Notifications
				</h1>
				<p className="text-sm text-slate-500">
					Moderate reviews and manage notification broadcasting
				</p>
			</div>

			{/* Flagged Reviews */}
			<div className="rounded-xl border border-slate-200 bg-white p-6">
				<div className="mb-4 flex items-center gap-2">
					<Flag className="h-5 w-5 text-red-500" />
					<h2 className="text-lg font-semibold text-slate-900">
						Flagged Reviews
					</h2>
					{flaggedReviews.length > 0 && (
						<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
							{flaggedReviews.length}
						</span>
					)}
				</div>

				{isLoading ? (
					<div className="flex justify-center py-8">
						<div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
					</div>
				) : flaggedReviews.length === 0 ? (
					<p className="py-6 text-center text-slate-400">No flagged reviews</p>
				) : (
					<div className="space-y-3">
						{flaggedReviews.map((review) => (
							<div
								key={review.id}
								className="flex items-start justify-between rounded-lg border border-slate-100 p-4">
								<div className="space-y-1">
									<div className="flex items-center gap-3">
										<StarRating rating={review.rating} />
										<span className="text-xs text-slate-400">
											{new Date(review.createdAt).toLocaleDateString()}
										</span>
									</div>
									<p className="text-sm text-slate-500">
										<span className="font-medium text-slate-700">
											{review.reviewerName}
										</span>{" "}
										→{" "}
										<span className="font-medium text-slate-700">
											{review.revieweeName}
										</span>
									</p>
									{review.comment && (
										<p className="flex items-start gap-1 text-sm text-slate-600">
											<MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
											{review.comment}
										</p>
									)}
									{review.flagReason && (
										<p className="text-xs text-red-600">
											Flag reason: {review.flagReason}
										</p>
									)}
								</div>
								<div className="flex gap-1">
									<button
										onClick={() =>
											moderateMutation.mutate({
												id: review.id,
												approve: true,
											})
										}
										title="Approve"
										className="rounded p-1.5 text-green-600 hover:bg-green-50">
										<CheckCircle className="h-5 w-5" />
									</button>
									<button
										onClick={() =>
											moderateMutation.mutate({
												id: review.id,
												approve: false,
											})
										}
										title="Remove"
										className="rounded p-1.5 text-red-600 hover:bg-red-50">
										<XCircle className="h-5 w-5" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Notification Templates */}
			<NotificationTemplatesSection />

			{/* Broadcast */}
			<BroadcastSection />
		</div>
	);
}
