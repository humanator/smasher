// ABOUTME: Public entry point for task_critic + synthesis pipeline tools — a usability
// ABOUTME: critic and a recommendation synthesizer, one real LLM call each, no agent loop.

pub mod backend;
pub mod report;
pub mod synthesis;
pub mod task_critic;

pub use report::{CriticError, CriticReport};
