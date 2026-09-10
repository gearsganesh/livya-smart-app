from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.v1.ai import router as ai_router
from .api.v1.auth import router as auth_router
from .auth.dependencies import AuthMiddleware
from .config import settings
from .security.transport import HTTPSOnlyMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="LIVYA API", version="0.3.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(HTTPSOnlyMiddleware)
app.add_middleware(AuthMiddleware)


@app.exception_handler(RequestValidationError)
async def sanitized_validation_error(request: Request, exc: RequestValidationError):
    # FastAPI's default validation response may include rejected input values.
    # Never expose those values for the blind processor endpoint.
    if request.url.path == "/api/v1/ai/process":
        return JSONResponse(status_code=422, content={"detail": "Invalid AI request"})
    return JSONResponse(status_code=422, content={"detail": "Request validation failed"})


app.include_router(auth_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "livya-api"}


@app.get("/api/v1")
async def api_root():
    return {"name": "LIVYA API", "version": "v1"}
