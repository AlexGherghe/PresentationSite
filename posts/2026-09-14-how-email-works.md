---
title: "How Email Works"
date: 2026-09-14
tags: [Networking, Email, SMTP, DNS]
excerpt: "You click send and the email just shows up on the other end. But between your outbox and their inbox, your message goes on a pretty wild trip."
---

## We Never Think About It

Email is one of those things you use **every single day** without ever wondering how it works. So how does it work? 

## The Actors 

The actors involved in email are:
- **You**, the wonderful email user 
- **Your email**
- **Your email client (or MUA - Mail User Agent)**, this is the app where you read and compose emails, for example **Gmail** or **Outlook**. 
- **The Mail Submission Agent (MSA)**, this is where your MUA sends the email to. It handles **authentication** and fixes minor formatting issues before forwarding to the next agent (into which it is generally bundled as well).
- **The Mail Transmission Agent (MTA)**, this does the **heavy lifting** of actually sending the email to the recipient's mail server. 
- **The Mail Delivery Agent (MDA)**, this lives on the recipient's server and receives the email from the MTA and stores it.
- **The Mail Retrieval Agent (MRA)**, it allows the recipient's MUA to read the email.

All of these agents, protocols, and infrastructure are **completely invisible to you** if you use an email provider like **Google** or **Microsoft**. If you want to avoid this, you have **two main routes**: 
1. You just **buy the domain** (for instance `alexgherghe.com`), choose a company that can **host the email infrastructure for you** (**Proton**, **Fastmail**, etc.) and you point your domain's **MX (Mail Exchange) records** to your chosen host.
2. Alternatively, you just **buy (or rent) a server** (or use a **VPS**) and you **set up the entire email infrastructure yourself**, including buying the domain, setting up the MX records, configuring the MTA, MDA, and MRA, and managing the server. This requires a lot of time (both for setup and maintenance) and you really need to know what you're doing, so **almost nobody does it**. If you're wondering what large enterprises do, then we can check what Adidas (it's just the first name that came to mind) does. A simple DNS lookup via `dig MX adidas.com` on Mac reveals that they're using **Microsoft** to host their corporate email infrastructure: `adidas.com.		28800	IN	MX	10 adidas-com.mail.protection.outlook.com.`

## The Road Your Email Takes 

Now that we know who all the actors are, let's trace the journey your message takes from your keyboard all the way to the other person's screen.

<div class="email-flow">
  <div class="email-flow__step">
    <div class="email-flow__node">
      <span class="email-flow__icon">✉️</span>
      <strong>Your MUA</strong>
      <span class="email-flow__desc">Gmail, Outlook, etc.</span>
    </div>
    <div class="email-flow__arrow">
      <span class="email-flow__line"></span>
      <span class="email-flow__label">SMTP · port 587 + TLS</span>
    </div>
  </div>
  <div class="email-flow__step">
    <div class="email-flow__node">
      <span class="email-flow__icon">📮</span>
      <strong>MSA</strong>
      <span class="email-flow__desc">Mail Submission Agent</span>
    </div>
    <div class="email-flow__arrow">
      <span class="email-flow__line"></span>
      <span class="email-flow__label">Forward message</span>
    </div>
  </div>
  <div class="email-flow__step">
    <div class="email-flow__node">
      <span class="email-flow__icon">📡</span>
      <strong>Sender MTA</strong>
      <span class="email-flow__desc">Mail Transfer Agent</span>
    </div>
    <div class="email-flow__arrow email-flow__arrow--branch">
      <span class="email-flow__line"></span>
      <span class="email-flow__label">MX lookup + SMTP relay</span>
    </div>
    <div class="email-flow__side-node">
      <span class="email-flow__icon">🌐</span>
      <strong>DNS</strong>
      <span class="email-flow__desc">MX records · mail servers + priorities</span>
    </div>
  </div>
  <div class="email-flow__step">
    <div class="email-flow__node">
      <span class="email-flow__icon">📡</span>
      <strong>Recipient MTA</strong>
      <span class="email-flow__desc">Port 25 + STARTTLS</span>
    </div>
    <div class="email-flow__arrow">
      <span class="email-flow__line"></span>
      <span class="email-flow__label">Deliver to storage</span>
    </div>
  </div>
  <div class="email-flow__step">
    <div class="email-flow__node">
      <span class="email-flow__icon">📥</span>
      <strong>MDA</strong>
      <span class="email-flow__desc">Mail Delivery Agent</span>
    </div>
    <div class="email-flow__arrow">
      <span class="email-flow__line"></span>
      <span class="email-flow__label">IMAP / POP3</span>
    </div>
  </div>
  <div class="email-flow__step">
    <div class="email-flow__node">
      <span class="email-flow__icon">📨</span>
      <strong>MRA</strong>
      <span class="email-flow__desc">Mail Retrieval Agent</span>
    </div>
    <div class="email-flow__arrow">
      <span class="email-flow__line"></span>
      <span class="email-flow__label">Return messages</span>
    </div>
  </div>
  <div class="email-flow__step">
    <div class="email-flow__node email-flow__node--end">
      <span class="email-flow__icon">✉️</span>
      <strong>Recipient MUA</strong>
      <span class="email-flow__desc">Message delivered</span>
    </div>
  </div>
</div>

### Step 1: MUA to MSA (Hitting Send)

When you click **Send** in **Gmail**, **Outlook**, **Apple Mail**, or **Thunderbird**, your **MUA** (Mail User Agent) packages up your message with the sender address, recipient address, subject, headers, body, and attachments. 

Your MUA then connects to your provider's **MSA** using **SMTP**. SMTP has been the backbone of email since **1982** (RFC 821, later updated by RFC 5321). This submission connection almost always happens on **port 587** with **TLS encryption**. 

The MSA requires you to **authenticate first** (using your username/password or **OAuth** credentials). Once authenticated, the MSA checks the message for formatting issues, stamps submission headers, and hands it off to your sending **MTA** (Mail Transmission Agent). In practice, email providers usually run the MSA and MTA **bundled together** on the same server.

### Step 2: The Sender's MTA Finds the Destination (DNS MX Lookup)

Your provider's **MTA** now has the job of getting the message to the recipient. It inspects the recipient address and needs to find out which other machine is responsible for handling mail for that recipient. 

The MTA runs a **DNS MX (Mail Exchange) lookup** for the recipient's domain.

The response returns one or more **MX records**, each containing a mail server hostname along with a **priority number**. **Lower priority numbers mean higher preference**:

```
example.com.  MX  10  mail1.example.com.
example.com.  MX  20  mail2.example.com.
```

The sender's MTA picks the server with the **lowest priority number** (**highest preference**), resolves its IP address, and initiates the transfer. If that server is unreachable, it **falls back to the next one**.

### Step 3: MTA to MTA (The SMTP Relay)

Once the sender's MTA resolves the recipient mail server's IP address, it opens a direct connection to the recipient's **MTA** on **port 25**. Modern MTAs will then use **STARTTLS** to opportunistically upgrade this connection to TLS, encrypting the message in transit (just like the MUA-to-MSA hop uses TLS on **port 587**).

The two MTAs have a short, structured conversation over SMTP:

1. **EHLO**: The sending MTA introduces itself (for example, `EHLO mail.yourprovider.com`).
2. **MAIL FROM**: "I have a message from `you@yourprovider.com`."
3. **RCPT TO**: "It's addressed to `someone@example.com`."
4. **DATA**: The sending MTA transmits the actual headers and message body.
5. **QUIT**: The transfer completes and the connection closes.

Depending on the network setup, your email might also pass through **intermediate relay MTAs** along the way. Each MTA that touches the message adds a `Received:` header to the top, creating a **traceable audit trail** of the route.

If something goes wrong (the inbox doesn't exist, the mailbox is full, or the server rejects the connection), the recipient's MTA responds with an **error code**. The sending MTA will queue the message and **retry delivery** for a while (typically up to **4-5 days**, per RFC 5321) before giving up and sending you a **bounce-back email**.

### Step 4: MTA to MDA (Delivery to Storage)

Once the recipient's MTA accepts the message, it **doesn't store it long-term**. Its only job is **transmission**.

It immediately hands the email over to the **MDA (Mail Delivery Agent)**, typically via **LMTP** (Local Mail Transfer Protocol) or by piping the message directly to a local process.

The MDA is the component that actually writes the email into the recipient's **storage mailbox** (such as a Maildir directory on a Linux server, a database, or cloud object storage). The MDA is also where **server-side delivery rules** run: it sorts mail into folders, checks spam filter tags, and handles any user-defined inbox rules.

### Step 5: MRA to Recipient MUA (Retrieving the Email)

The message is now stored on the recipient's mail server, but the recipient hasn't seen it yet. When they open their phone, laptop, or desktop client, their **MUA** needs to retrieve it from storage.

This is where the **MRA (Mail Retrieval Agent)** comes into play. The recipient's MUA talks to the MRA using one of two classic protocols:

- **IMAP (Internet Message Access Protocol)**: The **modern standard**. It **keeps the emails on the server** and **syncs state** across all devices. If you read or delete an email on your phone, your laptop reflects that change immediately.
- **POP3 (Post Office Protocol v3)**: The **older approach**. It **downloads emails to your local device** and historically deleted them from the server after download. This made sense in the dial-up era with a single desktop, but breaks down when you use multiple devices.

## What About Spam?

You might be wondering: if any server can just connect to another server and say "here's an email from `ceo@google.com`," couldn't anyone fake that? The answer is **yes, absolutely**, and that's exactly why email spam was such a nightmare for decades.

To fight this, three mechanisms were developed:

- **SPF (Sender Policy Framework)**: A DNS record that lists which servers are **authorized** to send email on behalf of a domain. If an email arrives from a server not on the list, it's **suspicious**.
- **DKIM (DomainKeys Identified Mail)**: The sending server **signs** the email with a **private key**. The recipient's server looks up the corresponding **public key** in DNS and **verifies the signature**. If it doesn't match, the email was **tampered with or forged**.
- **DMARC (Domain-based Message Authentication, Reporting and Conformance)**: A policy that tells receiving servers what to do when SPF or DKIM checks fail (**reject** the email, **quarantine** it, or just **report** it).

## Some Takeaways

- **The Agent Chain**: Your email moves from your **MUA** to the **MSA**, gets routed across the internet between **MTAs**, is stored by the **MDA**, and is retrieved onto the recipient's screen by the **MRA**.
- **SMTP** handles both **client submission** (**port 587**) and **server-to-server relaying** (**port 25**).
- **DNS MX records** are how sending servers find the right destination. **No MX record, no delivery**.
- **IMAP** keeps mail **synced across devices**, while **POP3** **downloads it locally**.
- **SPF, DKIM, and DMARC** form the defensive trio that keeps forged senders from **spoofing inboxes**.

The whole system is honestly a bit of a patchwork of protocols from different eras, held together by backwards compatibility and good-enough security extensions. But it works, and it's the backbone of how billions of people communicate every day.
