"""SAM2 service — fabric region segmentation.

Uses Meta's Segment Anything Model 2 to isolate the fabric/textile region
from the uploaded image, removing backgrounds, hands, props, etc.

Output: a masked PIL image containing only the fabric region.
"""

from __future__ import annotations

import logging
from functools import lru_cache

import numpy as np
import torch
from PIL import Image

from ai_service.core.config import ai_settings
from ai_service.utils.image_utils import bytes_to_pil, resize_for_inference

logger = logging.getLogger(__name__)


class SAM2Service:
    """Wraps the SAM2 model for fabric segmentation."""

    def __init__(self) -> None:
        self._model = None
        self._processor = None
        self._device = ai_settings.device
        logger.info("SAM2Service initialised (model not yet loaded)")

    def _load(self) -> None:
        """Lazy-load SAM2 on first use (saves VRAM during startup)."""
        if self._model is not None:
            return
        logger.info("Loading SAM2 model…", extra={"checkpoint": ai_settings.sam2_checkpoint})
        try:
            from sam2.build_sam import build_sam2
            from sam2.sam2_image_predictor import SAM2ImagePredictor

            self._model = SAM2ImagePredictor.from_pretrained(
                ai_settings.sam2_checkpoint,
                device=self._device,
            )
            logger.info("SAM2 loaded successfully")
        except ImportError:
            # sam2 not yet installed — graceful degradation (return full image)
            logger.warning("SAM2 library not found; fabric segmentation will be skipped")

    def segment_fabric(self, image_data: bytes) -> Image.Image:
        """
        Segment the fabric region from the input image.

        Strategy:
        1. Run SAM2 with a centre-point prompt (assumes fabric fills most of the frame)
        2. If SAM2 is unavailable, return the original image (graceful degradation)
        3. Apply the mask: white background, fabric in foreground

        Returns a PIL Image (RGB) with non-fabric areas set to neutral grey.
        """
        self._load()
        pil_img = bytes_to_pil(image_data)
        pil_img = resize_for_inference(pil_img, max_side=1024)

        if self._model is None:
            # SAM2 not available — return full image
            logger.warning("SAM2 unavailable; skipping segmentation")
            return pil_img

        try:
            img_array = np.array(pil_img)
            h, w = img_array.shape[:2]

            # Centre-point prompt: best default for fabric swatches
            centre_point = np.array([[w // 2, h // 2]])
            centre_label = np.array([1])  # foreground

            with torch.inference_mode():
                self._model.set_image(img_array)
                masks, scores, _ = self._model.predict(
                    point_coords=centre_point,
                    point_labels=centre_label,
                    multimask_output=True,
                )

            # Pick the mask with the highest confidence score
            best_mask_idx = int(np.argmax(scores))
            mask = masks[best_mask_idx].astype(np.uint8) * 255  # 0/255 binary mask

            # Composite: fabric on neutral grey background
            fabric_region = Image.fromarray(img_array)
            background = Image.new("RGB", (w, h), (200, 200, 200))
            mask_pil = Image.fromarray(mask, mode="L")
            result = Image.composite(fabric_region, background, mask_pil)

            logger.info("SAM2 segmentation complete", extra={"score": float(scores[best_mask_idx])})
            return result

        except Exception as exc:
            logger.error("SAM2 inference failed; returning original image", extra={"error": str(exc)})
            return pil_img


@lru_cache(maxsize=1)
def get_sam2_service() -> SAM2Service:
    return SAM2Service()
