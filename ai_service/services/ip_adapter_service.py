"""IP-Adapter service — fabric texture and style preservation.

IP-Adapter is injected into the FLUX.1 pipeline as an image conditioning
mechanism. It encodes the segmented fabric image into the latent space so
the generator preserves:
  - Colour palette
  - Weave / texture patterns
  - Embroidery motifs
  - Overall fabric identity

Integration: IP-Adapter is NOT run as a separate service; it is loaded as
a component inside the FLUX pipeline (see flux_service.py).
This module provides the image encoding step only.
"""

from __future__ import annotations

import logging
from functools import lru_cache

import torch
from PIL import Image

from ai_service.core.config import ai_settings

logger = logging.getLogger(__name__)


class IPAdapterService:
    """Encodes a reference image into IP-Adapter embeddings."""

    def __init__(self) -> None:
        self._image_encoder = None
        self._image_processor = None
        self._device = ai_settings.device
        logger.info("IPAdapterService initialised (encoder not yet loaded)")

    def _load(self) -> None:
        if self._image_encoder is not None:
            return
        logger.info("Loading IP-Adapter image encoder…")
        try:
            from transformers import CLIPVisionModelWithProjection, CLIPImageProcessor

            # IP-Adapter uses CLIP ViT-H image encoder
            self._image_encoder = CLIPVisionModelWithProjection.from_pretrained(
                "h94/IP-Adapter",
                subfolder="models/image_encoder",
                torch_dtype=torch.float16,
                cache_dir=ai_settings.model_cache_dir,
            ).to(self._device)
            self._image_processor = CLIPImageProcessor()
            self._image_encoder.eval()
            logger.info("IP-Adapter image encoder loaded successfully")
        except Exception as exc:
            logger.warning(
                "IP-Adapter encoder not available; fabric texture may be less preserved",
                extra={"error": str(exc)},
            )

    def encode_reference_image(
        self, fabric_image: Image.Image
    ) -> torch.Tensor | None:
        """
        Encode the segmented fabric into CLIP image embeddings.

        Returns:
            Tensor of shape (1, 257, 1024) for ViT-H, or None if unavailable.
        """
        self._load()
        if self._image_encoder is None:
            return None

        try:
            inputs = self._image_processor(
                images=fabric_image,
                return_tensors="pt",
            ).to(self._device)

            with torch.inference_mode():
                outputs = self._image_encoder(**inputs)
                # image_embeds: (batch, hidden_size)
                image_embeds = outputs.image_embeds

            logger.debug("IP-Adapter encoding complete", extra={"embed_shape": str(image_embeds.shape)})
            return image_embeds

        except Exception as exc:
            logger.error("IP-Adapter encoding failed", extra={"error": str(exc)})
            return None

    def get_ip_adapter_scale(self) -> float:
        """Return the IP-Adapter conditioning strength from config."""
        return ai_settings.ip_adapter_scale


@lru_cache(maxsize=1)
def get_ip_adapter_service() -> IPAdapterService:
    return IPAdapterService()
