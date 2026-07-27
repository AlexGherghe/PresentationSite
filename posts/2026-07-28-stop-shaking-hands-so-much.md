---
title: "Stop Shaking Hands So Much (Connection Pooling)"
date: "2026-07-28"
tags: ["Architecture", "Performance", "TCP"]
excerpt: "If you wouldn't re-introduce yourself every time you saw a coworker at the coffee machine, why are you doing it to your database?"
---

Imagine meeting a coworker at the coffee machine. If you re-introduced yourself with "Hello, my name is Alex, it is a pleasure to make your acquaintance" every single time you saw them in a day, they'd think you were completely unhinged. 

But that's exactly what your code does when you don't use connection pooling.

## The Handshake Problem

Every time two machines talk over the network, whether it's your app talking to a database, an external API, or a cache, they have to establish a connection first. This is more often than not (with the exception of streaming services) a TCP connection.

This involves a **TCP 3-way handshake** (SYN, SYN-ACK, ACK). If it's a secure connection, you also have to do a **TLS/SSL negotiation** on top of that. By the time the machines are finally ready to exchange actual data, you've already burned through precious milliseconds doing nothing but pleasantries.

This is fine if you only do it once every hour. But if **500 users** hit your API at the same time and each request opens a fresh connection, this constant handshaking will crush your application's performance.

## The Database Example

Most apps use databases and, as luck would have it, you have to establish a connection to them as well. If you open a fresh connection each time, the TCP handshake + authentication with the database can easily take some tens of milliseconds. Your actual query on an indexed column? Probably **under 1ms**. So you're spending **more than 90% of your time** just setting up and tearing down the connection. 

Without pooling, your timeline looks like this:
`[TCP Handshake] -> [TLS/Auth] -> [Query] -> [Close]`

With a connection pool, it looks like this:
`[Query]`

That's like spending 25 minutes commuting to a meeting that lasts 2 minutes.

Now multiply that by a few hundred concurrent requests, and your database server is drowning in connection setup overhead instead of doing its actual job: running queries.

## Enter The Pool

The fix is surprisingly simple. Instead of opening a new connection every time you need one, you create a **pool** of connections at application startup. These connections are pre-authenticated and ready to go. When your code needs to talk to the database, it **borrows** a connection from the pool, uses it, and then **returns** it. The connection stays open and alive, ready for the next request.

Think of it like a car rental at the airport. The rental company doesn't build a new car every time someone shows up. They have a fleet of cars parked and ready. You grab one, drive it, and return it when you're done. The next person gets that same car minutes later.

In the Java world, **HikariCP** is the go-to connection pool (and it's the default in Spring Boot). You configure it once at startup with your database URL, credentials, and a maximum pool size, and from that point on, every time your code asks for a connection, it gets a pre-established one from the pool. When it's done, the connection goes back to the pool instead of being destroyed. Of course, this is not a free lunch and can also have its own set of problems, which we'll discuss later.

## Not Just For Databases (HTTP Clients)

Connection pooling isn't just a database thing. If your service makes HTTP calls to other services (and in a microservices world, it almost certainly does), the exact same problem shows up.

A very common mistake is creating a new HTTP client for every single API call. That means a new TCP handshake, and if it's HTTPS (which it should be), a **full TLS negotiation** as well. TLS 1.3 requires at minimum **one round-trip** on top of the TCP handshake. TLS 1.2 needs **two** (though session resumption can sometimes reduce this). If your external service is on another continent, each round-trip can be **100ms+**. You're racking up hundreds of milliseconds in overhead before a single byte of your actual request is sent.

So what should you do? Create the HTTP client **once** and reuse it. Most HTTP client libraries (Java's built-in `HttpClient`, Apache HttpClient, OkHttp, Python's `requests.Session`) manage an internal connection pool under the hood. By reusing the same client instance, subsequent requests to the same host can use an existing connection via **HTTP keep-alive**, skipping the handshake entirely.

If you're using **HTTP/2** or **HTTP/3**, it gets even better. **HTTP/2** multiplexes multiple concurrent requests over a single TCP connection; **HTTP/3** does the same over QUIC (UDP). Either way, they eliminate the need for a massive pool entirely. Same idea as the database pool, just a different layer with smarter protocols.

The point is: **don't create a new client for every request**.

## The Need for Speed (Redis)

Connection pooling becomes even more critical when you're talking to something fast. And Redis is **fast**. A typical Redis `GET` command takes well **under 1ms** to execute. But if you're opening a new TCP connection for every command, you're adding **10-15ms** of handshake overhead on top of that. That means your connection setup takes roughly **30x longer** than the actual operation.

Many Redis client libraries (like Jedis in Java or redis-py in Python) support connection pooling out of the box. For these, the pattern is the same one we've been seeing all along: you create the pool once, borrow a connection when you need it, and return it when you're done. The connection stays alive and authenticated, ready for the next command.

If you're using Spring Boot with `spring-boot-starter-data-redis`, Lettuce is the default client. Interestingly, Lettuce doesn't even pool connections for standard commands by default. Because it's built on Netty, it's thread-safe and actually **multiplexes** concurrent commands over a **single shared connection** (just like HTTP/2!). This is even more efficient than a pool (pools are only strictly required in Lettuce for blocking commands like `BLPOP` or transactions). So if you're on Spring Boot and haven't done anything weird with your Redis configuration, you're getting world-class performance out of the box. But it's worth understanding **why**, because the performance difference is night and day.

## What Can Go Wrong

Connection pooling is not a "set it and forget it" deal. There are a few common ways it can bite you.

### Pool Exhaustion

Your pool has a **maximum size** (say, 10 connections). If all 10 connections are in use and an 11th request comes in, that request has to **wait** until a connection is returned to the pool. If your requests are slow or if traffic spikes, this queue grows, latencies shoot up, and eventually requests start timing out.

The tricky part is that pool exhaustion can feel like a database problem when it's really an application problem. Your database is sitting there perfectly healthy, but your app can't reach it because all the pooled connections are occupied. The fix is usually a combination of **right-sizing your pool** (not too small, not too large) and making sure your queries aren't taking longer than they should. And, of course, monitor and set alerts for your pool usage (Prometheus + Grafana).

A common rule of thumb for database pool sizing is **fewer connections than you think**. HikariCP's wiki has a [great article](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing) on this, and the gist of it is: a pool of **10 connections** can often handle more load than a pool of **100**. This is because databases often spawn an entire OS process for every connection (looking at you, PostgreSQL; MySQL uses threads instead, but the principle still holds), meaning too many connections will cause severe memory bloat and CPU context-switching overhead.

### Connection Leaks

This one is sneaky. A connection leak happens when your code borrows a connection from the pool but **never returns it**. Usually, this is because an exception was thrown before the connection could be closed, and the code didn't have proper error handling to ensure the connection was returned regardless.

Over time, leaked connections pile up. The pool thinks those connections are still in use, so it doesn't reclaim them. Eventually, the pool runs out of connections, and you're back to the exhaustion problem, except now it's caused by a bug, not by too much traffic. 

Most connection pool libraries have **leak detection** features. HikariCP, for instance, has a `leakDetectionThreshold` setting that will log a warning if a connection has been checked out for longer than a specified duration. **Turn this on in development and staging.** It will save you a headache down the road.

### Stale Connections

Firewalls, load balancers, and databases love to aggressively terminate connections that have been idle for too long. If your connection pool isn't aware that a connection was dropped, it will happily hand a dead connection to your application, causing your next query to fail instantly.

To fix this, connection pools let you set a maximum lifetime for connections. In HikariCP, this is the `maxLifetime` setting. A solid rule of thumb is to set this value slightly **lower** than the database or firewall's connection timeout. That way, the pool retires the connection before the network forcefully kills it.

### The Serverless Trap

Connection pooling assumes you have a long-lived application instance. But if you're running in a serverless environment (like AWS Lambda), your instances spin up and die rapidly. If 500 concurrent Lambdas spin up, they might open 500 separate connections to your database, completely bypassing any pool you configured inside the Lambda code. 

In serverless land, you usually need an external connection proxy (like AWS RDS Proxy or PgBouncer) sitting between your functions and your database to handle the pooling for you. This is effective because, as I mentioned earlier, connections to your database are expensive. Connections to the proxy are intentionally very cheap and the proxy handles a pool of the heavy database connections for you.

## My Thoughts

Connection pooling is one of those things that's easy to overlook when you're building something and everything seems to work fine with 5 users. But the moment you scale up, the handshake overhead becomes the bottleneck you never saw coming.

The good news is that most modern frameworks handle this for you if you let them. Spring Boot configures HikariCP by default. Most Redis clients pool connections out of the box. HTTP clients reuse connections internally if you don't keep creating new instances. The pattern is always the same: **create the thing once, reuse it many times, and make sure you return it when you're done**.

If you take one thing away from this, make it this: next time you suspect your service is opening a fresh connection on every request, stop and ask yourself how many times a second you're forcing two machines to re-introduce themselves. The answer will probably bother you.
