import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
	errandStatusLabel,
	errandStatusColor,
	vendorStatusLabel,
	vendorStatusColor,
	vendorOrderStatusLabel,
	vendorOrderStatusColor,
	approvalStatusLabel,
} from "@/lib/utils";

type StatusKind = "errand" | "vendor" | "vendorOrder" | "approval";

interface StatusBadgeProps {
	status: number;
	kind: StatusKind;
	className?: string;
}

const labelMap: Record<StatusKind, Record<number, string>> = {
	errand: errandStatusLabel,
	vendor: vendorStatusLabel,
	vendorOrder: vendorOrderStatusLabel,
	approval: approvalStatusLabel,
};

const colorMap: Record<StatusKind, Record<number, string>> = {
	errand: errandStatusColor,
	vendor: vendorStatusColor,
	vendorOrder: vendorOrderStatusColor,
	approval: {
		0: "bg-yellow-100 text-yellow-800",
		1: "bg-green-100 text-green-800",
		2: "bg-red-100 text-red-800",
	},
};

export function StatusBadge({ status, kind, className }: StatusBadgeProps) {
	const label = labelMap[kind]?.[status] ?? `Unknown (${status})`;
	const color = colorMap[kind]?.[status] ?? "bg-muted text-muted-foreground";

	return (
		<Badge
			variant="outline"
			className={cn("border-transparent font-medium", color, className)}>
			{label}
		</Badge>
	);
}
