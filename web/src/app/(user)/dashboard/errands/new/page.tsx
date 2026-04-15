import { redirect } from "next/navigation";

export default function LegacyErrandEntryPage({
	searchParams,
}: {
	searchParams: Record<string, string | string[] | undefined>;
}) {
	const params = new URLSearchParams();

	for (const [key, value] of Object.entries(searchParams)) {
		if (Array.isArray(value)) {
			for (const entry of value) {
				params.append(key, entry);
			}
		} else if (value) {
			params.set(key, value);
		}
	}

	const query = params.toString();
	redirect(query ? `/errands/new?${query}` : "/errands/new");
}