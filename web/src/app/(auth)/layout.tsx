export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(180deg,_#f8fcf8_0%,_#edf6ef_48%,_#f7f8f4_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_35%),linear-gradient(180deg,_#07110a_0%,_#0d1811_48%,_#111416_100%)]">
			<div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(90deg,rgba(245,158,11,0.15),transparent_45%,rgba(34,197,94,0.08))]" />
			<div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
				<div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
					<div className="hidden space-y-6 lg:block">
						<div className="max-w-xl space-y-4">
							<p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">
								Errands. Delivery. Marketplace.
							</p>
							<h2 className="text-5xl font-semibold leading-tight text-foreground">
								One account for orders, riders, and the full RunAm flow.
							</h2>
							<p className="text-base leading-7 text-muted-foreground">
								Access the same delivery network, wallet, and tracking
								experience that powers the storefront and dashboard.
							</p>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm shadow-primary/5 backdrop-blur dark:border-white/10 dark:bg-white/5">
								<p className="text-sm font-semibold text-foreground">
									Unified wallet
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									Fund once, pay for marketplace orders, and track transactions
									from the same account.
								</p>
							</div>
							<div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm shadow-primary/5 backdrop-blur dark:border-white/10 dark:bg-white/5">
								<p className="text-sm font-semibold text-foreground">
									Live fulfillment
								</p>
								<p className="mt-2 text-sm text-muted-foreground">
									Stay connected to dispatch, chat, and order tracking without
									leaving the platform.
								</p>
							</div>
						</div>
					</div>
					<div className="w-full rounded-[2rem] border border-white/70 bg-white/88 p-6 shadow-[0_30px_80px_rgba(27,55,34,0.12)] backdrop-blur xl:p-8 dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
