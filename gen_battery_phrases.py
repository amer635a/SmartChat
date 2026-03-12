import json
import random
import itertools

random.seed(42)

phrases = set()

# ── Core verbs (problem actions) ──
problem_verbs = [
    "add", "configure", "config", "set up", "setup", "connect",
    "install", "register", "pair", "link", "integrate",
    "enable", "activate", "initialize", "commission",
    "detect", "discover", "find", "create", "establish",
    "hook up", "get working", "make work", "get connected",
    "bring online", "get online",
]

problem_verbs_ing = [
    "adding", "configuring", "configuring", "setting up", "setting up", "connecting",
    "installing", "registering", "pairing", "linking", "integrating",
    "enabling", "activating", "initializing", "commissioning",
    "detecting", "discovering", "finding", "creating", "establishing",
    "hooking up", "getting working", "making work", "getting connected",
    "bringing online", "getting online",
]

# ── Objects ──
battery_objects = [
    "battery", "the battery", "a battery", "my battery", "our battery",
    "kstar battery", "the kstar battery", "a kstar battery", "my kstar battery", "our kstar battery",
    "KSTAR battery", "the KSTAR battery", "Kstar battery", "the Kstar battery",
    "kstar", "KSTAR", "the kstar", "the KSTAR",
    "battery storage", "the battery storage", "kstar storage", "the kstar storage",
    "battery system", "the battery system", "kstar battery system",
    "energy storage", "the energy storage", "kstar energy storage",
    "battery unit", "the battery unit", "kstar battery unit",
    "storage battery", "battery module", "the battery module",
    "battery pack", "the battery pack", "kstar battery pack",
    "batt", "the batt", "kstar batt",
    "storage unit", "the storage unit",
]

connection_objects = [
    "battery connection", "the battery connection", "a battery connection",
    "kstar battery connection", "the kstar connection", "a kstar connection",
    "the connection", "a connection", "connection to the battery",
    "the connection to the battery", "connection to kstar",
    "the connection to the kstar", "battery communication",
    "the battery communication", "communication with the battery",
    "communication with kstar", "battery link", "the battery link",
    "kstar link", "the kstar link", "battery interface",
    "the battery interface", "battery comm", "the battery comm",
]

all_objects = battery_objects + connection_objects

# ── Cannot phrases ──
cannots = [
    "cannot", "can not", "can't", "could not", "couldn't",
    "unable to", "not able to", "am unable to", "was unable to",
    "failed to", "failing to", "can't seem to",
]

# ── Suffixes ──
suffixes = [
    "", " on the site", " on my site", " on our site",
    " on the system", " on my system", " on our system",
    " on the inverter", " on my inverter", " to the system",
    " to the inverter", " in the app", " in the system",
    " in the settings", " in the configuration",
    " for the site", " for my site", " for our site",
    " here", " right now", " at all", " please",
    " today", " anymore", " still", " yet",
    " for me", " for us",
]

# ── Pattern 1: "I/we + cannot + verb + object + suffix" ──
subjects = [
    "I", "i", "we", "We",
]
for subj in subjects:
    for c in cannots:
        for vi, v in enumerate(problem_verbs):
            for obj in all_objects:
                for s in suffixes:
                    p = f"{subj} {c} {v} {obj}{s}"
                    phrases.add(p)
                    if len(phrases) >= 80000:
                        break
                if len(phrases) >= 80000:
                    break
            if len(phrases) >= 80000:
                break
        if len(phrases) >= 80000:
            break
    if len(phrases) >= 80000:
        break

# ── Pattern 2: "problem/issue + verbing + object" ──
problem_nouns = ["problem", "issue", "trouble", "difficulty", "error"]
for pn in problem_nouns:
    for vi, v_ing in enumerate(problem_verbs_ing):
        for obj in all_objects:
            for s in suffixes[:10]:
                p = f"{pn} {v_ing} {obj}{s}"
                phrases.add(p)
                p2 = f"having {pn} {v_ing} {obj}{s}"
                phrases.add(p2)
                p3 = f"I am having {pn} {v_ing} {obj}{s}"
                phrases.add(p3)

# ── Pattern 3: "object + won't/doesn't + verb" ──
negations = ["won't", "doesn't", "does not", "will not", "is not going to"]
for obj in battery_objects[:20]:
    for neg in negations:
        for v in problem_verbs[:15]:
            p = f"{obj} {neg} {v}"
            phrases.add(p)
            for s in suffixes[:8]:
                phrases.add(f"{obj} {neg} {v}{s}")

# ── Pattern 4: question style ──
q_starts = ["why", "how come", "any idea why", "do you know why"]
q_cannots = ["can't I", "can I not", "couldn't I", "I can't", "I cannot", "we can't", "we cannot"]
for qs in q_starts:
    for qc in q_cannots:
        for v in problem_verbs[:15]:
            for obj in all_objects[:30]:
                p = f"{qs} {qc} {v} {obj}?"
                phrases.add(p)

# ── Pattern 5: "help me / I need to + verb + object + but fails" ──
starters = ["help me", "I need to", "I want to", "I'm trying to", "we need to", "please help me"]
failures = [" but it fails", " but it doesn't work", " but I get an error",
            " but it keeps failing", " but nothing happens", " but it won't work",
            " and it's not working", " and I get an error", " but something is wrong"]
for st in starters:
    for v in problem_verbs[:15]:
        for obj in all_objects[:25]:
            for f in failures:
                p = f"{st} {v} {obj}{f}"
                phrases.add(p)

# ── Pattern 6: short direct phrases ──
short_verbs = ["add", "configure", "connect", "set up", "install", "register", "pair", "link", "enable", "activate"]
for v in short_verbs:
    for obj in battery_objects[:15]:
        phrases.add(f"{v} {obj} not working")
        phrases.add(f"{v} {obj} failed")
        phrases.add(f"{v} {obj} error")
        phrases.add(f"{v} {obj} issue")
        phrases.add(f"{v} {obj} problem")
        phrases.add(f"error {v_ing} {obj}")
        phrases.add(f"failed to {v} {obj}")
        phrases.add(f"cannot {v} {obj}")
        phrases.add(f"can't {v} {obj}")
        phrases.add(f"unable to {v} {obj}")
        phrases.add(f"not able to {v} {obj}")
        phrases.add(f"{v} {obj} keeps failing")
        phrases.add(f"{v} {obj} is broken")
        phrases.add(f"{v} {obj} doesn't work")
        phrases.add(f"no luck {v_ing} {obj}")

# ── Normalize and deduplicate ──
clean = set()
for p in phrases:
    p = " ".join(p.strip().split())
    if len(p) > 5:
        clean.add(p)

result = sorted(clean)
random.shuffle(result)
result = result[:20000]
result.sort()

with open("/home/amer/Desktop/Projects/SmartChat/battery_connection_training.json", "w") as f:
    json.dump(result, f, indent=2)

print(f"Generated {len(result)} unique training phrases")
