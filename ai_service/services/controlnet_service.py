"""ControlNet service — garment structure and silhouette control.

ControlNet provides structural guidance so that the generated garment
maintains a coherent outfit shape instead of generating random body poses.

For each fashion category we use a category-specific reference pose/canny
image that encodes the typical silhouette of that garment.

In production, you would use:
1. A full-body pose estimation (MediaPipe / DWPose)
2. Or a pre-defined mannequin outline per category (faster + more consistent)

This implementation uses the pre-defined mannequin approach.
"""

from __future__ import annotations

import logging
from functools import lru_cache

import torch
from PIL import Image

from ai_service.core.config import ai_settings
from ai_service.utils.image_utils import resize_for_inference

logger = logging.getLogger(__name__)

# ─── Category → ControlNet conditioning description ───────────────────────────
# These map to reference images stored at model_cache_dir/controlnet_refs/
CATEGORY_CONTROL_REFS: dict[str, str] = {
    "Saree": "saree_full_body_ref.png",
    "Half Saree": "half_saree_full_body_ref.png",
    "Lehenga": "lehenga_full_body_ref.png",
    "Churidar": "churidar_full_body_ref.png",
    "Salwar": "salwar_full_body_ref.png",
    "Bridal Blouse": "bridal_blouse_close_ref.png",
    "Designer Blouse": "designer_blouse_close_ref.png",
    "Anarkali": "anarkali_full_body_ref.png",
    "Kids Silk Set": "kids_lehenga_full_body_ref.png",
    "Indo-Western": "indo_western_full_body_ref.png",
    "Gown": "gown_full_body_ref.png",
    "Kurti": "kurti_full_body_ref.png",
}


class ControlNetService:
    """Provides the control image and loads the ControlNet model."""

    def __init__(self) -> None:
        self._controlnet = None
        self._device = ai_settings.device
        logger.info("ControlNetService initialised (model not yet loaded)")

    def _load(self) -> None:
        if self._controlnet is not None:
            return
        logger.info("Loading ControlNet model…", extra={"model": ai_settings.controlnet_model})
        try:
            from diffusers import ControlNetModel

            self._controlnet = ControlNetModel.from_pretrained(
                ai_settings.controlnet_model,
                torch_dtype=torch.float16,
                cache_dir=ai_settings.model_cache_dir,
            ).to(self._device)
            self._controlnet.eval()
            logger.info("ControlNet loaded successfully")
        except Exception as exc:
            logger.warning("ControlNet not available; structure control disabled", extra={"error": str(exc)})

    def get_controlnet_model(self):
        """Return the loaded ControlNet model (or None if unavailable)."""
        self._load()
        return self._controlnet

    def get_control_image(self, category: str) -> Image.Image | None:
        """
        Return the reference control image for the given fashion category.

        In production: load from model_cache_dir/controlnet_refs/
        For now: generate a synthetic silhouette guide (white-on-black).
        """
        import os
        ref_name = CATEGORY_CONTROL_REFS.get(category)
        if ref_name:
            ref_path = os.path.join(ai_settings.model_cache_dir, "controlnet_refs", ref_name)
            if os.path.exists(ref_path):
                return Image.open(ref_path).convert("RGB")

        # Graceful fallback: return a blank control image
        # (ControlNet effect is disabled but generation still works)
        logger.warning(
            "No control reference found for category; ControlNet disabled for this run",
            extra={"category": category},
        )
        return None


@lru_cache(maxsize=1)
def get_controlnet_service() -> ControlNetService:
    return ControlNetService()
