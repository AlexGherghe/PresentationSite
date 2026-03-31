---
title: "What's Up With All These Supply Chain Attacks?"
date: 2026-03-28
tags: [Security, Supply Chain Attacks, Vulnerabilities]
excerpt: "Diving into the recent supply chain attacks and what we can do to protect ourselves."
---
## Supply Chain Attacks

Recently, there have been a lot of supply chain attacks in the news. This large volume of attacks caught my attention, so here I am, writing this article.

## What is a Supply Chain Attack?

We're way past the point of writing our own code for everything. It would simply not be feasible to do so at the scale at which we operate today. 

Almost all applications today rely on a **large number of third-party libraries**. Those libraries, in turn, depend on other libraries and so on. This creates a complex web of dependencies that is very difficult to reason about.

Some of those 3rd party libraries are maintained by large corporations. Others are maintained by foundations, while some are maintained by small teams or even single individuals. 

> A **supply chain attack** is an attack that targets one of these libraries. 
> 
> Attackers need to compromise a single library in this complex chain in order to compromise entire applications. 

A single well-placed line of code in a popular library can infect thousands of applications, so well-executed supply chain attacks are very dangerous.

## What Happened Now? 

What triggered me to write this article is the recent news about the <a href="https://snyk.io/articles/poisoned-security-scanner-backdooring-litellm/" target="_blank" rel="noopener noreferrer">**LiteLLM incident**</a>. 

In short, versions `1.82.7` and `1.82.8` of LiteLLM, a popular open-source library for working with LLMs, were compromised. 
- The attackers initially compromised the **Trivy vulnerability scanner** used in LiteLLM's CI/CD pipeline. 
- When the pipeline ran, the malicious Trivy binary exfiltrated the project's PyPI publishing token.
- The attackers used this token to upload malicious packages directly to PyPI. 
- The malicious code contained a **credential stealer**, but fortunately, it was detected quickly and the affected versions were removed within a few hours.

Perhaps the most famous supply chain attack is the <a href="https://www.fortinet.com/resources/cyberglossary/solarwinds-cyber-attack" target="_blank" rel="noopener noreferrer">**SolarWinds attack**</a>, where attackers compromised the build process of SolarWinds' Orion platform. Through these malicious builds, they were able to gain access to the networks of a lot of SolarWinds' customers. There were some large names involved, including the US Department of the Treasury, the Department of Homeland Security, and Microsoft.

Why are these attacks so frequent? I believe this is a game of numbers: there are a lot of possible targets and a successful attack can have a huge impact.

## Attack Vectors 

**1. Compromised Dependencies** 
One of the most common vectors of supply chain attacks.
- **Social Engineering:** In the <a href="https://www.sonatype.com/blog/npm-chalk-and-debug-packages-hit-in-software-supply-chain-attack" target="_blank" rel="noopener noreferrer">attack on the `chalk` and `debug` npm packages</a>, attackers took control of a maintainer's account through social engineering (yes, 90% of hacking boils down to some form of social engineering). 
- **Long-term Infiltration:** Someone may act as a regular contributor for long periods to gain trust and maintainer privileges, then execute the attack (e.g., the <a href="https://www.akamai.com/blog/security-research/critical-linux-backdoor-xz-utils-discovered-what-to-know" target="_blank" rel="noopener noreferrer">**`xz-utils`** attack</a>). 
- **Protestware:** Legitimate maintainers may go rogue and turn their software into protestware (e.g., <a href="https://www.sonatype.com/blog/npm-libraries-colors-and-faker-sabotaged-in-protest-by-their-maintainer-what-to-do-now" target="_blank" rel="noopener noreferrer">the `colors.js` and `faker.js` npm packages</a>).

**2. Typosquatting** 
This entails publishing malicious packages with names that are similar to well-known packages. Think of something like `spring-data-jpa` vs `spring-data-gpa`. 

**3. Dependency Confusion** 
An attack where an attacker publishes a malicious package with the same name as an internal package, but in a public registry. 
- **Example:** Let's say you work for "MyCompany". An attacker could publish a package called `mycompany-auth` in Maven Central. If your build system fetches packages from both a private registry and Maven Central, it might fetch the malicious package from Maven Central instead of your internal registry.

**4. Compromised Build Systems** 
If attackers gain access to your build system, they can inject malicious code directly into the build artifacts. This is what happened in the SolarWinds attack.

## What Can You Do About It? 

There is little you can do to completely prevent a very well-executed supply chain attack. However, there are several things you can do to **mitigate the risk**.

**Apply Security Best Practices**
- Write your code securely and enforce the **principle of least privilege**. 
- Take care of the network firewalls protecting your application to limit the blast radius. 
- Focus on minimizing the odds that an attack will succeed. Malicious code will find it harder to exfiltrate data if strict network firewalls are in place.

**Scan Your Dependencies**
- Use vulnerability scanners regularly. 
- Consider a **"cooldown" strategy**: If a package you depend on does not have a pressing CVE, wait a few days before upgrading to a fresh new version.

**Work With Reputable Vendors**
- Any vendor could be compromised, but working with reputable vendors reduces the odds.

## Takeaways

- **Trust is a vulnerability**: Supply chain attacks exploit the complex web of third-party dependencies, turning a single compromised library or pipeline into a gateway to thousands of applications.
- **Attack vectors are diverse**: Attackers don't just write malicious code; they hijack maintainer accounts via social engineering, exploit CI/CD pipelines, publish typosquatted packages, and perform dependency confusion attacks.
- **Defense in depth is crucial**: While completely preventing these attacks is nearly impossible, strict security practices—such as enforcing the principle of least privilege and restricting egress network traffic—limit what malicious code can do once inside your system.
- **Update intelligently**: Scan your dependencies regularly, but consider implementing a "cooldown" strategy. Delaying non-critical updates for a few days can protect you from pulling in a freshly compromised version.