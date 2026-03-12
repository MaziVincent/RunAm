"use client";

import { useState } from "react";
import {
	Bell,
	Truck,
	DollarSign,
	Star,
	AlertTriangle,
	CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ReactNode> = {
	task: <Truck className="h-4 w-4" />,
	earning: <DollarSign className="h-4 w-4" />,
	review: <Star className="h-4 w-4" />,
	alert: <AlertTriangle className="h-4 w-4" />,
};

function getIcon(type?: string) {
	return ICON_MAP[type ?? ""] ?? <Bell className="h-4 w-4" />;
}

function groupByDate(items: { createdAt: string }[]) {
	const groups: Record<string, typeof items> = {};
	for (const item of items) {
		const d = new Date(item.createdAt);
		const today = new Date();
		const yesterday = new Date();
		yesterday.setDate(today.getDate() - 1);

		let label: string;
		if (d.toDateString() === today.toDateString()) label = "Today";
		else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
		else
			label = d.toLocaleDateString("en-NG", {
				month: "short",
				day: "numeric",
				year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
			});

		if (!groups[label]) groups[label] = [];
		groups[label].push(item);
	}
	return groups;
}

export default function RiderNotificationsPage() {
	const { data, isLoading, refetch } = useNotifications();
	const notifications = data?.data ?? [];
	const [markingAll, setMarkingAll] = useState(false);

	const unreadCount = notifications.filter((n) => !n.isRead).length;
	const grouped = groupByDate(notifications);

	async function markAllRead() {
		setMarkingAll(true);
		try {
			await api.post("/notifications/mark-all-read");
			await refetch();
			toast.success("All notifications marked as read");
		} catch {
			toast.error("Failed to mark as read");
		} finally {
			setMarkingAll(false);
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Notifications</h1>
					<p className="text-sm text-muted-foreground">
						{unreadCount > 0
							? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
							: "You're all caught up"}
					</p>
				</div>
				{unreadCount > 0 && (
					<Button
						variant="outline"
						size="sm"
						onClick={markAllRead}
						disabled={markingAll}
						className="gap-2">
						<CheckCheck className="h-4 w-4" />
						Mark all read
					</Button>
				)}
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-16 rounded-xl" />
					))}
				</div>
			) : notifications.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<Bell className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-3 font-medium">No notifications</p>
						<p className="mt-1 text-sm text-muted-foreground">
							You&apos;ll see task alerts and earnings updates here
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{Object.entries(grouped).map(([date, items]) => (
						<div key={date}>
							<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{date}
							</p>
							<div className="space-y-2">
								{items.map((notification: any) => (
									<Card
										key={notification.id}
										className={cn(
											"transition-colors",
											!notification.isRead && "border-primary/20 bg-primary/5",
										)}>
										<CardContent className="flex items-start gap-3 p-3 sm:p-4">
											<div
												className={cn(
													"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
													!notification.isRead
														? "bg-primary/10 text-primary"
														: "bg-muted text-muted-foreground",
												)}>
												{getIcon(notification.type)}
											</div>
											<div className="min-w-0 flex-1">
												<p
													className={cn(
														"text-sm",
														!notification.isRead && "font-medium",
													)}>
													{notification.title}
												</p>
												{notification.message && (
													<p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
														{notification.message}
													</p>
												)}
												<p className="mt-1 text-[10px] text-muted-foreground">
													{new Date(notification.createdAt).toLocaleTimeString(
														"en-NG",
														{ hour: "2-digit", minute: "2-digit" },
													)}
												</p>
											</div>
											{!notification.isRead && (
												<div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
											)}
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
