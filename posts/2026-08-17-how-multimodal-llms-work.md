---
title: "How Multimodal LLMs Work"
date: 2026-08-17
tags: [AI, LLM, Multimodal, Transformer, Deep Learning]
excerpt: "LLMs went from text-only to understanding images, audio, and video in a remarkably short time. Turns out the trick is simpler than you'd think: convert everything into tokens. Here's how images get chopped into patches, how audio becomes a spectrogram, and why some models are better at 'seeing' than others."
---

## Wait, They Can See?

Not that long ago, LLMs were strictly text-in, text-out. You typed a question, you got a text answer. If you wanted the model to look at an image, your best bet was to describe it yourself and hope for the best.

Fast forward to today and you can drop a photo of your fridge into a chat and ask "What should I cook for dinner?" and get a reasonable answer. You can upload a screenshot of an error message and get a fix. You can feed in a video and ask for a summary. 

What happened is that researchers figured out a very clever trick to make a text-based model process non-text data.

## The Universal Language of Tokens

If you've read my article about [what a token is](https://alexgherghe.com/articles/what-is-a-token.html), you know that LLMs don't work with raw text. They work with **tokens**, which are numerical representations of chunks of text. These tokens get mapped to **embeddings**, which are high-dimensional vectors that encode meaning.

This is the whole idea behind multimodality: transformers work with embeddings and embeddings are just vectors in a high-dimensional space. If you want your transformer to work with data other than text, you just need to figure out a way to convert that data into embeddings and feed them into the transformer alongside the text embeddings.

Of course, this is a very hand-wavy way of explaining it. The implementation details always involve some quirks, so let's see how this is done. 

## Teaching an LLM to See

So how do you turn a photo of your cat into something an LLM can read? The process has a few steps.

### Step 1: Chop the Image into Patches

A Transformer can't just take in a raw image. Applying attention to every individual pixel would be computationally insane, even by modern standards. Instead, the image gets divided into a grid of small, fixed-size squares called **patches**. Think of it like cutting a photograph into a grid of tiles, each maybe **14x14 or 16x16 pixels**.

If you have a 224x224 pixel image and you use 16x16 patches, you end up with a neat grid of **196 patches** (14 rows times 14 columns). Each one of these patches is the visual equivalent of a token. Just like BPE splits "unbelievable" into subword pieces, patching splits a scene into little squares of visual information.

### Step 2: Run Them Through a Vision Encoder

These patches need to be converted into embedding vectors. This is the job of a **Vision Transformer (ViT)**, often a pretrained model like **CLIP** or **SigLIP**. The encoder takes each patch, flattens it into a one-dimensional vector, and projects it into a high-dimensional embedding space.

But here's the thing: a flat list of patches loses all spatial information. If you shuffled the patches randomly, the encoder wouldn't be able to tell the difference. A patch of blue sky and a patch of green grass look the same whether the sky is on top or on the bottom. That's a problem.

To fix this, **positional embeddings** are added to each patch. The idea is simple: for each position in the grid (row 0 col 0, row 0 col 1, ..., row 13 col 13), the model maintains a **learned embedding vector** of the same dimension as the patch embeddings. When a patch is at position **(3, 7)** in the grid, its corresponding positional embedding gets **added element-wise** to the patch embedding before anything else happens. 

These positional embeddings are **learned during training**, not hand-crafted. The model figures out on its own what spatial relationships matter. After training, you can actually visualize them, and nearby positions tend to have similar embeddings, which is exactly what you'd hope for.

The patches then go through multiple layers of self-attention inside the vision encoder, where they exchange information with each other. By the end, each patch embedding carries context from the entire image.

### Step 3: Project into the LLM's Token Space

Here's the catch: the vision encoder and the LLM were trained separately. They speak different "languages". The embedding vectors from the vision encoder don't live in the same vector space as the LLM's token embeddings.

To bridge this gap, there's a **projection layer** (sometimes called a connector) that sits between the vision encoder and the LLM. It's usually something simple, like a linear layer or a small MLP, that maps the visual embeddings into the LLM's specific embedding space.

After this projection, the LLM receives the visual tokens as if they were just more text tokens sitting in its context window. It doesn't know the difference. It just sees a sequence of vectors and does what it does best: attend to them and generate the next token.

### The Cost of Seeing

This is where your wallet gets involved. Each image you send to a multimodal model eats up a chunk of your context window. A single image can consume anywhere from **258 tokens** (for small images in Gemini) to over **1,000 tokens** (for high-resolution images in GPT-4o). And just like text tokens, these visual tokens contribute to your [KV cache](https://alexgherghe.com/articles/kv-cache.html) and your bill.

## What About Audio and Video?

The same principles apply to audio and video as well. 

For **audio**, the raw sound wave is first converted into a **mel spectrogram**, which is basically a visual representation of how the sound's frequencies change over time. From there, a speech encoder (like OpenAI's **Whisper**) processes the spectrogram and produces embedding vectors. These get projected into the LLM's token space, and now the LLM can "hear".

For **video**, it's even simpler conceptually: a video is just a sequence of images. The model samples key frames at regular intervals, runs each frame through the same vision encoder pipeline described above, and adds **temporal position embeddings** so the model knows which frame came first. Some models also process the video's audio track separately and combine both streams.

Videos absolutely **demolish** your context window. If a single image costs 258-1000+ tokens and a video has hundreds of sampled frames, you can see how this adds up fast.

## Bolted On vs. Born With It

Not all multimodal models are built the same way. There are two broad approaches, and the difference matters.

### The "Bolt-On" Approach (Late Fusion)

This is the budget option. You take a **pretrained LLM** (already good at text), take a **pretrained vision encoder** (already good at images), **freeze both of them**, and train a small projection layer in between. This is essentially the **LLaVA** approach and its many descendants.

It's cheap and fast to train because you're only training the tiny bridge layer, not the entire model. But, of course, the quality of the results is lower than the "born with it" approach. 

### The "Born With It" Approach (Early Fusion)

This is the expensive option. You design the model from the ground up to handle text, images, audio, and video simultaneously. All modalities enter a **single, unified Transformer** and are processed together from the very start. This is the approach that **Gemini** and **GPT-4o** take.

Because the model was trained on all modalities at the same time, it develops a much deeper understanding of how they relate. It can notice that the text in a meme contradicts the image, or that a speaker's tone doesn't match their words. But this deeper understanding comes at a cost: training these models is **enormously expensive** because you need massive amounts of paired multimodal data and significantly more compute.

### The Middle Ground

In practice, even bolt-on models go through a second stage called **visual instruction tuning**. After the bridge layer is trained, the LLM itself gets fine-tuned on datasets of (image, question, answer) triplets. This teaches the model to actually follow instructions about visual content, not just acknowledge that an image exists. It doesn't close the gap entirely with native multimodal models, but it gets surprisingly close for a lot of everyday tasks.

## Some Takeaways

- **It's all tokens**: Multimodality works by converting images, audio, and video into the same kind of embedding vectors the LLM already understands. From the model's perspective, it's just more tokens in the sequence.
- **Images get patched**: An image is split into a grid of small patches (14x14 or 16x16 pixels), each treated like a visual "word". A Vision Transformer encodes these patches into embeddings, and a projection layer maps them into the LLM's token space.
- **Same trick, different encoders**: Audio uses a mel spectrogram and a speech encoder (like Whisper). Video is just a sequence of image frames with temporal position encodings. The playbook is always "encode, project, concatenate with text tokens".
- **Your context window pays the price**: Every image you upload eats hundreds of tokens. Videos can eat thousands. This directly impacts cost and the amount of space left for actual conversation.
- **Architecture matters**: Bolt-on models (late fusion) are cheap to train but read a secondhand translation of the image. Native multimodal models (early fusion) understand cross-modal relationships more deeply but cost orders of magnitude more to train.

If you want to read more, I recommend the [LLaVA paper](https://arxiv.org/abs/2304.08485), the original [CLIP paper](https://arxiv.org/abs/2103.00020), and the [Gemini technical report](https://arxiv.org/abs/2312.11805).
