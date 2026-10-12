---
title: "Stop Turning the LLM Effort Knob to Maximum"
date: 2026-10-10
tags: [AI, LLMs, Software Engineering]
excerpt: "Reasoning models spend tokens thinking before they speak. But cranking test-time compute to maximum on routine tasks needlessly inflates your bill without delivering better results."
---

## The Two Knobs

In most agentic coding apps, you can tweak two knobs that influence performance: **model selection** and **effort level**.

I don't particularly enjoy this situation. Two knobs adjusting for the same vague concept of "performance" can get very confusing very quickly. 

LLM providers are rarely transparent about what effort level actually does under the hood, and coding quality is notoriously difficult to benchmark objectively anyway. As a result, we have a bit of a mess on our hands. Both knobs are supposedly tuned to "task complexity."

Fortunately, there are a few practical rules of thumb you can follow.

## Coarse Control vs. Fine Control

The way I view these two variables is simple: **model selection is the coarse control**, and **effort level is the fine control**.

Model selection is always the first thing you should touch. It has by far the biggest impact on the final result. Effort level is something you only adjust afterwards, if you really need to.

Most modern model families (with an emphasis on Claude and GPT) break down into four distinct classes:

- **The dirt-cheap** (Haiku / Luna): Great for very simple, disposable tasks like running a test script and reporting whether it passed.
- **The mid-tier workhorse** (Sonnet / Terra): Your default choice for relatively straightforward tasks, like writing clean code once all the architectural details have been ironed out.
- **The complex thinker** (Opus / Sol): Essential when you need to solve a nontrivial problem. They work brilliantly as a planner/architect paired alongside mid-tier implementers.
- **The beast** (Fable / Astra): Reserved for when you need long-term planning, multi-step coordination, and deep system-level debugging across massive codebases.

Your baseline should be to treat the **mid-tier models as your daily workhorse**, and reach for the complex thinkers whenever you hit a problem that genuinely requires reasoning.

This, of course, is a classic case of **"Do as I say, not as I do."** 

I tend to default to something like Opus and only fall back to a lower class if a task is blatantly trivial. (Even then, the subagents that Opus spawns to investigate or implement are usually Sonnet anyway). 

This habit comes from getting burned on subtle things as simple as naming a variable: I once asked Sonnet and Opus for naming suggestions, and Opus' ideas were so much better that I wouldn't have picked a single suggestion from Sonnet.

## The Elephant in the Room: Effort Level

When it comes to the effort level knob, **you shouldn't really stress over it**.

The **default is the default for a reason**. In the vast majority of cases, it represents a great starting point and the best trade-off between speed, cost, and answer quality.

Reserve higher effort for problems that genuinely require multi-step reasoning, like debugging subtle concurrency bugs or writing custom parsers. If the model jumped to conclusions too quickly, skipped verification steps, or failed to explore edge cases, that is your signal to bump it up. For routine work like boilerplate, refactoring, or writing unit tests, cranking the knob just burns tokens.

That is really all there is to it. There is plenty of theoretical nuance here, but **none of that nuance is worth your finite brain space**. Tweaking your prompt, providing clearer constraints, or improving your context will take you ten times further than obsessing over effort levels.

There is another massive factor to consider: **effort level drastically changes your bill**.

If you look at the pricing benchmarks on [artificialanalysis.ai](https://artificialanalysis.ai/models/releases/claude-opus-5-5), the numbers are eye-opening. For Claude Opus 5.5, running on **xhigh** or **max** effort is roughly **2.5x to 4x more expensive** than running on medium. 

You should definitely keep that multiplier in mind before cranking the knob to maximum.

## What "Effort" Actually Means Under the Hood

To be pedantic, we don't really know what the big labs are doing behind the scenes. They have no reason to leak these trade secrets, so we can only speculate based on what we see happening in the open-source community and across public APIs.

In practice, adjusting the effort knob almost certainly boils down to two mechanisms:

1. **A hard token budget**: The API sets a ceiling on how many hidden thinking tokens the model can produce. If you set the budget to 4,000 tokens, the inference server lets the model generate up to 4,000 tokens in its scratchpad. Once that threshold is reached, the engine injects a stop token or forces the model to emit its closing delimiter and produce the final answer.
2. **Reinforcement learning steering tokens**: The API passes a hidden control token (or system prompt directive) signaling the target effort tier (`low`, `medium`, `high`). During training with Reinforcement Learning, the model was rewarded for generating longer, more rigorous verification steps when conditioned on "high", and penalized for wasting tokens when conditioned on "low".

When the policy receives the **high** conditioning token, it is strongly biased against emitting the closing `</think>` delimiter early. It continues sampling tokens that question its assumptions, check alternative implementations, or simulate edge cases.

## My Thoughts

At the end of the day, having two separate knobs that adjust for the same vague concept of "performance" is just **bad UX**. It pushes the burden of model optimization onto the developer, who already has enough complexity to worry about.

If you take away anything from this, let it be this: **focus on the coarse control first**. Picking the right model class for the job gets you 90% of the way there.

Leave the effort level on **default**. Only reach for that knob when you notice the model jumping to conclusions on a genuinely tricky problem, or when you are running batch jobs where burning 4 times the cash on thinking tokens makes zero financial sense.

And if an LLM is consistently failing at a task? Fiddling with the effort slider is almost certainly the wrong fix. **Refining your prompt, giving it better context, or breaking the problem down** will beat tinkering with effort levels every single time.
