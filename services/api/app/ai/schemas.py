from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AIInputType(str, Enum):
    text = "text"
    audio = "audio"


class AIProcessRequest(BaseModel):
    """Request model. Raw content exists only for the lifetime of the request."""

    model_config = ConfigDict(extra="forbid")

    input_type: AIInputType = AIInputType.text
    text: str | None = Field(default=None, max_length=20_000)
    audio_base64: str | None = Field(default=None, max_length=8_000_000)
    audio_mime_type: str | None = Field(default=None, max_length=100)
    context: dict[str, Any] = Field(default_factory=dict, max_length=20)

    @field_validator("text")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    def validate_content(self) -> None:
        if self.input_type is AIInputType.text and not self.text:
            raise ValueError("text is required for text input")
        if self.input_type is AIInputType.audio and not self.audio_base64:
            raise ValueError("audio_base64 is required for audio input")


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
