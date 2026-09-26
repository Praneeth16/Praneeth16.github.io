# WTF Is a System One Model?

*What TypeSafe means by System One, why anyone wanted a model that cannot write a sentence, and what happened when I put Jev and GPT-6 Luna in front of the same two routing jobs.*

Praneeth Paikray · September 26, 2026 · Benchmarks run September 26

A user types "what name do you have for me" into an assistant. Somewhere behind the chat box, a router has to send that request to one of eleven places: a banking agent, a travel agent, a small-talk handler, the settings handler, and so on. GPT-6 Luna, the cheapest model in OpenAI's GPT-6 line, sent it to small talk and said it was 99% sure. The request belongs to settings; it asks for the user's saved name.

Jev, TypeSafe's new model, sent it to settings. It gave that route a probability of 0.50.

That second number is the reason this article exists. Jev got this one right, but the more useful thing is that it said it wasn't sure. Across 330 routing requests, Luna made 31 mistakes while claiming at least 90% confidence. Jev made 7.

"System One model" is TypeSafe's name for the category Jev belongs to, and the phrase has been everywhere for two weeks. I wanted a plain answer to what it means, where the idea came from, and whether it holds up outside a launch post. So I read the docs, watched the talk that started it, looked at the clones that appeared within days, and ran a benchmark that costs fifty cents to reproduce.

## The short answer

A System One model reads text and answers questions you define in advance. You send a *state* (a message, a document, a JSON record) and one or more typed questions. It returns a choice from your options, a yes/no probability, or a position on a scale you wrote, with a probability for every option. It never generates text. [2](#ref-2)

![Fast bounded decisions on one side, slow open-ended reasoning on the other, with escalation between them.](diagrams/01-fast-and-slow.svg)

*Figure 1. The System 1 and System 2 labels applied to models. The split is an engineering choice about where to spend compute, not a claim about how the models work inside.*

The name comes from Daniel Kahneman. In *Thinking, Fast and Slow*, System 1 is fast, automatic judgment and System 2 is slow, effortful reasoning. [8](#ref-8) The labels themselves came earlier, from Keith Stanovich and Richard West. [9](#ref-9) TypeSafe's docs say the borrowing is loose: "the emphasis is on fast, focused judgments." [2](#ref-2)

Three things set Jev apart from asking an LLM for JSON:

1. **The answer space is fixed by the request.** You list the options; Jev can only pick among them. A Choice question accepts up to 255 options. [2](#ref-2)
2. **The output is a distribution.** Every option gets a probability. TypeSafe trains for those probabilities to be calibrated, meaning that across many answers given probability 0.8, about 80% should be right. [3](#ref-3)
3. **It is priced like a lookup.** Jev 1.13 costs $0.042 per million input tokens, and output is free. [4](#ref-4)

It also cannot do a lot. It does not write replies, explain itself, count reliably, compare dates, or do arithmetic. TypeSafe publishes a "jaggedness" page listing nine failure modes, including literal reading of instructions and trouble with multi-hop questions. [5](#ref-5) That page is more useful than the launch post.

## Why anyone wanted a System 1

The clearest argument for the category comes from a talk TypeSafe cofounder Diogo Almeida gave at AI Engineer this summer. He was on the OpenAI team behind InstructGPT and ChatGPT, and TypeSafe's docs credit him as a co-inventor of RLHF. [7](#ref-7), [3](#ref-3)

He never says "System One" in the talk. His argument is about who a model is trying to please.

He starts with a puzzle. Models are solving unsolved math problems, yet customer service still needs a person in the loop to make decisions. His explanation is that today's successful AI products are all *assistance*: a person is present, and the job is to satisfy that person. Automation is the other kind of work, where "ideally it would be running in the background in a server that you never even look at." [7](#ref-7)

Then he ties that to how models are trained. RLHF collects human preferences and optimizes for them, so, in his words, "overpromising is a feature. This is by design." Answering a question from the audience, he describes an asymmetry in the reward model that pushes models "to drop modes and be confident because it's very easy to see when the model is not confident and to punish that." [7](#ref-7)

If Almeida is right, a model trained that way learns to sound certain whether or not it is. My benchmark cannot test that explanation, only the symptom. A person reading a chat reply can shrug off a confident 0.99. A router that trusts the same number loses its best signal for catching a mistake.

His proposed fix is a third post-training target. RLHF optimizes for preference, RLVR for verifiable correctness, and TypeSafe "a third thing that is optimized for calibrated decision-making." [7](#ref-7) TypeSafe's docs call it Reinforcement Learning for Calibrated Decisions, or RLCD, and publish little beyond that description. [3](#ref-3)

## Meanwhile, the field was building System 2

The timing matters. For most of the past two years, model progress meant more System 2.

Yoshua Bengio framed the goal in his NeurIPS 2019 keynote: deep learning was good at fast pattern recognition and needed to learn slow, deliberate reasoning. [10](#ref-10) OpenAI's o1 in September 2024 made that concrete by spending tokens on a chain of thought before answering. [11](#ref-11) The approach worked, and it got expensive in exactly the places that did not need it. One paper measured reasoning models spending hundreds of tokens on "2+3=?" and called the problem overthinking. [12](#ref-12) Another asked how to distill System 2 outputs back into a fast System 1 model. [13](#ref-13)

Agents made this worse. An agent loop makes many small decisions: which model gets the task, whether a tool call is safe, whether retrieved text is relevant, whether the answer is done. Most harnesses answer those with another LLM call or skip them. DAIR.AI's tutorial on building a harness with Jev puts it plainly: "That costs a full model call each time, so in practice most checks get skipped." [16](#ref-16)

That is the gap a System One model is meant to fill. Sydney Runkle, writing for LangChain, describes Jev as taking "one capability out of the frontier LLM bundle, judgment," and making it "a primitive too cheap to measure." [15](#ref-15)

## What a decision model is

"Decision model" is the less branded name, and Runkle notes it is the more common one. [15](#ref-15) A useful working definition is a model whose output contract is a probability distribution over options you supply at request time.

![An LLM router generates JSON containing a stated confidence; a decision model returns a distribution over the options sent.](diagrams/02-output-contract.svg)

*Figure 2. Both paths give code something to branch on. The difference is where the number comes from and what it was trained to mean.*

The idea is older than the branding. Logistic regression returns class probabilities. In 2019, researchers showed that a natural-language-inference model could classify text into labels it had never seen, by scoring whether "this text is about travel" follows from the input. [29](#ref-29) Any LLM that exposes log probabilities can be read the same way: ask a multiple-choice question and look at the probability of each answer letter.

Jev puts four things behind one API call: labels written in plain language at request time, several questions answered in parallel against one state, a training objective aimed at calibration, and a price low enough to call it on every step. Each piece has precedent. What TypeSafe launched is a product that offers all four at once.

LLMs can also report confidence, but differently. When Luna writes `"confidence": 0.95`, those are tokens chosen to fit the prompt. Work on verbalized confidence has found that such numbers are often poorly calibrated, although asking carefully helps. [28](#ref-28) My benchmark ended up measuring that difference directly.

## One interface, several ways to build it

Within two weeks of the launch, at least four different approaches were being called Jev-like.

![Three columns: models trained for decisions, repurposed generators, and fine-tuned small language models.](diagrams/03-family.svg)

*Figure 3. Everything here accepts a state and a set of options and returns probabilities. Only the first column was trained for that job from the start.*

**Jev** is hosted, closed, and trained with RLCD. The same weights serve every customer; you adapt it through the state and the wording of questions, not fine-tuning. [4](#ref-4) OpenRouter now serves it as `typesafe/jev-1.13` through a Decisions API, so one OpenRouter key reaches both Jev and ordinary LLMs. [23](#ref-23)

**DiffusionGemma as Jev** is the one people have been calling "DiffusionJev." Google released DiffusionGemma, the model. The Jev part is a pull request to vLLM by Matt Mastracci. [17](#ref-17) The official Gemma account amplified it on September 18, praising how it "leverages canvas diffusion to evaluate structured choices in a single parallel pass." [18](#ref-18) Mastracci's first post about it opened with "We have Jev at home." [19](#ref-19)

The mechanism is neat. A diffusion language model fills in a whole canvas of tokens at once, rather than left to right. The patch pins every token of the prompt and answer template, leaves one slot open, runs a single denoising step, and reads the probability of each option token in that slot.

![A row of pinned tokens with one open slot; one denoising step produces probabilities for each option token.](diagrams/04-diffusion-canvas.svg)

*Figure 4. How the vLLM patch turns a generative diffusion model into a decision model. Options must map to single tokens so the canvas cannot shift.*

Mastracci reported that it roughly tied Jev on his evaluations, running on a DGX Spark. [19](#ref-19) I have not reproduced that. What the patch shows is that the System One interface can be built from a generative model that was never trained for it. The training objective is what Jev claims as its edge.

**Laya**, from ConvAI Innovations, is an open, Apache-licensed family of encoder models (322 to 421 million parameters) that expose the same three question types. Its author, Nandakishor Mukkunnoth, reports 32.8 ms per request on one GPU and argues that his March 2025 paper on reinforcement-learned, non-autoregressive decisions came first. [20](#ref-20) Those figures are self-reported, and I have not tested Laya.

**Tev1-4B**, from Together AI, is a fine-tuned Qwen3.5 4B model offered as a "Jev-like classifier," with a tutorial on training your own for about $17. [21](#ref-21)

So "System One" names a contract: typed options in, probabilities out, no text. Architecture varies. Calibration depends on how the model was trained, and that you have to measure.

## Where it sits in a harness

The integrations so far put Jev at branch points and keep the flow in code. LangChain's first post used it for model routing and for checking tool calls before they run. [14](#ref-14) Runkle's LangGraph article routes legal documents during discovery review, asking three questions per page: responsive or not, containing personal information or not, possibly privileged or not. Each answer maps to a branch in the graph. [15](#ref-15) The DAIR tutorial builds the same ideas on the Pi SDK, a TypeScript agent toolkit, and uses Jev to pick a model, block risky tool calls, and check the final answer. [16](#ref-16)

![A request goes to Jev, which asks two questions in one call; code sends the request to a specialist agent, a cheap model, or a big model or person.](diagrams/05-router-harness.svg)

*Figure 5. The pattern the TypeSafe docs call intent routing [6](#ref-6). Code decides which branch to take from the returned probabilities.*

Routing is where these posts agree Jev fits best, so that is what I tested.

## The benchmark: Jev and Luna as routers

OpenRouter already compared Jev with Claude Opus 5 on Banking77 intent classification: Jev was 3.3 points less accurate, 13 times faster at the median, and cost 1/22 as much. [22](#ref-22) That is a comparison against the most expensive option. A team building a router would more often reach for the cheapest capable LLM. Today that is GPT-6 Luna at $0.10 per million input tokens and $0.50 per million output tokens.

I gave both models two routing jobs.

![Two tasks: CLINC150 specialist routing with 11 routes, and MMLU-Pro model-tier routing with labels from Luna and Sol answers.](diagrams/06-benchmark-design.svg)

*Figure 6. Both routers see the same instructions and the same criteria text. GPT-6 Sol only answers questions to create Task B's labels; it is not a router.*

**Task A, which specialist?** CLINC150 is a public intent dataset with 150 intents grouped into ten domains, plus out-of-scope queries that match none of them. [24](#ref-24) I treated each domain as a specialist agent and added `out_of_scope` as an eleventh route. I sampled 30 test utterances per route (330 total) and 10 per route for a development set.

**Task B, does this need the big model?** Here the router decides whether a cheap model can answer a question or whether it should go to an expensive one. I sampled 308 test questions and 98 development questions from MMLU-Pro, a harder version of MMLU with up to ten options per question, evenly across its 14 subjects. [25](#ref-25) Luna, with reasoning off, and GPT-6 Sol, with low reasoning effort, answered every question. The label is whether Luna got it right. The routers see the question and options, never an answer.

This is the setup RouteLLM and FrugalGPT studied: send easy queries to a cheap model and the rest to a strong one. [26](#ref-26), [27](#ref-27) Those systems train a router on preference or outcome data. Here both routers work zero-shot from a written description.

The two routers:

| | Jev 1.13 | GPT-6 Luna |
| --- | --- | --- |
| Call | OpenRouter Decisions API | OpenRouter chat completions |
| Task A output | Choice over 11 routes, probabilities for all | JSON schema: route enum and stated confidence |
| Task B output | Noul, probability of yes | JSON schema: stated probability |
| Settings | `typesafe/jev-1.13`, returned `jev-1.13-20260917` | reasoning effort `none`, provider pinned to OpenAI |

*Table 1. Router configurations. Criteria text lives in one Python module, hashed before the first test call.*

I wrote each route's description from the domain name and its intent labels, without reading any utterance. The same text goes into Jev's criteria and Luna's system prompt:

```python
ROUTES = {
    'banking': 'Bank accounts: balances, transfers, bill payment and due dates, transactions '
               'and spending history, interest rates, routing numbers, checks, PIN changes, '
               'frozen or blocked accounts, reporting fraud.',
    # ... nine more specialists ...
    'out_of_scope': 'None of the specialists above handles this request.',
}
```

Everything ran through OpenRouter with 8 requests in flight, interleaving the two routers in random order so neither got a quieter moment. All 2,584 calls cost $0.50 in total, and 82% of that was Sol answering Task B questions.

## Task A: Jev routed more accurately

| Metric | Jev 1.13 | GPT-6 Luna |
| --- | ---: | ---: |
| Accuracy | 91.5% | 85.8% |
| Macro-F1 | 91.6% | 85.9% |
| In-scope accuracy | 93.3% | 88.0% |
| Out-of-scope recall | 73.3% | 63.3% |
| Out-of-scope precision | 64.7% | 55.9% |
| Invalid responses | 0 of 330 | 0 of 330 |

*Table 2. Task A, 330 test utterances. Out-of-scope rows count the eleventh route only.*

![Accuracy, macro-F1, and out-of-scope recall and precision for the two routers.](figures/06-route-accuracy.svg)

*Figure 7. Task A metrics. In the web edition, switch between overall and per-route accuracy.*

Jev routed 302 of 330 requests correctly; Luna routed 283. On a paired bootstrap, the accuracy gap has a 95% interval of 2.7 to 9.1 points. The two agreed on 89.7% of requests. Where they disagreed, Jev alone was right 25 times and Luna alone 6 times.

Many of Luna's misses were confident. "Please give me the time in tanzania at this moment" went to travel at 0.99. Jev chose utility, which is where CLINC puts time questions. "Make a call for me to the vet" went to out-of-scope at 0.99. Jev chose utility at 0.80.

Jev's own misses clustered around bills. "Tell me when my water bill is due" is a banking request in CLINC's scheme, and Jev chose utility at 0.60. Both routers sent "alert my bank of my travel to dubai" to banking, while CLINC labels it travel. Some of these are real ambiguity in the label scheme, and a production team would fix them by editing the criteria. I left the criteria frozen.

Neither router handled out-of-scope requests well. "Should I do a complete stop at red lights" went to the auto specialist from both, at 0.96 and 0.99. An out-of-scope route defined only as "none of the above" is the hardest criterion to write, and both models treated it that way.

Some of these misses say more about CLINC's taxonomy than about the routers. CLINC labels "how long does it take the irs to issue a tax refund" out of scope, but my work specialist's description includes taxes, and both routers sent it there. Out-of-scope recall here measures agreement with CLINC's boundaries, which my criteria did not fully reproduce.

<!-- explorer:disagreements -->

## What the confidence is worth

A router's probability matters because code acts on it. The usual policy routes automatically when confidence is high and sends the rest to a fallback. That only works if high confidence means the route is usually right.

![Reliability diagrams for Jev's choice probability and Luna's stated confidence.](figures/08-route-calibration.svg)

*Figure 8. Task A calibration. Each point is a probability bin, with its count; error bars are 95% Wilson intervals. The dashed diagonal is perfect calibration.*

Jev's expected calibration error was 0.033, and Luna's was 0.101. [31](#ref-31) Luna gave 154 requests a confidence of 0.99 or more; Jev gave 187 requests that much. The difference is what happened near the top. Among requests at 0.9 or above, Jev was wrong 7 times and Luna 31.

This compares two interfaces as well as two models. Jev returns a probability for every route. Luna writes one confidence number because the prompt asks for it. The result shows which signal a router can use as offered. It does not show that Jev's training, rather than the interface, made the difference. A fairer LLM baseline would read token probabilities or sample Luna several times, and I did neither.

The practical test is selective routing: auto-route only the most confident share of traffic and send the rest to a person.

![Accuracy on the automatically routed share of traffic as coverage increases, for both routers.](figures/09-route-selective.svg)

*Figure 9. Selective routing on the test set, with thresholds swept in hindsight. Move the slider in the web edition to see how many requests each router handles and how accurate those handled requests are.*

Read off the test curve, requests Jev handled on its own at 80% coverage were 96.2% correct, compared with 90.6% for Luna. Those thresholds were picked in hindsight. Fixing them on the development set first gives the fairer number: Jev's threshold of 0.86 covered 77.0% of test requests at 97.2% accuracy, and Luna's 0.95 covered 76.1% at 90.8%. On this task, Jev's probabilities ranked its own mistakes better.

I also tried the obvious cascade, sending Jev's low-confidence requests to Luna. The best threshold on the test set, 0.45, sent two requests to Luna and gained one correct route: 303 of 330 against 302 for Jev alone, at slightly higher cost. On the development set, no threshold beat Jev alone. A fallback that is weaker overall can still help where its errors differ from the first stage's. In this run that happened on one request.

### Speed and cost

![Latency histograms for both routers on a log scale.](figures/07-route-latency.svg)

*Figure 10. Client-observed round trips through OpenRouter, 330 calls each, 8 in flight. Switch to the serial probe in the web edition.*

| | Jev 1.13 | GPT-6 Luna |
| --- | ---: | ---: |
| Median latency | 0.42 s | 1.17 s |
| 95th percentile | 0.51 s | 1.67 s |
| Median, serial probe | 0.43 s | 1.12 s |
| Mean billed input tokens | 832 | 561 |
| Cost per 1,000 decisions | $0.035 | $0.066 |

*Table 3. Task A latency and cost. The serial probe sent 40 requests to each router one at a time.*

Jev was 2.8 times faster at the median and 1.9 times cheaper. Those multiples are far from the 193.6× and 444.6× in TypeSafe's launch post, which compared against frontier models. [1](#ref-1) Luna is itself a very cheap model, so the price gap shrinks to a factor of two. Jev also billed about 48% more input tokens than Luna for the same text and criteria, which I cannot explain from the outside.

Latency surprised me for a different reason. In my previous Jev experiment, calling TypeSafe's API directly a week ago, median latency was 12 to 20 seconds. [30](#ref-30) Through OpenRouter today it was 0.42 seconds. I cannot tell whether that reflects TypeSafe's capacity, routing, or something about my earlier setup.

## Task B: Jev knew which questions were hard

Luna answered 58.4% of the 308 MMLU-Pro test questions correctly. Sol answered 86.0%. Sol also cost 34 times as much per question ($1.05 versus $0.031 per thousand) and took 2.8 seconds at the median. A perfect router, sending a question to Sol only when Luna would get it wrong, would reach 88.3% for $0.57 per thousand.

Neither router got close to perfect, but they were far apart.

| Metric | Jev 1.13 | GPT-6 Luna |
| --- | ---: | ---: |
| AUROC | 0.770 | 0.599 |
| Brier score | 0.201 | 0.296 |
| 10-bin ECE | 0.110 | 0.234 |
| Mean predicted P(Luna correct) | 0.48 | 0.76 |
| Router cost per 1,000 questions | $0.026 | $0.041 |

*Table 4. Task B routing quality. The observed rate of Luna answering correctly was 0.584. AUROC measures how well each router ranks questions from likely-right to likely-wrong; 0.5 is chance.*

The AUROC gap has a paired bootstrap interval of 0.10 to 0.24. Luna, judging whether a small model like itself would get a question right, was optimistic. It assigned 0.98 or higher to 100 questions and got 65 of them right. Its weakest subjects were business and chemistry, mostly calculations such as balance sheets, bond interest, and unit conversions, where Luna scored 23% and 27%. Luna's average prediction on those two subjects was 0.61 and 0.62. Jev's was 0.26 and 0.29.

![Histograms of each router's predicted probability, split by whether Luna answered correctly.](figures/11-tier-separation.svg)

*Figure 11. Separation of easy and hard questions. Jev's scores spread across the range; Luna's pile up near 1.0 whether or not it was right.*

Jev's scores were informative in both directions. Of the 81 questions it scored at 0.7 or above, Luna answered 70 correctly (86%). Of the 92 it scored below 0.3, Luna answered 28 correctly (30%).

What a router is worth depends on the whole system: routing cost, plus the cost of whichever model answers, against the final accuracy.

![Cost against accuracy for routing by Jev, routing by Luna, always Luna, always Sol, and a perfect oracle.](figures/10-tier-frontier.svg)

*Figure 12. Each curve sweeps the router's threshold on the test set; the dev-selected Jev threshold is marked. In the web edition, drag the share sent to Luna, and use the button to return to the dev-selected point.*

To pick a single operating point fairly, I chose each router's threshold on the development set: the cheapest threshold whose accuracy was within two points of always using Sol. Applied to the test set, Jev sent 38% of questions to Luna and reached 83.8% accuracy for $0.83 per thousand, 21% cheaper than always using Sol for 2.3 fewer points. For Luna's router, the only development-set threshold that met the target was the one that sends every question to Sol, so the same rule gave no savings.

Sweeping the test set in hindsight gives an upper bound on the difference. To reach 80% accuracy, routing with Jev cost $0.65 per thousand questions and routing with Luna cost $0.95.

<!-- explorer:tier -->

## What these numbers do not show

This was one afternoon, two datasets, one prompt design, and two models. Several limits matter.

Both datasets are public and several years old, so either model may have seen them during training. CLINC's domain boundaries are sometimes arbitrary, which penalizes both routers for decisions a reasonable person might make. Task B's labels come from a single run of Luna with reasoning off. With reasoning on, Luna would be more accurate and slower, and the routing problem would change.

I wrote the criteria once and did not tune them. My previous article showed that revising Jev's question wording with GEPA moved F1 by more than ten points on a medical task. [30](#ref-30) Both routers would probably improve with the same effort, and I cannot say which would improve more.

Luna's confidence is a number it writes. I did not try sampling Luna several times and measuring agreement, which the TypeSafe cookbooks compare against, or reading token probabilities, which Luna does not expose on OpenRouter. A stronger LLM baseline would use one of those.

Finally, latency is client-observed through one provider on one day. TypeSafe's own docs warn that rate limits "can change without notice." [4](#ref-4)

## When I would reach for which

For a fixed set of routes where code acts on the result, I would now start with a decision model and test it against the cheap LLM I would otherwise use. In Task A, Jev was more accurate, faster, and cheaper than GPT-6 Luna with reasoning off. In Task B, Jev ranked hard questions better than Luna did. Its dev-selected policy gave up 2.3 points of accuracy for a 21% saving over always using Sol, while Luna's selected policy kept Sol's accuracy only by sending everything to Sol. The benefit that held up in both tasks was the quality of the probabilities, more than speed or price.

I would still write criteria the way the jaggedness page suggests: state the exact condition, put boundary cases in the option descriptions, and keep arithmetic, counting, and date comparison in code. [5](#ref-5) Out-of-scope needs positive descriptions of what does not belong, not just "none of the above."

I would keep an LLM for anything that needs an explanation, a generated answer, or several steps of reasoning. That is the System 2 side of Figure 1, and it is where the answering model in Task B lives.

The clones raise a question this benchmark cannot answer. A diffusion model with a vLLM patch and a 4B model fine-tuned for $17 offer the same interface. Whether their probabilities are as usable as Jev's, and how much of Jev's edge comes from RLCD, needs the same head-to-head test run against them.

## Reproduce the benchmark

The [companion code](https://github.com/Praneeth16/Praneeth16.github.io/tree/main/study/system-one-router) contains data preparation, the router definitions, the runner, the analysis, tests, and every recorded response. `analyze.py` recomputes every number in this article from `run/calls.jsonl` without making API calls. The explorers on this page read the same records.

To run it live, put an OpenRouter key in `OPENROUTER_API_KEY` and run `prepare.py`, then `run.py route`, `run.py answer`, `run.py tier`, and `run.py latency` for each split. Datasets are pinned by revision and checksum: CLINC150 at `155b9c7` with the official domain mapping at `828f809`, and MMLU-Pro at `b189ec7`. Sampling uses seed 20260926. A full run cost $0.50.

## References

1. <span id="ref-1"></span>TypeSafe AI. (2026, September 15). [Introducing System One Models and Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev). Launch announcement and evaluation methodology.

2. <span id="ref-2"></span>TypeSafe AI. [System One](https://docs.typesafe.ai/concepts/system-one) and [Primitives](https://docs.typesafe.ai/primitives). Definitions, the Kahneman note, and question types. Accessed September 26, 2026.

3. <span id="ref-3"></span>TypeSafe AI. [AI primer](https://docs.typesafe.ai/introduction/machine-learning-primer). RLHF, RLVR, and RLCD; calibration. Accessed September 26, 2026.

4. <span id="ref-4"></span>TypeSafe AI. [Models](https://docs.typesafe.ai/models). Jev 1.13 pricing, context limits, aliases, rate limits, and customization. Accessed September 26, 2026.

5. <span id="ref-5"></span>TypeSafe AI. [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13). Known failure modes, last reviewed September 17, 2026.

6. <span id="ref-6"></span>TypeSafe AI. [Intent routing](https://docs.typesafe.ai/patterns/intent-routing). Routing pattern with confidence gates. Accessed September 26, 2026.

7. <span id="ref-7"></span>Almeida, D. (2026, July 31). [Jev CEO: I made ChatGPT, now I'm building what's next](https://www.youtube.com/watch?v=cJ0EOzey--o). AI Engineer [Video]. Quotations from the automatic transcript.

8. <span id="ref-8"></span>Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux.

9. <span id="ref-9"></span>Stanovich, K. E., & West, R. F. (2000). Individual differences in reasoning: Implications for the rationality debate? *Behavioral and Brain Sciences, 23*(5), 645–665.

10. <span id="ref-10"></span>Bengio, Y. (2019, December). From System 1 Deep Learning to System 2 Deep Learning. Invited talk, NeurIPS 2019.

11. <span id="ref-11"></span>OpenAI. (2024, September 12). [Learning to reason with LLMs](https://openai.com/index/learning-to-reason-with-llms/).

12. <span id="ref-12"></span>Chen, X., et al. (2024). [Do NOT Think That Much for 2+3=? On the Overthinking of o1-Like LLMs](https://arxiv.org/abs/2412.21187). arXiv:2412.21187.

13. <span id="ref-13"></span>Yu, P., Xu, J., Weston, J., & Kulikov, I. (2024). [Distilling System 2 into System 1](https://arxiv.org/abs/2407.06023). arXiv:2407.06023.

14. <span id="ref-14"></span>Runkle, S., & Lovell, H. (2026, September 17). [Building a Harness with Jev](https://www.langchain.com/blog/building-a-harness-with-jev). LangChain.

15. <span id="ref-15"></span>Runkle, S. (2026, September 25). [Building Prod with Jev and LangGraph](https://x.com/sydneyrunkle/status/2103560531235795129) [X article].

16. <span id="ref-16"></span>DAIR.AI Academy. [Building a Custom Harness with Pi and Jev](https://academy.dair.ai/resources/jev-decisions-in-a-pi-sdk-harness). Tutorial; full text requires sign-up. Accessed September 26, 2026.

17. <span id="ref-17"></span>Mastracci, M. [DiffusionGemma as Jev](https://github.com/vllm-project/vllm/pull/57250). vLLM pull request #57250.

18. <span id="ref-18"></span>Google Gemma. (2026, September 18). ["DiffusionGemma as Jev" showcases the power of non-autoregressive architectures](https://x.com/googlegemma/status/2101069861598482817) [X post].

19. <span id="ref-19"></span>Mastracci, M. (2026, September 16–17). [We have Jev at home](https://x.com/mmastrac/status/2100373761195401724) and [live evals of Jev vs DiffusionGemma-as-Jev](https://x.com/mmastrac/status/2100626193943052784) [X posts].

20. <span id="ref-20"></span>Mukkunnoth, N. [Laya: a multilingual System 1 decision engine](https://laya.convaiinnovations.com/). ConvAI Innovations. Accessed September 26, 2026.

21. <span id="ref-21"></span>El Mghari, H. (2026, September 23). [How to train your own Jev for $17](https://www.together.ai/blog/how-to-train-your-own-jev). Together AI.

22. <span id="ref-22"></span>Rogers, K. (2026, September 22). [Is Jev as Accurate as Frontier Models at Classification?](https://openrouter.ai/blog/insights/jev-vs-claude-opus-5-classification/) OpenRouter.

23. <span id="ref-23"></span>OpenRouter. [Jev tutorial: make your first decision call](https://openrouter.ai/docs/guides/community/jev-tutorial). Decisions API and model identifiers. Accessed September 26, 2026.

24. <span id="ref-24"></span>Larson, S., et al. (2019). [An Evaluation Dataset for Intent Classification and Out-of-Scope Prediction](https://aclanthology.org/D19-1131/). EMNLP-IJCNLP 2019. Data: [clinc/clinc_oos](https://huggingface.co/datasets/clinc/clinc_oos/tree/155b9c710419136e17307b80d0a13e68cd46b4ec), `plus` configuration, CC BY 3.0.

25. <span id="ref-25"></span>Wang, Y., et al. (2024). [MMLU-Pro: A More Robust and Challenging Multi-Task Language Understanding Benchmark](https://arxiv.org/abs/2406.01574). NeurIPS 2024 Datasets and Benchmarks. Data: [TIGER-Lab/MMLU-Pro](https://huggingface.co/datasets/TIGER-Lab/MMLU-Pro/tree/b189ec765aa7ed75c8acfea42df31fdae71f97be), MIT.

26. <span id="ref-26"></span>Ong, I., et al. (2024). [RouteLLM: Learning to Route LLMs with Preference Data](https://arxiv.org/abs/2406.18665). arXiv:2406.18665.

27. <span id="ref-27"></span>Chen, L., Zaharia, M., & Zou, J. (2023). [FrugalGPT: How to Use Large Language Models While Reducing Cost and Improving Performance](https://arxiv.org/abs/2305.05176). arXiv:2305.05176.

28. <span id="ref-28"></span>Tian, K., et al. (2023). [Just Ask for Calibration](https://arxiv.org/abs/2305.14975). EMNLP 2023.

29. <span id="ref-29"></span>Yin, W., Hay, J., & Roth, D. (2019). [Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161). EMNLP-IJCNLP 2019.

30. <span id="ref-30"></span>Paikray, P. (2026, September 20). [Adapting Jev to Your Domain with GEPA](https://praneeth16.github.io/blog/adapting-jev-with-gepa/).

31. <span id="ref-31"></span>Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). [On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a.html). ICML 2017.

32. <span id="ref-32"></span>Excalidraw contributors. [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) 0.18.0. Library used to render the conceptual diagrams.
