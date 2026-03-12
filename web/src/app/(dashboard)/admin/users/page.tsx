"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Search,
	ChevronLeft,
	ChevronRight,
	MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { cn, userRoleLabel, userStatusLabel } from "@/lib/utils";
import type { UserDto } from "@/types";
import { format } from "date-fns";

const statusColors: Record<number, string> = {
	0: "bg-green-100 text-green-800",
	1: "bg-red-100 text-red-800",
	2: "bg-slate-100 text-slate-800",
	3: "bg-yellow-100 text-yellow-800",
};

export default function UsersPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("");
	const pageSize = 20;

	const { data: res, isLoading } = useQuery({
		queryKey: ["users", page, search, roleFilter],
		queryFn: () =>
			api.get<UserDto[]>("/admin/users", {
				page,
				pageSize,
				...(search && { search }),
				...(roleFilter && { role: roleFilter }),
			}),
	});

	const users = res?.data ?? [];
	const meta = res?.meta;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
					Users
				</h1>
				<p className="mt-1 text-sm text-slate-500">Manage platform users</p>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="Search by name or email…"
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
					/>
				</div>
				<select
					value={roleFilter}
					onChange={(e) => {
						setRoleFilter(e.target.value);
						setPage(1);
					}}
					className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
					<option value="">All Roles</option>
					<option value="0">Customer</option>
					<option value="1">Rider</option>
					<option value="2">Merchant</option>
					<option value="3">Admin</option>
					<option value="4">Support Agent</option>
				</select>
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Name
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Email
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Role
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Status
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Joined
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{isLoading ? (
								Array.from({ length: 8 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: 6 }).map((_, j) => (
											<td key={j} className="px-6 py-3">
												<div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
											</td>
										))}
									</tr>
								))
							) : users.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-12 text-center text-slate-500">
										No users found
									</td>
								</tr>
							) : (
								users.map((user) => (
									<tr
										key={user.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
										<td className="whitespace-nowrap px-6 py-3">
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
													{user.firstName[0]}
													{user.lastName[0]}
												</div>
												<span className="font-medium text-slate-900 dark:text-white">
													{user.firstName} {user.lastName}
												</span>
											</div>
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{user.email}
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{userRoleLabel[user.role] ?? "Unknown"}
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<span
												className={cn(
													"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
													statusColors[user.status] ??
														"bg-slate-100 text-slate-800",
												)}>
												{userStatusLabel[user.status] ?? "Unknown"}
											</span>
										</td>
										<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
											{format(new Date(user.createdAt), "MMM d, yyyy")}
										</td>
										<td className="whitespace-nowrap px-6 py-3">
											<button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
												<MoreHorizontal className="h-4 w-4" />
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
						<p className="text-sm text-slate-500">
							Page {meta.page} of {meta.totalPages} &middot; {meta.totalCount}{" "}
							users
						</p>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="rounded-lg border border-slate-300 p-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
								<ChevronLeft className="h-4 w-4" />
							</button>
							<button
								onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
								disabled={page === meta.totalPages}
								className="rounded-lg border border-slate-300 p-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
