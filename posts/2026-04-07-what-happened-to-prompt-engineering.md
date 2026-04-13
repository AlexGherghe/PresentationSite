---
title: "What Happened to Prompt Engineering?"
date: 2026-04-05
tags: [AI, Prompt Engineering, LLMs]
excerpt: "Prompt engineering was supposed to be the next big thing in AI. What happened?"
---
## Prompt Engineering

It has been a few years since the generative AI craze first began, and a lot has changed since then. I remember the chaos that ensued when ChatGPT was released. Everyone was trying to predict the future of the job market, debating which jobs would still exist, and analyzing the skills that would keep us relevant.

I vividly remember people talking about **prompt engineering** and how it would be the "next big thing." People were eagerly signing up for courses, and companies were explicitly posting job openings for prompt engineers. The consensus seemed to be that we would need an army of **"AI whisperers"**, some specialists with the unique skillset to make LLMs understand exactly what we wanted.

## What Was It? 

Naturally, I was curious, so I looked up what prompt engineering **actually** entailed. At its core, the discipline was an elaborate compendium of tricks, hacks, and patterns designed to (hopefully) coax better output from LLMs. 

These tricks included, but were not limited to: 
- **Elaborate user personas**: *"You are an expert car mechanic with 30 years and 5 months of experience, 4 kids, and a loving wife; tell me why my car goes 'pr pr prrrrr' when I try to start it."*
- **Few-shot prompting**: *"Here are some examples of how to answer this question: [...] Now answer this question: [...]"*
- **Chain-of-Thought prompting**: *"Let's think step by step."* 
- **Emotional Stimuli / Tipping**: *"My career depends on this, and I'll tip you $200 for a perfect answer."*

## Back to 2026

Fast forward to today: how many of you are official prompt engineers, or even work alongside one? I'm guessing not many. I know **I** don't. 

So what happened to it? For starters, **the LLMs themselves got better**. Providers began baking the very tricks we used directly into the models. There is no longer a need for an elaborate Chain-of-Thought prompt when the model is capable of reasoning step-by-step on its own. Today's system prompts readily contain complex user personas and profound operational rules, instructions that would have been incredibly difficult to convey in a single prompt back in 2022. 

There are still niche cases where knowing how to craft a precise prompt is useful, such as utilizing few-shot prompting for strict formatting or highly specific outputs. But as a discipline? It is far from holding its ground. These are techniques you can now learn in an evening over a beer. 

## The Rise of Markdown 

Lately, the focus has shifted definitively from **writing better prompts** to **context augmentation techniques**. Simply put, markdown files seem to be all the rage. These markdown files generally take a few forms: 

- **Rules**: The contents of a rule file are *always* loaded into the agent's context. Because of this, they are used sparingly for universal constraints (e.g., *"Always commit after making modifications"*, *"Always run the tests before committing"*).
- **Skills**: The contents of a skill file are loaded into the agent's context *only when needed*. They encompass specialized knowledge that an agent may require on demand (e.g., *"How to use the Git API"*, *"How to use the Docker API"*).
- **Planning artifacts**: Popular agentic development frameworks (which, in essence, are just orchestrated groups of skills) like Superpowers or BMAD save their intermediate outputs as markdown files. The agent might conduct a brainstorming phase and summarize its thoughts in an artifact. The subsequent planning phase then references that artifact, and the cycle continues.

Techniques such as **Retrieval-Augmented Generation (RAG)** are also heavily relied upon to inject massive amounts of relevant data directly into an agent's context window. 

The goal now is no longer about writing elaborate prompts; it's about providing the agent with **as much high-quality context as possible, in an automated fashion**. 

## Takeaways

**Prompt engineering as a standalone discipline is dead**, but the foundational ideas behind it live on. The quirky "tricks" that worked back in 2022 quickly became obsolete because the end-agents simply improved. 

Today, **context is king**. We are intensely focused on autonomously curating and feeding agents high-quality context rather than meticulously hand-crafting prompts. 

Software engineers are expected to be comfortable with these context augmentation techniques and leverage them to deliver quicker. The concept of a "prompt engineer" was, to some extent, merged back into the role of a software engineer. 

For now, this paradigm takes the form of **rules, skills, planning artifacts,** and **RAG**. Though, knowing the rapid pace of AI, I am sure that in a few years, we'll be looking back and chuckling at how we used to do things back in 2026.