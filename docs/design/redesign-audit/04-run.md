# Audit 04 — Run page vs `Run.dc.html`

Design: `docs/design/redesign/Run.dc.html` (markup lines 20–291, data/JS lines 294–495; scenarios
`waiting`, `running`, `completed`, `failed`, plus an internal `iterating` phase reached after
"Try Again with My Notes").
Implementation: the `/runs/{id}` route in `frontend/src/App.svelte:194-228`, which stacks
`RunDetail`, `EventLog`, `QuestionCard`, `GalleryGate`, `CandidateGallery` and `DecisionHistory`.

Severity: **High** = structural/missing capability or a functional bug; **Med** = visibly different
(copy, hierarchy, state); **Low** = spacing/size/polish.

---

## 0. Status of the module

- `SPEC.md:38` lists `run` as a capability-map module ("progress, activity log, decision panel
  (candidates, note, choice), plain-language failure panel with 'What you can try', run details").
  There is **no `SPEC-run.md`** (only `SPEC.md`, `SPEC-shell-theme.md`, `SPEC-dashboard.md` exist).
- `git log` shows no run-module work. The last commits touching the run components predate the
  redesign (`5fd6fb2` QuestionCard, `cff66fb`/`b44673b`/`0e97dc7` EventLog). Since then the only
  changes are shell-wide: `010d275` "Wrap every route in AppShell", `d5ed2ea` Toolbar,
  `022a87c` "Share one status-to-badge mapping".
- `SPEC-shell-theme.md` ("Out of Scope: Rebuilding the contents of the … run … screens") confirms
  that only the frame and tokens have changed. The content layout is the pre-redesign one.
- **Conclusion:** the Run page has not been rebuilt. Almost every section of the artboard is missing
  or implemented differently. The findings below are the gap list a `SPEC-run.md` needs.

---

## 1. Page frame and layout

| # | Sev | Finding |
|---|---|---|
| 1.1 | High | **Layout model differs.** Design: a full-height `main` that scrolls (`padding:24px 28px 32px; gap:20px`, Run.dc.html:83), a **300px right inspector** `aside[aria-label="Run information"]` (`#F7F7F9` with a left hairline, :226), and a **sticky bottom decision bar** (:210). Impl: a centred `max-w-6xl mx-auto p-8` column (App.svelte:196) holding RunDetail, then a `lg:grid-cols-2 gap-8` grid of Events and Questions (:201), then GalleryGate, Candidates and Decision History stacked with `mt-8` (:215-227). No inspector and no bottom bar. |
| 1.2 | High | **The inspector is missing**: a segmented `Tabs` "Progress \| Activity \| Details" (full-width, :227) toggled by the toolbar's ghost icon button "Run information" (`pressed`/`expanded`, :76). The `Tabs` primitive exists (`lib/components/ui/tabs/`) but isn't used. At phone width this panel should become the `Drawer` primitive (spec requirement; the design is `min-width:1100px`). |
| 1.3 | Med | **Section headings.** The impl adds `h2 text-xl font-semibold` (20px/600) labels "Events", "Questions", "Candidates" and "Decision History" (App.svelte:204,210,220,225). The design's section `h2`s are 15px/700 ("Candidates", "Your decisions", :139, :189). Inspector headings are 11px/600 muted ("Progress", "Activity", "Run details", :233,253,274). "Decision History" is Title Case; the design uses the sentence-case "Your decisions". |
| 1.4 | Med | **Duplicate heading.** App.svelte:204 renders `h2` "Events", then EventLog.svelte:114 renders its own `h3` "Events". |
| 1.5 | Low | **Type scale.** The impl uses Tailwind `text-sm` (14px) and `text-base` (16px) throughout (e.g. TokenCounter:36, RunMetaList:11, EventLog:114,126, QuestionCard:131). The design is 13px body, 11–12px captions, and 15px/20px headings. |
| 1.6 | Low | **Order of sections** per the design: hero (state-specific), Candidates, Your decisions, then the decision bar. Impl: meta, tokens and graph, then Events and Questions, gate, all candidates, and history. |

## 2. Toolbar (unified header)

| # | Sev | Finding |
|---|---|---|
| 2.1 | High | **Title.** Design: the workflow's title, `h1` "Design concepts review" (:64). Impl: `Run ${runId}` (App.svelte:39-40; document title :53-54). `runTitle(run, workflows)` already exists (`lib/runStatus.ts:22`), and `usePageTitle` is available (`lib/page-header.svelte.ts:46`). RunDetail doesn't call either. |
| 2.2 | Med | **Subtitle is missing.** Design: `<mono>run-7f3a9c</mono> · Started today, 10:42 am · 10 min so far` (11px muted, :67; `elapsedText` :470). Toolbar supports backtick mono (`Toolbar.svelte:26,45`), and `usePageSubtitle`, `formatWhen` and `formatDuration` (`lib/timeFormat.ts`) exist. RunDetail sets none of them. The elapsed time must also tick while the run is active. |
| 2.3 | Med | **Back target.** Design: "Back to Design concepts review", linking to the workflow page (:61). Impl: the catalog fallback `{label:'Smasher Pipelines', href:'/'}` (App.svelte:28,157), which gives "Back to Smasher Pipelines". This label is stale too. `usePageBack` exists (page-header.svelte.ts:79), and `run.workflow_id` is available. |
| 2.4 | Med | **Badge placement.** Design: the status `Badge` sits beside the `h1` (:63-65). Impl: StatusBadge is rendered inside the right-hand actions snippet (RunDetail.svelte:96). |
| 2.5 | High | **"Needs you" status is never shown.** Design: waiting gives the "Needs you" default (accent) badge with no dot (:455). Impl: `<StatusBadge status={run.status} />` (RunDetail.svelte:96) passes the raw server status. A waiting run therefore shows "Running" with the info dot. `isNeedsYou(run)` (runStatus.ts:17) and `pending_questions` exist but aren't used here. |
| 2.6 | Med | **Abort button.** Design: `variant="destructive"` (push button, red text), default size (24px), label **"Abort Run"**, `stop` icon (:70). Impl: `size="sm"` (22px), label **"Abort"**, and the busy label "Aborting..." (three dots, not "…"), RunDetail.svelte:99-107. It also overrides the variant to a red fill with white text (`class="bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive"`, :102). That fights the restyled primitive, which is meant to be red text on a push button. There is no icon. |
| 2.7 | High | **"Run Again" (toolbar, outline, `refresh` icon) is missing for completed and failed runs** (:72-74). There is no rerun capability on the run page. The API can start a run from `workflow_id` (`runs.ts:142 runWorkflow`), but `RunSummary` (runs.ts:11-25) doesn't expose the run's input **variables, model or provider**, so the rerun can't reuse its inputs. **API gap.** |
| 2.8 | Low | **Separator.** Design: a 1×18px `rgba(0,0,0,.12)` rule between the run actions and the inspector toggle (:75). Impl: `Separator orientation="vertical" class="h-5"` (20px) between the badge and Abort (RunDetail.svelte:98). It is also in a different position, and it disappears for terminal runs. |
| 2.9 | Low | **Settings button.** The impl appends `LazySettingsDialog` to every non-catalog page's header (App.svelte:149-151). The design's run toolbar has no settings button. Keep it as a capability, but decide where it goes. |
| 2.10 | Med | **Resume is never offered.** `resumeRun` exists (`runs.ts:166`) but nothing in `src/` calls it (verified by grep). SPEC.md success criterion 2 lists "cancel/resume". The design has no Resume either, so this is a capability gap on both sides. |

## 3. Hero, per state

The design puts one state-specific hero at the top of `main`. The impl has **no hero in any
state**.

### 3a. Waiting ("needs decision")
| # | Sev | Finding |
|---|---|---|
| 3a.1 | High | Design: kicker **"Pick a favourite · Ask a person"** (11px/600, `#9D174D` = `--primary-subtle-foreground`), then `h2` **"Which concept should we take forward?"** (20px/700, lh 1.25) (:86-91). The kicker is the node label plus the `stepKind` plain name. Impl GalleryGate shows **no question text at all**. It starts with "Expected N, found M" (GalleryGate.svelte:115-121). **API gap:** `GalleryGateInfo` (`api/questions.ts:16-21`; `GalleryGateSummary` in `crates/smasher-web/src/routes/questions.rs:31-36`) has no `question` text, `node_id` or node label. The server also strips that question out of `questions[]` (questions.rs:121-124), so the text isn't reachable anywhere. |

### 3b. Running
| # | Sev | Finding |
|---|---|---|
| 3b.1 | High | Design: a `section[aria-live=polite]` card with padding 18/20, radius 10px, background `#F7F7F9` (`--muted`) and a hairline border (:94-101). It holds the kicker "Now running" (11px/600 muted), the `h2` current step label (20px/700), a description (12.5px/1.45 muted: "This step makes one AI call that reviews the candidates as a usability critic. It usually takes under a minute.") and a 4px indeterminate bar: a 35% `#BE185D` (`--primary`) slider on `rgba(0,0,0,.08)`, `wfslide 1.6s linear infinite`. The impl has none of this. The current step can be derived from the last `node_started` with no matching completion. The step **label** and a **plain-language step description** aren't in the API: events carry only `node_id` and `node_type`. "Usually takes under a minute" would be invented data (SPEC.md boundary). Drop that sentence or get typical durations from a source. |
| 3b.2 | Med | **Iterating variant.** After "Try Again with My Notes" the design shows the running hero with "Making new candidates from your notes" / "Your decision was recorded. The workflow has gone back to Draft three concepts for another round." (:467-468). Impl: the one line `Decision recorded — resuming…` in `text-green-700` (GalleryGate.svelte:112). |

### 3c. Completed
| # | Sev | Finding |
|---|---|---|
| 3c.1 | High | Design: a success card with background `#F2FAF4`, border `rgba(40,200,64,.3)`, radius 10px and padding 18/20 (:104-113). It has a 32px `#28C840` circle with a white check (stroke 3), the `h2` "Finished in 10 min 35 s" (`formatDuration` style), the line "You approved concept-a. The workflow then ran to the end." (12.5px, `#3A3A3C`; derivable from `/decisions`), and an outline Button **"Show Results in Finder"** with a `folder` icon. Impl: only the Completed badge, plus a centred `text-green-600` "Pipeline complete" line at the bottom of the event log (EventLog.svelte:149-151). |
| 3c.2 | High | **"Show Results in Finder" has no backing.** There is no reveal-in-Finder endpoint or Tauri command; grep for `reveal`/`Finder` finds nothing in `src/`. SPEC.md:44 assigns a reveal-in-Finder API addition to the first module that needs it. The browser needs a fallback, such as copying the path or hiding the button. |
| 3c.3 | Low | The completed copy is gallery-specific. Runs without a gate need generic copy, which the design doesn't define. |

### 3d. Failed
| # | Sev | Finding |
|---|---|---|
| 3d.1 | High | Design: a `section role="alert"` with background `#FFF5F4` and border `rgba(255,59,48,.28)` (:116-133). It holds a 30px red triangle warning icon (`#FF3B30`), the `h2` **"{step label} couldn’t finish"** (curly apostrophe), and a `pre` with the raw error (mono 12px/1.5, white background, 1px `rgba(0,0,0,.1)` border, radius 6, padding 8/10). Then an `h3` **"What you can try"** (13px/600) with a bullet list ("Open the step in the editor and check its tool settings point to a folder that exists." / "Check the step before it (Draft three concepts) actually created the files."). Buttons: outline **"Open in Editor"** and default **"Run Again"** with the `refresh` icon. Impl: the only failure UI is a RunMetaList row, `dt` "Error" / `dd text-destructive whitespace-pre-wrap` (RunMetaList.svelte:20-23). There is no failing-step name, no suggestions and no actions. |
| 3d.2 | High | **API gap: plain-language suggestions.** "What you can try" needs either error classification on the server (an additive field such as `error_hint`/`suggestions`) or a client-side rule table keyed on error patterns. The failing **node id** can come from the `node_failed` event, but its **label** and its **previous step** need run graph data (see 8.1). |
| 3d.3 | Med | "Open in Editor" is feasible: it links to `/workflows/{workflow_id}/edit`. "Run Again" has the same variables gap as 2.7. |
| 3d.4 | Low | **Aborted isn't designed.** `statusBadge('Aborted')` gives a secondary badge with a muted dot (runStatus.ts:66-67), and EventLog shows "Pipeline aborted" (eventFormat.ts:48-56). The spec needs an aborted hero, and has to say whether "Run Again" shows for it (design `isDone` covers completed and failed only, :465). |

## 4. Candidates (decision panel)

| # | Sev | Finding |
|---|---|---|
| 4.1 | High | **Two candidate grids.** Design: one "Candidates" section. Its cards are selectable while waiting and read-only with a "Chosen" badge when completed or iterating. It is hidden while running or failed (`showCands`, :484). Impl: GalleryGate renders a selectable grid (GalleryGate.svelte:123-163), and CandidateGallery renders a second, read-only grid of the same candidates underneath (App.svelte:219-222; CandidateGallery.svelte:49-53). That grid always shows, with "Loading candidates..." / "No candidates yet." (:43,47), even for runs that have no gallery. |
| 4.2 | Med | **Section header.** Design: `h2` "Candidates" (15px/700) with an inline 12px muted meta, **"Expected 3, found 3 · 1 could not be rendered"** (:138-141,485). Impl: a `text-sm` muted paragraph, "Expected {n}, found {m}" or **"Found {n} candidate(s)"** (GalleryGate.svelte:115-121). There is no failed count, and "(s)" is not plain language. |
| 4.3 | Low | **Grid.** Design: `repeat(auto-fill,minmax(240px,1fr))` with gap 14px (:142). Impl: `minmax(260px,1fr)` with `gap-5` (20px) (GalleryGate.svelte:123, CandidateGallery.svelte:49). |
| 4.4 | Med | **Card surface.** Design: padding 12, radius **10px**, white, `box-shadow: 0 0 0 1px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.06)` (:423,428-430). Selected: a **2px `#BE185D` ring**. Chosen: a **2px `#28C840` ring**. Impl: `rounded-lg` (6px), `border`, `p-4` (16px), and no shadow or ring (GalleryGate.svelte:138; CandidateCard.svelte:43). Selection is shown only by the checkbox, with no ring on the card. |
| 4.5 | High | **Selection control.** Design: a **Select / Selected toggle Button** (size `sm`, `outline` becoming `default` with a `check` icon, `aria-pressed`) right-aligned on the ID row (:156-161,434). Impl: a `Checkbox` at the top-left of a card that is a `<label>`, so the whole card toggles (GalleryGate.svelte:137-144). Both work, but the visuals and affordance differ. |
| 4.6 | Med | **Preview.** Design: a fixed **130px** tile with radius 6, background `#F2F2F4` and a hairline border, `role="img"` (:153-155). The sketch blocks stand in for a screenshot. Impl: the thumbnail keeps the capture viewport's aspect ratio (CandidatePreview.svelte:45) and opens a lightbox Dialog with a live iframe, ⟲ reset and "Open in new tab" (:62-127). **Keep the lightbox.** It is an impl capability absent from the design. Consider fixing the tile height at 130px and `object-top`. |
| 4.7 | Low | **ID line.** Design: mono 12px **600** (:157). Impl: `font-mono text-xs` at normal weight (GalleryGate.svelte:147; CandidateCard.svelte:47). |
| 4.8 | Med | **Raw `captured_at` string** is printed under the ID (CandidateCard.svelte:33-35,48-50) as an unformatted ISO timestamp. The design has no such line. |
| 4.9 | Low | **`params` disclosure** (CandidateParams.svelte, lowercase "params") is an impl capability not in the design. Keep it, maybe as "Settings used". |
| 4.10 | High | **Scorecard copy and form.** Design: three stacked (`gap:6px`) `secondary` Badges with a coloured dot, in plain language: **"Design-system check: Passed"**, **"Usability: No friction found"** / **"1 friction point"**, **"Recommendation: Advance"** / "Iterate". Dots: green `#28C840`, amber `#FF9500`, blue `#007AFF`. Each has `title="Shown as “lint” in the workflow engine"` (:163-169,435). Impl: wrapped inline badges **"lint: pass/fail"**, **"critic: success/friction"**, **"synthesis: {label}"** with green-100/red-100 fills, `rounded` and `font-semibold` (ScorecardBadges.svelte:31-68). |
| 4.11 | Low | **Score detail text.** The impl prints each lint violation, friction point and synthesis reason as muted text (ScorecardBadges.svelte:40-42,53-55,65-67). The design computes `note` for each score (:435) but its template never renders it. Keep the impl detail (it's useful), and get the design updated to show it. |
| 4.12 | High | **Note per candidate.** Design: a `link` Button, size xs: "Add a Note…" / "Edit Note" / "Hide Note" (`aria-expanded`). It reveals a 2-row Textarea with hidden label "Note for {id}" and placeholder **"Notes to steer the next round (optional)"** (:170-177,437). After the decision, "Your note: {text}" appears (12px muted, :178). Impl: the Textarea is always visible, labelled `aria-label="Comment for {id}"`, with placeholder **"Notes to drive the next iteration (optional)"** (GalleryGate.svelte:152-159). There's no saved-note line on read-only cards. |
| 4.13 | Med | **Failed candidate card.** Design: background `#FFF5F4`, border `rgba(255,59,48,.25)`, radius 10 (:425). It has a 130px dashed-red placeholder with a 26px warning-triangle icon (:146-148), the ID in mono 12/600, and the reason at **12px** `#C4170F` (:150). Impl: `bg-destructive/5 border-destructive/30 rounded-lg p-4`, with no placeholder or icon, and the reason at `text-sm` (14px) (GalleryGate.svelte:126-134; CandidateCard.svelte:28-39). |
| 4.14 | Med | **Chosen state.** Design (completed): the chosen card gets a green ring and a `Badge secondary` **"Chosen"** with a green dot (:158). Impl: CandidateGallery doesn't know about decisions, so there's no chosen marker. |

## 5. Decision bar (waiting)

| # | Sev | Finding |
|---|---|---|
| 5.1 | High | Design: a sticky bottom `section[aria-label="Decision"]` with background `#F7F7F9`, border-top `rgba(0,0,0,.1)` and padding `12px 20px 12px 28px` (:209-221). It contains **"What should happen next?"** (13px/600) with a `Tooltip` info trigger ("Try again with my notes: sends this round back and makes new candidates using your notes. With nothing selected, every candidate is rejected. Approve selected: carries the selected candidates forward and the workflow finishes."). Under it is a 12px muted selection summary: **"Nothing selected yet. Select the candidates you want to keep."** / **"2 selected: concept-a, concept-b"**. Then an `outline lg` **"Try Again with My Notes"** and a `default lg` **"Approve Selected"** with a `check` icon, **disabled when nothing is selected**. Impl: an inline row of identical `default`-size primary Buttons, one per `outgoing_edges` entry, labelled with the **raw edge label** (GalleryGate.svelte:165-171). The help text is engine jargon: **"No boxes checked + an iterate edge = reject-all and re-roll."** (:172-174). There's no summary, no tooltip, no disabled state and nothing sticky. |
| 5.2 | Med | **Edge → button mapping.** The design hard-codes two choices. `outgoing_edges` holds arbitrary DOT labels (`e.label` or target id, questions.rs:115-120). The spec has to define the mapping, e.g. recognise approve/iterate and fall back to Title-cased labels, along with which button is primary and which is outline. |
| 5.3 | Low | The error line (`gate-error`, GalleryGate.svelte:175-177) has no designed position. Keep it, or use a toast (`notifyError` is the app pattern). |

## 6. Inspector: Progress tab

| # | Sev | Finding |
|---|---|---|
| 6.1 | High | **The step list is missing.** Design: a header "Progress" plus **"{n} of 7 done"** (11px muted). It is an `ol` with a white background, hairline border, radius 8 and padding 4/0. Each row has padding 6/10, gap 10, and an **18px status dot** (:230-247,404-417): done `#28C840` with a white ✓; failed `#FF3B30` with ✕; waiting `#BE185D` with "?"; running is a spinner (2px `rgba(0,0,0,.1)` border, pink top, `wfspin .9s`); pending is a white disc with a 1.5px `rgba(0,0,0,.2)` border. The label is 13px, weight 500 when active and 400/muted when pending. The meta line is 11px **"{plain kind} · {state}"**, e.g. "AI Agent · Ran twice · 2m 41s", "Ask a person · Waiting for you" (`#9D174D`), "Tool · Stopped with an error" (`#C4170F`), "Branch · Ran twice · went back once", "Ask a person · Answered · 6m 28s", "Tool · Second run in progress". Impl: none. |
| 6.2 | High | **API gap: the run's ordered node list.** Progress needs every node, including pending ones, with id, label and handler. `GET /api/runs/{id}/graph` returns only SVG (runs.ts:178). `POST /api/graph/nodes` (runs.ts:193) needs `dot_source`, and `RunSummary` exposes neither the DOT nor the nodes. Re-reading the workflow's current DOT could drift from what the run actually executed. Proposed additive endpoint: `GET /api/runs/{id}/nodes` returning `{id,label,node_type}` in graph order. Per-node state, run count ("Ran twice"), summed durations and loops can be derived from SSE events (`node_started.node_type` is the `NodeType` Debug name, e.g. `Codergen`, engine.rs:575-578, so `stepKind()` maps it). |
| 6.3 | Med | **Pipeline Graph (Graphviz SVG)** (RunDetail.svelte:128-142, with polling :53-66,84) is an impl capability **absent from the design**. SPEC.md "Ask first: dropping a capability…". Either keep it, for example as a "Graph" view inside Progress or Details, or get approval to drop it. The Graphviz-missing hint (`lib/graphError.ts`) goes with it. |

## 7. Inspector: Activity tab (event log)

| # | Sev | Finding |
|---|---|---|
| 7.1 | High | **No key/everything filter.** Design: a header "Activity", a right-aligned `ToggleGroup` (size sm) **"Key moments \| Everything"**, and help text (11.5px muted): "Only the moments that matter: steps starting and finishing, loops, and anything that needs you. Switch to Everything for the full detail." / "Everything, including each tool the AI used, what it said, token counts and indented detail." (:250-256,491). Impl: every event is always shown. Bookkeeping events are faded to `opacity-60` (EventLog.svelte:127; eventFormat.ts `faded`) instead. The `ToggleGroup` primitive exists but isn't used. |
| 7.2 | Med | **Row anatomy.** Design (one white bordered list, radius 8, rows padding 5/10, gap 8, :257-267,393-399): **time first** (52px, mono 10.5px, tabular, muted); a **7px tone dot**; then a stacked **label** (11px/600, tone text colour) over **detail** (12px/1.4, foreground, wraps with `overflow-wrap:anywhere`). Agent rows get `padding-left:22px`. Impl (EventLog.svelte:119-145): separate `bg-card` rounded rows with `gap-1.5`, a **4px left border** in the tone colour, an **emoji/glyph icon** (⚡ ✓ ✕ ▶ → ↻ ⟳ ◆ ? ✎ 🔧 💬 ⊛, eventFormat.ts), an **UPPERCASE** label (`uppercase`, :134) inline with the detail, the detail **truncated to one line** (`truncate`, :136), and the time **last**. Agent rows use `ml-5 text-xs`. |
| 7.3 | Med | **Time format.** Design: 24h `10:42:05`. Impl: `new Date(...).toLocaleTimeString()` (EventLog.svelte:142). That depends on the browser locale (en-AU gives `10:42:05 am`). |
| 7.4 | High | **Copy, plain language** (design `E(...)` rows :303-333,377-389 vs `lib/eventFormat.ts`): "Run started" vs "Pipeline started" (:39); "Step started" vs "Node started" (:61); "Step finished" vs "Node completed" (:68); "Step failed" vs "Node failed" (:77); "Went back (loop 1)" vs "Loop #1" (:94); "Waiting for you" vs "Awaiting input" (:106); "Answer received" vs "Input received" (:115); "Run completed" vs "Pipeline completed" (:44). The design also has "Run failed", but no `pipeline_failed` event kind exists (api/events.ts:140-157), so it would be derived from `run.status`. |
| 7.5 | Med | **Detail copy.** Design details use **step labels**, e.g. "Draft three concepts · 1m 6s". Impl uses `node_id`, and Step started is `"{node_id} ({node_type})"` (eventFormat.ts:62). The label needs the node map (6.2). Tokens: design "19,310 in · 5,204 out" vs impl `in:19310 out:5204` plus `$0.0123` cost (eventFormat.ts:165-166). Use en-AU grouping. Keep the cost only if wanted, since the design omits it. "Run completed" detail: design "7 steps · 10m 35s" vs impl "{n} nodes · …". Design Tool call: "read_file brief.md". The impl drops `input_preview`, which the API provides (events.ts:116). Design "Step finished … · took “No, try again”" folds the edge label into the branch step. The impl shows a separate faded "Edge" row (eventFormat.ts:81-89). Durations below 1s: design "0.1s" / "0.0s" vs impl `100ms` (eventFormat.ts:24). |
| 7.6 | Med | **Event set.** The design's Everything view shows Tool call, Agent and Tokens only. The impl also emits Tool done, Turn N, Context updated, Checkpoint and Edge (eventFormat.ts:81-101,127-157). Decide which of these are "Everything" and which are hidden. |
| 7.7 | Med | **Tone colours.** Design (TONE, :297-300) uses dot/label pairs: blue `#007AFF`/`#0060DF`, green `#28C840`/`#248A3D`, red `#FF3B30`/`#C4170F`, amber `#FF9500`/`#B25000`, **purple = brand pink `#BE185D`/`#9D174D`**, muted `#AEAEB2`/`#6E6E73`. Tinted rows are `#FCEEF4` (pink, i.e. `--primary-subtle`) and `#FFF1F0` (red). Impl: Tailwind `blue/green/red/amber/purple-500/600/400` and `*-500/10` tints (EventLog.svelte:17-33). Its "purple" really is violet, so it's **off-brand**. |
| 7.8 | Low | **Impl-only states.** "Waiting for events..." (EventLog.svelte:117) and a "Pipeline complete" footer (:149-151) aren't designed. Fixed `max-h-[500px]` scroll box (:112) vs the inspector scroll. Keep the newest-first scroll anchoring (:42-61) and the OS notification (:91-106), which are capabilities. |

## 8. Inspector: Details tab

| # | Sev | Finding |
|---|---|---|
| 8.1 | Med | Design: `h2` "Run details" over a white `dl` (radius 8). Rows are padding 8/12 with a bottom hairline: `dt` 11px muted, value 13px/500 tabular, and a sub line 11px muted (:272-285,471-477). Rows: **Started** "Today, 10:42 am" / sub elapsed; **Input tokens** "59,376" / "Text sent to the AI"; **Output tokens** / "Text the AI wrote back"; **Total tokens** / "Input and output together"; **Working folder** "runs/run-7f3a9c" / "Where this run saves its files". Impl: TokenCounter prints one `text-sm` muted row: "Input tokens: N  Output tokens: N  Total tokens: N" (TokenCounter.svelte:36-43). RunMetaList is a `grid` with **"Completed"**, **"Working Directory"** (Title Case) and **"Error"** (RunMetaList.svelte:10-24). There is no Started row and no sub-captions. |
| 8.2 | Low | **Number and date locale.** `toLocaleString()` without `'en-AU'` (TokenCounter.svelte:40-42) and `new Date(...).toLocaleString()` (RunMetaList.svelte:14) don't produce the en-AU "Today, 10:42 am" wording. Use `formatWhen`. |
| 8.3 | Low | The "Completed" row and the raw "Error" row have no design slot. Completed is covered by the hero ("Finished in …"), and Error moves to the failure hero `pre`. Keep both data points. |

## 9. Your decisions (decision history)

| # | Sev | Finding |
|---|---|---|
| 9.1 | Med | Design: shown **only when there are decisions** (:187). The impl always renders the heading, "Loading decision history..." and **"No decisions yet."** (App.svelte:224-227; DecisionHistory.svelte:43-48). |
| 9.2 | Med | **Card.** Design: padding 12/14, radius **8**, background `#F7F7F9`, hairline border (:191). Row: the **node label** "Pick a favourite" (13px/600), a `secondary` badge with the decision, and the time **"Today, 10:52 am"** at 11px muted (:192-196). Impl: `Card.Root` overridden to `rounded-lg border p-4 shadow-none ring-0` (DecisionHistory.svelte:53). It shows the **`node_id` in mono 12px/600** (:55) and the time as `toLocaleString()` (:58). The decision badge has `rounded font-semibold` overrides (:56). |
| 9.3 | Med | **Selected IDs.** Design: `outline` Badges with a green dot, and **"Nothing selected"** when there are none (:197-200). Impl: custom `bg-green-100 text-green-700` mono badges (DecisionHistory.svelte:65). Nothing is shown when none were selected. |
| 9.4 | Low | Notes match closely: mono 600 `{id}:` then text, 12px muted (:201 vs DecisionHistory.svelte:71-79). The impl uses `dl/dt/dd`, which is fine. |

## 10. Generic questions (QuestionCard): impl capability with no design

| # | Sev | Finding |
|---|---|---|
| 10.1 | High | The design covers only the gallery-gate decision. Free-form, multiple-choice and approval questions (QuestionCard.svelte:143-217) and the **Answered Questions** list with markdown replies (:224-241) aren't designed. They **must be kept** (SPEC.md success criterion 2: "answer gates"). Recommend reusing the waiting hero (kicker = node label · "Ask a person", `h2` = question) and the bottom decision bar (approval → "Yes"/"No" buttons; free-form → Textarea plus a primary button; multiple choice → options). |
| 10.2 | Med | **Copy and technical detail.** The headings "Pending Questions" / "Answered Questions" are Title Case. The kind badge is `uppercase` ("FREE FORM"), and the **raw question id** is printed in mono (QuestionCard.svelte:135-136). The design hides technical ids, so this conflicts with the plain-language goal. Placeholder "Enter your answer", "Submit" and "No pending questions." have no design equivalents. |
| 10.3 | Med | **Styling.** The pending card is `border-l-4 border-primary bg-primary/5` (:133); use `bg-primary-subtle`. The answered card is `border-green-600 bg-green-50` with `text-green-700` (:227,229), with no dark-mode variants. Approval Yes is `bg-green-600 text-white hover:bg-green-700` and No is `bg-destructive text-white` (:168-180). Both are colour overrides on the `default` Button rather than variants. |

## 11. Behavioural issues found while auditing

| # | Sev | Finding |
|---|---|---|
| 11.1 | High | **The second gate round never appears.** GalleryGate sets `done = true` after a successful decision (GalleryGate.svelte:84) and never resets it. `refresh()` skips updating `gate` while `done` (:43-45). After "iterate", the loop's next gallery gate stays hidden behind "Decision recorded — resuming…" until the page is reloaded. QuestionCard also hides its empty state while `gallery_gate !== null` (QuestionCard.svelte:86,128). The design's iterating → waiting-again flow needs `done` to clear when a new `question_id` arrives. |
| 11.2 | Low | Failed runs: EventLog's completion notification only fires on `pipeline_completed`/`pipeline_aborted` (EventLog.svelte:95-97), and there is no failure event kind. Behaviour on failure depends on the server's terminal event. Check this when building the failed hero. |

## 12. API data the design needs that the API lacks

1. **Run node list** (`id`, `label`, `node_type` in graph order) for Progress, the step labels in Activity and the heroes, "Stopped at {step}", and the decision node label. *(High; additive `GET /api/runs/{id}/nodes` or a field on `RunSummary`.)*
2. **Gallery gate question text + node id/label** on `GalleryGateInfo` (questions.rs:31-36). *(High)*
3. **Plain-language failure hints** ("What you can try"), or a client rule table. The failing node and previous step come from 1. *(High)*
4. **Run inputs** (variables, model, provider) so "Run Again" can repeat the run. *(Med)*
5. **Reveal in Finder** (Tauri command plus browser fallback) for "Show Results in Finder". *(Med)*
6. **Step description / typical duration** for the running hero's sentence. Otherwise drop it, so as not to invent data. *(Low)*
7. **Run-failed event**, or derive it from `run.status`. *(Low)*
8. Already available: `started_at`, `completed_at`, `error`, tokens, `run_working_dir`, `workflow_id`, `pending_questions`, `waiting_since`, candidates, scorecards, decisions, `outgoing_edges`, `expected_count`, and SSE events with `node_type`, `duration_ms`, `input_preview` and `restart_count`.

## 13. Impl capabilities absent from the design (keep, or ask before dropping)

- Pipeline Graph SVG with the Graphviz hint (RunDetail.svelte:128-142).
- Candidate lightbox: live iframe, reset, "Open in new tab" (CandidatePreview.svelte:62-127).
- `params` disclosure (CandidateParams.svelte).
- Scorecard violation, friction and reason text (ScorecardBadges.svelte).
- Generic question types and Answered Questions with markdown replies (QuestionCard.svelte).
- Candidates from earlier rounds across the whole run (CandidateGallery via `/candidates`).
- OS notification on completion (EventLog.svelte:91-106) and newest-first scroll anchoring.
- Token cost in USD (eventFormat.ts:166), the Completed timestamp and the raw Error (RunMetaList).
- The Settings button in the toolbar (App.svelte:149-151).
- The Aborted state.

---

## 14. Design-system usage audit (these files)

| # | Sev | File:line | Issue |
|---|---|---|---|
| D1 | Med | RunDetail.svelte:102 | The `destructive` Button is overridden with `bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive`. That fights the restyled variant (push button, red text; button.svelte `destructive`) and adds a raw `text-white`. |
| D2 | Low | RunDetail.svelte:98 | `Separator class="h-5"`. The design rule is 18px (`h-[18px]`, or a toolbar-divider token). |
| D3 | Low | RunDetail.svelte:136 | `[&_svg]:h-auto [&_svg]:max-w-full` arbitrary variants, which are acceptable for injected SVG. The `rounded-lg border bg-card p-4` box is a hand-rolled card. |
| D4 | Med | EventLog.svelte:17-33 | Tailwind palette colours (`blue/green/red/amber/purple-400/500/600`, `*-500/10`) instead of tokens. There are no tokens for the design's tone text shades (`#0060DF`, `#248A3D`, `#B25000`), and no `--warning`/amber token. Add tone tokens (dot + text, light and dark) or map them to `--info`, `--success`, `--destructive` and `--primary`/`--primary-subtle-foreground`. "purple" should be `--primary`. |
| D5 | Low | EventLog.svelte:112 | `max-h-[500px]` and `[overflow-anchor:none]` arbitrary values. The `rounded-lg border bg-muted/50 p-4` panel is a hand-rolled card. |
| D6 | Low | EventLog.svelte:150 | `text-green-600` → `text-success` (check contrast, since `--success #28C840` is a dot colour and fails 4.5:1 as text). A text-success token is needed. |
| D7 | Med | QuestionCard.svelte:171,178 | Button colour overrides: `bg-green-600 text-white hover:bg-green-700` and `bg-destructive text-white hover:bg-destructive/90`. |
| D8 | Med | QuestionCard.svelte:197-203 | A hand-rolled native `<input type="radio" class="accent-primary">`. There is no radio-group primitive in `lib/components/ui/` (verified). Add the shadcn-svelte RadioGroup (Bits UI is already a dependency) or use `ToggleGroup`. |
| D9 | Med | QuestionCard.svelte:133,227,229,232 | `border-l-4 border-primary bg-primary/5` (use `bg-primary-subtle`). `border-green-600 bg-green-50 text-green-700 border-green-600/20` are raw palette with no dark variant, so they're light-only. |
| D10 | Low | QuestionCard.svelte:135 | Badge `uppercase`, against sentence case. |
| D11 | Med | GalleryGate.svelte:137-138 | Card reimplemented on a `<label>` (`rounded-lg border bg-card p-4 text-card-foreground`) instead of `Card`. It's intentional, so the whole card toggles, but it duplicates the card styling. |
| D12 | Low | GalleryGate.svelte:153 | Textarea primitive overridden: `min-h-12 resize-y rounded-md px-2 py-2 text-xs md:text-xs`. |
| D13 | Low | GalleryGate.svelte:123 / CandidateGallery.svelte:49 | Arbitrary `grid-cols-[repeat(auto-fill,minmax(260px,1fr))]`, which is duplicated (the design value is 240px). |
| D14 | Low | GalleryGate.svelte:112 | `text-green-700` raw palette. |
| D15 | Med | CandidateCard.svelte:30,43; GalleryGate.svelte:128; DecisionHistory.svelte:53 | Each `Card.Root` overrides `rounded-lg … shadow-none ring-0 border p-4`, cancelling the primitive's `rounded-4xl` (≈15.6px), `shadow-md` and `ring-1` (card.svelte). The Card primitive hasn't been restyled to the boards (10px radius, hairline, `0 1px 3px rgba(0,0,0,.06)`), so every caller patches it locally. Fix the primitive, then remove the overrides. |
| D16 | Med | ScorecardBadges.svelte:34-36,47-49 | `bg-green-100 text-green-700` / `bg-red-100 text-red-700` raw palette (light only). `rounded` overrides the Badge capsule, and `font-semibold` overrides the Badge's 500 weight. The design uses `secondary` + `dot` (the Badge already has a `dot` prop). |
| D17 | Med | DecisionHistory.svelte:56,65 | Badge `rounded font-semibold` override, and `bg-green-100 text-green-700` instead of `variant="outline" dot="var(--success)"`. |
| D18 | Low | DecisionHistory.svelte:75 | `after:content-[':_']` arbitrary value. Just render the colon. |
| D19 | Low | CandidatePreview.svelte:75 | "⟲" text glyph in an icon button. Use a lucide icon (`RotateCcw`), as elsewhere. |
| D20 | Low | CandidatePreview.svelte:64 | `h-[calc(100vh-2rem)]` and `sm:max-w-[calc(100vw-2rem)]` arbitrary values, which are acceptable for a lightbox. Prefer `dvh`. |
| D21 | Low | CandidatePreview.svelte:104 | `bg-white` raw colour on the iframe. It's a deliberate page canvas, so add a comment. |
| D22 | Low | TokenCounter.svelte:40-42; RunMetaList.svelte:14; DecisionHistory.svelte:58; EventLog.svelte:142 | Locale-less `toLocaleString()`/`toLocaleTimeString()` instead of `lib/timeFormat` (en-AU). |
| D23 | Low | App.svelte:204,210,220,225; EventLog.svelte:114; QuestionCard.svelte:131,225 | Heading sizes `text-xl`/`text-base font-semibold` don't follow the 15px/700 section and 11px/600 panel-label scale. There's no shared heading style, so each file restates it. |
| D24 | Low | lib/stepKinds.ts:30-36 | Raw hex for the group colours. This is allowed by SPEC-shell-theme R3 ("use tokens or `stepKinds`"), and the run page doesn't use it yet. |
| D25 | Low | Ellipses: "Aborting..." (RunDetail.svelte:106), "Loading candidates..." (CandidateGallery.svelte:43), "Loading decision history..." (DecisionHistory.svelte:44), "Waiting for events..." (EventLog.svelte:117) | Use "…" as the design does ("Add a Note…"). |

StatusBadge.svelte and runStatus.ts `statusBadge` use tokens correctly (`var(--success)`,
`var(--info)`, `var(--destructive)`, `var(--muted-foreground)`), and they match the design's
badge variants for Completed, Failed and Running. The issue is only the caller (2.5).
