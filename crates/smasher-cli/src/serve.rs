// ABOUTME: CLI subcommand that starts the smasher-web dashboard server.
// ABOUTME: Accepts --port, --model, and --data-dir to configure the web UI.

use std::path::PathBuf;

use clap::Args;
use smasher_web::server::{DEFAULT_PORT, ServerConfig};

use crate::error::CliError;

/// Arguments for the `serve` subcommand.
#[derive(Debug, Args)]
pub struct ServeArgs {
    /// Port to listen on.
    #[arg(long, short, default_value_t = DEFAULT_PORT)]
    pub port: u16,

    /// Default LLM model for pipeline execution.
    #[arg(long, short)]
    pub model: Option<String>,

    /// Provider override for the default model, bypassing model-name-based
    /// inference. Needed for providers whose model names (e.g. Ollama's
    /// `gemma4:31b-cloud`) have no recognizable prefix to infer from.
    #[arg(long)]
    pub provider: Option<String>,

    /// Data directory for run artifacts. Defaults to ~/.smasher.
    #[arg(long)]
    pub data_dir: Option<PathBuf>,

    /// Additional directory to scan for `.dot`/`.gv` workflow files,
    /// repeatable. Replaces the default additional-roots list (not
    /// `{data_dir}/workflows`, which is always scanned regardless).
    #[arg(long = "workflows-dir", value_name = "PATH")]
    pub workflows_dir: Vec<PathBuf>,
}

/// Resolve the configured workflow directories: CLI-provided paths replace
/// the defaults entirely when any are given, otherwise fall back to
/// `defaults`. Pure so it's unit-testable without spawning the server.
fn resolve_workflow_dirs(cli_dirs: &[PathBuf], defaults: Vec<String>) -> Vec<String> {
    if cli_dirs.is_empty() {
        defaults
    } else {
        cli_dirs.iter().map(|p| p.display().to_string()).collect()
    }
}

pub async fn run(args: ServeArgs) -> Result<(), CliError> {
    let defaults = ServerConfig::default();

    let model = args.model.unwrap_or(defaults.model);
    let provider = args.provider.or(defaults.provider);

    let data_dir = match args.data_dir {
        Some(dir) => {
            let dir_str = dir.display().to_string();
            std::path::Path::new(&dir_str)
                .canonicalize()
                .map(|p| p.display().to_string())
                .unwrap_or(dir_str)
        }
        None => defaults.data_dir,
    };

    let workflow_dirs = resolve_workflow_dirs(&args.workflows_dir, defaults.workflow_dirs);

    let config = ServerConfig {
        port: args.port,
        host: defaults.host,
        model,
        provider,
        data_dir,
        workflow_dirs,
    };

    smasher_web::server::run_with_config(config)
        .await
        .map_err(|e| CliError::Web(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_workflow_dirs_falls_back_to_defaults_when_cli_empty() {
        assert_eq!(
            resolve_workflow_dirs(&[], vec!["examples".to_string()]),
            vec!["examples".to_string()]
        );
    }

    #[test]
    fn resolve_workflow_dirs_replaces_defaults_when_cli_provided() {
        let cli_dirs = vec![PathBuf::from("examples"), PathBuf::from("other")];
        assert_eq!(
            resolve_workflow_dirs(&cli_dirs, vec!["default-only".to_string()]),
            vec!["examples".to_string(), "other".to_string()]
        );
    }
}
