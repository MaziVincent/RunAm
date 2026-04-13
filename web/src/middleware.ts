import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role enum values must match backend UserRole
const ROLE = {
	Customer: 0,
	Rider: 1,
	Merchant: 2,
	Admin: 3,
	SupportAgent: 4,
} as const;

// Route group → allowed roles
const PROTECTED_ROUTES: {
	prefix: string;
	roles: number[];
	loginRole?: string;
}[] = [
	{ prefix: "/admin", roles: [ROLE.Admin, ROLE.SupportAgent] },
	{ prefix: "/vendor", roles: [ROLE.Merchant], loginRole: "vendor" },
	{ prefix: "/rider", roles: [ROLE.Rider], loginRole: "rider" },
	{
		prefix: "/dashboard",
		roles: [
			ROLE.Customer,
			ROLE.Rider,
			ROLE.Merchant,
			ROLE.Admin,
			ROLE.SupportAgent,
		],
	},
];

// Role → default dashboard
const ROLE_DASHBOARDS: Record<number, string> = {
	[ROLE.Customer]: "/dashboard",
	[ROLE.Rider]: "/rider",
	[ROLE.Merchant]: "/vendor",
	[ROLE.Admin]: "/admin",
	[ROLE.SupportAgent]: "/admin",
};

function parseUserFromCookie(request: NextRequest): { role: number } | null {
	// The user data is stored in localStorage on the client and not accessible
	// in middleware. We read from a lightweight cookie set during login.
	const userCookie = request.cookies.get("user_role");
	if (!userCookie?.value) return null;

	const role = parseInt(userCookie.value, 10);
	if (isNaN(role)) return null;
	return { role };
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Check if the token cookie exists (set by auth-store on login)
	const hasToken = request.cookies.has("has_session");
	const user = parseUserFromCookie(request);

	for (const route of PROTECTED_ROUTES) {
		if (!pathname.startsWith(route.prefix)) continue;

		// Not authenticated → redirect to login
		if (!hasToken) {
			const loginUrl = new URL("/login", request.url);
			if (route.loginRole) {
				loginUrl.searchParams.set("role", route.loginRole);
			}
			loginUrl.searchParams.set("redirect", pathname);
			return NextResponse.redirect(loginUrl);
		}

		// Authenticated but wrong role → redirect to their correct dashboard
		if (user && !route.roles.includes(user.role)) {
			const correctDashboard = ROLE_DASHBOARDS[user.role] ?? "/";
			return NextResponse.redirect(new URL(correctDashboard, request.url));
		}

		break;
	}

	// Add security headers to all responses
	const response = NextResponse.next();
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set(
		"Permissions-Policy",
		"camera=(self), microphone=(), geolocation=(self)",
	);

	return response;
}

export const config = {
	matcher: [
		"/admin/:path*",
		"/vendor/:path*",
		"/rider/:path*",
		"/dashboard/:path*",
	],
};
