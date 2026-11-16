<script lang="ts">
  // ABOUTME: Settings → Claude CLI: where the claude command is installed (with Detect) and the tools AI Agent steps may use
  // ABOUTME: Edits the dialog's values in place; SettingsDialog runs detection and saves

  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import type { ClaudeCliDetection } from '$lib/native';

  let {
    path = $bindable(),
    allowedTools = $bindable(),
    defaultAllowedTools,
    detection,
    onDetect,
  }: {
    path: string;
    /** One tool per line. */
    allowedTools: string;
    defaultAllowedTools: string[];
    detection: ClaudeCliDetection | null;
    onDetect: () => void;
  } = $props();
</script>

<p class="m-0 text-body text-muted-foreground">
  Run every AI step through the claude command on this Mac, using the account it is signed in to. No API key needed.
</p>

<div class="grid gap-1.5">
  <Label for="settings-claude-cli-path">Where it is installed</Label>
  <div class="flex gap-2">
    <Input
      id="settings-claude-cli-path"
      aria-describedby="settings-claude-cli-path-hint"
      bind:value={path}
      placeholder={detection?.path ? `Find automatically (${detection.path})` : 'Find automatically'}
      autocomplete="off"
      spellcheck={false}
    />
    <Button variant="outline" aria-label="Detect Claude CLI" onclick={onDetect}>Detect</Button>
  </div>
  <p id="settings-claude-cli-path-hint" class="text-xs text-muted-foreground">
    Leave blank and Smasher will find it automatically.
  </p>
  {#if detection}
    <p class="text-xs" aria-live="polite">
      {#if detection.version}
        Found {detection.version}{detection.path ? ` at ${detection.path}` : ''}.
      {:else}
        claude not found. Install Claude Code, or enter where it is installed.
      {/if}
    </p>
  {/if}
</div>

<div class="grid gap-1.5">
  <div class="flex items-center justify-between">
    <Label for="settings-claude-cli-tools">Tools AI Agent steps may use</Label>
    <Button variant="link" size="xs" class="dark:text-primary-subtle-foreground" onclick={() => (allowedTools = defaultAllowedTools.join('\n'))}>
      Reset to Default
    </Button>
  </div>
  <Textarea
    id="settings-claude-cli-tools"
    aria-describedby="settings-claude-cli-tools-hint"
    bind:value={allowedTools}
    rows={4}
    spellcheck={false}
    class="font-mono text-xs"
  />
  <p id="settings-claude-cli-tools-hint" class="text-xs text-muted-foreground">
    One per line, for example <code>Bash(npm run build:*)</code>. AI Agent steps can use only what is listed here.
    Anything else is denied.
  </p>
</div>
