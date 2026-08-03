---
title: "Story Points Are Relatively Useless"
date: "2026-08-03"
tags: ["Agile", "Software Engineering", "Productivity"]
excerpt: "We are told story points have nothing to do with time, right before using them to plan our two-week sprint."
---

If you've worked in software for more than a few months, you've sat through a **planning poker session**. You've held those **Fibonacci cards**, squinted at a Jira ticket with three sentences of description, and tried to decide if it's a **3** or a **5**.

And at some point during that ritual, a thought probably crossed your mind: **"What are we actually doing here?"**

## The Unit That Measures Nothing

Story points are supposed to represent **relative effort and complexity**. **Not time.** Your Scrum Master will repeat this line with the conviction of someone reciting a sacred text.

But then sprint planning starts and someone says: **"We have 5 developers, we did 32 points last sprint, so let's plan for 30 this time."**

Hold on. If points aren't time, how did we just use them to fill a **two-week calendar window**? We aren't using kilograms to measure how tall someone is, so why are we using **"not-time" units** to plan a **time-boxed sprint**?

The answer, of course, is that everyone secretly treats **points as time**. They just won't admit it out loud.

## The Man Who Invented Them Agrees

Don't take my word for it. Look at what the creator of story points has to say.

**Ron Jeffries**, one of the original signatories of the Agile Manifesto and a key figure in the early **Extreme Programming (XP)** movement, famously apologized for inventing story points in a [2019 blog post](https://ronjeffries.com/articles/019-01ff/story-points/Index.html):

> **"I like to say that I may have invented story points, and if I did, I'm sorry now."**

Originally, Jeffries and his team used **"ideal days"** to estimate tasks (how long a feature would take if you had zero interruptions, zero meetings, and zero production incidents). But stakeholders kept getting confused when an "ideal day" took three real days to finish.

So Jeffries changed the terminology to **"points"** to create a **layer of abstraction** between estimates and calendar time. What happened instead? Organizations took that abstraction and turned it into a **bureaucratic monster**. Instead of preventing micromanagement, story points became the **ultimate tool for it**.

## 37,000 User Stories Say It Doesn't Work

You might think: "Sure, the theory is a bit wobbly, but story points still give us useful signal, right?"

A research team at **University College London** decided to actually check. In their [2022 paper](https://discovery.ucl.ac.uk/id/eprint/10151116/1/tawosi2022esem.pdf), they analyzed **37,440 user stories** across **37 open-source projects** from the TAWOS dataset, looking at how well human-estimated story points correlated with actual development time.

The results were **not great**.

A **strong correlation** between points and actual effort existed in only **7%** of the projects studied. For **58%** of projects the correlation was medium, and for **35%** it was low. In other words, for over a third of the projects, story points told you almost nothing about how long the work would actually take.

Now, this study specifically looked at open-source projects, so you could argue that corporate environments are different. But if anything, corporate settings have **more** interruptions, more meetings, more cross-team dependencies, and more context-switching than open-source work. If story points can't predict effort in the relatively focused world of open-source development, they're not going to fare better in your average enterprise sprint.

## Who Are They For? 

Story point estimations **don't help developers** in any meaningful way. If anything, I think it **hinders them** via the extra time spent estimating. 

I believe that a mature, well-oiled software development team is like a **probability cloud**: it collapses when it's measured. Every additional ceremony, estimation and so on that the team has to go through negatively affects velocity. And here lies the balance issue. 

The developers are not working in a vacuum. There are projects that need to be delivered, dependencies to other teams and stakeholders that need to know when things will get done. The whole management structure wants to have **predictability** because they have a plan to follow. This is largely who estimations serve. So this is the tradeoff: you can have **very accurate estimations**, but that means you will **deliver much slower**. The more time you spend estimating, the less time you spend actually developing the thing. 

## How About Repetitive Work? 

You can estimate some things really well if you've **done them before** and that's great. But if you're always doing something you've done before, you might want to ask yourself why your team is doing the same work over and over. 

Software projects generally aim to **innovate**, you can't be doing the same thing repeatedly. As such, you can't just easily predict most of the work that needs to be done from experience.

## Goodhart's Law Strikes Again

You've probably heard of **Goodhart's Law**: **"When a measure becomes a target, it ceases to be a good measure."**

The moment management starts tracking velocity to compare team performance or measure productivity, developers adapt. How? **Point inflation**. 

Can this be avoided? Sure, by **not using the measure as a target**. Especially one this easy to game. 

## Context Eats Estimates For Breakfast

Even if you fixed every cognitive bias in the room, story points would still struggle because they try to **measure the wrong thing**.

Most delays in software delivery don't come from coding complexity. They come from **everything around the code**. Waiting three days for a PR review. A dependency team that hasn't finished their API contract. A product manager who changes the requirements halfway through the sprint. An infrastructure issue that blocks your deploy pipeline for a day. A "quick" compliance review that takes a week.

A **1-point** label copy change can sit in limbo for five business days because legal hasn't signed off. A **13-point** feature rewrite can ship in two days because the developer has full context and zero blockers.

Story points try to capture **"complexity and risk,"** but they are fundamentally an estimate of the work itself in isolation. The actual calendar time a ticket takes is dominated by **external factors** that no amount of Fibonacci number negotiation can predict.

## An Alternative That Actually Works

So what do you do instead? Stop estimating individual tickets and just **slice work small and count what you complete**.

The catch is that this only works if you commit to **relentlessly slicing work small**. If a ticket takes more than a day or two, break it down further until it does. Once your tickets are roughly uniform in size, the count of completed tickets per sprint becomes your **throughput metric**.

Why does this work? Because when tasks are small and similarly sized, **the variance between them washes out**. You don't need to distinguish a 3 from a 5 when everything is roughly a 1. 

More importantly, **small tickets reduce risk naturally**. Small changes are easier to code, easier to review, easier to test, and easier to roll back if something breaks. And you reclaim every hour you used to spend negotiating Fibonacci numbers.

## My Thoughts

For what it's worth, I think that story points being very vague is a **good thing**. If the alternative is time-based estimation, that opens the door to **terrible micromanagement**. I've heard first-hand horror stories about estimations being treated as God-given truth and people being judged based on those estimations. 

But being very vague means that they are barely useful for anything other than sizing the task in comparison to other tasks in the backlog. The issue is that a lot of teams will try to use them for sizing the amount of work that fits in a sprint, turning them into a time measure. So is it time or not? 

Estimations are useful for management having some **predictability**, but even estimations should be taken with a **grain of salt** (unless you're willing to spend an obscene amount of time on the estimations themselves). And the higher up the management chain you go, the less they care about individual story estimates anyway. They just want to know when the project will be done.

Is there a magical solution? I can't think of one right now. The general direction would be this: balance the **time you spend estimating** with the **predictability it gives you**. If your stories are small enough, you might not need to estimate them at all. If you're agile enough (pun intended), you probably don't even have enough data to properly estimate yet.

Find your team's balance and work from there.
