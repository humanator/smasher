// ABOUTME: Standalone CLI for testing capture() outside a full pipeline run.
// ABOUTME: Usage: cargo run -p smasher-render-capture --example capture -- <candidate_dir> <output_dir>

use std::path::PathBuf;

use smasher_render_capture::capture::{VIEWPORT_HEIGHT, VIEWPORT_WIDTH};
use smasher_render_capture::manifest::Viewport;

#[tokio::main]
async fn main() {
    let mut args = std::env::args().skip(1);
    let candidate_dir = PathBuf::from(
        args.next()
            .unwrap_or_else(|| usage_error("missing <candidate_dir>")),
    );
    let output_dir = PathBuf::from(
        args.next()
            .unwrap_or_else(|| usage_error("missing <output_dir>")),
    );

    let viewport = Viewport {
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
    };

    match smasher_render_capture::capture(
        &candidate_dir,
        &output_dir,
        viewport,
        std::collections::BTreeMap::new(),
    )
    .await
    {
        Ok(manifest) => {
            println!(
                "captured {} -> {}",
                candidate_dir.display(),
                output_dir.display()
            );
            println!("{manifest:#?}");
        }
        Err(e) => {
            eprintln!("capture failed: {e}");
            std::process::exit(1);
        }
    }
}

fn usage_error(msg: &str) -> String {
    eprintln!("{msg}");
    eprintln!("usage: capture <candidate_dir> <output_dir>");
    std::process::exit(2);
}
