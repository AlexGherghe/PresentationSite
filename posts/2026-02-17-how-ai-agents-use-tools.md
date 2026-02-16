---
title: "How AI Agents Use Tools"
date: 2026-02-15
tags: [AI, Agents, Tools, Tutorial]
excerpt: "An exploration of how modern AI agents bridge the gap from text generation to performing real world tasks."
---

Large language models are neural networks that predict the next word (or token if you want to be technical) in a sequence of text. 
We are all familiar with them by now and we have all probably used them in some form or another. 

But something bugged me for a long time: how do these neural networks manage to do way more than just generate text? How do they edit text?
How do they look stuff up on the internet? How do they interact with other software?

It turns out that the secret lies in a fine distinction: simple LLM vs AI agent.

## What Even Is an AI Agent?

You would be forgiven for thinking that an AI agent is just a fancy name for a large language model (frankly I thought the same for a long time), but in reality it is a bit more than marketing jargon.

Getting past the schoolbook definitions, an **AI agent** is software that wraps around an LLM in order to enhance its abilities.

It is this agent that enables the LLM to interact with the world via tools.

## What Are Tools in the Context of AI Agents?

In essence, a **tool** is any external function that an AI agent can call to perform a specific task.
So for instance, if your favorite AI coding assistant can run code, it likely has a "code execution" tool that it can call with the code you want to run as an argument.

The catch is that the LLM itself does not execute anything, it just generates some text that essentially says "I need to call this tool".
*Yes, you read that right*, what is happening behind the scenes is that the orchestrator parses that text, detects a tool call and executes it.

## The Tool Use Loop

The fundamental pattern for tool use in AI agents follows a simple loop:


1. **User sends a message**
2. **Model processes the message**
3. **Model responds with "call this tool with these arguments"**
4. **Orchestrator executes the tool**
5. **Tool result is sent back to the model**
6. **Model processes the result**
7. **Repeat from step 3 until done**
8. **Model sends final response**


This is sometimes called the **ReAct loop** (Reasoning + Acting), where the model alternates between thinking about what to do and taking action.

## Defining Tools
The next logical question is: how does the model know what tools it has access to and how to call them? You just... tell it to the model.
*Seriously*, that's it, just give it a list of tool definitions in the prompt.

A tool definition should contain an identifier for the tool, a description of what it does, and a schema for the arguments it expects.

Here's an example of how a tool definition is passed to the OpenAI API, pulled directly from [their docs](https://developers.openai.com/api/docs/guides/tools/?tool-type=function-calling).
```json
{
  "type": "function",
  "name": "get_weather",
  "description": "Get current temperature for a given location.",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "City and country e.g. Bogotá, Colombia"
      }
    },
    "required": ["location"],
    "additionalProperties": false
  },
  "strict": true
}
```
Is this JSON just passed as-is to the model? Probably not, but the point is that the model receives a structured schema that describes the tool.

## Try It Yourself

If you want to play around with tools, I've put together a simple example that you can run locally, using Hugging Face's `transformers` library.
This code is also available on [GitHub](https://github.com/AlexGherghe/CodeDemos/blob/main/AiAgentTools.py).

```python
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
 
def get_weather(location):
    # just fake data for demo
    return {"location": location, "temperature": 22, "condition": "sunny"}
 
def run_demo():
    print("loading model...")
    # use whatever model fits in memory
    model_name = "Qwen/Qwen2.5-7B-Instruct"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        device_map="auto"
    )
    print("model loaded\n")
 
    # observe the tool related instructions in the system prompt
    system_prompt = """You are a helpful assistant with access to this tool:
- get_weather: Get the current weather for a location
 
To use it, respond with JSON: {"tool": "get_weather", "arguments": {"location": "city"}}
Otherwise, respond normally."""
 
    user_query = "What's the weather in Paris?"
 
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]
 
    print(">>> PROMPT:")
    print(f"System: {system_prompt}\n")
    print(f"User: {user_query}\n")
 
    # first call - should return tool call
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=256, temperature=0.7, do_sample=True)
    generated_ids = outputs[0][len(inputs.input_ids[0]):]
    resp = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
 
    print(">>> RESPONSE:")
    print(resp)
    print()
 
    try:
        # parse the tool call - imagine this is good parsing
        start = resp.find('{')
        end = resp.rfind('}') + 1
        tool_call = json.loads(resp[start:end])
 
        print(f"calling tool: {tool_call['tool']}")
        print(f"args: {tool_call['arguments']}")
 
        result = get_weather(**tool_call['arguments'])
        print(f"result: {result}\n")
 
        # now ask it to respond with the tool result
        messages.append({"role": "assistant", "content": resp})
        messages.append({"role": "user", "content": f"Tool result: {json.dumps(result)}. Now respond to the user."})
 
        print(">>> PROMPT (with tool result):")
        print(f"Tool result: {json.dumps(result)}")
        print("Now respond to the user.\n")
 
        text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer([text], return_tensors="pt").to(model.device)
        outputs = model.generate(**inputs, max_new_tokens=256, temperature=0.7, do_sample=True)
        generated_ids = outputs[0][len(inputs.input_ids[0]):]
        final_resp = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
 
        print(">>> FINAL RESPONSE:")
        print(final_resp)
        print()
 
    except Exception as e:
        print(f"error: {e}")
 
if __name__ == "__main__":
    run_demo()
```

## My Thoughts

Occam's razor wins yet again. The simplest explanation for how LLMs can do more than just generate text is that they are not doing it themselves, but rather calling external tools that do the actual work.
I find this both fascinating and underwhelming, there is something that feels almost primitive about parsing arguments from a text response, but such is the way of the LLM.

---