from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.auth import router as auth_router
from .auth.dependencies import AuthMiddleware
from .config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="LIVYA API", version="0.2.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)

app.include_router(auth_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "livya-api"}


@app.get("/api/v1")
async def api_root():
    return {"name": "LIVYA API", "version": "v1"}
