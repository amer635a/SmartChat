from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import json
import numpy as np
from pathlib import Path
from app.nlp.embedder import Embedder


class IntentTrainer:
    def __init__(self, embedder: Embedder, model_dir: Path):
        self.embedder = embedder
        self.model_dir = model_dir

    def train(self, training_data: list[tuple[str, str]]) -> dict:
        """
        training_data: list of (phrase, scenario_id) tuples.
        Returns training metadata dict.
        """
        if len(training_data) < 2:
            return {"error": "Not enough training data (need at least 2 samples)"}

        phrases, labels = zip(*training_data)
        phrases = list(phrases)
        labels = list(labels)

        unique_labels = set(labels)

        # Encode all phrases to embeddings
        embeddings = self.embedder.encode(phrases)

        # Encode labels
        label_encoder = LabelEncoder()
        encoded_labels = label_encoder.fit_transform(labels)

        # Compute per-class centroids for OOD detection
        centroids = {}
        for label in unique_labels:
            mask = np.array(labels) == label
            centroids[label] = embeddings[mask].mean(axis=0)
        centroids_array = np.array([centroids[l] for l in label_encoder.classes_])

        if len(unique_labels) >= 2:
            # Train MLPClassifier when we have multiple scenarios
            clf = MLPClassifier(
                hidden_layer_sizes=(256, 128, 64),
                activation="relu",
                max_iter=500,
                early_stopping=True,
                validation_fraction=0.15,
                random_state=42,
            )
            clf.fit(embeddings, encoded_labels)
        else:
            # Single scenario — no MLP needed, centroid matching will be used
            clf = None

        # Save model artifacts
        self.model_dir.mkdir(parents=True, exist_ok=True)
        if clf is not None:
            joblib.dump(clf, self.model_dir / "intent_classifier.joblib")
        else:
            # Remove stale MLP model if it exists
            mlp_path = self.model_dir / "intent_classifier.joblib"
            if mlp_path.exists():
                mlp_path.unlink()
        joblib.dump(label_encoder, self.model_dir / "label_encoder.joblib")
        np.save(self.model_dir / "centroids.npy", centroids_array)

        metadata = {
            "num_scenarios": len(unique_labels),
            "num_phrases": len(phrases),
            "labels": label_encoder.classes_.tolist(),
        }
        with open(self.model_dir / "training_metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)

        return metadata
