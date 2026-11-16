// ABOUTME: Tests for inspector/RetrySettings.svelte, the More settings group every retrying kind gets
// ABOUTME: Retries, Wait between attempts, Longest wait and Randomise the wait, typed as retry.rs reads them

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import RetrySettings from '../../../../src/components/node-editor/inspector/RetrySettings.svelte';

// retry.rs's RetryPolicy::from_node reads max_retries (or the legacy
// retries) as a Number, retry_delay and max_retry_delay as a Duration (the
// DOT parser turns "1s", "500ms" or "5m" into one), and retry_jitter as a
// Bool that defaults to true.

async function open() {
  await fireEvent.click(screen.getByRole('button', { name: /More settings/ }));
}

describe('RetrySettings', () => {
  it.each([
    ['Codergen', 4],
    ['Manager', 4],
    ['Tool', 4],
    ['Interviewer', 4],
    ['SubPipeline', 4],
    ['Parallel', 4],
    ['FanIn', 4],
  ])('%s gets More settings with %i settings', (handler, count) => {
    render(RetrySettings, { props: { handler, attrs: {}, onChange: vi.fn() } });

    expect(screen.getByRole('button', { name: /More settings/ })).toHaveTextContent(`${count} settings`);
  });

  it.each(['Start', 'Exit', 'Conditional', 'FromTheFuture'])('%s gets no More settings', (handler) => {
    render(RetrySettings, { props: { handler, attrs: {}, onChange: vi.fn() } });

    expect(screen.queryByRole('button', { name: /More settings/ })).toBe(null);
  });

  it('lists the retry fields in order once opened, seeded from attrs', async () => {
    render(RetrySettings, {
      props: {
        handler: 'Codergen',
        attrs: { max_retries: 2, retry_delay: '1s', max_retry_delay: '30s', retry_jitter: false },
        onChange: vi.fn(),
      },
    });
    await open();

    expect(screen.getByRole('textbox', { name: 'Retries' })).toHaveValue('2');
    expect(screen.getByRole('textbox', { name: 'Wait between attempts' })).toHaveValue('1s');
    expect(screen.getByRole('textbox', { name: 'Longest wait' })).toHaveValue('30s');
    expect(screen.getByRole('switch', { name: 'Randomise the wait' })).not.toBeChecked();
    expect(screen.getAllByRole('textbox').map((t) => t.getAttribute('data-testid'))).toEqual([
      'more-max_retries',
      'more-retry_delay',
      'more-max_retry_delay',
    ]);
  });

  it('shows Randomise the wait on when retry_jitter is absent, as the engine defaults it to true', async () => {
    render(RetrySettings, { props: { handler: 'Tool', attrs: {}, onChange: vi.fn() } });
    await open();

    expect(screen.getByTestId('more-retry_jitter')).toBeChecked();
  });

  it('writes Retries to max_retries as a number, and leaves a legacy retries attr alone', async () => {
    const onChange = vi.fn();
    render(RetrySettings, { props: { handler: 'Codergen', attrs: { retries: 3 }, onChange } });
    await open();

    expect(screen.getByTestId('more-max_retries')).toHaveValue('');
    await fireEvent.input(screen.getByTestId('more-max_retries'), { target: { value: '2' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { max_retries: 2 } });

    await fireEvent.input(screen.getByTestId('more-max_retries'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { max_retries: undefined } });
    for (const [patch] of onChange.mock.calls) expect(patch.attrs).not.toHaveProperty('retries');
  });

  it('writes the waits as trimmed text, so the DOT parser reads them as durations', async () => {
    const onChange = vi.fn();
    render(RetrySettings, { props: { handler: 'Manager', attrs: {}, onChange } });
    await open();

    await fireEvent.input(screen.getByTestId('more-retry_delay'), { target: { value: ' 500ms ' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { retry_delay: '500ms' } });

    await fireEvent.input(screen.getByTestId('more-max_retry_delay'), { target: { value: '5m' } });
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { max_retry_delay: '5m' } });
  });

  it('turning Randomise the wait off writes false, and on removes it (the default)', async () => {
    const onChange = vi.fn();
    render(RetrySettings, { props: { handler: 'Codergen', attrs: {}, onChange } });
    await open();

    await fireEvent.click(screen.getByTestId('more-retry_jitter'));
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { retry_jitter: false } });

    await fireEvent.click(screen.getByTestId('more-retry_jitter'));
    expect(onChange).toHaveBeenLastCalledWith({ attrs: { retry_jitter: undefined } });
  });

  it('gives a Tool step the extra note that commands are not retried', async () => {
    render(RetrySettings, { props: { handler: 'Tool', attrs: {}, onChange: vi.fn() } });
    await open();

    await fireEvent.click(screen.getByRole('button', { name: 'More about Retries' }));
    expect(screen.getByText('A shell command that fails is not retried automatically.')).toBeInTheDocument();
  });
});
