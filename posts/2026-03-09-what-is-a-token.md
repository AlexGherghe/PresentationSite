---
title: "What Is a Token?"
date: 2026-03-09
tags: [AI, LLM, Deep Learning, Transformer]
excerpt: "An exploration of what tokens are and what it means for your wallet."
---

## Some Context

We have all heard the term "token" thrown around in the context of large language models. 
The general understanding is that a token is *"sometimes a word, sometimes a piece of text smaller than a word"*.

As software engineers, we are of course intrinsically curious and motivated to understand the true nature of everything. 
But you know, there may be another less important and very small reason why you should care about what a token is (wink wink): MONEY MONEY MONEY. 

Usage of AI Agents is usually **billed by the token**, so you may want to know what you are actually paying for. 

## Tokens: The "What?" And The "Why?"

To understand tokens, we need to take a step back and understand what the inputs and outputs of a transformer are. 
Transformers, just like any other neural network, have an input layer and an output layer. These layers have a fixed size, which is determined by the architecture of the model. This size is called the **vocabulary size**. 

What happens is that the LLM does not see the actual letters of the sentence. You pass the sentence through a tokenizer, which gives you some token IDs. So for example the word "dog" could be a token with ID 12345.
The LLM then works with **these IDs, not the actual characters**. These IDs are then translated to vectors called embeddings, which are learned in the training process.

To understand why tokens are the way they are, you need to understand the two possible extremes:
1. The LLM could just use words as the inputs and outputs. The Oxford English Dictionary has 520,779 entries. If you want your LLM to speak Romanian as well, you would have to add about 120,000 words.
Rinse and repeat for all additional languages that your LLM needs to speak. We know that current LLMs are very large (hence the name), but how large? To give you some context, the Gemma 3 architecture
from Google has a vocabulary size of just over 262K tokens. If we wanted to use full words as tokens, then the vocabulary size would need to be much larger than that. Changing the vocabulary size changes the
size of the LLM's layers, making it much larger. So, if we were to use full words as tokens, our LLMs would need to be **MASSIVE**. 
But then what do you do if a new word gets invented? Your LLM would not have any way of representing, let's say, "delulu" or "rizz".
2. Then why not just use letters? Let's say our only tokens are the 26 letters of the English alphabet. We could represent any word with these 26 tokens and our model could be much smaller. The catch? 
To generate a word with X letters, you would need **X inference steps**. So to generate something like "I cannot afford RAM anymore", you would have to generate 28 times (27 characters in that sentence + the special token that represents the end of text).
As you can imagine, that is very slow. 

There is another very important factor to consider here: context size. Let's take the example above in both cases: If we use full words as tokens, the sentence "I can't afford RAM anymore" would occupy just 5 tokens from our context window 
(we can ignore spaces, because we can just consider that every word is followed by a space). With only letters as tokens, it would take 27 tokens of our context window. So you can imagine how quickly our context window would fill up. 

### The Sweet Spot 

To balance all these factors, most popular LLMs use subword tokenizers. So tokens are **usually part of words, but can be full words as well**.
Probably the most popular tokenization algorithm is BPE (Byte Pair Encoding), so let's see how it works. 

We'll just consider that our entire training dataset is the following sentence: "I cannot afford memory or a graphics card, I love this economy".

What BPE would do is to split this sentence into individual characters, and start merging into tokens the pairs that appear most frequently.

So our initial characters (our vocabulary) would be all the unique characters in the sentence. We will use `_` to represent the space character for better visibility.

<div style="display: flex; flex-direction: column; gap: 16px; margin: 32px 0;">
  <!-- Step 0 -->
  <div style="display: flex; gap: 24px; flex-wrap: wrap; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);">
    <div style="flex: 1; min-width: 200px;">
      <strong style="color: var(--text-primary); font-size: 1.1rem;">Step 0: Initial State</strong>
      <div style="margin-top: 12px; font-size: 0.95rem; color: var(--text-secondary);">
        <strong>Vocabulary:</strong><br>
        <code>I</code> <code>_</code> <code>c</code> <code>a</code> <code>n</code> <code>o</code> <code>t</code> <code>f</code> <code>r</code> <code>d</code> <code>m</code> <code>e</code> <code>y</code> <code>g</code> <code>p</code> <code>h</code> <code>i</code> <code>s</code> <code>,</code> <code>l</code> <code>v</code>
      </div>
    </div>
    <div style="flex: 2; min-width: 250px;">
      <div style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 8px;">
        <strong>Tokens:</strong>
      </div>
      <div style="line-height: 2.2;">
        <code>I</code> <code>_</code> <code>c</code> <code>a</code> <code>n</code> <code>n</code> <code>o</code> <code>t</code> <code>_</code> <code>a</code> <code>f</code> <code>f</code> <code>o</code> <code>r</code> <code>d</code> <code>_</code> <code>m</code> <code>e</code> <code>m</code> <code>o</code> <code>r</code> <code>y</code> <code>_</code> <code>o</code> <code>r</code> <code>_</code> <code>a</code> <code>_</code> <code>g</code> <code>r</code> <code>a</code> <code>p</code> <code>h</code> <code>i</code> <code>c</code> <code>s</code> <code>_</code> <code>c</code> <code>a</code> <code>r</code> <code>d</code> <code>,</code> <code>_</code> <code>I</code> <code>_</code> <code>l</code> <code>o</code> <code>v</code> <code>e</code> <code>_</code> <code>t</code> <code>h</code> <code>i</code> <code>s</code> <code>_</code> <code>e</code> <code>c</code> <code>o</code> <code>n</code> <code>o</code> <code>m</code> <code>y</code>
      </div>
    </div>
  </div>

  <!-- Step 1 -->
  <div style="display: flex; gap: 24px; flex-wrap: wrap; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);">
    <div style="flex: 1; min-width: 200px;">
      <strong style="color: var(--text-primary); font-size: 1.1rem;">Step 1: Merge 'o' + 'r'</strong>
      <div style="margin-top: 12px; font-size: 0.95rem; color: var(--text-secondary);">
        <strong>Vocabulary Added:</strong><br>
        <code>or</code>
      </div>
    </div>
    <div style="flex: 2; min-width: 250px;">
      <div style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 8px;">
        <strong>Tokens:</strong>
      </div>
      <div style="line-height: 2.2;">
        <code>I</code> <code>_</code> <code>c</code> <code>a</code> <code>n</code> <code>n</code> <code>o</code> <code>t</code> <code>_</code> <code>a</code> <code>f</code> <code>f</code> <code style="background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent);">or</code> <code>d</code> <code>_</code> <code>m</code> <code>e</code> <code>m</code> <code style="background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent);">or</code> <code>y</code> <code>_</code> <code style="background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent);">or</code> <code>_</code> <code>a</code> <code>_</code> <code>g</code> <code>r</code> <code>a</code> <code>p</code> <code>h</code> <code>i</code> <code>c</code> <code>s</code> <code>_</code> <code>c</code> <code>a</code> <code>r</code> <code>d</code> <code>,</code> <code>_</code> <code>I</code> <code>_</code> <code>l</code> <code>o</code> <code>v</code> <code>e</code> <code>_</code> <code>t</code> <code>h</code> <code>i</code> <code>s</code> <code>_</code> <code>e</code> <code>c</code> <code>o</code> <code>n</code> <code>o</code> <code>m</code> <code>y</code>
      </div>
    </div>
  </div>

  <!-- Step 2 -->
  <div style="display: flex; gap: 24px; flex-wrap: wrap; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);">
    <div style="flex: 1; min-width: 200px;">
      <strong style="color: var(--text-primary); font-size: 1.1rem;">Step 2: Merge 'c' + 'a'</strong>
      <div style="margin-top: 12px; font-size: 0.95rem; color: var(--text-secondary);">
        <strong>Vocabulary Added:</strong><br>
        <code>ca</code>
      </div>
    </div>
    <div style="flex: 2; min-width: 250px;">
      <div style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 8px;">
        <strong>Tokens:</strong>
      </div>
      <div style="line-height: 2.2;">
        <code>I</code> <code>_</code> <code style="background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent);">ca</code> <code>n</code> <code>n</code> <code>o</code> <code>t</code> <code>_</code> <code>a</code> <code>f</code> <code>f</code> <code>or</code> <code>d</code> <code>_</code> <code>m</code> <code>e</code> <code>m</code> <code>or</code> <code>y</code> <code>_</code> <code>or</code> <code>_</code> <code>a</code> <code>_</code> <code>g</code> <code>r</code> <code>a</code> <code>p</code> <code>h</code> <code>i</code> <code>c</code> <code>s</code> <code>_</code> <code style="background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent);">ca</code> <code>r</code> <code>d</code> <code>,</code> <code>_</code> <code>I</code> <code>_</code> <code>l</code> <code>o</code> <code>v</code> <code>e</code> <code>_</code> <code>t</code> <code>h</code> <code>i</code> <code>s</code> <code>_</code> <code>e</code> <code>c</code> <code>o</code> <code>n</code> <code>o</code> <code>m</code> <code>y</code>
      </div>
    </div>
  </div>
</div>

We repeat this process of merging the most frequently appearing adjacent tokens until we reach our desired vocabulary size.

If you want to play around with how different sentences are tokenized, OpenAI developed a free tool just for this: https://platform.openai.com/tokenizer.

## The Implications 

The fact that tokens are chosen based on what appears most frequently in the training dataset has some interesting implications:
1. Very common words tend to be their own tokens 
2. Languages that are better represented in the dataset tend to need fewer tokens to represent words. So a prompt in English will probably cost less than the equivalent prompt in Romanian. 
3. More popular programming languages would need fewer tokens than more niche programming languages, so vibe coding in Python will probably be cheaper than doing so in Golang.

## Some Takeaways

1. **Tokens are a balancing act:** They are the atomic units that an LLM reads and generates, perfectly positioned between full words (which would inflate the model's size) and individual letters (which would destroy inference speed and consume the context window rapidly).
2. **Data dictates tokenization:** Tokenizer algorithms like Byte Pair Encoding (BPE) build their vocabulary by iteratively merging the most frequent character pairs found in the training data.
3. **Token efficiency equals cost efficiency:** Because common languages (like English) and popular programming languages (like Python) dominate the training data, they require fewer tokens to represent. This means they eat up less of your context window and cost you less money to process!
