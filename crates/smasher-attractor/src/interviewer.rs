// ABOUTME: Human-in-the-loop trait and implementations for pipeline interaction points.
// ABOUTME: Supports auto-approve, queue-based, callback, console, and recording interviewer strategies.

use std::collections::VecDeque;
use std::io::{BufRead, Write};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use serde_json::json;

use crate::graph::{GraphNode, NodeAttrValue, NodeType};
use crate::handler::{Handler, HandlerError};
use crate::state::{Context, Outcome};

/// Context key under which the id of the node currently asking a question is
/// stashed for the duration of a single `Interviewer` call.
///
/// `Interviewer` implementations that need to attribute a question to its
/// originating node (e.g. `HttpInterviewer`, so a dashboard gallery-gate card
/// can be matched to the right pending question) read it via
/// `context.get_string(NODE_ID_CONTEXT_KEY)`. It is set on a scoped copy of
/// the context (see `Context::with_extra`), never on the shared context
/// itself, since concurrent `Parallel` branches hold the same `Context`.
pub const NODE_ID_CONTEXT_KEY: &str = "__question_node_id";

/// Errors that can occur during an interview interaction.
#[derive(Debug, thiserror::Error)]
pub enum InterviewerError {
    #[error("interview cancelled by user")]
    Cancelled,
    #[error("interview timed out")]
    Timeout,
    #[error("interviewer error: {0}")]
    Other(String),
}

/// Abstraction for getting human input during pipeline execution.
#[async_trait::async_trait]
pub trait Interviewer: Send + Sync {
    /// Present a question to the human and get a response.
    async fn ask(&self, question: &str, context: &Context) -> Result<String, InterviewerError>;

    /// Present a question with predefined options.
    async fn ask_with_options(
        &self,
        question: &str,
        options: &[String],
        context: &Context,
    ) -> Result<String, InterviewerError>;

    /// Request approval (yes/no) from the human.
    async fn approve(&self, message: &str, context: &Context) -> Result<bool, InterviewerError>;
}

// ---------------------------------------------------------------------------
// AutoApproveInterviewer
// ---------------------------------------------------------------------------

/// An interviewer that always approves and returns a configurable default response.
pub struct AutoApproveInterviewer {
    default_response: String,
}

impl AutoApproveInterviewer {
    /// Create a new AutoApproveInterviewer with the default response "approved".
    pub fn new() -> Self {
        Self {
            default_response: "approved".to_string(),
        }
    }

    /// Create a new AutoApproveInterviewer with a custom default response.
    pub fn with_response(response: impl Into<String>) -> Self {
        Self {
            default_response: response.into(),
        }
    }
}

impl Default for AutoApproveInterviewer {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl Interviewer for AutoApproveInterviewer {
    async fn ask(&self, _question: &str, _context: &Context) -> Result<String, InterviewerError> {
        Ok(self.default_response.clone())
    }

    async fn ask_with_options(
        &self,
        _question: &str,
        options: &[String],
        _context: &Context,
    ) -> Result<String, InterviewerError> {
        Ok(options
            .first()
            .cloned()
            .unwrap_or_else(|| self.default_response.clone()))
    }

    async fn approve(&self, _message: &str, _context: &Context) -> Result<bool, InterviewerError> {
        Ok(true)
    }
}

// ---------------------------------------------------------------------------
// QueueInterviewer
// ---------------------------------------------------------------------------

/// An interviewer that uses pre-loaded responses from a FIFO queue.
pub struct QueueInterviewer {
    responses: Arc<Mutex<VecDeque<String>>>,
    approvals: Arc<Mutex<VecDeque<bool>>>,
}

impl QueueInterviewer {
    /// Create a new QueueInterviewer with empty queues.
    pub fn new() -> Self {
        Self {
            responses: Arc::new(Mutex::new(VecDeque::new())),
            approvals: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    /// Enqueue a text response.
    pub fn push_response(&self, response: impl Into<String>) {
        let mut queue = self.responses.lock().expect("response queue lock poisoned");
        queue.push_back(response.into());
    }

    /// Enqueue an approval response.
    pub fn push_approval(&self, approved: bool) {
        let mut queue = self.approvals.lock().expect("approval queue lock poisoned");
        queue.push_back(approved);
    }
}

impl Default for QueueInterviewer {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl Interviewer for QueueInterviewer {
    async fn ask(&self, _question: &str, _context: &Context) -> Result<String, InterviewerError> {
        let mut queue = self
            .responses
            .lock()
            .map_err(|e| InterviewerError::Other(format!("lock poisoned: {e}")))?;
        queue
            .pop_front()
            .ok_or_else(|| InterviewerError::Other("response queue is empty".to_string()))
    }

    async fn ask_with_options(
        &self,
        _question: &str,
        _options: &[String],
        _context: &Context,
    ) -> Result<String, InterviewerError> {
        let mut queue = self
            .responses
            .lock()
            .map_err(|e| InterviewerError::Other(format!("lock poisoned: {e}")))?;
        queue
            .pop_front()
            .ok_or_else(|| InterviewerError::Other("response queue is empty".to_string()))
    }

    async fn approve(&self, _message: &str, _context: &Context) -> Result<bool, InterviewerError> {
        let mut queue = self
            .approvals
            .lock()
            .map_err(|e| InterviewerError::Other(format!("lock poisoned: {e}")))?;
        queue
            .pop_front()
            .ok_or_else(|| InterviewerError::Other("approval queue is empty".to_string()))
    }
}

// ---------------------------------------------------------------------------
// CallbackInterviewer
// ---------------------------------------------------------------------------

/// An interviewer that delegates to user-supplied closures.
pub struct CallbackInterviewer {
    ask_fn: Box<dyn Fn(&str) -> String + Send + Sync>,
    approve_fn: Box<dyn Fn(&str) -> bool + Send + Sync>,
}

impl CallbackInterviewer {
    /// Create a new CallbackInterviewer with the given closures.
    pub fn new(
        ask_fn: impl Fn(&str) -> String + Send + Sync + 'static,
        approve_fn: impl Fn(&str) -> bool + Send + Sync + 'static,
    ) -> Self {
        Self {
            ask_fn: Box::new(ask_fn),
            approve_fn: Box::new(approve_fn),
        }
    }
}

#[async_trait::async_trait]
impl Interviewer for CallbackInterviewer {
    async fn ask(&self, question: &str, _context: &Context) -> Result<String, InterviewerError> {
        Ok((self.ask_fn)(question))
    }

    async fn ask_with_options(
        &self,
        question: &str,
        _options: &[String],
        _context: &Context,
    ) -> Result<String, InterviewerError> {
        Ok((self.ask_fn)(question))
    }

    async fn approve(&self, message: &str, _context: &Context) -> Result<bool, InterviewerError> {
        Ok((self.approve_fn)(message))
    }
}

// ---------------------------------------------------------------------------
// ConsoleInterviewer
// ---------------------------------------------------------------------------

/// An interviewer that reads from an input reader and writes to an output writer.
/// Useful for CLI-based human-in-the-loop interaction.
pub struct ConsoleInterviewer {
    input: Arc<Mutex<Box<dyn BufRead + Send>>>,
    output: Arc<Mutex<Box<dyn Write + Send>>>,
}

impl ConsoleInterviewer {
    /// Create a new ConsoleInterviewer with the given input reader and output writer.
    pub fn new(input: impl BufRead + Send + 'static, output: impl Write + Send + 'static) -> Self {
        Self {
            input: Arc::new(Mutex::new(Box::new(input))),
            output: Arc::new(Mutex::new(Box::new(output))),
        }
    }

    /// Create a ConsoleInterviewer that reads from stdin and writes to stderr.
    pub fn from_stdio() -> Self {
        Self::new(std::io::BufReader::new(std::io::stdin()), std::io::stderr())
    }

    /// Write a string to the output and flush it.
    fn write_and_flush(&self, text: &str) -> Result<(), InterviewerError> {
        let mut out = self
            .output
            .lock()
            .map_err(|e| InterviewerError::Other(format!("output lock poisoned: {e}")))?;
        out.write_all(text.as_bytes())
            .map_err(|e| InterviewerError::Other(format!("write error: {e}")))?;
        out.flush()
            .map_err(|e| InterviewerError::Other(format!("flush error: {e}")))?;
        Ok(())
    }

    /// Read a line from the input, trimming the trailing newline.
    fn read_line(&self) -> Result<String, InterviewerError> {
        let mut inp = self
            .input
            .lock()
            .map_err(|e| InterviewerError::Other(format!("input lock poisoned: {e}")))?;
        let mut line = String::new();
        inp.read_line(&mut line)
            .map_err(|e| InterviewerError::Other(format!("read error: {e}")))?;
        Ok(line
            .trim_end_matches('\n')
            .trim_end_matches('\r')
            .to_string())
    }
}

#[async_trait::async_trait]
impl Interviewer for ConsoleInterviewer {
    async fn ask(&self, question: &str, _context: &Context) -> Result<String, InterviewerError> {
        self.write_and_flush(question)?;
        self.read_line()
    }

    async fn ask_with_options(
        &self,
        question: &str,
        options: &[String],
        _context: &Context,
    ) -> Result<String, InterviewerError> {
        let mut prompt = format!("{question}\n");
        for (i, option) in options.iter().enumerate() {
            prompt.push_str(&format!("  {}. {}\n", i + 1, option));
        }
        prompt.push_str("Choice: ");
        self.write_and_flush(&prompt)?;
        let input = self.read_line()?;

        // If the input is a valid number matching an option index, return that option.
        if let Ok(num) = input.trim().parse::<usize>()
            && num >= 1
            && num <= options.len()
        {
            return Ok(options[num - 1].clone());
        }

        // Otherwise return the raw input.
        Ok(input)
    }

    async fn approve(&self, message: &str, _context: &Context) -> Result<bool, InterviewerError> {
        self.write_and_flush(&format!("{message} (yes/no): "))?;
        let input = self.read_line()?;
        let trimmed = input.trim().to_lowercase();
        Ok(trimmed == "yes" || trimmed == "y")
    }
}

// ---------------------------------------------------------------------------
// RecordingInterviewer
// ---------------------------------------------------------------------------

/// The type of interaction that was recorded.
#[derive(Debug, Clone, PartialEq)]
pub enum InteractionType {
    Ask,
    AskWithOptions,
    Approve,
}

/// A single recorded interview interaction.
#[derive(Debug, Clone)]
pub struct InterviewRecord {
    pub question: String,
    pub response: String,
    pub interaction_type: InteractionType,
}

/// Records all questions and responses from a wrapped Interviewer.
pub struct RecordingInterviewer {
    inner: Arc<dyn Interviewer>,
    recordings: Arc<Mutex<Vec<InterviewRecord>>>,
}

impl RecordingInterviewer {
    /// Create a new RecordingInterviewer wrapping the given inner interviewer.
    pub fn new(inner: Arc<dyn Interviewer>) -> Self {
        Self {
            inner,
            recordings: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Return a clone of all recorded interactions.
    pub fn recordings(&self) -> Vec<InterviewRecord> {
        self.recordings
            .lock()
            .expect("recordings lock poisoned")
            .clone()
    }

    /// Return the number of recorded interactions.
    pub fn recording_count(&self) -> usize {
        self.recordings
            .lock()
            .expect("recordings lock poisoned")
            .len()
    }

    /// Clear all recorded interactions.
    pub fn clear(&self) {
        self.recordings
            .lock()
            .expect("recordings lock poisoned")
            .clear();
    }

    /// Record an interaction.
    fn record(&self, question: &str, response: &str, interaction_type: InteractionType) {
        let mut recordings = self.recordings.lock().expect("recordings lock poisoned");
        recordings.push(InterviewRecord {
            question: question.to_string(),
            response: response.to_string(),
            interaction_type,
        });
    }
}

#[async_trait::async_trait]
impl Interviewer for RecordingInterviewer {
    async fn ask(&self, question: &str, context: &Context) -> Result<String, InterviewerError> {
        let response = self.inner.ask(question, context).await?;
        self.record(question, &response, InteractionType::Ask);
        Ok(response)
    }

    async fn ask_with_options(
        &self,
        question: &str,
        options: &[String],
        context: &Context,
    ) -> Result<String, InterviewerError> {
        let response = self
            .inner
            .ask_with_options(question, options, context)
            .await?;
        self.record(question, &response, InteractionType::AskWithOptions);
        Ok(response)
    }

    async fn approve(&self, message: &str, context: &Context) -> Result<bool, InterviewerError> {
        let approved = self.inner.approve(message, context).await?;
        let response = if approved { "yes" } else { "no" };
        self.record(message, response, InteractionType::Approve);
        Ok(approved)
    }
}

// ---------------------------------------------------------------------------
// TimeoutInterviewer
// ---------------------------------------------------------------------------

/// An interviewer wrapper that applies a timeout to the inner interviewer's responses.
///
/// When the inner interviewer does not respond within the configured duration,
/// the wrapper returns a configured default response or an `InterviewerError::Timeout`.
pub struct TimeoutInterviewer {
    inner: Arc<dyn Interviewer>,
    timeout: Duration,
    default_response: Option<String>,
    default_approval: Option<bool>,
}

impl TimeoutInterviewer {
    /// Create a new TimeoutInterviewer wrapping the given inner interviewer.
    pub fn new(inner: Arc<dyn Interviewer>, timeout: Duration) -> Self {
        Self {
            inner,
            timeout,
            default_response: None,
            default_approval: None,
        }
    }

    /// Set the default response to return when `ask` or `ask_with_options` times out.
    pub fn with_default_response(mut self, response: impl Into<String>) -> Self {
        self.default_response = Some(response.into());
        self
    }

    /// Set the default approval to return when `approve` times out.
    pub fn with_default_approval(mut self, approved: bool) -> Self {
        self.default_approval = Some(approved);
        self
    }
}

#[async_trait::async_trait]
impl Interviewer for TimeoutInterviewer {
    async fn ask(&self, question: &str, context: &Context) -> Result<String, InterviewerError> {
        match tokio::time::timeout(self.timeout, self.inner.ask(question, context)).await {
            Ok(result) => result,
            Err(_elapsed) => match &self.default_response {
                Some(default) => Ok(default.clone()),
                None => Err(InterviewerError::Timeout),
            },
        }
    }

    async fn ask_with_options(
        &self,
        question: &str,
        options: &[String],
        context: &Context,
    ) -> Result<String, InterviewerError> {
        match tokio::time::timeout(
            self.timeout,
            self.inner.ask_with_options(question, options, context),
        )
        .await
        {
            Ok(result) => result,
            Err(_elapsed) => match &self.default_response {
                Some(default) => Ok(default.clone()),
                None => Err(InterviewerError::Timeout),
            },
        }
    }

    async fn approve(&self, message: &str, context: &Context) -> Result<bool, InterviewerError> {
        match tokio::time::timeout(self.timeout, self.inner.approve(message, context)).await {
            Ok(result) => result,
            Err(_elapsed) => match self.default_approval {
                Some(default) => Ok(default),
                None => Err(InterviewerError::Timeout),
            },
        }
    }
}

// ---------------------------------------------------------------------------
// ChannelInterviewer
// ---------------------------------------------------------------------------

/// A request sent from the `ChannelInterviewer` to an external consumer (e.g. a TUI).
///
/// Contains the question text and a oneshot sender for the response. The consumer
/// should display the question, collect user input, and send it back through `response_tx`.
pub struct HumanGateRequest {
    /// The question to present to the human operator.
    pub question: String,
    /// Oneshot channel to send the response (or error) back to the waiting interviewer.
    pub response_tx: tokio::sync::oneshot::Sender<Result<String, InterviewerError>>,
}

impl std::fmt::Debug for HumanGateRequest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("HumanGateRequest")
            .field("question", &self.question)
            .finish()
    }
}

/// An interviewer that communicates via async channels, suitable for TUI integration.
///
/// Instead of reading from stdin, it sends questions through an `mpsc` channel and waits
/// for responses via oneshot channels bundled with each request. This allows a TUI (or any
/// other async consumer) to intercept human-in-the-loop prompts and gather responses.
pub struct ChannelInterviewer {
    tx: tokio::sync::mpsc::UnboundedSender<HumanGateRequest>,
}

impl ChannelInterviewer {
    /// Create a new `ChannelInterviewer` and return the receiver for consuming requests.
    pub fn new() -> (Self, tokio::sync::mpsc::UnboundedReceiver<HumanGateRequest>) {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();
        (Self { tx }, rx)
    }

    /// Send a question through the channel and wait for a response.
    async fn send_and_wait(&self, question: &str) -> Result<String, InterviewerError> {
        let (response_tx, response_rx) = tokio::sync::oneshot::channel();
        self.tx
            .send(HumanGateRequest {
                question: question.to_string(),
                response_tx,
            })
            .map_err(|_| InterviewerError::Other("channel closed".into()))?;
        response_rx
            .await
            .map_err(|_| InterviewerError::Other("response channel dropped".into()))?
    }
}

#[async_trait::async_trait]
impl Interviewer for ChannelInterviewer {
    async fn ask(&self, question: &str, _context: &Context) -> Result<String, InterviewerError> {
        self.send_and_wait(question).await
    }

    async fn ask_with_options(
        &self,
        question: &str,
        options: &[String],
        _context: &Context,
    ) -> Result<String, InterviewerError> {
        let formatted = format!("{question}\nOptions: {}", options.join(", "));
        self.send_and_wait(&formatted).await
    }

    async fn approve(&self, message: &str, _context: &Context) -> Result<bool, InterviewerError> {
        let formatted = format!("{message} [y/n]");
        let response = self.send_and_wait(&formatted).await?;
        Ok(matches!(
            response.trim().to_lowercase().as_str(),
            "y" | "yes" | "true" | "1"
        ))
    }
}

// ---------------------------------------------------------------------------
// InterviewerHandler
// ---------------------------------------------------------------------------

/// A Handler that wraps an Interviewer, bridging human-in-the-loop interactions
/// into the pipeline's node execution model.
///
/// Reads the question from the `question` attribute, then `prompt`, then
/// falls back to the node label. Supports `approve` (yes/no) and `options`
/// (predefined choices) modes; otherwise asks a free-form question.
///
/// The free-form path always awaits the interviewer directly, with no
/// timeout or default-choice substitution. A free-form response on a node
/// authored as a gallery gate (`gallery="true"`) is parsed as a structured
/// `{"selected": [...], "decision": "..."}` decision rather than stored as a
/// plain string.
///
/// This is the single handler registered for `NodeType::Interviewer` in
/// production — one handler per node type keeps dispatch unambiguous
/// (`HandlerRegistry` uses the first handler whose `handles()` matches).
pub struct InterviewerHandler {
    interviewer: Arc<dyn Interviewer>,
}

/// Builder for constructing an `InterviewerHandler`.
pub struct InterviewerHandlerBuilder {
    interviewer: Arc<dyn Interviewer>,
}

impl InterviewerHandlerBuilder {
    /// Build the `InterviewerHandler`.
    pub fn build(self) -> InterviewerHandler {
        InterviewerHandler {
            interviewer: self.interviewer,
        }
    }
}

impl InterviewerHandler {
    /// Create a new InterviewerHandler wrapping the given Interviewer.
    pub fn new(interviewer: Arc<dyn Interviewer>) -> Self {
        Self { interviewer }
    }

    /// Return a builder for constructing an InterviewerHandler with optional configuration.
    pub fn builder(interviewer: Arc<dyn Interviewer>) -> InterviewerHandlerBuilder {
        InterviewerHandlerBuilder { interviewer }
    }
}

#[async_trait::async_trait]
impl Handler for InterviewerHandler {
    fn name(&self) -> &str {
        "interviewer"
    }

    async fn execute(&self, node: &GraphNode, context: &Context) -> Result<Outcome, HandlerError> {
        // Determine the question: `question` attr, then `prompt` attr, then label.
        let question = match node.attrs.get("question") {
            Some(NodeAttrValue::String(s)) => s.clone(),
            _ => match node.attrs.get("prompt") {
                Some(NodeAttrValue::String(s)) => s.clone(),
                _ => match &node.label {
                    Some(label) => label.clone(),
                    None => {
                        return Ok(Outcome::failure(
                            "no question or prompt specified for interviewer node",
                        ));
                    }
                },
            },
        };

        // Scoped copy of the context carrying this node's id, so an
        // Interviewer that attributes questions to nodes (e.g. HttpInterviewer)
        // can do so without racing sibling branches under a Parallel node.
        let scoped_context = context.with_extra(NODE_ID_CONTEXT_KEY, json!(node.id));

        // Determine the interaction mode and execute.
        // All modes set `preferred_label` on the outcome to the user's response,
        // enabling edge routing to match the response against outgoing edge labels.
        if let Some(NodeAttrValue::Bool(true)) = node.attrs.get("approve") {
            // Approval mode: yes/no question.
            match self.interviewer.approve(&question, &scoped_context).await {
                Ok(approved) => {
                    let response = if approved { "yes" } else { "no" };
                    context.set(&node.id, json!(response));
                    Ok(Outcome::success_with(json!({"response": response}))
                        .with_preferred_label(response))
                }
                Err(InterviewerError::Cancelled) => Ok(Outcome::skip("interview cancelled")),
                Err(e) => Ok(Outcome::failure(e.to_string())),
            }
        } else if let Some(NodeAttrValue::String(opts_str)) = node.attrs.get("options") {
            // Options mode: present predefined choices.
            let options: Vec<String> = opts_str.split(',').map(|s| s.trim().to_string()).collect();
            match self
                .interviewer
                .ask_with_options(&question, &options, &scoped_context)
                .await
            {
                Ok(response) => {
                    context.set(&node.id, json!(&response));
                    Ok(Outcome::success_with(json!({"response": &response}))
                        .with_preferred_label(&response))
                }
                Err(InterviewerError::Cancelled) => Ok(Outcome::skip("interview cancelled")),
                Err(e) => Ok(Outcome::failure(e.to_string())),
            }
        } else {
            // Free-form question mode, with gallery-gate structured-answer
            // reinterpretation.
            let ask_result = self.interviewer.ask(&question, &scoped_context).await;

            match ask_result {
                Ok(response) => {
                    // Only a gate authored as a gallery gate (`gallery="true"`)
                    // reinterprets its answer as a structured selection — a plain
                    // interviewer whose free-text answer happens to look like that
                    // JSON shape must not have its response silently rewritten.
                    if node.is_gallery_gate()
                        && let Some(gallery) = parse_gallery_answer(&response)
                    {
                        let decision = gallery.decision.trim().to_string();
                        context.set(
                            &node.id,
                            json!({"selected": gallery.selected, "decision": decision}),
                        );
                        return Ok(Outcome::success_with(
                            json!({"selected": gallery.selected, "decision": decision}),
                        )
                        .with_preferred_label(&decision));
                    }
                    context.set(&node.id, json!(&response));
                    Ok(Outcome::success_with(json!({"response": &response}))
                        .with_preferred_label(&response))
                }
                Err(InterviewerError::Cancelled) => Ok(Outcome::skip("interview cancelled")),
                Err(e) => Ok(Outcome::failure(e.to_string())),
            }
        }
    }

    fn handles(&self, node_type: &NodeType) -> bool {
        matches!(node_type, NodeType::Interviewer)
    }
}

// ---------------------------------------------------------------------------
// Gallery gate structured answers
// ---------------------------------------------------------------------------

/// Structured decision posted by the gallery gate dashboard card.
///
/// `selected` holds the chosen candidate ids (possibly empty for reject-all);
/// `decision` names the outgoing edge to follow (e.g. `proceed`, `iterate`).
#[derive(Debug, Clone, PartialEq, serde::Deserialize)]
pub struct GalleryAnswer {
    pub selected: Vec<String>,
    pub decision: String,
}

/// Parse a raw gate answer as a structured gallery decision.
///
/// Returns `None` when the response is not gallery-shaped JSON or when
/// `decision` is blank after trimming, so callers fall through to the
/// legacy plain-string path.
pub fn parse_gallery_answer(response: &str) -> Option<GalleryAnswer> {
    let answer: GalleryAnswer = serde_json::from_str(response).ok()?;
    if answer.decision.trim().is_empty() {
        return None;
    }
    Some(answer)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    // -- Test helpers -------------------------------------------------------

    /// Build a minimal GraphNode with the given type and optional attributes.
    fn make_node(id: &str, node_type: NodeType) -> GraphNode {
        GraphNode {
            id: id.to_string(),
            node_type,
            label: None,
            attrs: HashMap::new(),
        }
    }

    /// Build a GraphNode with a label.
    fn make_node_with_label(id: &str, node_type: NodeType, label: &str) -> GraphNode {
        GraphNode {
            id: id.to_string(),
            node_type,
            label: Some(label.to_string()),
            attrs: HashMap::new(),
        }
    }

    /// An interviewer that records the `NODE_ID_CONTEXT_KEY` value it observes
    /// on each call's `Context`, so tests can assert what a handler threaded
    /// through without depending on `HttpInterviewer`.
    struct NodeIdCapturingInterviewer {
        response: String,
        seen_node_ids: Mutex<Vec<Option<String>>>,
    }

    impl NodeIdCapturingInterviewer {
        fn new(response: impl Into<String>) -> Self {
            Self {
                response: response.into(),
                seen_node_ids: Mutex::new(Vec::new()),
            }
        }

        fn seen_node_ids(&self) -> Vec<Option<String>> {
            self.seen_node_ids.lock().expect("lock poisoned").clone()
        }
    }

    #[async_trait::async_trait]
    impl Interviewer for NodeIdCapturingInterviewer {
        async fn ask(&self, _question: &str, context: &Context) -> Result<String, InterviewerError> {
            self.seen_node_ids
                .lock()
                .expect("lock poisoned")
                .push(context.get_string(NODE_ID_CONTEXT_KEY));
            Ok(self.response.clone())
        }

        async fn ask_with_options(
            &self,
            question: &str,
            _options: &[String],
            context: &Context,
        ) -> Result<String, InterviewerError> {
            self.ask(question, context).await
        }

        async fn approve(
            &self,
            message: &str,
            context: &Context,
        ) -> Result<bool, InterviewerError> {
            Ok(self.ask(message, context).await? == "yes")
        }
    }

    /// An interviewer that always returns Cancelled for all methods.
    struct CancellingInterviewer;

    #[async_trait::async_trait]
    impl Interviewer for CancellingInterviewer {
        async fn ask(
            &self,
            _question: &str,
            _context: &Context,
        ) -> Result<String, InterviewerError> {
            Err(InterviewerError::Cancelled)
        }

        async fn ask_with_options(
            &self,
            _question: &str,
            _options: &[String],
            _context: &Context,
        ) -> Result<String, InterviewerError> {
            Err(InterviewerError::Cancelled)
        }

        async fn approve(
            &self,
            _message: &str,
            _context: &Context,
        ) -> Result<bool, InterviewerError> {
            Err(InterviewerError::Cancelled)
        }
    }

    /// An interviewer that always returns a Timeout error.
    struct TimingOutInterviewer;

    #[async_trait::async_trait]
    impl Interviewer for TimingOutInterviewer {
        async fn ask(
            &self,
            _question: &str,
            _context: &Context,
        ) -> Result<String, InterviewerError> {
            Err(InterviewerError::Timeout)
        }

        async fn ask_with_options(
            &self,
            _question: &str,
            _options: &[String],
            _context: &Context,
        ) -> Result<String, InterviewerError> {
            Err(InterviewerError::Timeout)
        }

        async fn approve(
            &self,
            _message: &str,
            _context: &Context,
        ) -> Result<bool, InterviewerError> {
            Err(InterviewerError::Timeout)
        }
    }

    // ---------------------------------------------------------------
    // AutoApproveInterviewer tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn auto_approve_ask_returns_default_response() {
        let interviewer = AutoApproveInterviewer::new();
        let ctx = Context::new();
        let response = interviewer.ask("What is your name?", &ctx).await.unwrap();
        assert_eq!(response, "approved");
    }

    #[tokio::test]
    async fn auto_approve_with_custom_response() {
        let interviewer = AutoApproveInterviewer::with_response("custom default");
        let ctx = Context::new();
        let response = interviewer.ask("anything?", &ctx).await.unwrap();
        assert_eq!(response, "custom default");
    }

    #[tokio::test]
    async fn auto_approve_ask_with_options_returns_first_option() {
        let interviewer = AutoApproveInterviewer::new();
        let ctx = Context::new();
        let options = vec!["red".to_string(), "blue".to_string(), "green".to_string()];
        let response = interviewer
            .ask_with_options("Pick a color", &options, &ctx)
            .await
            .unwrap();
        assert_eq!(response, "red");
    }

    #[tokio::test]
    async fn auto_approve_ask_with_empty_options_returns_default() {
        let interviewer = AutoApproveInterviewer::with_response("fallback");
        let ctx = Context::new();
        let options: Vec<String> = vec![];
        let response = interviewer
            .ask_with_options("Pick something", &options, &ctx)
            .await
            .unwrap();
        assert_eq!(response, "fallback");
    }

    #[tokio::test]
    async fn auto_approve_approve_returns_true() {
        let interviewer = AutoApproveInterviewer::new();
        let ctx = Context::new();
        let approved = interviewer.approve("Deploy to prod?", &ctx).await.unwrap();
        assert!(approved);
    }

    // ---------------------------------------------------------------
    // QueueInterviewer tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn queue_interviewer_ask_pops_from_queue() {
        let interviewer = QueueInterviewer::new();
        interviewer.push_response("first answer");
        interviewer.push_response("second answer");

        let ctx = Context::new();
        let r1 = interviewer.ask("q1?", &ctx).await.unwrap();
        let r2 = interviewer.ask("q2?", &ctx).await.unwrap();
        assert_eq!(r1, "first answer");
        assert_eq!(r2, "second answer");
    }

    #[tokio::test]
    async fn queue_interviewer_empty_queue_returns_error() {
        let interviewer = QueueInterviewer::new();
        let ctx = Context::new();
        let result = interviewer.ask("question?", &ctx).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("response queue is empty"));
    }

    #[tokio::test]
    async fn queue_interviewer_approval_queue() {
        let interviewer = QueueInterviewer::new();
        interviewer.push_approval(true);
        interviewer.push_approval(false);

        let ctx = Context::new();
        let a1 = interviewer.approve("approve 1?", &ctx).await.unwrap();
        let a2 = interviewer.approve("approve 2?", &ctx).await.unwrap();
        assert!(a1);
        assert!(!a2);
    }

    #[tokio::test]
    async fn queue_interviewer_empty_approval_queue_returns_error() {
        let interviewer = QueueInterviewer::new();
        let ctx = Context::new();
        let result = interviewer.approve("approve?", &ctx).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.to_string().contains("approval queue is empty"));
    }

    #[tokio::test]
    async fn queue_interviewer_ask_with_options_pops_from_responses() {
        let interviewer = QueueInterviewer::new();
        interviewer.push_response("option_b");

        let ctx = Context::new();
        let options = vec!["option_a".to_string(), "option_b".to_string()];
        let response = interviewer
            .ask_with_options("choose?", &options, &ctx)
            .await
            .unwrap();
        assert_eq!(response, "option_b");
    }

    #[tokio::test]
    async fn queue_interviewer_thread_safety() {
        let interviewer = Arc::new(QueueInterviewer::new());

        // Push responses from multiple threads.
        let handles: Vec<_> = (0..10)
            .map(|i| {
                let interviewer = Arc::clone(&interviewer);
                std::thread::spawn(move || {
                    interviewer.push_response(format!("response_{i}"));
                })
            })
            .collect();

        for h in handles {
            h.join().unwrap();
        }

        // All 10 responses should be dequeueable.
        let ctx = Context::new();
        let mut responses = Vec::new();
        for _ in 0..10 {
            responses.push(interviewer.ask("q?", &ctx).await.unwrap());
        }
        assert_eq!(responses.len(), 10);

        // The 11th should fail.
        let result = interviewer.ask("q?", &ctx).await;
        assert!(result.is_err());
    }

    // ---------------------------------------------------------------
    // CallbackInterviewer tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn callback_interviewer_delegates_ask() {
        let interviewer = CallbackInterviewer::new(|q| format!("answer to: {q}"), |_| true);
        let ctx = Context::new();
        let response = interviewer.ask("what?", &ctx).await.unwrap();
        assert_eq!(response, "answer to: what?");
    }

    #[tokio::test]
    async fn callback_interviewer_delegates_approve() {
        let interviewer =
            CallbackInterviewer::new(|_| "yes".to_string(), |msg| msg.contains("deploy"));
        let ctx = Context::new();

        assert!(interviewer.approve("deploy to prod?", &ctx).await.unwrap());
        assert!(
            !interviewer
                .approve("delete everything?", &ctx)
                .await
                .unwrap()
        );
    }

    #[tokio::test]
    async fn callback_interviewer_ask_with_options_delegates_to_ask_fn() {
        let interviewer = CallbackInterviewer::new(|q| format!("chosen for: {q}"), |_| false);
        let ctx = Context::new();
        let options = vec!["a".to_string(), "b".to_string()];
        let response = interviewer
            .ask_with_options("pick?", &options, &ctx)
            .await
            .unwrap();
        assert_eq!(response, "chosen for: pick?");
    }

    // ---------------------------------------------------------------
    // InterviewerHandler tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn handler_with_question_attribute() {
        let interviewer = Arc::new(AutoApproveInterviewer::new());
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("iv1", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("What is your favorite color?".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data),
                preferred_label,
                ..
            } => {
                assert_eq!(data["response"], "approved");
                // preferred_label is set to the response for edge routing
                assert_eq!(preferred_label.as_deref(), Some("approved"));
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn handler_sets_preferred_label_for_edge_routing() {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response("Yes");
        let handler = InterviewerHandler::new(queue);

        let node = make_node_with_label("gate", NodeType::Interviewer, "Continue?");

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        assert_eq!(result.preferred_label(), Some("Yes"));
    }

    #[tokio::test]
    async fn handler_with_label_fallback() {
        let interviewer = Arc::new(AutoApproveInterviewer::with_response("yes please"));
        let handler = InterviewerHandler::new(interviewer);

        let node = make_node_with_label("iv2", NodeType::Interviewer, "Do you agree?");

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "yes please");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn handler_no_question_or_label_returns_failure() {
        let interviewer = Arc::new(AutoApproveInterviewer::new());
        let handler = InterviewerHandler::new(interviewer);

        let node = make_node("iv_nq", NodeType::Interviewer);

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_failure());
        match result {
            Outcome::Failure { error, .. } => {
                assert!(error.contains("no question or prompt specified"));
            }
            other => panic!("expected failure, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn handler_with_options_attribute() {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response("blue");
        let handler = InterviewerHandler::new(queue);

        let mut node = make_node("iv3", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Pick a color".to_string()),
        );
        node.attrs.insert(
            "options".to_string(),
            NodeAttrValue::String("red, blue, green".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "blue");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn handler_with_approve_attribute() {
        let interviewer = Arc::new(AutoApproveInterviewer::new());
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("iv4", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Deploy to production?".to_string()),
        );
        node.attrs
            .insert("approve".to_string(), NodeAttrValue::Bool(true));

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "yes");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn handler_stores_response_in_context() {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response("user input here");
        let handler = InterviewerHandler::new(queue);

        let mut node = make_node("iv5", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Tell me something".to_string()),
        );

        let ctx = Context::new();
        handler.execute(&node, &ctx).await.unwrap();

        let stored = ctx.get_string("iv5");
        assert_eq!(stored, Some("user input here".to_string()));
    }

    #[tokio::test]
    async fn handler_approve_stores_response_in_context() {
        let interviewer = Arc::new(AutoApproveInterviewer::new());
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("iv_app", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Approve?".to_string()),
        );
        node.attrs
            .insert("approve".to_string(), NodeAttrValue::Bool(true));

        let ctx = Context::new();
        handler.execute(&node, &ctx).await.unwrap();

        let stored = ctx.get_string("iv_app");
        assert_eq!(stored, Some("yes".to_string()));
    }

    #[tokio::test]
    async fn handler_cancelled_returns_skip() {
        let interviewer = Arc::new(CancellingInterviewer);
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("iv6", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Continue?".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        match result {
            Outcome::Skip { reason, .. } => {
                assert_eq!(reason, "interview cancelled");
            }
            other => panic!("expected skip, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn handler_timeout_returns_failure() {
        let interviewer = Arc::new(TimingOutInterviewer);
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("iv_to", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Waiting...".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_failure());
        match result {
            Outcome::Failure { error, .. } => {
                assert!(error.contains("timed out"));
            }
            other => panic!("expected failure, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn handler_handles_only_interviewer_nodes() {
        let interviewer = Arc::new(AutoApproveInterviewer::new());
        let handler = InterviewerHandler::new(interviewer);

        assert!(handler.handles(&NodeType::Interviewer));
        assert!(!handler.handles(&NodeType::Start));
        assert!(!handler.handles(&NodeType::Exit));
        assert!(!handler.handles(&NodeType::Codergen));
        assert!(!handler.handles(&NodeType::Conditional));
        assert!(!handler.handles(&NodeType::Tool));
        assert!(!handler.handles(&NodeType::Parallel));
        assert!(!handler.handles(&NodeType::Manager));
        assert!(!handler.handles(&NodeType::Generic));
    }

    #[test]
    fn handler_name_is_interviewer() {
        let interviewer = Arc::new(AutoApproveInterviewer::new());
        let handler = InterviewerHandler::new(interviewer);
        assert_eq!(handler.name(), "interviewer");
    }

    // ---------------------------------------------------------------
    // InterviewerError display formatting
    // ---------------------------------------------------------------

    #[test]
    fn interviewer_error_display_cancelled() {
        let err = InterviewerError::Cancelled;
        assert_eq!(err.to_string(), "interview cancelled by user");
    }

    #[test]
    fn interviewer_error_display_timeout() {
        let err = InterviewerError::Timeout;
        assert_eq!(err.to_string(), "interview timed out");
    }

    #[test]
    fn interviewer_error_display_other() {
        let err = InterviewerError::Other("custom problem".to_string());
        assert_eq!(err.to_string(), "interviewer error: custom problem");
    }

    // ---------------------------------------------------------------
    // Cancelled in options mode returns skip
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn handler_cancelled_with_options_returns_skip() {
        let interviewer = Arc::new(CancellingInterviewer);
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("iv7", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Pick one".to_string()),
        );
        node.attrs.insert(
            "options".to_string(),
            NodeAttrValue::String("a, b, c".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        match result {
            Outcome::Skip { reason, .. } => {
                assert_eq!(reason, "interview cancelled");
            }
            other => panic!("expected skip, got {other:?}"),
        }
    }

    // ---------------------------------------------------------------
    // Cancelled in approve mode returns skip
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn handler_cancelled_approve_returns_skip() {
        let interviewer = Arc::new(CancellingInterviewer);
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("iv8", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Approve?".to_string()),
        );
        node.attrs
            .insert("approve".to_string(), NodeAttrValue::Bool(true));

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        match result {
            Outcome::Skip { reason, .. } => {
                assert_eq!(reason, "interview cancelled");
            }
            other => panic!("expected skip, got {other:?}"),
        }
    }

    // ---------------------------------------------------------------
    // ConsoleInterviewer tests
    // ---------------------------------------------------------------

    /// A shared buffer for capturing output in tests.
    #[derive(Clone)]
    struct SharedBuffer {
        inner: Arc<Mutex<Vec<u8>>>,
    }

    impl SharedBuffer {
        fn new() -> Self {
            Self {
                inner: Arc::new(Mutex::new(Vec::new())),
            }
        }

        fn contents(&self) -> String {
            let buf = self.inner.lock().unwrap();
            String::from_utf8(buf.clone()).unwrap()
        }
    }

    impl std::io::Write for SharedBuffer {
        fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
            let mut inner = self.inner.lock().unwrap();
            inner.extend_from_slice(buf);
            Ok(buf.len())
        }

        fn flush(&mut self) -> std::io::Result<()> {
            Ok(())
        }
    }

    #[tokio::test]
    async fn console_ask_writes_question_and_reads_response() {
        let input = std::io::Cursor::new(b"hello world\n".to_vec());
        let output = SharedBuffer::new();
        let output_clone = output.clone();
        let interviewer = ConsoleInterviewer::new(input, output);

        let ctx = Context::new();
        let response = interviewer.ask("What is your name? ", &ctx).await.unwrap();
        assert_eq!(response, "hello world");

        // Verify the question was written to output.
        let written = output_clone.contents();
        assert!(written.contains("What is your name?"));
    }

    #[tokio::test]
    async fn console_ask_with_options_displays_numbered_options() {
        // User types "2" to select the second option.
        let input = std::io::Cursor::new(b"2\n".to_vec());
        let output = SharedBuffer::new();
        let output_clone = output.clone();
        let interviewer = ConsoleInterviewer::new(input, output);

        let ctx = Context::new();
        let options = vec!["red".to_string(), "blue".to_string(), "green".to_string()];
        let response = interviewer
            .ask_with_options("Pick a color", &options, &ctx)
            .await
            .unwrap();
        assert_eq!(response, "blue");

        // Verify the options were displayed with numbers.
        let written = output_clone.contents();
        assert!(written.contains("1. red"));
        assert!(written.contains("2. blue"));
        assert!(written.contains("3. green"));
    }

    #[tokio::test]
    async fn console_approve_yes_returns_true() {
        let input = std::io::Cursor::new(b"yes\n".to_vec());
        let output = SharedBuffer::new();
        let output_clone = output.clone();
        let interviewer = ConsoleInterviewer::new(input, output);

        let ctx = Context::new();
        let approved = interviewer.approve("Deploy?", &ctx).await.unwrap();
        assert!(approved);

        // Verify the prompt was written.
        let written = output_clone.contents();
        assert!(written.contains("Deploy? (yes/no): "));
    }

    #[tokio::test]
    async fn console_approve_no_returns_false() {
        let input = std::io::Cursor::new(b"no\n".to_vec());
        let output = SharedBuffer::new();
        let interviewer = ConsoleInterviewer::new(input, output);

        let ctx = Context::new();
        let approved = interviewer.approve("Deploy?", &ctx).await.unwrap();
        assert!(!approved);
    }

    #[tokio::test]
    async fn console_approve_case_insensitive() {
        // "YES" should be treated as approval.
        let input = std::io::Cursor::new(b"YES\n".to_vec());
        let output = SharedBuffer::new();
        let interviewer = ConsoleInterviewer::new(input, output);

        let ctx = Context::new();
        let approved = interviewer.approve("Continue?", &ctx).await.unwrap();
        assert!(approved);

        // "Y" should also be treated as approval.
        let input2 = std::io::Cursor::new(b"Y\n".to_vec());
        let output2 = SharedBuffer::new();
        let interviewer2 = ConsoleInterviewer::new(input2, output2);
        let approved2 = interviewer2.approve("Continue?", &ctx).await.unwrap();
        assert!(approved2);

        // "No" should be treated as rejection.
        let input3 = std::io::Cursor::new(b"No\n".to_vec());
        let output3 = SharedBuffer::new();
        let interviewer3 = ConsoleInterviewer::new(input3, output3);
        let approved3 = interviewer3.approve("Continue?", &ctx).await.unwrap();
        assert!(!approved3);
    }

    // ---------------------------------------------------------------
    // RecordingInterviewer tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn recording_captures_ask_interaction() {
        let inner = Arc::new(AutoApproveInterviewer::with_response("42"));
        let recorder = RecordingInterviewer::new(inner);

        let ctx = Context::new();
        let response = recorder.ask("What is the answer?", &ctx).await.unwrap();
        assert_eq!(response, "42");

        let recordings = recorder.recordings();
        assert_eq!(recordings.len(), 1);
        assert_eq!(recordings[0].question, "What is the answer?");
        assert_eq!(recordings[0].response, "42");
        assert_eq!(recordings[0].interaction_type, InteractionType::Ask);
    }

    #[tokio::test]
    async fn recording_captures_approve_interaction() {
        let inner = Arc::new(AutoApproveInterviewer::new());
        let recorder = RecordingInterviewer::new(inner);

        let ctx = Context::new();
        let approved = recorder.approve("Deploy to prod?", &ctx).await.unwrap();
        assert!(approved);

        let recordings = recorder.recordings();
        assert_eq!(recordings.len(), 1);
        assert_eq!(recordings[0].question, "Deploy to prod?");
        assert_eq!(recordings[0].response, "yes");
        assert_eq!(recordings[0].interaction_type, InteractionType::Approve);
    }

    #[tokio::test]
    async fn recording_captures_ask_with_options() {
        let inner = Arc::new(AutoApproveInterviewer::new());
        let recorder = RecordingInterviewer::new(inner);

        let ctx = Context::new();
        let options = vec!["alpha".to_string(), "beta".to_string()];
        let response = recorder
            .ask_with_options("Choose:", &options, &ctx)
            .await
            .unwrap();
        assert_eq!(response, "alpha");

        let recordings = recorder.recordings();
        assert_eq!(recordings.len(), 1);
        assert_eq!(recordings[0].question, "Choose:");
        assert_eq!(recordings[0].response, "alpha");
        assert_eq!(
            recordings[0].interaction_type,
            InteractionType::AskWithOptions
        );
    }

    #[tokio::test]
    async fn recording_count_tracks_interactions() {
        let inner = Arc::new(AutoApproveInterviewer::new());
        let recorder = RecordingInterviewer::new(inner);

        let ctx = Context::new();
        assert_eq!(recorder.recording_count(), 0);

        recorder.ask("q1?", &ctx).await.unwrap();
        assert_eq!(recorder.recording_count(), 1);

        recorder.approve("approve?", &ctx).await.unwrap();
        assert_eq!(recorder.recording_count(), 2);

        recorder
            .ask_with_options("pick?", &["a".to_string()], &ctx)
            .await
            .unwrap();
        assert_eq!(recorder.recording_count(), 3);
    }

    #[tokio::test]
    async fn recording_clear_removes_all_records() {
        let inner = Arc::new(AutoApproveInterviewer::new());
        let recorder = RecordingInterviewer::new(inner);

        let ctx = Context::new();
        recorder.ask("q1?", &ctx).await.unwrap();
        recorder.ask("q2?", &ctx).await.unwrap();
        assert_eq!(recorder.recording_count(), 2);

        recorder.clear();
        assert_eq!(recorder.recording_count(), 0);
        assert!(recorder.recordings().is_empty());
    }

    #[tokio::test]
    async fn recording_delegates_to_inner() {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response("specific answer");
        queue.push_approval(false);

        let recorder = RecordingInterviewer::new(queue);

        let ctx = Context::new();

        // Verify the inner interviewer's behavior is preserved.
        let response = recorder.ask("question?", &ctx).await.unwrap();
        assert_eq!(response, "specific answer");

        let approved = recorder.approve("approve?", &ctx).await.unwrap();
        assert!(!approved);

        // Verify recordings captured the inner results.
        let recordings = recorder.recordings();
        assert_eq!(recordings.len(), 2);
        assert_eq!(recordings[0].response, "specific answer");
        assert_eq!(recordings[1].response, "no");
        assert_eq!(recordings[1].interaction_type, InteractionType::Approve);
    }

    // ---------------------------------------------------------------
    // InterviewerHandler: question/prompt/label fallback chain
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn interviewer_handler_falls_back_to_prompt_attribute() {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response("go ahead");
        let handler = InterviewerHandler::new(queue);

        let mut node = make_node("gate2", NodeType::Interviewer);
        node.attrs.insert(
            "prompt".to_string(),
            NodeAttrValue::String("Ready to deploy?".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "go ahead");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn interviewer_handler_question_takes_priority_over_prompt() {
        let callback = Arc::new(CallbackInterviewer::new(
            |q| format!("answer to: {q}"),
            |_| true,
        ));
        let handler = InterviewerHandler::new(callback);

        let mut node = make_node("gate_prio", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("question attr".to_string()),
        );
        node.attrs.insert(
            "prompt".to_string(),
            NodeAttrValue::String("prompt attr".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "answer to: question attr");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn interviewer_handler_prompt_takes_priority_over_label() {
        let callback = Arc::new(CallbackInterviewer::new(
            |q| format!("answer to: {q}"),
            |_| true,
        ));
        let handler = InterviewerHandler::new(callback);

        let mut node = make_node_with_label("gate_label", NodeType::Interviewer, "label question");
        node.attrs.insert(
            "prompt".to_string(),
            NodeAttrValue::String("prompt question".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "answer to: prompt question");
            }
            other => panic!("expected success with data, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn interviewer_handler_does_not_store_on_cancel() {
        let interviewer = Arc::new(CancellingInterviewer);
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("gate_no_store", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Continue?".to_string()),
        );

        let ctx = Context::new();
        handler.execute(&node, &ctx).await.unwrap();

        // No response should be stored when cancelled
        assert!(ctx.get("gate_no_store").is_none());
    }

    #[tokio::test]
    async fn interviewer_handler_does_not_store_on_error() {
        let interviewer = Arc::new(TimingOutInterviewer);
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("gate_no_store_err", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Waiting...".to_string()),
        );

        let ctx = Context::new();
        handler.execute(&node, &ctx).await.unwrap();

        // No response should be stored when there's an error
        assert!(ctx.get("gate_no_store_err").is_none());
    }

    // ---------------------------------------------------------------
    // SlowInterviewer test helper
    // ---------------------------------------------------------------

    /// An interviewer that sleeps for a configurable duration before responding.
    /// Used to test timeout behavior with real async delays.
    struct SlowInterviewer {
        delay: Duration,
        response: String,
        approval: bool,
    }

    impl SlowInterviewer {
        fn new(delay: Duration) -> Self {
            Self {
                delay,
                response: "slow response".to_string(),
                approval: true,
            }
        }

        fn with_response(mut self, response: impl Into<String>) -> Self {
            self.response = response.into();
            self
        }

        fn with_approval(mut self, approval: bool) -> Self {
            self.approval = approval;
            self
        }
    }

    #[async_trait::async_trait]
    impl Interviewer for SlowInterviewer {
        async fn ask(
            &self,
            _question: &str,
            _context: &Context,
        ) -> Result<String, InterviewerError> {
            tokio::time::sleep(self.delay).await;
            Ok(self.response.clone())
        }

        async fn ask_with_options(
            &self,
            _question: &str,
            _options: &[String],
            _context: &Context,
        ) -> Result<String, InterviewerError> {
            tokio::time::sleep(self.delay).await;
            Ok(self.response.clone())
        }

        async fn approve(
            &self,
            _message: &str,
            _context: &Context,
        ) -> Result<bool, InterviewerError> {
            tokio::time::sleep(self.delay).await;
            Ok(self.approval)
        }
    }

    // ---------------------------------------------------------------
    // TimeoutInterviewer tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn timeout_interviewer_returns_inner_response_when_fast_enough() {
        let inner = Arc::new(QueueInterviewer::new());
        inner.push_response("fast answer");
        let timeout_iv = TimeoutInterviewer::new(inner, Duration::from_secs(5));

        let ctx = Context::new();
        let response = timeout_iv.ask("question?", &ctx).await.unwrap();
        assert_eq!(response, "fast answer");
    }

    #[tokio::test]
    async fn timeout_interviewer_ask_times_out_with_no_default() {
        let inner = Arc::new(SlowInterviewer::new(Duration::from_millis(100)));
        let timeout_iv = TimeoutInterviewer::new(inner, Duration::from_millis(5));

        let ctx = Context::new();
        let result = timeout_iv.ask("question?", &ctx).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("timed out"));
    }

    #[tokio::test]
    async fn timeout_interviewer_ask_returns_default_on_timeout() {
        let inner = Arc::new(SlowInterviewer::new(Duration::from_millis(100)));
        let timeout_iv = TimeoutInterviewer::new(inner, Duration::from_millis(5))
            .with_default_response("fallback");

        let ctx = Context::new();
        let response = timeout_iv.ask("question?", &ctx).await.unwrap();
        assert_eq!(response, "fallback");
    }

    #[tokio::test]
    async fn timeout_interviewer_ask_with_options_times_out_with_no_default() {
        let inner = Arc::new(SlowInterviewer::new(Duration::from_millis(100)));
        let timeout_iv = TimeoutInterviewer::new(inner, Duration::from_millis(5));

        let ctx = Context::new();
        let options = vec!["a".to_string(), "b".to_string()];
        let result = timeout_iv.ask_with_options("pick?", &options, &ctx).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("timed out"));
    }

    #[tokio::test]
    async fn timeout_interviewer_ask_with_options_returns_default_on_timeout() {
        let inner = Arc::new(SlowInterviewer::new(Duration::from_millis(100)));
        let timeout_iv = TimeoutInterviewer::new(inner, Duration::from_millis(5))
            .with_default_response("option_b");

        let ctx = Context::new();
        let options = vec!["option_a".to_string(), "option_b".to_string()];
        let response = timeout_iv
            .ask_with_options("pick?", &options, &ctx)
            .await
            .unwrap();
        assert_eq!(response, "option_b");
    }

    #[tokio::test]
    async fn timeout_interviewer_approve_times_out_with_no_default() {
        let inner = Arc::new(SlowInterviewer::new(Duration::from_millis(100)));
        let timeout_iv = TimeoutInterviewer::new(inner, Duration::from_millis(5));

        let ctx = Context::new();
        let result = timeout_iv.approve("approve?", &ctx).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("timed out"));
    }

    #[tokio::test]
    async fn timeout_interviewer_approve_returns_default_on_timeout() {
        let inner = Arc::new(SlowInterviewer::new(Duration::from_millis(100)));
        let timeout_iv =
            TimeoutInterviewer::new(inner, Duration::from_millis(5)).with_default_approval(false);

        let ctx = Context::new();
        let approved = timeout_iv.approve("deploy?", &ctx).await.unwrap();
        assert!(!approved);
    }

    #[tokio::test]
    async fn timeout_interviewer_approve_returns_inner_when_fast_enough() {
        let inner = Arc::new(QueueInterviewer::new());
        inner.push_approval(true);
        let timeout_iv =
            TimeoutInterviewer::new(inner, Duration::from_secs(5)).with_default_approval(false);

        let ctx = Context::new();
        let approved = timeout_iv.approve("deploy?", &ctx).await.unwrap();
        // Should return the inner's true, not the default false
        assert!(approved);
    }

    #[tokio::test]
    async fn timeout_interviewer_with_slow_approval() {
        let inner = Arc::new(SlowInterviewer::new(Duration::from_millis(100)).with_approval(false));
        let timeout_iv =
            TimeoutInterviewer::new(inner, Duration::from_millis(5)).with_default_approval(true);

        let ctx = Context::new();
        // Should time out and return the default approval (true), not inner's false
        let approved = timeout_iv.approve("deploy?", &ctx).await.unwrap();
        assert!(approved);
    }

    #[tokio::test]
    async fn timeout_interviewer_with_slow_queue_that_never_responds() {
        // QueueInterviewer with empty queue returns an error immediately, not a timeout.
        // Using SlowInterviewer to simulate a truly slow response.
        let inner = Arc::new(
            SlowInterviewer::new(Duration::from_millis(200)).with_response("eventual answer"),
        );
        let timeout_iv = TimeoutInterviewer::new(inner, Duration::from_millis(5))
            .with_default_response("timed out default");

        let ctx = Context::new();
        let response = timeout_iv.ask("question?", &ctx).await.unwrap();
        assert_eq!(response, "timed out default");
    }

    // ---------------------------------------------------------------
    // InterviewerHandler tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn human_gate_builder_creates_basic_handler() {
        let interviewer = Arc::new(AutoApproveInterviewer::new());
        let handler = InterviewerHandler::builder(interviewer).build();
        assert_eq!(handler.name(), "interviewer");

        // Should behave identically to InterviewerHandler::new()
        let mut node = make_node("gate_basic", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Q?".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
    }

    #[tokio::test]
    async fn human_gate_no_timeout_does_not_time_out() {
        // No timeout mechanism exists at all: even a slow interviewer is awaited to completion.
        let slow = Arc::new(SlowInterviewer::new(Duration::from_millis(10)));
        let handler = InterviewerHandler::new(slow);

        let mut node = make_node("gate_no_to", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Patient question?".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "slow response");
            }
            other => panic!("expected success, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn human_gate_ignores_legacy_timeout_and_default_choice_attrs() {
        // human.timeout_secs / human.default_choice are no longer read at all —
        // a node carrying them behaves identically to one without them.
        let interviewer = Arc::new(QueueInterviewer::new());
        interviewer.push_response("real answer");
        let handler = InterviewerHandler::new(interviewer);

        let mut node = make_node("gate_legacy_attrs", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Continue?".to_string()),
        );
        node.attrs
            .insert("human.timeout_secs".to_string(), NodeAttrValue::Number(1.0));
        node.attrs.insert(
            "human.default_choice".to_string(),
            NodeAttrValue::String("should-be-ignored".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        match result {
            Outcome::Success {
                data: Some(data), ..
            } => {
                assert_eq!(data["response"], "real answer");
                assert!(data.get("defaulted").is_none());
            }
            other => panic!("expected success with real response, got {other:?}"),
        }

        let stored = ctx.get_string("gate_legacy_attrs");
        assert_eq!(stored, Some("real answer".to_string()));
    }

    // ---------------------------------------------------------------
    // ChannelInterviewer tests
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn channel_interviewer_ask_succeeds() {
        let (interviewer, mut rx) = ChannelInterviewer::new();
        let ctx = Context::new();

        let ask_handle =
            tokio::spawn(async move { interviewer.ask("What do you think?", &ctx).await });

        let req = rx.recv().await.unwrap();
        assert_eq!(req.question, "What do you think?");
        req.response_tx.send(Ok("Looks good!".into())).unwrap();

        let result = ask_handle.await.unwrap();
        assert_eq!(result.unwrap(), "Looks good!");
    }

    #[tokio::test]
    async fn channel_interviewer_ask_propagates_error() {
        let (interviewer, mut rx) = ChannelInterviewer::new();
        let ctx = Context::new();

        let ask_handle = tokio::spawn(async move { interviewer.ask("Proceed?", &ctx).await });

        let req = rx.recv().await.unwrap();
        req.response_tx
            .send(Err(InterviewerError::Cancelled))
            .unwrap();

        let result = ask_handle.await.unwrap();
        assert!(matches!(result, Err(InterviewerError::Cancelled)));
    }

    #[tokio::test]
    async fn channel_interviewer_ask_with_options_formats_question() {
        let (interviewer, mut rx) = ChannelInterviewer::new();
        let ctx = Context::new();
        let options = vec!["red".to_string(), "blue".to_string()];

        let ask_handle = tokio::spawn(async move {
            interviewer
                .ask_with_options("Pick a color", &options, &ctx)
                .await
        });

        let req = rx.recv().await.unwrap();
        assert!(req.question.contains("Pick a color"));
        assert!(req.question.contains("red, blue"));
        req.response_tx.send(Ok("red".into())).unwrap();

        let result = ask_handle.await.unwrap();
        assert_eq!(result.unwrap(), "red");
    }

    #[tokio::test]
    async fn channel_interviewer_approve_yes() {
        let (interviewer, mut rx) = ChannelInterviewer::new();
        let ctx = Context::new();

        let ask_handle = tokio::spawn(async move { interviewer.approve("Deploy?", &ctx).await });

        let req = rx.recv().await.unwrap();
        assert!(req.question.contains("Deploy?"));
        assert!(req.question.contains("[y/n]"));
        req.response_tx.send(Ok("yes".into())).unwrap();

        let result = ask_handle.await.unwrap();
        assert!(result.unwrap());
    }

    #[tokio::test]
    async fn channel_interviewer_approve_no() {
        let (interviewer, mut rx) = ChannelInterviewer::new();
        let ctx = Context::new();

        let ask_handle = tokio::spawn(async move { interviewer.approve("Deploy?", &ctx).await });

        let req = rx.recv().await.unwrap();
        req.response_tx.send(Ok("no".into())).unwrap();

        let result = ask_handle.await.unwrap();
        assert!(!result.unwrap());
    }

    #[tokio::test]
    async fn channel_interviewer_closed_channel_returns_error() {
        let (interviewer, rx) = ChannelInterviewer::new();
        let ctx = Context::new();

        // Drop the receiver — channel is closed.
        drop(rx);

        let result = interviewer.ask("Hello?", &ctx).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("channel closed"));
    }

    #[tokio::test]
    async fn channel_interviewer_dropped_response_returns_error() {
        let (interviewer, mut rx) = ChannelInterviewer::new();
        let ctx = Context::new();

        let ask_handle = tokio::spawn(async move { interviewer.ask("Hello?", &ctx).await });

        let req = rx.recv().await.unwrap();
        // Drop the response sender without sending a response.
        drop(req.response_tx);

        let result = ask_handle.await.unwrap();
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .to_string()
                .contains("response channel dropped")
        );
    }

    // ---------------------------------------------------------------
    // Gallery gate structured-answer tests (Task 1)
    // ---------------------------------------------------------------

    #[test]
    fn parse_gallery_answer_accepts_structured_decision() {
        let parsed = super::parse_gallery_answer(r#"{"selected":["a"],"decision":"proceed"}"#);
        assert!(parsed.is_some());
        let answer = parsed.unwrap();
        assert_eq!(answer.selected, vec!["a".to_string()]);
        assert_eq!(answer.decision, "proceed");
    }

    #[test]
    fn parse_gallery_answer_rejects_empty_object() {
        assert!(super::parse_gallery_answer("{}").is_none());
    }

    #[test]
    fn parse_gallery_answer_rejects_blank_decision() {
        assert!(super::parse_gallery_answer(r#"{"selected":[],"decision":"  "}"#).is_none());
    }

    #[tokio::test]
    async fn human_gate_stores_structured_gallery_answer_as_object() {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response(r#"{"selected":["a","b"],"decision":"proceed"}"#);
        let handler = InterviewerHandler::new(queue);

        let mut node = make_node("gallery1", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Pick direction(s)".to_string()),
        );
        node.attrs
            .insert("gallery".to_string(), NodeAttrValue::Bool(true));

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        assert_eq!(result.preferred_label(), Some("proceed"));

        let stored = ctx.get("gallery1").expect("context holds gallery decision");
        assert_eq!(stored["selected"], json!(["a", "b"]));
        assert_eq!(stored["decision"], json!("proceed"));
    }

    #[tokio::test]
    async fn human_gate_legacy_plain_answer_unchanged() {
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response("yes");
        let handler = InterviewerHandler::new(queue);

        let mut node = make_node("legacy1", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Continue?".to_string()),
        );

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        assert_eq!(result.preferred_label(), Some("yes"));

        let stored = ctx.get_string("legacy1");
        assert_eq!(stored, Some("yes".to_string()));
    }

    #[tokio::test]
    async fn human_gate_without_gallery_attr_does_not_reinterpret_json_shaped_answer() {
        // A plain (non-gallery) human gate whose free-text answer happens to
        // deserialize into the gallery JSON shape must be stored verbatim,
        // not silently reinterpreted as a structured gallery decision.
        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response(r#"{"selected":["a","b"],"decision":"proceed"}"#);
        let handler = InterviewerHandler::new(queue);

        let mut node = make_node("plain-gate", NodeType::Interviewer);
        node.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Paste the JSON".to_string()),
        );
        // Deliberately no `gallery` attr.

        let ctx = Context::new();
        let result = handler.execute(&node, &ctx).await.unwrap();
        assert!(result.is_success());
        assert_eq!(
            result.preferred_label(),
            Some(r#"{"selected":["a","b"],"decision":"proceed"}"#)
        );

        let stored = ctx.get_string("plain-gate");
        assert_eq!(
            stored,
            Some(r#"{"selected":["a","b"],"decision":"proceed"}"#.to_string())
        );
    }

    /// Regression guard for a production bug: `InterviewerHandler` and a
    /// since-removed `HumanGateHandler` both registered unconditionally for
    /// `NodeType::Interviewer`, and `HandlerRegistry` dispatches to whichever
    /// registered first — so the gallery-answer branch (tested above by
    /// calling `.execute()` directly on the handler) was silently dead code
    /// in every real `smasher run`/`smasher serve` pipeline: a gallery
    /// decision of `{"selected":[...],"decision":"proceed"}` got treated as a
    /// literal free-text answer by whichever handler won, `preferred_label`
    /// matching then failed against both edge labels, and edge selection fell
    /// through to its alphabetical tiebreak instead of routing to `proceed`.
    ///
    /// This drives the exact same path production wiring does: build a
    /// `HandlerRegistry` with the one handler registered for
    /// `NodeType::Interviewer`, dispatch through `registry.execute()` (not
    /// the handler directly), then feed the resulting `Outcome` through
    /// `select_edge` and assert it lands on the edge the decision named.
    #[tokio::test]
    async fn registry_dispatch_routes_gallery_decision_to_the_named_edge() {
        use crate::edge::select_edge;
        use crate::graph::{Graph, GraphEdge};
        use crate::handler::HandlerRegistry;
        use std::collections::HashMap as Map;

        let queue = Arc::new(QueueInterviewer::new());
        queue.push_response(r#"{"selected":["a"],"decision":"proceed"}"#);

        let mut registry = HandlerRegistry::new();
        registry.register(Arc::new(InterviewerHandler::new(queue)));

        let mut gate = make_node("Gate1", NodeType::Interviewer);
        gate.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("Pick direction(s)".to_string()),
        );
        gate.attrs
            .insert("gallery".to_string(), NodeAttrValue::Bool(true));

        let graph = Graph {
            name: None,
            nodes: vec![gate.clone()],
            edges: vec![
                GraphEdge {
                    from: "Gate1".into(),
                    to: "Proceed".into(),
                    label: Some("proceed".into()),
                    condition: None,
                    priority: None,
                    loop_restart: false,
                    attrs: Map::new(),
                },
                GraphEdge {
                    from: "Gate1".into(),
                    to: "Iterate".into(),
                    label: Some("iterate".into()),
                    condition: None,
                    priority: None,
                    loop_restart: false,
                    attrs: Map::new(),
                },
            ],
            default_node_attrs: Map::new(),
            default_edge_attrs: Map::new(),
            graph_attrs: Map::new(),
        };

        let ctx = Context::new();
        let outcome = registry.execute(&gate, &ctx).await.unwrap();
        assert_eq!(outcome.preferred_label(), Some("proceed"));

        let edge = select_edge(&graph, "Gate1", &ctx, Some(&outcome))
            .unwrap()
            .expect("an edge should be selected");
        assert_eq!(edge.to, "Proceed", "must route to the decided edge, not fall through to the alphabetical tiebreak");
    }

    // ---------------------------------------------------------------
    // Node id threading (Context::with_extra / NODE_ID_CONTEXT_KEY)
    // ---------------------------------------------------------------

    #[tokio::test]
    async fn interviewer_handler_passes_node_id_via_scoped_context() {
        let interviewer = Arc::new(NodeIdCapturingInterviewer::new("yes"));
        let handler = InterviewerHandler::new(interviewer.clone());

        let node = make_node_with_label("gate-b", NodeType::Interviewer, "Continue?");

        let ctx = Context::new();
        handler.execute(&node, &ctx).await.unwrap();

        assert_eq!(
            interviewer.seen_node_ids(),
            vec![Some("gate-b".to_string())]
        );
        assert_eq!(ctx.get_string(NODE_ID_CONTEXT_KEY), None);
    }

    #[tokio::test]
    async fn concurrent_human_gates_do_not_cross_attribute_node_ids() {
        // Regression for the Parallel fan-out bug: two InterviewerHandler nodes
        // sharing the same Context and running concurrently must each see
        // their own node id, never each other's.
        let interviewer = Arc::new(NodeIdCapturingInterviewer::new("yes"));
        let handler_a = InterviewerHandler::new(interviewer.clone());
        let handler_b = InterviewerHandler::new(interviewer.clone());

        let mut node_a = make_node("gate-a", NodeType::Interviewer);
        node_a.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("A?".to_string()),
        );
        let mut node_b = make_node("gate-b", NodeType::Interviewer);
        node_b.attrs.insert(
            "question".to_string(),
            NodeAttrValue::String("B?".to_string()),
        );

        let ctx = Context::new();
        let (_, _) = tokio::join!(
            handler_a.execute(&node_a, &ctx),
            handler_b.execute(&node_b, &ctx),
        );

        let mut seen = interviewer.seen_node_ids();
        seen.sort();
        assert_eq!(seen, vec![Some("gate-a".to_string()), Some("gate-b".to_string())]);
    }
}
