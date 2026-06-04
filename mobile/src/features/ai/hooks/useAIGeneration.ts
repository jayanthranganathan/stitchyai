/**
 * TanStack Query hooks for the AI generation feature.
 *
 * Polling strategy:
 *   - While queued     → every 10 s  (no GPU work yet, no rush)
 *   - While processing → every 3 s   (GPU is running, user is watching)
 *   - Completed/failed → stop polling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as aiApi from '../api/aiGenerationApi';
import { useAIGenerationStore } from '../store/aiGenerationStore';
import type {
  FashionCategory,
  GenerationJob,
  GenerationStage,
  RegenerateRequest,
} from '../types';

// ─── query keys ────────────────────────────────────────────────────────────

export const aiKeys = {
  status: (jobId: string) => ['ai', 'job', jobId] as const,
  results: (jobId: string) => ['ai', 'results', jobId] as const,
  history: ['ai', 'history'] as const,
};

// ─── upload + generate (two-step mutation) ─────────────────────────────────

/**
 * Step 1: Upload the fabric image.
 * On success, stores upload_id and preview URL in Zustand.
 */
export function useFabricUpload() {
  const { setFabric, fabricUri } = useAIGenerationStore();

  return useMutation({
    mutationFn: (imageUri: string) => aiApi.uploadFabric(imageUri),
    onSuccess: (resp, imageUri) => {
      setFabric(imageUri, resp.upload_id, resp.fabric_url);
    },
  });
}

/**
 * Step 2: Enqueue generation job.
 * On success, stores job_id and navigates (caller handles navigation).
 */
export function useGenerateDesigns() {
  const { setActiveJob, addSavedJobId } = useAIGenerationStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      uploadId,
      category,
      styleNotes,
    }: {
      uploadId: string;
      category: FashionCategory;
      styleNotes?: string;
    }) =>
      aiApi.generateDesigns({
        upload_id: uploadId,
        category,
        style_notes: styleNotes,
      }),
    onSuccess: (resp) => {
      setActiveJob(resp.job_id);
      addSavedJobId(resp.job_id);
      // Seed the query cache so the processing screen has data immediately
      queryClient.setQueryData(aiKeys.status(resp.job_id), {
        job_id: resp.job_id,
        status: resp.status,
        queue_position: resp.queue_position,
        stage: 'uploading' as GenerationStage,
        progress_percent: 0,
        designs: [],
      } as Partial<GenerationJob>);
    },
  });
}

// ─── status polling ────────────────────────────────────────────────────────

/** Real-time generation status with adaptive polling interval. */
export function useGenerationStatus(jobId: string | null) {
  return useQuery({
    queryKey: aiKeys.status(jobId ?? ''),
    queryFn: () => aiApi.getGenerationStatus(jobId!),
    enabled: !!jobId,
    // Adaptive polling: fast while processing, slow while queued, stop when done
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === 'completed' || status === 'failed') return false;
      if (status === 'processing') return 3_000;
      return 10_000; // queued
    },
    staleTime: 0, // always re-fetch during active generation
  });
}

// ─── results ──────────────────────────────────────────────────────────────

/** Fetch final results once we know the job is completed. */
export function useGenerationResults(jobId: string | null) {
  return useQuery({
    queryKey: aiKeys.results(jobId ?? ''),
    queryFn: () => aiApi.getResults(jobId!),
    enabled: !!jobId,
    staleTime: 5 * 60 * 1000, // results don't change — 5 min cache
  });
}

// ─── regenerate ────────────────────────────────────────────────────────────

export function useRegenerateDesigns() {
  const { setActiveJob, addSavedJobId } = useAIGenerationStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: RegenerateRequest) => aiApi.regenerateDesigns(req),
    onSuccess: (resp) => {
      setActiveJob(resp.job_id);
      addSavedJobId(resp.job_id);
      queryClient.setQueryData(aiKeys.status(resp.job_id), {
        job_id: resp.job_id,
        status: resp.status,
        stage: 'uploading' as GenerationStage,
        progress_percent: 0,
        designs: [],
      } as Partial<GenerationJob>);
    },
  });
}

// ─── save / unsave ─────────────────────────────────────────────────────────

export function useSaveDesign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ designId, save }: { designId: string; save: boolean }) =>
      save ? aiApi.saveDesign(designId) : aiApi.unsaveDesign(designId),
    onSuccess: () => {
      // Invalidate history so saved designs list refreshes
      void queryClient.invalidateQueries({ queryKey: aiKeys.history });
    },
  });
}

// ─── history ──────────────────────────────────────────────────────────────

export function useAIHistory() {
  return useQuery({
    queryKey: aiKeys.history,
    queryFn: aiApi.getHistory,
    staleTime: 60_000,
  });
}
