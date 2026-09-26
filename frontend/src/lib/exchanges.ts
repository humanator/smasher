// ABOUTME: Builds question/answer/reply exchanges from a run's pipeline events
// ABOUTME: Pure function behind the run page's Answered Questions list

import type { PipelineEvent } from './api/events';

export interface Reply {
  nodeId: string;
  text: string;
}

export interface Exchange {
  nodeId: string;
  question: string;
  answer: string | null;
  replies: Reply[];
}

// Each prompt opens an exchange; a response answers the newest unanswered
// exchange for its node. Agent messages belong to the most recent answer,
// until another question is asked. Oldest first.
export function buildExchanges(events: PipelineEvent[]): Exchange[] {
  const exchanges: Exchange[] = [];
  let replyTarget: Exchange | null = null;

  for (const event of events) {
    if (event.kind === 'human_prompt_issued') {
      exchanges.push({ nodeId: event.node_id, question: event.question, answer: null, replies: [] });
      replyTarget = null;
    } else if (event.kind === 'human_response_received') {
      const open = newestUnanswered(exchanges, event.node_id);
      if (open) {
        open.answer = event.response;
        replyTarget = open;
      }
    } else if (event.kind === 'agent_message') {
      replyTarget?.replies.push({ nodeId: event.node_id, text: event.text });
    }
  }

  return exchanges;
}

function newestUnanswered(exchanges: Exchange[], nodeId: string): Exchange | undefined {
  for (let i = exchanges.length - 1; i >= 0; i--) {
    if (exchanges[i].nodeId === nodeId && exchanges[i].answer === null) return exchanges[i];
  }
  return undefined;
}
