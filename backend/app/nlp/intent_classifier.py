import joblib
import json
import numpy as np
from pathlib import Path
from app.nlp.embedder import Embedder


class IntentClassifier:
    def __init__(self, embedder: Embedder, model_dir: Path, confidence_threshold: float = 0.4,
                 similarity_threshold: float = 0.45):
        self.embedder = embedder
        self.model_dir = model_dir
        self.confidence_threshold = confidence_threshold
        self.similarity_threshold = similarity_threshold
        self.clf = None
        self.label_encoder = None
        self.centroids = None

    def load(self) -> bool:
        clf_path = self.model_dir / "intent_classifier.joblib"
        le_path = self.model_dir / "label_encoder.joblib"
        centroids_path = self.model_dir / "centroids.npy"
        if le_path.exists():
            self.label_encoder = joblib.load(le_path)
            if clf_path.exists():
                self.clf = joblib.load(clf_path)
            else:
                self.clf = None  # single-scenario mode
            if centroids_path.exists():
                self.centroids = np.load(centroids_path)
            self._loaded = True
            return True
        return False

    def is_loaded(self) -> bool:
        return getattr(self, '_loaded', False) and self.label_encoder is not None

    def predict(self, text: str) -> tuple[str | None, float]:
        """Returns (scenario_id, confidence). Returns (None, 0.0) if below threshold."""
        if not self.is_loaded():
            raise RuntimeError("Model not loaded. Train first.")

        embedding = self.embedder.encode_single(text).reshape(1, -1)

        # OOD check: cosine similarity to class centroids
        if self.centroids is not None:
            norm_emb = embedding / np.linalg.norm(embedding, axis=1, keepdims=True)
            norm_cent = self.centroids / np.linalg.norm(self.centroids, axis=1, keepdims=True)
            similarities = (norm_emb @ norm_cent.T)[0]
            max_similarity = float(similarities.max())
            if max_similarity < self.similarity_threshold:
                return None, max_similarity

            # Single-scenario mode: use centroid similarity directly
            if self.clf is None:
                best_idx = int(similarities.argmax())
                scenario_id = self.label_encoder.inverse_transform([best_idx])[0]
                return scenario_id, max_similarity

        if self.clf is None:
            return None, 0.0

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
