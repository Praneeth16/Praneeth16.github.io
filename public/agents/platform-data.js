export const stages = [
  {
    verb: 'Run', glyph: 'req', shape: 'a request',
    product: 'AGENT RUNTIME · DATABRICKS APPS',
    title: 'The agent handles a request.',
    body: 'Your harness runs inside the agent server on Databricks Apps. The app’s service principal is the agent’s identity. Supported model and MCP calls can use Unity Gateway, where the platform team configures access and policies.',
    artifact: 'A reply to the customer, and a record of every model and tool call behind it.',
    code: 'agentbricks --profile <profile> deploy support-agent',
    href: 'https://docs.databricks.com/aws/en/agents/deploy/agent-runtime',
  },
  {
    verb: 'Record', glyph: '{ }', shape: 'spans',
    product: 'MLFLOW TRACING · UNITY CATALOG',
    title: 'Each step is written down as a span.',
    body: 'Deploying to Agent Runtime turns on MLflow tracing for the project’s experiment. An agent running somewhere else can export OpenTelemetry spans into the same Unity Catalog tables.',
    artifact: 'Rows in the trace tables, governed like any other table in the catalog.',
    code: '@mlflow.trace(span_type="TOOL")\ndef exchange_items(order_id, item_ids, new_item_ids):\n    ...',
    href: 'https://www.databricks.com/blog/observability-any-agent-anywhere-production-ready-tracing-opentelemetry-unity-catalog',
  },
  {
    verb: 'Query', glyph: 'SQL', shape: 'rows',
    product: 'DATABRICKS SQL · AI FUNCTIONS · GENIE CODE',
    title: 'Ask questions of every trace at once.',
    body: 'Group failures by harness version, join them to the orders table, and let an AI Function label the reason. Databricks SQL can join the governed execution data to application metadata and other tables you have made available.',
    artifact: 'A table of failing traces with a reason column.',
    code: "SELECT trace_id,\n  ai_classify(summary,\n    '[\"wrong_item\", \"missing_argument\", \"other\"]',\n    MAP('version', '2.1')) AS reason\nFROM support.trace_summary;",
    href: 'https://docs.databricks.com/aws/en/large-language-models/ai-functions',
  },
  {
    verb: 'Judge', glyph: '✓', shape: 'test cases',
    product: 'MLFLOW EVALUATION',
    title: 'Turn the failures into a test.',
    body: 'A reviewer confirms the labels. The confirmed traces join an evaluation dataset, and scorers check every new version against it: a code check for the item IDs, an LLM judge for whether the reply matches what the tool did.',
    artifact: 'An evaluation dataset and scorers that can block a release.',
    code: 'mlflow.genai.evaluate(\n    data=exchange_failures,\n    predict_fn=support_agent,\n    scorers=[right_items, reply_matches_tool])',
    href: 'https://docs.databricks.com/aws/en/mlflow3/genai/agent-observability-and-quality',
  },
  {
    verb: 'Train', glyph: 'GPU', shape: 'a checkpoint',
    product: 'AI RUNTIME · NVIDIA NEMO · TRL',
    title: 'Fine-tune an open model on your traces.',
    body: 'Reviewed traces, kept apart from the test set, become a training table. AI Runtime fine-tunes an open model on it with serverless GPUs, reading straight from Unity Catalog. MLflow logs the run, and your logged dataset manifest records which traces the model learned from.',
    artifact: 'A checkpoint or LoRA adapter linked to an MLflow run.',
    code: 'databricks air run --file workload.yaml --watch',
    href: 'https://docs.databricks.com/aws/en/machine-learning/ai-runtime/overview',
  },
  {
    verb: 'Serve', glyph: 'api', shape: 'an endpoint',
    product: 'MODEL SERVING · VLLM',
    title: 'Serve the new version and send it traffic.',
    body: 'Register the model in Unity Catalog and deploy it on a vLLM serving endpoint. The agent calls it on the next request, and the next trace records which version answered. Then the loop starts again.',
    artifact: 'An endpoint version that the next request calls.',
    code: 'mlflow.register_model(\n    model_info.model_uri,\n    "support.models.retail_exchange_8b",\n    env_pack="databricks_model_serving")',
    href: 'https://docs.databricks.com/aws/en/machine-learning/model-serving/serve-custom-llms',
  },
];

export const traceSpans = [
  {depth: 0, name: 'support_agent', detail: 'user: “can I swap the blue one for a medium?”', ms: '3.8 s'},
  {depth: 1, name: 'llm · plan', detail: 'model=hosted · 1,212 tokens in', ms: '0.9 s'},
  {depth: 1, name: 'tool · get_order', detail: 'order_id=#W2378156 → 3 items', ms: '0.2 s'},
  {depth: 1, name: 'ai_search · policies', detail: '“exchange same product, different size” → 3 passages', ms: '0.3 s'},
  {depth: 1, name: 'llm · pick items', detail: 'chose item 3 (black, size S)', ms: '1.1 s', bad: true},
  {depth: 1, name: 'tool · exchange_items', detail: "item_ids=['3'] new_item_ids=['3-M'] → ok", ms: '0.2 s', bad: true},
  {depth: 1, name: 'llm · reply', detail: '“Done! Your exchange is confirmed.”', ms: '1.1 s'},
];

export const capabilities = [
 {id:'context',label:'Context',products:'AI Search · Genie One MCP · sessions · memory',job:'Retrieve documents, query structured data, and recall session or long-term context.',input:'Source tables, indexed documents, analytical questions, and stored memories.',output:'Passages, query results, and recalled context available to the harness.',href:'https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp'},
 {id:'execute',label:'Execution',products:'Agent Bricks · Agent Runtime · Sandbox',job:'Host your agent server and execute the code or tools the harness selects.',input:'Your framework, instructions, tools, and authenticated request.',output:'A running application with session state and model/tool interactions.',href:'https://docs.databricks.com/aws/en/agents/deploy/agent-runtime'},
 {id:'model',label:'Inference',products:'Foundation Model APIs / custom vLLM endpoint',job:'Generate responses and tool calls through a hosted model or your own model service.',input:'Messages, tool schemas, generation settings, and a model target.',output:'A model response from the selected endpoint and model version.',href:'https://docs.databricks.com/aws/en/machine-learning/model-serving/serve-custom-llms'},
 {id:'evaluate',label:'Evaluation',products:'MLflow · Databricks SQL · AI Functions',job:'Inspect traces, analyze collections of runs, curate examples, and compare versions.',input:'Executions, feedback, expected answers, and scorer definitions.',output:'Evaluation results and reviewed datasets for the next iteration.',href:'https://docs.databricks.com/aws/en/mlflow3/genai/agent-observability-and-quality'},
 {id:'adapt',label:'GPU development',products:'AI Runtime · NVIDIA NeMo · MLflow',job:'Test a custom inference environment or train an open model on managed GPUs.',input:'Training data or model weights, a recipe, dependencies, and compute configuration.',output:'A tested environment, checkpoint, or adapter with its experiment record.',href:'https://docs.databricks.com/aws/en/machine-learning/ai-runtime/overview'},
 {id:'govern',label:'Control',products:'Unity Catalog · Unity Gateway · app identity',job:'Manage access to data and supported AI services, and record their usage.',input:'Identities, grants, service policies, limits, and access configuration.',output:'Authorized access and usage records across the configured service paths.',href:'https://docs.databricks.com/aws/en/ai-gateway/'}
];
export const buildPaths = {
 hosted:{label:'Use a hosted model',model:'Foundation Model APIs / supported provider via Unity Gateway',adapt:'No GPU training required for this path.',artifact:'An agent deployment plus its tools, model configuration, and MLflow experiment.',active:['context','execute','model','evaluate','govern']},
 custom:{label:'Serve an open model',model:'Custom Model Serving / your vLLM environment',adapt:'Use AIR to test the GPU inference environment, then package it for serving.',artifact:'An agent deployment plus a separately deployed custom inference endpoint.',active:['context','execute','model','evaluate','adapt','govern']},
 tuned:{label:'Adapt an open model',model:'Custom Model Serving / selected checkpoint or adapter',adapt:'Prepare data, train on AIR, compare in MLflow, then deploy the selected artifact.',artifact:'Training/evaluation manifests, MLflow run, registered artifact, endpoint, and agent release.',active:['context','execute','model','evaluate','adapt','govern']}
};
export const modelRoutes = [
 {label:'Serve Qwen',title:'Qwen3.5-4B: the documented vLLM starter',method:'Online inference',compute:'AIR notebook: A10; AWS serving endpoint: A10G',software:'AI v6 or Standard v6; a tested vLLM command',output:'A custom GPU endpoint with an OpenAI-compatible interface.',body:'Start with the documented notebook. Load the weights, query vLLM on the notebook GPU, register the environment, and create the separate serving endpoint. This example establishes a deployment route, not tool-use accuracy.',code:'Model: Qwen3.5-4B\nDevelop: AIR notebook / A10\nRegister: Unity Catalog + packaged environment\nDeploy: Model Serving / A10G on AWS',href:'https://docs.databricks.com/aws/en/notebooks/source/machine-learning/custom-llm-serving/qwen3-5-4b.html'},
 {label:'Fine-tune Qwen',title:'Qwen3.5-0.8B: supervised training through serving',method:'Full supervised fine-tuning',compute:'Training example: one H100',software:'TRL for training; vLLM for inference',output:'Fine-tuned weights and a separately deployed inference endpoint.',body:'The AIR examples include a notebook that fine-tunes this smaller Qwen checkpoint, compares responses, and serves it through vLLM. It is a concrete starting point for connecting the training and serving parts of the platform.',code:'Training data + base checkpoint\nAIR / TRL / one H100\nMLflow experiment + trained weights\nModel Serving / vLLM',href:'https://docs.databricks.com/aws/en/machine-learning/ai-runtime/examples/gpu-llms'},
 {label:'NVIDIA route',title:'Nemotron: NeMo and NGC on AI Runtime',method:'Model customization using a selected cookbook',compute:'Multi-GPU configurations in the linked Nemotron cookbooks',software:'NVIDIA NeMo Automodel; NGC containers; Artifact Registry',output:'An adapted model artifact tracked with its training experiment.',body:'The NVIDIA integration provides Nemotron 3.5 Lightning and Super VL cookbooks. Bring the matching software environment to AIR and track the experiment in MLflow. Select and validate the inference configuration separately for the resulting checkpoint.',code:'NGC container → Artifact Registry\nNemotron + selected NeMo recipe → AIR\nTraining run → MLflow\nCheckpoint → validated inference deployment',href:'https://www.databricks.com/blog/databricks-ai-runtime-nvidia-train-fine-tune-models'},
 {label:'Serve adapters',title:'One base model, several LoRA adapters',method:'Request-selected adapters in vLLM',compute:'One supported serving GPU; fit depends on the selected model and configuration',software:'Base weights + adapter folders + vLLM LoRA flags',output:'One endpoint that can select a packaged adapter per request.',body:'The custom-serving documentation includes a Qwen3.5-4B LoRA starter. The base weights are loaded once, and requests name the adapter to apply. Keep each adapter’s dataset, evaluation, and release version distinct.',code:'Base model\n  + adapter A\n  + adapter B\n  + tested vLLM LoRA configuration\n= one serving endpoint',href:'https://docs.databricks.com/aws/en/notebooks/source/machine-learning/custom-llm-serving/qwen3-5-4b-lora.html'}
];
