---
title: "HTTP/3 is QUIC"
date: "2026-08-10"
tags: ["Networking", "HTTP", "Performance", "QUIC", "UDP"]
excerpt: "HTTP/2 fixed multiplexing, but TCP held it back. HTTP/3 ditches TCP entirely for QUIC over UDP."
---

For a long time, TCP was the gold standard when it comes to delivering messages reliably across networks. That's why every HTTP version was built on top of it. But there comes a time in every protocol's life when you just need more than it can deliver. TCP made HTTP slow at times in part due to how rigorous it is.  

## The Flaw in HTTP/2 (Head-of-Line Blocking)

HTTP/1.1 had a simple problem: one request at a time per connection. If you wanted to load a page with 30 resources, you either opened 30 connections (expensive) or waited in line. This was **application-layer head-of-line (HoL) blocking**, and HTTP/2 fixed it with **multiplexing**, letting multiple requests and responses fly over a single TCP connection at the same time. 

But no bottleneck is ever removed completely, it's just shifted somewhere else. In our case, that somewhere else was TCP. TCP doesn't know anything about HTTP/2's streams. To TCP, everything going through that connection is **one single, ordered byte stream**. It doesn't see "Stream 1" and "Stream 3" and "Stream 7." It just sees a pipe of bytes that must arrive in order.

So what happens when a single TCP packet gets lost? **Everything stops.** TCP's reliability mechanism forces the entire connection to wait until that missing packet is retransmitted and received. So your request is sitting there waiting to be processed, but it can't be delivered to the application because your other request lost a packet three segments ago.

This is **TCP-level head-of-line blocking**, and it's arguably worse than what HTTP/1.1 had. At least with HTTP/1.1, you could open multiple connections and a lost packet on one wouldn't stall the others.

Under good network conditions (low packet loss), this rarely matters. But on mobile networks, congested Wi-Fi, or anything with non-trivial packet loss, HTTP/2 can actually perform **worse** than HTTP/1.1.

## Why UDP?

If TCP is the problem, you might wonder: why not just fix TCP? You can certainly try, but you'll quickly find out that almost every device that's connected to the internet has a TCP implementation that has to be either updated or replaced. If you're still optimistic about changing TCP, look at the progress of IPv6.

So the QUIC designers at Google made a pragmatic choice: **build a new transport protocol on top of UDP**. UDP is very simple, it's basically "here's a packet, good luck." It doesn't guarantee delivery, doesn't guarantee order, doesn't do congestion control. But in a way that makes it simple to build upon. 

QUIC then implements everything you'd want from a transport protocol (reliability, ordering, congestion control, encryption) **in userspace, on top of UDP**.

## Where QUIC Sits in the Stack

To understand what QUIC actually replaces, it helps to compare the protocol stacks side by side.

With HTTP/2, the stack looks like this:

`HTTP/2 -> TLS 1.3 -> TCP -> IP`

If you're counting, that's two separate handshakes before you can send any data (the TCP handshake and the TLS handshake).

With HTTP/3, the stack looks like this:

`HTTP/3 -> QUIC (with TLS 1.3 built in) -> UDP -> IP`

QUIC effectively **merges the transport layer and the security layer** into one thing. There's no separate TLS negotiation sitting on top of a separate transport handshake. 
This is only part of the magic though. 

## OK, So What Makes QUIC Special?

### 1. True Independent Streams

This is the big one, the whole reason HTTP/3 exists.

In QUIC, **streams are a first-class concept at the transport layer**. QUIC doesn't just see a pile of bytes. It knows that byte range A belongs to Stream 1, byte range B belongs to Stream 3, and so on.

When a packet carrying Stream 1 data gets lost, QUIC retransmits it. But only **Stream 1** is stalled. Streams 2, 3, and 7 keep flowing as if nothing happened. The head-of-line blocking problem is gone.

Because QUIC owns the transport layer, it can also swap congestion control algorithms (Cubic, BBR, Reno, etc.) without waiting for an OS kernel update. This is a userspace protocol, so improvements ship with your application, not with your next OS release.

To solve retransmission ambiguity, QUIC separates **Packet Numbers** from **Stream Offsets**. In TCP, sequence numbers tie packet delivery directly to stream byte order. In QUIC, Packet Numbers strictly increase with every packet sent, so an ACK unambiguously identifies which packet arrived, while Stream Offsets preserve order within each individual stream.

HTTP/3 also replaces HTTP/2's header compression algorithm (HPACK) with **QPACK** (RFC 9204). HPACK was designed for TCP's single ordered byte stream, so it assumed headers always arrived in order. If you just dropped HPACK onto QUIC's independent streams, a lost header packet would block every other stream from decompressing its own headers, bringing the head-of-line blocking problem right back. QPACK solves this by decoupling header compression from stream ordering, so each stream can decompress its headers independently.

To illustrate how HTTP requests map to QUIC streams, I'll just quote the RFC: "A client MUST send only a single request on a given stream. A server sends zero or more interim HTTP responses on the same stream as the request, followed by a single final HTTP response [...] An HTTP request/response exchange fully consumes a client-initiated bidirectional QUIC stream. After sending a request, a client MUST close the stream for sending.".

### 2. Fast Handshakes (1-RTT and 0-RTT)

Remember how TCP + TLS 1.3 (without TCP Fast Open) requires **2 round trips** before you can send any application data? One round trip for the TCP handshake (SYN, SYN-ACK, ACK), and another for the TLS handshake on top of that. With a full TLS 1.2 handshake, it was even worse: **3 round trips**.

QUIC fuses the transport and TLS 1.3 cryptographic handshakes into a **single round trip (1-RTT)** by default. The very first packet the client sends includes the TLS ClientHello alongside the QUIC connection setup. By the time the server responds, both the transport connection and the encrypted channel are established—no complex OS-level extensions like TCP Fast Open required.

But it gets better. If you've connected to a server before, QUIC supports **0-RTT resumption**. The client uses cached session information from a previous connection to send encrypted application data **in the very first packet**, before the handshake even completes. The server hasn't re-confirmed the client's identity for that early data yet. This, of course, works if the server has cached your session information and didn't change cryptographic secrets, which is an important detail.

If your user is on a mobile network in another continent with **200ms RTT**, going from 2-RTT (400ms) to 0-RTT (0ms of handshake delay) is a massive difference. 
There's one catch with 0-RTT: because that data is sent before the handshake finishes, it's vulnerable to **replay attacks**. An attacker could capture that first packet and send it again. That's why 0-RTT is generally limited to safe, idempotent operations (like GET requests). You wouldn't want to replay a payment request.

### 3. Connection Migration

Here's a scenario: you're on your phone, watching a video over Wi-Fi. You walk out of your apartment and your phone switches to cellular. With TCP, your connection is dead.

TCP identifies connections by a **4-tuple**: source IP, source port, destination IP, destination port. When you switch from Wi-Fi to cellular, your source IP changes. As far as TCP is concerned, that's a completely different connection. So you need a brand new TCP handshake and brand new TLS handshake.

QUIC identifies connections using **Connection IDs** instead of IP addresses. When your phone switches networks and your IP changes, QUIC just sends a `PATH_CHALLENGE` frame to the server on the new path. The server responds with a `PATH_RESPONSE`, confirms the new path works, and the connection continues as if nothing happened. No new handshake, no interruption.

To prevent third parties or middleboxes from tracking a user as they switch networks, QUIC doesn't simply reuse the same Connection ID on the new IP. Instead, the client and server negotiate a pool of **un-linkable Connection IDs**, switching to a fresh ID when migrating paths so privacy is preserved.

### 4. Encrypted by Default

With TCP + TLS, encryption is optional. You can totally run plain HTTP over TCP with zero encryption, and plenty of internal services still do. TLS is a layer you add on top if you feel like it.

QUIC flips this around. **Encryption is mandatory and built into the protocol itself.** Every QUIC connection uses TLS 1.3.

But QUIC goes further than just encrypting the payload. It also **encrypts most of the transport headers**. With TCP, anyone on the network path can see packet sequence numbers, acknowledgment numbers, and TCP flags. With QUIC, almost everything except the Connection ID and a few bits needed for routing is encrypted.


## How Does The Browser Know?

Before we get into who's using HTTP/3, there's a practical question: how does the browser discover that a server supports QUIC in the first place? 

The most common mechanism is the **`Alt-Svc`** (Alternative Service) HTTP header. When you first connect to a server over HTTP/2, the server's response includes something like `Alt-Svc: h3=":443"`. This tells the browser: "Hey, I also support HTTP/3 on port 443. Try it next time." The browser remembers this and attempts a QUIC connection on the next request. There's also a newer approach using **DNS HTTPS records** (SVCB/HTTPS), which lets the browser discover HTTP/3 support even before the first HTTP connection.

## Is Anyone Using This? 

HTTP/3 became an official IETF standard in June 2022 (RFC 9114), and the heavy hitters have already gone all-in.

**Google** has been running QUIC in production since as early as 2013 (before it was even standardized). Every request to YouTube, Gmail, Google Search, and Google Maps uses QUIC if your browser supports it. **Cloudflare** enables HTTP/3 by default across its entire CDN. **Meta** uses it across Facebook and Instagram. All major browsers (Chrome, Firefox, Safari, Edge) support it natively.

## The Catch for Developers

QUIC comes with real-world trade-offs you should know about.

### Firewalls and Middleboxes

This is the biggest practical issue. Many corporate firewalls, older routers, and security appliances either **block UDP on port 443** entirely or rate-limit it aggressively. They were built for a world where UDP meant DNS or gaming traffic, not web browsing.

The good news is that browsers handle this gracefully. If a QUIC connection attempt fails, the browser silently falls back to HTTP/2 over TCP. 

### Debugging is Harder

With TCP, you could fire up `tcpdump` or Wireshark and immediately see what's going on: SYN flags, sequence numbers, retransmissions. With QUIC, you open Wireshark and see... **encrypted UDP packets**. 

To actually inspect QUIC traffic, you need to export TLS keys from the browser (using the `SSLKEYLOGFILE` environment variable) and import them into Wireshark. There are also QUIC-specific tools like **qlog** and **qvis** for visualizing connection state. It works, but the barrier to entry is higher than the old "just read the packet headers" approach.

Granted, if you got to the point where you need to debug QUIC traffic, you probably already have a pretty good idea of what's going on (and not a lot of options left).

### Server-Side Complexity

QUIC runs in **userspace**, not in the kernel. This means your web server (Nginx, Caddy, etc.) handles all the congestion control, retransmission logic, and connection management that the OS kernel used to handle for TCP. This can mean higher CPU usage on the server side, especially under heavy load. The implementations are maturing quickly, but it's worth keeping an eye on resource consumption if you're running at scale.

## My Thoughts

HTTP/3 is actually an exciting change that improves many aspects of how we transfer data on the web. It is also a very good example of building a new protocol on top of an existing unreliable one (UDP) to fix the shortcomings of a mature (TCP) one. 

That said, I think the real-world impact depends a lot on your use case. If your users are mostly on stable, low-latency connections with minimal packet loss, the difference between HTTP/2 and HTTP/3 will be marginal. Where HTTP/3 really shines is mobile, high-latency, and lossy networks, which, let's be honest, describes most of the world's internet usage.

Here are the key takeaways to keep in mind:

- **Transport + Security Fusion:** QUIC embeds TLS 1.3 directly into transport connection setup, reducing fresh handshakes to 1-RTT and enabling native 0-RTT resumption.
- **True Stream Independence:** Independent transport streams end TCP-level head-of-line blocking, supported by **QPACK** for unblocked header compression and decoupled Packet Numbers/Stream Offsets.
- **Connection Migration via CIDs:** Connections stay alive across network transitions (like Wi-Fi to cellular) using Connection IDs, with un-linkable IDs preserving user privacy.
- **UDP Userspace Agility:** Building on UDP allows rapid protocol evolution in userspace without waiting for OS kernel updates.

If you're building web services today, you probably don't need to do much. Most CDNs and cloud providers already enable HTTP/3 by default. The browser handles negotiation and fallback automatically. But it's worth understanding what's happening under the hood, because when someone asks you why their API calls are slow from a mobile client on a spotty connection, knowing that QUIC exists (and whether your infrastructure supports it) might save you a lot of debugging time.

## Further Reading 

If you're interested in the actual specs behind all of this, I recommend checking out the following resources:

- [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114) - HTTP/3 Specification
- [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000) - QUIC: A UDP-Based Multiplexed and Secure Transport Protocol

These RFCs are very information dense and MAY cause you a headache, so you SHOULD be careful reading them (see what I did there?).
