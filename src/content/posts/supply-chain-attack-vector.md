---
title: "Supply Chain: An Often-Underestimated Attack Vector in Cybersecurity"
date: 2026-06-16
tags: ["cyber", "supply-chain", "threat-intelligence"]
excerpt: "How the TeamPCP campaign turned a single CI/CD misconfiguration in Trivy into a multi-ecosystem supply chain compromise — and why trust-based attack vectors fall outside traditional vulnerability management."
featured: true
---

Supply chain attacks are not new. The concept of compromising a supplier to reach a better-defended target predates the digital age — it applies equally to physical logistics, hardware components, and software dependencies. What has changed is the density of the software dependency graph: the degree to which organizations, regardless of their security posture, run code they did not write, do not audit in real time, and execute with elevated privileges inside their own environments.

The TeamPCP campaign, which unfolded between February and June 2026, is useful not because it introduced novel techniques, but because it illustrated how structural weaknesses in the software delivery ecosystem compound across organizational boundaries. Trivy — Aqua Security's open-source vulnerability scanner — served as the entry point. What followed was a cascade that reached Checkmarx, BerriAI, Bitwarden, Telnyx, and dozens of others, not because those organizations were individually unprepared, but because they trusted a tool that had been weaponized.

This article uses the Trivy compromise as patient zero to examine how software supply chain attacks work structurally, why they produce disproportionate impact relative to effort, and what organizations can do about them.

**Key arguments**

- **Trust Relationships:** The attack vector in supply chain compromises is the trust relationship between entities — between an organization and its vendors, between a consumer and the packages it deploys, between an automated process and the source it pulls from. This is not a CVE, not a zero-day, not an unpatched system. It falls outside the scope of vulnerability management programs by definition, because there is no flaw to remediate — only a relationship to understand and harden.

- **Domino Effect:** Trust graphs propagate compromise without additional attacker effort. When one node is compromised, every dependent entity inherits the exposure — including mature, well-defended organizations that would be difficult or impossible to reach through direct attack. This is what makes software supply chain operations structurally high-ROI: the attacker invests once, and the network multiplies the reach.

- **Poor Visibility:** Attack propagation in this model outpaces most detection and containment cycles. The underlying constraint is ecosystem visibility: organizations that lack monitoring coverage across their software supply chain — what runs in their environments, what it connects to, what it has access to — cannot detect these attacks early enough. Limited visibility does not only delay detection; it degrades the quality of the response itself, leaving exposure windows open longer and making containment decisions harder to execute with confidence.

## The Actor and Its Toolkit

TeamPCP is tracked under multiple designations across the threat intelligence community: UNC6780 by Microsoft and Google GTIG, SHADOW-WATER-058 by Trend Micro. Earlier operational identities include PCPcat and DeadCatx3, with extortion and data leak operations conducted under the ShellForce and CipherForce brands.

The group's profile is notable less for technical sophistication than for operational efficiency. They combined open-source offensive tooling — TruffleHog for credential validation, Nord Stream for workflow exploitation — with custom-developed malware and a modular, iterative approach to payload development. This combination produces high ROI: the barrier to entry is low, the tooling is documented and maintained by the security community, and the custom components handle what commodity tools cannot.

Their motivation is financial: credential theft, data exfiltration, double-extortion ransomware. Their operational pace — moving from initial compromise to credential validation within hours, and from one compromised vendor to the next within days — points to an organized, fast-moving campaign rather than a targeted long-game operation.

## A Timeline of the Campaign

The compressed core — from first breach to multi-ecosystem supply chain poisoning — runs in under three weeks.

| Date | Event |
| :--- | :--- |
| Feb 20, 2026 | GitHub account `hackerbot-claw` created. Automated scanning of public repositories for misconfigured workflows begins. |
| Feb 28 | `hackerbot-claw` submits a pull request to Trivy. The misconfigured workflow executes and a high-privilege service account token is extracted. |
| Mar 1 | TeamPCP uses the stolen token to delete Trivy releases and publish a malicious VS Code extension. Aqua Security discloses the incident and begins credential rotation. The rotation is incomplete. |
| Mar 19 | Using the residual token, TeamPCP force-pushes malicious code onto 75 historical release tags and publishes backdoored binaries to GitHub Releases, Docker Hub, GHCR, and AWS ECR. Exposure window: approximately 12 hours. |
| Mar 19–20 | Stolen npm tokens from compromised pipelines seed CanisterWorm across 66 packages, 141 versions. |
| Mar 21–23 | Stolen GitHub tokens from Trivy pipeline runners used to compromise Checkmarx KICS. |
| Mar 24 | LiteLLM PyPI packages poisoned using tokens harvested from compromised pipelines. |
| Mar 27 | Telnyx Python package poisoned on PyPI. |
| Apr 23 | Bitwarden CLI npm package compromised via Dependabot pulling a poisoned Checkmarx Docker image — no direct Bitwarden targeting. |
| Jun 2026 | Shai-Hulud framework open-sourced on BreachForums. Affiliate campaigns (Megalodon, Miasma) begin operating independently. |

```
Aqua/Trivy ──→ Checkmarx ──→ Bitwarden CLI
      │
      ├──→ BerriAI/LiteLLM
      ├──→ Telnyx
      └──→ npm (CanisterWorm · 66 pkg)
```

## The Payload Progression

One source of confusion in media coverage of this campaign is the number of different malware names associated with what is, structurally, a single operation. They refer to the same activity at different stages of development. TeamPCP iterated their tooling continuously throughout the campaign, each version adding capability without replacing the underlying mission: harvest credentials, exfiltrate, propagate.

The evolution follows a recognizable pattern — start with a working monolith, modularize for operational flexibility, add self-propagation, then release the framework publicly to scale impact through affiliates.

| Name | Type | Wave | Capability Added |
| :--- | :--- | :--- | :--- |
| kamikaze.sh v1 | Credential harvester | Mar 19 | Memory scraping and filesystem sweep in a single script |
| kamikaze.sh v2 | Modular downloader | Mar 19 +2h | Separates delivery from payload; C2 can update the module remotely |
| SANDCLOCK / CanisterWorm | Infostealer + worm | Mar 19–20 | Self-propagation using stolen npm publish tokens |
| CanisterSprawl | Worm v2 | Apr 2026 | Rewrite with improved evasion; second npm ecosystem wave |
| Shai-Hulud | Attack framework | Jun 2026 | Full framework release, including AI coding assistant configuration poisoning |
| Megalodon / Miasma | Derivative campaigns | Jun 2026 | Affiliate-operated forks targeting new ecosystems |

*All variants share the same core credential exfiltration logic. The progression reflects operational iteration, not separate malware families.*

## Initial Access: How the Entry Point Was Created

Understanding the initial breach requires a brief context on what a CI/CD pipeline is and why it matters as an attack surface.

A pipeline is an automated script that runs every time something changes in a codebase — a new commit, a proposed modification, a release tag. It runs with production credentials because it needs to do real things: compile code, sign binaries, publish packages to registries. That makes it a high-privilege asset sitting in the middle of the software delivery chain.

GitHub Actions is one of the most common systems for running these pipelines. Workflows are defined in configuration files inside the repository and triggered by specific events. One of those events is called `pull_request_target`.

When an external contributor proposes a code change — a pull request from their own fork of the repository — the standard event runs the workflow in that fork's isolated context, without access to the base repository's credentials. The `pull_request_target` event behaves differently: it runs in the context of the base repository, with full access to its secrets, and it does this automatically, without waiting for a maintainer to approve anything.

Aqua Security's Trivy repository had a workflow using this trigger to check API compatibility between the official codebase and incoming contributions. To perform the comparison, the workflow also checked out and ran the code from the incoming pull request — the external fork — inside the privileged environment. The combination is the problem: an event that grants privileged execution, plus an instruction to execute code the attacker controls.

On February 28, `hackerbot-claw` opened a pull request. The workflow triggered automatically, ran the attacker's code inside Aqua Security's runner with access to all configured secrets, and extracted the org-scoped service account token — valid across 33 workflows in the Aqua Security GitHub organization.

After Aqua disclosed the incident on March 1 and initiated credential rotation, the process was not atomic. Not all credentials were revoked simultaneously, revocation was not verified end-to-end, and a valid token remained in the attacker's possession for 18 days after the public disclosure.

On March 19, TeamPCP used that residual token to authenticate directly as an administrator. No pull request, no workflow trigger, no code review. The access was not forced. It was granted, unintentionally, twice.

## The Kill Chain

**Reconnaissance**:

Automated scanning identified misconfigured `pull_request_target` workflows in public repositories. The Trivy configuration had been publicly flagged months earlier and remained unaddressed.

**Initial Access**:

The February 28 pull request triggered the misconfigured workflow, executing attacker-controlled code in a privileged environment and yielding the org-scoped service account token.

**Persistence Through Incomplete Remediation**:

The March 1 partial rotation left a valid credential active. This 18-day window is the structural bridge between the first breach and the supply chain poisoning. Without it, March 19 had no access path.

**Supply Chain Poisoning**:

The residual token enabled direct administrative access on March 19. Seventy-five release tags were simultaneously repointed to malicious commits with backdated timestamps and spoofed committer identities. Backdoored binaries were published to four distribution channels. The legitimate scanner ran in parallel — pipelines produced correct scan results while the credential harvester executed in the background.

**Credential Harvesting at Scale**:

Every pipeline that ran the compromised tooling during the exposure window executed the harvester. Credentials were collected from CI/CD runners and exfiltrated to attacker infrastructure within hours.

**Cascade**:

Harvested tokens were used immediately: npm tokens to deploy CanisterWorm, GitHub PATs to access Checkmarx repositories, PyPI tokens to publish malicious LiteLLM packages. Each compromised pipeline became a source of new credentials for the next target.

**Post-Compromise Exploitation**:

Validated credentials enabled systematic cloud environment enumeration, mass repository cloning, and interactive access to running containers. Workflow logs were deleted to remove forensic evidence.

**Institutionalization**:

The Shai-Hulud framework was released publicly in June 2026, extending the campaign's reach through affiliates without requiring direct actor involvement.

## The Cascade: One Token, Many Victims

The downstream impact of the Trivy compromise illustrates a property that distinguishes software supply chain attacks from most other attack categories: a single point of failure propagates through a trust network, not through a chain of vulnerabilities.

Checkmarx, BerriAI, and Bitwarden were not compromised because their individual security controls failed. They were compromised because they trusted a tool that had been weaponized, ran it inside their pipelines, and that tool harvested whatever credentials it found there.

The Bitwarden case is the clearest illustration of how far this extends. TeamPCP never directly targeted Bitwarden. They compromised Checkmarx's KICS Docker image. Bitwarden's Dependabot automation — a workflow that automatically updates dependencies — pulled that poisoned image during the exposure window. The KICS payload ran inside Bitwarden's pipeline, collected Bitwarden's publishing credentials, and the Bitwarden CLI was published to npm with TeamPCP's payload embedded.

No human decision was involved between the Checkmarx compromise and the Bitwarden package publication. The trust relationship was entirely between an automated workflow and a container registry.

This is the dynamic that produces high ROI for the attacker. Compromise one node in the trust graph, and every organization with a dependency — direct or transitive — on that node becomes a potential victim, independent of their individual security posture. The attacker's effort does not scale with the number of victims. The trust network does the propagation.

## Speed and Invisibility

Within hours of the March 19 deployment, harvested credentials were being validated against live cloud provider APIs. Within 24 hours, systematic cloud environment enumeration had begun across multiple victim organizations.

The campaign remained invisible for several compounding reasons. The backdoored Trivy binary ran the legitimate scanner in parallel — pipelines produced correct scan results while the harvester executed in the background. Poisoned release tags appeared identical to historical ones; malicious commits carried backdated timestamps and spoofed committer identities. Workflow logs were deleted after exploitation. And the tools that were compromised were the security tools — the ones organizations rely on to detect exactly this kind of activity.

The detection gap is structural: standard security controls are positioned to catch anomalous behavior. A trusted, signed binary executing a scan is not anomalous. A CI/CD runner making outbound connections is not anomalous. A release tag matching the expected version number is not anomalous. The attack was designed to stay inside the envelope of expected behavior for as long as possible.

## What You Can Do

The controls that would have interrupted this attack chain are structural, not primarily detection-based. Most are configuration changes with low operational cost.

**Prevention**

*CI/CD Pipeline Hardening*
- Pin GitHub Actions references to immutable full-length commit SHAs, not mutable version tags. A force-pushed tag is invisible to consumers referencing it by name; it has no effect on SHA-pinned consumers.
- Audit all `pull_request_target` workflows. Where this trigger is required, restrict the checkout step to base ref code only — external contributor code should not execute in a privileged context.
- Enable tag immutability protection on repositories that publish software releases.
- Restrict outbound network access from CI/CD runners to an approved allowlist of registries and cloud provider endpoints.

*Credential Scoping and Rotation*
- Replace org-scoped service account tokens with repository-scoped credentials or GitHub App installation tokens. A single compromised credential should not grant access across dozens of workflows.
- When rotating credentials after a compromise, verify revocation explicitly — do not assume that generating new credentials invalidates old ones. Treat every secret accessible from the compromised environment as exfiltrated until proven otherwise.

*Automated Update Controls*
- Review workflows that execute containers sourced from automated dependency update mechanisms. Pin Docker image references to SHA digest rather than mutable tags.

**Detection**

*Identity*
- Alert on bulk API enumeration sequences (ListUsers, ListRoles, DescribeInstances) within compressed time windows by a single credential.
- Alert on high volumes of `GetSecretValue` or `GetObject` events from a single token in a short period.
- Alert on workflow log deletion events attributed to a token or user account.
- Alert on mass repository clone events from a single PAT.

*Network*
- Monitor outbound connections from CI/CD runner hosts against an approved destination allowlist.
- Flag cloud API calls from tokens whose network origin corresponds to known VPN exit nodes or generic hosting providers.

*Endpoint / CI*
- Alert on processes reading other processes' memory on runner hosts.
- Alert on modifications to AI coding assistant configuration files that introduce executable references.

**Governance**

*Artifact Integrity*
- Mandate GPG signing for release commits and enforce signature verification in downstream consumers.
- Extend SBOM coverage to include CI/CD tool dependencies. Supply chain attacks targeting security scanners are not captured by application-level dependency monitoring.

*Incident Response*
- Maintain a credential compromise playbook that explicitly covers atomicity: what revocation looks like, how it is verified, and which downstream systems require re-audit. Partial rotation is not containment.

## Closing

The TeamPCP campaign was not exceptional because of the techniques it used. Memory scraping of CI/CD runners, mutable tag repointing, and the `pull_request_target` misconfiguration had all been documented before. What was structurally significant was the composition: a single configuration error in a widely trusted security tool's pipeline translated into malicious package publications across four ecosystems and credential theft from organizations that had done nothing individually wrong.

The attack surface of any organization includes every tool running inside its pipelines. Security scanners, IaC linters, and dependency checkers operate in the most privileged positions in the software delivery chain. They are trusted by default, executed automatically, and rarely audited with the same rigor applied to application code. This is where the ROI for the attacker sits — not in finding a zero-day, but in identifying a trusted, widely-deployed component and letting the trust network do the propagation.

The Bitwarden CLI was not compromised because Bitwarden was careless. It was compromised because Dependabot trusted a container registry, which trusted a build pipeline, which trusted a service account token that should have been fully rotated three weeks earlier. That chain is not unusual. It describes how most software delivery environments are wired today.
