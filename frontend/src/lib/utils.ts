import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getKeyTypeFromCount(
	keyCount: number | null | undefined,
): string | null {
	if (keyCount === null || keyCount === undefined || keyCount < 1) {
		return null;
	}

	if (keyCount >= 10) return "chaoskey";
	if (keyCount >= 6) return "goldkey";
	if (keyCount >= 3) return "silverkey";
	return "bronzekey";
}
