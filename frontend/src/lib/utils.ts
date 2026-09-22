// ABOUTME: Utility functions for the frontend
// ABOUTME: General-purpose helpers

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
