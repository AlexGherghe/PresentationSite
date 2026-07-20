---
title: "Your Brain: Use It Or Lose It "
date: 2026-07-21
tags: [Computer Science]
excerpt: "The more we outsource thinking on a regular basis, the less capable we are of it."
---

## The Shift

I want you to think of something that you used to do and that was **tedious**. For me, it was Sudoku puzzles. I used to do them on my phone during commutes, and I genuinely enjoyed the focus they required. A few weeks ago, I tried one again. I didn't have the patience to see it through, I kept wanting to just look up the answer. If you've been doing agentic coding for a while now, try something similar. You might notice that you don't have the same patience and focus that you used to. If that's right, that should **trigger an alarm in your head**.

## Outsourcing Thinking 

Agentic coding tools enabled us to do something we've never been able to do before: **outsourcing thinking**. And it's really tempting to do it, it's the path of least resistance to being done with your tasks. Depending on how long you've been using them, you might be in one of the following phases: 
1. **The Skeptic**: You're gaining experience with agents just now. They keep making mistakes. You don't trust them and you're constantly steering them. You're giving them small pieces of work. 
2. **The Enthusiast**: You're starting to trust them. You're giving them larger pieces of work. You're still learning how everything works and you're building a mature harness. 
3. **The Agent Dispatcher**: You're creating specs with the agents and then sending them to implement those specs. The results are mostly fine and only require minimal interventions from time to time. This enables you to work on multiple things in parallel. 

This last phase is the **most dangerous** one in my opinion. You have a decent amount of trust in the agents' output. You're juggling three things at once, **skimming** diffs instead of **reading** them, approving PRs because the tests pass and the summary looks right. It feels productive. It feels like you've leveled up. But this is when outsourcing thinking is at its **most tempting** and its **most dangerous**. 

Let's say you have an issue with your implementation or need to do something new. What will you do? Ask the agent to give you a few choices and you go with what seems best. **That sounds reasonable, right?** Or maybe the agent refactors a chunk of your code and you glance at the diff, see that the tests pass, and approve it **without really understanding** the tradeoff it made.

Biology teaches us a very harsh lesson: **use it or lose it**. This is true for our muscles, and the principle holds for our brains too, even if the mechanisms are different. Neuroscience calls it **synaptic pruning**: neural pathways that don't get used regularly are weakened and eventually removed. Your brain is constantly reallocating resources away from skills you're not exercising. And being laser-focused on a single thing and being able to dissect and analyze an issue is indeed a skill you will get rusty at. The problem is that these are two of the most important skills a senior developer can have. These skills can **make or break** your career. 

## What's there to do? 

I'll throw a cliché at you here, are you ready? 
**The first step to solving a problem is admitting there is one.** 

This is, in my opinion, the most important step here and the entire reason why I'm posting this. I want you to be more aware of when you're doing the thinking versus when the agent is doing the thinking. The right balance should be **you doing most of the thinking** and the **agent doing most of the execution**. Of course, this is idealistic. But there are some concrete things you can do to nudge yourself in the right direction.

### Think Before You Prompt

This is the simplest change you can make, but it's also the one that pays off the most. Before you type a prompt, **take a few minutes to think about the problem yourself**. What are the possible approaches? What are the tradeoffs? Where could things go wrong? 

**Form an opinion first**, then ask the agent. If the agent suggests something different from what you had in mind, now you have a real reason to think critically about it. That's a completely different exercise than reading a solution cold and going **"yeah, that looks fine."** One is **analysis**, the other is **rubber-stamping**.

### Do Code Reviews Without The Agent

When you're reviewing a pull request (yours or someone else's), try doing it **without any AI assistance**. Read the code. Understand the flow. Spot the edge cases yourself. This is one of the best exercises for keeping your analytical skills sharp, because it forces you to build a mental model of someone else's code from scratch.

What I do is give the PR to an agent as well in parallel, but **not read the output until I'm done** with my own review. This reduces the odds that I'll be biased by the agent's review, while helping me miss fewer things. 

### Set Aside Focus Time

Set yourself a Pomodoro-like timer where you have 25 minutes of **pure focus time**. Old-school, artisanal, hand-coding with **no LLM** to help you. Will you be slower in the short run? **Perhaps, marginally.** But this is a small price to pay to keep your brain sharp.

The point isn't to be a purist about it. The point is to **make sure you're still capable** of solving problems on your own when you need to. Because you will need to. In an interview, during an outage, or when the agent is confidently wrong and you need to know enough to catch it.

### Do Hard Things On Purpose

Pick up a side project where you don't use any AI. Solve some LeetCode problems **(I know, I know)**. Work through a chapter of a book on a topic you find difficult. The specific activity doesn't matter that much, what matters is that you're **exercising your problem-solving muscles** in a context where there's **no shortcut available**.

Think of it like going to the gym. Nobody goes to the gym because carrying groceries is hard. You go because you want to be in shape for everything else. Same principle here.

## My Thoughts

I'm not writing this from an ivory tower. I'm writing this because **I caught myself slipping** and it bothered me. I noticed I was reaching for the agent before I even tried to think about a problem. I noticed I was less patient with things that required sustained focus.

Agents are not going anywhere, and they shouldn't. But a tool is only as good as the person using it, and if that person's skills are quietly eroding, the tool starts doing more harm than good. **Stay sharp.**
