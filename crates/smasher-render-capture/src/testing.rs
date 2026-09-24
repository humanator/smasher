// ABOUTME: Cross-process lock coordinating tests that launch a real headless
// ABOUTME: browser. Not part of this crate's functional API.

use std::fs::File;

/// Launching more than one real Chrome instance at once is flaky (resource
/// contention, not a code bug) — proven by running this crate's own real-browser
/// tests both serially and concurrently. `cargo test --workspace` runs different
/// crates' test binaries as separate processes, so an in-process lock can't
/// prevent this crate's tests from racing with e.g. `smasher-cli`'s
/// `render_capture` e2e test; a real OS file lock can. Blocks until acquired;
/// releases when the returned `File` is dropped.
pub fn acquire_browser_test_lock() -> File {
    let path = std::env::temp_dir().join("smasher-render-capture-browser-test.lock");
    let file = File::create(&path).expect("should be able to create the browser test lock file");
    file.lock()
        .expect("should be able to acquire the browser test lock");
    file
}
