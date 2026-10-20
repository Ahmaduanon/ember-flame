# Room-photo analysis

Ember 0.2 integrates an existing vision model. It does not include a newly trained or validated fire-risk model. You can create buildings, save photos, record observations manually and use the sensor/demo workflows before configuring AI.

## Local model — default

1. Install Ollama from https://ollama.com/download on the same computer as Ember.
2. In a terminal run `ollama pull gemma3:4b`. This is a separate model download; model weights are not in the project ZIP. The 4b variant supports images; the 1b variant does not. Download size and memory needs depend on the selected model/version.
3. Keep Ollama running. Its usual local address is `http://127.0.0.1:11434`. If it is not started automatically, use `ollama serve`.
4. Start Ember. Open **Buildings & alerts → Building survey**, add a room, and upload up to four clear views of that room. Use additional rooms for a whole-building survey.
5. Press the AI status refresh button, then **Analyze room photos**. Allow up to two minutes. On slower computers, try one photo at a time. The model must support vision and structured output.

The default local configuration works without an API key. Images are sent only to the local Ollama server. Initial installation/model download needs internet access. To change settings, copy `.env.example` to `.env` beside `package.json`, edit it, and restart Ember:

```dotenv
EMBER_AI_PROVIDER=ollama
EMBER_OLLAMA_URL=http://127.0.0.1:11434
EMBER_OLLAMA_MODEL=gemma3:4b
```

Only a loopback HTTP origin is accepted for Ollama. Do not expose it or Ember to the public internet. If the configured model is absent, unreachable, times out or returns an invalid response, the app reports that failure and saves no invented assessment. Manual observations remain available.

## Optional cloud model

The OpenAI alternative requires your own API access and may incur charges. Set these locally in `.env`, then restart:

```dotenv
EMBER_AI_PROVIDER=openai
OPENAI_API_KEY=replace_locally_with_your_api_key
OPENAI_MODEL=gpt-6-luna
```

Never share your actual `.env` file or paste a key into the app, a chat or source code. The key stays on the server. You must explicitly consent in the UI for each analysis before room photos, photo labels and room context are sent to OpenAI. Choose a currently available model with image input and structured-output support; availability depends on your API account. A key being configured does not establish that the account/model is accessible.

The integration uses the Responses API with `store:false`. That is not a promise of zero provider retention; review the provider's current data controls before sending sensitive room images. Cloud analysis is optional and off by default. No paid API requests were made during project verification.

## What an assessment means

- Each possible concern references a supplied photo, visible evidence, location, category and uncertainty. It starts as **unreviewed**.
- People can confirm, resolve or dismiss a finding and record a review note. AI does not confirm its own observations.
- The app attaches fixed category-based preventive guidance; it does not generate wiring-repair or active-fire instructions.
- “No findings” means the limited images produced no supported observation. It does not certify that the room is safe.
- A kitchen next to a bathroom is not automatically a fire hazard. Fabric somewhere near a normal socket is not enough evidence on its own. Heat sources, visible damage, obstructed exits or unsafe visible arrangements need context and in-person verification.
- Hidden wiring, electrical loads, gas leaks, materials, exact distances, compliance and fire probability cannot be established from these photos. This is not a 3D scan, floor-plan reconstruction or code inspection.
- If an unresolved live alarm contact is recorded, the server blocks photo analysis. Leave and seek emergency help when an alarm sounds or smoke/fire is present; do not stay to photograph it.

The schema validates the response format, not its factual accuracy. Even a valid response may miss or misidentify a hazard. Prompt-injection defenses are best effort; all model output remains untrusted and requires review.

## Photos and privacy

The browser accepts JPEG/PNG/WebP, resizes the longest edge to at most 1,400 pixels and re-encodes as JPEG to remove embedded metadata. HEIC must be exported as JPEG first. Avoid including people, documents or unrelated private details. The server stores up to four images per room in the local SQLite file. Delete a photo from its card to remove the image; earlier assessments/findings retain their textual evidence and photo ID. Backups may still contain deleted images. Stop Ember before copying or removing its data folder.

## Evaluation still required

API serialization and error handling were tested using mocked model responses. No live vision model was run or evaluated on room photos in this build. Before relying on the survey workflow, test it against expert-labeled, consented images covering ordinary rooms, genuine visible concerns, difficult lighting, clutter and misleading text. Measure missed concerns, false alarms and unsupported claims separately; do not use synthetic software tests as evidence of detection accuracy.

## Primary documentation

- Ollama vision: https://docs.ollama.com/capabilities/vision
- Ollama structured outputs: https://docs.ollama.com/capabilities/structured-outputs
- Gemma 3 variants: https://ollama.com/library/gemma3
- OpenAI vision: https://developers.openai.com/api/docs/guides/images-vision
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Model capabilities: https://developers.openai.com/api/docs/models/gpt-6-luna
- API data controls: https://developers.openai.com/api/docs/guides/your-data
