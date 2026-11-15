# Space Habitat Photo Analysis & AI Vision Setup

Ember integrates multimodal AI models to perform visual fire hazard screening on space habitat and crew volume survey photos. It detects visible fire concerns (such as combustibles near thermal lines, uncontained lithium-ion batteries, and obstructed emergency egress paths) and automatically triggers the **NASA Spaceflight Fire Safety Audit Engine**.

---

## 1. Cloud AI Vision Model — Recommended Cloud API (High-Speed & Native Schema)

The AI Vision Model provides fast multimodal vision analysis and strict structured JSON output matching Ember's typed schema.

### Quick Setup:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `.env` in the project root:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```

*(When `GEMINI_API_KEY` is present in `.env`, Ember automatically selects the cloud AI vision model as the active vision provider).*

3. Start Ember (`npm run dev`) and open **Space Safety → Space Safety & Prevention**.
4. Check the **AI Visual Hazard Inspection** card. It will indicate **AI Cloud Model (Ready)**.
5. Upload space habitat photos, check the cloud consent box, and click **Analyze photos for hazards**.
6. The AI findings will immediately appear alongside the **NASA Spaceflight Fire Safety Compliance Audit** and the **Mission Habitat Certification Checklist**.

---

## 2. Local Model — 100% Private & Offline (Ollama)

For mission-critical environments with zero cloud access:

1. Install Ollama from [https://ollama.com/download](https://ollama.com/download) on the local host.
2. Pull a multimodal vision model:
   - `ollama pull gemma3:4b` (Lightweight multimodal vision model)
   - `ollama pull llama3.2-vision` (High accuracy vision inspection)
3. Ensure Ollama is running (`ollama serve`).
4. Configure `.env`:

```dotenv
EMBER_AI_PROVIDER=ollama
EMBER_OLLAMA_URL=http://127.0.0.1:11434
EMBER_OLLAMA_MODEL=gemma3:4b
```

---

## 3. Alternative Cloud Providers

### DeepSeek Cloud API
```dotenv
EMBER_AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
```

### OpenAI Cloud API
```dotenv
EMBER_AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

---

## 4. Privacy & Security Boundary

- **Local Storage of Credentials**: Keys (`GEMINI_API_KEY`, etc.) remain exclusively on the local Node.js server. They are never transmitted to the browser or stored in the database.
- **Explicit Cloud Consent**: An explicit consent checkbox must be toggled by the operator before any image payload leaves the machine.
- **Decision Support Only**: Visual AI findings provide screening alerts and spaceflight standard cross-references; they do not replace formal flight readiness reviews or life-support telemetry monitoring.
