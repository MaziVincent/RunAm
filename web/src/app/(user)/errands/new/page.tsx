import ErrandRequestWizard from "@/components/user/errand-request-wizard";

type SearchParams = Record<string, string | string[] | undefined>;

function getSingleParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

export default function NewErrandEntryPage({
	searchParams,
}: {
	searchParams?: SearchParams;
}) {
	const initialCategory = getSingleParam(searchParams?.category);

	return <ErrandRequestWizard initialCategory={initialCategory} />;
}