"""Image utility functions for the AI pipeline."""

from __future__ import annotations

import io

from PIL import Image


def bytes_to_pil(data: bytes) -> Image.Image:
    """Convert raw bytes to a PIL Image (RGB)."""
    return Image.open(io.BytesIO(data)).convert("RGB")


def pil_to_bytes(image: Image.Image, *, format: str = "JPEG", quality: int = 92) -> bytes:
    """Encode a PIL Image to bytes."""
    buf = io.BytesIO()
    image.save(buf, format=format, quality=quality)
    return buf.getvalue()


def make_thumbnail(image: Image.Image, width: int, height: int) -> Image.Image:
    """Crop-resize to exact dimensions without distortion."""
    # Calculate the target aspect ratio
    target_ratio = width / height
    img_ratio = image.width / image.height

    if img_ratio > target_ratio:
        # Image is wider than target: crop sides
        new_width = int(image.height * target_ratio)
        offset = (image.width - new_width) // 2
        image = image.crop((offset, 0, offset + new_width, image.height))
    else:
        # Image is taller than target: crop top/bottom
        new_height = int(image.width / target_ratio)
        offset = (image.height - new_height) // 2
        image = image.crop((0, offset, image.width, offset + new_height))

    return image.resize((width, height), Image.LANCZOS)


def resize_for_inference(
    image: Image.Image,
    max_side: int = 1024,
) -> Image.Image:
    """Resize so the longest side is max_side, preserving aspect ratio."""
    w, h = image.size
    if max(w, h) <= max_side:
        return image
    if w >= h:
        new_w = max_side
        new_h = int(h * max_side / w)
    else:
        new_h = max_side
        new_w = int(w * max_side / h)
    return image.resize((new_w, new_h), Image.LANCZOS)


def pad_to_square(image: Image.Image, fill_color: tuple = (255, 255, 255)) -> Image.Image:
    """Pad image to a square with fill_color."""
    w, h = image.size
    side = max(w, h)
    result = Image.new("RGB", (side, side), fill_color)
    result.paste(image, ((side - w) // 2, (side - h) // 2))
    return result
