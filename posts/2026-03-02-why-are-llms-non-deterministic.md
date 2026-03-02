---
title: "Why Are LLMs Non-Deterministic?"
date: 2026-03-02
tags: [AI, LLM, Deep Learning, Transformer]
excerpt: "A deep dive into why Large Language Models can produce different answers even with the same input."
---

## Some Context

There's nothing inherently non-deterministic about neural networks. 
At a very basic level, if you train a classifier to tell you whether an image contains a cat or a dog, you would expect it to give you the same answer every time. 

But LLMs are largely considered to be non-deterministic. Let's define what we mean by that. 
In the context of LLMs, non-determinism is usually used to refer to the fact that, given the same input, an LLM can produce different outputs on different runs.

Sure, some people may argue that this is not true non-determinism because you did not have all the atoms in the universe aligned in the same way for both runs. 
We are not going to start a philosophical or semantic debate here, we're just interested in the computer science side of things. 

## Meet Softmax

In a neural network, each neuron's raw output is a number called a **logit**. To allow the network to model complex relationships, we need to break the linearity that arises from just multiplying the input by the weights and adding a bias. 
This is why the value of the logits is passed through something called an **activation function**. 

There is a particular activation function that we are interested in today, called **softmax**. The softmax function is used at the output layer of the model and serves an important purpose. 
Let's assume we have an LLM that needs to predict the next word in a sequence (for simplicity's sake, I will just abstract away the notion of token for the rest of the article). 
If the sentence is "The quick brown fox jumps over the lazy", the output layer would have a logit corresponding to each word in the vocabulary.
Let's say the value for **"dog"** is **1.4**, the value for **"car"** is **-2.1** and the value for **"cat"** is **0.6**.

Now what do you do? You can assume that the most likely next word is "dog", because it has a bigger logit.
Two questions still remain though:
1. How much *more* likely is it than "car" or "cat"?
2. **Most importantly**, how do you train the model? To train it, you need to be able to compute a loss function. This means that you need to be able to assess how far off its prediction was from the desired result. But what would that desired result be? If we *know* what the next word needs to be, we would ideally like to assign it a probability of 100%. How do you do that?

This is why softmax is used in practice.
Softmax is a function that takes a bunch of numbers and transforms them into probabilities that **sum up to 1**. 
The softmax function for a vector $\mathbf{z}$ of $K$ real numbers is defined as:

$$
\sigma(\mathbf{z})_i = \frac{e^{z_i}}{\sum_{j=1}^K e^{z_j}}
$$

In the case of LLMs, $z_i$ is the logit for the $i$-th word in the vocabulary, and $K$ is the size of the vocabulary.

So, going back to our example, **"dog"** would be assigned a probability of **0.68**, **"car"** would have a probability of **0.02** and **"cat"** would have a probability of **0.30**.
So this is what LLMs actually output, a probability distribution over the vocabulary. This distribution is then sampled to get the next word in the sequence. 
In our case, **"dog"** would be chosen **68%** of the time and so on. 

The softmax function is **not** some cutting-edge discovery. It has been around for a long time and has been used in the most basic multi-class classification problems.

## But What If We Could Instruct the Model to Be More Creative?

It follows logically that, if we want to make the model more creative, we need another hyperparameter. This hyperparameter is called **temperature**, and it is used to skew the probability distribution produced by softmax.
Here's the formula for softmax with temperature:

$$
\sigma(\mathbf{z}, T)_i = \frac{e^{z_i / T}}{\sum_{j=1}^K e^{z_j / T}}
$$

- A temperature of 1 leaves everything unchanged. 
- A temperature **less than 1** scales the logits up, increasing the difference between them. 
- By the time we reach a temperature of **0**, the agent **always** picks the word with the highest logit (this is treated as a special case called greedy sampling). 
- A temperature **greater than 1** scales the logits down, essentially flattening the distribution.

Let's go back to our example from before:

| Scenario | dog | car | cat |
| :--- | :--- | :--- | :--- |
| Initial Probabilities | 0.68 | 0.02 | 0.30 |
| Temperature = 1 | 0.68 | 0.02 | 0.30 |
| Temperature = 0.5 | 0.83 | 0.00 | 0.17 |
| Temperature = 0 | 1.00 | 0.00 | 0.00 |
| Temperature = 2 | 0.54 | 0.09 | 0.37 |

*Table 1: Effect of Temperature on Softmax Probabilities*


## How to Choose the Right Temperature

You know about temperature, but how do you choose the right temperature to shelter you from the storm? (Yes, that was a Sean Paul reference.)

There are no hard and fast rules here, so you should play around and see what works best for you.
As a general rule of thumb, if you need any form of precision, for example for coding, you should go for a **low** temperature, like 0.2.
As a frame of reference, some non-reasoning models used 0.7 as a default temperature.
If you need creativity, for example for writing, you should go for a **higher** temperature.

There is a catch here, though. Reasoning models (the ones that generate a chain of thought) **really don't like it** if you change their temperature. 
These models were trained via **Reinforcement Learning** to work best at the temperature of 1. 
What happens if you change the temperature is that the model's performance **drops significantly**.
Some providers, like OpenAI, don't even allow you to change the temperature for their reasoning models when calling their API. 

## The FLOPS Strike Back

So this is it? We can just make large language models **deterministic on demand**? 
Well, in the words of your least favorite TV show character, "If you think this has a happy ending, you haven't been paying attention".

At the end of the day, a large language model just manipulates numbers in a very complex way.
Those numbers are floating point numbers, which are *notoriously imprecise*. 
There are a lot of horror stories about floating-point numbers. Perhaps one of the most famous ones is the [Patriot missile failure](https://www.gao.gov/products/imtec-92-26), which was caused by a floating-point precision error.

But, even if imprecise, floating point operations should lead to **deterministic** results. So how could they be our culprit?
Funny you should ask that. Prepare for trouble, and make it double!
Another source of computer science horror stories comes into play here: **parallelism**.
Floating point operations *may* be deterministic if you execute them in the **same order**, but executing them sequentially is slow.

To perform the huge amount of computations required by an LLM, you have to **parallelize** all those operations.

When you combine these factors together, you run into a big problem. In floating-point arithmetic, `(a+b)+c` is **not always equal** to `a+(b+c)`.

Here's a piece of code to prove that:
```java
double a = 1.0e16;
double b = 1.0;
double c = 1.0;
System.out.println("(a+b)+c -> " + ((a+b)+c)); // prints 1.0E16
System.out.println("a+(b+c) -> " + (a+(b+c))); // prints 1.0000000000000002E16
```

Due to these differences, a different word may end up having a higher logit value. With LLMs being autoregressive (the current output influences future outputs), this can **change the rest of the output** as well.

All hope is not lost just yet. If you absolutely need deterministic results, there is a way, but it gets ugly.
In short, you need to force every operation to **run sequentially**.

So running inference on your CPU while making sure that your inference framework is **single threaded** should be a way to give you deterministic results.
This is more of a concept, as in practice it would be painfully slow. 

## Some Takeaways
So this is the **TL;DR** of this article:
LLMs output a probability distribution which then gets sampled to produce the next word.
You can skew this distribution with a hyperparameter called **temperature**.
If you set the temperature to **0**, something called **greedy sampling** happens, meaning that the model **always** picks the word with the highest probability.
The word with the highest probability may **not always** be the same because of imprecision in floating-point arithmetic combined with the parallel execution of operations.

---
