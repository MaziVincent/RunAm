import { cn } from "@/lib/utils";
import { Package, SearchX, Inbox, FileX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	className?: string;
}

const defaultIcons: Record<string, LucideIcon> = {
	search: SearchX,
	inbox: Inbox,
	file: FileX,
	default: Package,
};

export function EmptyState({
	icon: Icon = Package,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-16 text-center",
				className,
			)}>
			<div className="mb-4 rounded-full bg-muted p-4">
				<Icon className="h-8 w-8 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-semibold">{title}</h3>
			{description && (
				<p className="mt-1 max-w-sm text-sm text-muted-foreground">
					{description}
				</p>
			)}
			{action && (
				<Button onClick={action.onClick} className="mt-4" size="sm">
					{action.label}
				</Button>
			)}
		</div>
	);
}
