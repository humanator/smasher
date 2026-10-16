<!-- ABOUTME: Redesign gap audit section: Audit 03: Workflow detail page vs `Workflow.dc.html`. -->
<!-- ABOUTME: Findings carry file:line refs, board values and High/Med/Low severity; see README.md for the summary. -->

# Audit 03: Workflow detail page vs `Workflow.dc.html`

Design: `docs/design/redesign/Workflow.dc.html` (DH below, line numbers into that file).
Implementation: `frontend/src/components/dashboard/WorkflowDetailPage.svelte` (WDP), `RunTable.svelte`,
`StatusBadge.svelte`, `RunMetaList.svelte`, `lib/runStatus.ts`, `App.svelte`, `components/shell/Toolbar.svelte`.
Specs: `SPEC.md` row `workflow-detail` (line 37), `SPEC-shell-theme.md` R1–R4.

## 0. Status of the module

- No `SPEC-workflow-detail.md` exists. Root files are only `SPEC.md`, `SPEC-shell-theme.md`, `SPEC-dashboard.md`.
- WDP's git history is 3 commits, all pre-redesign: `495d6c9` (add page), `88274f9` (featured run + history),
  `92f211a` (lazy Run sheet). The dashboard work only restyled the shared `RunTable` and explicitly kept WDP "unchanged"
  (`tasks/archive/todo-dashboard.md:236`, `tasks/archive/plan-dashboard.md:43,121`).
- **Conclusion: the workflow-detail module hasn't been rebuilt.** The page is the old layout running inside the new shell,
  as `SPEC-shell-theme.md` "Out of Scope" intends. Nearly every finding below is expected backlog, not a regression.

## 1. Toolbar (DH 58–67; `Toolbar.svelte`, `App.svelte:146-159`, WDP 65-87)

| # | Sev | Design | Implementation |
|---|---|---|---|
| T1 | Med | Back button `aria-label` "Back to Workflows" → Home (DH 59) | "Back to Smasher Pipelines" → `/`. `App.svelte:28` `catalogBack = { label: 'Smasher Pipelines' }`; WDP never calls `usePageBack`. The sidebar calls that destination "Workflows". |
| T2 | Med | Subtitle line: mono `design_concepts_review.dot` + " · workflows/design" (11px #6E6E73, DH 62) | WDP never calls `usePageSubtitle`, so there's no subtitle. The data is shown in the page body instead: `<p class="font-mono">{workflow.name}</p><p>Source: {workflow.source_dir}</p>` (WDP 100-103). The toolbar already supports a backtick mono fragment (`Toolbar.svelte:268,287`). Data: `WorkflowSummary.path` (full path) and `source_dir` exist. The design's "workflows/design" is a relative folder that would have to be derived from `name`/`path`. |
| T3 | High | Ghost icon button "Show in Finder" (folder icon, 28px, DH 64) | Missing. There's no API route (`crates/smasher-web/src/routes/api.rs:136-148`, `editor_api.rs:23-26`) and no Tauri opener or shell plugin (`crates/smasher-desktop/Cargo.toml:24-26` has only dialog, fs and notification). Needs a new capability, e.g. `tauri-plugin-opener` `revealItemInDir`, or an additive `POST /api/workflows/{id}/reveal` for desktop only. Browser mode would need to hide it. Should use `ToolbarIconButton` (tooltip = label). |
| T4 | Med | "Edit Workflow" `variant="outline"`, default size (24px; hint 104×24, DH 65) | "Edit", `variant="secondary" size="sm"` (22px) (WDP 77-83). Copy, variant and size all differ. |
| T5 | Med | "Run", `variant="default"` with play icon, 24px (hint 64×24, DH 66) | "Run Workflow", `size="sm"` (22px), no icon (WDP 84). The E2E test asserts "Run Workflow" (`e2e/workflow-detail.spec.ts:46`) and would need updating. |
| T6 | Low | Toolbar actions end at Run. No settings button. | `App.svelte:149-151` adds `LazySettingsDialog` to every non-catalogue toolbar, so a settings button sits after Run. This was a deliberate cross-page decision (`SPEC-dashboard.md:26`). It's absent from the board; flag for designer sign-off. |
| T7 | Low | Toolbar padding `0 12px`, title block `padding-left:4px` (DH 58,60) | `px-4` (16px), no extra title inset (`Toolbar.svelte:273,283`). This is a shell concern shared by all pages. |
| T8 | Low | Toolbar title = display name ("Design concepts review") | Matches via `usePageTitle(formatWorkflowName)` (WDP 65-68). While loading or on error, App shows "Workflow". Not found shows "Workflow not found". |

## 2. Active-run banner (DH 69–82; WDP 109–129)

| # | Sev | Design | Implementation |
|---|---|---|---|
| B1 | High | Full-bleed band directly under the toolbar, outside the scroll padding: `background:#FCEEF4` (`--primary-subtle`), `border-bottom:1px solid rgba(190,24,93,.18)`, `padding:10px 20px`, `gap:12px`, flex row (DH 70) | A bordered card in the content column: `rounded-lg border border-border bg-card p-4` (WDP 112). It's neutral, not tinted, and sits after the meta lines inside `max-w-6xl p-8`. |
| B2 | High | Shown for a run that **needs you** (Needs you badge, "Paused at …, waiting for you…", "Review Candidates" CTA) | Shown for any active run ("Active run") **and** for the latest terminal run ("Latest run") (`runStatus.ts:233-240`). The design has no "Latest run" card; a finished run lives only in the history. The board also doesn't design the plain-running (not needs-you) state. That's a design gap to resolve. |
| B3 | High | Badge "Needs you" (`variant=default`) | `<StatusBadge status={featured.run.status} />` (WDP 119) passes the raw status, so a needs-you run shows **"Running"** (blue dot). RunTable maps it correctly (`RunTable.svelte:55` uses `isNeedsYou`); WDP doesn't import `isNeedsYou`. |
| B4 | Med | 28px accent circle (`#BE185D`) with a 15px white person icon (DH 71-73) | No icon. |
| B5 | Med | Run id link: mono 12px/600, underlined, inherits the foreground colour (DH 76) | mono, body size, `text-primary hover:underline` (WDP 116). |
| B6 | High | Copy: "Started today at 10:42 am. Paused at **Pick a favourite**, waiting for you to choose from 3 candidates." in 12px `#9D174D` (`--primary-subtle-foreground`) (DH 79) | "Started {new Date(...).toLocaleString()}" (WDP 122). Browser-locale format with seconds, e.g. "16/10/2026, 10:42:00 am", not `formatWhen`. There's no "Paused at" sentence. **API gap:** `RunSummary` (`crates/smasher-web/src/state.rs:138-161`) has no current or paused node id/label, and no candidate count. The candidate count needs `GET /api/runs/{id}/candidates`, and the paused step needs `GET /api/runs/{id}/questions` plus a lookup in the graph. Per `SPEC.md:44-46` this module owns the contract. |
| B7 | High | CTA button "Review Candidates" (`variant=default`, 24px) → run page (DH 81) | Missing. |
| B8 | Med | No working directory, completed time or error in the banner | `RunMetaList` (Completed / Working Directory / Error) is rendered inside the card (WDP 124). This isn't in the design. |
| B9 | Low | — | "+{n} more running" (WDP 125-127) isn't in the design. With several needs-you or active runs the design shows one banner. Decide whether to stack banners or keep a count. |

## 3. "What it does" step list (DH 87–103)

| # | Sev | Design | Implementation |
|---|---|---|---|
| S1 | High | Whole section: h2 "What it does" (15px/700), 12px muted lede, then an `ol` of numbered steps, 340px fixed column (DH 88-102) | **Entirely missing.** WDP never fetches the graph. |
| S2 | — | Data | Available: `getWorkflowGraph(id)` → `GET /api/workflows/{id}/graph` (`lib/api/workflows.ts:71-77`) returns `nodes[{id,node_type,label}]` and `edges[{from,to,condition,loop_restart}]`. `node_type` strings match `stepKind` keys (`editor_api.rs:75-88`); `Generic` falls back to "Step". "In order" requires a client-side walk from Start along the edges (the API doesn't order nodes). |
| S3 | Med | Lede copy is data-driven: "The steps in order. If “Did the checks pass?” says no, the workflow goes back to the first step and tries again." | Needs loop or back-edge detection (`loop_restart`, or an edge to an earlier node with a condition) plus plain-language condition wording. There's no helper for this. Curly quotes (“ ”) are in the design. |
| S4 | Med | List box: `background:#F7F7F9` (`bg-muted`), `border:1px solid rgba(0,0,0,.08)` (`border-border`), `border-radius:10px` (spec: step lists 10px; ≈ `rounded-xl` = 8.4px with `--radius` 6px, so nothing maps exactly) | — |
| S5 | Med | Row: `padding:8px 12px; gap:10px; border-bottom:1px solid rgba(0,0,0,.06)`. Number: 16px wide, right-aligned, 11px, `#8E8E93`, tabular. Chip: 26×26, radius 6, kind tint, 14px icon at stroke 1.9 in kind ink. Label 13px/500. Kind 11px `#6E6E73`. | — `#8E8E93` isn't a token. It's about 3.0:1 on `#F7F7F9`, which fails the AA rule in SPEC-shell R1; use `text-muted-foreground`. Row hairline `.06` isn't a token either (`--border` is .08). |
| S6 | Low | Kind captions use the plain names: Start, AI Agent, Tool, Branch, Ask a person, Finish | `stepKind().plain` already gives these (`stepKinds.ts:38-49`). |

## 4. Run history (DH 105–129; WDP 131–140, `RunTable.svelte`)

| # | Sev | Design | Implementation |
|---|---|---|---|
| H1 | Med | h2 "Run history" (sentence case), 15px/700 | `<h3>` "Run History" (Title Case), `text-base font-semibold` (16px/600) (WDP 131-132). The `aria-label` is "Run History" too. Heading level: design h2 under the toolbar h1; impl h3 skips h2. |
| H2 | Med | Lede: "Every run of this workflow, newest first. Open one to see what happened step by step." (12px muted, `margin:0 0 10px`) | Missing. |
| H3 | High | Columns **Status \| Started \| Run \| Duration**, `grid-template-columns:110px minmax(0,1fr) 110px 110px; gap:12px` (DH 110-111) | Shared dashboard table: **Status \| Workflow \| Started \| Duration**, `md:grid-cols-[130px_minmax(0,1fr)_170px_120px]` (`RunTable.svelte:36,43-46`). The Workflow column is redundant on a single-workflow page. WDP passes no `workflows` prop (WDP 136), so each row shows the raw `graph_name`, not the display title (`runStatus.ts:131-135`). The run id is nested in the Workflow cell rather than its own "Run" column. RunTable needs a `variant`/`columns` prop or a separate history table. |
| H4 | High | Inline error under the Started text: 12px warning-triangle icon (stroke 2.2), `gap:5px; margin-top:2px; font-size:11.5px; line-height:1.35; color:#C4170F` (`text-destructive`). Copy is a plain-language summary that names the failing step: "Check against design system: the candidate folder could not be found." (DH 118-122, 150) | Not rendered in RunTable. **API gap:** `RunSummary.error` is the raw engine string (e.g. test fixture "node X failed", `state.rs:271`). There's no failed-node id/label and no summary field. `SPEC.md:44` lists "per-run error summary" as an API addition this module owns. An `errorSummary()` helper is expected (`SPEC.md` testing strategy mentions "error summarising"). |
| H5 | Med | Started: 13px foreground. Run id: mono 11px muted. Duration: 12px muted, tabular. | Started `text-xs text-foreground/80` (12px, 80% alpha, not a token). Id mono 11px muted ✓. Duration 12px muted tabular ✓ (`RunTable.svelte:61,66-67`). |
| H6 | Low | Row `min-height:36px; padding:7px 12px; border-bottom:1px solid rgba(0,0,0,.05)`, zebra `#FFFFFF`/`#F7F7F9` | `min-h-[34px] py-1.5 md:py-1` (4px at desktop), no row hairline, zebra `bg-card`/`bg-muted` ✓ (`RunTable.svelte:53`). |
| H7 | Low | Table `border:1px solid rgba(0,0,0,.1); border-radius:8px` (spec: tables 8px). Header 26px `#F7F7F9`, bottom border .1, 11px/600 `#6E6E73`. | `rounded-lg` = `--radius` = **6px** (`app.css:141`), `border-border` (.08). Header `h-[26px] bg-muted text-[11px] font-semibold text-muted-foreground` ✓ but `border-border` (.08). |
| H8 | Low | Whole row is an `<a>` | Stretched link: the run id `<a>`'s `::after` covers the row (`RunTable.svelte:59-63`). Equivalent for clicks. Its accessible name is just the run id. Hover `bg-accent/60` and a focus ring are additions; DH has no hover state. |
| H9 | Low | Status badges: Needs you = default (no dot), Failed = destructive **no dot**, Completed = secondary + `#28C840` dot (DH 147) | `statusBadge` gives Failed `dot: var(--destructive)` (`runStatus.ts:173-174`). The board has no dot. A dashboard spec decision (`SPEC-dashboard.md:115`); note only. Running/Aborted aren't drawn on this board. |
| H10 | Low | Duration copy "10 min so far", "1 min 2 s", "5 min 31 s". Started "Today, 10:42 am", "Mon 12 Oct, 2:10 pm". | Matches `formatDuration`/`formatWhen` (`timeFormat.ts:57-84`) ✓. |

## 5. Layout, states, interactions

| # | Sev | Design | Implementation |
|---|---|---|---|
| L1 | High | Banner full-width under the toolbar. Then a scroll area `padding:20px 24px 32px` with a two-column flex: steps 340px fixed + history `flex:1`, `gap:24px`, `align-items:flex-start` (DH 84-85) | A single column, `flex flex-col gap-6`, in `max-w-6xl mx-auto p-8` (`App.svelte:189`, WDP 89). Centred and capped at 1152px; the design is full width. |
| L2 | Med | Phone width isn't designed (board `min-width:1100px`) | — The rebuild needs a stacking rule for the 340px column below `md` (SPEC-shell R4: nothing scrolls horizontally). RunTable already stacks rows on phones. |
| L3 | Med | Loading, empty, error and not-found states aren't drawn | Impl: "Loading workflow..." (three dots, not "…"; no `Skeleton` despite `ui/skeleton`) WDP 91. "Error: {error}" WDP 93, 134. "Workflow not found." + "← All workflows" (old catalogue wording) WDP 95-98. "No runs yet." WDP 138. Steps need loading, error and empty states too. The design needs to supply these, or the spec must define them. |
| L4 | Low | — | WDP polls `listRuns()` itself every 5s (WDP 26, 35-61) while the shell's library store already polls the same endpoint every 5s (`stores/library.svelte.ts:11-35`). That's duplicate traffic, and the WDP poll ignores document visibility. A rebuild could read `library.runs`. |
| L5 | Low | Focus: `box-shadow:0 0 0 3px rgba(190,24,93,.4)` radius 6 (DH 15) | `focus-visible:ring-3 ring-ring` in the Button/Badge primitives and the row `has-[a:focus-visible]:ring-3` ✓. |

## 6. API data the design needs

| Need | Have | Gap |
|---|---|---|
| Steps (label, kind, order) | `GET /api/workflows/{id}/graph` | Order and loop description must be computed client-side. |
| Toolbar subtitle filename + folder | `WorkflowSummary.path`, `source_dir`, `name` | Derive only. No API change. |
| Show in Finder | — | No endpoint, no Tauri opener plugin. **New capability.** |
| Banner "Paused at {step}", "{n} candidates", waiting since | `pending_questions`, `waiting_since` on `RunSummary`; candidates and questions per run via sub-routes | No current-node field; per-run fan-out calls needed. Consider additive `RunSummary.waiting_node` / `waiting_node_label` / `candidate_count`. |
| Inline error summary naming the step | `RunSummary.error` (raw string) | No failed-node id/label, no summary. Additive `failed_node` field + client `errorSummary()`. |
| Per-workflow runs | `GET /api/runs` filtered client-side (WDP 3, 38) | No `?workflow_id=` filter. OK at current scale. |

## 7. Design-system usage (these files)

| # | Sev | Where | Finding |
|---|---|---|---|
| D1 | Med | WDP 110-129 | Hand-rolled card (`section … rounded-lg border bg-card p-4`) though `ui/card` exists. Moot if it's replaced by the banner, which should be a token band (`bg-primary-subtle text-primary-subtle-foreground`). |
| D2 | Low | WDP 91 | Loading text where `ui/skeleton` exists. |
| D3 | Low | WDP 96-97, 101-102, 114, 121, 132 | Tailwind default scale `text-lg`/`text-base`/`text-sm` (18/16/14px), off the R1 type scale (body 13, captions 11–12, headings 15/700). Nothing in `app.css` remaps `text-sm`/`text-base` (`app.css:12` sets only body 13px). |
| D4 | Low | WDP 97 | Raw `<a>` link styled `text-primary hover:underline` rather than `Button variant="link"`. |
| D5 | Low | WDP 89 | `workflow-detail` class has no CSS rule in `src` (grep finds only this use). Dead, or a test hook. |
| D6 | Low | RunTable 36, 42, 53, 57, 61 | Arbitrary values: `grid-cols-[130px_…_170px_120px]`, `h-[26px]`, `text-[11px]`, `text-[13px]`, `min-h-[34px]`; `text-foreground/80` is an opacity tint, not a token. Several are board-exact sizes with no token (11px/13px), so acceptable but repeated. Consider `text-caption`/`text-body` theme sizes. |
| D7 | Low | Toolbar 273, 284, 286 | `h-[52px]`, `text-[15px]`, `text-[11px]` arbitrary (shell). |
| D8 | Low | RunMetaList 95-107 | Uses tokens; `text-sm` 14px off-scale. Not part of the design for this page. |
| D9 | — | StatusBadge / Badge / Button | Use primitives + tokens ✓. The primitives embed rgba shadows (`button.svelte` variants), which is the sanctioned primitive layer. |
| D10 | — | No raw hex/rgb in WDP, RunTable, StatusBadge, RunMetaList, Toolbar ✓. `stepKinds.ts` holds hex as data, as R3 sanctions. |

## 8. stepKinds vs Workflow.dc.html kind colours/icons (note only; R3 says the Main table wins)

| Kind | Workflow.dc ink / tint (DH 143-144) | `stepKinds.ts` (= Main.dc GROUPS) |
|---|---|---|
| Start, Exit | `#1E7A34` / `#DDF3E2` | `#1E6B2E` / `#E3F3E6` |
| Codergen | `#4338CA` / `#E6E5FA` | `#3730A3` / `#ECEBFB` |
| Tool | `#0F6B65` / `#DDEFEC` | `#0F5F5A` / `#E1F1EF` |
| Conditional | `#3A4556` / `#E6E9EE` | `#334155` / `#E8EBF0` |
| Interviewer | `#9A5300` / `#FBEBD3` | `#8A4B06` / `#FBEEDA` |

The plain names match (AI Agent, Tool, Branch, Ask a person, Start, Finish).

**Icons (Med):** both boards (DH 137-141 and `Main.dc.html:300-311`) draw the same paths:
- Codergen: sparkles
- Tool: terminal prompt (`>_`)
- Conditional: diamond
- Start: play triangle
- Exit: square
- Interviewer: user

`stepKinds.ts:39-48` uses `bot`, `square-terminal`, `git-branch`, `circle-play` and `flag` (only `user` matches). R3 asks for "lucide equivalents of the board paths". Lucide has `sparkles`, `terminal`, `diamond`, `play` and `square`, so these icons deviate from both boards, not only from Workflow.dc. The dark pairs (`inkDark`/`tintDark`) aren't drawn on any board (derived).
