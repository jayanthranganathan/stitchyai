#!/bin/bash
# ── Local GPU Server Startup Script ──────────────────────────────────────────
#
# Use this instead of runpod_start.sh when hosting on your own machine.
# Run once manually or set up as a systemd service (see instructions below).
#
# Usage:
#   chmod +x scripts/local_start.sh
#   ./scripts/local_start.sh

set -e

MODEL_DIR="${MODEL_CACHE_DIR:-/opt/stitchy/models}"
LOCK_FILE="$MODEL_DIR/.models_downloaded"

mkdir -p "$MODEL_DIR"
mkdir -p /var/log/celery

echo "=========================================="
echo " Stitchy.ai AI Worker — Local GPU Server"
echo "=========================================="
echo "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader 2>/dev/null || echo 'Not detected')"
echo "VRAM: $(nvidia-smi --query-gpu=memory.total --format=csv,noheader 2>/dev/null || echo 'N/A')"
echo "Model dir: $MODEL_DIR"
echo "=========================================="

# ── Download models on first boot ────────────────────────────────────────────
if [ ! -f "$LOCK_FILE" ]; then
    echo ""
    echo ">>> First boot: downloading all AI models (~40 GB)."
    echo ">>> This takes 20-60 minutes depending on your internet speed."
    echo ">>> Subsequent starts will skip this step."
    echo ""
    python /app/scripts/download_models.py
    touch "$LOCK_FILE"
    echo ">>> Models downloaded and cached at $MODEL_DIR"
else
    echo ">>> Models already cached — skipping download."
fi

echo ""
echo ">>> Starting Celery AI worker..."

# Start Celery worker
exec celery -A ai_service.workers.celery_app worker \
    --queues ai_generation \
    --concurrency 1 \
    --pool solo \
    --loglevel INFO \
    --logfile /var/log/celery/ai_worker.log
