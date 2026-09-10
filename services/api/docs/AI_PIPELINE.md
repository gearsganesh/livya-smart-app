# LIVYA Blind Processor

## Endpoint

`POST /api/v1/ai/process`

Requires the Supabase bearer access token produced by Step 2.

### Text request

```json
{
  "input_type": "text",
  "text": "I slept badly and cannot concentrate today.",
  "context": {
    "locale": "en-IN",
    "session_type": "check-in"
  }
}
```

### Processing order

```text
Mobile
  -> TLS 1.3 HTTPS
  -> FastAPI auth/JWT verification
  -> request-size gate
  -> Pydantic input validation
  -> RAM-only blind processor
       -> local Whisper (audio only)
       -> local Ollama structured-output LLM
       -> optional external fallback (explicit opt-in)
  -> Pydantic QuantifiedMetrics validation
  -> response
  -> references released + GC
```

## Privacy guarantees

- Raw text/audio is not written to the database.
- Raw text/audio is not intentionally logged by the blind processor.
- Validation errors for the AI endpoint never return rejected input values.
- External AI is disabled by default.
- When external fallback is enabled, the raw input necessarily leaves the private host. Enable it only when the deployment's privacy policy permits that transfer.
- Only an allowlisted set of non-sensitive context metadata is passed to the model.
- Audio is decoded into RAM and sent only to the configured local transcription service.
- The processor returns only `QuantifiedMetrics` plus non-sensitive processing metadata.

## Local Ollama

The processor uses Ollama's `/api/chat` endpoint with `stream: false` and passes the Pydantic JSON Schema through the `format` field. Ollama supports JSON-schema structured outputs, and the returned JSON is validated again with Pydantic before it leaves FastAPI.

Recommended local configuration:

```env
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
WHISPER_URL=http://127.0.0.1:9000
ALLOW_EXTERNAL_AI_FALLBACK=false
```

For strict privacy, keep Ollama local-only and do not configure a cloud Ollama model.

## External fallback

Only enabled with:

```env
ALLOW_EXTERNAL_AI_FALLBACK=true
```

Then configure either or both:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=...
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=...
```

The order is local Ollama -> OpenAI (if configured) -> Claude (if configured).

## TLS 1.3

In production, terminate TLS at the trusted ingress/load balancer and forward `X-Forwarded-Proto: https`. The application rejects clear-text requests when `REQUIRE_HTTPS=true`.

If FastAPI/Uvicorn terminates TLS directly, use `build_tls_context()` from `app.security.transport`; it sets both minimum and maximum TLS versions to 1.3.

Example deployment concept:

```python
from app.security.transport import build_tls_context

ssl_context = build_tls_context("/etc/tls/fullchain.pem", "/etc/tls/privkey.pem")
```

The certificate/key must never be committed to Git.

## Timeout policy

Timeout is calculated from input size and clamped between:

- `AI_MIN_TIMEOUT_SECONDS` (default 15s)
- `AI_MAX_TIMEOUT_SECONDS` (default 90s)

The HTTP client timeout applies to both local and external model calls.

## Structured output

The Pydantic `QuantifiedMetrics` model is the single source of truth. It constrains:

- `mood`: 0-10
- `focus`: 0-10
- `physiological_load`: 0-10, non-diagnostic
- `recommendations`: maximum 5
- `summary`: maximum 1000 characters
- `confidence`: 0-1

The model response is rejected if it does not conform exactly.
