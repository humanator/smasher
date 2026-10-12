// ABOUTME: Proves a tool node's own `model`/`provider` attrs reach task_critic and synthesis.
// ABOUTME: A recording provider stands in for the LLM, so no tokens are spent.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use async_trait::async_trait;
use serde_json::Value;
use smasher_attractor::graph::{GraphNode, NodeAttrValue, NodeType};
use smasher_attractor::handler::{Handler, HandlerError};
use smasher_attractor::state::{Context, Outcome};
use smasher_attractor::tool_handler::{ToolBackend, ToolHandler};
use smasher_llm::client::Client;
use smasher_llm::provider::{ProviderAdapter, StreamResponse};
use smasher_llm::types::{ContentPart, Error, FinishReason, Provider, Request, Response, Usage};
use smasher_task_critic_synthesis::{synthesis::run_synthesis, task_critic::run_task_critic};

const SERVER_DEFAULT_MODEL: &str = "gemini-2.5-flash";

/// Records `(adapter name, model)` for every request and answers with canned JSON that
/// satisfies both the critic and the synthesis parsers.
struct Recorder {
    name: &'static str,
    seen: Arc<Mutex<Vec<(String, String)>>>,
}

#[async_trait]
impl ProviderAdapter for Recorder {
    fn provider_name(&self) -> &str {
        self.name
    }

    async fn complete(&self, request: &Request) -> Result<Response, Error> {
        self.seen
            .lock()
            .unwrap()
            .push((self.name.to_string(), request.model.clone()));
        let body = r#"{"success": true, "friction": [], "notes": "ok",
                       "recommendation": "proceed", "reasons": ["ok"]}"#;
        Ok(Response {
            id: "r".into(),
            model: request.model.clone(),
            content: vec![ContentPart::text(body)],
            finish_reason: Some(FinishReason::Stop),
            usage: Usage::default(),
            warnings: vec![],
            rate_limit: None,
            provider: None,
            raw: None,
        })
    }

    async fn stream(&self, _request: &Request) -> Result<StreamResponse, Error> {
        Err(Error::Other {
            message: "streaming not used".into(),
            retryable: false,
        })
    }
}

/// The two tools wired the way `TaskCriticSynthesisToolBackend` wires them, but with the
/// recording client injected.
struct RecordingBackend {
    client: Client,
    dir: PathBuf,
}

#[async_trait]
impl ToolBackend for RecordingBackend {
    async fn execute_tool(
        &self,
        tool_name: &str,
        args: &Value,
        _context: &Context,
    ) -> Result<Outcome, HandlerError> {
        let result = match tool_name {
            "task_critic" => {
                run_task_critic(&self.client, SERVER_DEFAULT_MODEL, None, &self.dir, args)
                    .await
                    .map(|_| ())
            }
            "synthesis" => run_synthesis(&self.client, SERVER_DEFAULT_MODEL, None, &self.dir, args)
                .await
                .map(|_| ()),
            other => panic!("unexpected tool {other}"),
        };
        Ok(match result {
            Ok(()) => Outcome::success(),
            Err(e) => Outcome::failure(e.to_string()),
        })
    }

    fn available_tools(&self) -> Vec<String> {
        vec!["task_critic".into(), "synthesis".into()]
    }
}

struct Harness {
    handler: ToolHandler,
    seen: Arc<Mutex<Vec<(String, String)>>>,
    _dir: tempfile::TempDir,
}

fn harness() -> Harness {
    let seen = Arc::new(Mutex::new(Vec::new()));
    let mut client = Client::new();
    for (provider, name) in [(Provider::Ollama, "ollama"), (Provider::Gemini, "gemini")] {
        client.register_provider(
            provider,
            Arc::new(Recorder {
                name,
                seen: seen.clone(),
            }),
        );
    }

    let dir = tempfile::tempdir().unwrap();
    let fixtures = Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures");
    std::fs::copy(
        fixtures.join("candidate/screenshot.png"),
        dir.path().join("screenshot.png"),
    )
    .unwrap();
    for report in ["lint-report.json", "critic-report.json"] {
        std::fs::copy(
            fixtures.join("reports/agreeing").join(report),
            dir.path().join(report),
        )
        .unwrap();
    }

    let backend = RecordingBackend {
        client,
        dir: dir.path().to_path_buf(),
    };
    Harness {
        handler: ToolHandler::new(Arc::new(backend)),
        seen,
        _dir: dir,
    }
}

fn tool_node(tool: &str, attrs: &[(&str, &str)]) -> GraphNode {
    let mut map: HashMap<String, NodeAttrValue> = HashMap::new();
    map.insert("tool".into(), NodeAttrValue::String(tool.into()));
    map.insert(
        "args".into(),
        NodeAttrValue::String(
            r#"{"candidate_id": "c1", "persona": "new user", "task": "find settings"}"#.into(),
        ),
    );
    for (k, v) in attrs {
        map.insert((*k).into(), NodeAttrValue::String((*v).into()));
    }
    GraphNode {
        id: tool.into(),
        node_type: NodeType::Tool,
        label: None,
        attrs: map,
    }
}

async fn run(harness: &Harness, node: &GraphNode) {
    let outcome = harness
        .handler
        .execute(node, &Context::new())
        .await
        .expect("handler runs");
    assert!(outcome.is_success(), "{outcome:?}");
}

#[tokio::test]
async fn critic_and_synthesis_nodes_each_send_their_own_provider_and_model() {
    let h = harness();

    run(
        &h,
        &tool_node(
            "task_critic",
            &[("provider", "ollama"), ("model", "gemma4:31b-cloud")],
        ),
    )
    .await;
    run(
        &h,
        &tool_node(
            "synthesis",
            &[("provider", "gemini"), ("model", "gemini-2.5-pro")],
        ),
    )
    .await;

    assert_eq!(
        *h.seen.lock().unwrap(),
        [
            ("ollama".to_string(), "gemma4:31b-cloud".to_string()),
            ("gemini".to_string(), "gemini-2.5-pro".to_string()),
        ]
    );
}

#[tokio::test]
async fn nodes_without_attrs_use_the_server_default() {
    let h = harness();

    run(&h, &tool_node("task_critic", &[])).await;
    run(&h, &tool_node("synthesis", &[])).await;

    assert_eq!(
        *h.seen.lock().unwrap(),
        [
            ("gemini".to_string(), SERVER_DEFAULT_MODEL.to_string()),
            ("gemini".to_string(), SERVER_DEFAULT_MODEL.to_string()),
        ]
    );
}

#[tokio::test]
async fn a_model_only_node_overrides_just_the_model() {
    let h = harness();

    run(&h, &tool_node("synthesis", &[("model", "gemini-2.5-pro")])).await;

    assert_eq!(
        *h.seen.lock().unwrap(),
        [("gemini".to_string(), "gemini-2.5-pro".to_string())]
    );
}
