from __future__ import annotations

import time
from uuid import uuid4

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from ...ai.schemas import AIProcessRequest, AIProcessResponse
from ...ai.service import AIProcessorError, blind_processor
from ...auth.dependencies import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/process", response_model=AIProcessResponse)
async def process_ai(request: Request, payload: AIProcessRequest, user: dict = Depends(get_current_user)):
    """Process text/audio in RAM and return only validated metrics."""
    del user
    request_id = str(uuid4())
    started = time.perf_counter()
    try:
        result = await blind_processor.process(payload)
        elapsed = int((time.perf_counter() - started) * 1000)
        return AIProcessResponse(
            metrics=result.metrics,
            processor=result.processor,
            model=result.model,
            processing_ms=elapsed,
            request_id=request_id,
        )
    except ValueError:
        return JSONResponse(
            status_code=422,
            content={"error": "Invalid or oversized AI input", "request_id": request_id},
        )
    except AIProcessorError as exc:
        # Never echo exception arguments containing model/provider payloads.
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": str(exc), "request_id": request_id},
        )
    finally:
        # Release the Pydantic object containing the raw request as early as possible.
        del payload
