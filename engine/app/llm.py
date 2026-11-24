"""Claude wrapper that returns parsed JSON, or None when no key / failure (caller falls back)."""
from __future__ import annotations

import json
import re

from . import config


def claude_json(system: str, prompt: str, max_tokens: int = 2000) -> dict | list | None:
    if not config.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic

        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        msg = client.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            system=system + "\nRespond with JSON only. No prose, no code fences.",
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
        match = re.search(r"[\[{].*[\]}]", text, re.S)
        return json.loads(match.group(0)) if match else None
    except Exception as exc:  # network, parse, quota: fall back to demo
        print(f"[llm] fallback: {exc}")
        return None
