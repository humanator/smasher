// ABOUTME: Crate root for smasher-web, the JSON+SSE pipeline API and static SPA server.
// ABOUTME: Re-exports modules for the web server, SSE bridge, and API routes.

pub mod backend;
pub mod candidates;
pub mod decision_history;
pub mod error;
pub mod rehydrate;
pub mod routes;
pub mod run_launch;
pub mod server;
pub mod sse;
pub mod state;
pub mod workflows;
