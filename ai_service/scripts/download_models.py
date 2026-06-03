"""
Model download script — run once on first container boot.

Downloads all AI models to the RunPod network volume so subsequent
restarts don't re-download (saves bandwidth + startup time).

Total storage: ~40 GB
  FLUX.1-dev:        ~23 GB
  Qwen2.5-VL-7B:    ~14 GB (4-bit = ~6 GB)
  SAM2-large:        ~600 MB
  IP-Adapter:        ~200 MB
  ControlNet:        ~1.4 GB
"""

from __future__ import annotations

import logging
import os
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MODEL_DIR = os.environ.get("MODEL_CACHE_DIR", "/runpod-volume/models")
HF_TOKEN = os.environ.get("HF_TOKEN", "")
os.environ["TRANSFORMERS_CACHE"] = MODEL_DIR
os.environ["HF_HOME"] = MODEL_DIR


def download_all() -> None:
    from huggingface_hub import snapshot_download

    models = [
        # SAM2 (smallest, download first)
        {"repo_id": "facebook/sam2-hiera-large", "local_dir": f"{MODEL_DIR}/sam2"},
        # IP-Adapter
        {"repo_id": "h94/IP-Adapter", "local_dir": f"{MODEL_DIR}/ip-adapter",
         "ignore_patterns": ["*.md", "*.txt", "sdxl*"]},
        # Qwen2.5-VL-7B
        {"repo_id": "Qwen/Qwen2.5-VL-7B-Instruct", "local_dir": f"{MODEL_DIR}/qwen",
         "token": HF_TOKEN or None},
        # FLUX.1-dev (largest, download last)
        {"repo_id": "black-forest-labs/FLUX.1-dev", "local_dir": f"{MODEL_DIR}/flux",
         "token": HF_TOKEN or None},
    ]

    for m in models:
        logger.info("Downloading %s…", m["repo_id"])
        try:
            snapshot_download(**{k: v for k, v in m.items() if v is not None})
            logger.info("Downloaded %s ✓", m["repo_id"])
        except Exception as exc:
            logger.error("Failed to download %s: %s", m["repo_id"], exc)
            sys.exit(1)

    logger.info("All models downloaded successfully.")


if __name__ == "__main__":
    download_all()
