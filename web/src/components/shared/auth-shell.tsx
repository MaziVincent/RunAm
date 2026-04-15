import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthShellProps {
	title: string;
	subtitle: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
	return (
		<>
			<div className="mb-8 flex items-center justify-between gap-3">
				<Button variant="ghost" size="sm" asChild className="gap-2 text-foreground/80">
					<Link href="/">
						<ArrowLeft className="h-4 w-4" />
						Back
					</Link>
				</Button>
				<Button variant="outline" size="sm" asChild className="gap-2">
					<Link href="/">
						<Home className="h-4 w-4" />
						Home
					</Link>
				</Button>
			</div>

			<div className="mb-8 space-y-3 text-center">
				<div className="mx-auto inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
					RunAm account
				</div>
				<div>
					<h1 className="text-3xl font-semibold tracking-tight text-foreground">
						{title}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
				</div>
			</div>

			{children}

			{footer ? <div className="mt-6">{footer}</div> : null}
		</>
	);
}