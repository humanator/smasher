# smasher-spa

A Svelte 5 SPA for the smasher AI workflow orchestrator.

## Development

```bash
npm install
npm run dev          # Start dev server (proxies /api to http://127.0.0.1:21541)
npm run dev:backend  # Start the smasher-web-api server
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run lint         # Lint code
npm run check        # Type check with svelte-check
```

## Project Structure

```
src/
  lib/
    api/           # Typed fetch client for smasher-web-api
    native/        # Tauri shim with browser fallbacks
    components/
      ui/          # shadcn-svelte components
      node-editor/ # Graph editor components
      dashboard/   # Dashboard page components
    stores/        # Svelte 5 rune-based stores
  App.svelte
  main.ts
  app.css
tests/             # Vitest unit/component tests
e2e/               # Playwright E2E specs
```

## Tech Stack

- **Svelte 5** (runes)
- **TypeScript** (strict mode)
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **shadcn-svelte** (UI primitives)
- **Vitest** (unit testing)
- **Playwright** (E2E testing)

## API Client

All backend calls go through `src/lib/api/`. Base URL is runtime-configurable via `setApiBaseUrl()`, never hardcoded per-call.

## Notes

- All components use Svelte 5 runes (`$state`, `$derived`, `$effect`) throughout, no legacy `$:` reactivity
- TypeScript is strict mode, no implicit `any`
- Use Tailwind utility classes; minimal CSS in component `<style>` blocks
- Tests run against a real running `smasher-web-api` instance, not mocked fetch
