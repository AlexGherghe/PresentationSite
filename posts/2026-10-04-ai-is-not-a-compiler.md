---
title: "Comparing AI to a compiler infuriates me"
date: 2026-10-04
tags: [AI, Career]
excerpt: "Compilers preserve logic across abstraction boundaries. AI guesses intent from ambiguous prompts. Comparing the two ignores the brutal verification tax of generated code."
---

## Shifting The Abstraction Boundary

One of the arguments you hear most often is that AI is just moving the boundary of abstraction even higher than it was before. I can't argue with that. But what infuriates me is when I hear people **comparing AI tools to the invention of the compiler**. 

In my view, that comparison is flawed for a few crucial reasons: 

1. **Compilers are deterministic and semantically bound**. You can always count on your compiler to do exactly what you tell it to do. With an LLM, you can give it the right instructions and it can **very well produce the wrong result**. 
2. **Natural language is ambiguous**. Code is very precise, it only has one meaning. That's not the case with natural language. If natural language was suited to writing precise specifications, **code would not have existed in the first place**. 
3. **Compilers still require you to think**. Even at a higher degree of abstraction, you still have to reason about how you're going to solve the problem and to write the solution. Sure, you can do that with an LLM as well, but you can also just present it with the problem and **it will do all of the thinking for you**. 

## Specification vs. Intent (Who Owns the Bug?)

When you write code in a compiled language, you are writing a **formal specification**. You define the data structures, the control flow, the inputs, and the edge cases. The compiler's only job is to **translate that specification into machine code faithfully**. 

If there is a bug in the compiled binary, the bug is in **your specification**. The compiler doesn't guess what you "probably meant" or invent business logic on your behalf. It executes your instructions **to the letter**.

Prompting an LLM is the exact opposite. You aren't giving it a specification; you're handing it **vague intent** in messy natural language. 

Because natural language is fundamentally ambiguous, the LLM has to **guess the specification for you**. It decides how to handle null checks, what error cases to cover, and how to structure the logic based on statistical likelihood. When something inevitably breaks in production, you're stuck debugging a specification **you never wrote and never explicitly agreed to**.

Even if you do give an LLM a very strict specification, there's **absolutely no guarantee that it will follow it**. 

## The Verification Tax (The Illusion of Speed)

When was the last time you ran a disassembler after compiling your code just to make sure `gcc` or `javac` didn't drop an authorization check or introduce an off-by-one error? 

Probably never. You trust the compilation step because compilers **preserve the exact semantics of your code** across abstraction boundaries.

With an LLM, code generation is practically free, but **verification is brutally expensive**. An agent can spit out 150 lines of complex code in two seconds, but that doesn't mean the feature took two seconds to build. You now have to sit down, read, mentally simulate, and audit 150 lines of code written by a **statistical autocomplete engine**.

In software engineering, **reading and auditing code is cognitively harder than writing it**. Comparing an LLM to a compiler completely ignores this verification tax. A compiler **eliminates low-level verification**; an LLM **creates an endless stream of it**.

## Where Does That Leave Us?

Compilers moved us up the abstraction ladder while **preserving our logic**. AI doesn't preserve logic; **it guesses intent**. 

That shifts our primary job from **writing code** to **verifying systems**. The bottleneck is no longer typing speed, but whether you have the technical depth to **spot the subtle bugs** an autocomplete engine introduces.

If you treat AI like a compiler, **you will ship hallucinations to production**. The tools change, but the rule stays the same: **you still have to understand how the machine works.**


