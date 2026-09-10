from __future__ import annotations

import asyncio
import base64
import gc
import json
from dataclasses import dataclass
from typing import Any

import httpx

from ..config import settings
from .schemas import AIInputType, AIProcessRequest, QuantifiedMetrics


class AIProcessorError(Exception):
    def __init__(self, message: str, *, status_code: int = 502) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class ProcessorResult:
    metrics: QuantifiedMetrics
    processor: str
    model: str


class BlindProcessor:
    """Ephemeral AI pipeline. Never logs or persists raw request content."""

    def __init__(self) -> None:
        self.ollama_url = settings.ollama_url.rstrip("/")

    @property
    def schema(self) -> dict[str, Any]:
        return QuantifiedMetrics.model_json_schema()

    def system_prompt(self) -> str:
        schema = json.dumps(self.schema, separators=(",", ":"))
        return (
            "You are LIVYA's private blind processor. Analyze the supplied user input only. "
            "Return ONLY JSON matching the supplied JSON Schema. Do not diagnose disease, "
            "invent measurements, identify people, or include private data in recommendations. "
            "Mood, focus and physiological_load are estimates from the language/audio transcript, "
            "not clinical measurements. Use conservative scores when evidence is weak. "
            f"JSON Schema: {schema}"
        )

    def timeout_for(self, *, text_chars: int = 0, audio_bytes: int = 0) -> float:
        size = text_chars + (audio_bytes // 4_000)
        return min(settings.ai_max_timeout_seconds, max(settings.ai_min_timeout_seconds, 8 + size / 500))

    async def process(self, request: AIProcessRequest) -> ProcessorResult:
        request.validate_content(
            max_text_chars=settings.ai_max_text_chars,
            max_audio_b64_chars=settings.ai_max_audio_bytes * 4 // 3 + 16,
        )
        text: str | None = None
        audio_bytes: bytes | None = None
        prompt: str | None = None
        try:
            if request.input_type is AIInputType.audio:
                try:
                    audio_bytes = base64.b64decode(request.audio_base64 or "", validate=True)
                except (ValueError, base64.binascii.Error) as exc:
                    raise AIProcessorError("Invalid audio payload", status_code=422) from exc
                if not audio_bytes:
                    raise AIProcessorError("Empty audio payload", status_code=422)
                if len(audio_bytes) > settings.ai_max_audio_bytes:
                    raise AIProcessorError("Audio payload exceeds the permitted size", status_code=413)
                text = await self._transcribe_locally(audio_bytes, request.audio_mime_type)
            else:
                text = request.text

            if not text:
                raise AIProcessorError("No processable input was provided", status_code=422)

            safe_context = self._sanitize_context(request.context)
            prompt = self._build_user_prompt(text, safe_context)

            try:
                return await self._ollama(prompt, len(text))
            except (httpx.HTTPError, asyncio.TimeoutError, AIProcessorError) as local_error:
                if not settings.allow_external_ai_fallback:
                    if isinstance(local_error, AIProcessorError):
                        raise
                    raise AIProcessorError("Local AI processor unavailable", status_code=503) from local_error

                if settings.openai_api_key:
                    try:
                        return await self._openai(prompt, len(text))
                    except (httpx.HTTPError, asyncio.TimeoutError, AIProcessorError):
                        pass

                if settings.anthropic_api_key:
                    try:
                        return await self._anthropic(prompt, len(text))
                    except (httpx.HTTPError, asyncio.TimeoutError, AIProcessorError):
                        pass

                raise AIProcessorError("AI processor unavailable", status_code=503) from local_error
        finally:
            # Best-effort memory hygiene. Python cannot guarantee physical zeroization,
            # but references to sensitive buffers are removed immediately after processing.
            text = None
            prompt = None
            if audio_bytes is not None:
                audio_bytes = b""
            gc.collect()

    def _sanitize_context(self, context: dict[str, Any]) -> dict[str, Any]:
        allowed = {"locale", "session_type", "device_type", "app_version"}
        return {key: str(value)[:100] for key, value in context.items() if key in allowed}

    def _build_user_prompt(self, text: str, context: dict[str, Any]) -> str:
        context_json = json.dumps(context, separators=(",", ":"))
        return (
            "Extract conservative quantitative wellness metrics from this input. "
            "Do not assume facts that are not stated. "
            f"Context metadata: {context_json}\n"
            f"<user_input>{text}</user_input>"
        )

    async def _transcribe_locally(self, audio: bytes, mime_type: str | None) -> str:
        if not settings.whisper_url:
            raise AIProcessorError("Local audio transcription service is not configured", status_code=503)
        timeout = self.timeout_for(audio_bytes=len(audio))
        files = {"file": ("audio", audio, mime_type or "application/octet-stream")}
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{settings.whisper_url.rstrip('/')}/transcribe", files=files)
        if response.is_error:
            raise AIProcessorError("Local audio transcription failed", status_code=502)
        try:
            transcript = response.json().get("text")
        except ValueError as exc:
            raise AIProcessorError("Local transcription returned invalid data", status_code=502) from exc
        if not isinstance(transcript, str) or not transcript.strip():
            raise AIProcessorError("Local transcription returned no text", status_code=422)
        return transcript.strip()

    async def _ollama(self, prompt: str, text_chars: int) -> ProcessorResult:
        timeout = self.timeout_for(text_chars=text_chars)
        payload = {
            "model": settings.ollama_model,
            "stream": False,
            "format": self.schema,
            "messages": [
                {"role": "system", "content": self.system_prompt()},
                {"role": "user", "content": prompt},
            ],
            "options": {"temperature": 0},
        }
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{self.ollama_url}/api/chat", json=payload)
        if response.is_error:
            raise AIProcessorError("Local LLM request failed", status_code=502)
        try:
            content = response.json()["message"]["content"]
            metrics = QuantifiedMetrics.model_validate_json(content)
        except (KeyError, TypeError, ValueError) as exc:
            raise AIProcessorError("Local LLM returned invalid structured output", status_code=502) from exc
        return ProcessorResult(metrics=metrics, processor="ollama", model=settings.ollama_model)

    async def _openai(self, prompt: str, text_chars: int) -> ProcessorResult:
        timeout = self.timeout_for(text_chars=text_chars)
        payload = {
            "model": settings.openai_model,
            "messages": [
                {"role": "system", "content": self.system_prompt()},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0,
            "response_format": {
                "type": "json_schema",
                "json_schema": {"name": "quantified_metrics", "strict": True, "schema": self.schema},
            },
        }
        headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{settings.openai_base_url.rstrip('/')}/chat/completions", json=payload, headers=headers)
        if response.is_error:
            raise AIProcessorError("External OpenAI fallback failed", status_code=502)
        try:
            content = response.json()["choices"][0]["message"]["content"]
            metrics = QuantifiedMetrics.model_validate_json(content)
        except (KeyError, TypeError, ValueError) as exc:
            raise AIProcessorError("External OpenAI fallback returned invalid structured output", status_code=502) from exc
        return ProcessorResult(metrics=metrics, processor="openai-fallback", model=settings.openai_model)

    async def _anthropic(self, prompt: str, text_chars: int) -> ProcessorResult:
        timeout = self.timeout_for(text_chars=text_chars)
        payload = {
            "model": settings.anthropic_model,
            "max_tokens": 1200,
            "system": self.system_prompt(),
            "messages": [{"role": "user", "content": prompt}],
            "output_config": {"format": {"type": "json_schema", "schema": self.schema}},
        }
        headers = {
            "x-api-key": settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f"{settings.anthropic_base_url.rstrip('/')}/v1/messages", json=payload, headers=headers)
        if response.is_error:
            raise AIProcessorError("External Claude fallback failed", status_code=502)
        try:
            blocks = response.json()["content"]
            content = next(block["text"] for block in blocks if block.get("type") == "text")
            metrics = QuantifiedMetrics.model_validate_json(content)
        except (KeyError, StopIteration, TypeError, ValueError) as exc:
            raise AIProcessorError("External Claude fallback returned invalid structured output", status_code=502) from exc
        return ProcessorResult(metrics=metrics, processor="claude-fallback", model=settings.anthropic_model)


blind_processor = BlindProcessor()
