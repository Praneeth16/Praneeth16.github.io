# LLMBuild

TLC reached 16 states and 22 steps. The chart draws 16 states and 22 arrows.

## NoFutureTokenLeakage breaks
The shortest path has 3 steps:
0. 01 Raw Web Crawl
1. tokenize raw HTML directly [skip dedup]: 03 BPE Token Stream
2. lookup d=4096 vectors & rotate by RoPE θ_i: 04 Embeddings + RoPE
3. project Q, K, V [causal mask broken]: 06 Future Tokens Leaked

## FiniteWeightsAndLoss breaks
The shortest path has 6 steps:
0. 01 Raw Web Crawl
1. tokenize raw HTML directly [skip dedup]: 03 BPE Token Stream
2. lookup d=4096 vectors & rotate by RoPE θ_i: 04 Embeddings + RoPE
3. project Q, K, V [causal mask ON]: 05 Causal Self-Attention
4. add residual stream & RMSNorm into SwiGLU/MoE: 07 SwiGLU & MoE Experts
5. compute next-token cross-entropy and backpropagate: 08 3D Parallel All-Reduce
6. inject numerical instability [failure scenario]: 09 Non-finite Weight Collapse

## NoRewardExploit breaks
The shortest path has 9 steps:
0. 01 Raw Web Crawl
1. tokenize raw HTML directly [skip dedup]: 03 BPE Token Stream
2. lookup d=4096 vectors & rotate by RoPE θ_i: 04 Embeddings + RoPE
3. project Q, K, V [causal mask ON]: 05 Causal Self-Attention
4. add residual stream & RMSNorm into SwiGLU/MoE: 07 SwiGLU & MoE Experts
5. compute next-token cross-entropy and backpropagate: 08 3D Parallel All-Reduce
6. clip global grad norm ‖g‖₂ ≤ 1.0 [grad clip ON]: 10 Grad Clip & AdamW Step
7. repeat for 15T tokens (90 days) → anneal on math & code: 11 Base Model Checkpoint
8. train on example prompt/assistant conversations (SFT): 12 Supervised Fine-Tuning
9. maximize reward model with β = 0.00 [KL leash OFF]: 13 Reward-Hacked Collapse

## Rules that hold
NoDeadlock
