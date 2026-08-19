# DECISIONS.md — Acdyon Technologies Engineering Submission
**Track:** Part 1 — Resilient Data Ingestion & Anti-Bot Bypass Pipeline  
**Author:** Candidate  

---

### 1. Why this ingestion strategy over the obvious alternative you rejected?

**The Obvious Alternative Rejected:**  
The conventional approach is spinning up a cluster of headless Puppeteer or Playwright instances running on a cron, firing full browser renders for every page.

**Why We Rejected It:**  
1. **Resource Inefficiency:** Headless Chromium instances consume ~150–300MB RAM and significant CPU per worker, driving infrastructure costs up 20x compared to lightweight HTTP egress.
2. **Fingerprint Surface Vulnerability:** Raw headless browsers are *easier*, not harder, for modern WAFs (Datadome, Cloudflare Turnstile, Akamai) to detect. They leave obvious automation traces in `navigator.webdriver`, inconsistent WebGL vendor strings (`SwiftShader`), unmasked AudioContext signatures, and non-human mouse trajectories.
3. **Fragility Under Rate Limits:** Firing full browsers without granular token-bucket pacing rapidly burns residential proxy pools and IP subnets.

**Our Multi-Tiered Ladder Strategy:**  
We engineered a **Laddered Ingestion Strategy**:
- **Tier 1 (Fast Path — 95% of throughput):** Lightweight Stealth HTTP using node-level Client-Hints emulation (`sec-ch-ua`, `sec-ch-ua-platform`, `sec-fetch-dest`), authentic header casing/ordering, and Box-Muller **Gaussian jitter pacing** (~1.8s dwell times) with persistent session cookie affinity.
- **Tier 2 (Interactive/Challenge Fallback):** Headless stealth browser with custom runtime patches (overriding `navigator.webdriver`, WebGL vendor spoofing, canvas noise injection, and cubic Bezier mouse curve trajectories) engaged *only* when a target triggers a JavaScript challenge or Turnstile proof-of-work.
- **Tier 3 (Egress Diversification):** IP pool rotation across residential proxy nodes with an automatic 3-state **Circuit Breaker** (`CLOSED`, `OPEN`, `HALF_OPEN`) that immediately trips upon 429/403 responses to prevent IP subnet burning.

---

### 2. One trade-off you made under the time limit, and what you’d do with a real week.

**The Trade-off Made:**  
Under the time constraints, state management (Circuit Breaker sliding failure windows, Dead Letter Queue records, and session cookie caches) is maintained in-process with memory structures rather than a distributed storage cluster. While fault-tolerant within a single node, multi-instance horizontal scaling would currently have partitioned failure tracking.

**What I Would Build With a Real Week:**  
1. **Distributed State & Sliding-Window Token Buckets (Redis / Dragonfly):** Migrate circuit breakers and session jars to Redis using sliding-log rate limiting and distributed Redlock locks to coordinate thousands of worker threads across global regions.
2. **Native TLS JA4 Permutation Engine (Go / uTLS Sidecar):** Implement a local uTLS proxy sidecar that custom-synthesizes ClientHello cipher suites, TLS extensions, and ALPN negotiate orders matching authentic Chrome and Safari binaries byte-for-byte.
3. **Self-Healing DOM Engine with LLM Semantic Anchor Extraction:** An automated background worker that catches schema drift alerts, takes failing HTML snippets, runs a local quantized LLM to infer the new selector topology, and auto-generates unit tests and updated CSS selector maps without downtime.

---

### 3. Where did you use AI tools, and what did you personally verify or change afterward?

**Where AI Tools Were Used:**  
- AI was used for rapid scaffolding of CSS/Tailwind utility tokens, boilerplate skeletons for Gaussian Box-Muller transforms, and sample mock data generation.

**What Was Personally Verified, Changed, and Architected:**  
1. **Circuit Breaker State Machine Dynamics:** Replaced simple threshold counters with an explicit 3-state state machine (`CLOSED` → `OPEN` on immediate 429/403 vs sliding window → `HALF_OPEN` canary probes). Added automatic cooldown timers with Exponential Backoff + Jitter in the Dead Letter Queue.
2. **Client-Hints & HTTP Signature Casing:** Verified exact browser standards for modern Chromium `Sec-CH-UA` headers (`"Chromium";v="122"`, `sec-ch-ua-mobile: ?0`, `sec-ch-ua-platform: "macOS"`). Standard automated generators frequently omit platform version hints or send them to Safari targets (a fatal detection tell).
3. **Adaptive Parser Hierarchy:** Verified and wrote the 3-tier cascade (`JSON-LD` → `CSS Selectors` → `Fuzzy Semantic DOM Heuristics`) and added the Schema Drift Confidence Score to guarantee that structural DOM changes never cause silent pipeline failures.
