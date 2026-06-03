#!/bin/bash
# RunPod startup script
# Runs model download on first boot, then starts the Celery worker

set -e

MODEL_DIR="${MODEL_CACHE_DIR:-/runpod-volume/models}"
LOCK_FILE="$MODEL_DIR/.models_downloaded"

mkdir -p "$MODEL_DIR"

if [ ! -f "$LOCK_FILE" ]; then
    echo "=== First boot: downloading AI models ==="
    python /app/scripts/download_models.py
    touch "$LOCK_FILE"
    echo "=== Models downloaded and cached ==="
else
    echo "=== Models already cached, skipping download ==="
fi

echo "=== Starting AI generation worker ==="
exec celery -A ai_service.workers.celery_app worker \
    --queues ai_generation \
    --concurrency 1 \
    --pool solo \
    --loglevel INFO
