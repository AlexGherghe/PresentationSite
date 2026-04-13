---
title: "Pitfalls of AI-Assisted Coding"
date: 2026-04-13
tags: [AI, LLMs, Software Engineering]
excerpt: "How to best use AI in your day-to-day software engineering tasks."
---
## The Wild West

For a long time, **software engineering had a well-defined set of best practices**. We generally knew what to do, how to do it, and when to do it.
These best practices **stemmed from years of experience** and were crucial for writing well-structured, maintainable code and making the best use of our time. 

Everything changed when the Fire Nation attacked (yes, I will continue referencing memes whenever I see fit). **Coding agents turned this order into chaos**. 
Most of what we knew about writing code has been turned upside down in the last few years and it now **feels like the Wild West**. 

## Why This Article Exists

There is this big wave of change and **nobody wants to be left behind**.

I have been fortunate enough to have the chance to work with almost all of the popular coding agents and models for a significant chunk of time.
I have exchanged ideas and experiences with a lot of friends.  
Through this, I have accumulated **some findings that I would like to share with you**. 
This article is probably going to be pretty long, so **feel free to use the "Contents" button if you are short on time**. 

## Straight To The Pitfalls 

These pitfalls are just **antipatterns** that I have personally encountered or I have talked to my engineer friends about. 

### 1. Not using every tool at your disposal. 
The agent landscape has evolved a lot since the early days and I like to think that nobody is copy-pasting code into ChatGPT and then copy-pasting the answer back into their projects. But now you need to make sure that your project is bulletproof. You need to have **rules**, **skills** and **project context** into your repository and your user space. Just as a brief refresher, most coding agents have two "storage spaces" for these context augmentation files. There is the project space (they live in your repository) and the user space (they live in your computer, somewhere in your user's home or in a directory like `~/.cursor`). The ones in your repository will only apply to the current project, so use them for things like "Do not add code to the X deprecated module". The ones in your user home apply across all projects, so use them for something like "Never commit without my explicit approval".

These context augmentation files are:
 - Project context: Think `CLAUDE.md`. This is **general info about the project**. "This is a bakery management application, it uses Java 25, it is split into Y modules" and so on. They give the agent easy access to information that it would otherwise have to look for.
 - Skill: Sometimes **project info** ("How to work with the bread baking module"), but oftentimes **actionable how-tos** ("How to deploy the application in the development environment"). They are **only loaded into context whenever they are needed**. This works via a short description at the top of the skill file. This description is always loaded into the context and tells the agent what they are and when to use them. Based on this description, the agent can decide to load the full skill file into the context whenever needed. 
 - Rules: They are **always loaded into the context**, they are things the agent should **always respect** ("Use star imports/ do not use star imports"). Will the agent always play by the rules? Probably not, they tend to sometimes ignore certain pieces of information, probably due to context rot and their intrinsic probabilistic nature. 

 For more information about how these came to be and what came before, check out my previous article about [the downfall of prompt engineering](https://alexgherghe.com/articles/what-happened-to-prompt-engineering.html). 

### 2. Omission of Corrective Action
 This feels extremely obvious in hindsight, but for me there was a point where something clicked and I started doing it. I could not tell you what clicked and why I had not been doing it before, but such is the way of us, non-robots. 

 The idea is simple: **whenever you observe an AI agent making a mistake, do something to make sure it won't happen again**. So let's say the agent wrote unit tests and you don't like the naming scheme it used. The natural impulse is to tell it to fix those names or go fix them yourself. What you should also do is to tell it "Remember to use the 'whatever' naming scheme in the future when writing unit tests". This is it, just **telling it to remember to do something in a certain way in the future** will make it add this piece of information to its memories (this is yet another text file it uses). This can save you a lot of time and frustration in the future. Of course, not every situation can benefit from this, but you should ask yourself "Could I prevent this from happening in the future?". 

### 3. Context Recycling 
Context is a very fragile and precious thing and you should be very mindful of what you put into it. Importantly, **you should avoid filling it up with unnecessary information**. There are a few things to keep in mind here: 

- **Do not reuse the same context when switching tasks**. You finished what you were doing and are about to jump to an unrelated subject? Perfect, **start a new chat** or use something like Claude Code's `/clear` to make use of a fresh context.
- **Use the undo button**. Almost all LLM wrappers have an "undo" button. If you look at one of your prompts, it will likely have an undo or edit button. If you are not sure where to find it, just look it up or ask the agent. What this undo button does is to restore the context (and sometimes the code) to the point before you submitted that prompt. You have submitted a prompt and then remembered something you should have also mentioned? The agent did not do what you wanted and you want to supply it with more instructions? **Reverting back to your original prompt and modifying it will always be better than adding information post-factum**. There is a famous principle brought up a lot when training AI models that I think is very relevant here: Garbage in, garbage out. If your instructions are a mess, the output will also be a mess. 

Why this matters? Firstly, **larger context = more expensive = bad**. The whole context is fed into the model when doing an inference step, so all those tokens are counted towards your bill. Then there is **context rot**, the output of an LLM degrades more the longer its context is. 

### 4. The Sunk Cost Fallacy 
It often happens that you tell your agent to do something, the agent does poorly and you spend a lot of time trying to correct what it did. It is oftentimes better to **start again from scratch**, armed with information about what went wrong, than to keep trying to fix what is already there. You should modify the specs or the prompt and try again. This goes hand in hand with the prompt undoing from above. 

Similarly, if you feel like the current task is not achievable through agentic means, your feeling may be right. By all means, try, you may be pleasantly surprised. But put a time limit on your efforts, you don't want to be pulled into an endless downwards spiral. 

### 5. Using Agents Excessively 
Agents are great, but they are not the be-all and end-all solution. You need some agency (see what I did there?) in how you use them. So there are a few things to keep in mind here: 

- **Using agents for trivial modifications**. Your IDE is probably going to rename a variable quicker and better than you asking your agent to do it. The same goes for other trivial changes. This is just a waste of time and resources. The only thing to keep in mind is that, if you modify the code manually, the agent may not be aware of the modifications and break them or act in weird ways. What I tend to do is to tell it that I renamed or modified something. 
- **Using agents for tasks that can be done via script**. There are a lot of tasks that are well-suited to scripts. They are typically repeated tasks that you want to automate. If, before agents, you would have created a script to copy a file from one machine to another, there is absolutely no reason to start using an agent for that now. You can always create the script with the help of the agent. You can ask the agent to run the script itself. But there is no reason to use an agent for a task that can be done via script. It is just more expensive and less reliable. This is a very good way to put some guardrails on your agent usage as well. 

### 6. Not Experimenting Enough 
This may seem confusing given the past point about using agents excessively, but it is true. I believe that **this is the best period to experiment** and things are only going to get uglier in the short to medium term. **Tokens are the cheapest they will be in the next years** and models are still relatively unrestricted. Most of us have access to powerful models for free or with a quota that allows for extensive experimentation. You should leverage that. You should experiment with what works, what doesn't work, what you like and what you don't like. 

I have already observed significant degradation in both cost structure and model quality in the past few months and I don't expect it to get better. Sure, there will always be a small window just after a fresh model launch in which the company will do its best to impress us, but otherwise they will have to start showing a path to profitability. This entails raising prices and lowering costs. 

So if you have some quota left and it is about to reset, try using multiple models to do the same thing. See which one does it best. Try to do the same thing in multiple ways. Just experiment, see what works and what doesn't. Any quota that you don't use up is just wasted. 

### 7. Prioritizing Speed Over Learning 

This is especially relevant for juniors. The illusion of speed is a dangerous trap. I will perhaps write a dedicated article about how the industry has regressed back to the point where it prioritises speed and volume over everything else. 

The point is, **it is very easy to outsource thinking to an LLM**. It is very easy to fall into the trap of trying to deliver as quickly as humanly possible. But **you should take a step back and think about your evolution as an engineer**. Are you actually learning anything? Do you know what the code that the LLM is writing is doing? Do you understand the implications of the changes it is making? Do you know why and how the code is working? 

The moderate increase in speed is probably not worth it. I have been close to falling into this trap myself. I would argue that the only way to get better at software engineering is to actually do the work yourself. And I would also like to argue that this serves both yourself and the company in the long run. 

So **from time to time, take a step back, put the LLM aside and do the work yourself**. I am talking about writing the code yourself. You may, of course, use the agent as a rubber ducky, as a pair programming partner, as a glorified search engine, but don't let it do the thinking for you. 

### 8. Forcing Yourself To Deliver End-To-End

This is going to be a controversial one. Feel free to disagree in the LinkedIn comments, I am very curious to learn more opinions on this topic. 

There have been a lot of people (most of them having a vested interest in selling you the idea) pushing the narrative that you can deliver features end-to-end in a purely agentic fashion. I have a lot of doubts about this claim. Perhaps this is possible for very small features or very simple (or greenfield) projects. But I have yet to see it working properly in a real-life scenario. Of course, this may change in the future, I am talking about the present.

Do you know what the most dangerous part about this is? The code usually **looks right**. It compiles and it may even pass the tests. I don't know if this is an issue with me particularly, but I am unable to review agent-written code with the same level of attention and involvement that I would have if I had written the code myself. And because of this, subtle issues may slip. And subtle issues are not necessarily small issues. 

I can second this claim with a personal anecdote. I have tried a bunch of times to get an agent to implement a feature for me (and in all of them I found that the quality of my output decreased significantly) and in one of them the agent wrote an SQL query. It looked right, it ran just fine and it gave correct results. But, if you were to run an `EXPLAIN` on it, you would see that it was not using the indexes that it should have been using. And this is just an anecdote. 

I feel like, by the time you properly review the code with the correct level of scrutiny, you could have just written the code yourself. By this I do not mean necessarily that you should write "artisanal code" (writing completely by hand), but you could write code in a more supervised way. 

### 9. Not Paying Enough Attention To The Specs

This is a continuation of the point above. If you want to deliver features end-to-end using agents, **you should leverage spec-driven development**. You should at least use planning mode in your favourite agentic IDE. Even better, you could use something like **OpenSpec**. The thing is that, to give yourself the best chance of success, you should be paying a lot of attention to what the agent wrote in those specs. You should review the document very carefully and correct any mistakes or inconsistencies. 

I felt compelled to write this point, even though I do not agree completely. To me, it is very difficult to know the implementation details in such a minute way without going through the nitty-gritty of the code. And again, by that point you could have just written the code yourself. Still, there are people who swear by this, so try it for yourself, you may like this workflow. 

### 10. Not Using Proper Guardrails

This is pretty much a given, but **giving your agent unconstrained access to everything is a recipe for disaster**. You want to give it access to the tools it needs, but not more than that. You should be very careful about the permissions you grant it. You should be very careful about what you whitelist. Otherwise things could end up badly. Using scripts and MCPs instead of letting it access the system directly is a good way to do that. But this point is more general and it applies to any tool you use. 

### 11. Not Using The Right Model For The Job 

For the longest time, I have been an advocate of using Opus for everything, especially as usage quotas were very generous (and Opus still wasn't downgraded yet). I believe that things will change pretty quickly and we will be forced to adapt to using cheaper models whenever possible. **For simple tasks, you could use Sonnet or even Haiku** (which are VERY cheap when compared to Opus). You will probably find that they are good enough. I still don't believe that they can be used for complex tasks. The main point is, if the agent has to do something very simple, switch to a cheap model if you don't have a very generous token budget. 

## Takeaways

We are still in that period when the new way of working is starting to crystallize. Everyone has their preferences, but I think that there are some points that are generally correct. 
They revolve around using the agent at its full capacity, but as a tool, not as a replacement. You should do the thinking and take care when it comes to giving the agent free rein. 

