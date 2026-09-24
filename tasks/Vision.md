# Vision: A Semi-Dark Design Factory

*A summary of the concept developed in this conversation — adapting AI "dark factory" pipeline patterns to product design work.*

---

## The starting point: dark factories for code

"Dark factory" pipelines (StrongDM's attractor spec, and implementations like Kilroy, Mammoth, Smasher, and Tracker) run AI coding workflows as DOT graphs — Graphviz's plain-text directed-graph format. A pipeline file describes the workflow as nodes and edges: which steps call an LLM, which are deterministic shell commands, where branches fork, what gates require human sign-off before proceeding.

The appeal of DOT specifically: it's a standard, boring, well-understood format rather than a bespoke DSL; it's declarative (describes the shape of a workflow, not a script); it renders as a diagram for free; and it cleanly separates the pipeline definition (durable, worth sharing) from the engine that runs it (disposable — build it, polish it, throw it away, same as the "dorodango" framing from the original piece).

The purest version of this — Level 5 in Dan Shapiro's automation scale — is lights-off: nobody reviews the code, nobody looks at it. That works because code has a clear, checkable notion of "correct": it compiles, the tests pass, the linter is clean.

## Why design doesn't map onto Level 5

Product and visual design don't have that kind of checkable correctness. Separately, Anshu Chimala's piece on AI design creativity (via Lenny's Newsletter) makes a related but different point: LLMs default to safe, predictable, committee-flattened choices, and getting genuinely distinctive design out of a model requires deliberately pushing it away from its defaults — seed strings for injected randomness, ambitious/specific prompts, a separate "critic" model reviewing screenshots rather than code, image and video generation to add texture code alone can't produce, and a final pass focused on cutting rather than adding.

Two things fall out of combining these:

1. **The Discover → Define → Deliver shape of Chimala's process maps almost directly onto a DOT pipeline's phase structure** — it's the same shape as a multi-phase SDLC graph, just for design exploration instead of code.
2. **But a fully dark version of it would likely reproduce the exact flatness the technique is trying to escape.** An AI critic scoring against "does this look good" is itself a converged, committee-like judgment unless it's given a genuinely concrete, visual bar to score against — and even then, taste and fit-for-purpose are exactly the things a human should still be deciding, not delegating.

## The resolution: semi-dark, not dark

Rather than force design into the lights-off model, or reject the pipeline approach entirely, the concept that emerged is a **semi-dark factory**: most of the pipeline runs unattended — generation, implementation, rendering, deterministic checks, critic passes — but it pauses at defined gates to show a human real candidates and let them choose the next branch. The human isn't reviewing code or approving a diff; they're doing the part only they can do — reacting to options and deciding direction — while the mechanical and evaluative legwork around that decision runs dark.

This reframes the two Chimala techniques that matter most for automation:

- **The seed-string/ambitious-prompt techniques become the dark "Discover" phase** — cheap, parallel, structurally varied candidate generation with no human involvement until candidates exist to react to.
- **The critic-loop technique becomes two parallel critics, not one aesthetic score** — a deterministic design-system check (tokens, component usage) and a task-based usability critic (can a persona actually complete the task), synthesised into a single recommendation that the human then reacts to at a gate. This is closer to Tracker's multi-model cross-critique pattern than to a single "rate 1-10" critic.

## A bias toward real screens, not static designs

A deliberate choice runs through this concept: candidates should be **built as real, working screens — not static mocks in a tool like Figma.** This isn't just a fidelity preference; it changes what the human is actually being asked to judge at each gate.

Interaction pattern is the thing at stake in most of these decisions — drawer vs. modal vs. inline, one navigation model vs. another — and that's fundamentally a behavioural question, not a visual one. Two patterns can look nearly identical as a flat image and feel completely different to use. A static design can't carry that difference; a real, clickable screen can. So instead of the pipeline producing pictures of an interface for a human to imagine using, it produces small, live, running instances of each candidate the human can actually click through.

This is only affordable because candidates are composed from a **shared kit of lightweight, pre-built components** — buttons, inputs, drawers, modals, list rows — rather than the agent reinventing basic UI from scratch on every run. The kit is what makes "build 3-4 real interactive candidates" as cheap and fast as "generate 3-4 static mockups" would otherwise be. It also means design-system conformance (using the kit correctly, respecting existing tokens) can be checked automatically from the very first Discover-phase candidate, not bolted on later — because everything is already real, running code, not a picture of an idea.

The practical consequence: there's effectively no Figma-based or static-mockup stage in this pipeline. Everything a human reacts to at a gate is a real screen, at whatever level of completeness matches that phase — rough and kit-composed at Discover, closer to production at Deliver, but never a picture standing in for a screen.

## Product design vs. marketing design

The Chimala article is explicitly about marketing sites, where boldness and memorability are the point. Applying the same "be bold, break the rules" instruction to core product surfaces — forms, tables, navigation, settings — is actively counterproductive, because those surfaces optimise for consistency and learnability, not delight. The adaptation splits accordingly:

- **Bold visual variety still belongs** in product-adjacent surfaces with low consistency cost: empty states, onboarding, illustrations, error/upgrade screens.
- **Core workflows need variety in interaction pattern and information architecture, not visual skin** — "build 4 distinct, real, working approaches to how bulk-edit works" (inline vs. drawer vs. modal vs. command palette), all composed from the existing kit and design system rather than four different aesthetics.
- **The critic's job for product work is "does it work," not "is it beautiful"** — hence the split into a design-system critic and a usability/task critic, replacing Chimala's single aesthetic scorecard. Because candidates are real and running, the usability critic can genuinely attempt the task against them, not just look at a picture of it.

## Choosing an engine: why Smasher

Of the existing dark-factory implementations, Smasher fits this vision best because it's the only one with a genuine web dashboard and live graph visualisation (Kilroy is CLI-only, Mammoth scope-crept into engine depth with no viewing surface, Tracker has a terminal UI). A semi-dark design factory is only as good as the surface a human reacts to at each gate — and given the bias toward real screens, that surface needs to embed and run live candidates, not just display static images or logs. Smasher's HTMX/SSE dashboard is the closest existing base to extend into that kind of interactive gallery, and it's also the implementation the original article notes actually gets used day-to-day, which matters if this is meant to be a recurring tool rather than a one-off experiment.

## Decisions reached

Working through the open questions from the initial spec surfaced three concrete decisions:

- **Discover-phase candidates are real, lightweight interactive prototypes**, built from a shared component kit — not static mocks and not full production builds. This is what makes the "real screens, not static designs" bias affordable at the exploration stage.
- **The design-system source of truth is code-based** — JSON/CSS tokens in-repo — rather than Figma. This keeps the system-lint check a simple, fast, local script with no external API dependency.
- **Gallery gate candidate counts default by phase** (wider at Discover, narrowing through Define and Deliver) **but are overridable by the designer at runtime**, so a given run can go wider or narrower than the default depending on how much review appetite there is that day.

A second round of review (2026-09-13) resolved the questions this vision had left open, plus several that surfaced later in the gallery-gate spec and plan:

- **The component kit has no fixed completeness bar** — it evolves continuously, gaining components as pipelines demand new patterns, with no milestone that marks it "done."
- **Render and capture preserves a live embeddable build**, not a static screenshot or a recording — candidates are served as real, running builds and embedded on the gallery card so a human can click through them, not just look at a picture of them. Storage is already implemented (`artifact-store`'s `bundle/`); showing it by default in place of the screenshot is `live-preview`'s job — see `capability-map.md`.
- **Timeout-driven gate resolution is dropped** rather than hardened — `human.timeout_secs`/`default_choice` bypasses selection validation today, and rather than validate it, it's being removed until a pipeline actually needs unattended gate resolution.
- **The lint badge stays a dot, expandable to the full violation breakdown** on click/hover, rather than always showing a count.
- **The product-vs-marketing prompt split (above) is phase-based**, not left implicit or pushed onto the pipeline author: Discover/marketing-style surfaces get visual-variety prompts, core-workflow surfaces get interaction-pattern-consistency prompts. Documented as an authoring convention in `smasher-design-factory.md` §3.6 — no code change needed.
- **Prompt/parameter traceability surfaces on hover/expand**, not directly on the candidate card, to keep cards visually clean. Needs a new manifest field to carry the data — folded into `live-preview`'s scope alongside the embed swap, since both touch the same card template.

See `SPEC-gallery-gate.md` and `SPEC-live-preview.md` for implementation status on each.

## What's still open

- Kit growth remains unbounded by design (see above) — there's no remaining decision here, just ongoing work as pipelines demand new components.
- Parallel gates (two gallery questions pending on one run) have no defined behavior beyond "oldest first" — deferred until a pipeline actually needs one (see `SPEC-gallery-gate.md`'s Open Questions).
- Hardcoded dated model strings should eventually move to alias-based resolution, but it's unconfirmed whether the raw Anthropic API accepts aliases — not urgent, no pipeline is blocked on it (see `tasks/archive/plan-gallery-gate.md`'s Open Questions).
