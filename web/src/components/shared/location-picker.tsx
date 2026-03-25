"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { api } from "@/lib/api/client";

export interface AddressResult {
	address: string;
	city: string;
	state: string;
	latitude: number;
	longitude: number;
}

interface Suggestion {
	placeId: string;
	description: string;
}

interface GeocodeData {
	address: string;
	city: string;
	state: string;
	latitude: number;
	longitude: number;
}

interface AddressAutocompleteProps {
	onSelect: (result: AddressResult) => void;
}

export function AddressAutocomplete({ onSelect }: AddressAutocompleteProps) {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
	const [open, setOpen] = useState(false);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handle(e: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, []);

	function handleChange(text: string) {
		setQuery(text);

		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (text.length < 3) {
			setSuggestions([]);
			setOpen(false);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			const res = await api.get<Suggestion[]>("/location/autocomplete", {
				query: text,
			});
			if (res.success && res.data) {
				setSuggestions(res.data);
				setOpen(res.data.length > 0);
			}
		}, 300);
	}

	async function handleSelect(suggestion: Suggestion) {
		setQuery(suggestion.description);
		setSuggestions([]);
		setOpen(false);

		const res = await api.get<GeocodeData>(
			`/location/geocode/${encodeURIComponent(suggestion.placeId)}`,
		);
		if (res.success && res.data) {
			onSelect(res.data);
		}
	}

	return (
		<div ref={wrapperRef} className="relative">
			<Input
				value={query}
				onChange={(e) => handleChange(e.target.value)}
				onFocus={() => suggestions.length > 0 && setOpen(true)}
				placeholder="Start typing your business address..."
			/>
			{open && suggestions.length > 0 && (
				<ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
					{suggestions.map((s) => (
						<li key={s.placeId}>
							<button
								type="button"
								onClick={() => handleSelect(s)}
								className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent">
								<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
								<span>{s.description}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
