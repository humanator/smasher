// ABOUTME: Tests for buildExchanges, which pairs each human question with its answer and agent replies
// ABOUTME: Pure function tests over constructed event lists: showcase shape, loops, and unattached messages

import { describe, it, expect } from 'vitest';
import { buildExchanges } from '../../src/lib/exchanges';
import type { PipelineEvent } from '../../src/lib/api/events';

const timestamp = '2026-09-25T00:00:00Z';

function prompt(node_id: string, question: string): PipelineEvent {
  return { kind: 'human_prompt_issued', node_id, question, timestamp };
}

function response(node_id: string, answer: string): PipelineEvent {
  return { kind: 'human_response_received', node_id, response: answer, timestamp };
}

function message(node_id: string, text: string): PipelineEvent {
  return { kind: 'agent_message', node_id, text, timestamp };
}

function nodeCompleted(node_id: string): PipelineEvent {
  return { kind: 'node_completed', node_id, outcome: null, duration_ms: 0, timestamp };
}

describe('buildExchanges', () => {
  it('returns nothing for a run without questions', () => {
    expect(buildExchanges([message('Plan', 'Thinking…'), nodeCompleted('Plan')])).toEqual([]);
  });

  it('opens an unanswered exchange for a prompt', () => {
    expect(buildExchanges([prompt('Gate', 'Approve?')])).toEqual([
      { nodeId: 'Gate', question: 'Approve?', answer: null, replies: [] },
    ]);
  });

  it('maps each showcase reply to its own answer, oldest first', () => {
    const events = [
      prompt('FreeformGate', 'Say something'),
      response('FreeformGate', 'asad'),
      nodeCompleted('FreeformGate'),
      message('EchoFreeform', 'You said: **"asad"**'),
      prompt('BinaryGate', 'Continue?'),
      response('BinaryGate', 'yes'),
      message('YesPath', 'You chose to continue'),
      prompt('MultiChoiceGate', 'Pick a colour'),
      response('MultiChoiceGate', 'blue'),
      message('BluePath', 'Great pick! 💙'),
      prompt('DefaultGate', 'How spicy?'),
      response('DefaultGate', 'So spicy'),
      message('HotPath', 'Respect for your iron stomach'),
      prompt('FinalFreeform', 'Any last words?'),
      response('FinalFreeform', 'adiamo'),
      message('FinalSummary', '# 🎢 The Great Gate Journey: A Recap'),
    ];

    expect(buildExchanges(events)).toEqual([
      {
        nodeId: 'FreeformGate',
        question: 'Say something',
        answer: 'asad',
        replies: [{ nodeId: 'EchoFreeform', text: 'You said: **"asad"**' }],
      },
      {
        nodeId: 'BinaryGate',
        question: 'Continue?',
        answer: 'yes',
        replies: [{ nodeId: 'YesPath', text: 'You chose to continue' }],
      },
      {
        nodeId: 'MultiChoiceGate',
        question: 'Pick a colour',
        answer: 'blue',
        replies: [{ nodeId: 'BluePath', text: 'Great pick! 💙' }],
      },
      {
        nodeId: 'DefaultGate',
        question: 'How spicy?',
        answer: 'So spicy',
        replies: [{ nodeId: 'HotPath', text: 'Respect for your iron stomach' }],
      },
      {
        nodeId: 'FinalFreeform',
        question: 'Any last words?',
        answer: 'adiamo',
        replies: [{ nodeId: 'FinalSummary', text: '# 🎢 The Great Gate Journey: A Recap' }],
      },
    ]);
  });

  it('attaches every message up to the next prompt to the same answer', () => {
    const events = [
      prompt('Gate', 'Go?'),
      response('Gate', 'yes'),
      message('Step1', 'first'),
      message('Step2', 'second'),
    ];

    expect(buildExchanges(events)[0].replies).toEqual([
      { nodeId: 'Step1', text: 'first' },
      { nodeId: 'Step2', text: 'second' },
    ]);
  });

  it('gives a gate re-asked by a loop a separate exchange each time', () => {
    const events = [
      prompt('Review', 'Good enough?'),
      response('Review', 'no'),
      message('Revise', 'Revision one'),
      prompt('Review', 'Good enough?'),
      response('Review', 'yes'),
      message('Ship', 'Shipping it'),
    ];

    expect(buildExchanges(events)).toEqual([
      {
        nodeId: 'Review',
        question: 'Good enough?',
        answer: 'no',
        replies: [{ nodeId: 'Revise', text: 'Revision one' }],
      },
      {
        nodeId: 'Review',
        question: 'Good enough?',
        answer: 'yes',
        replies: [{ nodeId: 'Ship', text: 'Shipping it' }],
      },
    ]);
  });

  it('attaches a message sent before any answer to nothing', () => {
    const events = [message('Plan', 'Before'), prompt('Gate', 'Go?'), response('Gate', 'yes')];

    expect(buildExchanges(events)).toEqual([
      { nodeId: 'Gate', question: 'Go?', answer: 'yes', replies: [] },
    ]);
  });

  it('attaches a message after a new prompt, before its answer, to nothing', () => {
    const events = [
      prompt('First', 'One?'),
      response('First', 'a'),
      prompt('Second', 'Two?'),
      message('Worker', 'While waiting'),
      response('Second', 'b'),
    ];

    expect(buildExchanges(events)).toEqual([
      { nodeId: 'First', question: 'One?', answer: 'a', replies: [] },
      { nodeId: 'Second', question: 'Two?', answer: 'b', replies: [] },
    ]);
  });

  it('answers the newest unanswered exchange for the responding node', () => {
    const events = [
      prompt('Left', 'Left?'),
      prompt('Right', 'Right?'),
      response('Left', 'L'),
      response('Right', 'R'),
      message('After', 'reply'),
    ];

    expect(buildExchanges(events)).toEqual([
      { nodeId: 'Left', question: 'Left?', answer: 'L', replies: [] },
      { nodeId: 'Right', question: 'Right?', answer: 'R', replies: [{ nodeId: 'After', text: 'reply' }] },
    ]);
  });

  it('ignores a response with no matching prompt', () => {
    expect(buildExchanges([response('Gate', 'yes'), message('After', 'reply')])).toEqual([]);
  });
});
