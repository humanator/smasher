#!/bin/sh
# ABOUTME: Stand-in `claude` binary for the test server, so no frontend test can spend LLM tokens
# ABOUTME: Logs each call to $FAKE_CLAUDE_LOG (when set) and fails; an empty log proves zero spend

# Start the server with it, from the repo root:
#   SMASHER_PROVIDER=claude-cli SMASHER_CLAUDE_CLI=frontend/tests/fixtures/fake-claude.sh \
#     FAKE_CLAUDE_LOG=/tmp/fake-claude.log cargo run -p smasher-cli -- serve

if [ -n "$FAKE_CLAUDE_LOG" ]; then
  echo "$(date '+%Y-%m-%dT%H:%M:%S') claude $*" >> "$FAKE_CLAUDE_LOG"
fi
echo "fake-claude: LLM calls are disabled for the frontend tests" >&2
exit 1
