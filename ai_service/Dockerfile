# ── AI Inference Service — Docker image ──────────────────────────────────────
#
# Base: NVIDIA CUDA 12.1 + cuDNN 8 (matches RunPod A100/H100 images)
# Two stages:
#   builder  — installs Python deps
#   runtime  — lean production image

FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3.11-dev python3-pip python3.11-venv \
    git wget curl libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Use python3.11 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 \
    && update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

WORKDIR /app

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install torch==2.3.1 torchvision==0.18.1 --index-url https://download.pytorch.org/whl/cu121 \
    && pip install -r requirements.txt \
    && pip install git+https://github.com/facebookresearch/sam2.git

# ── Runtime stage ─────────────────────────────────────────────────────────────

FROM nvidia/cuda:12.1.1-cudnn8-runtime-ubuntu22.04 AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app
COPY . .

# Create model cache directory
RUN mkdir -p /workspace/models/controlnet_refs

# ── Health check (checks Celery worker is alive via Redis) ────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "from ai_service.workers.celery_app import celery_app; celery_app.control.inspect().active()" || exit 1

# Default: run Celery worker
CMD ["celery", "-A", "ai_service.workers.celery_app", "worker", \
     "--queues", "ai_generation", \
     "--concurrency", "1", \
     "--pool", "solo", \
     "--loglevel", "INFO", \
     "--logfile", "/var/log/celery/ai_worker.log"]
