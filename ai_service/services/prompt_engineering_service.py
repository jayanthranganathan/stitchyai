"""Prompt engineering service.

Translates Qwen fabric analysis + user category into a rich, fashion-grade
text prompt optimised for FLUX.1 Kontext Dev image generation.

Example output:
  "Luxury deep maroon Kanchipuram pure silk half saree with intricate gold
   zari floral and peacock motif embroidery. Worn by an elegant South Indian
   woman. Elegant bridal draping style, golden border, professional fashion
   photography, soft studio lighting, ultra-detailed, 8K resolution."
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# ─── category-specific style templates ───────────────────────────────────────

CATEGORY_TEMPLATES: dict[str, dict[str, str]] = {
    "Saree": {
        "style": "draped as an elegant saree with pleated pallu, worn by a graceful Indian woman",
        "setting": "professional fashion photography, soft diffused lighting",
        "suffix": "elegant draping, full-length view, ultra-detailed",
    },
    "Half Saree": {
        "style": "styled as a traditional South Indian half saree (langa voni / pavadai dhavani)",
        "setting": "festive occasion backdrop, warm golden hour lighting",
        "suffix": "three-piece set, beautiful draping, ultra-detailed fashion photography",
    },
    "Lehenga": {
        "style": "crafted into an opulent bridal lehenga with flared skirt and matching choli",
        "setting": "grand wedding backdrop, dramatic lighting",
        "suffix": "floor-length lehenga, heavy embellishment, ultra-detailed",
    },
    "Churidar": {
        "style": "tailored as a fitted churidar suit with long kurta and dupatta",
        "setting": "clean studio backdrop, even lighting",
        "suffix": "elegant fitted cut, traditional styling, ultra-detailed",
    },
    "Salwar": {
        "style": "fashioned into a flowing salwar kameez with wide dupatta",
        "setting": "lifestyle photography setting, natural daylight",
        "suffix": "relaxed silhouette, graceful drape, ultra-detailed",
    },
    "Bridal Blouse": {
        "style": "designed as a heavily embellished bridal blouse with saree",
        "setting": "luxury bridal photoshoot, professional lighting",
        "suffix": "intricate detailing, pearl and stone work, ultra-detailed close-up",
    },
    "Designer Blouse": {
        "style": "crafted as a contemporary designer blouse with modern cut detailing",
        "setting": "high-fashion studio photography",
        "suffix": "clean lines, modern aesthetic, ultra-detailed",
    },
    "Anarkali": {
        "style": "designed as a majestic floor-length Anarkali suit with wide flare and churidar",
        "setting": "regal palace backdrop, dramatic side lighting",
        "suffix": "floor-length flared silhouette, princess cut, ultra-detailed",
    },
    "Kids Silk Set": {
        "style": "tailored as a traditional silk set for a young girl (pattu pavadai / lehenga)",
        "setting": "bright festive backdrop, warm lighting",
        "suffix": "age-appropriate styling, vibrant colors, ultra-detailed",
    },
    "Indo-Western": {
        "style": "designed as an Indo-Western fusion outfit combining traditional fabric with contemporary cut",
        "setting": "modern fashion editorial photography",
        "suffix": "fusion aesthetic, contemporary silhouette, ultra-detailed",
    },
    "Gown": {
        "style": "transformed into an elegant floor-length Indian gown with structured bodice",
        "setting": "luxury gala event backdrop, dramatic lighting",
        "suffix": "A-line silhouette, glamorous detailing, ultra-detailed",
    },
    "Kurti": {
        "style": "fashioned into a versatile straight-cut kurti with subtle design elements",
        "setting": "lifestyle photography, natural window lighting",
        "suffix": "comfortable fit, everyday elegance, ultra-detailed",
    },
}

# ─── quality boosters always appended ────────────────────────────────────────

QUALITY_SUFFIX = (
    "photorealistic, 8K, ultra-high resolution, professional fashion photography, "
    "sharp focus, detailed fabric texture, perfect color accuracy"
)

NEGATIVE_PROMPT = (
    "blurry, low quality, distorted fabric, wrong proportions, unrealistic, "
    "cartoon, sketch, watermark, text overlay, bad anatomy, deformed hands"
)


def build_generation_prompt(
    fabric_analysis: dict[str, Any],
    category: str,
    style_notes: str | None = None,
) -> tuple[str, str]:
    """
    Build the positive and negative prompts for FLUX.1.

    Returns:
        (positive_prompt, negative_prompt)
    """
    template = CATEGORY_TEMPLATES.get(category, CATEGORY_TEMPLATES["Kurti"])

    # ── Extract fabric attributes ──────────────────────────────────────────
    fabric_type = fabric_analysis.get("fabric_type", "Indian fabric")
    colors = fabric_analysis.get("colors", [])
    color_str = " and ".join(colors[:2]) if colors else "rich"
    motifs = fabric_analysis.get("motifs", [])
    motif_str = ", ".join(motifs[:3]) if motifs else "traditional"
    embroidery = fabric_analysis.get("embroidery")
    material = fabric_analysis.get("material", "silk")
    quality = fabric_analysis.get("quality", "premium")

    # ── Fabric description ─────────────────────────────────────────────────
    fabric_desc = f"{color_str} {fabric_type} ({material})"
    if motifs:
        fabric_desc += f" with {motif_str} motifs"
    if embroidery:
        fabric_desc += f", adorned with {embroidery}"

    # ── Assemble full prompt ───────────────────────────────────────────────
    positive = (
        f"{quality.capitalize()} {fabric_desc}, "
        f"{template['style']}. "
        f"{template['setting']}. "
    )
    if style_notes:
        positive += f"Style preference: {style_notes}. "
    positive += f"{template['suffix']}, {QUALITY_SUFFIX}"

    logger.info("Prompt engineered", extra={"category": category, "prompt_length": len(positive)})
    return positive, NEGATIVE_PROMPT
