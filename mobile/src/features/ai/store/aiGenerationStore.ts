/**
 * Zustand store for AI generation state.
 *
 * Responsibilities:
 * - Track the active job through the upload → processing → results flow
 * - Persist the last completed job_id so results survive screen navigation
 * - Store the selected fabric URI and category before job creation
 */

import { create } from 'zustand';

import type { FashionCategory, GenerationJob } from '../types';

interface AIGenerationState {
  // ── Fabric upload step ────────────────────────────────────────────────
  fabricUri: string | null;
  fabricUploadId: string | null;
  fabricPreviewUrl: string | null;

  // ── Category selection step ───────────────────────────────────────────
  selectedCategory: FashionCategory | null;
  styleNotes: string;

  // ── Active generation job ─────────────────────────────────────────────
  activeJobId: string | null;
  activeJob: GenerationJob | null;

  // ── History (list of completed jobs) ─────────────────────────────────
  savedJobIds: string[];  // persisted between sessions via AsyncStorage/SecureStore

  // ── Actions ───────────────────────────────────────────────────────────
  setFabric: (uri: string, uploadId: string, previewUrl: string) => void;
  setCategory: (category: FashionCategory) => void;
  setStyleNotes: (notes: string) => void;
  setActiveJob: (jobId: string, job?: GenerationJob) => void;
  updateActiveJob: (job: GenerationJob) => void;
  clearActiveJob: () => void;
  resetUploadFlow: () => void;
  addSavedJobId: (jobId: string) => void;
}

export const useAIGenerationStore = create<AIGenerationState>((set) => ({
  fabricUri: null,
  fabricUploadId: null,
  fabricPreviewUrl: null,
  selectedCategory: null,
  styleNotes: '',
  activeJobId: null,
  activeJob: null,
  savedJobIds: [],

  setFabric: (uri, uploadId, previewUrl) =>
    set({ fabricUri: uri, fabricUploadId: uploadId, fabricPreviewUrl: previewUrl }),

  setCategory: (category) => set({ selectedCategory: category }),

  setStyleNotes: (notes) => set({ styleNotes: notes }),

  setActiveJob: (jobId, job) =>
    set({ activeJobId: jobId, activeJob: job ?? null }),

  updateActiveJob: (job) => set({ activeJob: job }),

  clearActiveJob: () => set({ activeJobId: null, activeJob: null }),

  resetUploadFlow: () =>
    set({
      fabricUri: null,
      fabricUploadId: null,
      fabricPreviewUrl: null,
      selectedCategory: null,
      styleNotes: '',
    }),

  addSavedJobId: (jobId) =>
    set((state) => ({
      savedJobIds: state.savedJobIds.includes(jobId)
        ? state.savedJobIds
        : [jobId, ...state.savedJobIds].slice(0, 50), // keep last 50
    })),
}));
