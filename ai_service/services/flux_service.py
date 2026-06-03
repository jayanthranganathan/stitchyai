"""FLUX.1 Kontext Dev — main image generation engine.

Orchestrates:
  - FLUX.1-dev base pipeline
  - IP-Adapter conditioning (fabric texture preservation)
  - ControlNet conditioning (garment silhouette structure)

Generates num_designs (default: 4) images per inference call using
different random seeds for variety while maintaining fabric consistency.
"""

from __future__ import annotations

import logging
import random
from functools import lru_cache

import torch
from PIL import Image

from ai_service.core.config import ai_settings
from ai_service.utils.image_utils import make_thumbnail, pil_to_bytes, resize_for_inference

logger = logging.getLogger(__name__)


class FluxService:
    """FLUX.1 Kontext Dev generation pipeline with IP-Adapter + ControlNet."""

    def __init__(self) -> None:
        self._pipe = None
        self._device = ai_settings.device
        self._dtype = torch.bfloat16
        logger.info("FluxService initialised (pipeline not yet loaded)")

    def _load(self) -> None:
        if self._pipe is not None:
            return
        logger.info("Loading FLUX.1 pipeline…", extra={"model": ai_settings.flux_model})
        try:
            from diffusers import FluxPipeline, FluxControlNetPipeline

            # Choose pipeline: ControlNet variant if model is available
            from ai_service.services.controlnet_service import get_controlnet_service
            controlnet = get_controlnet_service().get_controlnet_model()

            if controlnet is not None:
                self._pipe = FluxControlNetPipeline.from_pretrained(
                    ai_settings.flux_model,
                    controlnet=controlnet,
                    torch_dtype=self._dtype,
                    variant=ai_settings.flux_variant,
                    cache_dir=ai_settings.model_cache_dir,
                    token=ai_settings.hf_token or None,
                )
            else:
                self._pipe = FluxPipeline.from_pretrained(
                    ai_settings.flux_model,
                    torch_dtype=self._dtype,
                    variant=ai_settings.flux_variant,
                    cache_dir=ai_settings.model_cache_dir,
                    token=ai_settings.hf_token or None,
                )

            if ai_settings.enable_model_cpu_offload:
                self._pipe.enable_model_cpu_offload()
            else:
                self._pipe = self._pipe.to(self._device)

            if ai_settings.enable_xformers:
                try:
                    self._pipe.enable_xformers_memory_efficient_attention()
                    logger.info("xFormers memory-efficient attention enabled")
                except Exception:
                    logger.warning("xFormers not available; using standard attention")

            # Load IP-Adapter weights into the pipeline
            try:
                self._pipe.load_ip_adapter(
                    ai_settings.ip_adapter_model,
                    subfolder="models",
                    weight_name="ip-adapter_sd15.bin",
                )
                self._pipe.set_ip_adapter_scale(ai_settings.ip_adapter_scale)
                logger.info("IP-Adapter weights loaded into FLUX pipeline")
            except Exception as exc:
                logger.warning("IP-Adapter not loaded; fabric preservation disabled", extra={"error": str(exc)})

            logger.info("FLUX.1 pipeline ready")

        except Exception as exc:
            logger.error("FLUX.1 load failed", extra={"error": str(exc)})
            raise

    def generate(
        self,
        *,
        positive_prompt: str,
        negative_prompt: str,
        fabric_image: Image.Image,
        control_image: Image.Image | None,
        ip_adapter_image_embeds: "torch.Tensor | None",
        num_designs: int = 4,
        base_seed: int | None = None,
    ) -> list[dict]:
        """
        Generate `num_designs` dress images.

        Returns a list of dicts:
          [{"image": PIL.Image, "thumbnail": PIL.Image, "seed": int,
            "prompt_used": str, "inference_steps": int, "guidance_scale": float}, ...]
        """
        self._load()

        if base_seed is None:
            base_seed = random.randint(0, 2**31)

        width = ai_settings.output_width
        height = ai_settings.output_height
        steps = ai_settings.num_inference_steps
        guidance = ai_settings.guidance_scale

        results = []

        for i in range(num_designs):
            seed = base_seed + i * 1000  # deterministic variation per index
            generator = torch.Generator(device=self._device).manual_seed(seed)

            logger.info(
                "Generating design",
                extra={"index": i, "seed": seed, "category": positive_prompt[:40]},
            )

            try:
                call_kwargs: dict = {
                    "prompt": positive_prompt,
                    "negative_prompt": negative_prompt,
                    "num_inference_steps": steps,
                    "guidance_scale": guidance,
                    "width": width,
                    "height": height,
                    "generator": generator,
                    "num_images_per_prompt": 1,
                }

                # Inject IP-Adapter conditioning
                if ip_adapter_image_embeds is not None:
                    call_kwargs["ip_adapter_image_embeds"] = ip_adapter_image_embeds

                # Inject ControlNet conditioning
                if control_image is not None and hasattr(self._pipe, "controlnet"):
                    ctrl_resized = control_image.resize((width, height))
                    call_kwargs["control_image"] = ctrl_resized
                    call_kwargs["controlnet_conditioning_scale"] = 0.5

                output = self._pipe(**call_kwargs)
                generated_image: Image.Image = output.images[0]

                thumbnail = make_thumbnail(
                    generated_image,
                    ai_settings.thumbnail_width,
                    ai_settings.thumbnail_height,
                )

                results.append(
                    {
                        "image": generated_image,
                        "thumbnail": thumbnail,
                        "seed": seed,
                        "prompt_used": positive_prompt,
                        "inference_steps": steps,
                        "guidance_scale": guidance,
                    }
                )
                logger.info("Design generated", extra={"index": i, "seed": seed})

            except Exception as exc:
                logger.error("Generation failed for index", extra={"index": i, "error": str(exc)})
                # Continue — generate remaining designs even if one fails
                continue

        if not results:
            raise RuntimeError("All generation attempts failed")

        return results


@lru_cache(maxsize=1)
def get_flux_service() -> FluxService:
    return FluxService()
