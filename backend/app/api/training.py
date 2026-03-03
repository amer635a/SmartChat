from fastapi import APIRouter

router = APIRouter(prefix="/training", tags=["training"])


@router.post("/train")
async def train_model():
    from app.main import scenario_registry, augmenter, trainer, classifier

    # Get seed training data from scenarios
    seed_data = scenario_registry.get_training_data()
    if len(seed_data) < 2:
        return {"error": "Not enough training data"}

    # Augment data for each scenario
    all_training_data = []
    scenarios = scenario_registry.get_all()
    for scenario in scenarios:
        augmented_phrases = augmenter.augment(
            scenario_id=scenario.id,
            scenario_name=scenario.name,
            seed_phrases=scenario.training_phrases,
        )
        for phrase in augmented_phrases:
            all_training_data.append((phrase, scenario.id))

    # Train the model
    metadata = trainer.train(all_training_data)

    # Reload the classifier
    classifier.load()

    return {
        "status": "trained",
        **metadata,
    }


@router.get("/status")
async def training_status():
    from app.main import classifier
    return classifier.get_status()
