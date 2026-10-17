import json
import logging
import re
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger("portguard.ollama")


class OllamaClient:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, default_model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model

    async def is_available(self) -> bool:
        """Checks if local Ollama daemon is reachable."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def get_available_models(self) -> list[str]:
        """Returns list of models installed in local Ollama."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    return [m.get("name") for m in data.get("models", [])]
        except Exception as e:
            logger.warning(f"Could not query Ollama models: {e}")
        return []

    async def select_best_model(self) -> str:
        """Finds the most suitable installed model among preferred choices."""
        available = await self.get_available_models()
        if not available:
            return self.default_model
        
        candidates = [self.default_model] + settings.OLLAMA_FALLBACK_MODELS
        for cand in candidates:
            for avail in available:
                if cand in avail or avail.startswith(cand):
                    return avail
        return available[0]

    async def generate_json(self, prompt: str, system_prompt: Optional[str] = None, model: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Sends prompt to local Ollama with format='json' enforced.
        """
        target_model = model or await self.select_best_model()
        payload = {
            "model": target_model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.1,  # Low temperature for strict factual extraction
                "top_p": 0.9,
            }
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                if response.status_code == 200:
                    result = response.json()
                    response_text = result.get("response", "{}").strip()
                    
                    # Clean markdown codeblocks if present
                    if response_text.startswith("```json"):
                        response_text = response_text[7:]
                    elif response_text.startswith("```"):
                        response_text = response_text[3:]
                    if response_text.endswith("```"):
                        response_text = response_text[:-3]
                    response_text = response_text.strip()

                    try:
                        return json.loads(response_text)
                    except json.JSONDecodeError:
                        # Extract first valid json object with regex
                        match = re.search(r"(\{.*\})", response_text, re.DOTALL)
                        if match:
                            return json.loads(match.group(1))
                        raise
                else:
                    logger.error(f"Ollama returned HTTP {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Ollama call failed or timed out: {e}")
        return None


ollama_client = OllamaClient()
