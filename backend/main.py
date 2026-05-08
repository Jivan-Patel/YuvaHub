from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import routers
from api.routes import feed, admin, interactions

app = FastAPI(title="Yuvahub API", version="1.0.0")

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"status": "online", "message": "Yuvahub API Engine Active"}

# Setup APIs
app.include_router(feed.router, prefix="/api/v1/feed", tags=["Feed"])
app.include_router(interactions.router, prefix="/api/v1/interactions", tags=["Interactions"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
