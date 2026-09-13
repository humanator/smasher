// ABOUTME: `smasher prune-artifacts` subcommand: enforces an age/size retention policy
// ABOUTME: over {data_dir}/artifacts/, an operator-run manual counterpart to archive.

use std::path::PathBuf;

use clap::Args;

use smasher_attractor::run_dir::{ArtifactRetentionPolicy, prune_artifacts};

use crate::error::CliError;

/// Prune old run artifacts from a data directory per an age/size retention policy.
#[derive(Debug, Args)]
pub struct PruneArgs {
    /// Data directory containing the artifacts/ tree to prune.
    #[arg(long)]
    pub data_dir: PathBuf,

    /// Remove runs older than this many days.
    #[arg(long)]
    pub max_age_days: Option<u32>,

    /// Remove the oldest runs until the artifacts tree is at or under this size, in MB.
    #[arg(long)]
    pub max_total_mb: Option<u64>,

    /// Report what would be removed without touching disk.
    #[arg(long)]
    pub dry_run: bool,
}

/// Execute the prune-artifacts subcommand.
pub fn run(args: PruneArgs) -> Result<(), CliError> {
    let policy = ArtifactRetentionPolicy {
        max_age: args.max_age_days.map(|d| chrono::Duration::days(d as i64)),
        max_total_bytes: args.max_total_mb.map(|mb| mb * 1024 * 1024),
    };

    let report = prune_artifacts(&args.data_dir, &policy, args.dry_run)?;

    if report.removed_run_ids.is_empty() {
        eprintln!("Nothing to prune.");
    } else {
        let verb = if args.dry_run { "Would remove" } else { "Removed" };
        eprintln!(
            "{verb} {} run(s), reclaiming {} bytes: {}",
            report.removed_run_ids.len(),
            report.bytes_reclaimed,
            report.removed_run_ids.join(", ")
        );
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::Parser;

    #[derive(Debug, Parser)]
    struct TestCli {
        #[command(flatten)]
        prune: PruneArgs,
    }

    #[test]
    fn prune_args_parse_with_defaults() {
        let cli = TestCli::parse_from(["test", "--data-dir", "/tmp/data"]);
        assert_eq!(cli.prune.data_dir, PathBuf::from("/tmp/data"));
        assert!(cli.prune.max_age_days.is_none());
        assert!(cli.prune.max_total_mb.is_none());
        assert!(!cli.prune.dry_run);
    }

    #[test]
    fn prune_args_parse_with_all_flags() {
        let cli = TestCli::parse_from([
            "test",
            "--data-dir",
            "/tmp/data",
            "--max-age-days",
            "30",
            "--max-total-mb",
            "500",
            "--dry-run",
        ]);
        assert_eq!(cli.prune.data_dir, PathBuf::from("/tmp/data"));
        assert_eq!(cli.prune.max_age_days, Some(30));
        assert_eq!(cli.prune.max_total_mb, Some(500));
        assert!(cli.prune.dry_run);
    }

    #[test]
    fn prune_args_requires_data_dir() {
        let result = TestCli::try_parse_from(["test"]);
        assert!(result.is_err());
    }

    #[test]
    fn run_reports_nothing_to_prune_for_empty_data_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let args = PruneArgs {
            data_dir: tmp.path().to_path_buf(),
            max_age_days: Some(30),
            max_total_mb: None,
            dry_run: false,
        };

        assert!(run(args).is_ok());
    }
}
