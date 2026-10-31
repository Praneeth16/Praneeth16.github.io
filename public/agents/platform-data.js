export const platformData = {
  "layers": [
    {
      "id": "context",
      "name": "Context & tools",
      "products": "AI Search · Genie One MCP",
      "body": "Retrieve documents from an index that syncs with source tables, ask governed analytical questions through Genie, and expose application actions as tools. The agent can work with both text and structured data.",
      "artifact": "A retrieved passage, SQL result, or tool response enters the agent context.",
      "href": "https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp"
    },
    {
      "id": "runtime",
      "name": "Agent execution",
      "products": "Agent Bricks · Agent Runtime",
      "body": "Deploy your own framework or harness. Agent Runtime hosts the agent server on Databricks Apps, with an authenticated endpoint and an application identity. DurableAgentServer supplies persistent run state and recovery.",
      "artifact": "A running application records model calls, tool calls, and session state.",
      "href": "https://docs.databricks.com/aws/en/agents/deploy/agent-runtime"
    },
    {
      "id": "memory",
      "name": "State & memory",
      "products": "Agent sessions · Lakebase-backed memory",
      "body": "Keep conversation history in sessions and durable knowledge in managed memory stores. Memory can be written explicitly or distilled through a memory pipeline. Access is controlled at the store boundary.",
      "artifact": "Session history and recalled memory are inputs to a later request.",
      "href": "https://docs.databricks.com/aws/en/agents/agent-memory/managed-memory"
    },
    {
      "id": "gateway",
      "name": "Model access",
      "products": "Unity Gateway · Foundation Model APIs",
      "body": "Use supported hosted open models and external models through governed access paths. Unity Gateway centralizes model policies and usage; the custom-serving route has a different feature matrix.",
      "artifact": "The agent calls a selected model without owning that model’s training infrastructure.",
      "href": "https://docs.databricks.com/aws/en/ai-gateway/"
    },
    {
      "id": "traces",
      "name": "Traces & evaluation",
      "products": "MLflow · Unity Catalog",
      "body": "Inspect executions, attach feedback, curate evaluation data, and score candidate versions. Governed trace tables also make the same records available to SQL and data pipelines.",
      "artifact": "A reviewed execution can become an evaluation example or a candidate training record.",
      "href": "https://docs.databricks.com/aws/en/mlflow3/genai/agent-observability-and-quality"
    },
    {
      "id": "analytics",
      "name": "Work over agent data",
      "products": "Databricks SQL · AI Functions",
      "body": "Join executions to application metadata, classify their text, and aggregate recurring issues. Agent data can be processed with the same analytical machinery used for other datasets.",
      "artifact": "A reproducible query produces an analysis table or a curated dataset.",
      "href": "https://docs.databricks.com/aws/en/large-language-models/ai-functions"
    },
    {
      "id": "air",
      "name": "Train & specialize",
      "products": "AI Runtime · NVIDIA NeMo",
      "body": "Run model adaptation on managed GPU compute using your training code and environment. NVIDIA NeMo, NGC containers, and Nemotron cookbooks add a concrete customization path.",
      "artifact": "A training run produces a checkpoint or adapter with its data and configuration recorded.",
      "href": "https://docs.databricks.com/aws/en/machine-learning/ai-runtime/overview"
    },
    {
      "id": "serving",
      "name": "Serve open models",
      "products": "Model Serving · vLLM",
      "body": "Test a model’s inference server in an AIR notebook, register the packaged environment, and deploy a GPU endpoint. Use the same service from an agent or supported batch workload.",
      "artifact": "A versioned inference endpoint makes the adapted model callable by the application.",
      "href": "https://docs.databricks.com/aws/en/machine-learning/model-serving/serve-custom-llms"
    }
  ],
  "context": [
    {
      "label": "Documents",
      "title": "AI Search retrieves from indexed data.",
      "product": "AI SEARCH",
      "body": "A support manual starts in a source table. A Delta Sync index can keep embeddings and metadata synchronized with that source. Hybrid keyword and similarity search helps when a query contains both a product identifier and a description of a problem.",
      "sample": "Source table: support.manual_chunks\nIndex: support.manual_search\nQuery: \"headphones ZX-200 will not pair\"\nReturned artifact: passages + source identifiers",
      "href": "https://docs.databricks.com/aws/en/ai-search/ai-search"
    },
    {
      "label": "Structured data",
      "title": "Genie is an analytical tool for the agent.",
      "product": "GENIE ONE MCP + GENIE ONTOLOGY",
      "body": "The agent asks an analytical question in natural language. Genie uses the governed semantic layer to interpret terms and relationships, executes SQL, and returns an answer with source links. This avoids asking the outer agent to discover the whole schema on every request.",
      "sample": "MCP: system.ai.genie_one_mcp\nTool: genie_ask\nQuestion: \"Which product families have the most support requests?\"\nReturned artifact: answer + query results + citations",
      "href": "https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp"
    },
    {
      "label": "Memory",
      "title": "Recall survives a single conversation.",
      "product": "AGENT MEMORY + LAKEBASE",
      "body": "A memory store keeps durable entries and supports relevance search. Conversation history belongs in a session store. Applications choose trusted actor identifiers; strict access isolation uses separate memory stores, because actor IDs partition entries rather than enforce authorization.",
      "sample": "Session: current conversation messages\nMemory entry: preferred troubleshooting format\nBacking service: Lakebase\nAccess boundary: memory store",
      "href": "https://docs.databricks.com/aws/en/agents/agent-memory/managed-memory"
    },
    {
      "label": "Actions",
      "title": "The agent can call your application tools.",
      "product": "MCP SERVERS + AGENT TOOLS",
      "body": "Connect managed or custom MCP services and ordinary application tools. A return tool, for example, reads the current order, validates the caller, performs its transaction, and returns the committed result. The transaction contract is application code.",
      "sample": "Tool: create_return(order_id, item_ids)\nAuthentication: app identity or request-user authorization\nReturned artifact: committed action ID or rejection\nTrace span: tool inputs + result",
      "href": "https://docs.databricks.com/aws/en/agents/mcp-tools/"
    }
  ],
  "runtime": [
    {
      "label": "Receive",
      "title": "The agent server accepts the request.",
      "service": "Agent Runtime / Databricks Apps",
      "body": "The deployed app exposes an authenticated endpoint. It runs as the app’s service principal. Tools can instead use request-user authorization where configured.",
      "artifact": "Request + authenticated caller"
    },
    {
      "label": "Recover state",
      "title": "The run has somewhere to resume.",
      "service": "DurableAgentServer / Runtime Store",
      "body": "The server supports synchronous, streaming, and background execution with persistent run state. After a worker restart, a durable run can recover. External side effects still need appropriate idempotency in their tool implementations.",
      "artifact": "Run state + session history"
    },
    {
      "label": "Call tools",
      "title": "The harness coordinates the work.",
      "service": "Your framework / MCP / Sandbox",
      "body": "Your agent code selects tools and calls model endpoints. Databricks Sandbox can execute generated code in an isolated environment. It is a separate compute primitive from the GPU used for model inference.",
      "artifact": "Tool response or sandbox output"
    },
    {
      "label": "Generate",
      "title": "The model endpoint generates tokens.",
      "service": "Foundation Model APIs / Custom Model Serving",
      "body": "The agent calls an inference service. The model server loads weights and handles generation. It can be upgraded independently of the agent application, subject to compatibility and evaluation.",
      "artifact": "Model response / structured tool call"
    },
    {
      "label": "Record",
      "title": "MLflow captures the execution.",
      "service": "MLflow / Unity Catalog",
      "body": "Model and tool spans describe the path through the run. Feedback and evaluation refer back to that execution, so a developer can investigate the same record that a reviewer assessed.",
      "artifact": "Trace + assessments"
    }
  ],
  "analysis": [
    {
      "label": "Inspect",
      "title": "Open the individual execution.",
      "body": "Use the trace to inspect the request, retrieval, model response, and tool result. This view answers what happened in a particular run.",
      "code": "-- Our illustrative normalized trace view\nSELECT trace_id, model_version, tool_name,\n       tool_status, reviewer_label\nFROM agent_lab.trace_summary\nWHERE trace_id = 'retail-example-001';",
      "artifact": "One execution with its model, tools, and review attached."
    },
    {
      "label": "Analyze",
      "title": "Query the collection of executions.",
      "body": "Join reviewed executions to a model-version table and count failure categories. The result is a dataset you can schedule, investigate in a dashboard, or compare across releases.",
      "code": "SELECT model_version, reviewer_label, COUNT(*) AS runs\nFROM agent_lab.trace_summary\nGROUP BY model_version, reviewer_label\nORDER BY runs DESC;",
      "artifact": "A release-level breakdown, calculated from stored records."
    },
    {
      "label": "Apply AI",
      "title": "Classify the text, then analyze the labels.",
      "body": "AI Functions can assign candidate issue categories to execution summaries. The classification is a model-produced annotation that should be checked against reviewed examples.",
      "code": "SELECT trace_id,\n  ai_classify(\n    execution_summary,\n    '[\"retrieval_issue\", \"tool_issue\", \"response_issue\"]',\n    MAP('version', '2.1')\n  ) AS issue_annotation\nFROM agent_lab.trace_summary;",
      "artifact": "An annotation column alongside the original trace ID."
    },
    {
      "label": "Reuse",
      "title": "Curate data for the next experiment.",
      "body": "Select reviewed examples for an evaluation dataset. A separate review can select training records; keeping the two manifests separate avoids quietly training on your regression suite.",
      "code": "SELECT trace_id, request, expected_result\nFROM agent_lab.reviewed_examples\nWHERE approved_for_evaluation = TRUE;",
      "artifact": "A versioned evaluation manifest; training selection remains separate."
    }
  ],
  "recipes": [
    {
      "label": "Qwen SFT → serving",
      "title": "A small end-to-end starting point",
      "model": "Qwen3.5-0.8B",
      "compute": "1 × H100",
      "framework": "TRL / full supervised fine-tuning",
      "body": "The official example fine-tunes the model on AIR, compares responses, and serves the result through vLLM Model Serving. It is a useful integration starting point before replacing its dataset with your reviewed task data.",
      "output": "Fine-tuned weights + packaged inference environment",
      "href": "https://docs.databricks.com/aws/en/machine-learning/ai-runtime/examples/gpu-llms"
    },
    {
      "label": "NVIDIA Nemotron",
      "title": "The NVIDIA customization route",
      "model": "Nemotron 3.5 Lightning / Super VL",
      "compute": "Multi-GPU recipes; follow the selected cookbook",
      "framework": "NeMo Automodel / NGC containers",
      "body": "Databricks and NVIDIA publish Nemotron cookbooks for AIR. Use the recipe matched to the model, load the required container through Artifact Registry, and track the run with MLflow. This is a concrete NVIDIA software path inside the Databricks workflow.",
      "output": "Adapted checkpoint or LoRA adapter",
      "href": "https://www.databricks.com/blog/databricks-ai-runtime-nvidia-train-fine-tune-models"
    },
    {
      "label": "GPT-OSS LoRA",
      "title": "Adapt an open-weight model with a documented recipe",
      "model": "GPT-OSS 20B",
      "compute": "8 × H100",
      "framework": "TRL / distributed data parallelism / LoRA",
      "body": "The AIR example catalog includes a GPT-OSS 20B LoRA notebook. Its model, GPU count, and training configuration are a starting recipe, not a statement that every checkpoint fits every deployment GPU.",
      "output": "Adapter + base-model revision + training configuration",
      "href": "https://docs.databricks.com/aws/en/machine-learning/ai-runtime/examples/gpu-llms"
    },
    {
      "label": "Reinforcement learning",
      "title": "Post-train against a verifiable reward",
      "model": "Gemma4-2B example",
      "compute": "1 × H100",
      "framework": "Unsloth / GRPO / LoRA",
      "body": "AIR also documents a GRPO example. A tool environment with executable outcomes can motivate this approach, once the reward has been checked for shortcuts and the SFT baseline is understood.",
      "output": "Post-trained artifact + reward and evaluation versions",
      "href": "https://docs.databricks.com/aws/en/machine-learning/ai-runtime/examples/gpu-llms"
    }
  ],
  "serving": [
    {
      "label": "1. Test",
      "title": "Run the inference server in an AIR notebook.",
      "body": "Load the chosen weights, tokenizer, and tool parser. Query vLLM locally in the GPU environment. Validate generation and tool-call formatting before packaging.",
      "code": "python -m vllm.entrypoints.openai.api_server \\\n  --model /path/to/validated-checkpoint \\\n  --served-model-name retail-model \\\n  --max-model-len 16384",
      "artifact": "Working model + inference command + GPU environment"
    },
    {
      "label": "2. Register",
      "title": "Register the environment with the model.",
      "body": "The documented express-deployment path packages the AIR environment. The registration call below assumes model_info is produced by the documented MLflow logging step, including the inference entrypoint.",
      "code": "mlflow.register_model(\n    model_info.model_uri,\n    \"agent_lab.models.retail_model\",\n    env_pack=\"databricks_model_serving\",\n)",
      "artifact": "Unity Catalog model version + packaged dependencies"
    },
    {
      "label": "3. Deploy",
      "title": "Create the separate GPU serving endpoint.",
      "body": "Model Serving starts the packaged inference command. Choose supported hardware and region, then query the deployed service. The notebook GPU and endpoint GPU are separate allocations.",
      "code": "Release record\n  registered_model: agent_lab.models.retail_model\n  model_version: <registered version>\n  endpoint: <deployed endpoint name>\n  runtime: <tested vLLM environment>",
      "artifact": "Callable inference endpoint + deployment record"
    },
    {
      "label": "4. Use",
      "title": "Call the endpoint from the agent.",
      "body": "The harness sends messages and tool definitions to the endpoint. Keep the model selection in configuration so the same agent can be evaluated against an original model and an adapted release.",
      "code": "Agent application\n  model target: <deployed endpoint>\n  messages: session + retrieved context\n  tools: validated application tool schemas\n  trace tags: endpoint + model version",
      "artifact": "New model and tool spans in the next MLflow trace"
    }
  ]
};
