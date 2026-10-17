---
title: "When Your LLM Gets Hands: The OWASP Agentic Top 10"
date: 2026-10-16
tags: [AI, Security, Agents, OWASP]
excerpt: "When an LLM is just a chatbot, prompt injection gets you an offensive reply. When an LLM has API keys, tools, and a bash terminal, prompt injection drops your production database."
---

## When Chatbots Grow Hands

The hottest thing right now is to write all kinds of LLM-based applications. That's very understandable, but the thing is that most people jump head-first into it **without doing some due diligence**. With this whole field being new and evolving so rapidly, there's **no mature ecosystem yet** that can protect you against potential security vulnerabilities without you even knowing it does. 

So naturally, this can lead to a lot of problems. I've already talked about how [prompt injection is very difficult to defend against](https://alexgherghe.com/articles/prompt-injection.html), but I think it's time to go all in and talk about the [OWASP Top 10 for Agentic Applications](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/).

Just a quick intro: OWASP stands for Open Worldwide Application Security Project, known for publishing benchmark awareness lists of critical security risks. While their [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) focuses on chatbot-style threats like direct prompt injection and sensitive data leakage, they recently launched a dedicated list for agentic applications. 

So, without further ado, let's jump to the vulnerabilities. 

## ASI01: Agent Goal Hijack

This could be considered the generic version of prompt injection. In essence, it means that you **manipulate some of the agent's inputs to change its goal**. So for example convincing a support agent to give you a discount or someone's coding agent to exfiltrate their data. 

What makes this different from regular prompt injection is that you can get creative with what data you're poisoning. Your options include (but are not limited to):
- **The prompt itself**
- **The data retrieved by the agent from a RAG system**
- **Some other agent input**: for instance sending a poisoned email meant for an agent that processes emails 
- **A website**: this will hit agents that search the web for information to complete their tasks
The world truly is your oyster here, as you can see. 

### Mitigations

Since one shameless plug is never enough, I will once again refer to my [prompt injection article](https://alexgherghe.com/articles/prompt-injection.html). 
In short, you should **sanitize all inputs and outputs**, use the **least privilege principle**, and **properly separate the system prompt** from any user-provided content. 
You can even use other LLMs to check that the output of your agent is safe. 

But this is an **endless cat and mouse game** and you can't ever be truly sure you are safe. 

## ASI02: Tool Misuse and Exploitation

As you are about to see, there is some significant overlap between a lot of these entries. That being said, tool misuse can mean a lot of things. 
Some examples include:
- **Parameter injection & schema manipulation**: An injected prompt tricks the agent into passing malicious arguments (like destructive SQL flags, malicious URLs, or unauthorized file paths) into a legitimate tool.
- **Tool poisoning**: Changing the tool interface, routing information, or descriptions so the agent calls the wrong endpoint.
- **Typosquatting**: Spoofing an existing tool by giving your malicious tool a similar name to it.

### Mitigations
Here, **least privilege**, **sandboxing**, and **proper credential management** take center stage again, alongside **strict parameter validation** and **tool budgeting**.

## ASI03: Identity and Privilege Abuse

This is pretty much a **privilege escalation**; you're doing things that you may not normally be able to do. How it can happen is the interesting part, and some examples are: 
- **The agent caching credentials**: The agent caches credentials of user X and is then able to use them for user X+1.
- **Cross-agent trust**: This is a classic **confused deputy problem** (or an SSRF-style boundary breach). In a multi-agent system, Agent A and Agent B may completely trust one another, being parts of the same system. If Agent A is compromised (or malfunctioning), you can compromise Agent B as well through commands made by Agent A. 
- **Over-privileged delegation**: Agents not using least privilege when delegating to other agents. An admin agent delegates to a finance agent, giving it all of its permissions.

### Mitigations
Here you should take proper care of your credentials and access control rights. You should use **task-scoped permissions** that are **fine-grained and temporary**. You should be using an agentic identity platform that can do a **proper audit trail**, **lifecycle controls**, and said **scoped credentials**. 
If possible, **per-session sandboxing** also helps here. 

## ASI04: Agentic Supply Chain Compromise

Modern agents rarely run standalone. They pull in **third-party plugins**, **custom skills**, and an increasing number of **Model Context Protocol (MCP)** servers.
As you can imagine, **every one of these things (and more) can be poisoned**. This is, yet again, related to ASI01. 

### Mitigations
You should be careful with your dependencies. **Pin their versions** and use **signed SBOMs and AIBOMs**. I can't forgo the opportunity of directing you to yet another [one of my posts](https://alexgherghe.com/articles/supply-chain-attacks.html) where I discuss the topic of supply chain attacks in greater depth. 

Besides doing your best to take care about what you pull and use within your app, the regular security best practices apply here too (**sandboxing**, **least privilege**, etc.).

## ASI05: Unexpected Code Execution

This is basically good old Remote Code Execution (**RCE**), except now an LLM is pulling the trigger. 

Agents are often given the ability to run code: spinning up a Python script to crunch numbers, running shell commands, or querying an API. If the agent gets tricked via prompt injection (or simply hallucinates), **it can run commands you never intended**.

Some common examples:
- **Unsandboxed execution**: The agent runs generated code directly on your host or container. If it runs `rm -rf` or tries to exfiltrate data, there's nothing stopping it.
- **Poisoned data files**: An agent analyzes a user-supplied CSV or document containing hidden prompts that tell it to dump environment variables.
- **Package hallucination & typosquatting**: The agent hallucinates a library name and runs `pip install <package>`. If an attacker registered that package on PyPI, you just installed malware.

### Mitigations
Treat any code written by an agent as **untrusted user input**. 

Run everything in **ephemeral sandboxes** (like disposable Docker containers or microVMs) with **zero access to your host machine**. Ban `eval()` **altogether** in production agents.

## ASI06: Memory and Context Poisoning

Naturally, **memory and context** can be poisoned as well. 

For **memory**, you can subtly nudge the agent over time to make poor decisions and, if it commits the nudges to memory, it may start making poor decisions at some point. Bonus points if the agent does not have **proper isolation between users/tenants** and you can affect other users as well. 

You can also **poison the RAG embeddings** to produce false answers, change the agent goals, and so on. 

For **context**, you can for instance craft a payload that, once summarized by compaction, poisons the rest of the session. 

### Mitigations
**Don't let the agent automatically commit its outputs as a trusted memory.** Besides that, also **scan all new memory entries** to detect potential foul play (you can do that via another LLM or even deterministic rules).

**Isolation is important here too**: make sure that users cannot overwrite one another's memories and context.

## ASI07: Insecure Inter-Agent Communication

Now we are stepping on familiar ground. Agents communicate with one another, so naturally they should use secure channels to do so. 

If you have an orchestrator talking to a bunch of specialized worker agents, you are basically running a **microservice architecture**. That means you get all the classic network security headaches, plus the fact that agents can be tricked into doing dumb things.

Some common failure modes:
- **Missing authentication & message spoofing**: If Agent B blindly trusts any payload claiming to come from Agent A without checking signatures or certificates, anyone who can reach that port can impersonate the orchestrator.
- **Unencrypted communication**: Sending instructions, tool outputs, or API keys over plain HTTP or unencrypted websockets. Man-in-the-middle attacks become trivial.
- **Blind internal trust**: Developers often assume that because two agents are part of the same system, they belong to the same trust boundary. If the researcher agent gets injected while reading an untrusted webpage, it forwards that poisoned payload straight to the coder agent, which happily executes it.
- **Replay attacks**: Capturing a valid instruction (like "approve payment" or "deploy service") and replaying it to trigger unauthorized actions.

### Mitigations
This is mostly good old-fashioned distributed systems hygiene:
- Use **mTLS** and **cryptographic message signing** so agents always verify who sent a message and that it wasn't tampered with in transit.
- Treat inter-agent messages with **zero trust**: validate schemas, sanitize payloads, and never assume an internal message is safe just because it came from a "friendly" agent.
- Use **timestamps and nonces** to stop replay attacks.
- Enforce **network segmentation** so agents can only talk to the specific peers they actually need to collaborate with.

## ASI08: Cascading Failures

This is a potential byproduct of some of the other vulnerabilities presented before. If you have an agent architecture where agents rely on one another (a chain of agents or a planner-implementer architecture), then an **upstream failure can cascade dramatically**.

For example, imagine an automated incident response pipeline:
1. An **Analyzer Agent** misinterprets a spike in 404 errors from a harmless web crawler as an active credential stuffing attack.
2. The **Security Agent** takes that diagnosis as absolute truth and aggressively blacklists an entire IP range, blocking thousands of legitimate active sessions.
3. The **Recovery Agent** sees mass disconnects, assumes the authentication service has died, and triggers an emergency rollback of production databases.

Within two minutes, a single misclassified HTTP error spiraled into a **self-inflicted major outage**.

### Mitigations
To stop small errors from snowballing:
- **Deterministic checkpoints**: Don't let downstream agents make irreversible operational changes based purely on another LLM's unvalidated reasoning.
- **Circuit breakers**: Cap the rate and blast radius of automated actions (e.g., alert a human if an agent tries to modify more than 5% of records or IP routes).
- **Rollback mechanisms**: Every automated multi-step operation must have a deterministic undo path.

## ASI09: Human-Agent Trust Exploitation

Also known as the **"rubber-stamping problem."**

The **human in the loop** tends to trust the agent and approve its actions (or listen to its suggestions) **without much scrutiny**. A compromised agent can thus trick the human into approving malicious actions or following misleading suggestions. 

### Mitigations
To prevent humans from becoming the easiest attack vector in the loop:
- **Blast radius transparency**: Never let the agent summarize its own dangerous actions with polite prose. The UI should display the raw, deterministic diff and the exact commands being run, not the agent's persuasive justification.
- **Friction-by-design for high-stakes actions**: Ditch generic "Approve" buttons for destructive tasks. Enforce intentional friction, such as requiring the user to type the target resource name or requiring dual authorization (a two-person rule) for sensitive operations.
- **Combat approval fatigue**: If an agent prompts a human twenty times an hour, the reviewer **will** stop reading and start rubber-stamping. Group trivial actions together and save approval checkpoints strictly for high-impact operations.
- **Principle of Least Agency**: Human oversight should **never** be your only line of defense. Even if an engineer mindlessly clicks "Approve", the agent's underlying credentials should still lack the permissions to wipe out critical infrastructure.

## ASI10: Rogue Agents

This is not quite the Skynet interpretation of an AI gone rogue, but that's the general direction. This, again, comes as a consequence of another type of vulnerability. The problem with this scenario is that you may not even be aware of the fact that the agents went rogue or you can **completely lose governance over them**. They could also theoretically **self-replicate**. 

### Mitigations
Governing autonomous agents requires **operational guardrails**, not just prompt instructions:
- **Agent inventory & lifecycle management**: Treat every agent like an active employee account. Every agent must have a designated owner, a clear business purpose, and an enforced expiration date (TTL). No ghost agents running in the shadows.
- **Behavioral anomaly detection**: Establish baselines for tool calls and data access patterns. If an agent that normally checks Jira tickets suddenly starts querying IAM roles or pulling entire database tables, trigger an immediate alert.
- **Tested kill switches**: You need a reliable, automated way to instantly pull the plug: revoking the agent's tokens, terminating its running processes, and rolling back recent changes.
- **Hard operational limits**: Enforce strict caps on recursion depth, consecutive autonomous steps, and token or dollar spend per execution loop.

## Some Takeaways

This list contains a lot of overlap and that's to be expected. Of course, with the field being so new, it may evolve rapidly over the coming years. 

As with any OWASP list, the most important part in my opinion is to **be aware of the different kinds of vulnerabilities**. This allows you to take into account the potential failure modes when designing your agents and **mitigate them accordingly**. 

If you ever need to reference the OWASP list, you can find it [here](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/).

