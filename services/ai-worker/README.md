# LIVYA AI Worker

This service is the production boundary for private AI processing. Run it on private compute with Ollama/Whisper, not as a Vercel function. The public FastAPI service should reach it over private HTTPS or a private network and authenticate using `AI_SERVICE_TOKEN`.

Contract: `POST /process` accepts the validated AI request and returns only the validated `QuantifiedMetrics` object. Do not persist request bodies, transcripts, prompts, or audio.

Recommended deployment: a private GPU/CPU VM or container platform with encrypted transport, firewall rules allowing only the API service, disk encryption, no public model endpoint, and log redaction.
