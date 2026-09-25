// ABOUTME: Checks that Client::from_env registers the claude-cli provider from SMASHER_CLAUDE_CLI.
// ABOUTME: Lives in its own test binary with one test, because it mutates process env.

use smasher_llm::client::Client;
use smasher_llm::types::Provider;

#[test]
fn smasher_claude_cli_env_var_registers_the_provider() {
    let dir = tempfile::tempdir().unwrap();
    let fake = dir.path().join("claude");
    std::fs::write(&fake, "#!/bin/sh\n").unwrap();

    // SAFETY: this binary has a single test, so no other thread reads env meanwhile.
    unsafe { std::env::set_var("SMASHER_CLAUDE_CLI", &fake) };
    let with = Client::from_env().registered_providers();
    unsafe { std::env::remove_var("SMASHER_CLAUDE_CLI") };
    let without = Client::from_env().registered_providers();

    assert!(with.contains(&Provider::ClaudeCli), "{with:?}");
    assert!(!without.contains(&Provider::ClaudeCli), "{without:?}");
}
