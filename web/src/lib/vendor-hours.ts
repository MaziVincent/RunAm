const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type OperatingHoursMap = Partial<Record<(typeof DAYS)[number], string>>;

export interface ParsedOperatingHours {
	openingTime: string;
	closingTime: string;
}

function parseTimeRange(value: string): ParsedOperatingHours | null {
	const parts = value.split("-").map((part) => part.trim());
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		return null;
	}

	return {
		openingTime: parts[0],
		closingTime: parts[1],
	};
}

function formatTime(value: string): string {
	const [hourString, minuteString] = value.split(":");
	const hour = Number(hourString);
	const minute = Number(minuteString);

	if (Number.isNaN(hour) || Number.isNaN(minute)) {
		return value;
	}

	const suffix = hour >= 12 ? "PM" : "AM";
	const normalizedHour = hour % 12 || 12;
	return `${normalizedHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
}

export function parseOperatingHours(
	hours: string | null | undefined,
): ParsedOperatingHours | null {
	if (!hours) {
		return null;
	}

	const trimmedHours = hours.trim();
	if (!trimmedHours) {
		return null;
	}

	if (!trimmedHours.startsWith("{")) {
		return parseTimeRange(trimmedHours);
	}

	try {
		const parsed = JSON.parse(trimmedHours) as OperatingHoursMap;
		for (const day of DAYS) {
			const dayHours = parsed[day];
			if (!dayHours) {
				continue;
			}

			const range = parseTimeRange(dayHours);
			if (range) {
				return range;
			}
		}
	} catch {
		return parseTimeRange(trimmedHours);
	}

	return null;
}

export function buildUniformOperatingHours(
	openingTime: string,
	closingTime: string,
): string {
	const hours = `${openingTime}-${closingTime}`;
	return JSON.stringify(
		DAYS.reduce<Record<string, string>>((result, day) => {
			result[day] = hours;
			return result;
		}, {}),
	);
}

export function formatOperatingHoursLabel(
	hours: string | null | undefined,
): string {
	const parsed = parseOperatingHours(hours);
	if (!parsed) {
		return "Not set";
	}

	return `${formatTime(parsed.openingTime)} – ${formatTime(parsed.closingTime)}`;
}
