/**
 * AI Generation API service.
 * Follows the exact same pattern as customer/api.ts — wraps axios calls,
 * returns typed data, never touches React state.
 */

import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';

import type {
  FabricUploadResponse,
  GenerateDesignsRequest,
  GenerateDesignsResponse,
  GenerationJob,
  RegenerateRequest,
} from '../types';

// ─── fabric upload ─────────────────────────────────────────────────────────

/**
 * Upload a fabric image as multipart/form-data.
 * Returns an upload_id (S3 key) used by all subsequent calls.
 */
export async function uploadFabric(imageUri: string): Promise<FabricUploadResponse> {
  const form = new FormData();
  form.append('image', {
    uri: imageUri,
    name: 'fabric.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const { data } = await apiClient.post<FabricUploadResponse>(
    endpoints.ai.fabricUpload,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30_000, // uploads can be slow on mobile networks
    },
  );
  return data;
}

// ─── generation ────────────────────────────────────────────────────────────

/** Enqueue a new generation job. Returns job_id and queue position. */
export async function generateDesigns(
  req: GenerateDesignsRequest,
): Promise<GenerateDesignsResponse> {
  const { data } = await apiClient.post<GenerateDesignsResponse>(
    endpoints.ai.generateDesigns,
    req,
  );
  return data;
}

/** Poll job status. Called every 3–10 seconds by TanStack Query. */
export async function getGenerationStatus(jobId: string): Promise<GenerationJob> {
  const { data } = await apiClient.get<GenerationJob>(
    endpoints.ai.generationStatus(jobId),
  );
  return data;
}

/** Fetch final results (same shape as status, but guaranteed completed). */
export async function getResults(jobId: string): Promise<GenerationJob> {
  const { data } = await apiClient.get<GenerationJob>(
    endpoints.ai.results(jobId),
  );
  return data;
}

/** Regenerate all or one design within an existing job. Returns a NEW job_id. */
export async function regenerateDesigns(
  req: RegenerateRequest,
): Promise<GenerateDesignsResponse> {
  const { data } = await apiClient.post<GenerateDesignsResponse>(
    endpoints.ai.regenerate,
    req,
  );
  return data;
}

// ─── saved designs ─────────────────────────────────────────────────────────

/** Toggle the saved flag on a single design. */
export async function saveDesign(designId: string): Promise<void> {
  await apiClient.post(endpoints.ai.saveDesign, { design_id: designId });
}

export async function unsaveDesign(designId: string): Promise<void> {
  await apiClient.delete(`${endpoints.ai.saveDesign}/${designId}`);
}

/** User's saved / history designs. */
export async function getHistory(): Promise<GenerationJob[]> {
  const { data } = await apiClient.get<GenerationJob[]>(endpoints.ai.history);
  return data;
}
