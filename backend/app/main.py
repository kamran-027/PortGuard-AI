import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("portguard.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## PortGuard AI: Autonomous Customs Pre-Clearance & Demurrage Aversion Engine
    
    * **Stage 1**: Multi-Document Strict Extraction (BIC/ISO-6346, HS Codes, Weights)
    * **Stage 2**: Cross-Document Consistency Audit & Discrepancy Detection
    * **Stage 3**: ICEGATE Pre-Clearance Certificate Generation with Demurrage Meter ($/₹)
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during local hackathon dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
