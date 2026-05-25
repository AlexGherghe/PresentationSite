---
title: "Mixture of Experts: The Key to Efficient AI"
date: 2026-05-25
tags: [AI, MoE, Transformer, Deep Learning]
excerpt: "Mixture of Experts (MoE) has emerged as a leading architecture for training large language models more efficiently. Instead of activating the entire model for every token, MoE uses a gating mechanism to route inputs to specialized sub-networks, or 'experts'. This allows models to scale to trillions of parameters while keeping inference costs manageable."
---

## Costs

Getting large language models to this level of sophistication took a large breakthrough. By the early 2020s, Transformers were nothing new, so what was the big change? It's beautifully simple: we've discovered that **making neural networks larger** makes them **considerably better**.

This realization may seem very **intuitive** right now, but it was not the case back then. It was generally accepted in the ML community that there is a **point of diminishing returns** while scaling. Even **more so**, making the layers wider was considered way better than making the model deeper. People were not crazy; scaling networks deeper introduced massive training instabilities and synchronization overhead between GPUs, making it look like we hit a wall.

But some experiments by OpenAI changed the landscape and we are here now. The "large" in "large language model" is not there just for show. The **state-of-the-art** models of frontier labs are estimated to be (because they don't like to share exact details) in the range of **1+ trillion parameters**. If we assume that each parameter takes up 2 bytes of memory (FP16), then we would need around **2TB of VRAM** just to load the weights. This is not even including the KV cache, activations, and all the other overhead that comes with running an LLM. You can imagine that inference would be **really slow** and **wildly expensive**.

## Enter: Mixture of Experts

Since deploying a massive monolithic network isn't practical, how do we fix this? This is where we fall back to the Ol' Reliable of the computer science optimizations world: **Divide and Conquer**.

Instead of one giant neural network, we can have **several smaller sub-networks**, each specializing in a specific domain. A **router** sits before them and chooses the right mixture of experts (see what I did there?) for the task at hand. What this enables us to do is to **not use all of the parameters** of the network for each inference. For example, while **Mixtral 8x7B has 47 billion total parameters**, it only routes inputs to active sub-networks such that only **13 billion parameters are activated** per token. This helps massively with making LLMs **operable at scale**. As an added benefit, **each of the experts can live on a different GPU**, and their outputs can be reconciled to form the final output.

## How It Works

Transformer networks consist of a **multi-headed attention block** and then a regular **feed-forward neural network (FFN)**. The attention mechanism is what makes transformers work so well and is typically left alone (this is not always the case, we'll come back to this later). Where MoE comes into play is the later part: the feed-forward neural network. This is possible because the **FFN part** of the Transformer is usually sparser, a consequence of overfitting avoidance.

We have established that we have some experts in our network (for instance, **Mixtral has 8 of them**). We have also established that the whole point of using them is to avoid using all parameters of the neural network. It follows then that **not all experts are utilized at all times**, so we need a way to decide which experts are utilized and which are not. Importantly, this routing decision is made at the **token level, not the sentence or prompt level**. This means that within a single sentence, the word "apple" might be processed by one set of experts, while "pie" is routed to an entirely different pair.

This decision is up to the **gating function**. A typical gating function takes in the input (containing the embedding), multiplies it by a bunch of weights it has learned during training, and passes it through a [softmax function](https://alexgherghe.com/articles/why-are-llms-non-deterministic.html). This softmax function outputs a **probability distribution** denoting which experts would be best suited for the task at hand. From this, we pick the **top-N experts** (the top 2 experts in the case of **Mixtral**) and send them the token. To keep training and inference efficient, systems often enforce an **expert capacity limit**, which is a cap on how many tokens a single expert can process in a batch. If too many tokens get routed to the same expert, the excess tokens might be dropped or sent to the next best expert to prevent bottlenecks. This **probability distribution** is also taken into consideration when combining the output of the experts: the outputs of the experts with a larger probability are given more weight in the final answer.

<div id="moe-interactive" style="margin: 40px 0; user-select: none;">
<div class="moe-widget">
<div class="moe-widget__title">Interactive: MoE Token Routing (Top-2 of 8 Experts)</div>
<div class="moe-canvas-wrap">
<div class="moe-canvas-inner" id="moe-canvas">
<svg class="moe-svg" id="moe-svg"></svg>
<div class="moe-node moe-node--token" id="moe-token"><span class="moe-node__label" id="moe-token-label">Token</span><span class="moe-node__sub" id="moe-token-sub">input</span></div>
<div class="moe-node moe-node--gate" id="moe-gate"><span class="moe-node__label">Gating<br>Network</span><span class="moe-node__sub">softmax</span></div>
<div class="moe-node moe-node--expert" id="moe-exp-0"><span class="moe-node__label">Expert 0</span><span class="moe-node__prob" id="moe-prob-0"></span></div>
<div class="moe-node moe-node--expert" id="moe-exp-1"><span class="moe-node__label">Expert 1</span><span class="moe-node__prob" id="moe-prob-1"></span></div>
<div class="moe-node moe-node--expert" id="moe-exp-2"><span class="moe-node__label">Expert 2</span><span class="moe-node__prob" id="moe-prob-2"></span></div>
<div class="moe-node moe-node--expert" id="moe-exp-3"><span class="moe-node__label">Expert 3</span><span class="moe-node__prob" id="moe-prob-3"></span></div>
<div class="moe-node moe-node--expert" id="moe-exp-4"><span class="moe-node__label">Expert 4</span><span class="moe-node__prob" id="moe-prob-4"></span></div>
<div class="moe-node moe-node--expert" id="moe-exp-5"><span class="moe-node__label">Expert 5</span><span class="moe-node__prob" id="moe-prob-5"></span></div>
<div class="moe-node moe-node--expert" id="moe-exp-6"><span class="moe-node__label">Expert 6</span><span class="moe-node__prob" id="moe-prob-6"></span></div>
<div class="moe-node moe-node--expert" id="moe-exp-7"><span class="moe-node__label">Expert 7</span><span class="moe-node__prob" id="moe-prob-7"></span></div>
<div class="moe-node moe-node--combine" id="moe-combine"><span class="moe-node__label">Weighted<br>Sum</span></div>
<div class="moe-node moe-node--output" id="moe-output"><span class="moe-node__label">Output</span></div>
<div class="moe-dot" id="moe-dot-0"></div>
<div class="moe-dot" id="moe-dot-1"></div>
<div class="moe-dot" id="moe-dot-2"></div>
</div>
</div>
<div class="moe-controls">
<button class="moe-btn" id="moe-route-btn">Route Token</button>
<span class="moe-status" id="moe-status">Click to route a token through the MoE layer</span>
</div>
</div>
<script src="../js/moe-widget.js"></script>
</div>

I have mentioned that MoE usually replaces the FFN after the attention heads. Given that there is a lot of experimentation ongoing in this field, there is a subset of MoE called **Mixture of Attention (MoA)** that deals with choosing the right attention heads for the job.

## What Is An Expert?

Since we have all these specialized sub-networks running around, what exactly are these experts... well... experts in? The answer, as always, is not that **straightforward**. The experts **do not map broadly to human-understandable domains** (like "expert in programming" or "expert in arts"). Instead, they usually end up being good at **very small subsets of diverse topics**. For example, an expert may be very good at both interjections and single-digit numbers.

## How MoE Are Trained / How Do Experts Become Experts?

During training, experts specialize in certain subdomains through a very advanced technique called "**dumb luck**". All these experts, as well as the **gating function**, are initialized with **random weights**.

This means that, almost at random, some incipient tasks are going to be routed to some experts. Some of them are going to be better at them due to their randomly initialized weights, and they are going to become even better in the **backpropagation** step. This is how specialization happens; there's nothing fancier than this.

Of course, there is a possibility that some experts will become better early and just **monopolize the router**. To prevent this **collapse of the model**, several techniques can be used during training. **Dynamic Routing Bias** is such a technique: the system memorizes which experts were used **recently** and gives a **positive bias** to the least utilized ones and a **negative bias** to the most utilized ones.

## Do They Need Less Memory?

The short answer is **no**. We still need to **load all the parameters of the model** into memory, as we may need to access them at any time. It also doesn't help with the **KV cache memory footprint**, which scales with sequence length and model dimension rather than the number of experts. However, **inference is indeed a lot faster and cheaper**, since we only use a fraction of the parameters for each inference.

## Takeaways

- **Size Matters, But It's Expensive**: Making monolithic LLMs larger drastically improves performance, but operating trillion-parameter models is prohibitively slow and computationally expensive.
- **Divide and Conquer**: Mixture of Experts (MoE) optimizes this by splitting the feed-forward portion of the Transformer into multiple smaller, specialized sub-networks called "experts."
- **Dynamic Routing**: A gating function evaluates each token and routes it to only the most relevant experts (like the top 2 in Mixtral). This keeps inference costs manageable by activating only a fraction of the total parameters at any given time.
- **Alien Specialization**: Experts don't align with broad, human-understandable domains like "history" or "programming." Instead, they specialize in arbitrary, narrow subsets of data.
- **Emergent Expertise**: Experts aren't assigned their roles manually. They find their niches organically through random initialization and backpropagation, guided by techniques like routing bias to prevent any single expert from monopolizing the workload.

If you want to read more, I highly recommend the [Mixtral Paper](https://arxiv.org/pdf/2401.04088) and [A Comprehensive Survey of Mixture-of-Experts](https://arxiv.org/pdf/2503.07137).