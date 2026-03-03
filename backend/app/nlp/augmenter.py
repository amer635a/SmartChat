import json
import os
from pathlib import Path
from anthropic import Anthropic


class DataAugmenter:
    def __init__(self, augmented_data_dir: Path, count: int = 10000):
        self.augmented_data_dir = augmented_data_dir
        self.count = count
        self.augmented_data_dir.mkdir(parents=True, exist_ok=True)

    def get_cache_path(self, scenario_id: str) -> Path:
        return self.augmented_data_dir / f"{scenario_id}.json"

    def has_cache(self, scenario_id: str) -> bool:
        return self.get_cache_path(scenario_id).exists()

    def load_cache(self, scenario_id: str) -> list[str]:
        cache_path = self.get_cache_path(scenario_id)
        if cache_path.exists():
            with open(cache_path) as f:
                return json.load(f)
        return []

    def save_cache(self, scenario_id: str, phrases: list[str]):
        cache_path = self.get_cache_path(scenario_id)
        with open(cache_path, "w") as f:
            json.dump(phrases, f, indent=2)

    def augment(self, scenario_id: str, scenario_name: str, seed_phrases: list[str]) -> list[str]:
        """Generate augmented training data. Uses cache if available, otherwise calls Claude API."""
        # Check cache first
        if self.has_cache(scenario_id):
            cached = self.load_cache(scenario_id)
            if len(cached) > 0:
                return cached

        # Check if API key is available
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            # Fallback: basic augmentation without Claude
            return self._basic_augment(seed_phrases)

        # Call Claude API
        return self._claude_augment(api_key, scenario_id, scenario_name, seed_phrases)

    def _claude_augment(self, api_key: str, scenario_id: str, scenario_name: str, seed_phrases: list[str]) -> list[str]:
        client = Anthropic(api_key=api_key)

        seed_list = "\n".join(f"- {p}" for p in seed_phrases)
        prompt = f"""You are a training data generator. I have a chatbot scenario called "{scenario_name}" with these seed phrases:

{seed_list}

Generate exactly {self.count} unique variations of these phrases. Include:
- Different phrasings (formal, casual, short, long)
- UPPERCASE, lowercase, Mixed Case, aLL cAPS
- Common typos and misspellings
- With and without punctuation
- Slang and abbreviations
- Different word orders
- Questions vs statements
- With extra words / filler words

Return ONLY the phrases, one per line. No numbering, no bullets, no extra text."""

        all_phrases = list(seed_phrases)
        batch_size = 500

        while len(all_phrases) < self.count + len(seed_phrases):
            remaining = self.count - (len(all_phrases) - len(seed_phrases))
            current_batch = min(batch_size, remaining)
            if current_batch <= 0:
                break

            batch_prompt = prompt.replace(f"exactly {self.count}", f"exactly {current_batch}")

            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=8192,
                messages=[{"role": "user", "content": batch_prompt}]
            )

            text = response.content[0].text
            new_phrases = [line.strip() for line in text.strip().split("\n") if line.strip()]
            all_phrases.extend(new_phrases)

        # Deduplicate while preserving order
        seen = set()
        unique = []
        for p in all_phrases:
            lower = p.lower().strip()
            if lower not in seen:
                seen.add(lower)
                unique.append(p)

        # Save to cache
        self.save_cache(scenario_id, unique)
        return unique

    def _basic_augment(self, seed_phrases: list[str]) -> list[str]:
        """Fallback augmentation without Claude API."""
        augmented = list(seed_phrases)
        for phrase in seed_phrases:
            # Lowercase
            augmented.append(phrase.lower())
            # Uppercase
            augmented.append(phrase.upper())
            # Title case
            augmented.append(phrase.title())
            # Without punctuation
            clean = phrase.replace("?", "").replace(".", "").replace("!", "").strip()
            augmented.append(clean)
            augmented.append(clean.lower())
            # With question mark
            if not phrase.endswith("?"):
                augmented.append(phrase + "?")
            # Short form: remove articles
            short = phrase.lower().replace("the ", "").replace("a ", "").replace("an ", "")
            augmented.append(short)
            # With "please"
            augmented.append(f"please {phrase.lower()}")
            augmented.append(f"{phrase.lower()} please")
            # With "can you"
            augmented.append(f"can you {phrase.lower()}")
            # With "I want to"
            augmented.append(f"I want to {phrase.lower()}")
            augmented.append(f"i need to {phrase.lower()}")

        # Deduplicate
        seen = set()
        unique = []
        for p in augmented:
            lower = p.lower().strip()
            if lower not in seen:
                seen.add(lower)
                unique.append(p)
        return unique
