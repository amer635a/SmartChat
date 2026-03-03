from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.scenarios import router as scenarios_router
from app.api.training import router as training_router
from app.api.chat import router as chat_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(scenarios_router)
api_router.include_router(training_router)
api_router.include_router(chat_router)
