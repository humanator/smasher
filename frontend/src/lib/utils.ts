// ABOUTME: Utility functions for the frontend
// ABOUTME: cn() class merging plus shadcn-svelte prop helper types

import { cnMerge, createTV } from "tailwind-variants";
import type { ClassValue } from "svelte/elements";

// The app's own scales from app.css @theme. Without them the class mergers read text-body as a
// text colour (and drop it beside text-muted-foreground) and shadow-push as a shadow colour.
const mergeConfig = {
	extend: {
		theme: {
			text: ["caption", "hint", "small", "body", "heading", "display"],
			shadow: [
				"push", "push-accent", "segment", "field", "thumb", "check", "tooltip",
				"popover", "card", "sheet", "dialog", "window", "hairline",
			],
			radius: ["track"],
		},
	},
};

// tailwind-variants bundles its own merger (tv needs it anyway), so cn() reuses it with the same
// config rather than shipping a second merge engine. Variant files import tv from here too.
/** Anything Svelte accepts in class={…}, plus the falsy values conditional classes produce. */
export type CnInput = ClassValue | number | null | undefined | boolean;

export function cn(...inputs: CnInput[]): string {
	return cnMerge(join(inputs))({ twMergeConfig: mergeConfig }) ?? "";
}

// clsx semantics for Svelte's class values: strings and numbers kept, arrays flattened, object keys
// kept when truthy, everything falsy dropped.
function join(value: CnInput | CnInput[]): string {
	if (!value || value === true) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return String(value);
	if (Array.isArray(value)) return (value as CnInput[]).map((item) => join(item)).filter(Boolean).join(" ");
	if (typeof value === "object") {
		return Object.entries(value)
			.filter(([, on]) => on)
			.map(([name]) => name)
			.join(" ");
	}
	return "";
}

export const tv = createTV({ twMergeConfig: mergeConfig });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

// Turns a workflow file name like "consensus_task.dot" into "Consensus Task".
export function formatWorkflowName(name: string): string {
	return name
		.replace(/\.dot$/, "")
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}
