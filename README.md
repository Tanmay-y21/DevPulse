# DevPulse / SystemGuardian 🚀

An automated, full-stack AI-driven developer analytics platform that captures real-time GitHub commit streams via secure webhooks, processes technical complexity through the Gemini 2.5 Pro architecture, and generates automated daily standups and project health vectors. 

Built to eliminate manual developer tracking, this product serves as a production-grade portfolio piece demonstrating modern asynchronous pipeline design, smart MongoDB caching, and robust full-stack monorepo architecture.

---

## 🛠️ Full-Stack System Architecture

The platform is engineered as a decoupled full-stack monorepo, separating a low-latency UI from a high-throughput automated background processing layer:

```text
  [GitHub Push Event]
           │
           ▼ (Real-time Payload Stream)
   ┌────────────────────────────────┐
   │  Express API Webhook Engine   │  <─── Smee / Cloudflare Tunnel
   └───────────────┬────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
 ⚡ [Cache Hit]        🤖 [Cache Miss]
   Read MongoDB          Run Gemini 2.5 Flash
   Atlas Documents       Compile Analysis Matrix
         │                   │
         │                   ▼
         └─────────┬─────────┘
                   │
                   ▼ (Synchronized State)
   ┌────────────────────────────────┐
   │     Next.js Dashboard UI       │  <─── Clerk Auth / Shadcn Skeletons
   └────────────────────────────────┘
