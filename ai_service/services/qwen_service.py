"""Qwen2.5-VL service — fabric visual analysis.

Uses Qwen2.5-VL (7B) to analyse the segmented fabric image and extract:
  - fabric_type   (e.g. "Kanchipuram Silk")
  - texture       (e.g. "smooth with subtle sheen")
  - motifs        (e.g. ["floral", "peacock", "geometric border"])
  - colors        (e.g. ["deep maroon", "gold", "ivory"])
  - embroidery    (e.g. "intricate gold zari threadwork")
  - material      (e.g. "pure silk")

The output is a structured dict used by the prompt engineering service.
"""

from __future__ import annotations

import json
import logging
import re
from functools import lru_cache
from typing import Any

import torch
from PIL import Image

from ai_service.core.config import ai_settings

logger = logging.getLogger(__name__)

# ─── system prompt ────────────────────────────────────────────────────────────

ANALYSIS_SYSTEM_PROMPT = """You are a master Indian textile expert and fashion analyst with 30 years of experience.
You specialise in identifying South Indian and North Indian fabrics, weaves, and embroidery techniques.
You must analyse fabric images with extreme precision and return ONLY valid JSON."""

ANALYSIS_USER_PROMPT = """Analyse this fabric swatch image and return a JSON object with these exact fields:

{
  "fabric_type": "<specific fabric name, e.g. Kanchipuram Silk, Banarasi Brocade, Cotton Voile>",
  "texture": "<describe the surface texture in 4-8 words>",
  "motifs": ["<motif 1>", "<motif 2>", ...],
  "colors": ["<primary color>", "<secondary color>", ...],
  "embroidery": "<describe embroidery or null if none>",
  "material": "<base material, e.g. pure silk, cotton-silk blend, georgette>",
  "quality": "<premium | standard | casual>"
}

Be specific. Use Indian textile terminology where appropriate.
Return ONLY the JSON — no explanation, no markdown fences."""


class QwenService:
    """Wraps Qwen2.5-VL for vision-language fabric analysis."""

    def __init__(self) -> None:
        self._model = None
        self._processor = None
        self._device = ai_settings.device
        logger.info("QwenService initialised (model not yet loaded)")

    def _load(self) -> None:
        if self._model is not None:
            return
        logger.info("Loading Qwen2.5-VL model…", extra={"model": ai_settings.qwen_model})
        try:
            from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration, BitsAndBytesConfig

            quant_config = None
            if ai_settings.qwen_load_in_4bit:
                quant_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.bfloat16,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4",
                )

            self._model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                ai_settings.qwen_model,
                quantization_config=quant_config,
                torch_dtype=torch.bfloat16,
                device_map="auto",
                cache_dir=ai_settings.model_cache_dir,
                token=ai_settings.hf_token or None,
            )
            self._processor = AutoProcessor.from_pretrained(
                ai_settings.qwen_model,
                cache_dir=ai_settings.model_cache_dir,
            )
            logger.info("Qwen2.5-VL loaded successfully")
        except ImportError as exc:
            logger.warning("Transformers/Qwen not available; using fallback analysis", extra={"error": str(exc)})

    def analyse_fabric(self, segmented_image: Image.Image) -> dict[str, Any]:
        """
        Run visual analysis on the segmented fabric image.

        Returns a dict with keys: fabric_type, texture, motifs, colors,
        embroidery, material, quality.
        Falls back to a generic description if model is unavailable.
        """
        self._load()

        if self._model is None or self._processor is None:
            return self._fallback_analysis()

        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": segmented_image},
                        {"type": "text", "text": ANALYSIS_USER_PROMPT},
                    ],
                }
            ]

            text_input = self._processor.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
            inputs = self._processor(
                text=[text_input],
                images=[segmented_image],
                return_tensors="pt",
            ).to(self._device)

            with torch.inference_mode():
                output_ids = self._model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.1,
                    do_sample=False,
                )

            # Decode only the new tokens
            generated = output_ids[:, inputs["input_ids"].shape[1]:]
            raw_text = self._processor.batch_decode(
                generated, skip_special_tokens=True
            )[0].strip()

            analysis = self._parse_json(raw_text)
            logger.info("Fabric analysis complete", extra={"fabric_type": analysis.get("fabric_type")})
            return analysis

        except Exception as exc:
            logger.error("Qwen inference failed; using fallback", extra={"error": str(exc)})
            return self._fallback_analysis()

    @staticmethod
    def _parse_json(raw: str) -> dict[str, Any]:
        """Extract JSON from model output, handling common formatting noise."""
        # Strip markdown code fences if present
        raw = re.sub(r"```(?:json)?", "", raw).strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Try to extract the first {...} block
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
            raise

    @staticmethod
    def _fallback_analysis() -> dict[str, Any]:
        """Generic analysis when model is unavailable (dev/test mode)."""
        return {
            "fabric_type": "Indian Silk",
            "texture": "smooth with elegant sheen",
            "motifs": ["floral", "geometric border"],
            "colors": ["rich jewel tone", "golden accent"],
            "embroidery": "delicate embroidery work",
            "material": "silk blend",
            "quality": "premium",
        }


@lru_cache(maxsize=1)
def get_qwen_service() -> QwenService:
    return QwenService()
