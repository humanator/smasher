// ABOUTME: LLM-backed implementation of the ManagerBackend trait.
// ABOUTME: Delegates manager coordination to the agent's LLM session.

use std::sync::Arc;

use serde_json::{Value, json};

use smasher_agent::environment::LocalExecutionEnvironment;
use smasher_agent::events::EventEmitter;
use smasher_agent::session::Session;
use smasher_agent::tools::ToolRegistry;
use smasher_agent::tools::shared::register_shared_tools;
use smasher_agent::types::SessionConfig;

use smasher_attractor::handler::HandlerError;
use smasher_attractor::manager_handler::ManagerBackend;
use smasher_attractor::state::{Context, Outcome};

/// ManagerBackend that sends coordination tasks to an LLM as prompts.
///
/// Each coordination request creates a fresh agent session, sends the task
/// description as user input, and returns the LLM's response as the outcome.
pub struct LlmManagerBackend {
    client: Arc<smasher_llm::client::Client>,
    model: String,
    working_dir: String,
}

impl LlmManagerBackend {
    pub fn new(
        client: Arc<smasher_llm::client::Client>,
        model: String,
        working_dir: String,
    ) -> Self {
        Self {
            client,
            model,
            working_dir,
        }
    }
}

#[async_trait::async_trait]
impl ManagerBackend for LlmManagerBackend {
    async fn coordinate(
        &self,
        task: &str,
        config: &Value,
        context: &Context,
    ) -> Result<Outcome, HandlerError> {
        let context_summary = context.to_string_map();
        let context_parts: Vec<String> = context_summary
            .iter()
            .filter(|(k, _)| !k.starts_with('_'))
            .map(|(k, v)| format!("{k}: {v}"))
            .collect();

        let system_prompt = format!(
            "You are an AI coordinator managing a pipeline step.\n\
             Task: {task}\n\
             Config: {config}\n\
             \n\
             Pipeline context:\n{}\n\
             \n\
             Analyze the task and provide your coordination response. \
             You have tools for reading files, writing files, editing files, \
             running shell commands, grep, and glob.",
            if context_parts.is_empty() {
                "(empty)".to_string()
            } else {
                context_parts.join("\n")
            }
        );

        let env = Arc::new(
            LocalExecutionEnvironment::new(self.working_dir.clone())
                .with_allowed_external_root(smasher_web::server::design_kit_dir()),
        );
        let mut tool_registry = ToolRegistry::new();
        register_shared_tools(&mut tool_registry, env);

        let session_config = SessionConfig::default()
            .with_model(&self.model)
            .with_max_turns(30)
            .with_system_prompt(&system_prompt)
            .with_working_directory(&self.working_dir);

        let emitter = EventEmitter::default();
        let mut session = Session::new(
            session_config,
            Arc::clone(&self.client),
            tool_registry,
            emitter,
        );

        match session.process_input(task).await {
            Ok(output) => {
                let text = output.text.unwrap_or_default();
                Ok(Outcome::success_with(json!({"response": text})))
            }
            Err(e) => Err(HandlerError::Other(format!("Manager session error: {e}"))),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn llm_manager_backend_creation() {
        let client = Arc::new(smasher_llm::client::Client::from_env());
        let backend = LlmManagerBackend::new(client, "test-model".into(), "/tmp".into());
        assert_eq!(backend.model, "test-model");
        assert_eq!(backend.working_dir, "/tmp");
    }
}
