// ABOUTME: Standalone CLI for testing lint() outside a full pipeline run.
// ABOUTME: Takes a candidate directory, prints the LintReport as pretty JSON.

use std::path::PathBuf;

fn main() {
    let candidate_dir = std::env::args()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            eprintln!("usage: lint <candidate_dir>");
            std::process::exit(2);
        });

    match smasher_system_lint::lint(&candidate_dir) {
        Ok(report) => {
            println!("{}", serde_json::to_string_pretty(&report).unwrap());
            if !report.passed() {
                std::process::exit(1);
            }
        }
        Err(err) => {
            eprintln!("lint failed: {err}");
            std::process::exit(2);
        }
    }
}
