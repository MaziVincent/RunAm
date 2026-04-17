import { Metadata } from "next";
import { Briefcase, Heart, Zap, Globe } from "lucide-react";

export const metadata: Metadata = { title: "Careers | RunAm" };

export default function CareersPage() {
	return (
		<div className="container mx-auto max-w-3xl px-4 py-16">
			<h1 className="text-3xl font-bold tracking-tight">Careers at RunAm</h1>
			<p className="mt-4 text-lg text-muted-foreground">
				Join us in building the future of logistics and on-demand delivery
				across Africa.
			</p>

			<div className="mt-12 grid gap-6 sm:grid-cols-2">
				{[
					{
						icon: Zap,
						title: "Fast-Paced",
						desc: "Work on products that impact thousands of daily deliveries.",
					},
					{
						icon: Heart,
						title: "People-First",
						desc: "We care about our team's well-being and growth.",
					},
					{
						icon: Globe,
						title: "Local Impact",
						desc: "Build technology that transforms communities.",
					},
					{
						icon: Briefcase,
						title: "Growth",
						desc: "Accelerate your career in a high-growth startup.",
					},
				].map((perk) => (
					<div key={perk.title} className="rounded-xl border p-5">
						<perk.icon className="h-6 w-6 text-primary" />
						<h3 className="mt-3 font-semibold">{perk.title}</h3>
						<p className="mt-1 text-sm text-muted-foreground">{perk.desc}</p>
					</div>
				))}
			</div>

			<div className="mt-12 rounded-xl border bg-muted/30 p-8 text-center">
				<h2 className="text-xl font-semibold">No open positions right now</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					We&apos;re always looking for talented people. Send your CV to{" "}
					<a
						href="mailto:careers@wegorunam.com"
						className="text-primary hover:underline">
						careers@wegorunam.com
					</a>{" "}
					and we&apos;ll reach out when a role fits.
				</p>
			</div>
		</div>
	);
}
