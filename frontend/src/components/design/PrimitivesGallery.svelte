<script lang="ts">
  // ABOUTME: Gallery of every restyled primitive in every variant and state, for checking them against the boards
  // ABOUTME: Reached at /design; it uses only the real primitives, so what shows here is what the app uses

  import { Button } from '$lib/components/ui/button/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import * as NativeSelect from '$lib/components/ui/native-select/index.js';
  import { Checkbox } from '$lib/components/ui/checkbox/index.js';
  import { Switch } from '$lib/components/ui/switch/index.js';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
  import * as Accordion from '$lib/components/ui/accordion/index.js';
  import * as Tooltip from '$lib/components/ui/tooltip/index.js';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import * as Drawer from '$lib/components/ui/drawer/index.js';
  import * as Field from '$lib/components/ui/field/index.js';
  import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Label } from '$lib/components/ui/label/index.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { stepKind } from '$lib/stepKinds';

  const buttonVariants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
  const buttonSizes = ['xs', 'sm', 'default', 'lg'] as const;
  const iconSizes = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const;
  const badgeVariants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
  const stepHandlers = [
    'Codergen', 'Manager', 'Tool', 'Interviewer', 'Conditional', 'Parallel', 'FanIn', 'SubPipeline', 'Start', 'Exit',
  ];
  const colourTokens = [
    'background', 'foreground', 'foreground-secondary', 'foreground-control', 'foreground-tertiary',
    'muted', 'muted-foreground', 'sidebar', 'sheet', 'sheet-toolbar', 'tooltip', 'primary',
    'primary-foreground', 'primary-subtle', 'primary-subtle-foreground', 'secondary', 'destructive',
    'destructive-subtle', 'destructive-surface', 'invalid', 'success', 'success-foreground',
    'success-subtle', 'warning', 'warning-foreground', 'info', 'info-foreground', 'neutral', 'border',
    'border-strong', 'separator', 'input', 'ring', 'track', 'field-fill',
  ];
  // Class names are written out in full so Tailwind generates them.
  const typeScale = [
    ['text-caption', '11px', 'Captions, counts, badges, subtitles'],
    ['text-hint', '11.5px', 'Field hints and errors'],
    ['text-small', '12px', 'Descriptions, mono values'],
    ['text-body', '13px', 'Body text, labels, controls'],
    ['text-heading', '15px', 'Toolbar titles, section headings'],
    ['text-display', '20px', 'Hero headings'],
  ] as const;
  const radii = [
    ['rounded-xs', 4], ['rounded-sm', 5], ['rounded-md', 6], ['rounded-track', 7], ['rounded-lg', 8],
    ['rounded-xl', 10], ['rounded-2xl', 12],
  ] as const;
  const shadows = [
    'shadow-push', 'shadow-push-accent', 'shadow-segment', 'shadow-field', 'shadow-check', 'shadow-card',
    'shadow-tooltip', 'shadow-popover', 'shadow-sheet', 'shadow-dialog', 'shadow-window',
  ];

  let checked = $state(true);
  let tabValue = $state('one');
  let lineTabValue = $state('one');
  let toggleValue = $state('a');
  let outlineToggleValue = $state('a');
  let toolbarTabValue = $state('defaults');
  let radioValue = $state('yes');
  let dialogVariant = $state<'sheet' | 'window' | null>(null);
</script>

{#snippet section(name: string, body: import('svelte').Snippet)}
  {@const id = `gallery-${name.toLowerCase().replace(/\s+/g, '-')}`}
  <section aria-labelledby={id} class="grid gap-3 border-b border-border py-6 last:border-b-0">
    <h2 {id} class="m-0 text-heading font-bold">{name}</h2>
    {@render body()}
  </section>
{/snippet}

<div class="mx-auto max-w-5xl px-8 pb-16" data-testid="primitives-gallery">
  <p class="py-4 text-muted-foreground">
    Every primitive in every variant and state, as the app renders them. Switch your system between
    light and dark to check both.
  </p>

  {#snippet colours()}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
      {#each colourTokens as token (token)}
        <div class="grid gap-1 text-caption">
          <div class="h-10 rounded-md border border-border" style:background={`var(--${token})`}></div>
          <code class="font-mono text-muted-foreground">--{token}</code>
        </div>
      {/each}
    </div>
  {/snippet}
  {@render section('Colours', colours)}

  {#snippet type()}
    <div class="grid gap-2">
      {#each typeScale as [cls, size, use] (cls)}
        <div class="flex items-baseline gap-4">
          <code class="w-36 shrink-0 font-mono text-caption text-muted-foreground">{cls} · {size}</code>
          <span class={cls}>{use}</span>
        </div>
      {/each}
    </div>
  {/snippet}
  {@render section('Type', type)}

  {#snippet elevation()}
    <div class="flex flex-wrap gap-3">
      {#each radii as [cls, px] (cls)}
        <div class="grid gap-1 text-caption">
          <div class="size-12 border border-border-strong bg-muted {cls}"></div>
          <code class="font-mono text-muted-foreground">{cls} · {px}px</code>
        </div>
      {/each}
    </div>
    <div class="flex flex-wrap gap-4 pt-2">
      {#each shadows as cls (cls)}
        <div class="grid gap-1 text-caption">
          <div class="bg-control h-10 w-20 rounded-md {cls}"></div>
          <code class="font-mono text-muted-foreground">{cls}</code>
        </div>
      {/each}
    </div>
  {/snippet}
  {@render section('Radius and elevation', elevation)}

  {#snippet steps()}
    <div class="flex flex-wrap gap-2">
      {#each stepHandlers as handler (handler)}
        {@const kind = stepKind(handler)}
        {@const Icon = kind.icon}
        <div class="step-swatch inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-small" style:--ink={kind.ink} style:--tint={kind.tint} style:--ink-dark={kind.inkDark} style:--tint-dark={kind.tintDark}>
          <Icon class="size-[13px]" aria-hidden="true" />
          <span>{kind.plain}</span>
          <code class="font-mono text-caption opacity-70">{kind.tech}</code>
        </div>
      {/each}
    </div>
  {/snippet}
  {@render section('Step kinds', steps)}

  {#snippet buttons()}
    {#each buttonVariants as variant (variant)}
      <div data-testid={`button-row-${variant}`} class="flex flex-wrap items-center gap-2">
        <code class="w-24 font-mono text-caption text-muted-foreground">{variant}</code>
        {#each buttonSizes as size (size)}
          <Button {variant} {size}>{size}</Button>
        {/each}
        {#each iconSizes as size (size)}
          <Button {variant} {size} aria-label={`${variant} ${size}`}><PlusIcon aria-hidden="true" /></Button>
        {/each}
        <Button {variant} disabled>disabled</Button>
      </div>
    {/each}
  {/snippet}
  {@render section('Button', buttons)}

  {#snippet badges()}
    <div class="flex flex-wrap items-center gap-2">
      {#each badgeVariants as variant (variant)}
        <Badge {variant}>{variant}</Badge>
      {/each}
      <Badge variant="secondary" dot="var(--info)">Running</Badge>
      <Badge variant="secondary" dot="var(--success)">Completed</Badge>
      <Badge variant="destructive">Failed</Badge>
      <Badge variant="secondary" dot="var(--foreground-tertiary)">Aborted</Badge>
    </div>
  {/snippet}
  {@render section('Badge', badges)}

  {#snippet inputs()}
    <div class="grid max-w-sm gap-2">
      <Input aria-label="Default field" placeholder="Default" />
      <Input aria-label="Search field" search placeholder="Search" />
      <Input aria-label="Invalid field" aria-invalid="true" value="Invalid" />
      <Input aria-label="Disabled field" disabled value="Disabled" />
      <Input aria-label="Mono field" mono value="mono_value" />
    </div>
  {/snippet}
  {@render section('Input', inputs)}

  {#snippet textareas()}
    <div class="grid max-w-sm gap-2">
      <Textarea aria-label="Default notes" placeholder="Default" />
      <Textarea aria-label="Invalid notes" aria-invalid="true" value="Invalid" />
      <Textarea aria-label="Disabled notes" disabled value="Disabled" />
      <Textarea aria-label="Mono notes" mono value="audience=first-time buyers" />
    </div>
  {/snippet}
  {@render section('Textarea', textareas)}

  {#snippet selects()}
    <div class="grid max-w-sm gap-2">
      <NativeSelect.Root aria-label="Default select">
        <NativeSelect.Option value="a">claude-sonnet</NativeSelect.Option>
        <NativeSelect.Option value="b">claude-opus</NativeSelect.Option>
      </NativeSelect.Root>
      <NativeSelect.Root aria-label="Small select" size="sm">
        <NativeSelect.Option value="a">small</NativeSelect.Option>
      </NativeSelect.Root>
      <NativeSelect.Root aria-label="Invalid select" aria-invalid="true">
        <NativeSelect.Option value="a">invalid</NativeSelect.Option>
      </NativeSelect.Root>
      <NativeSelect.Root aria-label="Disabled select" disabled>
        <NativeSelect.Option value="a">disabled</NativeSelect.Option>
      </NativeSelect.Root>
    </div>
  {/snippet}
  {@render section('Select', selects)}

  {#snippet checkboxes()}
    <div class="flex flex-wrap items-center gap-4">
      <label class="inline-flex items-center gap-2"><Checkbox bind:checked /> Checked</label>
      <label class="inline-flex items-center gap-2"><Checkbox checked={false} /> Unchecked</label>
      <label class="inline-flex items-center gap-2"><Checkbox indeterminate /> Indeterminate</label>
      <label class="inline-flex items-center gap-2"><Checkbox aria-invalid="true" /> Invalid</label>
      <label class="inline-flex items-center gap-2"><Checkbox disabled /> Disabled</label>
    </div>
  {/snippet}
  {@render section('Checkbox', checkboxes)}

  {#snippet switches()}
    <div class="flex flex-wrap items-center gap-4">
      <label class="inline-flex items-center gap-2"><Switch checked /> On</label>
      <label class="inline-flex items-center gap-2"><Switch /> Off</label>
      <label class="inline-flex items-center gap-2"><Switch size="sm" checked /> Small on</label>
      <label class="inline-flex items-center gap-2"><Switch size="sm" /> Small off</label>
      <label class="inline-flex items-center gap-2"><Switch disabled /> Disabled</label>
    </div>
  {/snippet}
  {@render section('Switch', switches)}

  {#snippet tabs()}
    <div class="grid gap-4">
      <Tabs.Root bind:value={tabValue}>
        <Tabs.List>
          <Tabs.Trigger value="one">Settings</Tabs.Trigger>
          <Tabs.Trigger value="two">Help</Tabs.Trigger>
          <Tabs.Trigger value="three">About</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <Tabs.Root bind:value={lineTabValue}>
        <Tabs.List variant="line">
          <Tabs.Trigger value="one">Settings</Tabs.Trigger>
          <Tabs.Trigger value="two">Help</Tabs.Trigger>
          <Tabs.Trigger value="three">About</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <Tabs.Root value="one" class="max-w-sm">
        <Tabs.List fullWidth>
          <Tabs.Trigger value="one">Progress</Tabs.Trigger>
          <Tabs.Trigger value="two">Activity</Tabs.Trigger>
          <Tabs.Trigger value="three">Details</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
      <Tabs.Root bind:value={toolbarTabValue} class="bg-sheet-toolbar w-fit rounded-md p-2">
        <Tabs.List variant="toolbar" aria-label="Toolbar tabs">
          <Tabs.Trigger value="defaults"><PlusIcon strokeWidth={1.7} aria-hidden="true" />Defaults</Tabs.Trigger>
          <Tabs.Trigger value="services"><PlusIcon strokeWidth={1.7} aria-hidden="true" />Services</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
  {/snippet}
  {@render section('Tabs', tabs)}

  {#snippet toggles()}
    <div class="flex flex-wrap items-center gap-4">
      <ToggleGroup.Root type="single" variant="default" bind:value={toggleValue}>
        <ToggleGroup.Item value="a">Key moments</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Everything</ToggleGroup.Item>
      </ToggleGroup.Root>
      <ToggleGroup.Root type="single" variant="outline" bind:value={outlineToggleValue}>
        <ToggleGroup.Item value="a">Key moments</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Everything</ToggleGroup.Item>
      </ToggleGroup.Root>
      <ToggleGroup.Root type="single" variant="default" size="sm" value="a">
        <ToggleGroup.Item value="a">Small</ToggleGroup.Item>
        <ToggleGroup.Item value="b">Small</ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  {/snippet}
  {@render section('Toggle group', toggles)}

  {#snippet accordion()}
    <Accordion.Root type="single" value="one" class="max-w-md">
      <Accordion.Item value="one">
        <Accordion.Trigger>Anthropic</Accordion.Trigger>
        <Accordion.Content>Key saved. Claude models are available.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="two">
        <Accordion.Trigger>OpenAI</Accordion.Trigger>
        <Accordion.Content>No key yet. Add one to use GPT models.</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="three">
        <Accordion.Trigger>Local</Accordion.Trigger>
        <Accordion.Content>Runs on your computer, no key needed.</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  {/snippet}
  {@render section('Accordion', accordion)}

  {#snippet tooltips()}
    <Tooltip.Provider>
      <div class="flex items-center gap-6 pt-10">
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline">Hover or focus me</Button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content>This is a help tag</Tooltip.Content>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  {/snippet}
  {@render section('Tooltip', tooltips)}

  {#snippet popovers()}
    <div class="flex gap-3">
      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline">Open popover</Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content align="start">
          <Popover.Title>Popover</Popover.Title>
          <Popover.Description>Aligned to the start edge, with its arrow.</Popover.Description>
        </Popover.Content>
      </Popover.Root>
      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline">Open popover (end)</Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content align="end">
          <Popover.Title>Popover</Popover.Title>
          <Popover.Description>Aligned to the end edge.</Popover.Description>
        </Popover.Content>
      </Popover.Root>
    </div>
  {/snippet}
  {@render section('Popover', popovers)}

  {#snippet drawers()}
    <div class="flex gap-3">
      <Drawer.Root direction="right">
        <Drawer.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline">Open inspector drawer</Button>
          {/snippet}
        </Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Inspector</Drawer.Title>
            <Drawer.Description>A side panel on the muted surface.</Drawer.Description>
          </Drawer.Header>
        </Drawer.Content>
      </Drawer.Root>
      <Drawer.Root direction="bottom">
        <Drawer.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline">Open sheet drawer</Button>
          {/snippet}
        </Drawer.Trigger>
        <Drawer.Content showClose>
          <Drawer.Header>
            <Drawer.Title>Run details</Drawer.Title>
            <Drawer.Description>Everything about this run, out of the way until you need it.</Drawer.Description>
          </Drawer.Header>
          <Drawer.Footer>
            <Drawer.Close>
              {#snippet child({ props })}<Button {...props} variant="outline">Cancel</Button>{/snippet}
            </Drawer.Close>
            <Drawer.Close>
              {#snippet child({ props })}<Button {...props}>Done</Button>{/snippet}
            </Drawer.Close>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Root>
    </div>
  {/snippet}
  {@render section('Drawer', drawers)}

  {#snippet fields()}
    <div class="grid max-w-sm gap-4">
      <Field.Root>
        <Field.Label for="gallery-brief">Brief</Field.Label>
        <Field.Description id="gallery-brief-hint">A short note on what this run is for.</Field.Description>
        <Input id="gallery-brief" aria-describedby="gallery-brief-hint" placeholder="e.g. Three calmer checkout concepts" />
      </Field.Root>
      <Field.Root>
        <Field.Label for="gallery-vars">Extra values</Field.Label>
        <Field.Description id="gallery-vars-hint">One per line as name=value.</Field.Description>
        <Textarea id="gallery-vars" mono aria-invalid="true" aria-describedby="gallery-vars-hint" value="audience" />
        <Field.Error>Line 1 needs an = sign, like name=value.</Field.Error>
      </Field.Root>
    </div>
  {/snippet}
  {@render section('Field', fields)}

  {#snippet radios()}
    <RadioGroup.Root bind:value={radioValue} aria-label="Approve this design?">
      {#each [['yes', 'Approve'], ['no', 'Reject'], ['off', 'Disabled']] as [value, label] (value)}
        <div class="flex items-center gap-2">
          <RadioGroup.Item {value} id={`gallery-radio-${value}`} disabled={value === 'off'} />
          <Label for={`gallery-radio-${value}`}>{label}</Label>
        </div>
      {/each}
    </RadioGroup.Root>
  {/snippet}
  {@render section('Radio group', radios)}

  {#snippet cards()}
    <div class="grid gap-3 sm:grid-cols-2">
      <Card.Root size="sm">
        <Card.Header><Card.Title>Candidate</Card.Title><Card.Description>Default, sm: white, 12px padding.</Card.Description></Card.Header>
      </Card.Root>
      <Card.Root variant="muted">
        <Card.Header><Card.Title>Step list</Card.Title><Card.Description>Muted surface with a hairline.</Card.Description></Card.Header>
      </Card.Root>
      <Card.Root variant="success">
        <Card.Header><Card.Title>Finished in 10 min 35 s</Card.Title><Card.Description>Success hero.</Card.Description></Card.Header>
      </Card.Root>
      <Card.Root variant="destructive">
        <Card.Header><Card.Title>Check the designs couldn’t finish</Card.Title><Card.Description>Failure hero.</Card.Description></Card.Header>
      </Card.Root>
    </div>
  {/snippet}
  {@render section('Card', cards)}

  {#snippet dialogs()}
    <div class="flex gap-3">
      <Button variant="outline" onclick={() => (dialogVariant = 'sheet')}>Open sheet dialog</Button>
      <Button variant="outline" onclick={() => (dialogVariant = 'window')}>Open window dialog</Button>
    </div>
    <Dialog.Root open={dialogVariant !== null} onOpenChange={(open) => !open && (dialogVariant = null)}>
      <Dialog.Content variant={dialogVariant ?? 'sheet'} showCloseButton={dialogVariant === 'window'}>
        <Dialog.Header class={dialogVariant === 'window' ? 'bg-sheet-toolbar border-b border-border px-4 py-3' : ''}>
          <Dialog.Title>{dialogVariant === 'window' ? 'Settings' : 'Run “Design concepts review”'}</Dialog.Title>
          <Dialog.Description>Everything here is optional.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer class={dialogVariant === 'window' ? 'px-4 pb-4' : ''}>
          <Dialog.Close>
            {#snippet child({ props })}<Button {...props} variant="outline">Cancel</Button>{/snippet}
          </Dialog.Close>
          <Button>Start Run</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  {/snippet}
  {@render section('Dialog', dialogs)}
</div>

<style>
  .step-swatch {
    background: var(--tint);
    color: var(--ink);
  }
  :global(.dark) .step-swatch {
    background: var(--tint-dark);
    color: var(--ink-dark);
  }
</style>
