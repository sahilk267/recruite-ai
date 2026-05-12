"""
Gemini AI client — uses Replit AI Integrations (no personal API key needed).
Charges billed to Replit credits. Model: gemini-2.5-flash (fast + capable).
"""

import os
import json
import logging

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

_API_KEY  = os.environ.get("AI_INTEGRATIONS_GEMINI_API_KEY", "")
_BASE_URL = os.environ.get("AI_INTEGRATIONS_GEMINI_BASE_URL", "")

# Never cache this client — tokens can expire
def _get_client() -> genai.Client:
    return genai.Client(
        api_key=_API_KEY,
        http_options={"api_version": "", "base_url": _BASE_URL},
    )

MODEL = "gemini-2.5-flash"


def generate(prompt: str) -> str:
    """Raw text generation."""
    client = _get_client()
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(max_output_tokens=8192),
    )
    return response.text or ""


def generate_json(prompt: str) -> dict:
    """Generate text and parse as JSON (strips markdown fences)."""
    raw = generate(prompt).strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:-1]).strip()
    return json.loads(raw)


def is_available() -> bool:
    """Check whether the Gemini integration env vars are configured."""
    return bool(_API_KEY and _BASE_URL)
