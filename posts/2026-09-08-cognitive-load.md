---
title: "AI Hugely Increases Cognitive Load"
date: 2026-09-08
tags: [AI, Software Engineering]
excerpt: "How we manage cognitive load has a huge impact on our ability to solve problems and write good code. Here are some ideas and observations I've gathered that help me keep my cognitive load manageable."
---

## AI Acceleration

You're probably already tired of people bragging about how much AI sped up their work. Debating those claims is a fool's errand, so I'll just state my opinion on the topic and we'll go from there: AI **moderately speeds up** the software development lifecycle, with variations depending on the type of project (**very low-level vs very high-level**), and more importantly the **size, age and complexity** of the codebase. 

What's certain is that you're **generating more code** and **working on more stuff** than you did before. This has the effect of increasing the strain on your already strained brain and, in my experience, leads to **burnout** and **lower-quality work**. I think we can agree that these two are not very desirable things, so what's there to do?

## What Is Cognitive Load?

The short version: your brain's working memory can only hold about **3-4 things at once**. Cognitive load is the total mental effort you're spending at any given moment. When the load exceeds what your working memory can handle, you start dropping things: you miss bugs, forget context, and make worse decisions. AI tools don't reduce this load, they **increase it** by giving you more things to juggle.

## What It Looks Like

Your day-to-day life probably looks like this: you have **several Claude Code (or your harness of choice) chats open at the same time**, working on different projects or different worktrees. When one of them finishes its work, you switch to it and you read the **awfully verbose and convoluted output** it produces (concise mode in Claude helps very little) and perhaps the code it wrote. Then you give it another command and/or do something else with what it produced (ask it to open a PR or correct what it did). In the meanwhile, you get pinged to **review another colleague's pull request**. While you do that, someone has a question for you or wants to talk to you about a potential issue with the app. 

Small digression to address the "but if you're reading the code, you're being too slow" crowd: It's true that agents can generate pretty good code now. It's also true that you can ask them to review code. My take is that **your name is still tied to the code you merge**. If that code breaks something, "but Claude wrote it and I had a good harness" **will not be an excuse that can save your job**. While you're still the one **responsible for the code you merge/approve**, it would be best for you to **actually read that code** and make sure it is up to snuff. 

With the digression ended, I will continue by saying that, after a few hours of **switching back and forth** between multiple Claude Code chats and Slack, **your brain is fried**. You may sustain this load for a while, but this will clearly **not fly long-term**. 

## My Advice

I'm not a medical professional of any sort, I'm just sharing my thoughts about what works for me. 

- **Limit the number of things you do at the same time**: You need to recognize that you're still a human with **human limitations**, and act accordingly. Limit the number of Claude sessions to a reasonable number like **2 or 3 max** (you're probably ending up forgetting about some of them anyway) and learn to **ask people to wait a bit** or direct them to the right person (depending on your role, this is either delegation or stopping yourself from trying to be a hero and solve everything yourself).
- **Prioritization is (even more) important**: This is closely tied to the prior point. Since you can't do everything, you need to decide what you actually need to do and **focus on that**. A very useful tool for prioritization is the [Eisenhower Matrix](https://www.eisenhower.me/eisenhower-matrix/).
- **Take some breaks**: It's pretty easy to get stuck into your work and forget to take a break. You being tired is definitely not good for you or your company, so take some breaks. Some people find a lot of success with the [Pomodoro Technique](https://todoist.com/productivity-methods/pomodoro-technique), working in **focused bursts of 25 minutes**, taking a **5-minute break** in between, and then a **longer 15-30 minute break** after every 4 cycles. 
- **Stop skimming the agent's output**: Not taking the time to properly read the agent's output can make you feel more productive. **That feeling is not true.** Skimming only makes you **more error-prone** and you end up **context switching even more**, which makes you even more tired. 
- **Only read the finished product**: Don't read agent-produced code (or even output in general) until it went through **all of the linting and agent review (and then fixing) steps**. You can integrate this into your regular workflow through a lot of means (like skills; for instance [superpowers](https://github.com/obra/superpowers) already does this).
- **Dump your mental context**: It's difficult to keep track of everything in your head. Use **to-do lists and notes** to organize your thoughts, they really helped me a lot.
- **Keep only what's essential**: More code is just **more code to read, review, and maintain**. AI makes it trivially easy to generate code, but every line you add is a line that increases your cognitive load down the road. The same applies to tests: obsessing over **coverage numbers** leads to a pile of low-value tests that **slow you down** without meaningfully improving confidence. Write the code you need, test the things that matter, and **delePte the rest**.

## Some Takeaways

- **You are single-threaded**: No matter how many agents you run in parallel, your brain can only process **one train of thought at a time**. Trying to juggle four Claude sessions, two PR reviews, and Slack will just **turn your brain into mush**.
- **Your name is still on the git blame**: Outsourcing the typing to an AI agent **doesn't outsource accountability**. If production breaks, "an agent wrote it" won't save you. Skimming output to feel fast is an **illusion that always bites back later**.
- **Filter the noise**: Don't waste mental energy watching an agent churn through intermediate attempts or rambling terminal outputs. Let automated linters and review passes clean up the draft first, and only spend your focus on the **finished diff**.
- **Offload your mental state**: Working memory is **tiny and volatile**. Dump your tasks, thoughts, and next steps into to-do lists and scratch notes so you don't burn energy trying to **hold everything in RAM**.

At the end of the day, AI tools are great for speeding up the mechanical parts of our jobs, but they also **multiply the noise**. Setting **hard limits** on how much context you juggle at once is the only way to **stay sane and keep shipping solid code**.
