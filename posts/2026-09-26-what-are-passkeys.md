---
title: "What Are Passkeys"
date: 2026-09-26
tags: [Security]
excerpt: "A lot of websites started to ask you if you want to use a passkey to log in, so what is that?"
---

## All My Homies Hate Passwords 

Passwords have been around for as long as the concept of logging into your account has existed, so it's clear that they did something right. 
They're a simple and intuitive concept, but they have a lot of **fundamental flaws**.

Let's start with the obvious: passwords are a **pain to remember**. To add insult to injury, they need to be complex enough to not be easily guessable, which makes them even harder to remember. 
So what do people do when confronted with this problem? They **reuse passwords across multiple websites**. That's a massive security risk, since it enables **credential stuffing** attacks, where your credentials on website X
get leaked and then attackers try to log in to website Y with the same credentials.

Password managers sort of solve this problem, but that's hardly the only issue passwords face. Passwords can still be **easily phished** if you're not paying attention. Someone will clone the website of a company, ask you to log in,
and steal your password. In most cases, this is what hackers actually do (yes, contrary to popular belief, they don't stare at screens of green code and then declare enthusiastically **"I'm in!"**, Hollywood lied to us all).
**Phishing works** because even the best of us can slip up once in a while, let alone the less tech-savvy population.

Passwords are also a pain to handle both **at rest** and **in transit**. Moving very sensitive data **over the wire** is something you want to avoid if at all possible. And storing them on servers is also not ideal; 
an attacker that gained access to your system can just steal them. Even if they're properly **salted and hashed**, getting them stolen is never a good time. 

## Enter Passkeys 

Passkeys rely on the Ol' Faithful of internet security: **public key cryptography**. The TL;DR is that there is a **public key** associated with you stored on the server and a **private key** stored on your device. 
To sign in, you **sign a challenge** provided by the server, the server verifies the signature, and you're in. 

"Passkey" is essentially a consumer-friendly marketing label. Under the hood, it's built entirely on open standards stewarded by the **FIDO Alliance** and the **W3C**. 

There are two main pieces that make up what engineers call **FIDO2**:
- **WebAuthn**: The browser JavaScript API that lets a website request or create credentials.
- **CTAP**: The protocol that lets your browser talk to authenticators (like a physical **YubiKey** via USB or NFC).

Historically, FIDO credentials were **device-bound**, meaning the private key was permanently trapped on a single piece of hardware. The real leap with passkeys was introducing **multi-device synced credentials**: your private keys are **end-to-end encrypted** and synced across your devices via your OS keychain or password manager.

Now for the more comprehensive story, there are a few actors you need to know about:
- **The User** (Believe it or not, that's you)
- **The Relying Party (RP)**: Hearing this very fancy term, you might be wondering what this novel concept is. Pay close attention, because this will be difficult to understand. **IT IS.... just the website you're trying to log into.** I love how every standard needs to come up with its own convoluted way of calling the application. 
- **The Client**: This is your browser or OS. It sits right in the middle, running the WebAuthn API so websites can't just talk directly to your security hardware.
- **The Authenticator** (This is the thing that stores the passkeys). It can be something like a USB key, but it's most likely something embedded in your device's OS, like the **FaceID/TouchID** systems on your Apple devices. 

### Signing Up 

When signing up with your passkeys, the frontend of the RP (the app) will ask for a **challenge** from the RP server. 
With this challenge in hand, it will go to the authenticator (via the browser) to create a passkey. Depending on its capabilities and what the RP frontend calls for, the authenticator may perform **user verification** 
(e.g. with **FaceID**, **TouchID**, or your phone's password) or not. The authenticator also needs an **RP ID** (essentially the domain of the website, like "adobe.com") and a human-readable name for the website. 

The authenticator then creates the passkey, generates a unique **Credential ID**, **stores the private key locally**, and returns the **public key**, the **Credential ID**, and an **attestation object** (a signed package proving the key was created securely). Depending on if the RP requires attestation and if the authenticator provides it, the authenticator may sign all of this with its **attestation key** (this comes with the authenticator). The server saves that public key and Credential ID, and you're good to go.

### Signing In 

Signing in is pretty similar. The RP's frontend asks the backend for a **challenge**. 

One neat thing here is that passkeys are **discoverable credentials** (historically called **resident keys**). The authenticator stores both the private key and your account details together. This means you don't even have to type your username first; your browser can just pop up an autofill prompt and let you pick your account.

With that challenge, it asks the authenticator for passkeys. It uses the website ID and, depending on the RP, it may require credentials with a certain ID or require **user verification** (**FaceID**, **TouchID**, or your phone's password).

The authenticator will typically ask the user to **authorize the use of this passkey** (and perform the verification). Then it will create the **signed assertion** that the RP's frontend will send to the backend to verify against your public key. 

### What Makes Them So Great? 

Passkeys solve a lot of the issues that passwords face:
- They are **phishing-resistant** because they're tied to a specific domain. The browser automatically enforces this, so even if you get tricked by a cloned website, it won't send your passkey.
- The sensitive part (the **private key**) is stored on your device, not on some servers. 
- Passkeys are **unique per website**, so you can't reuse them across different websites. This makes them **immune to credential stuffing**. 
- **You don't have to remember anything**. 
- Passkeys **can't be guessed**. 
- Passkeys **encourage MFA**. More often than not, you'll need to perform a **user verification** to use your passkey. This combines **something that you have** (your device) with **something that you are** (your fingerprint or face) or **something you know** (your phone's password).

### Where They Fall Short

You can't just simply log in on another device. Since they are stored on-device, they **need syncing** to be effective across multiple devices. Apple does this pretty well with **iCloud Keychain**, Google has **Google Password Manager**, and tools like **1Password** or **Bitwarden** work across different operating systems. But moving between completely different ecosystems can still feel clunky.

Then there's the question of **account recovery**. What happens if you lose your phone or wipe your laptop? If passkeys are your only login method and you have no backup device, websites usually have to fall back to older recovery options like email links or SMS codes, which puts you right back to square one.

If you need to log in on someone else's computer, you have to scan a **QR code** with your phone, which runs a quick **Bluetooth proximity check** to prove you are physically standing in front of the screen.

Another disadvantage is that they are a **new technology** and **not all websites support them yet**. Even for the ones that do, they seem pretty far away from getting rid of passwords altogether. The fact that nobody explains passkeys and you're just suddenly face to face with a **"Create a passkey for this website"** prompt doesn't help at all. 

## Some Takeaways

- **Passkeys are FIDO2 under the hood**: It is an open standard backed by the entire industry, not a proprietary lock-in.
- **Phishing is dead on arrival**: Because keys are cryptographically bound to the domain, phishing sites can't steal or replay them.
- **Syncing made them usable**: Moving away from strictly device-bound keys is what finally made passwordless auth viable for everyday life.
