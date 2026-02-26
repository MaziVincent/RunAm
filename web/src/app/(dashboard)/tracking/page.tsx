"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Navigation, Clock, Radio, Users } from "lucide-react";
import { api } from "@/lib/api/client";
import { getAdminConnection } from "@/lib/signalr";
import { cn, errandStatusLabel, errandStatusColor } from "@/lib/utils";
import type { ErrandDto, TrackingUpdateDto } from "@/types";
import { ErrandStatus } from "@/types";

export default function TrackingPage() {
	const [riderLocations, setRiderLocations] = useState<
		Map<string, TrackingUpdateDto>
	>(new Map());
	const [selectedErrand, setSelectedErrand] = useState<string | null>(null);
	const connectionRef = useRef<ReturnType<typeof getAdminConnection> | null>(
		null,
	);

	// Get active errands (in-progress)
	const { data: errandsRes } = useQuery({
		queryKey: ["active-errands"],
		queryFn: () => api.get<ErrandDto[]>("/admin/errands"),
		refetchInterval: 30000,
	});

	const errands = errandsRes?.data ?? [];
	const activeErrands = errands.filter(
		(e) =>
			e.status >= ErrandStatus.Accepted &&
			e.status <= ErrandStatus.ArrivedAtDropoff,
	);

	// Connect to admin hub for real-time location updates
	useEffect(() => {
		let mounted = true;

		const connect = async () => {
			try {
				const connection = await getAdminConnection();
				if (!mounted) return;

				connection.on(
					"RiderLocationsUpdated",
					(locations: TrackingUpdateDto[]) => {
						if (!mounted) return;
						setRiderLocations((prev) => {
							const next = new Map(prev);
							for (const loc of locations) {
								next.set(loc.riderId, loc);
							}
							return next;
						});
					},
				);

				connection.on("ErrandUpdated", () => {
					// Trigger refetch of errands
				});
			} catch {
				console.warn("Could not connect to admin hub");
			}
		};

		connect();

		return () => {
			mounted = false;
		};
	}, []);

	const formatEta = (seconds: number | null) => {
		if (!seconds) return "—";
		if (seconds < 60) return `${seconds}s`;
		return `${Math.ceil(seconds / 60)} min`;
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						Live Tracking
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Real-time rider and errand monitoring
					</p>
				</div>
				<div className="flex items-center gap-2 text-sm text-slate-500">
					<Radio className="h-4 w-4 animate-pulse text-green-500" />
					{activeErrands.length} active errands
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Map area */}
				<div className="lg:col-span-2">
					<div className="relative h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
						{/* Map placeholder */}
						<div className="flex h-full flex-col items-center justify-center text-slate-500">
							<Navigation className="mb-3 h-12 w-12" />
							<p className="text-lg font-medium">Live Map</p>
							<p className="mt-1 text-sm">
								Integrate with Google Maps or Mapbox to show rider positions
							</p>
							<p className="mt-4 text-xs text-slate-400">
								{riderLocations.size} rider(s) reporting location
							</p>

							{/* Show rider coordinate list */}
							{riderLocations.size > 0 && (
								<div className="mt-4 max-h-48 w-full max-w-md overflow-y-auto rounded-lg bg-white/80 p-3 dark:bg-slate-900/80">
									{Array.from(riderLocations.entries()).map(
										([riderId, loc]) => (
											<div
												key={riderId}
												className="flex items-center justify-between border-b border-slate-100 py-2 text-xs last:border-0 dark:border-slate-700">
												<span className="font-mono">
													{riderId.substring(0, 8)}
												</span>
												<span>
													{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
												</span>
												<span className="text-blue-600">
													{formatEta(loc.etaSeconds)}
												</span>
											</div>
										),
									)}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Sidebar: active errands list */}
				<div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
					<div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
						<h3 className="font-semibold text-slate-900 dark:text-white">
							Active Errands
						</h3>
					</div>
					<div className="max-h-[560px] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
						{activeErrands.length === 0 ? (
							<div className="px-4 py-8 text-center text-sm text-slate-500">
								No active errands
							</div>
						) : (
							activeErrands.map((errand) => {
								const riderLoc = errand.riderId
									? riderLocations.get(errand.riderId)
									: null;
								return (
									<div
										key={errand.id}
										onClick={() =>
											setSelectedErrand(
												selectedErrand === errand.id ? null : errand.id,
											)
										}
										className={cn(
											"cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
											selectedErrand === errand.id &&
												"bg-blue-50 dark:bg-blue-900/20",
										)}>
										<div className="flex items-center justify-between">
											<span className="text-xs font-mono text-slate-500">
												#{errand.id.substring(0, 8)}
											</span>
											<span
												className={cn(
													"inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
													errandStatusColor[errand.status],
												)}>
												{errandStatusLabel[errand.status]}
											</span>
										</div>
										<div className="mt-1.5 space-y-1">
											<div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
												<MapPin className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
												<span className="truncate">{errand.pickupAddress}</span>
											</div>
											<div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
												<MapPin className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
												<span className="truncate">
													{errand.dropoffAddress}
												</span>
											</div>
										</div>
										{riderLoc && (
											<div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
												<Clock className="h-3 w-3" />
												ETA: {formatEta(riderLoc.etaSeconds)}
											</div>
										)}
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
