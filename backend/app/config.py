from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
SCENARIOS_DIR = BASE_DIR / "scenarios"
SCRIPTS_DIR = BASE_DIR / "scripts"
TRAINED_MODELS_DIR = BASE_DIR / "trained_models"
AUGMENTED_DATA_DIR = BASE_DIR / "augmented_data"

# NLP settings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
CONFIDENCE_THRESHOLD = 0.4
SIMILARITY_THRESHOLD = 0.45
AUGMENTATION_COUNT = 10000

# Script executor settings
SCRIPT_TIMEOUT = 30  # seconds

# Server settings
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]
