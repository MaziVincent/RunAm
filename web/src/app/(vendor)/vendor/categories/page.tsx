"use client";

import { useState } from "react";
import {
	FolderOpen,
	Plus,
	Pencil,
	Trash2,
	Package,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	useMyProductCategories,
	useCreateProductCategory,
	useUpdateProductCategory,
	useDeleteProductCategory,
} from "@/lib/hooks";
import { toast } from "sonner";

export default function VendorCategoriesPage() {
	const { data, isLoading } = useMyProductCategories();
	const createCategory = useCreateProductCategory();
	const updateCategory = useUpdateProductCategory();
	const deleteCategory = useDeleteProductCategory();

	const categories = data?.data ?? [];

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

	function openCreate() {
		setEditingId(null);
		setName("");
		setDescription("");
		setDialogOpen(true);
	}

	function openEdit(cat: any) {
		setEditingId(cat.id);
		setName(cat.name ?? "");
		setDescription(cat.description ?? "");
		setDialogOpen(true);
	}

	async function handleSave() {
		if (!name.trim()) {
			toast.error("Category name required");
			return;
		}
		try {
			if (editingId) {
				await updateCategory.mutateAsync({
					id: editingId,
					name,
					description,
				});
				toast.success("Category updated");
			} else {
				await createCategory.mutateAsync({ name, description });
				toast.success("Category created");
			}
			setDialogOpen(false);
		} catch {
			toast.error("Failed to save category");
		}
	}

	async function handleDelete() {
		if (!deleteTarget) return;
		try {
			await deleteCategory.mutateAsync(deleteTarget);
			toast.success("Category deleted");
			setDeleteTarget(null);
		} catch {
			toast.error("Failed to delete category");
		}
	}

	const isSaving = createCategory.isPending || updateCategory.isPending;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Categories</h1>
					<p className="text-sm text-muted-foreground">
						Organize your products into categories
					</p>
				</div>
				<Button className="gap-2" onClick={openCreate}>
					<Plus className="h-4 w-4" />
					<span className="hidden sm:inline">Add Category</span>
					<span className="sm:hidden">Add</span>
				</Button>
			</div>

			{/* Categories List */}
			{isLoading ? (
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-16 rounded-xl" />
					))}
				</div>
			) : categories.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center py-12 text-center">
						<FolderOpen className="h-10 w-10 text-muted-foreground/30" />
						<p className="mt-3 font-medium">No categories yet</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Create categories to organize your products
						</p>
						<Button className="mt-4 gap-2" onClick={openCreate}>
							<Plus className="h-4 w-4" />
							Create First Category
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-2">
					{categories.map((cat) => (
						<Card key={cat.id}>
							<CardContent className="flex items-center gap-3 p-4">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
									<FolderOpen className="h-5 w-5 text-muted-foreground" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-medium">{cat.name}</p>
									{cat.description && (
										<p className="truncate text-xs text-muted-foreground">
											{cat.description}
										</p>
									)}
								</div>
								<div className="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => openEdit(cat)}>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive"
										onClick={() => setDeleteTarget(cat.id)}>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Create/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{editingId ? "Edit" : "Create"} Category</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Name *</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Chicken, Drinks, Desserts"
							/>
						</div>
						<div className="space-y-2">
							<Label>Description</Label>
							<Input
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional description"
							/>
						</div>
						<Button className="w-full" onClick={handleSave} disabled={isSaving}>
							{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{editingId ? "Update" : "Create"} Category
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={() => setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Category</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure? Products in this category will become uncategorized.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
