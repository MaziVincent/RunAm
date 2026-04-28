"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	ChevronUp,
	ChevronDown,
	GripVertical,
	Upload,
	X as XIcon,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type {
	ServiceCategoryDto,
	CreateServiceCategoryRequest,
	UpdateServiceCategoryRequest,
} from "@/types";

export default function ServiceCategoriesPage() {
	const queryClient = useQueryClient();
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	// Form state
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [iconUrl, setIconUrl] = useState("");
	const [iconUploading, setIconUploading] = useState(false);
	const iconFileInputRef = useRef<HTMLInputElement | null>(null);
	const [sortOrder, setSortOrder] = useState(0);
	const [isActive, setIsActive] = useState(true);
	const [requiresVendor, setRequiresVendor] = useState(false);

	const { data: res, isLoading } = useQuery({
		queryKey: ["service-categories"],
		queryFn: () => api.get<ServiceCategoryDto[]>("/service-categories"),
	});

	const categories = res?.data ?? [];

	const createMutation = useMutation({
		mutationFn: (body: CreateServiceCategoryRequest) =>
			api.post("/service-categories", body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["service-categories"] });
			resetForm();
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: string;
			body: UpdateServiceCategoryRequest;
		}) => api.put(`/service-categories/${id}`, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["service-categories"] });
			resetForm();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => api.delete(`/service-categories/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["service-categories"] });
		},
	});

	async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 2 * 1024 * 1024) {
			alert("Icon must be under 2MB");
			return;
		}
		if (!file.type.startsWith("image/")) {
			alert("Please select an image file");
			return;
		}
		setIconUploading(true);
		try {
			const r = await api.upload<{ url: string }>(
				"/files/service-category-icon",
				file,
			);
			if (r.success && r.data?.url) {
				setIconUrl(r.data.url);
			} else {
				alert(r.error?.message ?? "Upload failed");
			}
		} catch {
			alert("Failed to upload icon");
		} finally {
			setIconUploading(false);
			if (iconFileInputRef.current) iconFileInputRef.current.value = "";
		}
	}

	const resetForm = () => {
		setShowForm(false);
		setEditingId(null);
		setName("");
		setDescription("");
		setIconUrl("");
		setSortOrder(0);
		setIsActive(true);
		setRequiresVendor(false);
	};

	const startEdit = (cat: ServiceCategoryDto) => {
		setEditingId(cat.id);
		setName(cat.name);
		setDescription(cat.description ?? "");
		setIconUrl(cat.iconUrl ?? "");
		setSortOrder(cat.sortOrder);
		setIsActive(cat.isActive);
		setRequiresVendor(cat.requiresVendor);
		setShowForm(true);
	};

	const handleSubmit = () => {
		const body = {
			name,
			description: description || undefined,
			iconUrl: iconUrl || undefined,
			sortOrder,
			isActive,
			requiresVendor,
		};

		if (editingId) {
			updateMutation.mutate({ id: editingId, body });
		} else {
			createMutation.mutate(body);
		}
	};

	const handleDelete = (id: string) => {
		if (window.confirm("Are you sure you want to delete this category?")) {
			deleteMutation.mutate(id);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white">
						Service Categories
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Manage errand and marketplace categories
					</p>
				</div>
				<button
					onClick={() => {
						resetForm();
						setShowForm(true);
					}}
					className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
					<Plus className="h-4 w-4" />
					New Category
				</button>
			</div>

			{/* Create/Edit Form */}
			{showForm && (
				<div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
					<h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
						{editingId ? "Edit Category" : "New Category"}
					</h3>
					<div className="grid gap-4 sm:grid-cols-2">
						<div>
							<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Name
							</label>
							<input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Food Delivery"
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Icon
							</label>
							<div className="flex items-start gap-3">
								<div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
									{iconUrl ? (
										iconUrl.startsWith("http") ? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={iconUrl}
												alt="Icon preview"
												className="h-full w-full object-cover"
											/>
										) : (
											<span className="text-2xl">{iconUrl}</span>
										)
									) : (
										<span className="text-xs text-slate-400">No icon</span>
									)}
								</div>
								<div className="flex-1 space-y-2">
									<div className="flex flex-wrap items-center gap-2">
										<button
											type="button"
											onClick={() => iconFileInputRef.current?.click()}
											disabled={iconUploading}
											className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
											<Upload className="h-3.5 w-3.5" />
											{iconUploading ? "Uploading…" : "Upload icon"}
										</button>
										<input
											ref={iconFileInputRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handleIconUpload}
										/>
										{iconUrl && (
											<button
												type="button"
												onClick={() => setIconUrl("")}
												className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 dark:border-slate-700">
												<XIcon className="h-3 w-3" /> Clear
											</button>
										)}
									</div>
									<input
										type="text"
										value={iconUrl}
										onChange={(e) => setIconUrl(e.target.value)}
										placeholder="Or paste URL / emoji (e.g. 🍔)"
										className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
									/>
									<p className="text-xs text-slate-500">
										PNG/SVG up to 2MB. URL or emoji also accepted.
									</p>
								</div>
							</div>
						</div>
						<div className="sm:col-span-2">
							<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Description
							</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description..."
								rows={2}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
								Sort Order
							</label>
							<input
								type="number"
								value={sortOrder}
								onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
								className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							/>
						</div>
						<div className="flex items-center gap-6 pt-6">
							<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
								<input
									type="checkbox"
									checked={isActive}
									onChange={(e) => setIsActive(e.target.checked)}
									className="rounded"
								/>
								Active
							</label>
							<label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
								<input
									type="checkbox"
									checked={requiresVendor}
									onChange={(e) => setRequiresVendor(e.target.checked)}
									className="rounded"
								/>
								Requires Vendor
							</label>
						</div>
					</div>
					<div className="mt-4 flex gap-3">
						<button
							onClick={handleSubmit}
							disabled={
								!name || createMutation.isPending || updateMutation.isPending
							}
							className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
							{editingId ? "Update" : "Create"}
						</button>
						<button
							onClick={resetForm}
							className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Table */}
			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-slate-200 text-left dark:border-slate-800">
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Order
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Name
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Slug
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Vendor
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Status
								</th>
								<th className="whitespace-nowrap px-6 py-3 font-medium text-slate-500 dark:text-slate-400">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{isLoading ? (
								Array.from({ length: 6 }).map((_, i) => (
									<tr key={i}>
										{Array.from({ length: 6 }).map((_, j) => (
											<td key={j} className="px-6 py-3">
												<div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
											</td>
										))}
									</tr>
								))
							) : categories.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-6 py-12 text-center text-slate-500">
										No categories found
									</td>
								</tr>
							) : (
								[...categories]
									.sort((a, b) => a.sortOrder - b.sortOrder)
									.map((cat) => (
										<tr
											key={cat.id}
											className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
											<td className="whitespace-nowrap px-6 py-3 text-slate-600 dark:text-slate-400">
												<div className="flex items-center gap-1">
													<GripVertical className="h-4 w-4 text-slate-300" />
													{cat.sortOrder}
												</div>
											</td>
											<td className="whitespace-nowrap px-6 py-3">
												<div className="flex items-center gap-2">
													{cat.iconUrl &&
														(cat.iconUrl.startsWith("http") ? (
															<img
																src={cat.iconUrl}
																alt=""
																className="h-6 w-6 rounded"
															/>
														) : (
															<span className="text-xl">{cat.iconUrl}</span>
														))}
													<span className="font-medium text-slate-900 dark:text-white">
														{cat.name}
													</span>
												</div>
											</td>
											<td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
												{cat.slug}
											</td>
											<td className="whitespace-nowrap px-6 py-3">
												{cat.requiresVendor ? (
													<span className="inline-flex rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
														Marketplace
													</span>
												) : (
													<span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
														Logistics
													</span>
												)}
											</td>
											<td className="whitespace-nowrap px-6 py-3">
												<span
													className={cn(
														"inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
														cat.isActive
															? "bg-green-100 text-green-800"
															: "bg-slate-100 text-slate-600",
													)}>
													{cat.isActive ? "Active" : "Inactive"}
												</span>
											</td>
											<td className="whitespace-nowrap px-6 py-3">
												<div className="flex items-center gap-1">
													<button
														onClick={() => startEdit(cat)}
														className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800">
														<Pencil className="h-4 w-4" />
													</button>
													<button
														onClick={() => handleDelete(cat.id)}
														disabled={deleteMutation.isPending}
														className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/30">
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											</td>
										</tr>
									))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
