"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook that triggers when an element scrolls into view.
 * Returns { ref, isInView }.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(options?: {
	threshold?: number;
	triggerOnce?: boolean;
}) {
	const threshold = options?.threshold ?? 0.1;
	const triggerOnce = options?.triggerOnce ?? true;
	const ref = useRef<T>(null);
	const [isInView, setIsInView] = useState(false);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsInView(true);
					if (triggerOnce) {
						observer.unobserve(element);
					}
				} else if (!triggerOnce) {
					setIsInView(false);
				}
			},
			{ threshold },
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, [threshold, triggerOnce]);

	return { ref, isInView };
}

/**
 * Hook that returns the scroll Y position.
 */
export function useScrollPosition() {
	const [scrollY, setScrollY] = useState(0);

	useEffect(() => {
		const handleScroll = () => setScrollY(window.scrollY);
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return scrollY;
}

/**
 * Animated counter hook.
 * When triggered, animates from 0 to `end` over `duration` ms.
 */
export function useCountUp(
	end: number,
	duration: number = 2000,
	trigger: boolean = true,
) {
	const [count, setCount] = useState(0);
	const frameRef = useRef<number>();

	useEffect(() => {
		if (!trigger) return;

		const startTime = performance.now();

		function animate(currentTime: number) {
			const progress = Math.min((currentTime - startTime) / duration, 1);
			// Ease-out cubic
			const eased = 1 - Math.pow(1 - progress, 3);
			setCount(Math.round(eased * end));

			if (progress < 1) {
				frameRef.current = requestAnimationFrame(animate);
			}
		}

		frameRef.current = requestAnimationFrame(animate);

		return () => {
			if (frameRef.current) {
				cancelAnimationFrame(frameRef.current);
			}
		};
	}, [end, duration, trigger]);

	return count;
}

/**
 * Debounce a value.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedValue(value), delay);
		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

/**
 * Media query hook.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const media = window.matchMedia(query);
		setMatches(media.matches);

		const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
		media.addEventListener("change", handler);
		return () => media.removeEventListener("change", handler);
	}, [query]);

	return matches;
}
