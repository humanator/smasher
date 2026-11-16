// ABOUTME: A clock that ticks on an interval, for text that ages: durations "so far" and "waiting 6 minutes"
// ABOUTME: Call during component initialisation; the interval stops when the component goes away

/** The current time, refreshed every `intervalMs`. Read `.current` to track it. */
export function useNow(intervalMs = 30_000): { readonly current: Date } {
  let now = $state(new Date());
  $effect(() => {
    const timer = setInterval(() => {
      now = new Date();
    }, intervalMs);
    return () => clearInterval(timer);
  });
  return {
    get current() {
      return now;
    },
  };
}
