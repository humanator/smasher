// ABOUTME: Utility functions for the frontend
// ABOUTME: cn() class merging plus shadcn-svelte prop helper types

export { cn } from "cn";

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
