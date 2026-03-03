import joblib
import json
import numpy as np
from pathlib import Path
from app.nlp.embedder import Embedder


class IntentClassifier:
    def __init__(self, embedder: Embedder, model_dir: Path, confidence_threshold: float = 0.4):
        self.embedder = embedder
        self.model_dir = model_dir
        self.confidence_threshold = confidence_threshold
        self.clf = None
        self.label_encoder = None

    def load(self) -> bool:
        clf_path = self.model_dir / "intent_classifier.joblib"
        le_path = self.model_dir / "label_encoder.joblib"
        if clf_path.exists() and le_path.exists():
            self.clf = joblib.load(clf_path)
            self.label_encoder = joblib.load(le_path)
            return True
        return False

    def is_loaded(self) -> bool:
        return self.clf is not None

    def predict(self, text: str) -> tuple[str | None, float]:
        """Returns (scenario_id, confidence). Returns (None, 0.0) if below threshold."""
        if not self.is_loaded():
            raise RuntimeError("Model not loaded. Train first.")

        embedding = self.embedder.encode_single(text).reshape(1, -1)
        probabilities = self.clf.predict_proba(embedding)[0]
        max_idx = probabilities.argmax()
        confidence = float(probabilities[max_idx])
        scenario_id = self.label_encoder.inverse_transform([max_idx])[0]

        if confidence < self.confidence_threshold:
            return None, confidence
        return scenario_id, confidence

    def get_status(self) -> dict:
        metadata_path = self.model_dir / "training_metadata.json"
        if metadata_path.exists():
            with open(metadata_path) as f:
                metadata = json.load(f)
            return {
                "trained": self.is_loaded(),
                "model_loaded": self.is_loaded(),
                **metadata,
            }
        return {"trained": False, "model_loaded": False}
