# Spec: smasher-spa

Module id: `smasher-spa` · Capability map: [CAPABILITY_MAP.md](CAPABILITY_MAP.md)
Depends on: `smasher-web-api` (API contract)

## Objective

Build the single UI for smasher: dashboard, DOT graph node editor (ported
from the existing standalone Svelte node editor), live event stream, and
human-gate response forms. Must run unmodified in a plain browser (hitting
`smasher-web-api`) and inside `smasher-desktop`'s Tauri webview — no
build-time fork between the two targets.

Users: Simon, first as the desktop app; the same build should work if served
remotely later without code changes to the SPA itself.

## Tech Stack

- Svelte 5 (runes), TypeScript, Vite
- Tailwind CSS
- shadcn-svelte (Bits UI primitives) — components copied in and owned, not a black-box dependency
- Node-editor implementation carried over from the current standalone project

## Commands

```bash
npm install
npm run dev          # vite dev server, proxies /api and /events to local smasher-web-api
npm run build         # outputs dist/
npm run test          # vitest
npm run test:e2e      # playwright, against a real running smasher-web-api
npm run lint
```

## Project Structure

```
frontend/
  src/
    lib/
      api/             # fetch + SSE client — the ONLY code that talks to smasher-web-api
      native/           # window.__TAURI__ shim: file dialogs, notifications, with browser fallbacks
      components/
        ui/             # shadcn-svelte components
        node-editor/    # ported graph editor
        dashboard/
      stores/            # pipeline state, event log, graph state
    App.svelte
  tests/                 # vitest unit/component tests
  e2e/                   # playwright specs
  vite.config.ts
  tailwind.config.ts
  package.json
```

## Code Style

```svelte
<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "$lib/components/ui/button/button.svelte";

  let { pipelineId }: { pipelineId: string } = $props();
  let status = $state<"idle" | "running" | "done">("idle");
  let isRunning = $derived(status === "running");
</script>

<Button class={cn("w-full", isRunning && "opacity-50")} disabled={isRunning}>
  Run pipeline
</Button>
```

- Svelte 5 runes (`$state`/`$derived`/`$effect`) throughout, no legacy `$:` reactivity.
- TypeScript strict mode.
- Tailwind utility classes; `app.css` holds only design tokens/theme variables.
- Component files `PascalCase.svelte`; everything else `kebab-case.ts`.

## Testing Strategy

- **Unit/component:** Vitest + `@testing-library/svelte` for components and stores.
- **E2E:** Playwright driving a real browser against a real running
  `smasher-web-api` instance — no mocked API, per "use real data and real
  APIs rather than mocking." Critical path: submit pipeline → see events
  stream in → answer a human gate → see completion.
- All new components and stores get unit coverage; the critical path above is covered end-to-end before this module is considered done.

## Boundaries

- **Always:** route every backend call through `lib/api/` — no component
  calls `fetch`/`EventSource` directly; implement OS-native features via the
  `lib/native/` shim so the same components run in-browser; match DOT
  node-shape semantics exactly as defined in `smasher-attractor`'s DOT
  reference (box/diamond/oval/house/parallelogram/hexagon/component).
- **Ask first:** adding npm dependencies outside the Svelte/Tailwind/shadcn-svelte/Vitest/Playwright ecosystem; changing the node-editor's underlying graph library if the current one doesn't port cleanly.
- **Never:** hardcode the API base URL (must be runtime-configurable — desktop and browser targets differ); introduce a second component library alongside shadcn-svelte; validate/parse DOT client-side as the source of truth (the API/`smasher-attractor` parser is authoritative).

## Success Criteria

- [ ] Feature parity with the current HTMX dashboard: submit pipeline, live events, human-gate Q&A.
- [ ] Visual DOT graph editor that creates/edits pipelines matching `smasher-attractor`'s node-shape spec, round-tripping through the API (not a reimplemented client-side parser).
- [ ] Runs correctly when served by `smasher-web-api` in a plain desktop browser, with zero Tauri-only code paths breaking.
- [ ] Vitest and Playwright suites pass; Playwright runs against a real local `smasher-web-api` instance.

## Open Questions

- How much of the existing node editor ports as-is vs. needs new features for pipeline-specific node types (interviewer/manager/parallel/etc.)?
- Confirm: all graph edits round-trip through the API for validation rather than being trusted client-side — recommended, since `smasher-attractor` owns the DOT grammar.
