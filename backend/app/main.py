from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import (
    SCENARIOS_DIR, SCRIPTS_DIR, TRAINED_MODELS_DIR,
    AUGMENTED_DATA_DIR, EMBEDDING_MODEL, CONFIDENCE_THRESHOLD,
    SIMILARITY_THRESHOLD, AUGMENTATION_COUNT, SCRIPT_TIMEOUT, CORS_ORIGINS,
)
from app.core.scenario_registry import ScenarioRegistry
from app.core.session_manager import SessionManager
from app.core.connection_manager import ConnectionManager
from app.core.script_executor import ScriptExecutor
from app.core.flow_engine import FlowEngine
from app.nlp.embedder import Embedder
from app.nlp.augmenter import DataAugmenter
from app.nlp.trainer import IntentTrainer
from app.nlp.intent_classifier import IntentClassifier
from app.nlp.llm_fallback import LLMFallback

# Global instances
scenario_registry = ScenarioRegistry(SCENARIOS_DIR)
session_manager = SessionManager()
connection_manager = ConnectionManager()
script_executor = ScriptExecutor(SCRIPTS_DIR, timeout=SCRIPT_TIMEOUT)

embedder: Embedder = None
augmenter: DataAugmenter = None
trainer: IntentTrainer = None
classifier: IntentClassifier = None
llm_fallback: LLMFallback = None
flow_engine: FlowEngine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedder, augmenter, trainer, classifier, llm_fallback, flow_engine

    # Startup
    print("Loading scenarios...")
    count = scenario_registry.load_all()
    print(f"Loaded {count} scenarios.")

    print("Initializing NLP components...")
    embedder = Embedder(EMBEDDING_MODEL)
    augmenter = DataAugmenter(AUGMENTED_DATA_DIR, count=AUGMENTATION_COUNT)
    trainer = IntentTrainer(embedder, TRAINED_MODELS_DIR)
    classifier = IntentClassifier(embedder, TRAINED_MODELS_DIR, CONFIDENCE_THRESHOLD, SIMILARITY_THRESHOLD)

    # Try to load existing trained model
    if classifier.load():
        print("Loaded existing trained model.")
    else:
        print("No trained model found. Please train via POST /api/training/train")

    scenario_names = [s.name for s in scenario_registry.get_all()]
    llm_fallback = LLMFallback(scenario_names)
    flow_engine = FlowEngine(scenario_registry, script_executor, llm_fallback)
    print("SmartChat backend is ready!")

    yield

    # Shutdown
    session_manager.close_all()
    print("SmartChat backend shut down.")


app = FastAPI(title="SmartChat", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.router import api_router  # noqa: E402
app.include_router(api_router)
