from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AIInputType(str, Enum):
    text = "text"
    audio = "audio"


class AIProcessRequest(BaseModel):
    """Raw content exists only for the lifetime of the request."""

    model_config = ConfigDict(extra="forbid")

    input_type: AIInputType = AIInputType.text
    # Do not use Pydantic max_length here: validation errors can echo the rejected
    # value. Size limits are enforced after parsing with sanitized errors.
    text: str | None = None
    audio_base64: str | None = None
    audio_mime_type: str | None = None
    context: dict[str, Any] = Field(default_factory=dict)

    @field_validator("text")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    def validate_content(self, *, max_text_chars: int, max_audio_b64_chars: int) -> None:
        if self.input_type is AIInputType.text:
            if not self.text:
                raise ValueError("text is required for text input")
            if len(self.text) > max_text_chars:
                raise ValueError("text exceeds the permitted size")
        elif self.input_type is AIInputType.audio:
            if not self.audio_base64:
                raise ValueError("audio_base64 is required for audio input")
            if len(self.audio_base64) > max_audio_b64_chars:
                raise ValueError("audio payload exceeds the permitted size")
            if self.audio_mime_type and len(self.audio_mime_type) > 100:
                raise ValueError("audio_mime_type is invalid")
        if len(self.context) > 20:
            raise ValueError("context contains too many fields")


class QuantifiedMetrics(BaseModel):
    """The only LLM output allowed to leave the blind processor."""

    model_config = ConfigDict(extra="forbid")

    mood: float = Field(ge=0, le=10, description="Estimated mood/wellbeing score, 0 to 10")
    focus: float = Field(ge=0, le=10, description="Estimated focus score, 0 to 10")
    physiological_load: float = Field(
        ge=0,
        le=10,
        description="Non-diagnostic estimated physiological load, 0 to 10",
    )
    recommendations: list[str] = Field(default_factory=list, max_length=5)
    summary: str = Field(max_length=1000)
    confidence: float = Field(ge=0, le=1)


class AIProcessResponse(BaseModel):
    metrics: QuantifiedMetrics
    processor: str
    model: str
    processing_ms: int = Field(ge=0)
    request_id: str


class ProcessingError(BaseModel):
    error: str
    request_id: str
